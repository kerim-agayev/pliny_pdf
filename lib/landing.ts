// PlinyPDF — SEO landing pages (Wave 9H). EN only: these target English search
// keywords, so copy lives inline here rather than in the i18n message catalogs.
// Each page maps to a primary tool (the CTA) plus related tools for internal linking.

export interface LandingPage {
  /** route slug → /en/landing/<slug> */
  slug: string;
  /** <60 char meta title */
  title: string;
  /** <155 char meta description */
  description: string;
  /** on-page H1 */
  h1: string;
  /** 1–2 short intro paragraphs */
  intro: string[];
  /** primary CTA target — must be a real tool slug from lib/tools.ts */
  toolSlug: string;
  /** label for the primary CTA button */
  cta: string;
  /** related tool slugs (internal linking) */
  related: string[];
  faq: { q: string; a: string }[];
}

const PRIVACY_NOTE =
  "Most PlinyPDF tools run entirely in your browser — your file never leaves your device, with no sign-up and no watermark.";

export const LANDING: Record<string, LandingPage> = {
  "best-free-pdf-editor": {
    slug: "best-free-pdf-editor",
    title: "Best Free PDF Editor (No Upload) — PlinyPDF",
    description:
      "Edit PDF text, add content, and mark up pages for free. Privacy-first, no sign-up, no watermark. Try the best free PDF editor online.",
    h1: "The best free PDF editor",
    intro: [
      "Most “free” PDF editors push your files to a server, add a watermark, or block the download until you pay. PlinyPDF does none of that. Edit real PDF text, add new text and images, highlight, and white out content — then download instantly, free.",
      PRIVACY_NOTE,
    ],
    toolSlug: "edit-pdf",
    cta: "Open the PDF editor",
    related: ["pdf-editor", "add-watermark", "sign-pdf", "grayscale-pdf"],
    faq: [
      { q: "Is the PDF editor really free?", a: "Yes — editing and downloading are free, with no watermark and no credit card." },
      { q: "Do I need to create an account?", a: "No. You can start editing immediately. An optional free account raises the limits on cloud tools." },
      { q: "Can I edit the actual text in my PDF?", a: "Yes. The Edit PDF tool lets you click any text block and change it in place, change the font size and colour, or white out content." },
    ],
  },
  "convert-pdf-to-word-free": {
    slug: "convert-pdf-to-word-free",
    title: "Convert PDF to Word Free — PlinyPDF",
    description:
      "Convert PDF to an editable Word (.docx) document online, free. High-fidelity layout, processed securely and deleted within 24 hours.",
    h1: "Convert PDF to Word, free",
    intro: [
      "Turn any PDF into a fully editable Word document while keeping the layout intact. PlinyPDF uses a server-side LibreOffice engine for high-fidelity conversion.",
      "Your file is sent over an encrypted connection, converted, and deleted within 24 hours — never used to train any model.",
    ],
    toolSlug: "pdf-to-word",
    cta: "Convert PDF to Word",
    related: ["word-to-pdf", "pdf-to-text", "ocr-pdf", "edit-pdf"],
    faq: [
      { q: "Is the layout preserved?", a: "Yes — we use LibreOffice server-side for a high-fidelity conversion to editable .docx." },
      { q: "What happens to my file?", a: "It is processed over an encrypted connection and deleted within 24 hours. It is never used for training." },
      { q: "Is there a usage limit?", a: "Free accounts get a daily allowance; conversions show the remaining count before you upload." },
    ],
  },
  "merge-pdf-online-free": {
    slug: "merge-pdf-online-free",
    title: "Merge PDF Online Free — PlinyPDF",
    description:
      "Combine multiple PDFs into one online, free. Drag to reorder, no limits, no watermark. Files stay in your browser.",
    h1: "Merge PDF online, free",
    intro: [
      "Combine several PDFs into a single document and drag them into the exact order you want. PlinyPDF merges them with no page limit and no watermark.",
      PRIVACY_NOTE,
    ],
    toolSlug: "merge-pdf",
    cta: "Merge PDFs",
    related: ["split-pdf", "organize-pages", "grayscale-pdf", "rotate-pdf"],
    faq: [
      { q: "Can I reorder the files before merging?", a: "Yes — drag the files into any order before you merge." },
      { q: "Is there a limit on how many PDFs?", a: "No. Merging is unlimited and free, with no account required." },
      { q: "Are my files uploaded?", a: "No — merging runs in your browser. Your files never leave your device." },
    ],
  },
  "edit-pdf-without-uploading": {
    slug: "edit-pdf-without-uploading",
    title: "Edit PDF Without Uploading — PlinyPDF",
    description:
      "Edit, annotate, and sign PDFs without uploading them to a server. Privacy-first PDF tools that run in your browser. Free, no watermark.",
    h1: "Edit PDFs without uploading them",
    intro: [
      "Uploading a sensitive document to an unknown server is a privacy risk you don’t have to take. PlinyPDF’s local tools process your PDF entirely in your browser — you can confirm nothing is uploaded in your browser’s DevTools Network tab.",
      "Annotate, sign, watermark, organize, and protect PDFs without your file ever leaving your device.",
    ],
    toolSlug: "pdf-editor",
    cta: "Open the PDF annotator",
    related: ["edit-pdf", "sign-pdf", "add-watermark", "password-protect"],
    faq: [
      { q: "How do I know my file isn’t uploaded?", a: "Local tools run via WebAssembly in your browser. Open DevTools → Network and you’ll see no file upload." },
      { q: "Which tools run locally?", a: "Most of them — merge, split, rotate, annotate, sign, watermark, organize, protect, and more. Cloud-only tools (like PDF to Word) are clearly labelled." },
      { q: "Is it free?", a: "Yes — local tools are unlimited and free, with no account and no watermark." },
    ],
  },
  "split-pdf-online-free": {
    slug: "split-pdf-online-free",
    title: "Split PDF Online Free — PlinyPDF",
    description:
      "Split a PDF into separate files or extract a page range online, free. Runs in your browser — no upload, no quality loss.",
    h1: "Split PDF online, free",
    intro: [
      "Break a large PDF into separate files, or pull out just the pages you need. PlinyPDF splits by range or one page per file, copying pages exactly with no re-compression.",
      PRIVACY_NOTE,
    ],
    toolSlug: "split-pdf",
    cta: "Split a PDF",
    related: ["merge-pdf", "extract-pages", "delete-pages", "organize-pages"],
    faq: [
      { q: "Can I extract a specific page range?", a: "Yes — choose a range, or split every page into its own file." },
      { q: "Does splitting reduce quality?", a: "No. Pages are copied exactly, with no re-compression." },
      { q: "Are my files uploaded?", a: "No — splitting runs entirely in your browser." },
    ],
  },
  "pdf-to-jpg-converter": {
    slug: "pdf-to-jpg-converter",
    title: "PDF to JPG Converter (Free) — PlinyPDF",
    description:
      "Convert each PDF page to a high-resolution JPG image online, free. Pick the quality and download all pages as a zip.",
    h1: "PDF to JPG converter",
    intro: [
      "Turn each page of a PDF into a high-resolution JPG image. Choose the JPG quality and download every page bundled in a single zip.",
      "Free, with no watermark on your images.",
    ],
    toolSlug: "pdf-to-jpg",
    cta: "Convert PDF to JPG",
    related: ["jpg-to-pdf", "pdf-to-word", "grayscale-pdf", "pdf-to-text"],
    faq: [
      { q: "What resolution are the images?", a: "Pages are rendered at high resolution, and you can pick the JPG quality." },
      { q: "How are multiple pages delivered?", a: "All page images are bundled into a single .zip download." },
      { q: "Is it free?", a: "Yes — converting and downloading are free, with no watermark." },
    ],
  },
  "add-watermark-to-pdf-free": {
    slug: "add-watermark-to-pdf-free",
    title: "Add Watermark to PDF Free — PlinyPDF",
    description:
      "Add a text watermark to every PDF page with a live preview. Free, runs in your browser — adjust opacity, position, and rotation.",
    h1: "Add a watermark to a PDF, free",
    intro: [
      "Stamp a text watermark across every page and see exactly how it looks before you apply it — a live preview updates as you change the text, size, opacity, position, and colour.",
      PRIVACY_NOTE,
    ],
    toolSlug: "add-watermark",
    cta: "Add a watermark",
    related: ["edit-pdf", "header-footer", "add-page-numbers", "sign-pdf"],
    faq: [
      { q: "Can I preview the watermark first?", a: "Yes — a live preview updates as you change text, size, opacity, position, and colour." },
      { q: "Can I tile or angle the watermark?", a: "Yes — center, tiled, or diagonal, with adjustable rotation." },
      { q: "Are my files uploaded?", a: "No — watermarking runs entirely in your browser." },
    ],
  },
  "password-protect-pdf-online": {
    slug: "password-protect-pdf-online",
    title: "Password Protect PDF Online — PlinyPDF",
    description:
      "Encrypt a PDF with a password online, free. AES encryption applied in your browser — your password never leaves your device.",
    h1: "Password protect a PDF online",
    intro: [
      "Add a password to a PDF so only the people you choose can open it. PlinyPDF encrypts the file with AES entirely in your browser.",
      "Your password never leaves your device — we couldn’t store it if we wanted to.",
    ],
    toolSlug: "password-protect",
    cta: "Protect a PDF",
    related: ["remove-password", "remove-metadata", "redact-content", "flatten-pdf"],
    faq: [
      { q: "How strong is the encryption?", a: "The PDF is encrypted with AES, applied entirely in your browser." },
      { q: "Do you store my password?", a: "No. The password never leaves your device." },
      { q: "Can I remove a password later?", a: "Yes — use the Remove Password tool if you know the current password." },
    ],
  },
  "sign-pdf-online-free": {
    slug: "sign-pdf-online-free",
    title: "Sign PDF Online Free — PlinyPDF",
    description:
      "Sign a PDF online, free. Draw, type, or upload a signature and place it on the page. Runs in your browser — nothing is uploaded.",
    h1: "Sign a PDF online, free",
    intro: [
      "Add your signature to a PDF in seconds. Draw it with your mouse or finger, type your name in a signature font, or upload a transparent PNG — then drag it onto the page.",
      PRIVACY_NOTE,
    ],
    toolSlug: "sign-pdf",
    cta: "Sign a PDF",
    related: ["edit-pdf", "pdf-editor", "add-watermark", "flatten-pdf"],
    faq: [
      { q: "How do I create a signature?", a: "Draw it, type your name in a signature font, or upload a transparent PNG, then drag it onto the page." },
      { q: "Is this a legally binding e-signature?", a: "It places a visual signature image on the PDF. It is not a cryptographic/qualified digital signature." },
      { q: "Are my files uploaded?", a: "No — everything happens locally in your browser." },
    ],
  },
  "ocr-pdf-free": {
    slug: "ocr-pdf-free",
    title: "OCR PDF Free — Make Scanned PDFs Searchable",
    description:
      "Run OCR on a scanned PDF to make it searchable and selectable. Recognizes English, Turkish, and Russian. Processed securely, deleted after.",
    h1: "OCR a PDF, free",
    intro: [
      "Scanned PDFs are just images — you can’t search or copy their text. PlinyPDF’s OCR recognizes the text and layers it back into the PDF so it becomes searchable and selectable. It recognizes English, Turkish, and Russian.",
      "Your file is processed over an encrypted connection and deleted within 24 hours.",
    ],
    toolSlug: "ocr-pdf",
    cta: "OCR a PDF",
    related: ["pdf-to-text", "pdf-to-word", "edit-pdf", "grayscale-pdf"],
    faq: [
      { q: "Which languages can it recognize?", a: "English, Turkish, and Russian. Pick the language that matches your document for the best accuracy." },
      { q: "What if my PDF already has text?", a: "Pages that already contain selectable text are passed through unchanged — OCR is only applied to scanned pages." },
      { q: "What happens to my file?", a: "It is processed securely and deleted within 24 hours, never used for training." },
    ],
  },
  "rotate-pdf-online": {
    slug: "rotate-pdf-online",
    title: "Rotate PDF Online Free — PlinyPDF",
    description:
      "Rotate PDF pages online, free — single pages or the whole document. Runs in your browser, no upload, the rotation is saved permanently.",
    h1: "Rotate PDF online, free",
    intro: [
      "Fix sideways or upside-down pages in seconds. Rotate a single page, a selection, or the whole document — the new orientation is baked into the downloaded PDF.",
      PRIVACY_NOTE,
    ],
    toolSlug: "rotate-pdf",
    cta: "Rotate a PDF",
    related: ["organize-pages", "reverse-pages", "crop-pdf", "merge-pdf"],
    faq: [
      { q: "Can I rotate just some pages?", a: "Yes — select specific pages, or rotate the whole document at once." },
      { q: "Is the rotation permanent?", a: "Yes — the downloaded PDF has the new orientation baked in." },
      { q: "Are my files uploaded?", a: "No — rotation runs entirely in your browser." },
    ],
  },
};

export const landingSlugs = Object.keys(LANDING);
export const getLanding = (slug: string): LandingPage | undefined => LANDING[slug];
