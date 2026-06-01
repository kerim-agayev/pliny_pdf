// PlinyPDF — icon set ported from the Claude Design handoff (icons.jsx).
// Stroke-based, 1.5 default width. Pass size / color / sw via props.
import type { SVGProps } from "react";

export type IconProps = Omit<SVGProps<SVGSVGElement>, "color"> & {
  size?: number;
  color?: string;
  sw?: number;
};

function I({ size = 18, color = "currentColor", sw = 1.5, children, ...rest }: IconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke={color}
      strokeWidth={sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      {...rest}
    >
      {children}
    </svg>
  );
}

export const IconMerge = (p: IconProps) => (
  <I {...p}>
    <path d="M6 3v6c0 2 1 3 3 3h6c2 0 3 1 3 3v6" />
    <path d="M18 3v6c0 2-1 3-3 3H9c-2 0-3 1-3 3v6" />
  </I>
);
export const IconSplit = (p: IconProps) => (
  <I {...p}>
    <path d="M12 4v4" /><path d="M12 16v4" />
    <path d="M9 10h6v4H9z" />
    <path d="M4 7l2 2-2 2" /><path d="M20 7l-2 2 2 2" />
  </I>
);
export const IconCompress = (p: IconProps) => (
  <I {...p}>
    <path d="M4 9V5h4" /><path d="M20 9V5h-4" />
    <path d="M4 15v4h4" /><path d="M20 15v4h-4" />
    <path d="M9 12h6" />
  </I>
);
export const IconRotate = (p: IconProps) => (
  <I {...p}><path d="M3 12a9 9 0 1 0 3-6.7" /><path d="M3 4v5h5" /></I>
);
export const IconImage = (p: IconProps) => (
  <I {...p}>
    <rect x="3" y="4" width="18" height="16" rx="2" />
    <circle cx="9" cy="10" r="1.5" />
    <path d="M21 16l-5-5-7 8" />
  </I>
);
export const IconImageToPdf = (p: IconProps) => (
  <I {...p}>
    <rect x="3" y="3" width="11" height="11" rx="1.5" />
    <circle cx="7" cy="7" r="1" />
    <path d="M14 8l-3 3-3-2" />
    <path d="M14 17h7" /><path d="M18 14v6" />
  </I>
);
export const IconWatermark = (p: IconProps) => (
  <I {...p}>
    <rect x="4" y="3" width="16" height="18" rx="2" />
    <path d="M8 11h8" opacity="0.5" />
    <path d="M7 14l10-6" />
    <path d="M8 18h6" opacity="0.4" />
  </I>
);
export const IconLock = (p: IconProps) => (
  <I {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 8 0v3" /></I>
);
export const IconUnlock = (p: IconProps) => (
  <I {...p}><rect x="5" y="11" width="14" height="9" rx="2" /><path d="M8 11V8a4 4 0 0 1 7-2.5" /></I>
);
export const IconWord = (p: IconProps) => (
  <I {...p}>
    <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
    <path d="M14 3v5h5" />
    <path d="M8 13l1.5 5L11 14l1.5 4L14 13" />
  </I>
);
export const IconTrash = (p: IconProps) => (
  <I {...p}>
    <path d="M4 7h16" />
    <path d="M9 7V5a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
    <path d="M6 7l1 13a1 1 0 0 0 1 1h8a1 1 0 0 0 1-1l1-13" />
    <path d="M10 11v6" /><path d="M14 11v6" />
  </I>
);
export const IconExtract = (p: IconProps) => (
  <I {...p}>
    <path d="M13 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h7" />
    <path d="M13 3v5h5" />
    <path d="M14 13h7" /><path d="M18 10l3 3-3 3" />
  </I>
);
export const IconTagOff = (p: IconProps) => (
  <I {...p}>
    <path d="M4 9l5-5h7a2 2 0 0 1 2 2v7l-3 3" />
    <path d="M14 20l-10-10" />
    <path d="M4 4l16 16" />
  </I>
);
export const IconInfo = (p: IconProps) => (
  <I {...p}><circle cx="12" cy="12" r="9" /><path d="M12 11v5" /><circle cx="12" cy="7.6" r="0.7" fill="currentColor" /></I>
);
export const IconGrayscale = (p: IconProps) => (
  <I {...p}><circle cx="12" cy="12" r="9" /><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor" stroke="none" /></I>
);
export const IconLayers = (p: IconProps) => (
  <I {...p}><path d="M12 3l9 5-9 5-9-5z" /><path d="M3 13l9 5 9-5" /></I>
);
export const IconText = (p: IconProps) => (
  <I {...p}><path d="M5 6h14" /><path d="M5 10h14" /><path d="M5 14h10" /><path d="M5 18h7" /></I>
);
export const IconMarkdown = (p: IconProps) => (
  <I {...p}>
    <rect x="3" y="6" width="18" height="12" rx="2" />
    <path d="M6 14v-4l2 2 2-2v4" />
    <path d="M15 10v4" /><path d="M13.4 12.4L15 14l1.6-1.6" />
  </I>
);
export const IconScan = (p: IconProps) => (
  <I {...p}>
    <path d="M4 8V6a2 2 0 0 1 2-2h2" />
    <path d="M16 4h2a2 2 0 0 1 2 2v2" />
    <path d="M20 16v2a2 2 0 0 1-2 2h-2" />
    <path d="M8 20H6a2 2 0 0 1-2-2v-2" />
    <path d="M7 12h10" />
  </I>
);
export const IconArrow = (p: IconProps) => (
  <I {...p}><path d="M5 12h14" /><path d="M13 6l6 6-6 6" /></I>
);
export const IconArrowDown = (p: IconProps) => (
  <I {...p}><path d="M12 5v14" /><path d="M6 13l6 6 6-6" /></I>
);
export const IconCheck = (p: IconProps) => (
  <I {...p} sw={p.sw ?? 2}><path d="M5 12l4.5 4.5L19 7" /></I>
);
export const IconX = (p: IconProps) => (
  <I {...p}><path d="M6 6l12 12" /><path d="M18 6l-12 12" /></I>
);
export const IconPlus = (p: IconProps) => (
  <I {...p}><path d="M12 5v14" /><path d="M5 12h14" /></I>
);
export const IconMenu = (p: IconProps) => (
  <I {...p}><path d="M4 7h16" /><path d="M4 12h16" /><path d="M4 17h16" /></I>
);
export const IconGrip = (p: IconProps) => (
  <I {...p}>
    <circle cx="9" cy="6" r="1" fill="currentColor" /><circle cx="15" cy="6" r="1" fill="currentColor" />
    <circle cx="9" cy="12" r="1" fill="currentColor" /><circle cx="15" cy="12" r="1" fill="currentColor" />
    <circle cx="9" cy="18" r="1" fill="currentColor" /><circle cx="15" cy="18" r="1" fill="currentColor" />
  </I>
);
export const IconUpload = (p: IconProps) => (
  <I {...p}>
    <path d="M12 16V4" /><path d="M6 10l6-6 6 6" />
    <path d="M4 18v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </I>
);
export const IconShield = (p: IconProps) => (
  <I {...p}><path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" /><path d="M9 12l2 2 4-4" /></I>
);
export const IconSparkle = (p: IconProps) => (
  <I {...p}>
    <path d="M12 4v4" /><path d="M12 16v4" /><path d="M4 12h4" /><path d="M16 12h4" />
    <path d="M6.3 6.3l2.8 2.8" /><path d="M14.9 14.9l2.8 2.8" />
    <path d="M6.3 17.7l2.8-2.8" /><path d="M14.9 9.1l2.8-2.8" />
  </I>
);
export const IconGlobe = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="12" r="9" /><path d="M3 12h18" />
    <path d="M12 3a14 14 0 0 1 0 18" /><path d="M12 3a14 14 0 0 0 0 18" />
  </I>
);
export const IconStar = (p: IconProps) => (
  <I {...p}><path d="M12 4l2.5 5 5.5.8-4 3.9 1 5.6L12 17l-5 2.3 1-5.6-4-3.9L9.5 9z" /></I>
);
export const IconClock = (p: IconProps) => (
  <I {...p}><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></I>
);
export const IconFolder = (p: IconProps) => (
  <I {...p}><path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /></I>
);
export const IconSettings = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 1 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 1 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 1 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 1 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
  </I>
);
export const IconBolt = (p: IconProps) => (
  <I {...p}><path d="M13 2L4 14h7l-1 8 9-12h-7z" /></I>
);
export const IconChevron = (p: IconProps) => (
  <I {...p}><path d="M9 6l6 6-6 6" /></I>
);
export const IconHeart = (p: IconProps) => (
  <I {...p}><path d="M12 21s-7-4.5-9-9c-1.5-3.5.5-7 4-7 2 0 3.5 1 5 3 1.5-2 3-3 5-3 3.5 0 5.5 3.5 4 7-2 4.5-9 9-9 9z" /></I>
);
export const IconFile = (p: IconProps) => (
  <I {...p}><path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" /><path d="M14 3v5h5" /></I>
);
export const IconDownload = (p: IconProps) => (
  <I {...p}>
    <path d="M12 4v12" /><path d="M6 10l6 6 6-6" />
    <path d="M4 18v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
  </I>
);
export const IconSearch = (p: IconProps) => (
  <I {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></I>
);
export const IconSun = (p: IconProps) => (
  <I {...p}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41" />
  </I>
);
export const IconMoon = (p: IconProps) => (
  <I {...p}><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></I>
);
export const IconCopy = (p: IconProps) => (
  <I {...p}>
    <rect x="8" y="8" width="12" height="12" rx="2" />
    <path d="M16 8V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v8a2 2 0 0 0 2 2h2" />
  </I>
);
export const IconGoogle = ({ size = 18, ...rest }: Omit<IconProps, "color" | "sw">) => (
  <svg width={size} height={size} viewBox="0 0 24 24" {...rest}>
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.99.66-2.25 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84A11 11 0 0 0 12 23z" />
    <path fill="#FBBC05" d="M5.84 14.09a6.6 6.6 0 0 1 0-4.18V7.07H2.18a11 11 0 0 0 0 9.86l3.66-2.84z" />
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84C6.71 7.31 9.14 5.38 12 5.38z" />
  </svg>
);
export const IconAlert = (p: IconProps) => (
  <I {...p}><path d="M12 3l10 18H2z" /><path d="M12 10v4" /><circle cx="12" cy="17" r="0.6" fill="currentColor" /></I>
);
export const IconRefresh = (p: IconProps) => (
  <I {...p}>
    <path d="M3 12a9 9 0 0 1 15.5-6.3L21 8" /><path d="M21 3v5h-5" />
    <path d="M21 12a9 9 0 0 1-15.5 6.3L3 16" /><path d="M3 21v-5h5" />
  </I>
);
export const IconMail = (p: IconProps) => (
  <I {...p}><rect x="3" y="5" width="18" height="14" rx="2" /><path d="M3 7l9 6 9-6" /></I>
);
export const IconEye = (p: IconProps) => (
  <I {...p}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></I>
);

// === PDF Editor icons ===
export const IconCursor = (p: IconProps) => (
  <I {...p}><path d="M5 3l5 16 2.5-6.5L19 10z" /></I>
);
export const IconType = (p: IconProps) => (
  <I {...p}><path d="M5 6V4h14v2" /><path d="M12 4v16" /><path d="M9 20h6" /></I>
);
export const IconSticky = (p: IconProps) => (
  <I {...p}><path d="M21 11.5a8.4 8.4 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.4 8.4 0 0 1-3.8-.9L3 21l1.9-5.7a8.4 8.4 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.4 8.4 0 0 1 3.8-.9h.5a8.5 8.5 0 0 1 8 8z" /></I>
);
export const IconHighlight = (p: IconProps) => (
  <I {...p}><path d="M9 11l-6 6v4h4l6-6" /><path d="M11 9l4 4" /><path d="M15 4l5 5-8 8-5-5z" /></I>
);
export const IconStrike = (p: IconProps) => (
  <I {...p}>
    <path d="M4 12h16" />
    <path d="M16 6c0-1.7-1.8-3-4-3s-4 1.3-4 3c0 1 .5 2 2 2.5" />
    <path d="M8 18c0 1.7 1.8 3 4 3s4-1.3 4-3c0-1-.5-2-2-2.5" />
  </I>
);
export const IconUnderline = (p: IconProps) => (
  <I {...p}><path d="M6 4v8a6 6 0 0 0 12 0V4" /><path d="M4 20h16" /></I>
);
export const IconPen = (p: IconProps) => (
  <I {...p}><path d="M16 3l5 5-12 12H4v-5z" /><path d="M14 5l5 5" /></I>
);
export const IconRect = (p: IconProps) => (
  <I {...p}><rect x="4" y="5" width="16" height="14" rx="1" /></I>
);
export const IconCircleShape = (p: IconProps) => (
  <I {...p}><circle cx="12" cy="12" r="8" /></I>
);
export const IconArrowDraw = (p: IconProps) => (
  <I {...p}><path d="M5 19L19 5" /><path d="M9 5h10v10" /></I>
);
export const IconLineShape = (p: IconProps) => (
  <I {...p}><path d="M5 19L19 5" /></I>
);
export const IconWhiteout = (p: IconProps) => (
  <I {...p}><rect x="3" y="9" width="18" height="6" rx="1" /><path d="M3 12h18" opacity="0.4" /></I>
);
export const IconEraser = (p: IconProps) => (
  <I {...p}><path d="M14 4l6 6-9 9H6l-3-3z" /><path d="M9 9l6 6" /><path d="M11 19h10" /></I>
);
export const IconUndo = (p: IconProps) => (
  <I {...p}><path d="M3 7v6h6" /><path d="M3 13a9 9 0 1 0 3-6.7L3 9" /></I>
);
export const IconRedo = (p: IconProps) => (
  <I {...p}><path d="M21 7v6h-6" /><path d="M21 13a9 9 0 1 1-3-6.7L21 9" /></I>
);
export const IconZoomIn = (p: IconProps) => (
  <I {...p}><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /><path d="M11 8v6M8 11h6" /></I>
);

// PlinyPDF P monogram — geometric, premium
export const PlinyMark = ({
  size = 28,
  color = "currentColor",
  bg = "transparent",
}: {
  size?: number;
  color?: string;
  bg?: string;
}) => (
  <svg width={size} height={size} viewBox="0 0 28 28" fill="none">
    {bg !== "transparent" && <rect width="28" height="28" rx="7" fill={bg} />}
    <path d="M8 6h7.5a5.5 5.5 0 0 1 0 11H11v5H8V6z" stroke={color} strokeWidth="2" strokeLinejoin="round" />
    <circle cx="15.5" cy="11.5" r="1.5" fill={color} />
  </svg>
);

// Name → component map, for data-driven icon lookups (tool catalog).
export const ICONS = {
  IconMerge, IconSplit, IconCompress, IconRotate, IconImage, IconImageToPdf,
  IconWatermark, IconLock, IconUnlock, IconWord, IconArrow, IconSparkle,
} as const;

export type IconName = keyof typeof ICONS;
