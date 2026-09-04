import { router } from "@/server/trpc";
import { topicRouter } from "@/server/routers/topic";
import { trackRouter } from "@/server/routers/track";
import { practiceRouter } from "@/server/routers/practice";
import { assessmentRouter } from "@/server/routers/assessment";

export const appRouter = router({
  topic: topicRouter,
  track: trackRouter,
  practice: practiceRouter,
  assessment: assessmentRouter,
});

export type AppRouter = typeof appRouter;
