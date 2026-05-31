import { createHmac, timingSafeEqual } from "node:crypto";

/**
 * Lemonsqueezy billing (replaces Paddle for Phase 1 — see decisions.md). We hit
 * the REST API directly with fetch (same pattern as gemini.ts / gotenberg.ts) to
 * avoid an SDK dependency. The *_PRODUCT_*_ID env vars hold VARIANT ids (locked
 * decision this sprint) and are used directly as the checkout variant.
 */
const API = "https://api.lemonsqueezy.com/v1";

function variantId(plan: "monthly" | "yearly"): string | undefined {
  return plan === "yearly"
    ? process.env.LEMONSQUEEZY_PRODUCT_YEARLY_ID
    : process.env.LEMONSQUEEZY_PRODUCT_MONTHLY_ID;
}

export function billingConfigured(): boolean {
  return Boolean(process.env.LEMONSQUEEZY_API_KEY && process.env.LEMONSQUEEZY_STORE_ID);
}

/**
 * Create a hosted checkout for the chosen variant, tagged with our user id (echoed
 * back in the webhook's `meta.custom_data`). Returns the hosted checkout URL.
 */
export async function createCheckout(opts: {
  plan: "monthly" | "yearly";
  userId: string;
  email: string;
  redirectUrl: string;
}): Promise<string> {
  const variant = variantId(opts.plan);
  const storeId = process.env.LEMONSQUEEZY_STORE_ID;
  const apiKey = process.env.LEMONSQUEEZY_API_KEY;
  if (!variant || !storeId || !apiKey) throw new Error("billing_not_configured");

  const res = await fetch(`${API}/checkouts`, {
    method: "POST",
    headers: {
      Accept: "application/vnd.api+json",
      "Content-Type": "application/vnd.api+json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      data: {
        type: "checkouts",
        attributes: {
          checkout_data: {
            email: opts.email,
            custom: { user_id: opts.userId },
          },
          product_options: { redirect_url: opts.redirectUrl },
        },
        relationships: {
          store: { data: { type: "stores", id: String(storeId) } },
          variant: { data: { type: "variants", id: String(variant) } },
        },
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text();
    throw new Error(`lemonsqueezy ${res.status}: ${detail.slice(0, 300)}`);
  }
  const json = (await res.json()) as { data: { attributes: { url: string } } };
  return json.data.attributes.url;
}

/** Verify a Lemonsqueezy webhook via HMAC-SHA256 of the raw body (X-Signature header). */
export function verifyWebhook(rawBody: string, signature: string | null): boolean {
  const secret = process.env.LEMONSQUEEZY_WEBHOOK_SECRET;
  if (!secret || !signature) return false;
  const digest = createHmac("sha256", secret).update(rawBody).digest("hex");
  try {
    return timingSafeEqual(Buffer.from(digest, "hex"), Buffer.from(signature, "hex"));
  } catch {
    return false;
  }
}
