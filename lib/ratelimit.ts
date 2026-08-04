import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";

/**
 * Upstash-backed rate limiting (CLAUDE.md §9.6; daily caps revised Phase 5 Wave 5A):
 *  - anonymous (IP):   3 server-tool runs / day, no AI
 *  - free account:     10 server-tool runs / day, 2 AI summaries / month
 *  - pro:              unlimited (bypass — legacy accounts keep this)
 *
 * Note: `userServer` is shared by all server tools (incl. Edit PDF). Per-tool
 * rate-limit key separation is planned for Wave 5B (CLAUDE_5.md §10).
 */
const redis = Redis.fromEnv(); // UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN

/** Daily server-tool caps per tier — single source for limiters, badges, and /api/usage. */
export const SERVER_DAILY = { anon: 3, free: 10 } as const;

const ipServer = new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(SERVER_DAILY.anon, "1 d"), prefix: "pp:ip:server" });
const userServer = new Ratelimit({ redis, limiter: Ratelimit.fixedWindow(SERVER_DAILY.free, "1 d"), prefix: "pp:user:server" });

export type Plan = "free" | "pro";
export type LimitOutcome = { ok: boolean; remaining: number; resetAt: number };

const UNLIMITED: LimitOutcome = { ok: true, remaining: Number.POSITIVE_INFINITY, resetAt: 0 };

/** Server-tool limit. `plan === null` ⇒ anonymous (IP key). Pro bypasses. */
export async function checkServerTool(plan: Plan | null, key: string): Promise<LimitOutcome> {
  if (plan === "pro") return UNLIMITED;
  const limiter = plan === "free" ? userServer : ipServer;
  const r = await limiter.limit(key);
  return { ok: r.success, remaining: r.remaining, resetAt: r.reset };
}

/** Remaining counts without consuming — for the dashboard usage cards. */
export async function remainingServerTool(plan: Plan | null, key: string): Promise<number> {
  if (plan === "pro") return Number.POSITIVE_INFINITY;
  const limiter = plan === "free" ? userServer : ipServer;
  return (await limiter.getRemaining(key)).remaining;
}
