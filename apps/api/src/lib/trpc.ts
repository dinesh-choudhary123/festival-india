import { initTRPC } from "@trpc/server";
import type { Env } from "../types";

export interface Context {
  env: Env;
}

const t = initTRPC.context<Context>().create();

export const router = t.router;
export const publicProcedure = t.procedure;
export const middleware = t.middleware;
