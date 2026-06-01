import type { Metadata } from "next";
import { routing } from "@/i18n/routing";

/** Canonical site origin. Defaults to the production domain; override per-env. */
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://plinypdf.com").replace(
  /\/$/,
  "",
);

/** URL of the dynamic OG image for a given title/description. */
export function ogImageUrl(title: string, description?: string): string {
  const params = new URLSearchParams({ title });
  if (description) params.set("desc", description);
  return `${SITE_URL}/api/og?${params.toString()}`;
}

/**
 * Build localized page metadata: canonical + hreflang alternates + Open Graph + Twitter.
 * `path` is the route WITHOUT the locale prefix — e.g. "/merge-pdf", "/blog", or "" for home.
 */
export function pageMetadata({
  locale,
  path,
  title,
  description,
}: {
  locale: string;
  path: string;
  title: string;
  description: string;
}): Metadata {
  const clean = path === "/" ? "" : path;
  const canonical = `${SITE_URL}/${locale}${clean}`;
  const languages: Record<string, string> = {};
  for (const loc of routing.locales) {
    languages[loc] = `${SITE_URL}/${loc}${clean}`;
  }
  languages["x-default"] = `${SITE_URL}/${routing.defaultLocale}${clean}`;

  const image = ogImageUrl(title, description);
  return {
    title,
    description,
    alternates: { canonical, languages },
    openGraph: {
      title,
      description,
      url: canonical,
      siteName: "PlinyPDF",
      type: "website",
      images: [{ url: image, width: 1200, height: 630, alt: title }],
    },
    twitter: { card: "summary_large_image", title, description, images: [image] },
  };
}

/**
 * Per-tool SEO copy, centralized so each tool page is a one-line
 * `export const generateMetadata = toolMetadata("<slug>")`. Slug = route folder.
 */
export const TOOL_SEO: Record<string, { title: string; description: string }> = {
  "merge-pdf": {
    title: "Merge PDF — PlinyPDF",
    description: "Combine multiple PDFs into one, right in your browser. No upload, no limits.",
  },
  "split-pdf": {
    title: "Split PDF — PlinyPDF",
    description: "Extract pages or split a PDF into parts, right in your browser.",
  },
  "compress-pdf": {
    title: "Compress PDF — PlinyPDF",
    description: "Shrink PDF size in your browser. No uploads, no quality surprises.",
  },
  "rotate-pdf": {
    title: "Rotate PDF — PlinyPDF",
    description: "Rotate PDF pages — single or all — in your browser. No uploads.",
  },
  "delete-pages": {
    title: "Delete PDF Pages — PlinyPDF",
    description: "Remove pages from a PDF, right in your browser. No uploads, no limits.",
  },
  "extract-pages": {
    title: "Extract PDF Pages — PlinyPDF",
    description: "Pull selected pages into a new PDF, right in your browser. No uploads.",
  },
  "add-page-numbers": {
    title: "Add Page Numbers to PDF — PlinyPDF",
    description: "Number every PDF page — choose format, position, and style with a live preview. In your browser.",
  },
  "header-footer": {
    title: "Add Header & Footer to PDF — PlinyPDF",
    description: "Add running header and footer text with {page}, {total}, {date}, and {filename} tokens. In your browser.",
  },
  "crop-pdf": {
    title: "Crop PDF — PlinyPDF",
    description: "Trim margins and resize the page box with draggable handles or presets. In your browser, no uploads.",
  },
  "organize-pages": {
    title: "Organize PDF Pages — PlinyPDF",
    description: "Reorder, rotate, duplicate, and delete PDF pages by drag-and-drop. In your browser, no uploads.",
  },
  "sign-pdf": {
    title: "Sign PDF — PlinyPDF",
    description: "Draw, type, or upload a signature and place it on the page. Signed entirely in your browser.",
  },
  "redact-content": {
    title: "Redact PDF — PlinyPDF",
    description: "Permanently remove sensitive content from a PDF. Draw boxes or auto-detect patterns, all in your browser.",
  },
  "remove-metadata": {
    title: "Remove PDF Metadata — PlinyPDF",
    description: "Strip author, title, and other hidden metadata from a PDF, right in your browser. No uploads.",
  },
  "edit-metadata": {
    title: "Edit PDF Metadata — PlinyPDF",
    description: "View and edit a PDF's title, author, subject, keywords, and more — right in your browser.",
  },
  "grayscale-pdf": {
    title: "Grayscale PDF — PlinyPDF",
    description: "Convert a PDF to black and white in your browser. No uploads, ideal for printing.",
  },
  "flatten-pdf": {
    title: "Flatten PDF — PlinyPDF",
    description: "Flatten form fields and annotations into the page so they can't be edited. In your browser.",
  },
  "text-to-pdf": {
    title: "Text to PDF — PlinyPDF",
    description: "Convert plain text into a clean, paginated PDF, right in your browser. No uploads.",
  },
  "markdown-to-pdf": {
    title: "Markdown to PDF — PlinyPDF",
    description: "Write Markdown with a live preview and export a formatted PDF, right in your browser.",
  },
  "pdf-to-jpg": {
    title: "PDF to JPG — PlinyPDF",
    description: "Convert each PDF page to a high-resolution JPG, right in your browser.",
  },
  "jpg-to-pdf": {
    title: "JPG to PDF — PlinyPDF",
    description: "Combine images into a single PDF, right in your browser.",
  },
  "add-watermark": {
    title: "Add Watermark — PlinyPDF",
    description: "Stamp text on every page with a live preview, entirely in your browser.",
  },
  "password-protect": {
    title: "Password Protect PDF — PlinyPDF",
    description: "Encrypt a PDF with a password — applied entirely in your browser.",
  },
  "remove-password": {
    title: "Remove PDF Password — PlinyPDF",
    description: "Remove a password from a PDF you own, right in your browser.",
  },
  "edit-pdf": {
    title: "PDF Editor — PlinyPDF",
    description: "Annotate, highlight, draw, and mark up PDFs in your browser.",
  },
  "pdf-to-word": {
    title: "PDF to Word — PlinyPDF",
    description: "Convert PDF to an editable Word document. Processed securely, deleted after.",
  },
  "word-to-pdf": {
    title: "Word to PDF — PlinyPDF",
    description: "Convert a Word document to a polished PDF. Processed securely, deleted after.",
  },
  "ocr-pdf": {
    title: "OCR PDF — PlinyPDF",
    description: "Make scanned PDFs searchable. Recognizes English, Turkish, and Russian text. Processed securely, deleted after.",
  },
  summarize: {
    title: "AI PDF Summary — PlinyPDF",
    description:
      "Summarize long PDFs in seconds with AI. Executive summary, outline, or per section.",
  },
};

/** Returns a `generateMetadata` function for a tool route. */
export function toolMetadata(slug: string) {
  return async function generateMetadata({
    params,
  }: {
    params: Promise<{ locale: string }>;
  }): Promise<Metadata> {
    const { locale } = await params;
    const seo = TOOL_SEO[slug];
    return pageMetadata({ locale, path: `/${slug}`, title: seo.title, description: seo.description });
  };
}
