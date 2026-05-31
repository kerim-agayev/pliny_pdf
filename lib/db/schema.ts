import { pgTable, text, timestamp, boolean, integer } from "drizzle-orm/pg-core";

/**
 * PlinyPDF database schema (Drizzle + Supabase Postgres).
 *
 * The first four tables (users, sessions, accounts, verifications) are required
 * by Better Auth. JS property keys must match Better Auth's field names exactly
 * (the Drizzle adapter maps by property key, not by SQL column name).
 * `plan` is a PlinyPDF-specific additional field on the user.
 */

export const users = pgTable("users", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  image: text("image"),
  plan: text("plan", { enum: ["free", "pro"] }).notNull().default("free"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const sessions = pgTable("sessions", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const accounts = pgTable("accounts", {
  id: text("id").primaryKey(),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  idToken: text("id_token"),
  accessTokenExpiresAt: timestamp("access_token_expires_at"),
  refreshTokenExpiresAt: timestamp("refresh_token_expires_at"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const verifications = pgTable("verifications", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/** Pro subscriptions, mirrored from Lemonsqueezy webhooks. */
export const subscriptions = pgTable("subscriptions", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  lemonsqueezySubscriptionId: text("lemonsqueezy_subscription_id").notNull(),
  status: text("status").notNull(),
  currentPeriodEnd: timestamp("current_period_end"),
  planVariant: text("plan_variant"), // "monthly" | "yearly"
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

/**
 * History of CLOUD tool runs only (PDF↔Word, AI Summary). Local in-browser tools
 * are NEVER recorded here — that is the privacy guarantee (CLAUDE.md §9.5/§14).
 */
export const fileHistory = pgTable("file_history", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  toolSlug: text("tool_slug").notNull(),
  filename: text("filename").notNull(),
  size: integer("size").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

/** Persistent usage counters (keyed by user id or IP) for dashboard stats. */
export const usageCounters = pgTable("usage_counters", {
  id: text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID()),
  userIdOrIp: text("user_id_or_ip").notNull(),
  counterType: text("counter_type", { enum: ["server_tool", "ai_summary"] }).notNull(),
  count: integer("count").notNull().default(0),
  resetAt: timestamp("reset_at").notNull(),
});
