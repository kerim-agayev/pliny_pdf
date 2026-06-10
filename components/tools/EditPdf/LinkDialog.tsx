"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { IconLink, IconX } from "@/components/shared/icons";

/** Normalize + lightly validate a user-typed URL. Prepends https:// when no scheme. */
export function normalizeUrl(raw: string): string | null {
  const v = raw.trim();
  if (!v) return null;
  const withScheme = /^[a-z][a-z0-9+.-]*:\/\//i.test(v) || v.startsWith("mailto:") ? v : `https://${v}`;
  // Require a dot in the host for http(s) links (rejects "foo" but allows mailto:).
  if (/^https?:\/\//i.test(withScheme) && !withScheme.slice(withScheme.indexOf("://") + 3).includes(".")) return null;
  return withScheme;
}

/** Modal to enter a URL for "Add link to selected text" (Wave 6C). */
export function LinkDialog({ open, onConfirm, onClose }: {
  open: boolean;
  onConfirm: (url: string) => void;
  onClose: () => void;
}) {
  const t = useTranslations("ToolPages.editPdf");
  const [url, setUrl] = useState("");
  const [error, setError] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (open) { setUrl(""); setError(false); setTimeout(() => inputRef.current?.focus(), 0); }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  function submit() {
    const normalized = normalizeUrl(url);
    if (!normalized) { setError(true); return; }
    onConfirm(normalized);
  }

  return (
    <div
      onPointerDown={onClose}
      style={{ position: "fixed", inset: 0, zIndex: 80, background: "rgba(0,0,0,0.45)", display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}
    >
      <div
        className="pp-card"
        onPointerDown={(e) => e.stopPropagation()}
        style={{ width: 360, maxWidth: "94%", padding: 18, boxShadow: "0 30px 70px -24px rgba(0,0,0,0.7)" }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
          <h3 style={{ fontSize: 16, letterSpacing: "-0.02em", display: "flex", alignItems: "center", gap: 8 }}>
            <IconLink size={15} color="var(--text-2)" /> {t("linkDialogTitle")}
          </h3>
          <button type="button" onClick={onClose} aria-label={t("close")} style={{ background: "transparent", border: 0, color: "var(--text-3)", cursor: "pointer", padding: 2 }}>
            <IconX size={16} />
          </button>
        </div>

        <label style={{ fontSize: 12, color: "var(--text-2)", display: "block", marginBottom: 6 }}>{t("linkUrlLabel")}</label>
        <input
          ref={inputRef}
          className="pp-input"
          value={url}
          onChange={(e) => { setUrl(e.target.value); setError(false); }}
          onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); submit(); } }}
          placeholder={t("linkUrlPlaceholder")}
          style={{ marginBottom: error ? 6 : 16, borderColor: error ? "#F43F5E" : undefined }}
        />
        {error && <p style={{ fontSize: 12, color: "#F43F5E", marginBottom: 12 }}>{t("linkInvalidUrl")}</p>}

        <div style={{ display: "flex", gap: 10 }}>
          <button type="button" className="pp-btn pp-btn-ghost" style={{ flex: 1, justifyContent: "center" }} onClick={onClose}>
            {t("close")}
          </button>
          <button type="button" className="pp-btn" style={{ flex: 1, justifyContent: "center" }} onClick={submit}>
            {t("linkSave")}
          </button>
        </div>
      </div>
    </div>
  );
}
