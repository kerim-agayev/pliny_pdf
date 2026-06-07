import type { Plan } from "./ratelimit";

/**
 * File-size and page-count limits. Shared by the frontend dropzone (friendly
 * pre-upload check + badge) and the backend routes (authoritative enforcement).
 *
 * Per-plan (anon / free / pro), revised in Phase 5 Wave 5A so no tool exceeds
 * ~30 s for any tier:
 * - Local (browser) tools: 10 / 25 / 50 MB, 50 / 150 / 300 pages.
 * - Cloud tools: 25 / 100 / 250 MB, 50 / 300 / 1000 pages.
 * - Edit PDF has its own table (see EDITOR_MAX_* below).
 */

export const LOCAL_MAX_MB = { anon: 10, free: 25, pro: 50 } as const;
export const LOCAL_MAX_PAGES = { anon: 50, free: 150, pro: 300 } as const;

export const CLOUD_MAX_MB = { anon: 25, free: 100, pro: 250 } as const;
export const CLOUD_MAX_PAGES = { anon: 50, free: 300, pro: 1000 } as const;

// PDF→JPG renders every page, so it's heavier than the other cloud tools and needs
// a tighter page cap to stay fast (~<30s). Size still uses CLOUD_MAX_MB. (Wave 5B)
export const PDF_TO_JPG_MAX_PAGES = { anon: 20, free: 50, pro: 200 } as const;

// JPG→PDF is local but embeds each image; cap the count per plan. (Wave 5C)
export const JPG_TO_PDF_MAX_IMAGES = { anon: 50, free: 100, pro: 200 } as const;

const MB = 1024 * 1024;

/** Resolve a plan to a tier key; `null`/`undefined` ⇒ anonymous. */
function tier(plan: Plan | null | undefined): "anon" | "free" | "pro" {
  if (plan === "pro") return "pro";
  if (plan === "free") return "free";
  return "anon";
}

/** Local size limit (MB) for a plan. `null`/`undefined` ⇒ anonymous. */
export function localMaxMB(plan: Plan | null | undefined): number {
  return LOCAL_MAX_MB[tier(plan)];
}

/** Local size limit in bytes for a plan. */
export function localMaxBytes(plan: Plan | null | undefined): number {
  return localMaxMB(plan) * MB;
}

/** Maximum page count a local tool will accept for a plan. */
export function localMaxPages(plan: Plan | null | undefined): number {
  return LOCAL_MAX_PAGES[tier(plan)];
}

/** Cloud size limit (MB) for a plan. `null`/`undefined` ⇒ anonymous. */
export function cloudMaxMB(plan: Plan | null | undefined): number {
  return CLOUD_MAX_MB[tier(plan)];
}

/** Cloud size limit in bytes for a plan. */
export function cloudMaxBytes(plan: Plan | null | undefined): number {
  return cloudMaxMB(plan) * MB;
}

/** Maximum page count a cloud tool will accept for a plan. */
export function cloudMaxPages(plan: Plan | null | undefined): number {
  return CLOUD_MAX_PAGES[tier(plan)];
}

/** Maximum page count for PDF→JPG (tighter — every page is rendered). */
export function pdfToJpgMaxPages(plan: Plan | null | undefined): number {
  return PDF_TO_JPG_MAX_PAGES[tier(plan)];
}

/** Maximum number of images JPG→PDF will combine for a plan. */
export function jpgToPdfMaxImages(plan: Plan | null | undefined): number {
  return JPG_TO_PDF_MAX_IMAGES[tier(plan)];
}

/** Round a byte count to one-decimal MB for display in error messages. */
export function bytesToMB(bytes: number): number {
  return Math.round((bytes / MB) * 10) / 10;
}

/**
 * Edit-PDF (Phase 4) limits. The cloud editor has its own table (CLAUDE_4 §3) —
 * stricter anon size than generic cloud tools, plus page-count and session-timeout
 * caps. Accepts "anon" as well as a Plan so callers can pass the session's stored
 * label directly.
 */
type EditorPlan = Plan | "anon" | null | undefined;

export const EDITOR_MAX_MB = { anon: 15, free: 50, pro: 200 } as const;
export const EDITOR_MAX_PAGES = { anon: 20, free: 100, pro: 500 } as const;
const EDITOR_TTL_MIN = { anon: 15, free: 30, pro: 60 } as const;

function editorTier(plan: EditorPlan): "anon" | "free" | "pro" {
  if (plan === "pro") return "pro";
  if (plan === "free") return "free";
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
