import type { Plan } from "./ratelimit";

/**
 * File-size limits (Phase 3, Wave 3B). Shared by the frontend dropzone (friendly
 * pre-upload check + badge) and the backend routes (authoritative enforcement).
 *
 * - Local (browser) tools: 100 MB for everyone.
 * - Cloud tools: per plan — anon 25 / free 50 / pro 200 MB.
 */

export const LOCAL_MAX_MB = 100;

export const CLOUD_MAX_MB = { anon: 25, free: 50, pro: 200 } as const;

// Tool-specific caps for the heaviest local raster operations (Wave 3C). These are
// stricter than the generic local limit because grayscale/compress re-render every
// page to a canvas — large/long PDFs would hang the main thread.
export const GRAYSCALE_MAX_MB = 10;
export const GRAYSCALE_MAX_PAGES = 100;
export const COMPRESS_MAX_MB = 50;
export const COMPRESS_MAX_PAGES = 300;

const MB = 1024 * 1024;

/** Cloud size limit (MB) for a plan. `null`/`undefined` ⇒ anonymous. */
export function cloudMaxMB(plan: Plan | null | undefined): number {
  if (plan === "pro") return CLOUD_MAX_MB.pro;
  if (plan === "free") return CLOUD_MAX_MB.free;
  return CLOUD_MAX_MB.anon;
}

/** Cloud size limit in bytes for a plan. */
export function cloudMaxBytes(plan: Plan | null | undefined): number {
  return cloudMaxMB(plan) * MB;
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
