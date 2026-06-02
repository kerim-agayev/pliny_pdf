import JSZip from "jszip";
import { getPdfjs } from "./pdfjs";
import { pdfToJpgsCore, domCanvasEnv } from "./raster-core";
import { pdfToJpgsInWorker } from "@/lib/workers/pdfWorkerClient";
import { baseName } from "@/lib/format";

/** Render each PDF page to a JPG. Multiple pages are bundled into a .zip.
 * Wave 3G-3: rendering runs off the main thread in a Web Worker (OffscreenCanvas)
 * when available, falling back to the main thread on any failure. Zipping stays here. */
export async function pdfToJpg(file: File, quality = 0.92, scale = 2) {
  const buf = await file.arrayBuffer();
  const name = baseName(file.name);
  const opts = { scale, quality };

  let bytes: Uint8Array[];
  try {
    const { images } = await pdfToJpgsInWorker(buf.slice(0), opts);
    bytes = images.map((ab) => new Uint8Array(ab));
  } catch {
    const pdfjs = await getPdfjs();
    bytes = await pdfToJpgsCore(pdfjs, domCanvasEnv(), buf, opts);
  }

  const images = bytes.map((u) => new Blob([u as BlobPart], { type: "image/jpeg" }));

  if (images.length === 1) {
    return { blob: images[0], isZip: false, count: 1, filename: `${name}.jpg` };
  }
  const zip = new JSZip();
  images.forEach((b, idx) => zip.file(`${name}-${String(idx + 1).padStart(3, "0")}.jpg`, b));
  const blob = await zip.generateAsync({ type: "blob" });
  return { blob, isZip: true, count: images.length, filename: `${name}-images.zip` };
}
