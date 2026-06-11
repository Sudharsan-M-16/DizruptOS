// Environment validation — one place that knows which variables exist, which
// are required per mode, and what "demo mode" means. Import `env` anywhere
// instead of touching process.env directly.

export type RunMode = "demo" | "production";

interface Env {
  mode: RunMode;
  supabaseUrl?: string;
  supabaseAnonKey?: string;
  // Server-only — never expose: SUPABASE_SERVICE_ROLE_KEY, ANTHROPIC_API_KEY,
  // OPENAI_API_KEY are read inside API routes/workers, never in this module's
  // client-safe surface.
}

function readEnv(): Env {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Demo mode is a feature, not a failure: with no Supabase config the app
  // runs fully on the in-memory seed. Production mode requires both vars.
  if (!supabaseUrl || !supabaseAnonKey) {
    if (supabaseUrl || supabaseAnonKey) {
      // Half-configured is always a mistake — fail loudly at boot.
      throw new Error(
        "Supabase is half-configured: set BOTH NEXT_PUBLIC_SUPABASE_URL and " +
          "NEXT_PUBLIC_SUPABASE_ANON_KEY, or neither (demo mode)."
      );
    }
    return { mode: "demo" };
  }

  if (!/^https:\/\/.+\.supabase\.co/.test(supabaseUrl)) {
    throw new Error(`NEXT_PUBLIC_SUPABASE_URL does not look like a Supabase URL: ${supabaseUrl}`);
  }

  return { mode: "production", supabaseUrl, supabaseAnonKey };
}

export const env: Env = readEnv();
export const isDemoMode = env.mode === "demo";
