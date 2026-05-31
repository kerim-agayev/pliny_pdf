import { Elysia } from "elysia";

export const health = new Elysia().get("/api/health", () => ({
  ok: true,
  service: "plinypdf-backend",
}));
