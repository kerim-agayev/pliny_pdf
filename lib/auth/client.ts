"use client";

import { createAuthClient } from "better-auth/react";

/** Browser-side Better Auth client. Same-origin (:3000), so baseURL is implicit. */
export const authClient = createAuthClient();

export const { signIn, signUp, signOut, useSession } = authClient;
