import { PDFDocument, StandardFonts, degrees, rgb } from "pdf-lib";

export type WatermarkPosition = "center" | "diagonal" | "tile";

export interface WatermarkOptions {
  text: string;
  fontSize: number;
  /** 0..1 */
  opacity: number;
  /** hex color, e.g. #6B5CE7 */
  color: string;
  /** degrees */
  rotation: number;
  position: WatermarkPosition;
}

function hexToRgb(hex: string) {
  const m = hex.replace("#", "");
  const n = parseInt(m.length === 3 ? m.split("").map((c) => c + c).join("") : m, 16);
  return { r: ((n >> 16) & 255) / 255, g: ((n >> 8) & 255) / 255, b: (n & 255) / 255 };
}

/** Stamp text across every page. Runs entirely in-browser. */
export async function applyWatermark(file: File, opts: WatermarkOptions) {
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const font = await doc.embedFont(StandardFonts.HelveticaBold);
  const { r, g, b } = hexToRgb(opts.color);
  const color = rgb(r, g, b);

  for (const page of doc.getPages()) {
    const { width, height } = page.getSize();
    const textWidth = font.widthOfTextAtSize(opts.text, opts.fontSize);

    if (opts.position === "tile") {
      const stepX = Math.max(textWidth + 80, 200);
      const stepY = Math.max(opts.fontSize * 4, 120);
      for (let y = 0; y < height + stepY; y += stepY) {
        for (let x = -textWidth; x < width + stepX; x += stepX) {
          page.drawText(opts.text, {
            x,
            y,
            size: opts.fontSize,
            font,
            color,
            opacity: opts.opacity,
            rotate: degrees(45),
          });
        }
      }
    } else {
      const rot = opts.position === "diagonal" ? 45 : opts.rotation;
      page.drawText(opts.text, {
        x: width / 2 - textWidth / 2,
        y: height / 2 - opts.fontSize / 2,
        size: opts.fontSize,
        font,
        color,
        opacity: opts.opacity,
        rotate: degrees(rot),
      });
    }
  }

  const data = await doc.save();
  return new Blob([data as BlobPart], { type: "application/pdf" });
}
