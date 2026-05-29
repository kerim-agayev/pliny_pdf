import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

export function PrivacyBadge({ type }: { type: "local" | "cloud" }) {
  const t = useTranslations("PrivacyBadge");
  const label = type === "local" ? t("local") : t("cloud");
  const tooltip = type === "local" ? t("localTooltip") : t("cloudTooltip");
  const bg = type === "local" ? "bg-local" : "bg-cloud";

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Badge className={`${bg} border-transparent text-white`}>
          <span
            aria-hidden
            className="mr-1.5 inline-block size-1.5 rounded-full bg-white/80"
          />
          {label}
        </Badge>
      </TooltipTrigger>
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
