#!/usr/bin/env python3
"""PlinyPDF — real PDF editor engine (Phase 4, Wave 4A).

Single-file CLI called from the Bun backend via execFile (see editor.ts). No
server, no framework — JSON in / JSON or files out, the same shape as the
ocrmypdf service. PyMuPDF (pymupdf / MuPDF) does parse + render + edit.

Subcommands
-----------
parse <input.pdf> <session-dir>
    Render every page to <session-dir>/page-<n>.png at 150 DPI and print a JSON
    document: { pageCount, pages: [{ pageNum, width, height, textBlocks }] }.

apply <session-dir>
    Rebuild <session-dir>/working.pdf by replaying <session-dir>/changes.json
    against the pristine <session-dir>/original.pdf, re-render the affected page
    PNGs, and print JSON: { pageCount, pages, replacements }.

All coordinates are PDF points (origin top-left). PNGs render at RENDER_DPI, so
PNG_pixels = points * RENDER_DPI / 72.
"""

import json
import math
import os
import sys

import pymupdf  # MuPDF bindings (a.k.a. fitz)

RENDER_DPI = 150

# Noto Sans (shipped since Phase 2) — used when text isn't Latin-1 encodable
# (Turkish/Russian), since the base-14 fonts can't render those glyphs.
_FONTS_DIR = os.path.join(
    os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))),
    "public",
    "fonts",
)
NOTO_REGULAR = os.path.join(_FONTS_DIR, "NotoSans-Regular.ttf")
NOTO_BOLD = os.path.join(_FONTS_DIR, "NotoSans-Bold.ttf")
NOTO_SERIF_REGULAR = os.path.join(_FONTS_DIR, "NotoSerif-Regular.ttf")
NOTO_SERIF_BOLD = os.path.join(_FONTS_DIR, "NotoSerif-Bold.ttf")
NOTO_MONO_REGULAR = os.path.join(_FONTS_DIR, "NotoSansMono-Regular.ttf")

# get_text() span flag bits we care about.
FLAG_ITALIC = 1 << 1
FLAG_BOLD = 1 << 4

# Base-14 font codes by family → (regular, bold, italic, bold-italic).
# NB: Times-Roman's code is "tiro", NOT "times" — the latter isn't a Base-14 name and
# makes insert_text demand a fontfile ("need font file or buffer").
_BASE14 = {
    "helv": ("helv", "hebo", "heit", "hebi"),
    "times": ("tiro", "tibo", "tiit", "tibi"),
    "cour": ("cour", "cobo", "coit", "cobi"),
}


def _family(font_name):
    n = (font_name or "").lower()
    if "times" in n or "serif" in n or "roman" in n or "georgia" in n:
        return "times"
    if "cour" in n or "mono" in n or "consol" in n:
        return "cour"
    return "helv"


def _base14_code(font_name, bold, italic):
    reg, bd, it, bdit = _BASE14[_family(font_name)]
    if bold and italic:
        return bdit
    if bold:
        return bd
    if italic:
        return it
    return reg


def _needs_unicode(text):
    try:
        text.encode("latin-1")
        return False
    except (UnicodeEncodeError, AttributeError):
        return True


def _is_explicit_noto(font_name):
    """True when the user explicitly chose a Noto font family."""
    return (font_name or "").lower().startswith("noto")


def _hex_to_rgb01(hex_color):
    """'#rrggbb' (or 'rrggbb') → (r, g, b) floats in 0..1. Defaults to black."""
    if not hex_color:
        return (0.0, 0.0, 0.0)
    h = hex_color.lstrip("#")
    if len(h) != 6:
        return (0.0, 0.0, 0.0)
    try:
        r = int(h[0:2], 16) / 255.0
        g = int(h[2:4], 16) / 255.0
        b = int(h[4:6], 16) / 255.0
        return (r, g, b)
    except ValueError:
        return (0.0, 0.0, 0.0)


def _int_color_to_hex(c):
    """get_text() span color is a packed sRGB int → '#rrggbb'."""
    try:
        rgb = pymupdf.sRGB_to_rgb(c)  # (r, g, b) ints 0..255
        return "#{:02x}{:02x}{:02x}".format(*rgb)
    except Exception:
        return "#000000"


def _lines(page, page_num):
    """Yield (block_id, unit) per text LINE — all spans on a line merged into one editable
    unit. PyMuPDF splits a line into font-RUN spans, not words (e.g. 'Hesabın rekvizitləri'
    → 'Hesab' + 'ın rekvizitləri'), so a per-span block let a delete leave a baked fragment
    (Wave 11B GATE). The merged unit exposes the same keys _block_json / _build_geometry_map
    read off a span; size/font/color/flags/origin come from the first span. Whitespace-only
    lines are skipped (drops stray ' ' mini-blocks)."""
    data = page.get_text("dict")
    for bi, block in enumerate(data.get("blocks", [])):
        if block.get("type", 0) != 0:  # 0 = text, 1 = image
            continue
        for li, line in enumerate(block.get("lines", [])):
            spans = line.get("spans", [])
            text = "".join(s.get("text", "") for s in spans)
            if not text.strip():
                continue  # whitespace-only line — nothing editable
            first = spans[0]
            yield f"{page_num}-{bi}-{li}", {
                "bbox": (
                    min(s["bbox"][0] for s in spans),
                    min(s["bbox"][1] for s in spans),
                    max(s["bbox"][2] for s in spans),
                    max(s["bbox"][3] for s in spans),
                ),
                "size": first.get("size", 11),
                "font": first.get("font", ""),
                "color": first.get("color", 0),
                "flags": first.get("flags", 0),
                "text": text,
                "origin": first.get("origin", (first["bbox"][0], first["bbox"][1])),
            }


def _block_json(block_id, span):
    x0, y0, x1, y1 = span["bbox"]
    flags = span.get("flags", 0)
    return {
        "blockId": block_id,
        "x": round(x0, 2),
        "y": round(y0, 2),
        "w": round(x1 - x0, 2),
        "h": round(y1 - y0, 2),
        "text": span.get("text", ""),
        "fontSize": round(span.get("size", 0), 2),
        "fontName": span.get("font", ""),
        "color": _int_color_to_hex(span.get("color", 0)),
        "bold": bool(flags & FLAG_BOLD),
        "italic": bool(flags & FLAG_ITALIC),
    }


def _page_blocks(page, page_num):
    blocks = []
    for bid, span in _lines(page, page_num):
        blk = _block_json(bid, span)
        # Wave 11A: sampled page background behind this block, so the live editor
        # mask matches the saved-PDF redaction fill (same _sample_bg_color). None
        # → frontend keeps a white mask (unchanged behavior).
        rgb = _sample_bg_color(page, pymupdf.Rect(span["bbox"]))
        blk["bgColor"] = (
            "#{:02x}{:02x}{:02x}".format(round(rgb[0] * 255), round(rgb[1] * 255), round(rgb[2] * 255))
            if rgb else None
        )
        blocks.append(blk)
    return blocks


def _render_page(page, session_dir, page_num):
    pix = page.get_pixmap(dpi=RENDER_DPI)
    pix.save(os.path.join(session_dir, f"page-{page_num + 1}.png"))


def _doc_json(doc, session_dir, render=True):
    pages = []
    for page_num, page in enumerate(doc):
        if render:
            _render_page(page, session_dir, page_num)
        pages.append(
            {
                "pageNum": page_num,
                "width": round(page.rect.width, 2),
                "height": round(page.rect.height, 2),
                "textBlocks": _page_blocks(page, page_num),
            }
        )
    return {"pageCount": doc.page_count, "pages": pages}


def _insert_text(page, point, text, font_size, font_name, color, bold, italic):
    """Insert text honoring color/size; pick base-14 or embedded Noto by font/script."""
    rgb = _hex_to_rgb01(color) if isinstance(color, str) else (color or (0.0, 0.0, 0.0))
    size = font_size or 11
    n = (font_name or "").lower()
    if _is_explicit_noto(font_name) or _needs_unicode(text):
        # Route to the correct Noto TTF based on the font family.
        if "mono" in n:
            fontfile = NOTO_MONO_REGULAR
            fontcode = "notomono"
        elif "serif" in n:
            fontfile = NOTO_SERIF_BOLD if bold else NOTO_SERIF_REGULAR
            fontcode = "notseb" if bold else "notser"
        else:
            # Noto Sans (default) + unicode auto-fallback
            fontfile = NOTO_BOLD if bold else NOTO_REGULAR
            fontcode = "notob" if bold else "noto"
        # No italic TTF on disk, so synthesize oblique by shearing the glyphs to the
        # right around the insertion point (matches the base-14 oblique slant).
        morph = (point, pymupdf.Matrix(1, 0, 0.25, 1, 0, 0)) if italic else None
        page.insert_text(
            point, text, fontsize=size,
            fontname=fontcode, fontfile=fontfile, color=rgb, morph=morph,
        )
    else:
        page.insert_text(
            point, text, fontsize=size,
            fontname=_base14_code(font_name, bold, italic), color=rgb,
        )


def _text_width(text, font_size, font_name, bold, italic):
    """Rendered width of `text` in the font _insert_text would pick (so the manual
    bg highlight matches the drawn text, incl. AZ/Cyrillic via the Noto TTFs).
    Returns points, or None if measuring fails (caller falls back to the bbox)."""
    n = (font_name or "").lower()
    try:
        if _is_explicit_noto(font_name) or _needs_unicode(text):
            if "mono" in n:
                f = pymupdf.Font(fontfile=NOTO_MONO_REGULAR)
            elif "serif" in n:
                f = pymupdf.Font(fontfile=NOTO_SERIF_BOLD if bold else NOTO_SERIF_REGULAR)
            else:
                f = pymupdf.Font(fontfile=NOTO_BOLD if bold else NOTO_REGULAR)
        else:
            f = pymupdf.Font(_base14_code(font_name, bold, italic))
        return f.text_length(text, fontsize=font_size or 11)
    except Exception:
        return None


def _draw_underline(page, point, width, font_size, color):
    """Draw an underline just below the baseline at `point`, spanning `width` points."""
    rgb = _hex_to_rgb01(color) if isinstance(color, str) else (color or (0.0, 0.0, 0.0))
    size = font_size or 11
    uy = point.y + size * 0.12
    page.draw_line(
        pymupdf.Point(point.x, uy),
        pymupdf.Point(point.x + width, uy),
        color=rgb,
        width=max(0.5, size * 0.06),
    )


def _redact_fill(page, sample_doc, page_no, bbox):
    """The fill that should replace removed text in `bbox`: the sampled page bg
    (Wave 11A) so the patch blends into colored rows, white if sampling bails."""
    if sample_doc is not None:
        return _sample_bg_color(sample_doc[page_no], bbox) or (1, 1, 1)
    return (1, 1, 1)


# Wave 11A — background sampling. dpi=72 → 1 pixel = 1 PDF point, so point→pixel
# mapping is identity (just subtract the clip origin).
_SAMPLE_PAD = 4.0      # points of background framing the glyph bbox to sample
_SAMPLE_TOL = 24       # per-channel distance (0-255) counted as "different"
_SAMPLE_MAX_DIFF = 0.25  # >25% of frame pixels differing → not a flat color


def _sample_bg_color(page, rect):
    """Median background RGB (0-1 floats) framing `rect`, or None when the area
    isn't a flat color (gradient / image / border / watermark) so the caller can
    fall back to white. Samples only the band *outside* the glyph bbox so the
    text itself never skews the color.

    # ponytail: flat-median over a thin frame at 72dpi. Catches the common solid
    # row/cell case; gradient/per-region fills are a Wave 11B/11C upgrade.
    """
    # Rotated pages: the bbox→pixel mapping isn't reliable here (Wave 11D). Bail
    # to white so we never make a rotated page worse than today.
    if page.rotation:
        return None
    outer = pymupdf.Rect(
        rect.x0 - _SAMPLE_PAD, rect.y0 - _SAMPLE_PAD,
        rect.x1 + _SAMPLE_PAD, rect.y1 + _SAMPLE_PAD,
    )
    outer &= page.rect
    if outer.is_empty or outer.width < 1 or outer.height < 1:
        return None
    pix = page.get_pixmap(clip=outer, dpi=72)
    if pix.n < 3:
        return None
    # Inner glyph rect in pixmap-local pixel coords (dpi=72 → scale 1).
    ix0, iy0 = rect.x0 - outer.x0, rect.y0 - outer.y0
    ix1, iy1 = rect.x1 - outer.x0, rect.y1 - outer.y0
    samples, n, w = pix.samples, pix.n, pix.width
    rs, gs, bs = [], [], []
    for py in range(pix.height):
        inside_y = iy0 <= py <= iy1
        for px in range(w):
            if inside_y and ix0 <= px <= ix1:
                continue  # glyph area — skip
            off = (py * w + px) * n
            rs.append(samples[off])
            gs.append(samples[off + 1])
            bs.append(samples[off + 2])
    count = len(rs)
    if count < 8:  # too few background pixels to trust
        return None
    # Median per channel (sort copies — rs/gs/bs stay pixel-aligned for the diff).
    mid = count // 2
    mr, mg, mb = sorted(rs)[mid], sorted(gs)[mid], sorted(bs)[mid]
    # Variance check: fraction of frame pixels far from the median. A few
    # antialiased glyph edges leak in as a small minority (median absorbs them);
    # a real gradient/image makes most pixels differ → fall back to white.
    diff = sum(
        1 for i in range(count)
        if max(abs(rs[i] - mr), abs(gs[i] - mg), abs(bs[i] - mb)) > _SAMPLE_TOL
    )
    if diff / count > _SAMPLE_MAX_DIFF:
        return None
    return (mr / 255.0, mg / 255.0, mb / 255.0)


# ── parse ──────────────────────────────────────────────────────────────────
def cmd_parse(input_pdf, session_dir):
    os.makedirs(session_dir, exist_ok=True)
    doc = pymupdf.open(input_pdf)
    # Encrypted PDFs can't be parsed/rendered until unlocked. Signal the caller so
    # it can prompt for a password rather than reporting a generic open failure.
    if doc.needs_pass:
        doc.close()
        print(json.dumps({"error": "passwordRequired"}))
        return
    try:
        out = _doc_json(doc, session_dir, render=True)
    finally:
        doc.close()
    out["scanned"] = all(len(p["textBlocks"]) == 0 for p in out["pages"])
    print(json.dumps(out))


# ── apply ──────────────────────────────────────────────────────────────────
def _build_geometry_map(original_pdf):
    """blockId → {page, bbox, origin, size, font, flags, text, baseline_offset} from the pristine PDF."""
    geo = {}
    doc = pymupdf.open(original_pdf)
    try:
        for page_num, page in enumerate(doc):
            for block_id, span in _lines(page, page_num):
                origin = list(span.get("origin", span["bbox"][:2]))
                geo[block_id] = {
                    "page": page_num,
                    "bbox": list(span["bbox"]),
                    "origin": origin,
                    "size": span.get("size", 11),
                    "font": span.get("font", ""),
                    "color": span.get("color", 0),  # packed int — original text color (Wave 11C)
                    "flags": span.get("flags", 0),
                    "text": span.get("text", ""),
                    # distance from bbox top to text baseline (used for move y-coord conversion)
                    "baseline_offset": origin[1] - span["bbox"][1],
                }
    finally:
        doc.close()
    return geo


# Wave 11B round-8: edits are applied in TWO passes (see cmd_apply) so that ALL
# redactions land before ANY draw. PyMuPDF's apply_redactions() clears every mark
# inside a redaction rect, so a block moved onto another (moved) block's ORIGINAL
# bbox used to be erased by that block's redaction running after the draw. Split:
# _redact_edit only queues the redaction; _draw_edit paints bg + text afterward.
def _redact_edit(doc, geo, change, affected, sample_doc=None):
    """Pass 1: queue the redaction of the block's ORIGINAL bbox (removes the old
    baked text). Does NOT call apply_redactions — cmd_apply applies them in one
    batch per page, before any draw."""
    g = geo.get(change.get("blockId"))
    if not g:
        return
    affected.add(g["page"])
    bbox = pymupdf.Rect(g["bbox"])
    # Wave 11B round-4: removing the old text always restores the *sampled* page
    # background (11A) — never the manual bgColor — so shortening text leaves the
    # emptied area as the page bg, not a smear of the manual color. None → white.
    fill = _redact_fill(doc[g["page"]], sample_doc, g["page"], bbox)
    doc[g["page"]].add_redact_annot(bbox, fill=fill)


def _draw_edit(doc, geo, change, affected):
    """Pass 2: draw the manual bg + insert the new text at the new position. Runs
    after all edit redactions are applied, so it can never be erased."""
    g = geo.get(change.get("blockId"))
    if not g:
        return
    if change.get("deleted"):
        return
    page = doc[g["page"]]
    bbox = pymupdf.Rect(g["bbox"])
    bold = change.get("bold", bool(g["flags"] & FLAG_BOLD))
    italic = change.get("italic", bool(g["flags"] & FLAG_ITALIC))
    # Position override for move: BlockChange.y is top-left y; convert to baseline.
    x_override = change.get("x")
    y_override = change.get("y")
    if x_override is not None and y_override is not None:
        baseline_y = y_override + g.get("baseline_offset", 0)
        insert_point = pymupdf.Point(x_override, baseline_y)
    else:
        insert_point = pymupdf.Point(g["origin"])
    # Use original text as fallback so bold/italic-only changes don't erase text.
    text = change.get("text") or g.get("text", "")
    size = change.get("fontSize", g["size"])
    font_name = change.get("fontName", g["font"])
    # Wave 11C: preserve the original text color by default. A plain retype sends no
    # color (only the toolbar color picker does), so falling back to hard black turned
    # gray/colored labels black on save. change.color (explicit override) still wins.
    color = change.get("color") or _int_color_to_hex(g.get("color", 0))
    # Wave 11B round-4: a manual bgColor is a highlight behind the CURRENT text,
    # sized to it (NOT the old bbox) — so it tracks shorten/lengthen edits. Drawn
    # after the redaction (page bg) and before the text.
    if change.get("bgColor"):
        m = _hex_to_rgb01(change["bgColor"])
        tw = _text_width(text, size, font_name, bold, italic)
        if tw is None:
            tw = bbox.width
        top = y_override if (x_override is not None and y_override is not None) else g["bbox"][1]
        hrect = pymupdf.Rect(insert_point.x, top, insert_point.x + tw, top + bbox.height)
        page.draw_rect(hrect, color=m, fill=m, width=0)
    _insert_text(
        page,
        insert_point,
        text,
        size,
        font_name,
        color,
        bold,
        italic,
    )
    if change.get("underline"):
        # Use the measured width for re-typed text, else the original bbox width.
        if change.get("text"):
            try:
                uw = pymupdf.get_text_length(text, fontname="helv", fontsize=size)
            except Exception:
                uw = g["bbox"][2] - g["bbox"][0]
        else:
            uw = g["bbox"][2] - g["bbox"][0]
        _draw_underline(page, insert_point, uw, size, color)


def _apply_add_text(doc, change, affected):
    page_num = change.get("pageNum", 0)
    if page_num < 0 or page_num >= doc.page_count:
        return
    page = doc[page_num]
    affected.add(page_num)
    pt = pymupdf.Point(change.get("x", 0), change.get("y", 0))
    size = change.get("fontSize", 12)
    text = change.get("text", "")
    _insert_text(
        page,
        pt,
        text,
        size,
        change.get("fontName", "Helvetica"),
        change.get("color", "#000000"),
        change.get("bold", False),
        change.get("italic", False),
    )
    if change.get("underline"):
        try:
            uw = pymupdf.get_text_length(text, fontname="helv", fontsize=size)
        except Exception:
            uw = size * 0.5 * max(1, len(text))
        _draw_underline(page, pt, uw, size, change.get("color", "#000000"))


def _apply_whiteout(doc, change, affected):
    """Whiteout/blackout: redact (TRUE removal) filled with the chosen color. Wave 6C —
    driven by a client annotation carrying `color`; default white keeps legacy behavior."""
    page_num = change.get("pageNum", 0)
    if page_num < 0 or page_num >= doc.page_count:
        return
    page = doc[page_num]
    affected.add(page_num)
    x, y = change.get("x", 0), change.get("y", 0)
    w, h = change.get("w", 0), change.get("h", 0)
    rect = pymupdf.Rect(x, y, x + w, y + h)
    fill = _hex_to_rgb01(change.get("color") or "#FFFFFF")
    page.add_redact_annot(rect, fill=fill)
    page.apply_redactions()


def _apply_link(doc, change, affected):
    """Insert a URI hyperlink over a rect + draw a blue underline so the link is visually
    obvious in the saved PDF (Wave 6C). Run in a second pass after all redactions so an
    overlapping whiteout's apply_redactions can't strip it."""
    page = _annot_page(doc, change, affected)
    if page is None:
        return
    uri = change.get("uri") or ""
    if not uri:
        return
    x, y = change.get("x", 0), change.get("y", 0)
    w, h = change.get("w", 0), change.get("h", 0)
    try:
        page.insert_link({"kind": pymupdf.LINK_URI, "from": pymupdf.Rect(x, y, x + w, y + h), "uri": uri})
        # Standard hyperlink look: a blue underline under the linked text rect.
        page.draw_line(pymupdf.Point(x, y + h), pymupdf.Point(x + w, y + h), color=(0.15, 0.39, 0.92), width=1)
    except Exception as e:
        sys.stderr.write(f"[pdf-editor] insert_link error: {e}\n")


def _matches_constraints(page, rect, change):
    """Best-effort caseSensitive / wholeWord filtering on a search hit."""
    find = change.get("find", "")
    if change.get("caseSensitive"):
        if page.get_textbox(rect).strip() != find:
            return False
    if change.get("wholeWord"):
        probe = pymupdf.Rect(rect.x0 - 2, rect.y0, rect.x1 + 2, rect.y1)
        around = page.get_textbox(probe).strip()
        # A bare hit surrounded by extra word chars isn't a whole word.
        if len(around) > len(find) and any(c.isalnum() for c in around.replace(find, "")):
            return False
    return True


def _apply_find_replace(doc, change, affected):
    find = change.get("find", "")
    replace = change.get("replace", "")
    count = 0
    if not find:
        return 0
    for page_num, page in enumerate(doc):
        hits = [r for r in page.search_for(find) if _matches_constraints(page, r, change)]
        if not hits:
            continue
        affected.add(page_num)
        size = None
        for rect in hits:
            _redact_rect(page, rect)
        # Re-add replacement text after all redactions on this page are applied.
        for rect in hits:
            fs = max(6, round((rect.y1 - rect.y0) * 0.9, 1))
            _insert_text(page, pymupdf.Point(rect.x0, rect.y1 - 1), replace, fs,
                         "Helvetica", "#000000", False, False)
            count += 1
    return count


# ── annotations (Wave 4C): burn client overlays into the PDF ─────────────────
def _annot_page(doc, change, affected):
    """Resolve + mark the target page for an annotation change, or None if invalid."""
    page_num = change.get("pageNum", 0)
    if page_num < 0 or page_num >= doc.page_count:
        return None
    affected.add(page_num)
    return doc[page_num]


def _apply_highlight(doc, change, affected):
    page = _annot_page(doc, change, affected)
    if page is None:
        return
    x, y = change.get("x", 0), change.get("y", 0)
    w, h = change.get("w", 0), change.get("h", 0)
    rgb = _hex_to_rgb01(change.get("color", "#FACC15"))
    # translucent filled rect — matches the on-screen highlight overlay
    page.draw_rect(pymupdf.Rect(x, y, x + w, y + h), color=None, fill=rgb, fill_opacity=0.35)


def _apply_strike(doc, change, affected):
    page = _annot_page(doc, change, affected)
    if page is None:
        return
    x, y = change.get("x", 0), change.get("y", 0)
    w, h = change.get("w", 0), change.get("h", 0)
    rgb = _hex_to_rgb01(change.get("color", "#F43F5E"))
    mid = y + h / 2.0
    page.draw_line(pymupdf.Point(x, mid), pymupdf.Point(x + w, mid), color=rgb, width=change.get("strokeWidth", 2))


def _parse_path(path):
    """Parse a 'M x y L x y L …' freehand path (PDF points) into a list of Points."""
    pts = []
    tokens = path.replace("M", " ").replace("L", " ").split()
    for i in range(0, len(tokens) - 1, 2):
        try:
            pts.append(pymupdf.Point(float(tokens[i]), float(tokens[i + 1])))
        except ValueError:
            continue
    return pts


def _apply_draw(doc, change, affected):
    page = _annot_page(doc, change, affected)
    if page is None:
        return
    pts = _parse_path(change.get("path", ""))
    if len(pts) < 2:
        return
    rgb = _hex_to_rgb01(change.get("color", "#000000"))
    width = change.get("strokeWidth") or 2
    page.draw_polyline(pts, color=rgb, width=width)


def _apply_shape(doc, change, affected):
    page = _annot_page(doc, change, affected)
    if page is None:
        return
    x, y = change.get("x", 0), change.get("y", 0)
    w, h = change.get("w", 0), change.get("h", 0)
    rgb = _hex_to_rgb01(change.get("color", "#000000"))
    width = change.get("strokeWidth") or 2
    shape = change.get("shapeType", "rectangle")
    # Optional fill for rect/circle (Wave 6D): fill = stroke color @ 20% opacity, outline 100%.
    fill = rgb if change.get("fill") else None
    if shape == "rectangle":
        page.draw_rect(pymupdf.Rect(x, y, x + w, y + h), color=rgb, width=width, fill=fill, fill_opacity=0.2)
    elif shape == "circle":
        page.draw_oval(pymupdf.Rect(x, y, x + w, y + h), color=rgb, width=width, fill=fill, fill_opacity=0.2)
    else:  # line / arrow — use the true start→end points
        x2 = change.get("x2", x + w)
        y2 = change.get("y2", y + h)
        end = pymupdf.Point(x2, y2)
        page.draw_line(pymupdf.Point(x, y), end, color=rgb, width=width)
        if shape == "arrow":
            ang = math.atan2(y2 - y, x2 - x)
            head = max(9, width * 3)
            for off in (ang + math.pi - 0.5, ang + math.pi + 0.5):
                barb = pymupdf.Point(x2 + head * math.cos(off), y2 + head * math.sin(off))
                page.draw_line(end, barb, color=rgb, width=width)


def _apply_comment(doc, change, affected):
    page = _annot_page(doc, change, affected)
    if page is None:
        return
    point = pymupdf.Point(change.get("x", 0), change.get("y", 0))
    annot = page.add_text_annot(point, change.get("text") or "")
    try:
        annot.set_info(title="You")
        # Burn the chosen sticky-note color (Wave 6D); default amber matches the UI.
        annot.set_colors(stroke=_hex_to_rgb01(change.get("color") or "#FBBF24"))
        annot.update()
    except Exception:
        pass


def _apply_mark(doc, change, affected):
    """Quick-mark glyph (Wave 6D): checkmark / cross / circle, drawn to fit (x,y,w,h)."""
    page = _annot_page(doc, change, affected)
    if page is None:
        return
    x, y = change.get("x", 0), change.get("y", 0)
    w, h = change.get("w", 24), change.get("h", 24)
    rgb = _hex_to_rgb01(change.get("color") or "#16A34A")
    width = max(1.5, min(w, h) * 0.1)
    mark = change.get("markType", "check")
    sys.stderr.write("[mark] type=%s x=%.1f y=%.1f w=%.1f h=%.1f\n" % (mark, x, y, w, h))
    if mark == "circle":
        page.draw_oval(pymupdf.Rect(x, y, x + w, y + h), color=rgb, width=width)
    elif mark == "cross":
        pad = min(w, h) * 0.15
        page.draw_line(pymupdf.Point(x + pad, y + pad), pymupdf.Point(x + w - pad, y + h - pad), color=rgb, width=width)
        page.draw_line(pymupdf.Point(x + w - pad, y + pad), pymupdf.Point(x + pad, y + h - pad), color=rgb, width=width)
    else:  # check
        page.draw_polyline(
            [
                pymupdf.Point(x + 0.18 * w, y + 0.55 * h),
                pymupdf.Point(x + 0.42 * w, y + 0.80 * h),
                pymupdf.Point(x + 0.85 * w, y + 0.20 * h),
            ],
            color=rgb,
            width=width,
        )


_STAMP_COLORS = {
    "DRAFT": "#EF4444",
    "VOID": "#EF4444",
    "CONFIDENTIAL": "#EF4444",
    "APPROVED": "#10B981",
    "COPY": "#3B82F6",
    "FINAL": "#3B82F6",
    "RECEIVED": "#3B82F6",
    "REVIEWED": "#3B82F6",
}


def _apply_stamp(doc, change, affected):
    page = _annot_page(doc, change, affected)
    if page is None:
        return
    x, y = change.get("x", 0), change.get("y", 0)
    w, h = change.get("w", 160), change.get("h", 50)
    label = (change.get("label") or "DRAFT").strip() or "DRAFT"
    color_hex = change.get("color") or _STAMP_COLORS.get(label, "#3B82F6")
    rgb = _hex_to_rgb01(color_hex)
    rect = pymupdf.Rect(x, y, x + w, y + h)
    page.draw_rect(rect, color=rgb, width=2.5)
    # Size the single-line label to fit the box. insert_textbox renders NOTHING
    # when a long word (e.g. CONFIDENTIAL) is wider than the box, so we measure the
    # exact width with get_text_length, shrink to fit, and place it ourselves with
    # insert_text (which never silently drops) — centered in the rect.
    fontname = "hebo"  # Helvetica-Bold (base-14)
    pad = max(4.0, w * 0.07)
    avail_w = max(1.0, w - 2 * pad)
    try:
        unit = pymupdf.get_text_length(label, fontname=fontname, fontsize=1.0)
    except Exception:
        unit = len(label) * 0.55  # rough fallback
    unit = unit or len(label) * 0.55
    font_size = min(h * 0.6, 40.0)
    if unit * font_size > avail_w:
        font_size = avail_w / unit
    font_size = max(5.0, min(font_size, 40.0))
    text_w = unit * font_size
    tx = x + (w - text_w) / 2.0
    ty = y + h / 2.0 + font_size * 0.35  # baseline ≈ vertical centre
    sys.stderr.write("[stamp] label=%s size=%.1f w=%.1f text_w=%.1f\n" % (label, font_size, w, text_w))
    page.insert_text(pymupdf.Point(tx, ty), label, fontname=fontname, fontsize=font_size, color=rgb)


def _apply_image(doc, change, affected, session_dir):
    page = _annot_page(doc, change, affected)
    if page is None:
        return
    x, y = change.get("x", 0), change.get("y", 0)
    w, h = change.get("w", 150), change.get("h", 150)
    image_id = change.get("imageId", "")
    if not image_id:
        return
    for ext in ("jpg", "jpeg", "png", "gif", "bmp", "webp"):
        path = os.path.join(session_dir, f"img-{image_id}.{ext}")
        if os.path.exists(path):
            try:
                page.insert_image(pymupdf.Rect(x, y, x + w, y + h), filename=path)
            except Exception as e:
                sys.stderr.write(f"[pdf-editor] insert_image error: {e}\n")
            return


def cmd_apply(session_dir):
    original = os.path.join(session_dir, "original.pdf")
    working = os.path.join(session_dir, "working.pdf")
    changes_path = os.path.join(session_dir, "changes.json")

    changes = []
    if os.path.exists(changes_path):
        with open(changes_path, "r", encoding="utf-8") as fh:
            changes = json.load(fh)

    geo = _build_geometry_map(original)
    doc = pymupdf.open(original)
    # Pristine copy used only to sample original backgrounds (Wave 11A), kept
    # untouched while `doc` accumulates redactions.
    sample_doc = pymupdf.open(original)
    affected = set()
    last_replacements = 0
    # NB: stdout carries the JSON result — all diagnostics MUST go to stderr.
    sys.stderr.write(
        "[pdf-editor] apply: %d change(s): %r\n" % (len(changes), [c.get("type") for c in changes])
    )
    try:
        # Wave 11B round-8: edits in two passes — redact ALL original bboxes (one
        # apply_redactions per page) BEFORE drawing ANY edit, so a block moved onto
        # another block's original spot isn't erased by that block's redaction.
        edits = [c for c in changes if c.get("type") == "edit"]
        if edits:
            redact_pages = set()
            for c in edits:
                g = geo.get(c.get("blockId"))
                if g:
                    redact_pages.add(g["page"])
            for c in edits:
                _redact_edit(doc, geo, c, affected, sample_doc)
            for pno in redact_pages:
                doc[pno].apply_redactions()
            for c in edits:
                _draw_edit(doc, geo, c, affected)
        for change in changes:
            ctype = change.get("type")
            if ctype == "edit":
                pass  # handled in the two-pass block above
            elif ctype == "add-text":
                _apply_add_text(doc, change, affected)
            elif ctype == "whiteout":
                _apply_whiteout(doc, change, affected)
            elif ctype == "find-replace":
                last_replacements = _apply_find_replace(doc, change, affected)
            elif ctype == "highlight":
                _apply_highlight(doc, change, affected)
            elif ctype == "strike":
                _apply_strike(doc, change, affected)
            elif ctype == "draw":
                _apply_draw(doc, change, affected)
            elif ctype == "shape":
                _apply_shape(doc, change, affected)
            elif ctype == "comment":
                _apply_comment(doc, change, affected)
            elif ctype == "mark":
                _apply_mark(doc, change, affected)
            elif ctype == "stamp":
                _apply_stamp(doc, change, affected)
            elif ctype == "image":
                _apply_image(doc, change, affected, session_dir)
            # NB: "link" is handled in a second pass below — after all redactions.
        # Second pass: insert links last so a whiteout's apply_redactions (which clears
        # everything inside its rect) can't strip a freshly inserted overlapping link.
        for change in changes:
            if change.get("type") == "link":
                _apply_link(doc, change, affected)
        doc.save(working, garbage=3, deflate=True)
        # Re-render only the pages the change set touched.
        for page_num in sorted(affected):
            _render_page(doc[page_num], session_dir, page_num)
        out = _doc_json(doc, session_dir, render=False)
    finally:
        doc.close()
        sample_doc.close()
    out["replacements"] = last_replacements
    print(json.dumps(out))


def cmd_selftest():
    """Wave 11B never-tofu guard: render AZ/TR/RU glyphs via _insert_text and assert
    they land as real glyphs (not the .notdef tofu box). Locks in the Noto route so a
    future refactor can't silently regress special-character support.
    Run: `python pdf-editor.py selftest`."""
    sample = "Əə Çç Ğğ Şş İıÖö Üü Привет"
    doc = pymupdf.open()
    page = doc.new_page()
    # font_name="Helvetica" deliberately — base-14 can't encode these, so this also
    # verifies _needs_unicode promotes the insert to Noto.
    _insert_text(page, pymupdf.Point(40, 80), sample, 14, "Helvetica", "#000000", False, False)
    # Each visible char must round-trip out of the page text. A glyph that fell back
    # to .notdef (tofu) is NOT recoverable as its codepoint here, so a clean round-trip
    # is the authoritative "no tofu" check.
    extracted = page.get_text()
    missing = [c for c in sample if not c.isspace() and c not in extracted]
    doc.close()
    assert not missing, f"special chars dropped (tofu/missing): {missing!r}"
    sys.stderr.write("[pdf-editor] selftest OK — AZ/TR/RU glyphs render\n")

    # Wave 11B round-8: ordering guard. Block A (red bg) is moved onto block B's
    # ORIGINAL bbox. The two-pass apply (redact A+B, apply_redactions, draw A+B)
    # must leave A's red bg intact — i.e. B's redaction can't erase A's draw. Fails
    # if anyone reverts to per-block apply-after-draw.
    doc = pymupdf.open()
    page = doc.new_page(width=300, height=200)
    page.insert_text(pymupdf.Point(20, 55), "BBBB", fontsize=14)  # B's old baked text
    geo = {
        "A": {"page": 0, "bbox": (20, 150, 80, 170), "origin": (20, 165),
              "size": 14, "font": "Helvetica", "flags": 0, "text": "AAAA", "baseline_offset": 12},
        "B": {"page": 0, "bbox": (20, 40, 90, 60), "origin": (20, 55),
              "size": 14, "font": "Helvetica", "flags": 0, "text": "BBBB", "baseline_offset": 12},
    }
    # A moved up onto B's original row (y≈40) with a red bg; B moved far right.
    chA = {"type": "edit", "blockId": "A", "x": 20, "y": 40, "bgColor": "#ff0000", "text": "AAAA"}
    chB = {"type": "edit", "blockId": "B", "x": 200, "y": 40, "text": "BBBB"}
    aff = set()
    _redact_edit(doc, geo, chA, aff, None)
    _redact_edit(doc, geo, chB, aff, None)
    page.apply_redactions()
    _draw_edit(doc, geo, chA, aff)
    _draw_edit(doc, geo, chB, aff)
    pm = page.get_pixmap(clip=pymupdf.Rect(22, 42, 60, 58))
    red = any(
        pm.pixel(x, y)[0] > 200 and pm.pixel(x, y)[1] < 80 and pm.pixel(x, y)[2] < 80
        for x in range(0, pm.width, 4) for y in range(0, pm.height, 4)
    )
    doc.close()
    assert red, "moved red-bg block was erased by another block's redaction (ordering regressed)"
    sys.stderr.write("[pdf-editor] selftest OK — edit redaction/draw ordering\n")

    # Wave 11C: color-preservation guard. An edit with NO explicit color must keep the
    # block's ORIGINAL color, not fall back to black. Original = gray (0x808080); after a
    # plain-retype edit the drawn glyphs must read gray, never near-black.
    doc = pymupdf.open()
    page = doc.new_page(width=200, height=80)
    geo = {
        "C": {"page": 0, "bbox": (20, 30, 120, 50), "origin": (20, 46),
              "size": 16, "font": "Helvetica", "color": 0x808080, "flags": 0,
              "text": "Gray", "baseline_offset": 16},
    }
    _draw_edit(doc, geo, {"type": "edit", "blockId": "C", "text": "Gray"}, set())
    pm = page.get_pixmap(clip=pymupdf.Rect(20, 30, 120, 50))
    gray = any(
        100 < pm.pixel(x, y)[0] < 180 and 100 < pm.pixel(x, y)[1] < 180 and 100 < pm.pixel(x, y)[2] < 180
        for x in range(0, pm.width, 2) for y in range(0, pm.height, 2)
    )
    doc.close()
    assert gray, "edit without explicit color did not preserve the original gray (regressed to black)"
    sys.stderr.write("[pdf-editor] selftest OK — original text color preserved\n")
    print(json.dumps({"ok": True}))


def main(argv):
    if len(argv) < 2:
        sys.stderr.write("usage: pdf-editor.py <parse|apply|selftest> ...\n")
        return 2
    cmd = argv[1]
    if cmd == "selftest":
        cmd_selftest()
        return 0
    if cmd == "parse":
        if len(argv) != 4:
            sys.stderr.write("usage: pdf-editor.py parse <input.pdf> <session-dir>\n")
            return 2
        cmd_parse(argv[2], argv[3])
        return 0
    if cmd == "apply":
        if len(argv) != 3:
            sys.stderr.write("usage: pdf-editor.py apply <session-dir>\n")
            return 2
        cmd_apply(argv[2])
        return 0
    sys.stderr.write(f"unknown command: {cmd}\n")
    return 2


if __name__ == "__main__":
    sys.exit(main(sys.argv))
