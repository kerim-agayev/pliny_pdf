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
  const parsed = JSON.parse(stdout) as ParseResult;

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

/**
 * Persist the batch of inline text edits and return the rebuilt PDF. Text edits
 * are keyed by blockId, so a re-save replaces the prior edit set while keeping
 * structural ops (add-text / whiteout / find-replace) that were applied live.
 */
export async function saveSession(sessionId: string, edits: Change[]): Promise<Uint8Array> {
  const dir = sessionDir(sessionId);
  const existing = (await readChanges(dir)).filter((c) => c.type !== "edit");
  await writeChanges(dir, [...existing, ...edits.map((e) => ({ ...e, type: "edit" }))]);
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
