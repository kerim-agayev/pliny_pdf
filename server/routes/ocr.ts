import { Elysia, t } from "elysia";
import { ocrPdf } from "../services/ocr";
import { storeTemp, r2Configured } from "../services/r2";
import { getRequester, type Requester } from "../services/session";
import { checkServerTool } from "@/lib/ratelimit";
import { officeMaxBytes, officeMaxMB, officeMaxPages, bytesToMB } from "@/lib/limits";
import { countPdfPages } from "../services/pdf-tools";
import { db } from "@/lib/db";
import { fileHistory } from "@/lib/db/schema";
import { baseName } from "@/lib/format";
import { attachmentDisposition } from "./http";

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
      // RFC 5987 encoding — a raw non-ASCII filename throws a 500 (see http.ts).
      "content-disposition": attachmentDisposition(name),
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
    const plan = who?.plan ?? null;
    if (file.size > officeMaxBytes(plan)) {
      set.status = 413;
      return { error: "fileTooLarge", limitMB: officeMaxMB(plan), fileMB: bytesToMB(file.size) };
    }
    const lim = await checkServerTool(plan, who?.userId ?? clientIp(request));
    if (!lim.ok) {
      set.status = 429;
      return { error: "rateLimited", message: "Daily limit reached. Sign in or upgrade for more.", resetAt: lim.resetAt };
    }
    const input = new Uint8Array(await file.arrayBuffer());
    const pages = await countPdfPages(input).catch(() => 0);
    if (pages > officeMaxPages(plan)) {
      set.status = 413;
      return { error: "tooManyPages", limitPages: officeMaxPages(plan), pageCount: pages };
    }
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
