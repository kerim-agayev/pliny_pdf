import type { ReactNode } from "react";

/**
 * Shared shell for the long-form content pages (About / Privacy / Terms).
 * Centered prose column using the project's design tokens — no new design system.
 */
export function LegalShell({
  title,
  lastUpdated,
  intro,
  children,
}: {
  title: string;
  lastUpdated?: string;
  intro?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section className="mx-auto max-w-[760px] px-5 pt-16 pb-24 sm:px-8">
      <h1 className="font-[family-name:var(--font-display)] text-[clamp(30px,5vw,42px)] font-bold tracking-[-0.03em]">
        {title}
      </h1>
      {lastUpdated && (
        <p className="pp-mono mt-3 text-[12.5px]" style={{ color: "var(--text-3)" }}>
          {lastUpdated}
        </p>
      )}
      {intro && (
        <p className="mt-6 text-[17px] leading-relaxed" style={{ color: "var(--text-2)" }}>
          {intro}
        </p>
      )}
      <div className="mt-10 flex flex-col gap-9">{children}</div>
    </section>
  );
}

/** One titled section of body copy. Heading is localized; body may be EN for v1. */
export function LegalSection({ heading, children }: { heading: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-3">
      <h2 className="font-[family-name:var(--font-display)] text-[20px] font-semibold tracking-[-0.02em]">
        {heading}
      </h2>
      <div
        className="flex flex-col gap-3 text-[15px] leading-relaxed"
        style={{ color: "var(--text-2)" }}
      >
        {children}
      </div>
    </div>
  );
}
