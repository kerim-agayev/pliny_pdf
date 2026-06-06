import { SITE_URL, TOOL_SEO } from "@/lib/seo";
import { toolBySlug } from "@/lib/tools";

/**
 * Per-tool FAQ (3 Qs) + HowTo (3 steps) copy for JSON-LD, keyed by tool slug.
 * EN only — structured data is read by crawlers, not shown to users, and Google
 * keys rich results off the page's primary content which we serve per-locale anyway.
 */
interface ToolSchemaCopy {
  faq: { q: string; a: string }[];
  how: { name: string; text: string }[];
}

const LOCAL_HOW: ToolSchemaCopy["how"] = [
  { name: "Add your file", text: "Drag and drop your file or browse from your device." },
  { name: "It runs in your browser", text: "Processing happens locally via WebAssembly — no upload." },
  { name: "Download", text: "Save the result instantly. Nothing was sent to a server." },
];
const CLOUD_HOW: ToolSchemaCopy["how"] = [
  { name: "Upload your file", text: "Your file is sent over an encrypted connection to our server." },
  { name: "We process it", text: "The server converts it, then deletes the file within 24 hours." },
  { name: "Download", text: "Save the converted file. We never train on your documents." },
];

const PRIVACY_FAQ = {
  q: "Is my file uploaded to a server?",
  a: "No. This tool runs entirely in your browser via WebAssembly — your file never leaves your device. You can verify this in your browser's DevTools Network tab.",
};
const CLOUD_PRIVACY_FAQ = {
  q: "What happens to my file after conversion?",
  a: "It is processed on our server over an encrypted connection and deleted within 24 hours. It is never used to train any model.",
};

const TOOL_FAQ: Record<string, ToolSchemaCopy["faq"]> = {
  "merge-pdf": [
    PRIVACY_FAQ,
    { q: "Can I reorder the PDFs before merging?", a: "Yes — drag the files into any order before merging." },
    { q: "Is there a limit on how many PDFs I can merge?", a: "No. Local tools are unlimited and free, with no account required." },
  ],
  "split-pdf": [
    PRIVACY_FAQ,
    { q: "Can I extract a specific page range?", a: "Yes — choose a page range, or split every page into its own file." },
    { q: "Does splitting reduce quality?", a: "No. Pages are copied exactly, with no re-compression." },
  ],
  "compress-pdf": [
    PRIVACY_FAQ,
    { q: "Will compression reduce quality?", a: "You choose the level. Screen is smallest; Balanced is recommended; Maximum keeps quality high. We never return a file larger than the original." },
    { q: "Why didn't my file get smaller?", a: "Some PDFs are already optimized. In that case we keep your original rather than inflating it." },
  ],
  "rotate-pdf": [
    PRIVACY_FAQ,
    { q: "Can I rotate just some pages?", a: "Yes — select specific pages, or rotate the whole document at once." },
    { q: "Is the rotation permanent?", a: "Yes — the downloaded PDF has the new orientation baked in." },
  ],
  "delete-pages": [
    PRIVACY_FAQ,
    { q: "Can I delete several pages at once?", a: "Yes — select any number of pages, then remove them all in one click." },
    { q: "Is my original file changed?", a: "No — you download a new PDF with the selected pages removed. Your original stays untouched." },
  ],
  "extract-pages": [
    PRIVACY_FAQ,
    { q: "Can I extract non-consecutive pages?", a: "Yes — enter a mix of ranges and single pages, like 1-5, 8, 11-13." },
    { q: "What order are the extracted pages in?", a: "Pages appear in the order you list them, copied exactly with no re-compression." },
  ],
  "add-page-numbers": [
    PRIVACY_FAQ,
    { q: "Can I choose where the number appears?", a: "Yes — pick any of nine positions, the format (1, 2, 3 · Page 1 of N · roman · letters), font size, colour, and margin, with a live preview." },
    { q: "Can I skip the cover page?", a: "Yes — toggle 'Skip first page', and set which page numbering starts on and the first number to use." },
  ],
  "header-footer": [
    PRIVACY_FAQ,
    { q: "What tokens can I use?", a: "Use {page}, {total}, {date}, and {filename} — they resolve automatically on every page." },
    { q: "Can the header and footer differ?", a: "Yes — each band has its own text, alignment, font size, and colour. You can also skip the first page." },
  ],
  "crop-pdf": [
    PRIVACY_FAQ,
    { q: "Does cropping delete the trimmed content?", a: "It resizes the page box so the trimmed area no longer shows. Use it to remove margins or change the page shape." },
    { q: "Can I crop only some pages?", a: "Yes — apply the crop to all pages, the current page, or a custom page range. Presets like A4, Letter, Square, or auto remove-margins are one click." },
  ],
  "organize-pages": [
    PRIVACY_FAQ,
    { q: "What can I do to pages here?", a: "Drag to reorder, and select pages to rotate, duplicate, or delete. Multi-select with Ctrl/Cmd-click or Shift-click for a range." },
    { q: "Is the original PDF modified?", a: "No — you build a new arrangement and download it. The source file is never changed, and nothing is uploaded." },
  ],
  "sign-pdf": [
    PRIVACY_FAQ,
    { q: "How do I create a signature?", a: "Draw it with your mouse or finger, type your name in a signature font, or upload a transparent PNG — then drag it onto the page." },
    { q: "Is this a legally binding e-signature?", a: "It places a visual signature image on the PDF. It is not a cryptographic/qualified digital signature. Everything happens locally — nothing is uploaded." },
  ],
  "redact-content": [
    PRIVACY_FAQ,
    { q: "Is the redacted content really gone?", a: "Yes. Redacted pages are re-rendered as an image with the boxes burned in, so the underlying text and images are removed from the file — not just covered. This cannot be undone after download." },
    { q: "Can it find sensitive data automatically?", a: "Yes — search any text to redact every match, or auto-detect common patterns like emails, phone numbers, credit cards, and SSNs. All detection runs in your browser." },
  ],
  "remove-metadata": [
    PRIVACY_FAQ,
    { q: "What metadata gets removed?", a: "Document info like title, author, subject, keywords, creator, producer, and creation/modification dates are cleared." },
    { q: "Does this change the visible content?", a: "No — only the hidden document information is stripped. The pages themselves are untouched." },
  ],
  "edit-metadata": [
    PRIVACY_FAQ,
    { q: "Which fields can I edit?", a: "Title, author, subject, keywords, creator, and producer. Existing values are loaded so you can adjust them." },
    { q: "How do I enter multiple keywords?", a: "Separate them with commas — they are stored as the PDF's keyword list." },
  ],
  "grayscale-pdf": [
    PRIVACY_FAQ,
    { q: "Why does the file change after grayscale?", a: "Each page is re-rendered as a grayscale image, so text becomes part of the image and is no longer selectable — the same trade-off as heavy compression." },
    { q: "Is colour really removed?", a: "Yes — every pixel is converted to its grayscale luminance, so the output prints cleanly in black and white." },
  ],
  "flatten-pdf": [
    PRIVACY_FAQ,
    { q: "What does flattening do?", a: "It bakes interactive form fields (and their values) into the page as static content, so they display identically everywhere and can no longer be edited." },
    { q: "What if my PDF has no form?", a: "Then there's nothing to flatten — the file is saved unchanged. It's safe to run either way." },
  ],
  "text-to-pdf": [
    PRIVACY_FAQ,
    { q: "Can I choose the page size and font size?", a: "Yes — pick A4 or Letter and set the font size. Text is wrapped and paginated automatically." },
    { q: "Does it keep my line breaks?", a: "Yes — your line breaks are preserved, and long lines wrap to fit the page width." },
  ],
  "markdown-to-pdf": [
    PRIVACY_FAQ,
    { q: "Which Markdown features are supported?", a: "Headings, paragraphs, bold/italic, bullet and numbered lists, links, and fenced code blocks. A live preview shows the result as you type." },
    { q: "Is anything sent to a server?", a: "No — both the preview and the PDF are generated in your browser. Your text never leaves your device." },
  ],
  "pdf-to-jpg": [
    PRIVACY_FAQ,
    { q: "What resolution are the images?", a: "Pages are rendered at high resolution; you can pick the JPG quality." },
    { q: "How are multiple pages delivered?", a: "All page images are bundled into a single .zip download." },
  ],
  "jpg-to-pdf": [
    PRIVACY_FAQ,
    { q: "Which image formats are supported?", a: "JPG and PNG. Each image becomes one page in the PDF." },
    { q: "Can I combine many images into one PDF?", a: "Yes — combine into one PDF, or create a separate PDF per image." },
  ],
  "add-watermark": [
    PRIVACY_FAQ,
    { q: "Can I see the watermark before applying it?", a: "Yes — a live preview updates as you change text, size, opacity, position, and color." },
    { q: "Can I tile or angle the watermark?", a: "Yes — center, tiled, or diagonal, with adjustable rotation." },
  ],
  "password-protect": [
    PRIVACY_FAQ,
    { q: "How strong is the encryption?", a: "The PDF is encrypted with AES, applied entirely in your browser." },
    { q: "Do you store my password?", a: "No. The password never leaves your device — we couldn't store it if we wanted to." },
  ],
  "remove-password": [
    PRIVACY_FAQ,
    { q: "Do I need to know the password?", a: "Yes — you must know the current password. This removes protection from PDFs you own." },
    { q: "Is the file uploaded to remove the password?", a: "No — it is processed in your browser, locally." },
  ],
  "pdf-editor": [
    PRIVACY_FAQ,
    { q: "What can I add to a PDF?", a: "Text, sticky notes, highlights, freehand drawing, shapes, and images." },
    { q: "Can I edit the existing text in the PDF?", a: "This is an annotation editor — you add on top of the PDF. To edit real text in place, use the cloud Edit PDF tool." },
  ],
  "edit-pdf": [
    CLOUD_PRIVACY_FAQ,
    { q: "Can I edit the real text in my PDF?", a: "Yes — click any text block to edit it in place, change the font size and colour, add new text, or white out content. Changes are applied server-side with PyMuPDF." },
    { q: "Why is this a cloud tool?", a: "Editing real PDF text needs a server-side PDF engine to re-flow and re-render the page. Your file is processed securely over an encrypted connection and deleted within 24 hours." },
    { q: "What if my PDF is scanned?", a: "Image-only pages have no editable text. Run OCR first to make the text selectable, then edit it here." },
  ],
  "pdf-to-word": [
    CLOUD_PRIVACY_FAQ,
    { q: "Is the layout preserved?", a: "Yes — we use LibreOffice server-side for high-fidelity conversion to an editable .docx." },
    { q: "Is there a usage limit?", a: "Free accounts get a daily allowance; Pro is unlimited." },
  ],
  "word-to-pdf": [
    CLOUD_PRIVACY_FAQ,
    { q: "Will my formatting be kept?", a: "Yes — the document is rendered to PDF server-side with formatting intact." },
    { q: "Which formats are supported?", a: "Word .docx documents." },
  ],
  "ocr-pdf": [
    CLOUD_PRIVACY_FAQ,
    { q: "Which languages can it recognize?", a: "English, Turkish, and Russian. Pick the language that matches your document for the best accuracy." },
    { q: "What if my PDF already has text?", a: "Pages that already contain selectable text are passed through unchanged — OCR is only applied to scanned/image pages." },
  ],
  summarize: [
    CLOUD_PRIVACY_FAQ,
    { q: "What kinds of summary can I get?", a: "An executive summary, an outline, or a per-section breakdown." },
    { q: "Is my document used to train AI?", a: "No. Text is sent for summarization only — never stored or used for training." },
  ],
};

/** SoftwareApplication schema for the whole product (used on /tools). */
export function softwareApplicationSchema() {
  return {
    "@context": "https://schema.org",
    "@type": "SoftwareApplication",
    name: "PlinyPDF",
    applicationCategory: "BusinessApplication",
    operatingSystem: "Web",
    url: SITE_URL,
    description:
      "Privacy-first online PDF toolkit. Most tools run in your browser — files never leave your device.",
    offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  };
}

/** FAQPage + HowTo schemas for a tool route. Returns [] if the slug is unknown. */
export function toolSchemas(slug: string): object[] {
  const tool = toolBySlug(slug);
  const faq = TOOL_FAQ[slug];
  const seo = TOOL_SEO[slug];
  if (!tool || !faq || !seo) return [];
  const how = tool.mode === "cloud" ? CLOUD_HOW : LOCAL_HOW;
  return [
    {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      mainEntity: faq.map((f) => ({
        "@type": "Question",
        name: f.q,
        acceptedAnswer: { "@type": "Answer", text: f.a },
      })),
    },
    {
      "@context": "https://schema.org",
      "@type": "HowTo",
      name: seo.title.replace(" — PlinyPDF", ""),
      description: seo.description,
      step: how.map((s, i) => ({
        "@type": "HowToStep",
        position: i + 1,
        name: s.name,
        text: s.text,
      })),
    },
  ];
}
