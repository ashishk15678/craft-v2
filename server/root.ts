import { router } from "@/server/trpc";
import { orgRouter } from "@/server/routers/org";
import { courseRouter } from "@/server/routers/course";
import { lessonRouter } from "@/server/routers/lesson";
import { pageRouter } from "@/server/routers/page";
import { badgeRouter } from "@/server/routers/badge";
import { adminRouter } from "@/server/routers/admin";

export const appRouter = router({
  org: orgRouter,
  course: courseRouter,
  lesson: lessonRouter,
  page: pageRouter,
  badge: badgeRouter,
  admin: adminRouter,
});

export type AppRouter = typeof appRouter;
