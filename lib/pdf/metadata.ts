import { PDFDocument } from "pdf-lib";

export interface PdfMeta {
  title: string;
  author: string;
  subject: string;
  keywords: string;
  creator: string;
  producer: string;
}

export const META_FIELDS: (keyof PdfMeta)[] = ["title", "author", "subject", "keywords", "creator", "producer"];

export async function readMetadata(file: File): Promise<PdfMeta> {
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  return {
    title: doc.getTitle() ?? "",
    author: doc.getAuthor() ?? "",
    subject: doc.getSubject() ?? "",
    keywords: doc.getKeywords() ?? "",
    creator: doc.getCreator() ?? "",
    producer: doc.getProducer() ?? "",
  };
}

export async function setMetadata(file: File, meta: PdfMeta): Promise<Blob> {
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  doc.setTitle(meta.title);
  doc.setAuthor(meta.author);
  doc.setSubject(meta.subject);
  doc.setKeywords(meta.keywords ? meta.keywords.split(",").map((s) => s.trim()).filter(Boolean) : []);
  doc.setCreator(meta.creator);
  doc.setProducer(meta.producer);
  const data = await doc.save();
  return new Blob([data as BlobPart], { type: "application/pdf" });
}

/** Strip all document-info metadata, returning a clean copy. */
export async function removeMetadata(file: File): Promise<Blob> {
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  doc.setTitle("");
  doc.setAuthor("");
  doc.setSubject("");
  doc.setKeywords([]);
  doc.setCreator("");
  doc.setProducer("");
  const epoch = new Date(0);
  doc.setCreationDate(epoch);
  doc.setModificationDate(epoch);
  const data = await doc.save();
  return new Blob([data as BlobPart], { type: "application/pdf" });
}
