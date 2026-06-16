"use client";

import { useEffect, useRef, useState } from "react";
import type * as Fabric from "fabric";
import { useTranslations } from "next-intl";
import { ErrorBanner } from "./ResultPanels";
import { Spinner } from "./Spinner";
import { IconPen, IconType, IconImage, IconUpload, IconX, IconChevron, IconPlus, IconTrash, IconDownload, IconCheck } from "@/components/shared/icons";
import { signPdf, typedSignatureToPng, type PlacedSignature, type SignPlacement } from "@/lib/pdf/signPdf";
import { createThumbLoader, type Thumb, type ThumbLoader } from "@/lib/pdf/thumbnailLoader";
import { downloadBlob, baseName } from "@/lib/format";
import { analytics } from "@/lib/analytics";

type Tab = "draw" | "type" | "upload";
type Screen = "create" | "place";

// Same ink/font sets as the desktop SignPdf — handwriting families already shipped,
// so we render them larger here rather than pulling new web fonts (Wave 9C decision).
const INK = ["#1E3A8A", "#0F0F0F", "#1f1f1f", "#7C2D12"];
const SIG_FONTS = [
  { id: "f1", label: "Brush", family: "'Brush Script MT', cursive" },
  { id: "f2", label: "Script", family: "'Segoe Script', 'Snell Roundhand', cursive" },
  { id: "f3", label: "Formal", family: "'Apple Chancery', 'Snell Roundhand', cursive" },
  { id: "f4", label: "Mono", family: "'Courier New', monospace" },
];

const DEFAULT_PLACE: SignPlacement = { xPct: 16, yPct: 70, wPct: 34 };
const PAD_H = 200;

const headerStyle: React.CSSProperties = {
  display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8,
  padding: "env(safe-area-inset-top) 8px 0", height: "calc(52px + env(safe-area-inset-top))",
  flexShrink: 0, background: "var(--card)", borderBottom: "1px solid var(--line)",
};
const iconBtn: React.CSSProperties = { display: "flex", alignItems: "center", justifyContent: "center", width: 40, height: 40, borderRadius: 10, border: "1px solid var(--line)", background: "var(--bg-2)", color: "var(--text-2)" };

// Module-level so it is a stable component type (defining it inside the parent would
// remount the whole header on every render — including on every pointermove drag).
function MobileHeader({ subtitle, onBack, backLabel, trailing }: { subtitle: string; onBack: () => void; backLabel: string; trailing?: React.ReactNode }) {
  return (
    <header style={headerStyle}>
      <button type="button" onClick={onBack} style={iconBtn} aria-label={backLabel}>
        <IconChevron size={18} style={{ transform: "rotate(180deg)" }} />
      </button>
      <div style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
        <div style={{ fontSize: 14, fontWeight: 600, color: "var(--text)" }}>Sign PDF</div>
        <div className="pp-mono" style={{ fontSize: 10.5, color: "var(--text-3)" }}>{subtitle}</div>
      </div>
      <div style={{ minWidth: 40, display: "flex", justifyContent: "flex-end" }}>{trailing ?? <div style={{ width: 40 }} />}</div>
    </header>
  );
}

/**
 * Full-screen mobile takeover for Sign PDF (Wave 9C). Two screens — Create (3-tab
 * signature maker) → Place (touch drag/resize of one or more signatures on the dark
 * page canvas). Mirrors the Edit/Annotate mobile pattern (Phase 8 / Wave 9B). The
 * desktop SignPdf renders this when `useMediaQuery("(max-width: 767px)")` is true.
 *
 * Owns its own thumbnail loader (created from `file`) rather than relying on the
 * parent's ref — that keeps the Place screen working even when the parent re-renders
 * independently, and avoids a null-loader crash.
 */
export function SignPdfMobile({ file, onReset }: { file: File; onReset: () => void }) {
  const t = useTranslations("ToolUI");
  const tp = useTranslations("ToolPages.signPdf");

  const loaderRef = useRef<ThumbLoader | null>(null);
  const [total, setTotal] = useState(0);

  const [screen, setScreen] = useState<Screen>("create");
  const [tab, setTab] = useState<Tab>("draw");
  const [ink, setInk] = useState(INK[0]);
  const [typed, setTyped] = useState("");
  const [font, setFont] = useState(SIG_FONTS[0]);
  const [uploaded, setUploaded] = useState<string | null>(null);

  const [instances, setInstances] = useState<PlacedSignature[]>([]);
  const [selected, setSelected] = useState(0);
  const [previewPage, setPreviewPage] = useState(1);
  const [thumb, setThumb] = useState<Thumb | null>(null);
  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string>();

  const padWrapRef = useRef<HTMLDivElement>(null);
  const padCanvasRef = useRef<HTMLCanvasElement>(null);
  const fcRef = useRef<Fabric.Canvas | null>(null);
  const pageWrapRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ mode: "move" | "resize"; sx: number; sy: number; ox: number; oy: number; ow: number; idx: number } | null>(null);

  // Own the thumbnail loader so the Place screen never depends on a parent ref.
  useEffect(() => {
    const loader = createThumbLoader(file);
    loaderRef.current = loader;
    let alive = true;
    loader
      .pageCount()
      .then((n) => {
        if (alive) setTotal(n);
      })
      .catch(() => {});
    return () => {
      alive = false;
      loader.destroy();
      loaderRef.current = null;
    };
  }, [file]);

  // Init the fabric drawing pad ONCE, on mount. The Create layer (and this canvas)
  // stays mounted for the component's whole life — even on the Place screen it is just
  // hidden, never unmounted — so fabric and React never race to remove the same node.
  // Disposing on a create→place transition is what crashed the Place screen.
  useEffect(() => {
    let disposed = false;
    let fc: Fabric.Canvas | null = null;
    (async () => {
      const fabric = await import("fabric");
      if (disposed || !padCanvasRef.current) return;
      const width = padWrapRef.current?.clientWidth ?? 320;
      fc = new fabric.Canvas(padCanvasRef.current, { isDrawingMode: true, width, height: PAD_H, backgroundColor: undefined });
      const brush = new fabric.PencilBrush(fc);
      brush.color = ink;
      brush.width = 2.8;
      fc.freeDrawingBrush = brush;
      fcRef.current = fc;
    })();
    return () => {
      disposed = true;
      try {
        fc?.dispose();
      } catch {
        /* fabric's async DOM teardown can race React's unmount — safe to ignore */
      }
      fcRef.current = null;
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const fc = fcRef.current;
    if (fc?.freeDrawingBrush) fc.freeDrawingBrush.color = ink;
  }, [ink]);

  // Render the selected page for placement, on demand (loader caches).
  useEffect(() => {
    const loader = loaderRef.current;
    if (screen !== "place" || !loader || total === 0) return;
    let cancelled = false;
    loader
      .renderPage(previewPage - 1, 0.8)
      .then((th) => {
        if (!cancelled) setThumb(th);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [screen, previewPage, total]);

  function clearPad() {
    fcRef.current?.clear();
  }

  function onUploadPng(files: File[]) {
    const f = files[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => setUploaded(reader.result as string);
    reader.readAsDataURL(f);
  }

  /** Build a PNG data URL for the signature the user has prepared on the current tab. */
  function buildSignature(): string | null {
    if (tab === "draw") {
      const fc = fcRef.current;
      if (!fc || fc.getObjects().length === 0) return null;
      return fc.toDataURL({ format: "png", multiplier: 2 });
    }
    if (tab === "type") {
      if (!typed.trim()) return null;
      return typedSignatureToPng(typed.trim(), font.family, ink).url;
    }
    return uploaded;
  }

  const canPlace = tab === "draw" ? true : tab === "type" ? !!typed.trim() : !!uploaded;

  function placeOnPage() {
    let url: string | null = null;
    try {
      url = buildSignature();
    } catch {
      setErrorMsg(t("errorTitle"));
      return;
    }
    if (!url) return;
    const next: PlacedSignature = { pngDataUrl: url, placement: { ...DEFAULT_PLACE }, scope: { mode: "current", index: previewPage - 1 } };
    setSelected(instances.length); // index of the about-to-be-appended item
    setInstances((prev) => [...prev, next]);
    setScreen("place");
  }

  function addAnother() {
    // Start a fresh signature, keeping already-placed ones.
    clearPad();
    setTyped("");
    setUploaded(null);
    setScreen("create");
  }

  function removeInstance(i: number) {
    setInstances((prev) => prev.filter((_, idx) => idx !== i));
    setSelected((s) => (s >= i ? Math.max(0, s - 1) : s));
  }

  function setScope(i: number, mode: "current" | "all") {
    setInstances((prev) => prev.map((inst, idx) => (idx === i ? { ...inst, scope: mode === "all" ? { mode: "all" } : { mode: "current", index: previewPage - 1 } } : inst)));
  }

  // Placement drag / resize (operates on instance `idx`)
  function startMove(e: React.PointerEvent, idx: number) {
    e.preventDefault();
    setSelected(idx);
    const p = instances[idx].placement;
    dragRef.current = { mode: "move", sx: e.clientX, sy: e.clientY, ox: p.xPct, oy: p.yPct, ow: p.wPct, idx };
    window.addEventListener("pointermove", onDrag);
    window.addEventListener("pointerup", endDrag);
  }
  function startResize(e: React.PointerEvent, idx: number) {
    e.preventDefault();
    e.stopPropagation();
    setSelected(idx);
    const p = instances[idx].placement;
    dragRef.current = { mode: "resize", sx: e.clientX, sy: e.clientY, ox: p.xPct, oy: p.yPct, ow: p.wPct, idx };
    window.addEventListener("pointermove", onDrag);
    window.addEventListener("pointerup", endDrag);
  }
  function onDrag(e: PointerEvent) {
    const d = dragRef.current;
    const rect = pageWrapRef.current?.getBoundingClientRect();
    if (!d || !rect) return;
    const dxPct = ((e.clientX - d.sx) / rect.width) * 100;
    const dyPct = ((e.clientY - d.sy) / rect.height) * 100;
    setInstances((prev) =>
      prev.map((inst, idx) => {
        if (idx !== d.idx) return inst;
        if (d.mode === "move") {
          return { ...inst, placement: { ...inst.placement, xPct: Math.max(0, Math.min(d.ox + dxPct, 100 - inst.placement.wPct)), yPct: Math.max(0, Math.min(d.oy + dyPct, 98)) } };
        }
        return { ...inst, placement: { ...inst.placement, wPct: Math.max(8, Math.min(d.ow + dxPct, 90)) } };
      }),
    );
  }
  function endDrag() {
    dragRef.current = null;
    window.removeEventListener("pointermove", onDrag);
    window.removeEventListener("pointerup", endDrag);
  }

  async function save() {
    if (instances.length === 0) return;
    setSaving(true);
    setErrorMsg(undefined);
    try {
      const blob = await signPdf(file, instances);
      downloadBlob(blob, `${baseName(file.name)}-signed.pdf`);
      analytics.toolUsed("sign-pdf");
    } catch {
      setErrorMsg(t("errorTitle"));
    } finally {
      setSaving(false);
    }
  }

  const shell: React.CSSProperties = { position: "fixed", inset: 0, zIndex: 60, display: "flex", flexDirection: "column", background: "var(--bg)" };
  const tabs: { id: Tab; label: string; icon: typeof IconPen }[] = [
    { id: "draw", label: tp("tabDraw"), icon: IconPen },
    { id: "type", label: tp("tabType"), icon: IconType },
    { id: "upload", label: tp("tabUpload"), icon: IconImage },
  ];
  const sel = instances[selected];

  return (
    <>
      {/* ── CREATE layer — kept mounted (hidden, not unmounted, on Place) so the fabric
          canvas is never torn down mid-life. Unmounting it mid-transition crashed Place. ── */}
      <div style={{ ...shell, visibility: screen === "create" ? "visible" : "hidden" }} aria-hidden={screen !== "create"}>
        <MobileHeader
          subtitle={tp("stepCreate")}
          backLabel={tp("back")}
          onBack={() => (instances.length ? setScreen("place") : onReset())}
        />
        <div style={{ flex: 1, overflowY: "auto", padding: 14, display: "flex", flexDirection: "column", gap: 16 }}>
          {/* tabs */}
          <div style={{ display: "flex", gap: 4, borderRadius: 12, padding: 4, background: "var(--bg-2)", border: "1px solid var(--line)" }}>
            {tabs.map((tb) => {
              const active = tab === tb.id;
              const Ic = tb.icon;
              return (
                <button
                  key={tb.id}
                  type="button"
                  onClick={() => setTab(tb.id)}
                  style={{ flex: 1, minHeight: 44, display: "flex", alignItems: "center", justifyContent: "center", gap: 6, borderRadius: 9, fontSize: 13.5, fontWeight: 500, border: active ? "1px solid rgba(107,92,231,0.3)" : "1px solid transparent", background: active ? "rgba(107,92,231,0.16)" : "transparent", color: active ? "#BFB5FF" : "var(--text-2)" }}
                >
                  <Ic size={16} sw={1.7} /> {tb.label}
                </button>
              );
            })}
          </div>

          {/* draw pad — kept mounted, visibility toggled */}
          <div ref={padWrapRef} style={{ position: "relative", height: PAD_H, borderRadius: 16, overflow: "hidden", background: "#FAFAF9", border: "1.5px dashed var(--line-2)", display: tab === "draw" ? "block" : "none" }}>
            <div style={{ position: "absolute", bottom: 46, left: 22, right: 22, borderTop: "1.5px dashed #C7C2BB" }} />
            <span className="pp-mono" style={{ position: "absolute", bottom: 8, left: 22, fontSize: 10.5, color: "#9CA3AF" }}>{tp("drawHere")}</span>
            <button type="button" onClick={clearPad} style={{ position: "absolute", right: 10, top: 10, zIndex: 10, display: "inline-flex", alignItems: "center", gap: 5, borderRadius: 8, padding: "8px 11px", fontSize: 12, background: "white", border: "1px solid var(--line-2)", color: "#6B7280" }}>
              <IconX size={13} /> {tp("clear")}
            </button>
            <canvas ref={padCanvasRef} />
          </div>

          {tab === "type" && (
            <>
              <input className="pp-input" value={typed} onChange={(e) => setTyped(e.target.value)} placeholder={tp("typePlaceholder")} style={{ height: 52, fontSize: 17 }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                {SIG_FONTS.map((f) => {
                  const active = font.id === f.id;
                  return (
                    <button
                      key={f.id}
                      type="button"
                      onClick={() => setFont(f)}
                      style={{ minHeight: 60, display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 20px", borderRadius: 13, border: active ? "1px solid var(--indigo)" : "1px solid var(--line)", background: active ? "rgba(107,92,231,0.1)" : "var(--bg-2)" }}
                    >
                      <span style={{ fontFamily: f.family, fontSize: 28, color: active ? "#BFB5FF" : "var(--text)", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{typed.trim() || "Abc"}</span>
                      {active && <IconCheck size={18} color="#BFB5FF" sw={2.2} />}
                    </button>
                  );
                })}
              </div>
            </>
          )}

          {tab === "upload" && (
            <label style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 10, minHeight: PAD_H, borderRadius: 16, border: "1.5px dashed var(--line-2)", background: "var(--bg-2)", color: "var(--text-3)", textAlign: "center", padding: 18 }}>
              {uploaded ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={uploaded} alt="signature" style={{ maxHeight: 120, maxWidth: "90%" }} />
              ) : (
                <>
                  <IconUpload size={26} sw={1.6} color="#9CA3AF" />
                  <span style={{ fontSize: 13, color: "#6B7280" }}>{tp("uploadHint")}</span>
                </>
              )}
              <input type="file" accept="image/png" hidden onChange={(e) => onUploadPng(Array.from(e.target.files ?? []))} />
            </label>
          )}

          {/* ink */}
          {tab !== "upload" && (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <span className="pp-mono" style={{ fontSize: 10.5, color: "var(--text-3)" }}>{tp("ink").toUpperCase()}</span>
              {INK.map((c) => (
                <button key={c} type="button" onClick={() => setInk(c)} aria-label={c} style={{ width: 30, height: 30, borderRadius: "50%", background: c, border: 0, boxShadow: ink === c ? `0 0 0 2px var(--bg), 0 0 0 4px ${c}` : "inset 0 0 0 1px rgba(255,255,255,0.12)" }} />
              ))}
            </div>
          )}
        </div>

        {/* sticky bottom */}
        <div style={{ flexShrink: 0, background: "var(--card)", borderTop: "1px solid var(--line)", padding: 12, paddingBottom: "calc(12px + env(safe-area-inset-bottom))" }}>
          <button type="button" className="pp-btn pp-btn-lg" style={{ width: "100%", justifyContent: "center", opacity: canPlace ? 1 : 0.5 }} disabled={!canPlace} onClick={placeOnPage}>
            {instances.length ? tp("addToPage") : tp("nextPlace")}
          </button>
          <div className="pp-mono" style={{ marginTop: 8, textAlign: "center", fontSize: 10.5, color: "var(--text-3)" }}>{tp("createdInBrowser")}</div>
        </div>
      </div>

      {/* ── PLACE layer — overlays the Create layer when active ── */}
      {screen === "place" && (
      <div style={shell}>
        <MobileHeader
          subtitle={tp("stepPlace")}
          backLabel={tp("back")}
          onBack={onReset}
        trailing={
          total > 1 ? (
            <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
              <button type="button" onClick={() => setPreviewPage((p) => Math.max(1, p - 1))} style={{ ...iconBtn, width: 34, height: 34 }} aria-label={tp("prevPage")}>
                <IconChevron size={14} style={{ transform: "rotate(180deg)" }} />
              </button>
              <span className="pp-mono" style={{ fontSize: 11.5, minWidth: 34, textAlign: "center" }}>{previewPage}/{total}</span>
              <button type="button" onClick={() => setPreviewPage((p) => Math.min(total, p + 1))} style={{ ...iconBtn, width: 34, height: 34 }} aria-label={tp("nextPage")}>
                <IconChevron size={14} />
              </button>
            </div>
          ) : undefined
        }
      />

      <div style={{ flex: 1, position: "relative", overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", padding: 14, background: "repeating-linear-gradient(45deg, rgba(127,127,127,0.04) 0 1px, transparent 1px 16px), var(--bg-2)" }}>
        {!thumb ? (
          <div style={{ display: "flex", alignItems: "center", gap: 8, color: "var(--text-3)" }}>
            <Spinner size={18} /> {t("processing")}
          </div>
        ) : (
          <div ref={pageWrapRef} style={{ position: "relative", width: Math.min(thumb.w, 460), maxWidth: "100%", aspectRatio: `${thumb.w} / ${thumb.h}`, userSelect: "none" }}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={thumb.url} alt={`page ${previewPage}`} style={{ display: "block", width: "100%", height: "100%", borderRadius: 4, boxShadow: "0 10px 30px -12px rgba(0,0,0,0.6)" }} draggable={false} />
            {instances.map((inst, i) => {
              const isSel = i === selected;
              return (
                <div key={i} style={{ position: "absolute", left: `${inst.placement.xPct}%`, top: `${inst.placement.yPct}%`, width: `${inst.placement.wPct}%`, touchAction: "none" }}>
                  <div style={{ position: "relative", borderRadius: 4, border: isSel ? "1.5px solid var(--indigo)" : "1px dashed rgba(107,92,231,0.5)", background: isSel ? "rgba(107,92,231,0.06)" : "transparent", padding: 4 }} onPointerDown={(e) => startMove(e, i)}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={inst.pngDataUrl} alt="signature" style={{ display: "block", width: "100%" }} draggable={false} />
                    {isSel && (
                      <>
                        <button type="button" onPointerDown={(e) => e.stopPropagation()} onClick={() => removeInstance(i)} aria-label={tp("deleteSig")} style={{ position: "absolute", top: -14, right: -14, width: 30, height: 30, borderRadius: "50%", background: "var(--rose, #F43F5E)", border: "2px solid var(--card)", color: "white", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <IconTrash size={14} />
                        </button>
                        <div onPointerDown={(e) => startResize(e, i)} style={{ position: "absolute", right: -10, bottom: -10, width: 22, height: 22, borderRadius: 5, background: "white", border: "2px solid var(--indigo)", touchAction: "none", cursor: "nwse-resize" }} />
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <div style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: 999, background: "rgba(15,15,15,0.62)", backdropFilter: "blur(6px)", border: "1px solid var(--line-2)", fontSize: 11, color: "var(--text-2)" }}>
          {tp("dragHint")}
        </div>
      </div>

      {/* per-signature scope toggle */}
      {sel && (
        <div style={{ flexShrink: 0, display: "flex", justifyContent: "center", padding: "10px 12px 0", background: "var(--card)" }}>
          <div style={{ display: "flex", gap: 2, borderRadius: 10, padding: 4, background: "var(--bg-2)", border: "1px solid var(--line)" }}>
            {(["current", "all"] as const).map((s) => {
              const isActive = s === "all" ? sel.scope.mode === "all" : sel.scope.mode === "current";
              return (
                <button key={s} type="button" onClick={() => setScope(selected, s)} style={{ minHeight: 40, padding: "0 16px", borderRadius: 7, fontSize: 12.5, fontWeight: 500, border: 0, background: isActive ? "rgba(107,92,231,0.16)" : "transparent", color: isActive ? "#BFB5FF" : "var(--text-2)" }}>
                  {s === "current" ? tp("scopeThis") : tp("scopeAll")}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {errorMsg && (
        <div style={{ padding: "10px 12px 0", background: "var(--card)" }}>
          <ErrorBanner message={errorMsg} onRetry={() => setErrorMsg(undefined)} />
        </div>
      )}

      {/* sticky bottom actions */}
      <div style={{ flexShrink: 0, background: "var(--card)", borderTop: "1px solid var(--line)", padding: 12, paddingBottom: "calc(12px + env(safe-area-inset-bottom))", display: "flex", flexDirection: "column", gap: 10 }}>
        <button type="button" className="pp-btn pp-btn-lg" style={{ width: "100%", justifyContent: "center" }} disabled={instances.length === 0 || saving} onClick={save}>
          {saving ? <><Spinner /> {t("processing")}</> : <><IconDownload size={15} /> {tp("saveDownload")}</>}
        </button>
        <button type="button" className="pp-btn pp-btn-ghost" style={{ width: "100%", justifyContent: "center" }} onClick={addAnother}>
          <IconPlus size={14} /> {tp("addSignature")}
        </button>
      </div>
      </div>
      )}
    </>
  );
}
