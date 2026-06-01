import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, readFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const execFileP = promisify(execFile);

/**
 * ocrmypdf binary on the host (installed on Hetzner via apt). Wraps Tesseract +
 * Ghostscript: rasterizes scanned pages, recognizes text, and writes back an
 * invisible text layer — so the original pages are preserved and the PDF becomes
 * searchable. Override the path with OCRMYPDF_BIN if needed.
 */
const OCRMYPDF_BIN = process.env.OCRMYPDF_BIN ?? "ocrmypdf";

/** Tesseract language codes we ship packs for (eng/tur/rus). */
const ALLOWED_LANGS = new Set(["eng", "tur", "rus"]);

export function normalizeLang(input: string | undefined): string {
  const l = (input ?? "eng").toLowerCase();
  return ALLOWED_LANGS.has(l) ? l : "eng";
}

/**
 * Make a PDF searchable. `lang` is a Tesseract code (eng|tur|rus). Uses
 * --skip-text so pages that already contain selectable text pass through
 * unchanged (no error on text or mixed PDFs). Returns the searchable PDF bytes.
 */
export async function ocrPdf(input: Uint8Array, lang: string): Promise<Uint8Array> {
  const id = crypto.randomUUID();
  const dir = join(tmpdir(), `pliny-ocr-${id}`);
  const inPdf = join(dir, "in.pdf");
  const outPdf = join(dir, "out.pdf");

  try {
    await mkdir(dir, { recursive: true });
    await writeFile(inPdf, input);
    await execFileP(
      OCRMYPDF_BIN,
      ["-l", normalizeLang(lang), "--skip-text", "--optimize", "1", inPdf, outPdf],
      { timeout: 180_000, maxBuffer: 16 * 1024 * 1024 },
    );
    return new Uint8Array(await readFile(outPdf));
  } finally {
    await rm(dir, { recursive: true, force: true }).catch(() => {});
  }
}
