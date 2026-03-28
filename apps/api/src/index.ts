// ============================================
// Festival India — Cloudflare Worker Entry Point
// ============================================

import { fetchRequestHandler } from "@trpc/server/adapters/fetch";
import { appRouter } from "./router";
import type { Env } from "./types";

// Re-export Durable Object
export { CalendarRoom } from "./services/durable-calendar";

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
};

export default {
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    // CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // WebSocket endpoint for real-time collaboration
    if (url.pathname.startsWith("/ws/calendar/")) {
      const roomId = url.pathname.split("/ws/calendar/")[1];
      const id = env.CALENDAR_ROOM.idFromName(roomId);
      const room = env.CALENDAR_ROOM.get(id);
      const newUrl = new URL(request.url);
      newUrl.pathname = "/websocket";
      return room.fetch(new Request(newUrl.toString(), request));
    }

    // Health check
    if (url.pathname === "/health") {
      return new Response(
        JSON.stringify({ status: "ok", timestamp: new Date().toISOString() }),
        {
          headers: { ...CORS_HEADERS, "Content-Type": "application/json" },
        }
      );
    }

    // tRPC handler
    if (url.pathname.startsWith("/trpc")) {
      const response = await fetchRequestHandler({
        endpoint: "/trpc",
        req: request,
        router: appRouter,
        createContext: () => ({ env }),
      });

      // Add CORS headers
      const newHeaders = new Headers(response.headers);
      Object.entries(CORS_HEADERS).forEach(([key, value]) => {
        newHeaders.set(key, value);
      });

      return new Response(response.body, {
        status: response.status,
        statusText: response.statusText,
        headers: newHeaders,
      });
    }

    return new Response("Festival India API", {
      headers: { ...CORS_HEADERS, "Content-Type": "text/plain" },
    });
  },

  // Scheduled handler — auto-scrape on Jan 1st each year
  async scheduled(event: ScheduledEvent, env: Env): Promise<void> {
    const currentYear = new Date().getFullYear();
    const years = Array.from({ length: 5 }, (_, i) => currentYear + i);

    for (const year of years) {
      const existing = await env.DB.prepare(
        "SELECT COUNT(*) as count FROM festivals WHERE year = ?1"
      )
        .bind(year)
        .first<{ count: number }>();

      if (!existing || existing.count === 0) {
        const { scrapeCalendarific } = await import("./services/calendarific");
        try {
          await scrapeCalendarific(env.DB, env.CALENDARIFIC_API_KEY, year, "IN");
        } catch (e) {
          console.error(`Failed to scrape year ${year}:`, e);
        }
      }
    }
  },
} satisfies ExportedHandler<Env>;
