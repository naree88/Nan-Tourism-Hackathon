"use client";

import { createBrowserClient } from "@supabase/ssr";
import { getSupabasePublicConfig } from "./config";

export function createSupabaseBrowserClient() {
  const { url, key } = getSupabasePublicConfig();

  if (!url || !key) {
    throw new Error("Supabase is not configured. The app is running in demo mode.");
  }

  return createBrowserClient(url, key);
}
