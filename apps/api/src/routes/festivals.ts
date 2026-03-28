import { z } from "zod";
import { router, publicProcedure } from "../lib/trpc";
import type { D1Festival } from "../types";

export const festivalsRouter = router({
  // List festivals with filters
  list: publicProcedure
    .input(
      z.object({
        year: z.number().optional(),
        month: z.number().min(1).max(12).optional(),
        category: z.string().optional(),
        type: z.string().optional(),
        scope: z.string().optional(),
        search: z.string().optional(),
        country: z.string().optional().default("IN"),
        page: z.number().min(1).optional().default(1),
        limit: z.number().min(1).max(1000).optional().default(500),
      })
    )
    .query(async ({ input, ctx }) => {
      const { year, month, category, type, scope, search, country, page, limit } = input;
      const currentYear = year || new Date().getFullYear();

      let query = "SELECT * FROM festivals WHERE year = ?1 AND country = ?2";
      const params: (string | number)[] = [currentYear, country];
      let paramIndex = 3;

      if (month) {
        query += ` AND CAST(substr(date, 6, 2) AS INTEGER) = ?${paramIndex}`;
        params.push(month);
        paramIndex++;
      }

      if (category && category !== "All Categories") {
        query += ` AND category = ?${paramIndex}`;
        params.push(category);
        paramIndex++;
      }

      if (type && type !== "All Types") {
        query += ` AND type = ?${paramIndex}`;
        params.push(type);
        paramIndex++;
      }

      if (scope && scope !== "All Scopes") {
        query += ` AND scope = ?${paramIndex}`;
        params.push(scope);
        paramIndex++;
      }

      if (search) {
        query += ` AND name LIKE ?${paramIndex}`;
        params.push(`%${search}%`);
        paramIndex++;
      }

      // Count query
      const countQuery = query.replace("SELECT *", "SELECT COUNT(*) as total");
      const countResult = await ctx.env.DB.prepare(countQuery)
        .bind(...params)
        .first<{ total: number }>();

      const total = countResult?.total || 0;
      const totalPages = Math.ceil(total / limit);
      const offset = (page - 1) * limit;

      // Add ordering and pagination
      query += " ORDER BY date ASC";
      query += ` LIMIT ?${paramIndex} OFFSET ?${paramIndex + 1}`;
      params.push(limit, offset);

      const result = await ctx.env.DB.prepare(query)
        .bind(...params)
        .all<D1Festival>();

      const festivals = (result.results || []).map((f) => ({
        ...f,
        is_public_holiday: Boolean(f.is_public_holiday),
        regions: f.regions ? JSON.parse(f.regions) : [],
      }));

      return {
        festivals,
        total,
        page,
        totalPages,
        year: currentYear,
      };
    }),

  // Get single festival by ID
  getById: publicProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ input, ctx }) => {
      const result = await ctx.env.DB.prepare(
        "SELECT * FROM festivals WHERE id = ?1"
      )
        .bind(input.id)
        .first<D1Festival>();

      if (!result) return null;

      return {
        ...result,
        is_public_holiday: Boolean(result.is_public_holiday),
        regions: result.regions ? JSON.parse(result.regions) : [],
      };
    }),

  // Get festivals for a specific date
  getByDate: publicProcedure
    .input(z.object({ date: z.string() }))
    .query(async ({ input, ctx }) => {
      const result = await ctx.env.DB.prepare(
        "SELECT * FROM festivals WHERE date = ?1 ORDER BY name ASC"
      )
        .bind(input.date)
        .all<D1Festival>();

      return (result.results || []).map((f) => ({
        ...f,
        is_public_holiday: Boolean(f.is_public_holiday),
        regions: f.regions ? JSON.parse(f.regions) : [],
      }));
    }),

  // Get available years
  getYears: publicProcedure.query(async ({ ctx }) => {
    const result = await ctx.env.DB.prepare(
      "SELECT DISTINCT year FROM festivals ORDER BY year ASC"
    ).all<{ year: number }>();

    return (result.results || []).map((r) => r.year);
  }),

  // Get festival stats
  getStats: publicProcedure
    .input(z.object({ year: z.number().optional() }))
    .query(async ({ input, ctx }) => {
      const year = input.year || new Date().getFullYear();

      const [totalResult, byType, byScope, byCategory, byMonth] =
        await Promise.all([
          ctx.env.DB.prepare(
            "SELECT COUNT(*) as total FROM festivals WHERE year = ?1"
          )
            .bind(year)
            .first<{ total: number }>(),
          ctx.env.DB.prepare(
            "SELECT type, COUNT(*) as count FROM festivals WHERE year = ?1 GROUP BY type"
          )
            .bind(year)
            .all<{ type: string; count: number }>(),
          ctx.env.DB.prepare(
            "SELECT scope, COUNT(*) as count FROM festivals WHERE year = ?1 GROUP BY scope"
          )
            .bind(year)
            .all<{ scope: string; count: number }>(),
          ctx.env.DB.prepare(
            "SELECT category, COUNT(*) as count FROM festivals WHERE year = ?1 GROUP BY category ORDER BY count DESC"
          )
            .bind(year)
            .all<{ category: string; count: number }>(),
          ctx.env.DB.prepare(
            "SELECT CAST(substr(date, 6, 2) AS INTEGER) as month, COUNT(*) as count FROM festivals WHERE year = ?1 GROUP BY month ORDER BY month"
          )
            .bind(year)
            .all<{ month: number; count: number }>(),
        ]);

      return {
        total: totalResult?.total || 0,
        byType: byType.results || [],
        byScope: byScope.results || [],
        byCategory: byCategory.results || [],
        byMonth: byMonth.results || [],
        year,
      };
    }),

  // Search festivals
  search: publicProcedure
    .input(
      z.object({
        query: z.string().min(1),
        year: z.number().optional(),
        limit: z.number().optional().default(20),
      })
    )
    .query(async ({ input, ctx }) => {
      let sql =
        "SELECT * FROM festivals WHERE name LIKE ?1 OR description LIKE ?1";
      const params: (string | number)[] = [`%${input.query}%`];

      if (input.year) {
        sql += " AND year = ?2";
        params.push(input.year);
      }

      sql += ` ORDER BY date ASC LIMIT ?${params.length + 1}`;
      params.push(input.limit);

      const result = await ctx.env.DB.prepare(sql)
        .bind(...params)
        .all<D1Festival>();

      return (result.results || []).map((f) => ({
        ...f,
        is_public_holiday: Boolean(f.is_public_holiday),
        regions: f.regions ? JSON.parse(f.regions) : [],
      }));
    }),

  // Upcoming festivals (next 30 days)
  upcoming: publicProcedure
    .input(z.object({ limit: z.number().optional().default(10) }))
    .query(async ({ input, ctx }) => {
      const today = new Date().toISOString().split("T")[0];
      const thirtyDaysLater = new Date(
        Date.now() + 30 * 24 * 60 * 60 * 1000
      )
        .toISOString()
        .split("T")[0];

      const result = await ctx.env.DB.prepare(
        "SELECT * FROM festivals WHERE date >= ?1 AND date <= ?2 ORDER BY date ASC LIMIT ?3"
      )
        .bind(today, thirtyDaysLater, input.limit)
        .all<D1Festival>();

      return (result.results || []).map((f) => ({
        ...f,
        is_public_holiday: Boolean(f.is_public_holiday),
        regions: f.regions ? JSON.parse(f.regions) : [],
      }));
    }),
});
