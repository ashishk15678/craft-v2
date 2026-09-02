import { router } from "@/server/trpc";
import { topicRouter } from "@/server/routers/topic";

export const appRouter = router({
  topic: topicRouter,
});

export type AppRouter = typeof appRouter;
