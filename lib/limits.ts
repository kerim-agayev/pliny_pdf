import { SERVER_DAILY, type Plan } from "./ratelimit";

/**
 * File-size and page-count limits. Shared by the frontend dropzone (friendly
 * pre-upload check + badge) and the backend routes (authoritative enforcement).
 *
 * Two visible tiers (Phase 7): anon and free. Pro accounts get free-tier limits
 * via effectivePlan() — graceful degradation, no breaking change for legacy accounts.
 *
 * - Local (browser) tools: 10 / 25 MB, 30 / 100 pages.
 * - Cloud tools: 20 / 75 MB (default), 50 / 200 pages (default).
 * - Per-tool overrides: Merge, Office (Word/OCR), PDF→JPG, Edit PDF.
 */

/** Maps legacy pro accounts to free-tier limits. Use in every limit lookup. */
export function effectivePlan(plan: Plan | null | undefined): "anon" | "free" {
  if (plan === "free" || plan === "pro") return "free";
  return "anon";
}

// ─── Per-tool limit lookup (Phase 9 Wave 9A — LimitBadge + dropzone validation) ──

export type BadgePlan = "anon" | "free";

/** Everything the LimitBadge + pre-upload check need for one tool. */
export interface ToolLimits {
  /** Max file size in MB. */
  mb: number;
  /** Page (or image) allowance. */
  count: number;
  /** Whether `count` is pages or images (jpg-to-pdf). */
  unit: "pages" | "images";
  /** Cloud tools consume a shared daily quota and render the "Today x/y" line. */
  cloud: boolean;
  /** Daily server-tool cap for the plan (cloud tools only). */
  dailyLimit?: number;
}

/**
 * Resolves the correct limits for a tool id — the single source the LimitBadge and
 * the FileDropzone pre-upload check both read. Values come from the same constants
 * the backend routes enforce, so the displayed limit always matches reality.
 *
 * Notes:
 *  - jpg-to-pdf caps image *count*, not pages.
 *  - nup-layout / repeat-pages show their local input limits here; their *output*
 *    page caps are a separate concept validated inside the tool.
 *  - text-to-pdf / markdown-to-pdf have no file input and never call this.
 */
export function getToolLimits(toolId: string, plan: BadgePlan): ToolLimits {
  const daily = SERVER_DAILY[plan];
  switch (toolId) {
    case "compress":
    case "grayscale-pdf":
      return { mb: CLOUD_MAX_MB[plan], count: CLOUD_MAX_PAGES[plan], unit: "pages", cloud: true, dailyLimit: daily };
    case "merge":
      return { mb: CLOUD_MAX_MB[plan], count: MERGE_MAX_PAGES[plan], unit: "pages", cloud: true, dailyLimit: daily };
    case "pdf-to-jpg":
      return { mb: CLOUD_MAX_MB[plan], count: PDF_TO_JPG_MAX_PAGES[plan], unit: "pages", cloud: true, dailyLimit: daily };
    case "pdf-to-word":
    case "word-to-pdf":
    case "ocr-pdf":
      return { mb: OFFICE_MAX_MB[plan], count: OFFICE_MAX_PAGES[plan], unit: "pages", cloud: true, dailyLimit: daily };
    case "edit-pdf":
      return { mb: EDITOR_MAX_MB[plan], count: EDITOR_MAX_PAGES[plan], unit: "pages", cloud: true, dailyLimit: daily };
    case "summarize":
      return { mb: CLOUD_MAX_MB[plan], count: CLOUD_MAX_PAGES[plan], unit: "pages", cloud: true, dailyLimit: daily };
    case "jpg-to-pdf":
      return { mb: LOCAL_MAX_MB[plan], count: JPG_TO_PDF_MAX_IMAGES[plan], unit: "images", cloud: false };
    default:
      // All local PDF-in tools (split, rotate, crop, organize, nup, repeat, booklet, …).
      return { mb: LOCAL_MAX_MB[plan], count: LOCAL_MAX_PAGES[plan], unit: "pages", cloud: false };
  }
}

// ─── Local tools ───────────────────────────────────────────────────────────────

export const LOCAL_MAX_MB = { anon: 10, free: 25 } as const;
export const LOCAL_MAX_PAGES = { anon: 30, free: 100 } as const;

// ─── Cloud tools (default — Compress, Grayscale, Merge MB) ────────────────────

export const CLOUD_MAX_MB = { anon: 20, free: 75 } as const;
export const CLOUD_MAX_PAGES = { anon: 50, free: 200 } as const;

// PDF→JPG renders every page; page cap is tighter than the default. (Phase 5 Wave 5B)
export const PDF_TO_JPG_MAX_PAGES = { anon: 15, free: 50 } as const;

// Merge allows more pages than the default cloud cap.
export const MERGE_MAX_PAGES = { anon: 100, free: 300 } as const;

// PDF→Word, Word→PDF, OCR — heavier server-side work; tighter MB + page caps.
export const OFFICE_MAX_MB = { anon: 15, free: 50 } as const;
export const OFFICE_MAX_PAGES = { anon: 25, free: 75 } as const;

// JPG→PDF is local but embeds each image; cap the image count. (Phase 5 Wave 5C)
export const JPG_TO_PDF_MAX_IMAGES = { anon: 50, free: 100 } as const;

// ─── New tools (Phase 7B–7D) — constants ready before components are built ────

// Repeat Pages: max total output pages (source pages × repeat count).
export const REPEAT_MAX_OUTPUT_PAGES = { anon: 150, free: 500 } as const;

// N-up Layout: max number of output pages (input pages collapse onto sheets).
export const NUP_MAX_OUTPUT_PAGES = { anon: 100, free: 300 } as const;

// PDF to Text, Reverse Pages, PDF Booklet: use standard LOCAL_MAX_MB / LOCAL_MAX_PAGES.

// ─── Helpers ───────────────────────────────────────────────────────────────────

const MB = 1024 * 1024;

/** Local size limit (MB) for a plan. */
export function localMaxMB(plan: Plan | null | undefined): number {
  return LOCAL_MAX_MB[effectivePlan(plan)];
}

/** Local size limit in bytes for a plan. */
export function localMaxBytes(plan: Plan | null | undefined): number {
  return localMaxMB(plan) * MB;
}

/** Maximum page count a local tool will accept for a plan. */
export function localMaxPages(plan: Plan | null | undefined): number {
  return LOCAL_MAX_PAGES[effectivePlan(plan)];
}

/** Cloud size limit (MB) for a plan (default — use officeMaxMB for Word/OCR). */
export function cloudMaxMB(plan: Plan | null | undefined): number {
  return CLOUD_MAX_MB[effectivePlan(plan)];
}

/** Cloud size limit in bytes for a plan. */
export function cloudMaxBytes(plan: Plan | null | undefined): number {
  return cloudMaxMB(plan) * MB;
}

/** Maximum page count a cloud tool will accept for a plan (default). */
export function cloudMaxPages(plan: Plan | null | undefined): number {
  return CLOUD_MAX_PAGES[effectivePlan(plan)];
}

/** Maximum page count for PDF→JPG (tighter — every page is rendered). */
export function pdfToJpgMaxPages(plan: Plan | null | undefined): number {
  return PDF_TO_JPG_MAX_PAGES[effectivePlan(plan)];
}

/** Maximum page count for Merge (higher anon cap than default cloud). */
export function mergeMaxPages(plan: Plan | null | undefined): number {
  return MERGE_MAX_PAGES[effectivePlan(plan)];
}

/** Size limit (MB) for Office tools (PDF→Word, Word→PDF, OCR). */
export function officeMaxMB(plan: Plan | null | undefined): number {
  return OFFICE_MAX_MB[effectivePlan(plan)];
}

/** Size limit in bytes for Office tools. */
export function officeMaxBytes(plan: Plan | null | undefined): number {
  return officeMaxMB(plan) * MB;
}

/** Maximum page count for Office tools (PDF→Word, Word→PDF, OCR). */
export function officeMaxPages(plan: Plan | null | undefined): number {
  return OFFICE_MAX_PAGES[effectivePlan(plan)];
}

/** Maximum number of images JPG→PDF will combine for a plan. */
export function jpgToPdfMaxImages(plan: Plan | null | undefined): number {
  return JPG_TO_PDF_MAX_IMAGES[effectivePlan(plan)];
}

/** Maximum total output pages for the Repeat Pages tool. */
export function repeatMaxOutputPages(plan: Plan | null | undefined): number {
  return REPEAT_MAX_OUTPUT_PAGES[effectivePlan(plan)];
}

/** Maximum output pages for the N-up Layout tool. */
export function nupMaxOutputPages(plan: Plan | null | undefined): number {
  return NUP_MAX_OUTPUT_PAGES[effectivePlan(plan)];
}

/** Round a byte count to one-decimal MB for display in error messages. */
export function bytesToMB(bytes: number): number {
  return Math.round((bytes / MB) * 10) / 10;
}

// ─── Edit PDF ──────────────────────────────────────────────────────────────────

/**
 * Edit-PDF (Phase 4) limits. Stricter than generic cloud tools.
 * Accepts "anon" directly as well as a Plan.
 */
type EditorPlan = Plan | "anon" | null | undefined;

export const EDITOR_MAX_MB = { anon: 10, free: 30 } as const;
export const EDITOR_MAX_PAGES = { anon: 15, free: 50 } as const;
const EDITOR_TTL_MIN = { anon: 15, free: 30 } as const;

function editorTier(plan: EditorPlan): "anon" | "free" {
  if (plan === "free" || plan === "pro") return "free";
  return "anon";
}

/** Editor upload size limit (MB) for a plan. */
export function editorMaxMB(plan: EditorPlan): number {
  return EDITOR_MAX_MB[editorTier(plan)];
}

/** Editor upload size limit in bytes for a plan. */
export function editorMaxBytes(plan: EditorPlan): number {
  return editorMaxMB(plan) * MB;
}

/** Maximum page count the editor will open for a plan. */
export function editorMaxPages(plan: EditorPlan): number {
  return EDITOR_MAX_PAGES[editorTier(plan)];
}

/** Editor session timeout (ms) for a plan. */
export function editorSessionTtlMs(plan: EditorPlan): number {
  return EDITOR_TTL_MIN[editorTier(plan)] * 60 * 1000;
}
