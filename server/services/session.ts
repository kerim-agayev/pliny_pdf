import { auth } from "@/lib/auth";

export type Plan = "free" | "pro";
export type Requester = { userId: string; plan: Plan } | null;

/**
 * Resolve the logged-in user (and plan) from the Better Auth session cookie on a
 * cross-origin request. Returns null for anonymous requests. Both processes share
 * the same Better Auth instance + secret + database, so this validates the cookie
 * the Next.js app set.
 */
export async function getRequester(headers: Headers): Promise<Requester> {
  try {
    const session = await auth.api.getSession({ headers });
    if (!session?.user) return null;
    const plan = (session.user as { plan?: Plan }).plan ?? "free";
    return { userId: session.user.id, plan };
  } catch {
    return null;
  }
}
