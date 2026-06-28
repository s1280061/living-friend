import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { serverEnv } from "@/lib/env";
import type { Database } from "@/types/database";

/**
 * Service-role Supabase client for server-side use (API routes, cron).
 * Bypasses RLS — NEVER import this into client components.
 *
 * Lazily created so importing the module never throws at build time.
 */
let cached: SupabaseClient<Database> | null = null;

export function getAdminClient(): SupabaseClient<Database> {
  if (cached) return cached;
  cached = createClient<Database>(serverEnv.supabaseUrl, serverEnv.supabaseServiceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
    global: {
      // Opt out of Next.js's fetch Data Cache: the friend's life changes over
      // time, so every server-side read must hit Supabase fresh (no stale
      // schedule/emotion/status). Without this, GET route handlers serve
      // cached query results.
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
  return cached;
}
