import { Elysia, t } from "elysia";
import { wordToPdf } from "../services/gotenberg";
import { pdfToWord } from "../services/libreoffice";
import { storeTemp, r2Configured } from "../services/r2";
import { getRequester, type Requester } from "../services/session";
import { checkServerTool } from "@/lib/ratelimit";
import { officeMaxBytes, officeMaxMB, officeMaxPages, bytesToMB } from "@/lib/limits";
import { countPdfPages } from "../services/pdf-tools";
import { db } from "@/lib/db";
import { fileHistory } from "@/lib/db/schema";
import { baseName } from "@/lib/format";

const DOCX_TYPE =
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document";
const PDF_TYPE = "application/pdf";

/** Best-effort client IP for anonymous (IP-based) rate limiting. */
function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

/** Record a cloud conversion in history — only for logged-in users (privacy: anonymous runs are never stored). */
async function recordHistory(
  who: Requester,
  toolSlug: string,
  filename: string,
  size: number,
) {
  if (!who) return;
  await db
    .insert(fileHistory)
    .values({ userId: who.userId, toolSlug, filename, size })
    .catch((e) => console.error("file_history insert failed:", e));
}

/** Best-effort 24h R2 storage of the result (skipped if R2 isn't configured). */
async function maybeStore(key: string, bytes: Uint8Array, contentType: string) {
  if (!r2Configured()) return;
  try {
    await storeTemp(key, bytes, contentType);
  } catch (e) {
    console.error("R2 store failed:", e);
  }
}

function fileResponse(bytes: Uint8Array, name: string, type: string): Response {
  return new Response(bytes as BlobPart, {
    headers: {
      "content-type": type,
      "content-disposition": `attachment; filename="${name}"`,
    },
  });
}

export const convert = new Elysia({ prefix: "/api/convert" })
  .post(
    "/pdf-to-word",
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
        return { error: "rateLimited", message: "Daily conversion limit reached. Sign in or upgrade for more.", resetAt: lim.resetAt };
      }
      const input = new Uint8Array(await file.arrayBuffer());
      const pages = await countPdfPages(input).catch(() => 0);
      if (pages > officeMaxPages(plan)) {
        set.status = 413;
        return { error: "tooManyPages", limitPages: officeMaxPages(plan), pageCount: pages };
      }
      let out: Uint8Array;
      try {
        out = await pdfToWord(input);
      } catch (e) {
        set.status = 502;
        return { error: "conversionFailed", message: "Conversion failed. Please try another file." , detail: String(e).slice(0, 200) };
      }
      const outName = `${baseName(file.name)}.docx`;
      await maybeStore(`conversions/${crypto.randomUUID()}-${outName}`, out, DOCX_TYPE);
      await recordHistory(who, "pdf-to-word", outName, out.byteLength);
      return fileResponse(out, outName, DOCX_TYPE);
    },
    { body: t.Object({ file: t.File() }) },
  )
  .post(
    "/word-to-pdf",
    async ({ body, request, set }) => {
      const name = body.file.name?.toLowerCase() ?? "";
      if (!name.endsWith(".docx") && !name.endsWith(".doc")) {
        set.status = 400;
        return { error: "wrongType", message: "Please upload a Word (.docx) file." };
      }
      const who = await getRequester(request.headers);
      const plan = who?.plan ?? null;
      if (body.file.size > officeMaxBytes(plan)) {
        set.status = 413;
        return { error: "fileTooLarge", limitMB: officeMaxMB(plan), fileMB: bytesToMB(body.file.size) };
      }
      const lim = await checkServerTool(plan, who?.userId ?? clientIp(request));
      if (!lim.ok) {
        set.status = 429;
        return { error: "rateLimited", message: "Daily conversion limit reached. Sign in or upgrade for more.", resetAt: lim.resetAt };
      }
      const input = new Uint8Array(await body.file.arrayBuffer());
      let out: Uint8Array;
      try {
        out = await wordToPdf(input, body.file.name);
      } catch (e) {
        set.status = 502;
        return { error: "conversionFailed", message: "Conversion failed. Please try another file.", detail: String(e).slice(0, 200) };
      }
      // Word page count is only knowable after rendering — enforce the cap on the output PDF.
      const pages = await countPdfPages(out).catch(() => 0);
      if (pages > officeMaxPages(plan)) {
        set.status = 413;
        return { error: "tooManyPages", limitPages: officeMaxPages(plan), pageCount: pages };
      }
      const outName = `${baseName(body.file.name)}.pdf`;
      await maybeStore(`conversions/${crypto.randomUUID()}-${outName}`, out, PDF_TYPE);
      await recordHistory(who, "word-to-pdf", outName, out.byteLength);
      return fileResponse(out, outName, PDF_TYPE);
    },
    { body: t.Object({ file: t.File() }) },
  );
