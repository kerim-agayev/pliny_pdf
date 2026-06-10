"use client";

import { useEffect, useMemo, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { useEditorStore, computeMatches } from "@/lib/stores/editorStore";
import { findReplace } from "@/lib/api/editor";
import { IconSearch, IconChevron, IconCheck, IconX } from "@/components/shared/icons";
import { Spinner } from "@/components/tools/Spinner";

export function FindReplaceModal() {
  const t = useTranslations("ToolPages.editPdf");
  const sessionId = useEditorStore((s) => s.sessionId);
  const pages = useEditorStore((s) => s.pages);
  const replacePages = useEditorStore((s) => s.replacePages);
  const bumpRender = useEditorStore((s) => s.bumpRender);
  const close = useEditorStore((s) => s.closeFindReplace);
  const findIndex = useEditorStore((s) => s.findIndex);
  const setFindIndex = useEditorStore((s) => s.setFindIndex);
  const setFindQuery = useEditorStore((s) => s.setFindQuery);
  const setCurrentPage = useEditorStore((s) => s.setCurrentPage);

  const [find, setFind] = useState("");
  const [replace, setReplace] = useState("");
  const [caseSensitive, setCaseSensitive] = useState(false);
  const [wholeWord, setWholeWord] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<number | null>(null);

  // live match preview — recomputed from the parsed text as the user types
  const matches = useMemo(() => computeMatches(pages, find, caseSensitive), [pages, find, caseSensitive]);
  const total = matches.length;

  // push the live query into the store so EditorCanvas can paint the highlights
  useEffect(() => {
    setFindQuery(find, caseSensitive);
    setDone(null);
  }, [find, caseSensitive, setFindQuery]);

  // close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [close]);

  function jump(dir: 1 | -1) {
    if (!total) return;
    const next = (findIndex + dir + total) % total;
    setFindIndex(next);
    setCurrentPage(matches[next].pageNum);
  }

  async function run() {
    if (!sessionId || !find) return;
    setBusy(true);
    try {
      const res = await findReplace(sessionId, { find, replace, caseSensitive, wholeWord });
      replacePages(res.pages);
      bumpRender(); // cache-bust the page <img> so the replaced text actually re-renders
      setDone(res.replacements);
      toast.success(t("replacedToast", { count: res.replacements }));
    } catch (e) {
      toast.error(e instanceof Error ? e.message : t("saveFailed"));
    } finally {
      setBusy(false);
    }
  }

  // Small floating panel pinned top-right (no dimming backdrop) so the on-page
  // match highlights stay fully visible behind it.
  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 60, pointerEvents: "none", display: "flex", justifyContent: "flex-end", alignItems: "flex-start", padding: 14 }}>
      <div className="pp-card" style={{ width: 320, maxWidth: "94%", padding: 16, pointerEvents: "auto", boxShadow: "0 30px 70px -24px rgba(0,0,0,0.7)" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 16 }}>
          <h3 style={{ fontSize: 17, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 8 }}>
            <IconSearch size={15} color="var(--text-2)" /> {t("findTitle")}
          </h3>
          <button type="button" onClick={close} aria-label={t("close")} style={{ background: "transparent", border: 0, color: "var(--text-3)", cursor: "pointer", padding: 2 }}>
            <IconX size={16} />
          </button>
        </div>

        <label style={{ fontSize: 12, color: "var(--text-2)", display: "block", marginBottom: 6 }}>{t("find")}</label>
        <div style={{ position: "relative", marginBottom: 14 }}>
          <input className="pp-input" value={find} onChange={(e) => setFind(e.target.value)} style={{ paddingRight: 124 }} autoFocus />
          {find && (
            <div style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", display: "flex", alignItems: "center", gap: 6 }}>
              <span className="pp-mono" style={{ fontSize: 11, color: total ? "#F97316" : "var(--text-3)" }}>
                {total ? t("matchOf", { i: findIndex + 1, n: total }) : t("noMatches")}
              </span>
              <span style={{ display: "flex", gap: 2 }}>
                <button type="button" onClick={() => jump(-1)} disabled={!total} aria-label={t("prevMatch")} style={{ background: "transparent", border: 0, cursor: total ? "pointer" : "default", color: "var(--text-3)", display: "flex", padding: 0 }}>
                  <IconChevron size={12} style={{ transform: "rotate(-90deg)" }} />
                </button>
                <button type="button" onClick={() => jump(1)} disabled={!total} aria-label={t("nextMatch")} style={{ background: "transparent", border: 0, cursor: total ? "pointer" : "default", color: "var(--text-3)", display: "flex", padding: 0 }}>
                  <IconChevron size={12} style={{ transform: "rotate(90deg)" }} />
                </button>
              </span>
            </div>
          )}
        </div>

        <label style={{ fontSize: 12, color: "var(--text-2)", display: "block", marginBottom: 6 }}>{t("replaceWith")}</label>
        <input className="pp-input" value={replace} onChange={(e) => setReplace(e.target.value)} style={{ marginBottom: 16 }} />

        <div style={{ display: "flex", gap: 18, marginBottom: 20 }}>
          {([["caseSensitive", caseSensitive, setCaseSensitive], ["wholeWord", wholeWord, setWholeWord]] as const).map(([key, val, setter]) => (
            <label key={key} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5, color: "var(--text-2)", cursor: "pointer" }}>
              <span
                onClick={() => setter((v) => !v)}
                style={{
                  width: 16, height: 16, borderRadius: 4, border: "1.5px solid var(--line-2)",
                  background: val ? "var(--indigo)" : "transparent",
                  display: "flex", alignItems: "center", justifyContent: "center",
                }}
              >
                {val && <IconCheck size={10} color="white" sw={3} />}
              </span>
              {t(key)}
            </label>
          ))}
        </div>

        <div style={{ display: "flex", gap: 10 }}>
          {/* Replace is whole-document (server replaces every match), so a single
              honest "Replace All" action — not two buttons that did the same thing. */}
          <button type="button" className="pp-btn" style={{ flex: 1, justifyContent: "center" }} disabled={busy || !find || !total} onClick={run}>
            {busy ? <Spinner size={15} /> : t("replaceAll")}
          </button>
          <button type="button" className="pp-btn pp-btn-ghost" style={{ padding: "10px 14px" }} onClick={close}>
            {t("close")}
          </button>
        </div>
        {done !== null && (
          <p style={{ fontSize: 12, color: "var(--text-3)", marginTop: 12, textAlign: "center" }}>{t("replacedToast", { count: done })}</p>
        )}
      </div>
    </div>
  );
}
