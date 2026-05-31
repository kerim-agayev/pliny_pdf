import { Elysia, t } from "elysia";
import { eq } from "drizzle-orm";
import { createCheckout, billingConfigured, verifyWebhook } from "../services/lemonsqueezy";
import { auth } from "@/lib/auth";
import { db } from "@/lib/db";
import { users, subscriptions } from "@/lib/db/schema";

const FRONTEND = process.env.FRONTEND_ORIGIN ?? "http://localhost:3000";

/** subscription_* statuses that grant Pro. Everything else falls back to free. */
const PRO_STATUSES = new Set(["active", "on_trial"]);

export const billing = new Elysia({ prefix: "/api" })
  // Create a hosted checkout for the signed-in user (Pro CTA on /pricing).
  .post(
    "/billing/checkout",
    async ({ body, request, set }) => {
      if (!billingConfigured()) {
        set.status = 503;
        return { error: "notConfigured", message: "Billing is not configured yet." };
      }
      const session = await auth.api.getSession({ headers: request.headers });
      if (!session?.user) {
        set.status = 401;
        return { error: "needAuth", message: "Please sign in to upgrade." };
      }
      const plan = body.plan === "yearly" ? "yearly" : "monthly";
      try {
        const url = await createCheckout({
          plan,
          userId: session.user.id,
          email: session.user.email,
          redirectUrl: `${FRONTEND}/dashboard?upgraded=1`,
        });
        return { url };
      } catch (e) {
        console.error("[billing] checkout failed:", e);
        set.status = 502;
        return { error: "checkoutFailed", message: "Could not start checkout. Please try again." };
      }
    },
    { body: t.Object({ plan: t.String() }) },
  )
  // Lemonsqueezy webhook. Raw body needed for HMAC, so we override the parser.
  .post(
    "/webhooks/lemonsqueezy",
    async ({ body, request, set }) => {
      const raw = typeof body === "string" ? body : "";
      if (!verifyWebhook(raw, request.headers.get("x-signature"))) {
        set.status = 401;
        return { error: "badSignature" };
      }
      let event: LsEvent;
      try {
        event = JSON.parse(raw) as LsEvent;
      } catch {
        set.status = 400;
        return { error: "badPayload" };
      }

      const eventName = event.meta?.event_name;
      const userId = event.meta?.custom_data?.user_id;
      const data = event.data;
      const attrs = data?.attributes ?? {};

      // Ignore anything that isn't one of our checkouts or carries no subscription id.
      if (!userId || data?.id == null) return { ok: true };
      const lsSubId = String(data.id);

      switch (eventName) {
        case "subscription_created":
        case "subscription_updated": {
          const plan = PRO_STATUSES.has(attrs.status ?? "") ? "pro" : "free";
          await db.update(users).set({ plan, updatedAt: new Date() }).where(eq(users.id, userId));
          await upsertSubscription(userId, lsSubId, attrs);
          break;
        }
        case "subscription_cancelled":
        case "subscription_expired": {
          await db.update(users).set({ plan: "free", updatedAt: new Date() }).where(eq(users.id, userId));
          await upsertSubscription(userId, lsSubId, attrs);
          break;
        }
        default:
          break; // order_created etc. — subscription_* drives the plan flip
      }
      return { ok: true };
    },
    { parse: ({ request }) => request.text() },
  );

async function upsertSubscription(
  userId: string,
  lsSubId: string,
  attrs: LsSubAttributes,
) {
  const row = {
    userId,
    lemonsqueezySubscriptionId: lsSubId,
    status: attrs.status ?? "unknown",
    currentPeriodEnd: attrs.renews_at ? new Date(attrs.renews_at) : null,
    planVariant: attrs.variant_id != null ? String(attrs.variant_id) : null,
    updatedAt: new Date(),
  };
  const existing = await db
    .select({ id: subscriptions.id })
    .from(subscriptions)
    .where(eq(subscriptions.lemonsqueezySubscriptionId, lsSubId))
    .limit(1);
  if (existing.length) {
    await db.update(subscriptions).set(row).where(eq(subscriptions.id, existing[0].id));
  } else {
    await db.insert(subscriptions).values(row);
  }
}

type LsSubAttributes = {
  status?: string;
  variant_id?: number | string;
  renews_at?: string | null;
};
type LsEvent = {
  meta?: { event_name?: string; custom_data?: { user_id?: string } };
  data?: { id?: string | number; attributes?: LsSubAttributes };
};
