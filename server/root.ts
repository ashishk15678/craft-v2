import { router } from "@/server/trpc";
import { topicRouter } from "@/server/routers/topic";
import { trackRouter } from "@/server/routers/track";

export const appRouter = router({
  topic: topicRouter,
  track: trackRouter,
});

export type AppRouter = typeof appRouter;
