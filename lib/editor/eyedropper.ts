/**
 * Wave 11B canvas eyedropper — read one pixel color from a rendered page PNG.
 *
 * The page PNG is served cross-origin (the backend), so drawing an <img> of it
 * to a <canvas> would taint the canvas and make getImageData throw. We instead
 * fetch the bytes (with credentials) → ImageBitmap → canvas, which is NOT
 * tainted. Bitmaps are cached per URL (the URL carries ?v=renderVersion, so a
 * re-render naturally busts the cache).
 *
 * `fx`/`fy` are fractions in [0,1] across the page, so the caller never needs to
 * know the render DPI.
 */

const cache = new Map<string, Promise<ImageBitmap>>();

function bitmapFor(url: string): Promise<ImageBitmap> {
  let p = cache.get(url);
  if (!p) {
    p = fetch(url, { credentials: "include" })
      .then((r) => {
        if (!r.ok) throw new Error(`page fetch failed (${r.status})`);
        return r.blob();
      })
      .then((b) => createImageBitmap(b));
    cache.set(url, p);
  }
  return p;
}

export function rgbToHex(r: number, g: number, b: number): string {
  const h = (v: number) => Math.max(0, Math.min(255, v)).toString(16).padStart(2, "0");
  return `#${h(r)}${h(g)}${h(b)}`;
}

/** Sample the pixel at fractional position (fx, fy) of the page PNG → "#rrggbb". */
export async function samplePagePixel(url: string, fx: number, fy: number): Promise<string> {
  const bmp = await bitmapFor(url);
  const x = Math.max(0, Math.min(bmp.width - 1, Math.round(fx * bmp.width)));
  const y = Math.max(0, Math.min(bmp.height - 1, Math.round(fy * bmp.height)));
  const canvas = document.createElement("canvas");
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext("2d", { willReadFrequently: true });
  if (!ctx) throw new Error("no 2d context");
  ctx.drawImage(bmp, x, y, 1, 1, 0, 0, 1, 1);
  const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data;
  return rgbToHex(r, g, b);
}
