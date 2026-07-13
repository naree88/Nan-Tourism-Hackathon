export function getSupabasePublicConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key =
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return { url, key };
}

export function isSupabaseConfigured() {
  const { url, key } = getSupabasePublicConfig();
  return Boolean(url && key);
}

export type AppDataMode = "demo" | "supabase";

export function getAppDataMode(): AppDataMode {
  const configured = process.env.APP_DATA_MODE;
  if (configured && configured !== "demo" && configured !== "supabase") {
    throw new Error("APP_DATA_MODE must be either 'demo' or 'supabase'.");
  }

  if (configured === "supabase" && !isSupabaseConfigured()) {
    throw new Error("APP_DATA_MODE is 'supabase' but Supabase public environment variables are missing.");
  }
  if (configured === "demo" || configured === "supabase") return configured;

  if (process.env.VERCEL_ENV === "production") {
    throw new Error("APP_DATA_MODE must be set explicitly for a production Vercel deployment.");
  }

  // Local development and non-production previews stay isolated from the
  // connected database unless Supabase mode is explicitly requested.
  return "demo";
}

export function isDemoMode() {
  return getAppDataMode() === "demo";
}
