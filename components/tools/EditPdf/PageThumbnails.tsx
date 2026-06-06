"use client";

/* eslint-disable @next/next/no-img-element */
import { useTranslations } from "next-intl";
import { useEditorStore } from "@/lib/stores/editorStore";
import { pagePngUrl } from "@/lib/api/editor";

/** Left sidebar with a PNG thumbnail per page; the current page is highlighted.
 * On mobile it collapses to an off-canvas drawer toggled via `mobileOpen`. */
export function PageThumbnails({ mobileOpen = false, onPick }: { mobileOpen?: boolean; onPick?: () => void }) {
  const t = useTranslations("ToolPages.editPdf");
  const sessionId = useEditorStore((s) => s.sessionId);
  const pages = useEditorStore((s) => s.pages);
  const pageCount = useEditorStore((s) => s.pageCount);
  const currentPage = useEditorStore((s) => s.currentPage);
  const setCurrentPage = useEditorStore((s) => s.setCurrentPage);
  const renderVersion = useEditorStore((s) => s.renderVersion);

  return (
    <aside className={`pp-ed-sidebar${mobileOpen ? " pp-ed-drawer-open" : ""}`} style={{ width: 168, flexShrink: 0, background: "var(--card)", borderRight: "1px solid var(--line)", display: "flex", flexDirection: "column" }}>
      <div style={{ padding: "12px 16px", borderBottom: "1px solid var(--line)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span className="pp-mono" style={{ fontSize: 10.5, letterSpacing: "0.1em", textTransform: "uppercase", color: "var(--text-3)" }}>{t("pages")}</span>
        <span className="pp-mono" style={{ fontSize: 10.5, color: "var(--text-3)" }}>{pageCount}</span>
      </div>
      <div style={{ flex: 1, overflowY: "auto", padding: "14px 16px", display: "flex", flexDirection: "column", gap: 14 }}>
        {pages.map((pg) => {
          const sel = pg.pageNum === currentPage;
          return (
            <button
              key={pg.pageNum}
              type="button"
              onClick={() => { setCurrentPage(pg.pageNum); onPick?.(); }}
              style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 4, flexShrink: 0, background: "transparent", border: 0, cursor: "pointer", padding: 0 }}
            >
              <div
                style={{
                  width: 104, height: 134, borderRadius: 4, position: "relative", background: "#FAFAF9", overflow: "hidden",
                  border: sel ? "2px solid var(--indigo)" : "1px solid var(--line-2)",
                  boxShadow: sel ? "0 0 0 3px var(--indigo-dim)" : "0 2px 8px -4px rgba(0,0,0,0.5)",
                }}
              >
                {sessionId && (
                  <img src={`${pagePngUrl(sessionId, pg.pageNum)}?v=${renderVersion}`} alt={`Page ${pg.pageNum + 1}`} style={{ width: "100%", height: "100%", objectFit: "contain" }} draggable={false} />
                )}
              </div>
              <span className="pp-mono" style={{ fontSize: 10.5, color: sel ? "#BFB5FF" : "var(--text-3)" }}>{pg.pageNum + 1}</span>
            </button>
          );
        })}
      </div>
    </aside>
  );
}
