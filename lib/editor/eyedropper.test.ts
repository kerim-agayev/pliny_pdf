// Runnable check for the only non-trivial pure logic in the eyedropper
// (rgbToHex). The fetch→ImageBitmap→canvas path is DOM glue verified manually
// in GATE 11B (click-sample a known-color region). Run with `bun test`.
import { expect, test } from "bun:test";
import { rgbToHex } from "./eyedropper";

test("rgbToHex pads, lowercases, and clamps", () => {
  expect(rgbToHex(255, 255, 255)).toBe("#ffffff");
  expect(rgbToHex(0, 0, 0)).toBe("#000000");
  expect(rgbToHex(15, 171, 5)).toBe("#0fab05"); // single-digit channels padded
  expect(rgbToHex(300, -4, 128)).toBe("#ff0080"); // out-of-range clamped to 0..255
});
