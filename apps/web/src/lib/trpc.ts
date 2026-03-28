// tRPC client setup — used when connecting to the Cloudflare Worker API.
// Currently the app works in standalone mode using seed data.
// When deploying with the API, uncomment and configure:
//
// import { createTRPCReact } from "@trpc/react-query";
// import { httpBatchLink } from "@trpc/client";
// import type { AppRouter } from "@festival-india/api";
// export const trpc = createTRPCReact<AppRouter>();

export function getBaseUrl() {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL || "http://localhost:8787";
  }
  return process.env.API_URL || "http://localhost:8787";
}
