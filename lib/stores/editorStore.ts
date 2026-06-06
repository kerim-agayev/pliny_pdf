import { create } from "zustand";
import type { OpenResult, PageData, BlockChange } from "@/lib/api/editor";
import { editorSessionTtlMs } from "@/lib/limits";
import type { Plan } from "@/lib/ratelimit";

export type Tool =
  | "select"
  | "text"
  | "whiteout"
  | "highlight"
  | "strike"
  | "draw"
  | "shapes"
  | "comment"
  | "link";
export type ShapeType = "rectangle" | "circle" | "arrow" | "line";
export type TextAlign = "left" | "center" | "right";

/** Client-only overlay annotations (highlight/draw/etc). Burned into the PDF in Wave 4C. */
export type Annotation = {
  id: string;
  type: "highlight" | "strike" | "underline" | "draw" | "shape" | "comment" | "link";
  pageNum: number;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  strokeWidth?: number;
  shapeType?: ShapeType;
  path?: string; // SVG path for freehand draw
  /** actual end point (PDF points) for arrow/line shapes — preserves drag direction */
  x2?: number;
  y2?: number;
  text?: string; // comment body / link href
};

type Snapshot = { changes: Map<string, BlockChange>; annotations: Annotation[] };

/** A Find&Replace hit, located at its text block's bbox (PDF points). */
export type FindMatch = { pageNum: number; blockId: string; x: number; y: number; w: number; h: number };

/**
 * Block-level matches for a query across all pages, in reading order. Highlighting
 * is approximate (whole block that contains the query), which is enough for the
 * live find preview; the server does the exact replacement on apply.
 */
export function computeMatches(pages: PageData[], query: string, caseSensitive: boolean): FindMatch[] {
  if (!query) return [];
  const q = caseSensitive ? query : query.toLowerCase();
  const out: FindMatch[] = [];
  for (const pg of pages) {
    for (const b of pg.textBlocks) {
      const text = caseSensitive ? b.text : b.text.toLowerCase();
      if (text.includes(q)) out.push({ pageNum: pg.pageNum, blockId: b.blockId, x: b.x, y: b.y, w: b.w, h: b.h });
    }
  }
  return out;
}

export type EditorPhase = "empty" | "loading" | "active" | "scanned" | "error";

interface EditorState {
  // document
  phase: EditorPhase;
  errorKind: "parse" | "scanned" | "tooManyPages" | "fileTooLarge" | "rateLimited" | null;
  sessionId: string | null;
  fileName: string;
  pages: PageData[];
  pageCount: number;
  currentPage: number; // 0-based
  zoom: number; // percent
  scanned: boolean;
  sessionExpiresAt: number | null;

  // selection / editing
  tool: Tool;
  shapeType: ShapeType;
  selectedBlock: string | null;
  /** additional blocks selected via Select-All (current page); single selection stays in selectedBlock */
  multiSelected: string[];
  editingBlock: string | null;

  // text formatting (applies to the selected block)
  fontFamily: string;
  fontSize: number;
  fontColor: string;
  bold: boolean;
  italic: boolean;
  textAlign: TextAlign;

  // annotation tool settings
  strokeColor: string;
  strokeWidth: number;

  // mutations
  changes: Map<string, BlockChange>;
  annotations: Annotation[];
  undoStack: Snapshot[];
  redoStack: Snapshot[];
  hasUnsavedChanges: boolean;

  // ui
  findReplaceOpen: boolean;
  /** live Find&Replace query — drives on-page match highlighting */
  findQuery: string;
  findCaseSensitive: boolean;
  /** index of the currently focused match (across all pages), for prev/next nav */
  findIndex: number;
  /** bumped whenever the server re-renders page PNGs, to cache-bust <img> sources */
  renderVersion: number;

  // actions
  startLoading: (fileName: string) => void;
  openSession: (res: OpenResult, plan: Plan | null) => void;
  failParse: (kind: EditorState["errorKind"]) => void;
  reset: () => void;

  setTool: (tool: Tool) => void;
  setShapeType: (s: ShapeType) => void;
  setZoom: (z: number) => void;
  setCurrentPage: (p: number) => void;

  selectBlock: (id: string | null) => void;
  selectAllOnPage: (ids: string[]) => void;
  setEditing: (id: string | null) => void;
  editBlock: (blockId: string, patch: Partial<BlockChange>) => void;
  deleteBlock: (blockId: string) => void;
  deleteBlocks: (ids: string[]) => void;

  setFormat: (patch: Partial<Pick<EditorState, "fontFamily" | "fontSize" | "fontColor" | "bold" | "italic" | "textAlign">>) => void;
  setStroke: (patch: Partial<Pick<EditorState, "strokeColor" | "strokeWidth">>) => void;

  addAnnotation: (a: Annotation) => void;
  removeAnnotation: (id: string) => void;

  replacePages: (pages: PageData[]) => void;
  bumpRender: () => void;
  markSaved: () => void;

  undo: () => void;
  redo: () => void;

  openFindReplace: () => void;
  closeFindReplace: () => void;
  setFindQuery: (q: string, caseSensitive: boolean) => void;
  setFindIndex: (i: number) => void;
}

const INITIAL = {
  phase: "empty" as EditorPhase,
  errorKind: null,
  sessionId: null,
  fileName: "",
  pages: [] as PageData[],
  pageCount: 0,
  currentPage: 0,
  zoom: 100,
  scanned: false,
  sessionExpiresAt: null,
  tool: "select" as Tool,
  shapeType: "rectangle" as ShapeType,
  selectedBlock: null,
  multiSelected: [] as string[],
  editingBlock: null,
  fontFamily: "Helvetica",
  fontSize: 12,
  fontColor: "#1f1f1f",
  bold: false,
  italic: false,
  textAlign: "left" as TextAlign,
  strokeColor: "#F43F5E",
  strokeWidth: 3,
  changes: new Map<string, BlockChange>(),
  annotations: [] as Annotation[],
  undoStack: [] as Snapshot[],
  redoStack: [] as Snapshot[],
  hasUnsavedChanges: false,
  findReplaceOpen: false,
  findQuery: "",
  findCaseSensitive: false,
  findIndex: 0,
  renderVersion: 0,
};

function snapshot(s: EditorState): Snapshot {
  return { changes: new Map(s.changes), annotations: [...s.annotations] };
}

export const useEditorStore = create<EditorState>((set, get) => ({
  ...INITIAL,

  startLoading: (fileName) => set({ ...INITIAL, changes: new Map(), annotations: [], phase: "loading", fileName }),

  openSession: (res, plan) =>
    set({
      phase: res.scanned ? "scanned" : "active",
      sessionId: res.sessionId,
      pages: res.pages,
      pageCount: res.pageCount,
      scanned: res.scanned,
      currentPage: 0,
      sessionExpiresAt: Date.now() + editorSessionTtlMs(plan),
    }),

  failParse: (kind) => set({ phase: "error", errorKind: kind }),

  reset: () => set({ ...INITIAL, changes: new Map(), annotations: [], undoStack: [], redoStack: [] }),

  setTool: (tool) => set({ tool, selectedBlock: tool === "select" ? get().selectedBlock : null, multiSelected: [], editingBlock: null }),
  setShapeType: (shapeType) => set({ shapeType }),
  setZoom: (z) => set({ zoom: Math.min(200, Math.max(50, Math.round(z))) }),
  setCurrentPage: (p) => set({ currentPage: Math.min(get().pageCount - 1, Math.max(0, p)) }),

  selectBlock: (id) => {
    const block = id ? get().pages.flatMap((pg) => pg.textBlocks).find((b) => b.blockId === id) : null;
    const change = id ? get().changes.get(id) : undefined;
    if (block) {
      set({
        selectedBlock: id,
        fontFamily: change?.fontName ?? block.fontName ?? "Helvetica",
        fontSize: Math.round(change?.fontSize ?? block.fontSize ?? 12),
        fontColor: change?.color ?? block.color ?? "#1f1f1f",
        bold: change?.bold ?? block.bold ?? false,
        italic: change?.italic ?? block.italic ?? false,
      });
    } else {
      set({ selectedBlock: id, editingBlock: id ? get().editingBlock : null });
    }
    set({ multiSelected: [] });
  },
  selectAllOnPage: (ids) => set({ multiSelected: ids, selectedBlock: ids[0] ?? null, editingBlock: null }),
  setEditing: (id) => set({ editingBlock: id, selectedBlock: id ?? get().selectedBlock, multiSelected: [] }),

  editBlock: (blockId, patch) =>
    set((s) => {
      const undoStack = [...s.undoStack, snapshot(s)];
      const changes = new Map(s.changes);
      changes.set(blockId, { ...changes.get(blockId), blockId, ...patch });
      return { changes, undoStack, redoStack: [], hasUnsavedChanges: true };
    }),

  deleteBlock: (blockId) =>
    set((s) => {
      const undoStack = [...s.undoStack, snapshot(s)];
      const changes = new Map(s.changes);
      changes.set(blockId, { ...changes.get(blockId), blockId, deleted: true });
      return { changes, undoStack, redoStack: [], hasUnsavedChanges: true, selectedBlock: null };
    }),

  deleteBlocks: (ids) =>
    set((s) => {
      if (!ids.length) return s;
      const undoStack = [...s.undoStack, snapshot(s)];
      const changes = new Map(s.changes);
      for (const blockId of ids) changes.set(blockId, { ...changes.get(blockId), blockId, deleted: true });
      return { changes, undoStack, redoStack: [], hasUnsavedChanges: true, selectedBlock: null, multiSelected: [] };
    }),

  setFormat: (patch) => {
    set(patch);
    const id = get().selectedBlock;
    if (id) {
      const map: Partial<BlockChange> = {};
      if (patch.fontFamily !== undefined) map.fontName = patch.fontFamily;
      if (patch.fontSize !== undefined) map.fontSize = patch.fontSize;
      if (patch.fontColor !== undefined) map.color = patch.fontColor;
      if (patch.bold !== undefined) map.bold = patch.bold;
      if (patch.italic !== undefined) map.italic = patch.italic;
      if (Object.keys(map).length) get().editBlock(id, map);
    }
  },
  setStroke: (patch) => set(patch),

  addAnnotation: (a) =>
    set((s) => ({
      undoStack: [...s.undoStack, snapshot(s)],
      redoStack: [],
      annotations: [...s.annotations, a],
      hasUnsavedChanges: true,
    })),
  removeAnnotation: (id) =>
    set((s) => ({
      undoStack: [...s.undoStack, snapshot(s)],
      redoStack: [],
      annotations: s.annotations.filter((a) => a.id !== id),
      hasUnsavedChanges: true,
    })),

  replacePages: (pages) => set({ pages }),
  bumpRender: () => set((s) => ({ renderVersion: s.renderVersion + 1 })),
  markSaved: () => set({ hasUnsavedChanges: false }),

  undo: () =>
    set((s) => {
      if (!s.undoStack.length) return s;
      const prev = s.undoStack[s.undoStack.length - 1];
      return {
        undoStack: s.undoStack.slice(0, -1),
        redoStack: [...s.redoStack, snapshot(s)],
        changes: prev.changes,
        annotations: prev.annotations,
        hasUnsavedChanges: true,
      };
    }),
  redo: () =>
    set((s) => {
      if (!s.redoStack.length) return s;
      const next = s.redoStack[s.redoStack.length - 1];
      return {
        redoStack: s.redoStack.slice(0, -1),
        undoStack: [...s.undoStack, snapshot(s)],
        changes: next.changes,
        annotations: next.annotations,
        hasUnsavedChanges: true,
      };
    }),

  openFindReplace: () => set({ findReplaceOpen: true }),
  closeFindReplace: () => set({ findReplaceOpen: false, findQuery: "", findIndex: 0 }),
  setFindQuery: (q, caseSensitive) => set({ findQuery: q, findCaseSensitive: caseSensitive, findIndex: 0 }),
  setFindIndex: (i) => set({ findIndex: i }),
}));
