"use client";

import { useEffect, useRef, useState } from "react";
import type { Thumb } from "@/lib/pdf/thumbnailLoader";

/**
 * Renders a page thumbnail only once it scrolls near the viewport (Phase 5C).
 * Shows a lightweight placeholder immediately so a grid of hundreds of pages
 * appears instantly; the image is rendered on demand via `load(index)`.
 */
export function LazyThumb({
  index,
  load,
  alt,
  imgStyle,
  className,
  children,
}: {
  index: number;
  load: (index: number) => Promise<Thumb>;
  alt: string;
  imgStyle?: React.CSSProperties;
  className?: string;
  children?: React.ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el || visible) return;
    const io = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "300px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [visible]);

  useEffect(() => {
    if (!visible || url) return;
    let cancelled = false;
    load(index)
      .then((t) => {
        if (!cancelled) setUrl(t.url);
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [visible, url, index, load]);

  return (
    <div ref={ref} className={className}>
      {url ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={alt} style={imgStyle} />
      ) : (
        <div
          className="flex size-full items-center justify-center"
          style={{ background: "var(--bg-2)", minHeight: 96, color: "var(--text-3)" }}
          aria-busy
        >
          <span className="pp-mono text-[11px]">{index + 1}</span>
        </div>
      )}
      {children}
    </div>
  );
}
