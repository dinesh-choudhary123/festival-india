import { z } from "zod";
import { router, publicProcedure } from "../lib/trpc";

export const postsRouter = router({
  create: publicProcedure
    .input(
      z.object({
        festivalId: z.string(),
        userId: z.string(),
        content: z.string(),
        platform: z.enum(["instagram", "twitter", "facebook", "linkedin"]),
        scheduledAt: z.string().optional(),
      })
    )
    .mutation(async ({ input, ctx }) => {
      const id = crypto.randomUUID();
      const status = input.scheduledAt ? "scheduled" : "draft";

      await ctx.env.DB.prepare(
        `INSERT INTO social_posts (id, festival_id, user_id, content, platform, scheduled_at, status)
         VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7)`
      )
        .bind(
          id,
          input.festivalId,
          input.userId,
          input.content,
          input.platform,
          input.scheduledAt || null,
          status
        )
        .run();

      return { id, status };
    }),

  getUserPosts: publicProcedure
    .input(
      z.object({
        userId: z.string(),
        status: z.enum(["draft", "scheduled", "published"]).optional(),
      })
    )
    .query(async ({ input, ctx }) => {
      let query = `
        SELECT sp.*, f.name as festival_name, f.date as festival_date
        FROM social_posts sp
        JOIN festivals f ON sp.festival_id = f.id
        WHERE sp.user_id = ?1
      `;
      const params: (string | number)[] = [input.userId];

      if (input.status) {
        query += " AND sp.status = ?2";
        params.push(input.status);
      }

      query += " ORDER BY sp.created_at DESC";

      const result = await ctx.env.DB.prepare(query).bind(...params).all();
      return result.results || [];
    }),

  delete: publicProcedure
    .input(z.object({ id: z.string(), userId: z.string() }))
    .mutation(async ({ input, ctx }) => {
      await ctx.env.DB.prepare(
        "DELETE FROM social_posts WHERE id = ?1 AND user_id = ?2"
      )
        .bind(input.id, input.userId)
        .run();
      return { success: true };
    }),
});
