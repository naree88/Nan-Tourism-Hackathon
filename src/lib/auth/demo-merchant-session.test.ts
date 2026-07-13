import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/server", () => ({
  createSupabaseServerClient: vi.fn(),
}));

import { DEMO_MERCHANT_PROFILE_ID } from "@/lib/auth/demo-merchant";
import { createSupabaseServerClient } from "@/lib/supabase/server";
import { requireDemoMerchantSession } from "./demo-merchant-session";

const getClaims = vi.fn();

function configuredClient() {
  return {
    auth: { getClaims },
  } as never;
}

describe("requireDemoMerchantSession", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(createSupabaseServerClient).mockResolvedValue(configuredClient());
  });

  it("returns 503 when Supabase public configuration is missing", async () => {
    vi.mocked(createSupabaseServerClient).mockResolvedValue(null);
    await expect(requireDemoMerchantSession()).resolves.toMatchObject({ ok: false, status: 503 });
  });

  it("returns 401 when there is no verified Auth claim", async () => {
    getClaims.mockResolvedValue({ data: null, error: new Error("invalid token") });
    await expect(requireDemoMerchantSession()).resolves.toMatchObject({ ok: false, status: 401 });
  });

  it("rejects an account that puts authorization data only in user metadata", async () => {
    getClaims.mockResolvedValue({
      data: {
        claims: {
          sub: "auth-user-1",
          user_metadata: {
            demo_merchant: true,
            merchant_profile_id: DEMO_MERCHANT_PROFILE_ID,
          },
        },
      },
      error: null,
    });
    await expect(requireDemoMerchantSession()).resolves.toMatchObject({ ok: false, status: 403 });
  });

  it("rejects signed metadata for a different merchant profile", async () => {
    getClaims.mockResolvedValue({
      data: {
        claims: {
          sub: "auth-user-1",
          app_metadata: { demo_merchant: true, merchant_profile_id: "another-shop" },
        },
      },
      error: null,
    });
    await expect(requireDemoMerchantSession()).resolves.toMatchObject({ ok: false, status: 403 });
  });

  it("returns the logical demo owner for the authorized signed session", async () => {
    getClaims.mockResolvedValue({
      data: {
        claims: {
          sub: "auth-user-1",
          app_metadata: {
            demo_merchant: true,
            merchant_profile_id: DEMO_MERCHANT_PROFILE_ID,
          },
        },
      },
      error: null,
    });
    await expect(requireDemoMerchantSession()).resolves.toEqual({
      ok: true,
      userId: "auth-user-1",
      ownerProfileId: DEMO_MERCHANT_PROFILE_ID,
    });
  });
});
