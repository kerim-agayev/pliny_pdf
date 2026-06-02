/**
 * Recent files — a localStorage-backed list of the last 10 processed files
 * (Phase 3, Wave 3F). Privacy: stores ONLY metadata (filename, tool, time, size),
 * never the file contents, and never leaves the browser. Complements the dashboard's
 * server-side history, which by design only records cloud-tool runs for signed-in users.
 */

export interface RecentFile {
  filename: string;
  toolSlug: string;
  timestamp: number; // epoch ms
  sizeMB: number;
}

const KEY = "pp:recentFiles";
const MAX = 10;
/** Emitted after any change so open panels on the same page refresh live. */
export const RECENT_FILES_EVENT = "pp:recentFiles";

export function getRecentFiles(): RecentFile[] {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? (arr as RecentFile[]) : [];
  } catch {
    return [];
  }
}

export function saveRecentFile(entry: {
  filename: string;
  toolSlug: string;
  sizeMB: number;
  timestamp?: number;
}): void {
  try {
    const ts = entry.timestamp ?? Date.now();
    // De-dupe the same file+tool, newest first, cap at MAX.
    const next: RecentFile[] = [
      { filename: entry.filename, toolSlug: entry.toolSlug, sizeMB: entry.sizeMB, timestamp: ts },
      ...getRecentFiles().filter(
        (f) => !(f.filename === entry.filename && f.toolSlug === entry.toolSlug),
      ),
    ].slice(0, MAX);
    localStorage.setItem(KEY, JSON.stringify(next));
    window.dispatchEvent(new Event(RECENT_FILES_EVENT));
  } catch {
    /* localStorage unavailable / quota — recents are best-effort */
  }
}

export function clearRecentFiles(): void {
  try {
    localStorage.removeItem(KEY);
    window.dispatchEvent(new Event(RECENT_FILES_EVENT));
  } catch {
    /* ignore */
  }
}
