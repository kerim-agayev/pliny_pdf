import JSZip from "jszip";
import { getPdfjs } from "./pdfjs";
import { baseName } from "@/lib/format";

/** Render each PDF page to a JPG. Multiple pages are bundled into a .zip. */
export async function pdfToJpg(file: File, quality = 0.92, scale = 2) {
  const pdfjs = await getPdfjs();
  const doc = await pdfjs.getDocument({ data: await file.arrayBuffer() }).promise;
  const name = baseName(file.name);
  const images: Blob[] = [];

  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unavailable");
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    const blob: Blob = await new Promise((resolve, reject) =>
      canvas.toBlob((b) => (b ? resolve(b) : reject(new Error("encode failed"))), "image/jpeg", quality),
    );
    images.push(blob);
  }

  if (images.length === 1) {
    return { blob: images[0], isZip: false, count: 1, filename: `${name}.jpg` };
  }
  const zip = new JSZip();
  images.forEach((b, idx) => zip.file(`${name}-${String(idx + 1).padStart(3, "0")}.jpg`, b));
  const blob = await zip.generateAsync({ type: "blob" });
  return { blob, isZip: true, count: images.length, filename: `${name}-images.zip` };
}
