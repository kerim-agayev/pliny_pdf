# Phase 9 — Architecture Notes

## Limit system (Wave 9A)

```
lib/ratelimit.ts        SERVER_DAILY {anon:3, free:10}  ──┐ (single source for daily caps)
lib/limits.ts           *_MAX_* constants + helpers       │
                        getToolLimits(toolId, plan) ───────┼─► returns {mb,count,unit,cloud,dailyLimit?}
                                                           │
backend server/routes/* import the same helpers ──────────┘ (enforcement == display, by construction)

components/shared/LimitBadge.tsx   presentational, i18n ("LimitBadge" namespace), all states
components/tools/FileDropzone.tsx  toolId → getToolLimits → renders LimitBadge + inline validation
app/api/usage/route.ts             GET → {plan,used,total,remaining} via remainingServerTool()
lib/hooks/useDailyUsage.ts         client fetch of /api/usage (cloud tools only)
```

- **Plan source (client):** `useSession()` from `@/lib/auth/client` → `user.plan` → `effectivePlan()` → `"anon" | "free"`.
- **Plan source (server, /api/usage):** `auth.api.getSession({ headers })`; anon keyed by `clientIp`.
- **Tiers:** anon / free only (Pro maps to free limits via `effectivePlan`; Pro daily = unlimited).
- **Tools without file input:** `text-to-pdf`, `markdown-to-pdf` never pass `toolId` → no badge.
