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


def _spans(page, page_num):
    """Yield (block_id, span_dict) for every text span on a page, in order."""
    data = page.get_text("dict")
    for bi, block in enumerate(data.get("blocks", [])):
        if block.get("type", 0) != 0:  # 0 = text, 1 = image
            continue
        for li, line in enumerate(block.get("lines", [])):
            for si, span in enumerate(line.get("spans", [])):
                yield f"{page_num}-{bi}-{li}-{si}", span


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
    return [_block_json(bid, span) for bid, span in _spans(page, page_num)]


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
    """Insert text honoring color/size; pick base-14 or embedded Noto by script."""
    rgb = _hex_to_rgb01(color) if isinstance(color, str) else (color or (0.0, 0.0, 0.0))
    size = font_size or 11
    if _needs_unicode(text):
        fontfile = NOTO_BOLD if bold else NOTO_REGULAR
        page.insert_text(
            point, text, fontsize=size,
            fontname=("notob" if bold else "noto"), fontfile=fontfile, color=rgb,
        )
    else:
        page.insert_text(
            point, text, fontsize=size,
            fontname=_base14_code(font_name, bold, italic), color=rgb,
        )


def _redact_rect(page, rect):
    """White-out a rectangle: redaction removes underlying text/marks cleanly."""
    page.add_redact_annot(rect, fill=(1, 1, 1))
    page.apply_redactions()


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
    """blockId → {page, bbox, origin, size, font, flags} from the pristine PDF."""
    geo = {}
    doc = pymupdf.open(original_pdf)
    try:
        for page_num, page in enumerate(doc):
            for block_id, span in _spans(page, page_num):
                geo[block_id] = {
                    "page": page_num,
                    "bbox": list(span["bbox"]),
                    "origin": list(span.get("origin", span["bbox"][:2])),
                    "size": span.get("size", 11),
                    "font": span.get("font", ""),
                    "flags": span.get("flags", 0),
                }
    finally:
        doc.close()
    return geo


def _apply_edit(doc, geo, change, affected):
    g = geo.get(change.get("blockId"))
    if not g:
        return
    page = doc[g["page"]]
    affected.add(g["page"])
    _redact_rect(page, pymupdf.Rect(g["bbox"]))
    if change.get("deleted"):
        return
    bold = change.get("bold", bool(g["flags"] & FLAG_BOLD))
    italic = change.get("italic", bool(g["flags"] & FLAG_ITALIC))
    _insert_text(
        page,
        pymupdf.Point(g["origin"]),
        change.get("text", ""),
        change.get("fontSize", g["size"]),
        change.get("fontName", g["font"]),
        change.get("color", "#000000"),
        bold,
        italic,
    )


def _apply_add_text(doc, change, affected):
    page_num = change.get("pageNum", 0)
    if page_num < 0 or page_num >= doc.page_count:
        return
    page = doc[page_num]
    affected.add(page_num)
    _insert_text(
        page,
        pymupdf.Point(change.get("x", 0), change.get("y", 0)),
        change.get("text", ""),
        change.get("fontSize", 12),
        change.get("fontName", "Helvetica"),
        change.get("color", "#000000"),
        change.get("bold", False),
        change.get("italic", False),
    )


def _apply_whiteout(doc, change, affected):
    page_num = change.get("pageNum", 0)
    if page_num < 0 or page_num >= doc.page_count:
        return
    page = doc[page_num]
    affected.add(page_num)
    x, y = change.get("x", 0), change.get("y", 0)
    w, h = change.get("w", 0), change.get("h", 0)
    _redact_rect(page, pymupdf.Rect(x, y, x + w, y + h))


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
    page.draw_line(pymupdf.Point(x, mid), pymupdf.Point(x + w, mid), color=rgb, width=2)


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
    if shape == "rectangle":
        page.draw_rect(pymupdf.Rect(x, y, x + w, y + h), color=rgb, width=width)
    elif shape == "circle":
        page.draw_oval(pymupdf.Rect(x, y, x + w, y + h), color=rgb, width=width)
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
        annot.update()
    except Exception:
        pass


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
    affected = set()
    last_replacements = 0
    # NB: stdout carries the JSON result — all diagnostics MUST go to stderr.
    sys.stderr.write(
        "[pdf-editor] apply: %d change(s): %r\n" % (len(changes), [c.get("type") for c in changes])
    )
    try:
        for change in changes:
            ctype = change.get("type")
            if ctype == "edit":
                _apply_edit(doc, geo, change, affected)
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
        doc.save(working, garbage=3, deflate=True)
        # Re-render only the pages the change set touched.
        for page_num in sorted(affected):
            _render_page(doc[page_num], session_dir, page_num)
        out = _doc_json(doc, session_dir, render=False)
    finally:
        doc.close()
    out["replacements"] = last_replacements
    print(json.dumps(out))


def main(argv):
    if len(argv) < 2:
        sys.stderr.write("usage: pdf-editor.py <parse|apply> ...\n")
        return 2
    cmd = argv[1]
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
