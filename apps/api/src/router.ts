import { router } from "./lib/trpc";
import { festivalsRouter } from "./routes/festivals";
import { calendarRouter } from "./routes/calendar";
import { postsRouter } from "./routes/posts";
import { scraperRouter } from "./routes/scraper";

export const appRouter = router({
  festivals: festivalsRouter,
  calendar: calendarRouter,
  posts: postsRouter,
  scraper: scraperRouter,
});

export type AppRouter = typeof appRouter;
