import { spawnSync } from "node:child_process";

/**
 * drizzle-kit wrapper. Bun auto-loads .env.local into process.env when it runs
 * this file (`bun run db:*`), but does NOT pass it through to a spawned node
 * binary like drizzle-kit. So we run drizzle-kit via Bun and forward the
 * already-loaded environment explicitly. Usage: bun run scripts/db.ts <push|generate>
 */
const sub = process.argv[2] ?? "push";

if (!process.env.DATABASE_URL) {
  console.error("DATABASE_URL is not set — is it present in .env.local?");
  process.exit(1);
}

const res = spawnSync("bun", ["x", "drizzle-kit", sub], {
  stdio: "inherit",
  env: process.env,
});

process.exit(res.status ?? 1);
