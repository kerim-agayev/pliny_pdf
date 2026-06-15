"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { useSession } from "@/lib/auth/client";
import { useEditorStore } from "@/lib/stores/editorStore";
import { openEditor, saveEditor, closeEditor, EditorError, type BlockChange, type AnnotationChange } from "@/lib/api/editor";
import { editorMaxBytes, editorMaxMB, editorMaxPages, getToolLimits, effectivePlan, bytesToMB } from "@/lib/limits";
import { isPdfEncrypted } from "@/lib/validation";
import { readPageCount } from "@/lib/pdf/common";
import { LimitBadge } from "@/components/shared/LimitBadge";
import { useDailyUsage } from "@/lib/hooks/useDailyUsage";
import { analytics } from "@/lib/analytics";
import { downloadBlob, baseName } from "@/lib/format";
import {
  PlinyMark, IconArrow, IconDownload, IconCloudUp, IconFile, IconAlert, IconRefresh, IconSparkle, IconClock,
  IconUndo, IconRedo, IconChevron,
} from "@/components/shared/icons";
import { PasswordModal } from "@/components/shared/PasswordModal";
import { Spinner } from "@/components/tools/Spinner";
import { useMediaQuery } from "@/lib/hooks/useMediaQuery";
import { EditorToolbar } from "./EditorToolbar";
import { MobileToolbar } from "./MobileToolbar";
import { PageThumbnails } from "./PageThumbnails";
import { EditorCanvas } from "./EditorCanvas";
import { EditorStatusBar } from "./EditorStatusBar";
import { FindReplaceModal } from "./FindReplaceModal";
import { SessionWarning } from "./SessionWarning";

type Plan = "free" | "pro" | null;

// Wave 8E — Edit PDF z-index hierarchy (keep new overlays inside this scheme).
// Values are deliberately spread so new layers can slot in without renumbering.
//    1   snap guides (SnapGuideOverlay)
//    2   overlay delete/resize handles
//   10   highlight color palette
//   20   comment bubble · mobile hint/pages buttons
//   30   draft text input box
//   40   toolbar popovers (shapes / stamp / marks)
//   50   editor shell (this component)
//   55   session-expiry warning banner
//   60   find / scanned-PDF modal
//   70   session-expired modal
//   80   confirm dialog · context menu · link dialog
//   90   mobile bottom sheet
//  100   text block while being dragged
const SHELL: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 50, background: "var(--bg)", color: "var(--text)",
  display: "flex", flexDirection: "column", overflow: "hidden",
};

// mobile secondary-row control button (undo/redo/page-nav)
const mctl = (disabled: boolean): React.CSSProperties => ({
  width: 32, height: 32, borderRadius: 8, background: "transparent", border: 0,
  color: "var(--text-2)", display: "flex", alignItems: "center", justifyContent: "center",
  opacity: disabled ? 0.35 : 1, cursor: disabled ? "not-allowed" : "pointer",
});

export function EditPdf() {
  const t = useTranslations("ToolPages.editPdf");
  const { data: session } = useSession();
  const plan = ((session?.user as { plan?: "free" | "pro" })?.plan ?? null) as Plan;

  // Wave 9A — limit badge data for the (custom) uploader + inline over-limit state.
  const badgePlan = effectivePlan(plan);
  const limits = getToolLimits("edit-pdf", badgePlan);
  const anonLimits = getToolLimits("edit-pdf", "anon");
  const freeLimits = getToolLimits("edit-pdf", "free");
  const usage = useDailyUsage(true);
  const [over, setOver] = useState<{ unit: "mb" | "pages"; value: number } | null>(null);

  const s = useEditorStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const [glow, setGlow] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [warnDismissed, setWarnDismissed] = useState(false);
  const [pwFile, setPwFile] = useState<File | null>(null);
  const [showThumbs, setShowThumbs] = useState(false);
  const [hintSeen, setHintSeen] = useState(false);
  const [saving, setSaving] = useState(false); // Wave 8E: in-flight guard for save/download (drives button UI)
  const savingRef = useRef(false); // synchronous re-entry guard (avoids double-fire before state flushes)
  const isMobile = useMediaQuery("(max-width: 767px)");
  const warnedRef = useRef(false);

  // session countdown tick (drives the status-bar timer + expiry warning)
  useEffect(() => {
    if (!s.sessionExpiresAt) return;
    warnedRef.current = false;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, [s.sessionExpiresAt]);

  // one-shot toast as the session crosses the 5-minute mark
  useEffect(() => {
    if (!s.sessionExpiresAt || warnedRef.current) return;
    const left = s.sessionExpiresAt - now;
    if (left <= 5 * 60 * 1000 && left > 0) {
      warnedRef.current = true;
      toast.warning(t("sessionExpiringTitle"));
    }
  }, [now, s.sessionExpiresAt, t]);

  // teardown on unmount — read live state so we close the actual session
  useEffect(() => () => {
    const id = useEditorStore.getState().sessionId;
    if (id) closeEditor(id);
  }, []);

  const changeList = useCallback((): BlockChange[] => {
    const list = Array.from(s.changes.values());
    // Merge blockPositions overrides into their BlockChange entries (or create new entries).
    for (const [blockId, pos] of Object.entries(s.blockPositions)) {
      const existing = list.find((c) => c.blockId === blockId);
      if (existing) {
        existing.x = pos.x;
        existing.y = pos.y;
      } else {
        list.push({ blockId, x: pos.x, y: pos.y });
      }
    }
    // Merge per-block underline (client-only visual style) so it burns into the PDF.
    for (const [blockId, style] of Object.entries(s.blockStyles)) {
      if (!style?.underline) continue;
      const existing = list.find((c) => c.blockId === blockId);
      if (existing) existing.underline = true;
      else list.push({ blockId, underline: true });
    }
    return list;
  }, [s.changes, s.blockPositions, s.blockStyles]);
  // overlay annotations serialized for the server to burn into the PDF (Wave 4C)
  const annotationList = useCallback(
    (): AnnotationChange[] =>
      s.annotations
        .filter((a) => a.type !== "underline")
        .map((a) => ({
          type: a.type, pageNum: a.pageNum, x: a.x, y: a.y, w: a.w, h: a.h,
          color: a.color, strokeWidth: a.strokeWidth, shapeType: a.shapeType,
          fill: a.fill, markType: a.markType,
          path: a.path, x2: a.x2, y2: a.y2, text: a.text,
          imageId: a.imageId, label: a.label, uri: a.uri,
        }) as AnnotationChange),
    [s.annotations],
  );

  const handleSave = useCallback(async (download: boolean) => {
    if (!s.sessionId || savingRef.current) return; // ignore re-entry while a save is in flight
    savingRef.current = true;
    setSaving(true);
    try {
      const blob = await saveEditor(s.sessionId, changeList(), annotationList());
      s.markSaved();
      analytics.editorSaved(s.changes.size);
      const name = `${baseName(s.fileName) || "edited"}.pdf`;
      if (download) downloadBlob(blob, name);
      else toast.success(t("savedToast"));
    } catch (e) {
      if (e instanceof EditorError && e.status === 410) toast.error(t("sessionExpired"));
      else toast.error(e instanceof Error ? e.message : t("saveFailed"));
    } finally {
      savingRef.current = false;
      setSaving(false);
    }
  }, [s, changeList, annotationList, t]);

  // keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      const editable = (e.target as HTMLElement)?.isContentEditable || ["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName);
      if (k === "s") { e.preventDefault(); handleSave(false); }
      else if (k === "d") { e.preventDefault(); handleSave(true); }
      else if (k === "z" && !editable) { e.preventDefault(); e.shiftKey ? s.redo() : s.undo(); }
      else if (k === "y" && !editable) { e.preventDefault(); s.redo(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSave]); // eslint-disable-line react-hooks/exhaustive-deps

  // Upload + parse a (decrypted, validated) file and open the editor session.
  const proceed = useCallback(async (file: File) => {
    // Block over-page files client-side before upload (covers the post-unlock path too).
    const pageCount = await readPageCount(file).catch(() => 0);
    if (pageCount > editorMaxPages(plan)) { setOver({ unit: "pages", value: pageCount }); return; }
    s.startLoading(file.name);
    setWarnDismissed(false);
    try {
      const res = await openEditor(file);
      s.openSession(res, plan);
      analytics.editorOpened(res.pageCount);
    } catch (e) {
      if (e instanceof EditorError) {
        // Friendly, specific messages — never the generic "corrupted" modal for these.
        if (e.code === "tooManyPages") { toast.error(t("tooManyPages", { limit: (e.data?.limitPages as number) ?? 0 })); s.reset(); return; }
        if (e.code === "fileTooLarge" || e.status === 413) { toast.error(t("fileTooLarge", { mb: (e.data?.limitMB as number) ?? editorMaxMB(plan) })); s.reset(); return; }
        if (e.status === 429) { toast.error(t("rateLimited")); s.reset(); return; }
        // Backend fallback for an encrypted PDF that slipped past the client check.
        if (e.status === 401 && e.code === "passwordRequired") { s.reset(); setPwFile(file); return; }
      }
      s.failParse("parse");
    }
  }, [plan, s, t]);

  const openFile = useCallback(async (file: File) => {
    setOver(null);
    if (!file.name.toLowerCase().endsWith(".pdf")) { toast.error(t("pdfOnly")); return; }
    if (file.size > editorMaxBytes(plan)) { setOver({ unit: "mb", value: bytesToMB(file.size) }); return; }
    // Encrypted PDFs are unlocked in-browser first (same flow as every other tool),
    // so the editor backend only ever receives a decrypted file.
    let encrypted = false;
    try { encrypted = await isPdfEncrypted(await file.arrayBuffer()); }
    catch { toast.error(t("errorDesc")); return; }
    if (encrypted) { setPwFile(file); return; }
    proceed(file);
  }, [plan, t, proceed]);

  const pickFile = () => fileInput.current?.click();
  const remainingMs = s.sessionExpiresAt ? s.sessionExpiresAt - now : 0;
  const showWarning = s.phase === "active" && s.sessionExpiresAt !== null && remainingMs <= 5 * 60 * 1000 && remainingMs > 0 && !warnDismissed;
  const expired = s.phase === "active" && s.sessionExpiresAt !== null && remainingMs <= 0;

  // ---------- header ----------
  const Header = (
    <header style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "0 18px", height: 56, flexShrink: 0, background: "var(--card)", borderBottom: "1px solid var(--line)" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
        <Link href="/tools" style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 13.5, color: "var(--text-2)" }}>
          <IconArrow size={15} style={{ transform: "rotate(180deg)" }} /> {t("backToTools")}
        </Link>
        <div style={{ width: 1, height: 22, background: "var(--line)" }} />
        <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
          <PlinyMark size={22} color="var(--text)" />
          <div style={{ display: "flex", alignItems: "baseline", gap: 8 }}>
            <span className="pp-mono" style={{ fontSize: 13, color: "var(--text)" }}>{s.fileName || "—"}</span>
            <span style={{ fontSize: 13, color: "var(--text-3)" }}>— {t("title")}</span>
          </div>
        </div>
      </div>
      {s.phase === "active" && (
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <span className="pp-mono" style={{ fontSize: 11, color: "var(--text-3)" }}>{s.hasUnsavedChanges ? t("unsaved") : t("saved")}</span>
          <button type="button" className="pp-btn pp-btn-ghost" style={{ padding: "8px 14px" }} disabled={saving} onClick={() => handleSave(true)}>
            <IconDownload size={14} /> {t("download")}
            <span className="pp-mono" style={{ fontSize: 10, padding: "1px 5px", background: "rgba(127,127,127,0.16)", borderRadius: 4, marginLeft: 4 }}>⌘D</span>
          </button>
          <button type="button" className="pp-btn" style={{ padding: "8px 16px", position: "relative" }} disabled={saving} onClick={() => handleSave(false)}>
            {s.hasUnsavedChanges && !saving && <span style={{ position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: "50%", background: "#FACC15", boxShadow: "0 0 6px #FACC15" }} />}
            {saving ? <><Spinner size={13} /> {t("saving")}</> : t("save")}
            {!saving && <span className="pp-mono" style={{ fontSize: 10, padding: "1px 5px", background: "rgba(255,255,255,0.16)", borderRadius: 4, marginLeft: 4 }}>⌘S</span>}
          </button>
        </div>
      )}
    </header>
  );

  const hiddenInput = (
    <input ref={fileInput} type="file" accept="application/pdf,.pdf" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ""; if (f) openFile(f); }} />
  );

  const pwModal = pwFile ? (
    <PasswordModal
      file={pwFile}
      onUnlocked={(decrypted) => { setPwFile(null); proceed(decrypted); }}
      onCancel={() => { setPwFile(null); }}
    />
  ) : null;

  // ---------- EMPTY ----------
  if (s.phase === "empty") {
    return (
      <div style={SHELL}>
        {Header}
        {hiddenInput}
        <div
          style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", padding: 40, background: "radial-gradient(60% 50% at 50% 30%, rgba(107,92,231,0.07), rgba(107,92,231,0) 70%), var(--bg)" }}
          onDragEnter={(e) => { e.preventDefault(); setGlow(true); }}
          onDragOver={(e) => e.preventDefault()}
          onDragLeave={(e) => { e.preventDefault(); setGlow(false); }}
          onDrop={(e) => { e.preventDefault(); setGlow(false); const f = e.dataTransfer.files?.[0]; if (f) openFile(f); }}
        >
          <div
            role="button"
            tabIndex={0}
            onClick={pickFile}
            onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") pickFile(); }}
            style={{ width: 620, maxWidth: "92%", border: `1.5px dashed ${over ? "rgba(239,68,68,0.5)" : glow ? "var(--indigo)" : "var(--line-2)"}`, borderRadius: 22, padding: "64px 48px", textAlign: "center", cursor: "pointer", background: over ? "rgba(239,68,68,0.06)" : glow ? "var(--indigo-dim)" : "linear-gradient(180deg, rgba(127,127,127,0.02), rgba(127,127,127,0))" }}
          >
            <div style={{ width: 76, height: 76, borderRadius: 19, margin: "0 auto 24px", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", color: "#60A5FA", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IconCloudUp size={32} sw={1.6} />
            </div>
            <h1 style={{ fontSize: 26, letterSpacing: "-0.025em", marginBottom: 10 }}>{t("emptyTitle")}</h1>
            <p style={{ fontSize: 14.5, color: "var(--text-2)", marginBottom: 8 }}>{t("emptyDesc")}</p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 22 }}>
              <span className="pp-mono" style={{ fontSize: 11.5, color: "var(--text-3)" }}>{t("pdfOnly")}</span>
            </div>
            <div style={{ marginBottom: 22 }}>
              <button type="button" className="pp-btn pp-btn-lg" onClick={(e) => { e.stopPropagation(); pickFile(); }}><IconFile size={15} /> {t("browse")}</button>
            </div>
            <div style={{ display: "flex", justifyContent: "center" }} onClick={(e) => e.stopPropagation()}>
              <LimitBadge
                tier={badgePlan === "anon" ? "anonymous" : "free"}
                size={limits.mb}
                count={limits.count}
                unit={limits.unit}
                cloud={limits.cloud}
                quotaUsed={usage?.used}
                quotaTotal={usage?.total ?? undefined}
                over={over != null}
                overUnit={over?.unit}
                fileSize={over?.unit === "mb" ? over.value : 0}
                filePages={over?.unit === "pages" ? over.value : undefined}
                signedInSize={freeLimits.mb}
                signedInCount={freeLimits.count}
                anonSize={anonLimits.mb}
                anonCount={anonLimits.count}
              />
            </div>
          </div>
          <div className="pp-badge cloud" style={{ marginTop: 28, padding: "10px 16px", fontSize: 13, borderRadius: 999, maxWidth: 560 }}>
            <span className="pp-dot" style={{ width: 8, height: 8 }} /> {t("cloudNote")}
          </div>
        </div>
        {pwModal}
      </div>
    );
  }

  // ---------- LOADING ----------
  if (s.phase === "loading") {
    return (
      <div style={SHELL}>
        {Header}
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center", background: "var(--bg-2)" }}>
          <div style={{ background: "var(--card)", border: "1px solid var(--line-2)", borderRadius: 14, padding: "22px 26px", width: 380, boxShadow: "0 30px 60px -24px rgba(0,0,0,0.6)" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 14 }}>
              <Spinner size={20} />
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 500 }}>{t("parsing")}</div>
                <div className="pp-mono" style={{ fontSize: 11.5, color: "var(--text-3)", marginTop: 2 }}>{t("uploadedProcessing")}</div>
              </div>
            </div>
            <div className="pp-progress" data-indeterminate><span /></div>
          </div>
        </div>
      </div>
    );
  }

  // ---------- ERROR (parse failed) ----------
  if (s.phase === "error") {
    return (
      <div style={SHELL}>
        {Header}
        {hiddenInput}
        <div style={{ flex: 1, position: "relative", background: "var(--bg)" }}>
          <div style={{ position: "absolute", inset: 0, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.4)" }}>
            <div className="pp-card" style={{ width: 440, padding: 28 }}>
              <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(244,63,94,0.16)", color: "#F87171", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
                <IconAlert size={22} sw={1.7} />
              </div>
              <h3 style={{ fontSize: 20, letterSpacing: "-0.02em", marginBottom: 8 }}>{t("errorTitle")}</h3>
              <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 22 }}>{t("errorDesc")}</p>
              <button type="button" className="pp-btn pp-btn-lg" style={{ width: "100%", justifyContent: "center", marginBottom: 12 }} onClick={() => { s.reset(); }}>
                <IconRefresh size={15} /> {t("tryAnother")}
              </button>
              <div style={{ textAlign: "center" }}>
                <Link href="/support" style={{ fontSize: 13, color: "#BFB5FF" }}>{t("contactSupport")} →</Link>
              </div>
            </div>
          </div>
        </div>
        {pwModal}
      </div>
    );
  }

  // ---------- ACTIVE / SCANNED ----------
  return (
    <div style={SHELL}>
      {Header}
      {hiddenInput}
      {!isMobile && <EditorToolbar />}
      {isMobile && (
        <div style={{ display: "flex", alignItems: "center", gap: 4, padding: "0 12px", height: 44, flexShrink: 0, background: "var(--card)", borderBottom: "1px solid var(--line)" }}>
          <button type="button" title={t("undo")} disabled={!s.undoStack.length} onClick={s.undo} style={mctl(!s.undoStack.length)}><IconUndo size={17} /></button>
          <button type="button" title={t("redo")} disabled={!s.redoStack.length} onClick={s.redo} style={mctl(!s.redoStack.length)}><IconRedo size={17} /></button>
          <div style={{ flex: 1 }} />
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginLeft: 6 }}>
            <button type="button" title={t("prevPage")} disabled={s.currentPage <= 0} onClick={() => s.setCurrentPage(s.currentPage - 1)} style={mctl(s.currentPage <= 0)}><IconChevron size={15} style={{ transform: "rotate(180deg)" }} /></button>
            <span className="pp-mono" style={{ fontSize: 12, color: "var(--text)", minWidth: 38, textAlign: "center" }}>{s.currentPage + 1}/{s.pageCount}</span>
            <button type="button" title={t("nextPage")} disabled={s.currentPage >= s.pageCount - 1} onClick={() => s.setCurrentPage(s.currentPage + 1)} style={mctl(s.currentPage >= s.pageCount - 1)}><IconChevron size={15} /></button>
          </div>
        </div>
      )}
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        {showThumbs && <div className="pp-ed-drawer-backdrop" onClick={() => setShowThumbs(false)} />}
        <PageThumbnails mobileOpen={showThumbs} onPick={() => setShowThumbs(false)} />
        <EditorCanvas />
        {isMobile && (
          <>
            {!hintSeen && (
              <div onClick={() => setHintSeen(true)} style={{ position: "absolute", top: 12, left: "50%", transform: "translateX(-50%)", display: "flex", alignItems: "center", gap: 7, padding: "6px 12px", borderRadius: 999, background: "rgba(15,15,15,0.7)", backdropFilter: "blur(6px)", border: "1px solid var(--line-2)", fontSize: 11.5, color: "var(--text-2)", zIndex: 20, pointerEvents: "auto" }}>
                {t("pinchSwipeHint")}
              </div>
            )}
            <button type="button" onClick={() => setShowThumbs((v) => !v)} style={{ position: "absolute", left: 14, bottom: 14, height: 44, padding: "0 16px", borderRadius: 999, background: "var(--card)", border: "1px solid var(--line-2)", color: "var(--text)", fontSize: 13, fontWeight: 500, display: "flex", alignItems: "center", gap: 8, boxShadow: "0 10px 26px -10px rgba(0,0,0,0.55)", cursor: "pointer", zIndex: 20 }}>
              <IconFile size={15} /> {t("pages")}
            </button>
          </>
        )}
      </div>
      {!isMobile && (
        <EditorStatusBar
          remainingMs={remainingMs}
          extra={
            <button type="button" className="pp-ed-mobileonly pp-edtool" onClick={() => setShowThumbs((v) => !v)} style={{ alignItems: "center", gap: 5, height: 26, padding: "0 9px", borderRadius: 6, background: "var(--bg-2)", border: "1px solid var(--line)", color: "var(--text-2)", fontSize: 11.5, cursor: "pointer" }}>
              {t("pages")}
            </button>
          }
        />
      )}
      {isMobile && <MobileToolbar />}

      {showWarning && <SessionWarning onSave={() => handleSave(false)} onDismiss={() => setWarnDismissed(true)} />}
      {s.findReplaceOpen && <FindReplaceModal />}

      {s.phase === "scanned" && (
        <div style={{ position: "absolute", inset: 0, zIndex: 60, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="pp-card" style={{ width: 460, padding: 28 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(245,158,11,0.16)", color: "#FBBF24", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
              <IconAlert size={22} sw={1.7} />
            </div>
            <h3 style={{ fontSize: 20, letterSpacing: "-0.02em", marginBottom: 8 }}>{t("scannedTitle")}</h3>
            <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 20 }}>{t("scannedDesc")}</p>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <Link href="/ocr-pdf" className="pp-btn pp-btn-lg" style={{ justifyContent: "center" }}>
                <IconSparkle size={15} sw={1.7} /> {t("goToOcr")} <IconArrow size={14} />
              </Link>
              <button type="button" className="pp-btn pp-btn-ghost pp-btn-lg" style={{ justifyContent: "center" }} onClick={() => useEditorStore.setState({ phase: "active" })}>
                {t("continueAnyway")}
              </button>
            </div>
            <p style={{ fontSize: 11.5, color: "var(--text-3)", textAlign: "center", marginTop: 14, lineHeight: 1.5 }}>{t("scannedNote")}</p>
          </div>
        </div>
      )}

      {expired && (
        <div style={{ position: "absolute", inset: 0, zIndex: 70, background: "rgba(0,0,0,0.55)", backdropFilter: "blur(2px)", display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="pp-card" style={{ width: 440, padding: 28 }}>
            <div style={{ width: 48, height: 48, borderRadius: 12, background: "rgba(245,158,11,0.16)", color: "#FBBF24", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: 18 }}>
              <IconClock size={22} sw={1.7} />
            </div>
            <h3 style={{ fontSize: 20, letterSpacing: "-0.02em", marginBottom: 8 }}>{t("expiredTitle")}</h3>
            <p style={{ fontSize: 14, color: "var(--text-2)", lineHeight: 1.6, marginBottom: 22 }}>{t("expiredDesc")}</p>
            <button type="button" className="pp-btn pp-btn-lg" style={{ width: "100%", justifyContent: "center" }} onClick={() => s.reset()}>
              <IconRefresh size={15} /> {t("reopen")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
