import { afterEach, describe, expect, it, vi } from "vitest";

import { getAppDataMode } from "./config";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("Supabase data-mode configuration", () => {
  it("defaults local development to demo even when public Supabase config exists", () => {
    vi.stubEnv("APP_DATA_MODE", "");
    vi.stubEnv("VERCEL_ENV", "");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "public-test-key");

    expect(getAppDataMode()).toBe("demo");
  });

  it("uses Supabase only when explicitly selected and configured", () => {
    vi.stubEnv("APP_DATA_MODE", "supabase");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://example.supabase.co");
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY", "public-test-key");

    expect(getAppDataMode()).toBe("supabase");
  });

  it("rejects implicit Production mode", () => {
    vi.stubEnv("APP_DATA_MODE", "");
    vi.stubEnv("VERCEL_ENV", "production");

    expect(() => getAppDataMode()).toThrow(/must be set explicitly/i);
  });
});
