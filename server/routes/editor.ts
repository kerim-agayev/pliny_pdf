import { Elysia, t } from "elysia";
import {
  openSession,
  getPagePng,
  saveSession,
  addText,
  whiteout,
  findReplace,
  closeSession,
  sessionAgeOk,
  sweepExpired,
  type Change,
} from "../services/editor";
import { getRequester } from "../services/session";
import { checkServerTool } from "@/lib/ratelimit";
import { editorMaxBytes, editorMaxMB, editorMaxPages, bytesToMB } from "@/lib/limits";
import { attachmentDisposition } from "./http";

const PDF_TYPE = "application/pdf";

/** Best-effort client IP for anonymous (IP-based) rate limiting. */
function clientIp(request: Request): string {
  const xff = request.headers.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
}

function pdfResponse(bytes: Uint8Array, name: string): Response {
  return new Response(bytes as BlobPart, {
    headers: {
      "content-type": PDF_TYPE,
      "content-disposition": attachmentDisposition(name),
    },
  });
}

/**
 * Cloud PDF editor (Phase 4). PyMuPDF on the box does parse / render / edit; this
 * router owns auth, limits, and the session lifecycle. Auth-optional, mirroring
 * the ocr route: anon by IP, free/pro by user. The daily quota is consumed on
 * `/open` only — mutations within an open session are free.
 */
export const editor = new Elysia({ prefix: "/api/editor" })
  // Open: upload → parse → render. Counts one server-tool use.
  .post(
    "/open",
    async ({ body, request, set }) => {
      await sweepExpired();
      const file = body.file;
      if (!file.name?.toLowerCase().endsWith(".pdf")) {
        set.status = 400;
        return { error: "wrongType", message: "Please upload a PDF file." };
      }
      const who = await getRequester(request.headers);
      const plan = who?.plan ?? null;
      if (file.size > editorMaxBytes(plan)) {
        set.status = 413;
        return { error: "fileTooLarge", limitMB: editorMaxMB(plan), fileMB: bytesToMB(file.size) };
      }
      const lim = await checkServerTool(plan, who?.userId ?? clientIp(request));
      if (!lim.ok) {
        set.status = 429;
        return { error: "rateLimited", message: "Daily limit reached. Sign in or upgrade for more.", resetAt: lim.resetAt };
      }

      const input = new Uint8Array(await file.arrayBuffer());
      let result;
      try {
        result = await openSession(input, who?.plan ?? "anon");
      } catch (e) {
        if (String(e).includes("passwordRequired")) {
          set.status = 401;
          return { error: "passwordRequired", message: "This PDF is password-protected. Unlock it to edit." };
        }
        set.status = 502;
        return { error: "openFailed", message: "Couldn't open this PDF. Please try another file.", detail: String(e).slice(0, 200) };
      }

      const maxPages = editorMaxPages(plan);
      if (result.pageCount > maxPages) {
        await closeSession(result.sessionId).catch(() => {});
        set.status = 413;
        return { error: "tooManyPages", limitPages: maxPages, pageCount: result.pageCount };
      }
      return result; // { sessionId, pageCount, pages, scanned }
    },
    { body: t.Object({ file: t.File() }) },
  )

  // Serve a rendered page PNG (pageNum is 0-based, matching the pages JSON).
  .get(
    "/page/:sessionId/:pageNum",
    async ({ params, set }) => {
      if (!(await sessionAgeOk(params.sessionId).catch(() => false))) {
        set.status = 410;
        return { error: "sessionExpired" };
      }
      const pageNum = Number(params.pageNum);
      if (!Number.isInteger(pageNum) || pageNum < 0) {
        set.status = 400;
        return { error: "badPage" };
      }
      try {
        const png = await getPagePng(params.sessionId, pageNum + 1);
        return new Response(png as BlobPart, { headers: { "content-type": "image/png" } });
      } catch {
        set.status = 404;
        return { error: "pageNotFound" };
      }
    },
  )

  // Save inline text edits → rebuilt PDF download.
  .post(
    "/save",
    async ({ body, set }) => {
      await sweepExpired();
      if (!(await sessionAgeOk(body.sessionId).catch(() => false))) {
        set.status = 410;
        return { error: "sessionExpired" };
      }
      const edits: Change[] = body.changes.map((c) => ({
        type: "edit",
        blockId: c.blockId,
        text: c.newText,
        fontSize: c.fontSize,
        fontName: c.fontName,
        color: c.color,
        deleted: c.deleted,
        bold: c.bold,
        italic: c.italic,
        underline: c.underline,
        x: c.x,
        y: c.y,
      }));
      // Overlay annotations to burn into the PDF (Wave 4C); keyed by their own type.
      const annotations: Change[] = (body.annotations ?? []).map((a) => ({ ...a }));
      try {
        const pdf = await saveSession(body.sessionId, edits, annotations);
        return pdfResponse(pdf, "edited.pdf");
      } catch (e) {
        set.status = 502;
        return { error: "saveFailed", message: "Couldn't save changes.", detail: String(e).slice(0, 200) };
      }
    },
    {
      body: t.Object({
        sessionId: t.String(),
        changes: t.Array(
          t.Object({
            blockId: t.String(),
            newText: t.Optional(t.String()),
            fontSize: t.Optional(t.Number()),
            fontName: t.Optional(t.String()),
            color: t.Optional(t.String()),
            deleted: t.Optional(t.Boolean()),
            bold: t.Optional(t.Boolean()),
            italic: t.Optional(t.Boolean()),
            underline: t.Optional(t.Boolean()),
            x: t.Optional(t.Number()),
            y: t.Optional(t.Number()),
          }),
        ),
        annotations: t.Optional(
          t.Array(
            t.Object({
              type: t.String(),
              pageNum: t.Number(),
              x: t.Number(),
              y: t.Number(),
              w: t.Number(),
              h: t.Number(),
              color: t.Optional(t.String()),
              strokeWidth: t.Optional(t.Number()),
              shapeType: t.Optional(t.String()),
              path: t.Optional(t.String()),
              x2: t.Optional(t.Number()),
              y2: t.Optional(t.Number()),
              text: t.Optional(t.String()),
            }),
          ),
        ),
      }),
    },
  )

  // Add a new text block.
  .post(
    "/add-text",
    async ({ body, set }) => {
      if (!(await sessionAgeOk(body.sessionId).catch(() => false))) {
        set.status = 410;
        return { error: "sessionExpired" };
      }
      try {
        const blockId = await addText(body.sessionId, {
          pageNum: body.pageNum,
          x: body.x,
          y: body.y,
          text: body.text,
          fontSize: body.fontSize ?? 12,
          fontName: body.fontName ?? "Helvetica",
          color: body.color ?? "#000000",
          bold: body.bold ?? false,
          italic: body.italic ?? false,
        });
        return { blockId };
      } catch (e) {
        set.status = 502;
        return { error: "addTextFailed", detail: String(e).slice(0, 200) };
      }
    },
    {
      body: t.Object({
        sessionId: t.String(),
        pageNum: t.Number(),
        x: t.Number(),
        y: t.Number(),
        text: t.String(),
        fontSize: t.Optional(t.Number()),
        fontName: t.Optional(t.String()),
        color: t.Optional(t.String()),
        bold: t.Optional(t.Boolean()),
        italic: t.Optional(t.Boolean()),
      }),
    },
  )

  // White-out a rectangle.
  .post(
    "/whiteout",
    async ({ body, set }) => {
      if (!(await sessionAgeOk(body.sessionId).catch(() => false))) {
        set.status = 410;
        return { error: "sessionExpired" };
      }
      try {
        await whiteout(body.sessionId, { pageNum: body.pageNum, x: body.x, y: body.y, w: body.w, h: body.h });
        return { ok: true };
      } catch (e) {
        set.status = 502;
        return { error: "whiteoutFailed", detail: String(e).slice(0, 200) };
      }
    },
    {
      body: t.Object({
        sessionId: t.String(),
        pageNum: t.Number(),
        x: t.Number(),
        y: t.Number(),
        w: t.Number(),
        h: t.Number(),
      }),
    },
  )

  // Bulk find & replace.
  .post(
    "/find-replace",
    async ({ body, set }) => {
      if (!(await sessionAgeOk(body.sessionId).catch(() => false))) {
        set.status = 410;
        return { error: "sessionExpired" };
      }
      try {
        const res = await findReplace(body.sessionId, {
          find: body.find,
          replace: body.replace,
          caseSensitive: body.caseSensitive ?? false,
          wholeWord: body.wholeWord ?? false,
        });
        return { replacements: res.replacements, pages: res.pages };
      } catch (e) {
        set.status = 502;
        return { error: "findReplaceFailed", detail: String(e).slice(0, 200) };
      }
    },
    {
      body: t.Object({
        sessionId: t.String(),
        find: t.String(),
        replace: t.String(),
        caseSensitive: t.Optional(t.Boolean()),
        wholeWord: t.Optional(t.Boolean()),
      }),
    },
  )

  // Close: drop the session's work dir.
  .delete("/close/:sessionId", async ({ params, set }) => {
    try {
      await closeSession(params.sessionId);
      return { ok: true };
    } catch (e) {
      set.status = 400;
      return { error: "closeFailed", detail: String(e).slice(0, 200) };
    }
  });
