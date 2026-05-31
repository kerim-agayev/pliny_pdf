import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@/lib/db";
import * as schema from "@/lib/db/schema";

/**
 * Shared Better Auth instance. Imported by:
 *  - the Next.js handler (app/api/auth/[...all]/route.ts) — runs on :3000
 *  - the Elysia backend (server/) — validates the session cookie via
 *    auth.api.getSession({ headers }) to resolve the user's plan for rate limits.
 * Both processes share BETTER_AUTH_SECRET and the same Supabase database.
 */
export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: {
      user: schema.users,
      session: schema.sessions,
      account: schema.accounts,
      verification: schema.verifications,
    },
  }),
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL: process.env.BETTER_AUTH_URL ?? "http://localhost:3000",
  // Dev defaults keep both localhost ports; prod sets TRUSTED_ORIGINS to the real https origins.
  trustedOrigins: (process.env.TRUSTED_ORIGINS ?? "http://localhost:3000,http://localhost:8080")
    .split(",")
    .map((s) => s.trim()),
  // In prod, COOKIE_DOMAIN=.plinypdf.com scopes the session cookie to the parent domain so it
  // reaches the api.plinypdf.com backend (sibling subdomain). Unset in dev (same-origin ports).
  ...(process.env.COOKIE_DOMAIN
    ? {
        advanced: {
          crossSubDomainCookies: { enabled: true, domain: process.env.COOKIE_DOMAIN },
        },
      }
    : {}),
  emailAndPassword: {
    enabled: true,
  },
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID as string,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET as string,
    },
  },
  user: {
    additionalFields: {
      // Surfaced on the session user object; managed by billing webhooks, not user input.
      plan: { type: "string", required: false, defaultValue: "free", input: false },
    },
  },
});
