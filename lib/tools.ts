// PlinyPDF — tool catalog. Ported from the Claude Design handoff (shared.jsx TOOLS),
// with route slugs and an `available` flag (cloud/AI tools land in later sprints).
import type { ComponentType } from "react";
import {
  type IconProps,
  IconMerge,
  IconSplit,
  IconCompress,
  IconRotate,
  IconImage,
  IconImageToPdf,
  IconWatermark,
  IconLock,
  IconUnlock,
  IconWord,
  IconSparkle,
  IconPen,
} from "@/components/shared/icons";

export type ToolMode = "local" | "cloud";
export type ToolCategory = "Organize" | "Convert" | "Edit" | "Secure" | "AI";

export interface Tool {
  /** stable id, also the i18n key under the `Tools` namespace */
  id: string;
  /** route slug, e.g. /en/merge-pdf */
  slug: string;
  /** English fallback name (used for SEO/metadata; UI prefers i18n) */
  name: string;
  desc: string;
  cat: ToolCategory;
  mode: ToolMode;
  icon: ComponentType<IconProps>;
  accent: string;
  tag?: string;
  /** false = page not shipped yet (cloud/AI tools) */
  available: boolean;
}

export const CATEGORIES = ["All", "Organize", "Convert", "Edit", "Secure", "AI"] as const;
export type FilterCategory = (typeof CATEGORIES)[number];

export const TOOLS: Tool[] = [
  { id: "merge", slug: "merge-pdf", name: "Merge PDF", desc: "Combine PDFs in any order, in one click.", cat: "Organize", mode: "local", icon: IconMerge, accent: "#A78BFA", available: true },
  { id: "split", slug: "split-pdf", name: "Split PDF", desc: "Extract pages or split a PDF into parts.", cat: "Organize", mode: "local", icon: IconSplit, accent: "#A78BFA", available: true },
  { id: "compress", slug: "compress-pdf", name: "Compress PDF", desc: "Reduce file size while keeping quality.", cat: "Edit", mode: "local", icon: IconCompress, accent: "#F472B6", available: true },
  { id: "rotate", slug: "rotate-pdf", name: "Rotate PDF", desc: "Rotate pages — single or all at once.", cat: "Organize", mode: "local", icon: IconRotate, accent: "#A78BFA", available: true },
  { id: "pdf-to-jpg", slug: "pdf-to-jpg", name: "PDF to JPG", desc: "Convert each page to a JPG image.", cat: "Convert", mode: "local", icon: IconImage, accent: "#60A5FA", available: true },
  { id: "jpg-to-pdf", slug: "jpg-to-pdf", name: "JPG to PDF", desc: "Turn images into a single PDF.", cat: "Convert", mode: "local", icon: IconImageToPdf, accent: "#60A5FA", available: true },
  { id: "watermark", slug: "add-watermark", name: "Add Watermark", desc: "Stamp text with a live preview.", cat: "Edit", mode: "local", icon: IconWatermark, accent: "#F472B6", tag: "Live preview", available: true },
  { id: "protect", slug: "password-protect", name: "Password Protect", desc: "Encrypt a PDF with a password.", cat: "Secure", mode: "local", icon: IconLock, accent: "#34D399", available: true },
  { id: "unlock", slug: "remove-password", name: "Remove Password", desc: "Strip the password if you own the file.", cat: "Secure", mode: "local", icon: IconUnlock, accent: "#34D399", available: true },
  { id: "edit", slug: "edit-pdf", name: "PDF Editor", desc: "Annotate, highlight, draw, and mark up.", cat: "Edit", mode: "local", icon: IconPen, accent: "#BFB5FF", available: true },
  { id: "pdf-to-word", slug: "pdf-to-word", name: "PDF to Word", desc: "High-fidelity DOCX conversion.", cat: "Convert", mode: "cloud", icon: IconWord, accent: "#60A5FA", available: true },
  { id: "word-to-pdf", slug: "word-to-pdf", name: "Word to PDF", desc: "DOCX in, perfectly formatted PDF out.", cat: "Convert", mode: "cloud", icon: IconWord, accent: "#60A5FA", available: true },
  { id: "summarize", slug: "summarize", name: "AI Summary", desc: "Outline or executive summary in seconds.", cat: "AI", mode: "cloud", icon: IconSparkle, accent: "#BFB5FF", tag: "AI-powered", available: true },
];

export const toolById = (id: string) => TOOLS.find((t) => t.id === id);
export const toolBySlug = (slug: string) => TOOLS.find((t) => t.slug === slug);
