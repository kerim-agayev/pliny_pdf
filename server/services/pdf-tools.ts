import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, readFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

const execFileP = promisify(execFile);

/**
 * PyMuPDF cloud tools engine (Phase 5, Wave 5B). Shells out to pdf-tools.py via
 * execFile — same pattern as the editor/ocr services. Each call writes input(s)
 * to a unique temp dir, runs one subcommand, reads the output back, and cleans
 * up. Override the interpreter with PYTHON_BIN (Hetzner: python3; Windows: python).
 */
const PYTHON_BIN =
  process.env.PYTHON_BIN ?? (process.platform === "win32" ? "python" : "python3");
const TOOLS_SCRIPT = fileURLToPath(new URL("pdf-tools.py", import.meta.url));

const SPAWN_OPTS = { timeout: 120_000, maxBuffer: 64 * 1024 * 1024 } as const;

/** Thrown when the input exceeds the plan's page cap (the route maps it to 413). */
export class TooManyPagesError extends Error {
  pageCount: number;
  constructor(pageCount: number) {
    super(`tooManyPages:${pageCount}`);
    this.pageCount = pageCount;
  }
}

type Status = { pages?: number; zip?: boolean; error?: string; pageCount?: number };

async function runTool(args: string[]): Promise<Status> {
  const { stdout } = await execFileP(PYTHON_BIN, [TOOLS_SCRIPT, ...args], SPAWN_OPTS);
  const status = JSON.parse(stdout.trim() || "{}") as Status;
  if (status.error === "tooManyPages") {
    throw new TooManyPagesError(status.pageCount ?? 0);
  }
  return status;
}

async function workDir(): Promise<string> {
  const dir = join(tmpdir(), `pliny-tools-${crypto.randomUUID()}`);
  await mkdir(dir, { recursive: true });
  return dir;
}

/** Compress a PDF. Never returns bytes larger than the input. */
export async function compressPdf(input: Uint8Array, maxPages: number): Promise<Uint8Array> {
  const dir = await workDir();
  const inPdf = join(dir, "in.pdf");
  const outPdf = join(dir, "out.pdf");
  try {
    await writeFile(inPdf, input);
    await runTool(["compress", inPdf, outPdf, String(maxPages)]);
    return new Uint8Array(await readFile(outPdf));
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

/** Convert every page to grayscale. */
export async function grayscalePdf(input: Uint8Array, maxPages: number): Promise<Uint8Array> {
  const dir = await workDir();
  const inPdf = join(dir, "in.pdf");
  const outPdf = join(dir, "out.pdf");
  try {
    await writeFile(inPdf, input);
    await runTool(["grayscale", inPdf, outPdf, String(maxPages)]);
    return new Uint8Array(await readFile(outPdf));
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

/** Render pages to JPG. 1 page -> a JPEG; 2+ -> a ZIP of JPEGs. */
export async function pdfToJpg(
  input: Uint8Array,
  maxPages: number,
  dpi: number,
): Promise<{ bytes: Uint8Array; isZip: boolean }> {
  const dir = await workDir();
  const inPdf = join(dir, "in.pdf");
  try {
    await writeFile(inPdf, input);
    const status = await runTool(["pdf-to-jpg", inPdf, dir, String(maxPages), String(dpi)]);
    const isZip = !!status.zip;
    const out = join(dir, isZip ? "out.zip" : "out.jpg");
    return { bytes: new Uint8Array(await readFile(out)), isZip };
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}

/** Merge PDFs in the given order. No page cap — merge is bounded by file size. */
export async function mergePdfs(inputs: Uint8Array[]): Promise<Uint8Array> {
  const dir = await workDir();
  const outPdf = join(dir, "out.pdf");
  try {
    const paths: string[] = [];
    for (let i = 0; i < inputs.length; i++) {
      const p = join(dir, `in-${i}.pdf`);
      await writeFile(p, inputs[i]);
      paths.push(p);
    }
    await runTool(["merge", outPdf, ...paths]);
    return new Uint8Array(await readFile(outPdf));
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
