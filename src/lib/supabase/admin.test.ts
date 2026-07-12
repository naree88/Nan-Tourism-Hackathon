import { createClient } from "@supabase/supabase-js";
import { afterEach, describe, expect, it, vi } from "vitest";

import { createSupabaseAdminClient } from "./admin";

vi.mock("@supabase/supabase-js", () => ({
  createClient: vi.fn(() => ({ kind: "admin-client" })),
}));

describe("Supabase admin key selection", () => {
  afterEach(() => {
    vi.unstubAllEnvs();
    vi.clearAllMocks();
  });

  it("prefers the newer scoped Supabase secret key", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("SUPABASE_SECRET_KEY", "sb_secret_scoped");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "legacy-service-role");

    expect(createSupabaseAdminClient()).toEqual({ kind: "admin-client" });
    expect(createClient).toHaveBeenCalledWith(
      "https://project.supabase.co",
      "sb_secret_scoped",
      {
        auth: {
          autoRefreshToken: false,
          detectSessionInUrl: false,
          persistSession: false,
        },
      },
    );
  });

  it("keeps the legacy service-role key as a migration fallback", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "https://project.supabase.co");
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "legacy-service-role");

    expect(createSupabaseAdminClient()).toEqual({ kind: "admin-client" });
    expect(createClient).toHaveBeenCalledWith(
      "https://project.supabase.co",
      "legacy-service-role",
      expect.any(Object),
    );
  });

  it("does not create an elevated client without both URL and backend secret", () => {
    vi.stubEnv("NEXT_PUBLIC_SUPABASE_URL", "");
    vi.stubEnv("SUPABASE_SECRET_KEY", "");
    vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "");

    expect(createSupabaseAdminClient()).toBeNull();
    expect(createClient).not.toHaveBeenCalled();
  });
});
