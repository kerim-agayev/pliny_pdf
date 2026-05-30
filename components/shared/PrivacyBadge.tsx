import { useTranslations } from "next-intl";

export function PrivacyBadge({
  type,
  big = false,
}: {
  type: "local" | "cloud";
  big?: boolean;
}) {
  const t = useTranslations("PrivacyBadge");

  if (big) {
    const text = type === "local" ? t("localBig") : t("cloudBig");
    return (
      <span
        className={`pp-badge ${type}`}
        style={{ padding: "8px 14px", fontSize: 13, fontWeight: 500 }}
      >
        <span className="pp-dot" style={{ width: 8, height: 8 }} />
        {text}
      </span>
    );
  }

  const label = type === "local" ? t("local") : t("cloud");
  const tooltip = type === "local" ? t("localTooltip") : t("cloudTooltip");

  return (
    <span className={`pp-badge ${type}`} title={tooltip}>
      <span className="pp-dot" />
      {label}
    </span>
  );
}
