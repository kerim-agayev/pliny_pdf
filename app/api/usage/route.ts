import { NextResponse } from "next/server";
import { headers } from "next/headers";
import { auth } from "@/lib/auth";
import { remainingServerTool, SERVER_DAILY } from "@/lib/ratelimit";

/**
 * Remaining daily server-tool quota for the current visitor — read by the
 * LimitBadge on cloud tools (Phase 9 Wave 9A). Mirrors the dashboard's usage
 * logic; no quota is consumed. Pro returns an unlimited marker (no daily line).
 */
export const dynamic = "force-dynamic";

// Matches the backend routes' clientIp so anon buckets line up best-effort.
function clientIp(h: Headers): string {
  const xff = h.get("x-forwarded-for");
  return xff?.split(",")[0]?.trim() || h.get("x-real-ip") || "local";
}

export async function GET() {
  const h = await headers();
  const session = await auth.api.getSession({ headers: h });
  const user = session?.user as { id: string; plan?: "free" | "pro" } | undefined;

  if (user) {
    if (user.plan === "pro") {
      return NextResponse.json({ plan: "pro", used: 0, total: null, remaining: null });
    }
    const total = SERVER_DAILY.free;
    const remaining = await remainingServerTool("free", user.id);
    const used = Math.max(0, Math.min(total, total - remaining));
    return NextResponse.json({ plan: "free", used, total, remaining });
  }

  const total = SERVER_DAILY.anon;
  const remaining = await remainingServerTool(null, clientIp(h));
  const used = Math.max(0, Math.min(total, total - remaining));
  return NextResponse.json({ plan: "anon", used, total, remaining });
}
