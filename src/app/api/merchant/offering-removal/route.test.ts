import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/config", () => ({ isDemoMode: () => true }));
vi.mock("@/lib/auth/demo-merchant-session", () => ({
  requireDemoMerchantSession: vi.fn().mockResolvedValue({
    ok: false,
    status: 401,
    message: "กรุณาเข้าสู่ระบบร้านค้า",
  }),
}));

import { POST } from "./route";

describe("POST /api/merchant/offering-removal demo authentication", () => {
  it("rejects an anonymous request before parsing the removal payload", async () => {
    const response = await POST(new Request("http://localhost/api/merchant/offering-removal", {
      method: "POST",
      body: "not-json",
    }));

    expect(response.status).toBe(401);
    await expect(response.json()).resolves.toEqual({ message: "กรุณาเข้าสู่ระบบร้านค้า" });
  });
});
