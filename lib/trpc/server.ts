import { createCallerFactory } from "@trpc/server";
import { cache } from "react";
import { appRouter } from "@/server/root";
import { createContext } from "@/server/trpc";

const createCaller = createCallerFactory(appRouter);

/** Server-side tRPC caller — use in Server Components and API routes */
export const api = cache(async () => {
  const ctx = await createContext();
  return createCaller(ctx);
});
