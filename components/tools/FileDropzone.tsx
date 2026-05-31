"use client";

import { useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { IconUpload } from "@/components/shared/icons";

type Accept = "pdf" | "image" | "word";

const ACCEPT_ATTR: Record<Accept, string> = {
  pdf: "application/pdf,.pdf",
  image: "image/jpeg,image/png,.jpg,.jpeg,.png",
  word: "application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/msword,.docx,.doc",
};

export function FileDropzone({
  accept,
  multiple = false,
  onFiles,
  title,
}: {
  accept: Accept;
  multiple?: boolean;
  onFiles: (files: File[]) => void;
  title?: string;
}) {
  const t = useTranslations("ToolUI");
  const inputRef = useRef<HTMLInputElement>(null);
  const [glow, setGlow] = useState(false);

  const heading =
    title ?? (accept === "image" ? t("dropImageTitle") : multiple ? t("dropTitle") : t("dropSingleTitle"));

  function handleFiles(list: FileList | null) {
    if (!list) return;
    const files = Array.from(list);
    if (files.length) onFiles(multiple ? files : files.slice(0, 1));
  }

  return (
    <div
      className={`pp-drop ${glow ? "glow" : ""} cursor-pointer`}
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") inputRef.current?.click();
      }}
      onDragEnter={(e) => {
        e.preventDefault();
        setGlow(true);
      }}
      onDragOver={(e) => e.preventDefault()}
      onDragLeave={(e) => {
        e.preventDefault();
        setGlow(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        setGlow(false);
        handleFiles(e.dataTransfer.files);
      }}
    >
      <input
        ref={inputRef}
        type="file"
        accept={ACCEPT_ATTR[accept]}
        multiple={multiple}
        hidden
        onChange={(e) => {
          handleFiles(e.target.files);
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
        <IconUpload size={22} sw={1.7} />
      </div>
      <div className="mb-1.5 text-[17px] font-medium" style={{ color: "var(--text)" }}>
        {glow ? t("dropActive") : heading}
      </div>
      <div className="text-[13.5px]" style={{ color: "var(--text-2)" }}>
        {t("or")}{" "}
        <span className="underline" style={{ color: "#8B7CF0", textUnderlineOffset: 3 }}>
          {t("browse")}
        </span>
        {multiple && <span style={{ color: "var(--text-3)" }}> · {t("multiple")}</span>}
      </div>
    </div>
  );
}
