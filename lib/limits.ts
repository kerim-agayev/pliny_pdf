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
