#!/usr/bin/env python3
"""Wave 11A self-check for _sample_bg_color. Plain asserts, no framework.

Run:  python server/services/test_sample_bg.py
"""
import importlib.util
import os

import pymupdf

_HERE = os.path.dirname(os.path.abspath(__file__))
_spec = importlib.util.spec_from_file_location(
    "pdf_editor", os.path.join(_HERE, "pdf-editor.py")
)
pdf_editor = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(pdf_editor)


def _page(draw):
    doc = pymupdf.open()
    page = doc.new_page(width=300, height=120)
    draw(page)
    return doc, page


def test_solid_gray_matches():
    gray = (0.8, 0.8, 0.8)
    rect = pymupdf.Rect(40, 50, 200, 70)
    doc, page = _page(
        lambda p: (
            p.draw_rect(pymupdf.Rect(0, 40, 300, 80), color=None, fill=gray),
            p.insert_text(pymupdf.Point(45, 65), "ValyutaGFFS", fontsize=12),
        )
    )
    rgb = pdf_editor._sample_bg_color(page, rect)
    doc.close()
    assert rgb is not None, "solid gray should sample, got None"
    assert all(abs(c - 0.8) < 0.06 for c in rgb), f"expected ~gray, got {rgb}"


def test_white_stays_white():
    rect = pymupdf.Rect(40, 50, 200, 70)
    doc, page = _page(
        lambda p: p.insert_text(pymupdf.Point(45, 65), "Hello World", fontsize=12)
    )
    rgb = pdf_editor._sample_bg_color(page, rect)
    doc.close()
    assert rgb is not None and all(c > 0.93 for c in rgb), f"expected ~white, got {rgb}"


def test_gradient_falls_back():
    rect = pymupdf.Rect(40, 50, 260, 70)

    def draw(p):
        # vertical stripes of varying gray = high variance, not a flat color
        for i in range(0, 300, 6):
            shade = (i % 60) / 60.0
            p.draw_rect(pymupdf.Rect(i, 40, i + 6, 80), color=None,
                        fill=(shade, shade, shade))
        p.insert_text(pymupdf.Point(45, 65), "over pattern", fontsize=12)

    doc, page = _page(draw)
    rgb = pdf_editor._sample_bg_color(page, rect)
    doc.close()
    assert rgb is None, f"non-uniform background should fall back (None), got {rgb}"


def test_rotated_falls_back():
    rect = pymupdf.Rect(40, 50, 200, 70)
    doc, page = _page(
        lambda p: p.draw_rect(pymupdf.Rect(0, 40, 300, 80), color=None, fill=(0.8, 0.8, 0.8))
    )
    page.set_rotation(90)
    rgb = pdf_editor._sample_bg_color(page, rect)
    doc.close()
    assert rgb is None, f"rotated page should fall back (None), got {rgb}"


if __name__ == "__main__":
    test_solid_gray_matches()
    test_white_stays_white()
    test_gradient_falls_back()
    test_rotated_falls_back()
    print("OK — _sample_bg_color self-check passed")
