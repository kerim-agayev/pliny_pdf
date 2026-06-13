// Snap / alignment-guide engine for the cloud PDF editor (Wave 8B).
// Pure functions, no React. All math runs in PDF points; the overlay multiplies
// by `scale` to render in display pixels.

export type Pt = { x: number; y: number };
export type Box = { x: number; y: number; w: number; h: number }; // PDF points

/** A candidate line to snap to. axis "v" => vertical line at x=pos; axis "h" => horizontal line at y=pos. */
export type SnapTarget = { axis: "v" | "h"; pos: number };

/** A line to render (PDF points; overlay multiplies by scale). */
export type SnapGuide = { axis: "v" | "h"; pos: number };

export type SnapTargets = { v: SnapTarget[]; h: SnapTarget[] };
export type SnapResult = { x: number; y: number; guides: SnapGuide[] };

const MARGINS = [36, 72]; // standard 0.5in / 1in PDF margins

/** De-dup near-identical positions (within 0.5pt) so we don't emit redundant guides. */
function dedup(positions: number[]): number[] {
  const out: number[] = [];
  for (const p of positions) {
    if (!out.some((q) => Math.abs(q - p) < 0.5)) out.push(p);
  }
  return out;
}

/**
 * Build every candidate snap line for the current page + the other elements:
 *   Page center:  v @ width/2,  h @ height/2
 *   Margins:      v @ 36, 72, width-36, width-72 ; h @ 36, 72, height-36, height-72
 *   Each other box: v @ left, h-center, right ; h @ top, v-center, bottom
 */
export function calculateSnapTargets(
  page: { width: number; height: number },
  others: Box[],
): SnapTargets {
  const v: number[] = [page.width / 2];
  const h: number[] = [page.height / 2];

  for (const m of MARGINS) {
    v.push(m, page.width - m);
    h.push(m, page.height - m);
  }

  for (const b of others) {
    v.push(b.x, b.x + b.w / 2, b.x + b.w);
    h.push(b.y, b.y + b.h / 2, b.y + b.h);
  }

  return {
    v: dedup(v).map((pos) => ({ axis: "v" as const, pos })),
    h: dedup(h).map((pos) => ({ axis: "h" as const, pos })),
  };
}

/**
 * Snap a dragged box to the nearest target within `thresholdPts`, per axis.
 * X axis: test box.left / center / right against targets.v; Y axis: top / center /
 * bottom against targets.h. Axes are independent (both a v- and an h-guide can show
 * at once). A zero-size box collapses left==center==right to the point — correct for
 * point snapping (comment pins, shape-creation corner).
 */
export function findSnap(box: Box, targets: SnapTargets, thresholdPts: number): SnapResult {
  const guides: SnapGuide[] = [];

  // Edge offsets relative to the box origin for each axis.
  const xEdges = [0, box.w / 2, box.w]; // left, center, right
  const yEdges = [0, box.h / 2, box.h]; // top, center, bottom

  const snapAxis = (origin: number, edges: number[], cands: SnapTarget[]) => {
    let best: { delta: number; pos: number } | null = null;
    for (const off of edges) {
      const edgePos = origin + off;
      for (const c of cands) {
        const delta = c.pos - edgePos;
        if (Math.abs(delta) <= thresholdPts && (best === null || Math.abs(delta) < Math.abs(best.delta))) {
          best = { delta, pos: c.pos };
        }
      }
    }
    return best;
  };

  const bx = snapAxis(box.x, xEdges, targets.v);
  const by = snapAxis(box.y, yEdges, targets.h);

  const x = bx ? box.x + bx.delta : box.x;
  const y = by ? box.y + by.delta : box.y;
  if (bx) guides.push({ axis: "v", pos: bx.pos });
  if (by) guides.push({ axis: "h", pos: by.pos });

  return { x, y, guides };
}
