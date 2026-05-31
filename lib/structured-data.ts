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
  "edit-pdf": [
    PRIVACY_FAQ,
    { q: "What can I add to a PDF?", a: "Text, sticky notes, highlights, freehand drawing, shapes, and images." },
    { q: "Can I edit the existing text in the PDF?", a: "This is an annotation editor — you add on top of the PDF. In-place text editing is on the roadmap." },
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
