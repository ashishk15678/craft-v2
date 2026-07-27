/**
 * Server-side tRPC caller — use in Server Components and Route Handlers.
 * Wrapped in React cache() so context is created once per request.
 */
import { cache } from "react";
import { appRouter } from "@/server/root";
import { createContext, t } from "@/server/trpc";

const createCaller = t.createCallerFactory(appRouter);

export const api = cache(async () => {
  const ctx = await createContext();
  return createCaller(ctx);
});
