"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { IconLock, IconEye, IconX } from "@/components/shared/icons";
import { removePassword } from "@/lib/pdf/password";

const MAX_ATTEMPTS = 3;

/**
 * Prompts for the password of an encrypted PDF and returns a decrypted File.
 * Show this when `isPdfEncrypted()` (lib/validation.ts) reports true. Caps the
 * user at 3 attempts, then locks the form. Cancel returns the tool to idle.
 *
 * Wave 3A ships the component; Wave 3B wires it into every tool.
 */
export function PasswordModal({
  file,
  onUnlocked,
  onCancel,
}: {
  file: File;
  onUnlocked: (decrypted: File) => void;
  onCancel: () => void;
}) {
  const t = useTranslations("PasswordModal");
  const te = useTranslations("Errors");
  const [password, setPassword] = useState("");
  const [show, setShow] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string>();
  const [attempts, setAttempts] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const locked = attempts >= MAX_ATTEMPTS;

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  async function submit() {
    if (!password || busy || locked) return;
    setBusy(true);
    setError(undefined);
    try {
      const blob = await removePassword(file, password);
      onUnlocked(new File([blob], file.name, { type: "application/pdf" }));
    } catch {
      const next = attempts + 1;
      setAttempts(next);
      setPassword("");
      setError(next >= MAX_ATTEMPTS ? t("tooManyAttempts") : te("wrongPassword"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={t("title")}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.55)", backdropFilter: "blur(3px)" }}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onCancel();
      }}
    >
      <div
        className="pp-card w-full max-w-[400px] p-6 sm:p-7"
        style={{ background: "var(--bg-2)", border: "1px solid var(--line-2)" }}
      >
        <div className="mb-4 flex items-start gap-3">
          <div
            className="flex size-11 shrink-0 items-center justify-center rounded-[12px]"
            style={{ background: "var(--indigo-dim)", color: "var(--indigo)" }}
          >
            <IconLock size={20} sw={1.8} />
          </div>
          <div className="flex-1">
            <h3 className="text-[18px] tracking-[-0.01em]">{t("title")}</h3>
            <p className="mt-0.5 text-[13px]" style={{ color: "var(--text-2)" }}>
              {t("description")}
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            aria-label={t("cancel")}
            style={{ color: "var(--text-3)" }}
          >
            <IconX size={18} />
          </button>
        </div>

        <div className="relative">
          <input
            ref={inputRef}
            className="pp-input pr-10"
            type={show ? "text" : "password"}
            value={password}
            placeholder={t("placeholder")}
            disabled={locked || busy}
            onChange={(e) => setPassword(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            className="absolute right-2.5 top-1/2 -translate-y-1/2"
            style={{ color: "var(--text-3)" }}
            aria-label="Toggle password visibility"
          >
            <IconEye size={16} />
          </button>
        </div>

        {error && (
          <p className="mt-2 text-[12.5px]" style={{ color: "#FDA4AF" }}>
            {error}
          </p>
        )}

        <div className="mt-5 flex justify-end gap-2.5">
          <button type="button" className="pp-btn pp-btn-ghost" onClick={onCancel}>
            {t("cancel")}
          </button>
          <button
            type="button"
            className="pp-btn min-w-[120px] justify-center"
            onClick={submit}
            disabled={!password || busy || locked}
          >
            {t("unlock")}
          </button>
        </div>
      </div>
    </div>
  );
}
