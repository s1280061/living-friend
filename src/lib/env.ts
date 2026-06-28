/**
 * Centralised, validated access to environment variables.
 * Server-only secrets are read lazily so they are never bundled to the client.
 */

function required(name: string, value: string | undefined): string {
  if (!value || value.length === 0) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

/** Safe to use anywhere (browser included). */
export const publicEnv = {
  supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
};

/** Server-only. Calling these from the browser will throw. */
export const serverEnv = {
  get supabaseUrl() {
    return required("NEXT_PUBLIC_SUPABASE_URL", process.env.NEXT_PUBLIC_SUPABASE_URL);
  },
  get supabaseServiceRoleKey() {
    return required("SUPABASE_SERVICE_ROLE_KEY", process.env.SUPABASE_SERVICE_ROLE_KEY);
  },
  get groqApiKey() {
    return required("GROQ_API_KEY", process.env.GROQ_API_KEY);
  },
  get groqBaseUrl() {
    // Groq Cloud is OpenAI-compatible at this base path.
    return process.env.GROQ_BASE_URL ?? "https://api.groq.com/openai/v1";
  },
  get groqModel() {
    return process.env.GROQ_MODEL ?? "llama-3.3-70b-versatile";
  },
  get newsApiKey() {
    return process.env.NEWS_API_KEY ?? "";
  },
  get newsApiBaseUrl() {
    return process.env.NEWS_API_BASE_URL ?? "https://newsapi.org/v2";
  },
  get cronSecret() {
    return required("CRON_SECRET", process.env.CRON_SECRET);
  },
  get defaultFriendSlug() {
    return process.env.DEFAULT_FRIEND_SLUG ?? "haru";
  },
};
