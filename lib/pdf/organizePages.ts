import { PDFDocument, degrees } from "pdf-lib";

/** One page slot in the working document: a source page index + an extra rotation. */
export interface OrganizeItem {
  /** 0-based index into the source PDF. */
  src: number;
  /** extra rotation in degrees (0/90/180/270) added to the page's existing rotation. */
  rot: number;
}

/** Rebuild a PDF from the given ordered items (supports reorder, duplicate, delete, rotate). */
export async function organizePages(file: File, items: OrganizeItem[]): Promise<Blob> {
  const src = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  const out = await PDFDocument.create();
  const copied = await out.copyPages(src, items.map((it) => it.src));
  copied.forEach((page, i) => {
    const delta = ((items[i].rot % 360) + 360) % 360;
    if (delta !== 0) {
      page.setRotation(degrees((page.getRotation().angle + delta) % 360));
    }
    out.addPage(page);
  });
  const data = await out.save();
  return new Blob([data as BlobPart], { type: "application/pdf" });
}
