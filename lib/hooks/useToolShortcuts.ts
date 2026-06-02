"use client";

import { useEffect } from "react";

/**
 * Page-level keyboard shortcuts shared by every tool (Wave 3F). Mounted once in
 * ToolShell; it acts on whichever shared elements are on the page via their
 * `data-pp-shortcut` marker, so no per-tool wiring is needed:
 *   - Ctrl/Cmd+O → open the file picker  (FileDropzone)
 *   - Ctrl/Cmd+D → download the result   (SuccessPanel)
 *   - Esc        → process another / clear the file (SuccessPanel · FileInfoBar)
 *
 * A shortcut whose target isn't currently rendered is a silent no-op. Shortcuts
 * are skipped while the user is typing in a field so they never hijack text
 * entry, and Esc is left to the PasswordModal while it owns the screen (no reset
 * target exists at that point anyway).
 */
function clickTarget(name: string): boolean {
  const el = document.querySelector<HTMLElement>(`[data-pp-shortcut="${name}"]`);
  if (!el) return false;
  el.click();
  return true;
}

function isEditable(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null;
  if (!el || !el.tagName) return false;
  const tag = el.tagName;
  return tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || el.isContentEditable;
}

export function useToolShortcuts() {
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (isEditable(e.target)) return;
      const mod = e.metaKey || e.ctrlKey;

      if (mod && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "o") {
        if (clickTarget("open")) e.preventDefault();
        return;
      }
      if (mod && !e.shiftKey && !e.altKey && e.key.toLowerCase() === "d") {
        if (clickTarget("download")) e.preventDefault();
        return;
      }
      if (e.key === "Escape" && !mod) {
        clickTarget("reset");
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);
}
