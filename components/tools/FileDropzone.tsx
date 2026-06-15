"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { IconUpload } from "@/components/shared/icons";
import { Kbd, useModKey } from "@/components/shared/Kbd";
import { Spinner } from "./Spinner";
import { PasswordModal } from "@/components/shared/PasswordModal";
import { validateFileType, validateFileSize, isPdfEncrypted } from "@/lib/validation";
import { localMaxMB, localMaxPages, effectivePlan, getToolLimits } from "@/lib/limits";
import { readPageCount } from "@/lib/pdf/common";
import { useSession } from "@/lib/auth/client";
import { LimitBadge } from "@/components/shared/LimitBadge";
import { useDailyUsage } from "@/lib/hooks/useDailyUsage";

type Accept = "pdf" | "image" | "word";

const ACCEPT_ATTR: Record<Accept, string> = {
  pdf: "application/pdf,.pdf",
  image: "image/jpeg,image/png,.jpg,.jpeg,.png",
  word: "application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,.docx,.doc",
};

/**
 * Shared file entry point for every tool. Beyond drag/drop it is the Phase 3
 * chokepoint for validation (Wave 3B):
 *  - extension + magic-byte type check (pdf / docx)
 *  - size limit (plan-aware local default via {@link localMaxMB}; cloud tools
 *    pass their own plan tier through `maxSizeMB`)
 *  - page-count limit (opt-in via `checkPages`, for local PDF tools) — rejected
 *    before `onFiles` runs so heavy processing never starts on an over-limit file
 *  - encrypted-PDF detection → prompts via PasswordModal and hands the tool a
 *    decrypted file. Tools that own password logic (Protect/Unlock) opt out with
 *    `disablePasswordPrompt`.
 * Validation failures surface as localized toasts; `onFiles` only ever receives
 * valid, decrypted files.
 */
export function FileDropzone({
  accept,
  multiple = false,
  onFiles,
  title,
  toolId,
  maxSizeMB,
  checkPages = false,
  disablePasswordPrompt = false,
}: {
  accept: Accept;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  title?: string;
  /** Drives the LimitBadge + per-tool size/page limits (Wave 9A). */
  toolId?: string;
  maxSizeMB?: number;
  checkPages?: boolean;
  disablePasswordPrompt?: boolean;
}) {
  const t = useTranslations("ToolUI");
  const te = useTranslations("Errors");
  const mod = useModKey();
  const { data: session } = useSession();
  const inputRef = useRef<HTMLInputElement>(null);
  const [glow, setGlow] = useState(false);
  const [busy, setBusy] = useState(false);
  // Inline pre-upload rejection (Wave 9A) — size or page over-limit → red badge,
  // shown before any upload, replacing the toast when a badge is present.
  const [over, setOver] = useState<{ unit: "mb" | "pages"; value: number } | null>(null);

  // Sequential password-unlock queue (only meaningful for accept="pdf").
  const queueRef = useRef<File[]>([]);
  const doneRef = useRef<File[]>([]);
  const [pending, setPending] = useState<File | null>(null);

  const plan = (session?.user as { plan?: "free" | "pro" })?.plan ?? null;
  const badgePlan = effectivePlan(plan); // "anon" | "free"
  // When a toolId is given (every shipped tool), per-tool limits are the single
  // source of truth — matching the backend. toolId-less dropzones fall back to
  // the legacy explicit/local limits.
  const limits = toolId ? getToolLimits(toolId, badgePlan) : null;
  const anonLimits = toolId ? getToolLimits(toolId, "anon") : null;
  const freeLimits = toolId ? getToolLimits(toolId, "free") : null;
  const usage = useDailyUsage(Boolean(limits?.cloud));
  const sizeLimitMB = limits?.mb ?? maxSizeMB ?? localMaxMB(plan);
  const pageLimit = limits?.count ?? localMaxPages(plan);

  const expected = accept === "pdf" ? "pdf" : accept === "word" ? "docx" : null;
  const maxBytes = sizeLimitMB * 1024 * 1024;

  const heading =
    title ?? (accept === "image" ? t("dropImageTitle") : multiple ? t("dropTitle") : t("dropSingleTitle"));

  function emit(files: File[]) {
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  }

  async function processQueue() {
    while (queueRef.current.length) {
      const f = queueRef.current[0];
      let encrypted = false;
      try {
        encrypted = await isPdfEncrypted(await f.arrayBuffer());
      } catch {
        toast.error(te("corruptPdf"));
        queueRef.current.shift();
        continue;
      }
      if (encrypted) {
        setPending(f); // open the modal; resume from the unlock/cancel handlers
        return;
      }
      doneRef.current.push(f);
      queueRef.current.shift();
    }
    const out = doneRef.current;
    doneRef.current = [];
    setBusy(false);
    emit(out);
  }

  async function ingest(list: FileList | null) {
    if (!list) return;
    const incoming = Array.from(list);
    if (!incoming.length) return;

    setBusy(true);
    setOver(null);
    const accepted: File[] = [];
    for (const f of multiple ? incoming : incoming.slice(0, 1)) {
      if (expected) {
        const typeRes = await validateFileType(f, expected);
        if (!typeRes.ok) {
          toast.error(te("wrongType"));
          continue;
        }
      }
      const sizeRes = validateFileSize(f, maxBytes);
      if (!sizeRes.ok) {
        // With a badge present, surface the violation inline (red badge) instead
        // of a toast — the user sees it before any upload attempt.
        if (toolId) setOver({ unit: "mb", value: sizeRes.fileMB });
        else toast.error(te("fileTooLarge", { limitMB: sizeRes.limitMB, fileMB: sizeRes.fileMB }));
        continue;
      }
      // Page count can only be known after parsing the PDF — do it client-side
      // for every PDF tool (cloud included) so an over-limit file is blocked here,
      // never sent to the server. `checkPages` keeps the legacy opt-in for
      // toolId-less dropzones.
      if (accept === "pdf" && (checkPages || toolId)) {
        const pages = await readPageCount(f).catch(() => 0);
        if (pages > pageLimit) {
          if (toolId) setOver({ unit: "pages", value: pages });
          else toast.error(te("tooManyPagesLocal", { pages, limit: pageLimit }));
          continue;
        }
      }
      accepted.push(f);
    }

    if (!accepted.length) {
      setBusy(false);
      return;
    }

    if (accept === "pdf" && !disablePasswordPrompt) {
      queueRef.current = accepted;
      doneRef.current = [];
      await processQueue();
    } else {
      setBusy(false);
      emit(accepted);
    }
  }

  function onUnlocked(decrypted: File) {
    doneRef.current.push(decrypted);
    queueRef.current.shift();
    setPending(null);
    processQueue();
  }

  function onCancelPassword() {
    queueRef.current = [];
    doneRef.current = [];
    setPending(null);
    setBusy(false);
  }

  return (
    <>
      <div
        className={`pp-drop ${glow ? "glow" : ""} ${busy ? "" : "cursor-pointer"}`}
        style={
          over != null
            ? { borderColor: "rgba(239,68,68,0.5)", borderStyle: "solid", background: "rgba(239,68,68,0.06)" }
            : undefined
        }
        role="button"
        tabIndex={0}
        aria-busy={busy}
        aria-keyshortcuts="Control+O Meta+O"
        data-pp-shortcut="open"
        onClick={() => !busy && inputRef.current?.click()}
        onKeyDown={(e) => {
          if (!busy && (e.key === "Enter" || e.key === " ")) inputRef.current?.click();
        }}
        onDragEnter={(e) => {
          e.preventDefault();
          if (!busy) setGlow(true);
        }}
        onDragOver={(e) => e.preventDefault()}
        onDragLeave={(e) => {
          e.preventDefault();
          setGlow(false);
        }}
        onDrop={(e) => {
          e.preventDefault();
          setGlow(false);
          if (!busy) ingest(e.dataTransfer.files);
        }}
      >
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPT_ATTR[accept]}
          multiple={multiple}
          hidden
          onChange={(e) => {
            ingest(e.target.files);
            e.target.value = "";
          }}
        />
        <div
          className="mb-4 inline-flex size-14 items-center justify-center rounded-[14px] transition-all"
          style={{
            background: glow ? "rgba(107,92,231,0.2)" : "rgba(127,127,127,0.06)",
            border: `1px solid ${glow ? "rgba(107,92,231,0.4)" : "var(--line)"}`,
            color: glow ? "#BFB5FF" : "var(--text-2)",
          }}
        >
          {busy ? <Spinner size={20} /> : <IconUpload size={22} sw={1.7} />}
        </div>
        <div className="mb-1.5 text-[17px] font-medium" style={{ color: "var(--text)" }}>
          {busy ? t("loading") : glow ? t("dropActive") : heading}
        </div>
        <div className="text-[13.5px]" style={{ color: "var(--text-2)" }}>
          {t("or")}{" "}
          <span className="underline" style={{ color: "#8B7CF0", textUnderlineOffset: 3 }}>
            {t("browse")}
          </span>
          {multiple && <span style={{ color: "var(--text-3)" }}> · {t("multiple")}</span>}
        </div>
        <div className="mt-4 flex justify-center">
          {limits ? (
            <LimitBadge
              tier={badgePlan === "anon" ? "anonymous" : "free"}
              size={sizeLimitMB}
              count={limits.count}
              unit={limits.unit}
              cloud={limits.cloud}
              quotaUsed={usage?.used}
              quotaTotal={usage?.total ?? undefined}
              over={over != null}
              overUnit={over?.unit}
              fileSize={over?.unit === "mb" ? over.value : 0}
              filePages={over?.unit === "pages" ? over.value : undefined}
              signedInSize={freeLimits?.mb ?? sizeLimitMB}
              signedInCount={freeLimits?.count ?? limits.count}
              anonSize={anonLimits?.mb ?? sizeLimitMB}
              anonCount={anonLimits?.count ?? limits.count}
            />
          ) : (
            <span className="pp-mono text-[11px]" style={{ color: "var(--text-3)" }}>
              {t("maxSize", { mb: sizeLimitMB })}
            </span>
          )}
        </div>
        {!busy && (
          <div
            className="mt-2 flex items-center justify-center gap-1 text-[11px]"
            style={{ color: "var(--text-3)" }}
          >
            <Kbd>{mod("O")}</Kbd> {t("shortcutOpen")}
          </div>
        )}
      </div>

      {pending && (
        <PasswordModal file={pending} onUnlocked={onUnlocked} onCancel={onCancelPassword} />
      )}
    </>
  );
}
