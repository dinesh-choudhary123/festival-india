import { z } from "zod";
import { router, publicProcedure } from "../lib/trpc";

export const calendarRouter = router({
  // Add festival to user calendar
  add: publicProcedure
    .input(
      z.object({
        festivalId: z.string(),
        userId: z.string(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const id = crypto.randomUUID();
      await ctx.env.DB.prepare(
        "INSERT OR IGNORE INTO calendar_entries (id, festival_id, user_id, notes) VALUES (?1, ?2, ?3, ?4)"
      )
        .bind(id, input.festivalId, input.userId, input.notes || null)
        .run();
      return { id, success: true };
    }),

  // Remove from calendar
  remove: publicProcedure
    .input(
      z.object({
        festivalId: z.string(),
        userId: z.string(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      await ctx.env.DB.prepare(
        "DELETE FROM calendar_entries WHERE festival_id = ?1 AND user_id = ?2"
      )
        .bind(input.festivalId, input.userId)
        .run();
      return { success: true };
    }),

  // Get user's calendar
  getUserCalendar: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        year: z.number().optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      let query = `
        SELECT ce.*, f.name, f.date, f.day, f.type, f.scope, f.category, f.description
        FROM calendar_entries ce
        JOIN festivals f ON ce.festival_id = f.id
        WHERE ce.user_id = ?1
      `;
      const params: (string | number)[] = [input.userId];

      if (input.year) {
        query += " AND f.year = ?2";
        params.push(input.year);
      }

      query += " ORDER BY f.date ASC";

      const result = await ctx.env.DB.prepare(query).bind(...params).all();
      return result.results || [];
    }),
});
