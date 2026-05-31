import { Elysia, t } from "elysia";
import { extractPdfText } from "../services/pdftext";
import { summarize } from "../services/gemini";
import { getRequester } from "../services/session";
import { checkAi } from "@/lib/ratelimit";
import { db } from "@/lib/db";
import { fileHistory } from "@/lib/db/schema";

export const ai = new Elysia({ prefix: "/api/ai" }).post(
  "/summarize",
  async ({ body, request, set }) => {
    // AI Summary requires an account (CLAUDE.md §9.6 — no AI for anonymous users).
    const who = await getRequester(request.headers);
    if (!who) {
      set.status = 401;
      return { error: "signInRequired", message: "Please sign in to use AI Summary." };
    }

    if (!body.file.name?.toLowerCase().endsWith(".pdf")) {
      set.status = 400;
      return { error: "wrongType", message: "Please upload a PDF file." };
    }

    // Extract + validate text BEFORE consuming the quota, so a scanned PDF
    // (no text) doesn't burn one of the user's monthly summaries.
    let extracted: { text: string; pages: number };
    try {
      extracted = await extractPdfText(new Uint8Array(await body.file.arrayBuffer()));
    } catch (e) {
      set.status = 422;
      return { error: "extractFailed", message: "Couldn't read this PDF.", detail: String(e).slice(0, 200) };
    }
    const wordCount = extracted.text.trim().split(/\s+/).filter(Boolean).length;
    if (wordCount < 10) {
      set.status = 422;
      return {
        error: "noText",
        message: "No selectable text found — this PDF looks scanned (OCR isn't supported yet).",
      };
    }

    const lim = await checkAi(who.plan, who.userId);
    if (!lim.ok) {
      set.status = 429;
      return { error: "rateLimited", message: "You've reached your monthly AI summary limit.", resetAt: lim.resetAt };
    }

    let summary;
    try {
      summary = await summarize(extracted.text);
    } catch (e) {
      set.status = 502;
      return { error: "aiFailed", message: "The AI service is unavailable right now. Please try again.", detail: String(e).slice(0, 200) };
    }

    await db
      .insert(fileHistory)
      .values({ userId: who.userId, toolSlug: "summarize", filename: body.file.name, size: body.file.size })
      .catch((e) => console.error("file_history insert failed:", e));

    return { summary, meta: { pages: extracted.pages, wordCount } };
  },
  { body: t.Object({ file: t.File() }) },
);
