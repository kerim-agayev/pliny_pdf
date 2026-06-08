import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, readFile, mkdir, rm, readdir, stat } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { editorSessionTtlMs } from "@/lib/limits";
import type { Plan } from "@/lib/ratelimit";

const execFileP = promisify(execFile);

/**
 * PyMuPDF editor engine. The Python script does parse + render + edit; this
 * module owns the session lifecycle on disk and shells out to it via execFile
 * (same pattern as the ocr service). Override the interpreter with PYTHON_BIN
 * (Hetzner uses python3; Windows dev defaults to `python`).
 */
const PYTHON_BIN =
  process.env.PYTHON_BIN ?? (process.platform === "win32" ? "python" : "python3");
const EDITOR_SCRIPT = fileURLToPath(new URL("pdf-editor.py", import.meta.url));

/** Root for per-session work dirs. Override with EDITOR_DIR (prod: a writable tmp). */
const EDITOR_ROOT = process.env.EDITOR_DIR ?? join(tmpdir(), "plinypdf-editor");

const SPAWN_OPTS = { timeout: 120_000, maxBuffer: 64 * 1024 * 1024 } as const;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Plan label persisted with a session ("anon" when unauthenticated). */
export type SessionPlan = Plan | "anon";

export type TextBlock = {
  blockId: string;
  x: number;
  y: number;
  w: number;
  h: number;
  text: string;
  fontSize: number;
  fontName: string;
  color: string;
  bold: boolean;
  italic: boolean;
};
export type PageData = {
  pageNum: number;
  width: number;
  height: number;
  textBlocks: TextBlock[];
};
export type ParseResult = { pageCount: number; pages: PageData[]; scanned: boolean };
export type ApplyResult = { pageCount: number; pages: PageData[]; replacements: number };

export type Change = Record<string, unknown> & { type: string };

type Meta = { createdAt: number; plan: SessionPlan; pageCount: number };

/** Reject anything that isn't a plain UUID before it reaches the filesystem. */
function assertSessionId(sessionId: string): void {
  if (!UUID_RE.test(sessionId)) throw new Error("invalid sessionId");
}

function sessionDir(sessionId: string): string {
  assertSessionId(sessionId);
  return join(EDITOR_ROOT, sessionId);
}

async function runPython(args: string[]): Promise<string> {
  const { stdout } = await execFileP(PYTHON_BIN, [EDITOR_SCRIPT, ...args], SPAWN_OPTS);
  return stdout;
}

async function readMeta(dir: string): Promise<Meta | null> {
  try {
    return JSON.parse(await readFile(join(dir, "meta.json"), "utf-8")) as Meta;
  } catch {
    return null;
  }
}

async function readChanges(dir: string): Promise<Change[]> {
  try {
    return JSON.parse(await readFile(join(dir, "changes.json"), "utf-8")) as Change[];
  } catch {
    return [];
  }
}

async function writeChanges(dir: string, changes: Change[]): Promise<void> {
  await writeFile(join(dir, "changes.json"), JSON.stringify(changes));
}

/** True while the session is within its plan's timeout (CLAUDE_4 §3). */
export async function sessionAgeOk(sessionId: string): Promise<boolean> {
  const meta = await readMeta(sessionDir(sessionId));
  if (!meta) return false;
  return Date.now() - meta.createdAt < editorSessionTtlMs(meta.plan);
}

/** Best-effort sweep of sessions past their TTL. Runs at the top of each request. */
export async function sweepExpired(): Promise<void> {
  let entries: string[];
  try {
    entries = await readdir(EDITOR_ROOT);
  } catch {
    return; // root not created yet — nothing to sweep
  }
  const now = Date.now();
  await Promise.all(
    entries.map(async (id) => {
      const dir = join(EDITOR_ROOT, id);
      try {
        if (!(await stat(dir)).isDirectory()) return;
        const meta = await readMeta(dir);
        const ttl = meta ? editorSessionTtlMs(meta.plan) : 60 * 60 * 1000;
        const age = now - (meta?.createdAt ?? 0);
        if (age > ttl) await rm(dir, { recursive: true, force: true });
      } catch {
        /* ignore individual sweep failures */
      }
    }),
  );
}

/** Create a session: persist the upload, parse it, render page PNGs. */
export async function openSession(
  pdf: Uint8Array,
  plan: SessionPlan,
): Promise<ParseResult & { sessionId: string }> {
  const sessionId = crypto.randomUUID();
  const dir = join(EDITOR_ROOT, sessionId);
  await mkdir(dir, { recursive: true });
  const original = join(dir, "original.pdf");
  await writeFile(original, pdf);
  await writeChanges(dir, []);

  const stdout = await runPython(["parse", original, dir]);
  const parsed = JSON.parse(stdout) as ParseResult & { error?: string };
  if (parsed.error === "passwordRequired") {
    await rm(dir, { recursive: true, force: true });
    throw new Error("passwordRequired");
  }

  const meta: Meta = { createdAt: Date.now(), plan, pageCount: parsed.pageCount };
  await writeFile(join(dir, "meta.json"), JSON.stringify(meta));
  return { sessionId, ...parsed };
}

/** Read a rendered page PNG. Throws if the page hasn't been rendered. */
export async function getPagePng(sessionId: string, pageNum: number): Promise<Uint8Array> {
  const dir = sessionDir(sessionId);
  return new Uint8Array(await readFile(join(dir, `page-${pageNum}.png`)));
}

/** Rebuild working.pdf from original + changes.json and re-render touched pages. */
async function apply(dir: string): Promise<ApplyResult> {
  const stdout = await runPython(["apply", dir]);
  return JSON.parse(stdout) as ApplyResult;
}

/** Annotation change types (Wave 4C) — burned into the PDF, replaced wholesale on each save. */
const ANNOT_TYPES = new Set(["highlight", "strike", "draw", "shape", "comment"]);

/**
 * Persist the batch of inline text edits + overlay annotations and return the rebuilt
 * PDF. Text edits (keyed by blockId) and annotations are the full desired set sent on
 * every save, so we drop the prior edit/annotation changes and re-add the current ones —
 * keeping the save idempotent — while preserving structural ops (add-text / whiteout /
 * find-replace) that were applied live.
 */
export async function saveSession(
  sessionId: string,
  edits: Change[],
  annotations: Change[] = [],
): Promise<Uint8Array> {
  const dir = sessionDir(sessionId);
  // Structural ops survive every save (add-text / whiteout / find-replace); edits and
  // annotations are the full desired set, replaced wholesale.
  let structural = (await readChanges(dir)).filter(
    (c) => c.type !== "edit" && !ANNOT_TYPES.has(c.type),
  );

  // Reconcile edits that target an added text block ("add-…"). Those blockIds aren't in
  // the pristine-PDF geometry map, so a normal edit would be dropped on apply — instead
  // merge the edit into the preserved add-text op (or remove it on delete).
  const passthroughEdits: Change[] = [];
  const removed = new Set<string>();
  for (const e of edits) {
    const id = typeof e.blockId === "string" ? e.blockId : "";
    const op = id.startsWith("add-")
      ? structural.find((c) => c.type === "add-text" && c.blockId === id)
      : undefined;
    if (!op) {
      passthroughEdits.push(e); // normal block (or unknown add-id) → geometry-map edit path
      continue;
    }
    if (e.deleted) {
      removed.add(id);
      continue;
    }
    if (e.text !== undefined) op.text = e.text;
    if (e.fontSize !== undefined) op.fontSize = e.fontSize;
    if (e.fontName !== undefined) op.fontName = e.fontName;
    if (e.color !== undefined) op.color = e.color;
  }
  if (removed.size) {
    structural = structural.filter(
      (c) => !(c.type === "add-text" && removed.has(c.blockId as string)),
    );
  }

  const all = [...structural, ...passthroughEdits.map((e) => ({ ...e, type: "edit" })), ...annotations];
  console.log(
    `[editor] saveSession ${sessionId}: ${edits.length} edit(s), ${annotations.length} annotation(s); ` +
      `writing ${all.length} change(s): [${all.map((c) => c.type).join(", ")}]`,
  );
  await writeChanges(dir, all);
  await apply(dir);
  return new Uint8Array(await readFile(join(dir, "working.pdf")));
}

/** Append one structural change, rebuild, and return the fresh document state. */
async function appendAndApply(sessionId: string, change: Change): Promise<ApplyResult> {
  const dir = sessionDir(sessionId);
  await writeChanges(dir, [...(await readChanges(dir)), change]);
  return apply(dir);
}

export async function addText(
  sessionId: string,
  params: { pageNum: number; x: number; y: number; text: string; fontSize: number; fontName: string; color: string },
): Promise<string> {
  const blockId = `add-${crypto.randomUUID()}`;
  await appendAndApply(sessionId, { type: "add-text", blockId, ...params });
  return blockId;
}

export async function whiteout(
  sessionId: string,
  params: { pageNum: number; x: number; y: number; w: number; h: number },
): Promise<void> {
  await appendAndApply(sessionId, { type: "whiteout", ...params });
}

export async function findReplace(
  sessionId: string,
  params: { find: string; replace: string; caseSensitive: boolean; wholeWord: boolean },
): Promise<ApplyResult> {
  return appendAndApply(sessionId, { type: "find-replace", ...params });
}

/** Delete a session's work dir. */
export async function closeSession(sessionId: string): Promise<void> {
  await rm(sessionDir(sessionId), { recursive: true, force: true });
}
