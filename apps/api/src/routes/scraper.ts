import { z } from "zod";
import { router, publicProcedure } from "../lib/trpc";
import { scrapeCalendarific } from "../services/calendarific";

export const scraperRouter = router({
  // Trigger a scrape for a specific year
  triggerScrape: publicProcedure
    .input(
      z.object({
        year: z.number(),
        country: z.string().default("IN"),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const apiKey = ctx.env.CALENDARIFIC_API_KEY;
      if (!apiKey) {
        return { success: false, error: "CALENDARIFIC_API_KEY not configured. Set it in wrangler.toml or Cloudflare dashboard." };
      }

      try {
        const result = await scrapeCalendarific(
          ctx.env.DB,
          apiKey,
          input.year,
          input.country
        );
        return { success: true, ...result };
      } catch (error) {
        const message = error instanceof Error ? error.message : "Unknown error";
        return { success: false, error: message };
      }
    }),

  // Scrape ALL 5 years at once
  scrapeAll: publicProcedure
    .input(z.object({ country: z.string().default("IN") }))
    .mutation(async ({ input, ctx }) => {
      const apiKey = ctx.env.CALENDARIFIC_API_KEY;
      if (!apiKey) {
        return { success: false, error: "CALENDARIFIC_API_KEY not configured" };
      }

      const currentYear = new Date().getFullYear();
      const years = Array.from({ length: 5 }, (_, i) => currentYear + i);
      const results: { year: number; status: string; count?: number; duplicatesRemoved?: number; error?: string }[] = [];

      for (const year of years) {
        try {
          const result = await scrapeCalendarific(ctx.env.DB, apiKey, year, input.country);
          results.push({ year, status: "success", count: result.count, duplicatesRemoved: result.duplicatesRemoved });
        } catch (error) {
          const message = error instanceof Error ? error.message : "Unknown error";
          results.push({ year, status: "failed", error: message });
        }
      }

      const totalCount = results.reduce((sum, r) => sum + (r.count || 0), 0);
      return { success: true, totalFestivals: totalCount, results };
    }),

  // Get scrape history
  getHistory: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.env.DB.prepare(
      "SELECT * FROM scrape_log ORDER BY scraped_at DESC LIMIT 50"
    ).all();
    return result.results || [];
  }),

  // Get current data status per year
  getStatus: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.env.DB.prepare(
      "SELECT year, COUNT(*) as count, source FROM festivals GROUP BY year, source ORDER BY year"
    ).all();
    return result.results || [];
  }),
});
