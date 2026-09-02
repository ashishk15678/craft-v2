import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "@/server/root";
import { createContext } from "@/server/trpc";

const handler = (request: Request) =>
  fetchRequestHandler({
    endpoint: "/api/trpc",
    req: request,
    router: appRouter,
    createContext,
    onError:
      process.env.NODE_ENV !== "production"
        ? ({ path, error }) =>
            console.error(`[tRPC] ${path ?? "?"}: ${error.message}`)
        : undefined,
  });

export { handler as GET, handler as POST };
