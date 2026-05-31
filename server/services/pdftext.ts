/**
 * Extract text from a PDF on the backend (for AI Summarize). Uses pdfjs-dist's
 * legacy build, which runs under Bun/Node without a browser. No rendering happens
 * — only the text layer is read — so no canvas dependency is required.
 */
export async function extractPdfText(
  data: Uint8Array,
): Promise<{ text: string; pages: number }> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pdfjs: any = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const doc = await pdfjs.getDocument({
    data,
    isEvalSupported: false,
    useSystemFonts: true,
  }).promise;

  let text = "";
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    text += content.items.map((it: any) => (typeof it.str === "string" ? it.str : "")).join(" ") + "\n";
  }

  const pages = doc.numPages;
  await doc.destroy();
  return { text, pages };
}
