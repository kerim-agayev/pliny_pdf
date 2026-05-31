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
      { timeout: 90_000 },
    );
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
