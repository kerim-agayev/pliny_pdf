import { PDFDocument } from "@cantoo/pdf-lib";

/** Encrypt a PDF with a user password (AES). Runs in-browser via the @cantoo/pdf-lib fork. */
export async function protectPdf(file: File, password: string) {
  const doc = await PDFDocument.load(await file.arrayBuffer(), { ignoreEncryption: true });
  doc.encrypt({ userPassword: password, ownerPassword: password });
  const data = await doc.save();
  return new Blob([data as BlobPart], { type: "application/pdf" });
}

/** Remove a password from a PDF the user owns. Throws if the password is wrong. */
export async function removePassword(file: File, password: string) {
  const doc = await PDFDocument.load(await file.arrayBuffer(), { password });
  const data = await doc.save();
  return new Blob([data as BlobPart], { type: "application/pdf" });
}
