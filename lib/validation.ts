import { PDFDocument } from "@cantoo/pdf-lib";
import type { ErrorCode } from "./errors";
import { PDF_MIME } from "./pdf/common";

/**
 * File-validation helpers for the hardening layer (Phase 3).
 *
 * Every check returns a discriminated result `{ ok, error?, ...meta }` so callers
 * can map `error` straight to a localized toast via `lib/errors.ts`.
 */

export type ValidationResult = { ok: true } | { ok: false; error: ErrorCode };

export type SizeResult =
  | { ok: true; limitMB: number; fileMB: number }
  | { ok: false; error: "FILE_TOO_LARGE"; limitMB: number; fileMB: number };

// Leading magic-byte signatures. A type may have more than one accepted form
// (e.g. Word covers modern .docx zip containers and legacy .doc OLE files).
const PDF_SIG = [0x25, 0x50, 0x44, 0x46]; // %PDF
const ZIP_SIG = [0x50, 0x4b, 0x03, 0x04]; // PK\x03\x04 (docx is a zip)
const OLE_SIG = [0xd0, 0xcf, 0x11, 0xe0]; // legacy .doc (OLE compound file)

const RULES: Record<"pdf" | "docx", { exts: string[]; sigs: number[][] }> = {
  pdf: { exts: [".pdf"], sigs: [PDF_SIG] },
  docx: { exts: [".docx", ".doc"], sigs: [ZIP_SIG, OLE_SIG] },
};

/**
 * Validate by BOTH extension and leading magic bytes — a renamed `.exe` with a
 * `.pdf` extension fails here. Reads only the first 8 bytes.
 */
export async function validateFileType(
  file: File,
  expected: "pdf" | "docx",
): Promise<ValidationResult> {
  const rule = RULES[expected];
  const name = file.name.toLowerCase();
  if (!rule.exts.some((ext) => name.endsWith(ext))) {
    return { ok: false, error: "WRONG_TYPE" };
  }
  const header = new Uint8Array(await file.slice(0, 8).arrayBuffer());
  const matches = rule.sigs.some((sig) => sig.every((byte, i) => header[i] === byte));
  return matches ? { ok: true } : { ok: false, error: "WRONG_TYPE" };
}

const toMB = (bytes: number) => Math.round((bytes / (1024 * 1024)) * 10) / 10;

/** Validate file size against a byte limit. Reports both limit and actual size in MB. */
export function validateFileSize(file: File, limitBytes: number): SizeResult {
  const limitMB = toMB(limitBytes);
  const fileMB = toMB(file.size);
  if (file.size > limitBytes) {
    return { ok: false, error: "FILE_TOO_LARGE", limitMB, fileMB };
  }
  return { ok: true, limitMB, fileMB };
}

/**
 * Detect whether a PDF is encrypted/password-protected.
 * Loads with `ignoreEncryption: true` (so the parse itself succeeds) and reads the
 * document's `isEncrypted` flag. Throws on a genuinely corrupt/unreadable PDF — the
 * caller should treat a throw as `CORRUPT_PDF`.
 */
export async function isPdfEncrypted(arrayBuffer: ArrayBuffer): Promise<boolean> {
  const doc = await PDFDocument.load(arrayBuffer, { ignoreEncryption: true });
  return doc.isEncrypted;
}

export { PDF_MIME };
