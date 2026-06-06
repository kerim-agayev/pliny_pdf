"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { Link } from "@/i18n/navigation";
import { useSession } from "@/lib/auth/client";
import { useEditorStore } from "@/lib/stores/editorStore";
import { openEditor, saveEditor, closeEditor, EditorError, type BlockChange } from "@/lib/api/editor";
import { editorMaxBytes, editorMaxMB } from "@/lib/limits";
import { isPdfEncrypted } from "@/lib/validation";
import { analytics } from "@/lib/analytics";
import { downloadBlob, baseName } from "@/lib/format";
import {
  PlinyMark, IconArrow, IconDownload, IconCloudUp, IconFile, IconAlert, IconRefresh, IconSparkle,
} from "@/components/shared/icons";
import { PasswordModal } from "@/components/shared/PasswordModal";
import { Spinner } from "@/components/tools/Spinner";
import { EditorToolbar } from "./EditorToolbar";
import { PageThumbnails } from "./PageThumbnails";
import { EditorCanvas } from "./EditorCanvas";
import { EditorStatusBar } from "./EditorStatusBar";
import { FindReplaceModal } from "./FindReplaceModal";
import { SessionWarning } from "./SessionWarning";

type Plan = "free" | "pro" | null;

const SHELL: React.CSSProperties = {
  position: "fixed", inset: 0, zIndex: 50, background: "var(--bg)", color: "var(--text)",
  display: "flex", flexDirection: "column", overflow: "hidden",
};

export function EditPdf() {
  const t = useTranslations("ToolPages.editPdf");
  const { data: session } = useSession();
  const plan = ((session?.user as { plan?: "free" | "pro" })?.plan ?? null) as Plan;

  const s = useEditorStore();
  const fileInput = useRef<HTMLInputElement>(null);
  const [glow, setGlow] = useState(false);
  const [now, setNow] = useState(() => Date.now());
  const [warnDismissed, setWarnDismissed] = useState(false);
  const [pwFile, setPwFile] = useState<File | null>(null);
  const [showThumbs, setShowThumbs] = useState(false);
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

  const changeList = useCallback((): BlockChange[] => Array.from(s.changes.values()), [s.changes]);

  const handleSave = useCallback(async (download: boolean) => {
    if (!s.sessionId) return;
    try {
      const blob = await saveEditor(s.sessionId, changeList());
      s.markSaved();
      analytics.editorSaved(s.changes.size);
      const name = `${baseName(s.fileName) || "edited"}.pdf`;
      if (download) downloadBlob(blob, name);
      else toast.success(t("savedToast"));
    } catch (e) {
      if (e instanceof EditorError && e.status === 410) toast.error(t("sessionExpired"));
      else toast.error(e instanceof Error ? e.message : t("saveFailed"));
    }
  }, [s, changeList, t]);

  // keyboard shortcuts
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (!mod) return;
      const k = e.key.toLowerCase();
      const editable = (e.target as HTMLElement)?.isContentEditable || ["INPUT", "TEXTAREA"].includes((e.target as HTMLElement)?.tagName);
      if (k === "s") { e.preventDefault(); handleSave(false); }
      else if (k === "d") { e.preventDefault(); handleSave(true); }
      else if (k === "h") { e.preventDefault(); s.openFindReplace(); }
      else if (k === "z" && !editable) { e.preventDefault(); e.shiftKey ? s.redo() : s.undo(); }
      else if (k === "y" && !editable) { e.preventDefault(); s.redo(); }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [handleSave]); // eslint-disable-line react-hooks/exhaustive-deps

  // Upload + parse a (decrypted, validated) file and open the editor session.
  const proceed = useCallback(async (file: File) => {
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
    if (!file.name.toLowerCase().endsWith(".pdf")) { toast.error(t("pdfOnly")); return; }
    if (file.size > editorMaxBytes(plan)) { toast.error(t("fileTooLarge", { mb: editorMaxMB(plan) })); return; }
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
          <button type="button" className="pp-btn pp-btn-ghost" style={{ padding: "8px 14px" }} onClick={() => handleSave(true)}>
            <IconDownload size={14} /> {t("download")}
            <span className="pp-mono" style={{ fontSize: 10, padding: "1px 5px", background: "rgba(127,127,127,0.16)", borderRadius: 4, marginLeft: 4 }}>⌘D</span>
          </button>
          <button type="button" className="pp-btn" style={{ padding: "8px 16px", position: "relative" }} onClick={() => handleSave(false)}>
            {s.hasUnsavedChanges && <span style={{ position: "absolute", top: 6, right: 6, width: 7, height: 7, borderRadius: "50%", background: "#FACC15", boxShadow: "0 0 6px #FACC15" }} />}
            {t("save")}
            <span className="pp-mono" style={{ fontSize: 10, padding: "1px 5px", background: "rgba(255,255,255,0.16)", borderRadius: 4, marginLeft: 4 }}>⌘S</span>
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
            style={{ width: 620, maxWidth: "92%", border: `1.5px dashed ${glow ? "var(--indigo)" : "var(--line-2)"}`, borderRadius: 22, padding: "64px 48px", textAlign: "center", cursor: "pointer", background: glow ? "var(--indigo-dim)" : "linear-gradient(180deg, rgba(127,127,127,0.02), rgba(127,127,127,0))" }}
          >
            <div style={{ width: 76, height: 76, borderRadius: 19, margin: "0 auto 24px", background: "rgba(59,130,246,0.12)", border: "1px solid rgba(59,130,246,0.3)", color: "#60A5FA", display: "flex", alignItems: "center", justifyContent: "center" }}>
              <IconCloudUp size={32} sw={1.6} />
            </div>
            <h1 style={{ fontSize: 26, letterSpacing: "-0.025em", marginBottom: 10 }}>{t("emptyTitle")}</h1>
            <p style={{ fontSize: 14.5, color: "var(--text-2)", marginBottom: 8 }}>{t("emptyDesc")}</p>
            <div style={{ display: "inline-flex", alignItems: "center", gap: 8, marginBottom: 26 }}>
              <span className="pp-mono" style={{ fontSize: 11.5, color: "var(--text-3)" }}>{t("pdfOnly")}</span>
              <span style={{ color: "var(--line-2)" }}>·</span>
              <span className="pp-badge" style={{ fontSize: 11, padding: "2px 9px" }}>{t("maxNote", { mb: editorMaxMB(plan) })}</span>
            </div>
            <div>
              <button type="button" className="pp-btn pp-btn-lg" onClick={(e) => { e.stopPropagation(); pickFile(); }}><IconFile size={15} /> {t("browse")}</button>
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
      <EditorToolbar />
      <div style={{ flex: 1, display: "flex", overflow: "hidden", position: "relative" }}>
        {showThumbs && <div className="pp-ed-drawer-backdrop" onClick={() => setShowThumbs(false)} />}
        <PageThumbnails mobileOpen={showThumbs} onPick={() => setShowThumbs(false)} />
        <EditorCanvas />
      </div>
      <EditorStatusBar
        remainingMs={remainingMs}
        extra={
          <button type="button" className="pp-ed-mobileonly pp-edtool" onClick={() => setShowThumbs((v) => !v)} style={{ alignItems: "center", gap: 5, height: 26, padding: "0 9px", borderRadius: 6, background: "var(--bg-2)", border: "1px solid var(--line)", color: "var(--text-2)", fontSize: 11.5, cursor: "pointer" }}>
            {t("pages")}
          </button>
        }
      />

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
    </div>
  );
}
