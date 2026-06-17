"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { toolById } from "@/lib/tools";
import { PrivacyBadge } from "./PrivacyBadge";
import { IconArrow, IconSparkle } from "./icons";

export function ToolCard({
  toolId,
  dotted = false,
  compact = false,
}: {
  toolId: string;
  dotted?: boolean;
  compact?: boolean;
}) {
  const t = useTranslations("Tools");
  const tool = toolById(toolId);
  if (!tool) return null;
  const Icon = tool.icon;

  const inner = (
    <>
      <div className="arrow">
        <IconArrow size={16} />
      </div>
      {dotted && (
        <span
          className="absolute left-[18px] top-[18px] size-1.5 rounded-full"
          style={{ background: tool.accent, boxShadow: `0 0 8px ${tool.accent}` }}
        />
      )}
      <div
        className="flex items-center justify-center rounded-[10px]"
        style={{
          width: 40,
          height: 40,
          background: "rgba(127,127,127,0.06)",
          border: "1px solid var(--line)",
          color: tool.accent,
          marginBottom: compact ? 12 : 18,
          marginLeft: dotted ? 14 : 0,
        }}
      >
        <Icon size={20} sw={1.6} />
      </div>
      {/* Card title is a styled <p>, not a heading — keeps page heading order
          valid (h1 → card titles no longer skip to h3). Wave 9G a11y fix. */}
      <p className="mb-1.5 font-semibold tracking-tight" style={{ fontSize: compact ? 15 : 16 }}>
        {t(`${tool.id}.name`)}
      </p>
      <p className="mb-3.5 text-[13px] leading-relaxed" style={{ color: "var(--text-2)" }}>
        {t(`${tool.id}.desc`)}
      </p>
      <div className="flex flex-wrap items-center gap-1.5">
        <PrivacyBadge type={tool.mode} />
        {tool.tag && (
          <span
            className="pp-badge"
            style={{
              background: "rgba(244,114,182,0.1)",
              borderColor: "rgba(244,114,182,0.25)",
              color: "#F9A8D4",
            }}
          >
            <IconSparkle size={10} sw={2} /> {t(`tag.${tool.id}`)}
          </span>
        )}
        {!tool.available && (
          <span className="pp-badge" style={{ color: "var(--text-3)" }}>
            {t("soon")}
          </span>
        )}
      </div>
    </>
  );

  if (!tool.available) {
    return (
      <div className="pp-tool" style={{ cursor: "default", opacity: 0.85 }}>
        {inner}
      </div>
    );
  }

  return (
    <Link href={`/${tool.slug}`} className="pp-tool block">
      {inner}
    </Link>
  );
}
