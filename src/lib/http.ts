import { NextResponse } from "next/server";
import { serverEnv } from "@/lib/env";

export function json<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json(data, init);
}

export function fail(message: string, status = 500): NextResponse {
  return NextResponse.json({ error: message }, { status });
}

/** Wrap a handler so thrown errors become clean 500s instead of crashes. */
export function handler(fn: () => Promise<NextResponse>) {
  return async (): Promise<NextResponse> => {
    try {
      return await fn();
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Unknown error";
      return fail(msg, 500);
    }
  };
}

/**
 * Verify a request came from Vercel Cron (or an authorized caller).
 * Vercel sends `Authorization: Bearer <CRON_SECRET>`.
 */
export function assertCron(req: Request): void {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${serverEnv.cronSecret}`) {
    throw new CronUnauthorized();
  }
}

export class CronUnauthorized extends Error {
  constructor() {
    super("Unauthorized");
    this.name = "CronUnauthorized";
  }
}

/** Cron handler wrapper that maps auth failures to 401. */
export function cronHandler(fn: (req: Request) => Promise<NextResponse>) {
  return async (req: Request): Promise<NextResponse> => {
    try {
      assertCron(req);
      return await fn(req);
    } catch (e) {
      if (e instanceof CronUnauthorized) return fail("Unauthorized", 401);
      const msg = e instanceof Error ? e.message : "Unknown error";
      return fail(msg, 500);
    }
  };
}
