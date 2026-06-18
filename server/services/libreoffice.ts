import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { writeFile, readFile, mkdir, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const execFileP = promisify(execFile);

/**
 * Container running Gotenberg (which bundles LibreOffice). Gotenberg's HTTP API
 * can't output DOCX, but the LibreOffice binary inside the container can convert
 * PDF → Word via the `writer_pdf_import` filter, so we exec into it.
 * Override the name if your compose project differs.
 */
const CONTAINER = process.env.GOTENBERG_CONTAINER ?? "pliny_pdf-gotenberg-1";

/**
 * LibreOffice exited 0 but produced no usable .docx — happens for PDFs it can't
 * import as a Writer document (slide decks imported as Draw, scanned/image-only,
 * or protected files). Thrown so the route can surface a clear, specific message
 * instead of a confusing "docker cp: no such file" error.
 */
export class ConversionUnsupportedError extends Error {
  constructor(message = "PDF could not be converted to Word") {
    super(message);
    this.name = "ConversionUnsupportedError";
  }
}

/**
 * PDF → Word (.docx). Writes the PDF into the container, runs LibreOffice headless
 * with a per-call user profile (avoids the single-instance lock under concurrency),
 * copies the result back, and cleans up host + container temp files.
 */
export async function pdfToWord(input: Uint8Array): Promise<Uint8Array> {
  const id = crypto.randomUUID();
  const hostDir = join(tmpdir(), `pliny-${id}`);
  const hostPdf = join(hostDir, "in.pdf");
  const hostDocx = join(hostDir, "in.docx");
  const cPdf = `/tmp/pliny-${id}.pdf`;
  const cDocx = `/tmp/pliny-${id}.docx`;
  const cProfile = `/tmp/lo-${id}`;

  try {
    await mkdir(hostDir, { recursive: true });
    await writeFile(hostPdf, input);
    await execFileP("docker", ["cp", hostPdf, `${CONTAINER}:${cPdf}`]);
    await execFileP(
      "docker",
      [
        "exec",
        CONTAINER,
        "soffice",
        "--headless",
        `-env:UserInstallation=file://${cProfile}`,
        "--infilter=writer_pdf_import",
        "--convert-to",
        "docx",
        "--outdir",
        "/tmp",
        cPdf,
      ],
      // maxBuffer guards against soffice's chatty stdout/stderr (font/import
      // warnings) overflowing Node's 1 MB default and spuriously aborting an
      // otherwise-successful conversion.
      { timeout: 90_000, maxBuffer: 10 * 1024 * 1024 },
    );
    // soffice can exit 0 yet write no (or an empty) .docx for PDFs it can't
    // import as Writer. Verify the result exists and is non-empty in the
    // container before copying it out, so the failure is explicit.
    const produced = await execFileP("docker", ["exec", CONTAINER, "sh", "-c", `test -s ${cDocx}`])
      .then(() => true)
      .catch(() => false);
    if (!produced) throw new ConversionUnsupportedError();
    await execFileP("docker", ["cp", `${CONTAINER}:${cDocx}`, hostDocx]);
    return new Uint8Array(await readFile(hostDocx));
  } finally {
    await rm(hostDir, { recursive: true, force: true }).catch(() => {});
    await execFileP("docker", [
      "exec",
      CONTAINER,
      "sh",
      "-c",
      `rm -rf ${cPdf} ${cDocx} ${cProfile}`,
    ]).catch(() => {});
  }
}
