import { getPdfjs } from "./pdfjs";
import type { Thumb } from "./thumbnails";

export type { Thumb };

/**
 * On-demand thumbnail loader (Phase 5C). Opens the pdfjs document ONCE and renders
 * pages lazily, caching each result — the replacement for rendering every page up
 * front (which froze the UI on large PDFs). Renders are queued (small concurrency)
 * so fast scrolling through an 800-page grid can't spawn 800 simultaneous renders.
 */
export interface ThumbLoader {
  pageCount(): Promise<number>;
  renderPage(index0: number, scale?: number): Promise<Thumb>;
  destroy(): void;
}

const MAX_CONCURRENT = 2;

export function createThumbLoader(file: File): ThumbLoader {
  type PdfDoc = Awaited<ReturnType<Awaited<ReturnType<typeof getPdfjs>>["getDocument"]>["promise"]>;
  let docPromise: Promise<PdfDoc> | null = null;
  const cache = new Map<string, Promise<Thumb>>();
  let active = 0;
  const queue: (() => void)[] = [];
  let destroyed = false;

  function doc(): Promise<PdfDoc> {
    if (!docPromise) {
      docPromise = file
        .arrayBuffer()
        .then((buf) => getPdfjs().then((pdfjs) => pdfjs.getDocument({ data: buf }).promise));
    }
    return docPromise;
  }

  function schedule<T>(task: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const run = () => {
        active++;
        task()
          .then(resolve, reject)
          .finally(() => {
            active--;
            const next = queue.shift();
            if (next) next();
          });
      };
      if (active < MAX_CONCURRENT) run();
      else queue.push(run);
    });
  }

  async function render(index0: number, scale: number): Promise<Thumb> {
    const d = await doc();
    const page = await d.getPage(index0 + 1);
    const viewport = page.getViewport({ scale });
    const canvas = document.createElement("canvas");
    canvas.width = Math.ceil(viewport.width);
    canvas.height = Math.ceil(viewport.height);
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("canvas unavailable");
    await page.render({ canvasContext: ctx, viewport, canvas }).promise;
    return { url: canvas.toDataURL("image/jpeg", 0.7), w: canvas.width, h: canvas.height };
  }

  return {
    async pageCount() {
      return (await doc()).numPages;
    },
    renderPage(index0: number, scale = 0.4): Promise<Thumb> {
      const key = `${index0}@${scale}`;
      let p = cache.get(key);
      if (!p) {
        p = schedule(() => render(index0, scale));
        cache.set(key, p);
      }
      return p;
    },
    destroy() {
      if (destroyed) return;
      destroyed = true;
      docPromise?.then((d) => d.destroy()).catch(() => {});
      cache.clear();
      queue.length = 0;
    },
  };
}
