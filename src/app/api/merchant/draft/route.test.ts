import { beforeEach, describe, expect, it, vi } from "vitest";
import { APICallError } from "ai";
import { z } from "zod";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/config", () => ({ isDemoMode: () => true }));
vi.mock("@/lib/auth/demo-merchant-session", () => ({
  requireDemoMerchantSession: vi.fn(),
}));
vi.mock("@/lib/merchant/draft-provider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/merchant/draft-provider")>();
  return {
    ...actual,
    generateMerchantDraft: vi.fn(),
  };
});

import { POST } from "./route";
import { requireDemoMerchantSession } from "@/lib/auth/demo-merchant-session";
import { generateMerchantDraft } from "@/lib/merchant/draft-provider";

function postDraft() {
  return POST(new Request("http://localhost/api/merchant/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      cafeId: "cafe-finder-demo-01",
      rawInput: "อัปเดตเมนูกาแฟวันนี้",
      inputMethod: "text",
    }),
  }));
}

describe("POST /api/merchant/draft provider errors", () => {
  beforeEach(() => {
    vi.mocked(generateMerchantDraft).mockReset();
    vi.mocked(requireDemoMerchantSession).mockResolvedValue({
      ok: true,
      userId: "auth-user-1",
      ownerProfileId: "merchant-demo-01",
    });
  });

  it("rejects an anonymous demo request before calling the AI provider", async () => {
    vi.mocked(requireDemoMerchantSession).mockResolvedValueOnce({
      ok: false,
      status: 401,
      message: "กรุณาเข้าสู่ระบบร้านค้า",
    });

    const response = await postDraft();

    expect(response.status).toBe(401);
    expect(generateMerchantDraft).not.toHaveBeenCalled();
  });

  it("returns only the safe mapped provider error", async () => {
    const providerSecret = "provider-secret-must-not-leak";
    vi.mocked(generateMerchantDraft).mockRejectedValueOnce(new APICallError({
      message: providerSecret,
      url: "https://api.openai.com/v1/responses",
      requestBodyValues: { apiKey: providerSecret },
      statusCode: 403,
      responseBody: JSON.stringify({
        error: { message: providerSecret, code: "provider_permission_detail" },
      }),
    }));

    const response = await postDraft();
    const payload = await response.json();

    expect(response.status).toBe(503);
    expect(payload).toEqual({
      message: "API key ไม่มีสิทธิ์เรียก Responses API หรือ Project ไม่มีสิทธิ์ใช้โมเดลนี้",
      code: "AI_PROVIDER_PERMISSION_ERROR",
    });
    expect(JSON.stringify(payload)).not.toContain(providerSecret);
    expect(JSON.stringify(payload)).not.toContain("provider_permission_detail");
  });

  it("distinguishes an invalid OpenAI response from invalid merchant input", async () => {
    const invalidOutput = z.object({ beanName: z.string().trim().min(1) }).safeParse({
      beanName: "",
    });
    if (invalidOutput.success) throw new Error("Expected the output fixture to be invalid");
    vi.mocked(generateMerchantDraft).mockRejectedValueOnce(invalidOutput.error);
    const warn = vi.spyOn(console, "warn").mockImplementation(() => undefined);

    const response = await postDraft();
    const payload = await response.json();

    expect(response.status).toBe(502);
    expect(payload).toEqual({
      message: "ระบบ AI อ่านข้อมูลแล้ว แต่ยังจัดโครงสร้างร่างไม่สำเร็จ กรุณาลองอีกครั้งค่ะ",
      code: "AI_PROVIDER_RESPONSE_INVALID",
    });
    expect(warn).toHaveBeenCalledWith(
      "[merchant-draft] OpenAI output validation failed",
      { issues: [{ code: "too_small", path: "beanName" }] },
    );
    warn.mockRestore();
  });
});
