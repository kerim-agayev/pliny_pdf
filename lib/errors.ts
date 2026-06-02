/**
 * Centralized error codes for the hardening layer (Phase 3).
 *
 * Pure mapping — no React, no next-intl runtime. Both the client (toast via
 * `useTranslations("Errors")`) and the backend (structured `{ error: code }`
 * JSON) share these codes. The frontend maps a code to a localized string with
 * `useTranslations("Errors")(errorMessageKey(code))`.
 */

export type ErrorCode =
  | "FILE_TOO_LARGE"
  | "FILE_TOO_LARGE_GRAYSCALE"
  | "FILE_TOO_LARGE_COMPRESS"
  | "WRONG_TYPE"
  | "CORRUPT_PDF"
  | "PASSWORD_REQUIRED"
  | "WRONG_PASSWORD"
  | "RATE_LIMITED"
  | "NETWORK_ERROR"
  | "UNKNOWN_ERROR"
  | "OCR_FAILED"
  | "CONVERSION_FAILED";

/** Maps an error code to its key inside the `Errors` i18n namespace. */
export function errorMessageKey(code: ErrorCode): string {
  return ERROR_KEYS[code];
}

const ERROR_KEYS: Record<ErrorCode, string> = {
  FILE_TOO_LARGE: "fileTooLarge",
  FILE_TOO_LARGE_GRAYSCALE: "fileTooLargeGrayscale",
  FILE_TOO_LARGE_COMPRESS: "fileTooLargeCompress",
  WRONG_TYPE: "wrongType",
  CORRUPT_PDF: "corruptPdf",
  PASSWORD_REQUIRED: "passwordRequired",
  WRONG_PASSWORD: "wrongPassword",
  RATE_LIMITED: "rateLimited",
  NETWORK_ERROR: "networkError",
  UNKNOWN_ERROR: "unknownError",
  OCR_FAILED: "ocrFailed",
  CONVERSION_FAILED: "conversionFailed",
};
