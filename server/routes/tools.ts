import { Elysia, t } from "elysia";
import {
  compressPdf,
  grayscalePdf,
  pdfToJpg,
  mergePdfs,
  TooManyPagesError,
} from "../services/pdf-tools";
import { getRequester } from "../services/session";
import { checkServerTool } from "@/lib/ratelimit";
import { cloudMaxBytes, cloudMaxMB, cloudMaxPages, pdfToJpgMaxPages, bytesToMB } from "@/lib/limits";
import { baseName } from "@/lib/format";

const PDF_TYPE = "application/pdf";
const JPG_TYPE = "image/jpeg";
const ZIP_TYPE = "application/zip";
const JPG_DPI = 150;

/** Best-effort client IP for anonymous (IP-based) rate limiting. */
function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

function fileResponse(bytes: Uint8Array, name: string, type: string): Response {
  return new Response(bytes as BlobPart, {
    headers: {
      "content-type": type,
      "content-disposition": `attachment; filename="${name}"`,
    },
  });
}

const isPdfName = (name: string | undefined) => !!name?.toLowerCase().endsWith(".pdf");

/**
 * Cloud PDF tools (Phase 5, Wave 5B): Compress, Grayscale, PDF→JPG, Merge —
 * migrated from in-browser canvas processing to PyMuPDF on the box. Auth-optional
 * (anon by IP, free/pro by user), plan-aware size/page limits, shared daily quota
 * via checkServerTool. Mirrors the convert/ocr/editor routes.
 */
export const tools = new Elysia({ prefix: "/api/tools" })
  .post(
    "/compress",
    async ({ body, request, set }) => {
      const file = body.file;
      if (!isPdfName(file.name)) {
        set.status = 400;
        return { error: "wrongType", message: "Please upload a PDF file." };
      }
      const who = await getRequester(request.headers);
      const plan = who?.plan ?? null;
      if (file.size > cloudMaxBytes(plan)) {
        set.status = 413;
        return { error: "fileTooLarge", limitMB: cloudMaxMB(plan), fileMB: bytesToMB(file.size) };
      }
      const lim = await checkServerTool(plan, who?.userId ?? clientIp(request));
      if (!lim.ok) {
        set.status = 429;
        return { error: "rateLimited", message: "Daily limit reached. Sign in or upgrade for more.", resetAt: lim.resetAt };
      }
      let out: Uint8Array;
      try {
        const input = new Uint8Array(await file.arrayBuffer());
        out = await compressPdf(input, cloudMaxPages(plan));
      } catch (e) {
        if (e instanceof TooManyPagesError) {
          set.status = 413;
          return { error: "tooManyPages", limitPages: cloudMaxPages(plan), pageCount: e.pageCount };
        }
        set.status = 502;
        return { error: "toolFailed", message: "Couldn't process this PDF. Please try another file.", detail: String(e).slice(0, 200) };
      }
      return fileResponse(out, `${baseName(file.name)}-compressed.pdf`, PDF_TYPE);
    },
    { body: t.Object({ file: t.File() }) },
  )
  .post(
    "/grayscale",
    async ({ body, request, set }) => {
      const file = body.file;
      if (!isPdfName(file.name)) {
        set.status = 400;
        return { error: "wrongType", message: "Please upload a PDF file." };
      }
      const who = await getRequester(request.headers);
      const plan = who?.plan ?? null;
      if (file.size > cloudMaxBytes(plan)) {
        set.status = 413;
        return { error: "fileTooLarge", limitMB: cloudMaxMB(plan), fileMB: bytesToMB(file.size) };
      }
      const lim = await checkServerTool(plan, who?.userId ?? clientIp(request));
      if (!lim.ok) {
        set.status = 429;
        return { error: "rateLimited", message: "Daily limit reached. Sign in or upgrade for more.", resetAt: lim.resetAt };
      }
      let out: Uint8Array;
      try {
        const input = new Uint8Array(await file.arrayBuffer());
        out = await grayscalePdf(input, cloudMaxPages(plan));
      } catch (e) {
        if (e instanceof TooManyPagesError) {
          set.status = 413;
          return { error: "tooManyPages", limitPages: cloudMaxPages(plan), pageCount: e.pageCount };
        }
        set.status = 502;
        return { error: "toolFailed", message: "Couldn't process this PDF. Please try another file.", detail: String(e).slice(0, 200) };
      }
      return fileResponse(out, `${baseName(file.name)}-grayscale.pdf`, PDF_TYPE);
    },
    { body: t.Object({ file: t.File() }) },
  )
  .post(
    "/pdf-to-jpg",
    async ({ body, request, set }) => {
      const file = body.file;
      if (!isPdfName(file.name)) {
        set.status = 400;
        return { error: "wrongType", message: "Please upload a PDF file." };
      }
      const who = await getRequester(request.headers);
      const plan = who?.plan ?? null;
      if (file.size > cloudMaxBytes(plan)) {
        set.status = 413;
        return { error: "fileTooLarge", limitMB: cloudMaxMB(plan), fileMB: bytesToMB(file.size) };
      }
      const lim = await checkServerTool(plan, who?.userId ?? clientIp(request));
      if (!lim.ok) {
        set.status = 429;
        return { error: "rateLimited", message: "Daily limit reached. Sign in or upgrade for more.", resetAt: lim.resetAt };
      }
      let result: { bytes: Uint8Array; isZip: boolean };
      try {
        const input = new Uint8Array(await file.arrayBuffer());
        result = await pdfToJpg(input, pdfToJpgMaxPages(plan), JPG_DPI);
      } catch (e) {
        if (e instanceof TooManyPagesError) {
          set.status = 413;
          return { error: "tooManyPages", limitPages: pdfToJpgMaxPages(plan), pageCount: e.pageCount };
        }
        set.status = 502;
        return { error: "toolFailed", message: "Couldn't process this PDF. Please try another file.", detail: String(e).slice(0, 200) };
      }
      const base = baseName(file.name);
      return result.isZip
        ? fileResponse(result.bytes, `${base}-images.zip`, ZIP_TYPE)
        : fileResponse(result.bytes, `${base}.jpg`, JPG_TYPE);
    },
    { body: t.Object({ file: t.File() }) },
  )
  .post(
    "/merge",
    async ({ body, request, set }) => {
      const files = body.files;
      if (!Array.isArray(files) || files.length < 2) {
        set.status = 400;
        return { error: "wrongType", message: "Please upload at least two PDF files." };
      }
      if (!files.every((f) => isPdfName(f.name))) {
        set.status = 400;
        return { error: "wrongType", message: "Please upload PDF files only." };
      }
      const who = await getRequester(request.headers);
      const plan = who?.plan ?? null;
      const totalSize = files.reduce((sum, f) => sum + f.size, 0);
      if (totalSize > cloudMaxBytes(plan)) {
        set.status = 413;
        return { error: "fileTooLarge", limitMB: cloudMaxMB(plan), fileMB: bytesToMB(totalSize) };
      }
      const lim = await checkServerTool(plan, who?.userId ?? clientIp(request));
      if (!lim.ok) {
        set.status = 429;
        return { error: "rateLimited", message: "Daily limit reached. Sign in or upgrade for more.", resetAt: lim.resetAt };
      }
      let out: Uint8Array;
      try {
        // Merge is bounded by total file size only (checked above) — no page cap.
        const inputs = await Promise.all(files.map(async (f) => new Uint8Array(await f.arrayBuffer())));
        out = await mergePdfs(inputs);
      } catch (e) {
        set.status = 502;
        return { error: "toolFailed", message: "Couldn't merge these PDFs. Please try other files.", detail: String(e).slice(0, 200) };
      }
      return fileResponse(out, "merged.pdf", PDF_TYPE);
    },
    { body: t.Object({ files: t.Files() }) },
  );
