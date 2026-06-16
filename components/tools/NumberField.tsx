"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Touch-friendly numeric field: a segmented [−] [input] [+] control with 44×44
 * stepper buttons (GATE 9D bug fix — native number spinners are tiny/absent on
 * mobile, leaving values stuck on their auto-filled default).
 *
 * The input is controlled by a local string so typing isn't fought by clamping;
 * the parent always receives a clamped number. A `focused` ref gates re-syncing
 * the displayed text from the `value` prop — so steppers and external updates
 * (e.g. a freshly loaded PDF's page count) refresh the field, but mid-typing does
 * not. On blur the text is normalized to the clamped value.
 */
export function NumberField({
  value,
  min,
  max = Number.MAX_SAFE_INTEGER,
  step = 1,
  onChange,
  label,
  decreaseLabel,
  increaseLabel,
  className,
}: {
  value: number;
  min: number;
  max?: number;
  step?: number;
  onChange: (n: number) => void;
  label?: string;
  decreaseLabel: string;
  increaseLabel: string;
  className?: string;
}) {
  const clamp = (n: number) => Math.max(min, Math.min(max, n));
  const [text, setText] = useState(String(value));
  const focused = useRef(false);

  // Reflect external changes (steppers, file load) when not actively typing.
  useEffect(() => {
    if (!focused.current) setText(String(value));
  }, [value]);

  const stepBtn: React.CSSProperties = {
    flexShrink: 0, width: 44, height: 44, display: "flex", alignItems: "center", justifyContent: "center",
    background: "var(--bg-2)", border: "1px solid var(--line-2)", color: "var(--text)",
    fontSize: 20, lineHeight: 1, cursor: "pointer", userSelect: "none",
  };

  const control = (
    <div className="flex items-stretch" style={{ height: 44 }}>
      <button
        type="button"
        aria-label={decreaseLabel}
        onClick={() => onChange(clamp(value - step))}
        disabled={value <= min}
        style={{ ...stepBtn, borderRadius: "10px 0 0 10px", opacity: value <= min ? 0.45 : 1 }}
      >
        −
      </button>
      <input
        type="number"
        inputMode="numeric"
        className="pp-number"
        value={text}
        min={min}
        max={max}
        step={step}
        onFocus={() => { focused.current = true; }}
        onChange={(e) => {
          setText(e.target.value);
          const n = e.target.valueAsNumber;
          if (!Number.isNaN(n)) onChange(clamp(n));
        }}
        onBlur={() => {
          focused.current = false;
          const n = parseInt(text, 10);
          const c = Number.isNaN(n) ? min : clamp(n);
          setText(String(c));
          if (c !== value) onChange(c);
        }}
        style={{
          flex: 1, minWidth: 0, textAlign: "center",
          background: "var(--bg-2)", border: "1px solid var(--line-2)", borderLeft: 0, borderRight: 0,
          color: "var(--text)", fontFamily: "inherit", fontSize: 15, outline: "none",
        }}
      />
      <button
        type="button"
        aria-label={increaseLabel}
        onClick={() => onChange(clamp(value + step))}
        disabled={value >= max}
        style={{ ...stepBtn, borderRadius: "0 10px 10px 0", opacity: value >= max ? 0.45 : 1 }}
      >
        +
      </button>
    </div>
  );

  if (!label) return <div className={className}>{control}</div>;
  return (
    <label className={`flex flex-col gap-1.5 ${className ?? ""}`}>
      <span className="pp-mono text-[11px] uppercase tracking-[0.06em]" style={{ color: "var(--text-3)" }}>{label}</span>
      {control}
    </label>
  );
}
