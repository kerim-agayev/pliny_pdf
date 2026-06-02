import { Elysia, t } from "elysia";
import { ocrPdf } from "../services/ocr";
import { storeTemp, r2Configured } from "../services/r2";
import { getRequester, type Requester } from "../services/session";
import { checkServerTool } from "@/lib/ratelimit";
import { cloudMaxBytes, cloudMaxMB, bytesToMB } from "@/lib/limits";
import { db } from "@/lib/db";
import { fileHistory } from "@/lib/db/schema";
import { baseName } from "@/lib/format";

const PDF_TYPE = "application/pdf";

/** Best-effort client IP for anonymous (IP-based) rate limiting. */
function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

/** Record an OCR run in history — only for logged-in users (anonymous runs are never stored). */
async function recordHistory(who: Requester, filename: string, size: number) {
  if (!who) return;
  await db
    .insert(fileHistory)
    .values({ userId: who.userId, toolSlug: "ocr-pdf", filename, size })
    .catch((e) => console.error("file_history insert failed:", e));
}

/** Best-effort 24h R2 storage of the result (skipped if R2 isn't configured). */
async function maybeStore(key: string, bytes: Uint8Array) {
  if (!r2Configured()) return;
  try {
    await storeTemp(key, bytes, PDF_TYPE);
  } catch (e) {
    console.error("R2 store failed:", e);
  }
}

function fileResponse(bytes: Uint8Array, name: string): Response {
  return new Response(bytes as BlobPart, {
    headers: {
      "content-type": PDF_TYPE,
      "content-disposition": `attachment; filename="${name}"`,
    },
  });
}

/**
 * OCR PDF — the one cloud tool of Phase 2. Heavy server work (Tesseract via
 * ocrmypdf), so it shares the server-tool rate limits (anon 3/day, free 10/day,
 * Pro unlimited). Auth-optional: anonymous users are limited by IP and never logged.
 */
export const ocr = new Elysia({ prefix: "/api" }).post(
  "/ocr",
  async ({ body, request, set }) => {
    const file = body.file;
    if (!file.name?.toLowerCase().endsWith(".pdf")) {
      set.status = 400;
      return { error: "wrongType", message: "Please upload a PDF file." };
    }
    const who = await getRequester(request.headers);
    if (file.size > cloudMaxBytes(who?.plan ?? null)) {
      set.status = 413;
      return { error: "fileTooLarge", limitMB: cloudMaxMB(who?.plan ?? null), fileMB: bytesToMB(file.size) };
    }
    const lim = await checkServerTool(who?.plan ?? null, who?.userId ?? clientIp(request));
    if (!lim.ok) {
      set.status = 429;
      return { error: "rateLimited", message: "Daily limit reached. Sign in or upgrade for more.", resetAt: lim.resetAt };
    }
    const input = new Uint8Array(await file.arrayBuffer());
    let out: Uint8Array;
    try {
      out = await ocrPdf(input, body.lang ?? "eng");
    } catch (e) {
      set.status = 502;
      return { error: "ocrFailed", message: "OCR failed. Please try another file.", detail: String(e).slice(0, 200) };
    }
    const outName = `${baseName(file.name)}-ocr.pdf`;
    await maybeStore(`ocr/${crypto.randomUUID()}-${outName}`, out);
    await recordHistory(who, outName, out.byteLength);
    return fileResponse(out, outName);
  },
  { body: t.Object({ file: t.File(), lang: t.Optional(t.String()) }) },
);
