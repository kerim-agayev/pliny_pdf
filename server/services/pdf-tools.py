#!/usr/bin/env python3
"""PlinyPDF — cloud PDF tools engine (Phase 5, Wave 5B).

Single-file CLI called from the Bun backend via execFile (see pdf-tools.ts), the
same pattern as pdf-editor.py / the ocrmypdf service. PyMuPDF (pymupdf / MuPDF)
does the heavy work server-side — far faster than the old in-browser canvas
rasterization for Compress, Grayscale, PDF->JPG, and Merge.

Subcommands
-----------
compress   <input.pdf> <output.pdf> <maxPages>
    Optimize with PyMuPDF (garbage collect + deflate streams/images/fonts). If
    the result is not smaller than the input, write the original bytes instead so
    the file never grows. Print {"pages": N}.

grayscale  <input.pdf> <output.pdf> <maxPages>
    Render every page to a grayscale pixmap at RENDER_DPI and rebuild an image
    PDF (matches the prior tool's image-based behavior, but server-fast). Print
    {"pages": N}.

pdf-to-jpg <input.pdf> <output-dir> <maxPages> <dpi>
    Render each page to a JPEG at <dpi>. 1 page -> <output-dir>/out.jpg; 2+ pages
    -> <output-dir>/out.zip (entries "page-001.jpg" ...). Print
    {"pages": N, "zip": bool}.

merge      <output.pdf> <maxPages> <input1.pdf> [<input2.pdf> ...]
    Concatenate inputs in argument order via insert_pdf. Bounded by file size in
    the route and by <maxPages> total pages here. Print {"pages": total}.

count      <input.pdf>
    Print {"pages": N} — the page count, without writing any output. Used by the
    Office routes (PDF->Word, OCR, Word->PDF output) to enforce a page cap before
    or after the heavy conversion work.

On a page-count overflow every subcommand prints
{"error": "tooManyPages", "pageCount": N} and exits 0 without writing output.
Any unexpected failure prints {"error": "failed", ...} + a traceback to stderr
and exits 1, so the Bun wrapper surfaces a clean 502. The single JSON status line
goes to stdout.
"""

import json
import os
import sys
import traceback
import zipfile

import pymupdf  # MuPDF bindings (a.k.a. fitz)

RENDER_DPI = 150
JPEG_QUALITY = 85


def _too_many(page_count):
    print(json.dumps({"error": "tooManyPages", "pageCount": page_count}))


def _render_jpeg(page, dpi, out_path):
    """Render a page to a JPEG file. Render STRAIGHT to RGB without alpha: letting
    get_pixmap target csRGB makes MuPDF handle any source colorspace (incl. CMYK
    slides) correctly, and alpha=False fills transparent/soft-mask backgrounds
    white instead of flattening to black. pix.save() (format inferred from the
    .jpg extension) is the version-proven encoder — tobytes('jpeg') returned
    EMPTY bytes on PyMuPDF 1.27, which produced 0-byte/blank downloads."""
    pix = page.get_pixmap(dpi=dpi, colorspace=pymupdf.csRGB, alpha=False)
    sys.stderr.write(
        "[pdf-tools] page %s: cs=%s n=%d %dx%d head=%s\n"
        % (
            page.number,
            pix.colorspace.name if pix.colorspace else None,
            pix.n,
            pix.width,
            pix.height,
            bytes(pix.samples[:12]).hex(),
        )
    )
    pix.save(out_path, jpg_quality=JPEG_QUALITY)


def cmd_compress(input_pdf, output_pdf, max_pages):
    doc = pymupdf.open(input_pdf)
    try:
        if doc.page_count > max_pages:
            _too_many(doc.page_count)
            return
        pages = doc.page_count
        # garbage=3 (compact xref + drop unused) is fast and superlinear-free;
        # garbage=4 additionally joins duplicate objects, which is O(n^2)-ish and
        # made 800-page files take minutes. deflate* re-compresses streams.
        doc.save(
            output_pdf,
            garbage=3,
            deflate=True,
            deflate_images=True,
            deflate_fonts=True,
        )
    finally:
        doc.close()
    # Never let the output grow: keep the smaller of original/optimized.
    if os.path.getsize(output_pdf) >= os.path.getsize(input_pdf):
        with open(input_pdf, "rb") as src, open(output_pdf, "wb") as dst:
            dst.write(src.read())
    print(json.dumps({"pages": pages}))


def cmd_grayscale(input_pdf, output_pdf, max_pages):
    src = pymupdf.open(input_pdf)
    try:
        if src.page_count > max_pages:
            _too_many(src.page_count)
            return
        pages = src.page_count
        out = pymupdf.open()
        try:
            for page in src:
                pix = page.get_pixmap(dpi=RENDER_DPI, colorspace=pymupdf.csGRAY, alpha=False)
                rect = page.rect
                dst = out.new_page(width=rect.width, height=rect.height)
                dst.insert_image(dst.rect, pixmap=pix)
            out.save(output_pdf, garbage=3, deflate=True)
        finally:
            out.close()
    finally:
        src.close()
    print(json.dumps({"pages": pages}))


def cmd_pdf_to_jpg(input_pdf, output_dir, max_pages, dpi):
    os.makedirs(output_dir, exist_ok=True)
    doc = pymupdf.open(input_pdf)
    try:
        if doc.page_count > max_pages:
            _too_many(doc.page_count)
            return
        pages = doc.page_count
        if pages == 1:
            out_path = os.path.join(output_dir, "out.jpg")
            _render_jpeg(doc[0], dpi, out_path)
            sys.stderr.write("[pdf-tools] wrote %s size=%d\n" % (out_path, os.path.getsize(out_path)))
            print(json.dumps({"pages": 1, "zip": False}))
            return
        zip_path = os.path.join(output_dir, "out.zip")
        with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zf:
            for i, page in enumerate(doc):
                name = "page-%03d.jpg" % (i + 1)
                jpg_path = os.path.join(output_dir, name)
                _render_jpeg(page, dpi, jpg_path)
                zf.write(jpg_path, name)
                os.remove(jpg_path)
    finally:
        doc.close()
    sys.stderr.write("[pdf-tools] wrote %s size=%d\n" % (zip_path, os.path.getsize(zip_path)))
    print(json.dumps({"pages": pages, "zip": True}))


def cmd_merge(output_pdf, max_pages, inputs):
    out = pymupdf.open()
    srcs = []
    try:
        total = 0
        for path in inputs:
            d = pymupdf.open(path)
            srcs.append(d)
            total += d.page_count
        if total > max_pages:
            _too_many(total)
            return
        for d in srcs:
            out.insert_pdf(d)
        out.save(output_pdf, garbage=3, deflate=True)
    finally:
        for d in srcs:
            d.close()
        out.close()
    print(json.dumps({"pages": total}))


def cmd_count(input_pdf):
    doc = pymupdf.open(input_pdf)
    try:
        pages = doc.page_count
    finally:
        doc.close()
    print(json.dumps({"pages": pages}))


def main(argv):
    if len(argv) < 2:
        sys.stderr.write("usage: pdf-tools.py <compress|grayscale|pdf-to-jpg|merge|count> ...\n")
        return 2
    cmd = argv[1]
    try:
        if cmd == "compress":
            if len(argv) != 5:
                sys.stderr.write("usage: pdf-tools.py compress <input.pdf> <output.pdf> <maxPages>\n")
                return 2
            cmd_compress(argv[2], argv[3], int(argv[4]))
            return 0
        if cmd == "grayscale":
            if len(argv) != 5:
                sys.stderr.write("usage: pdf-tools.py grayscale <input.pdf> <output.pdf> <maxPages>\n")
                return 2
            cmd_grayscale(argv[2], argv[3], int(argv[4]))
            return 0
        if cmd == "pdf-to-jpg":
            if len(argv) != 6:
                sys.stderr.write("usage: pdf-tools.py pdf-to-jpg <input.pdf> <output-dir> <maxPages> <dpi>\n")
                return 2
            cmd_pdf_to_jpg(argv[2], argv[3], int(argv[4]), int(argv[5]))
            return 0
        if cmd == "merge":
            if len(argv) < 5:
                sys.stderr.write("usage: pdf-tools.py merge <output.pdf> <maxPages> <input1.pdf> ...\n")
                return 2
            cmd_merge(argv[2], int(argv[3]), argv[4:])
            return 0
        if cmd == "count":
            if len(argv) != 3:
                sys.stderr.write("usage: pdf-tools.py count <input.pdf>\n")
                return 2
            cmd_count(argv[2])
            return 0
    except Exception as e:  # noqa: BLE001 — surface a clean failure to the Bun wrapper
        sys.stderr.write(
            json.dumps({"error": "failed", "command": cmd, "detail": str(e), "traceback": traceback.format_exc()}) + "\n"
        )
        return 1
    sys.stderr.write("unknown command: %s\n" % cmd)
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
