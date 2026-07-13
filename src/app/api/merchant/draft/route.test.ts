import { beforeEach, describe, expect, it, vi } from "vitest";
import { APICallError } from "ai";

vi.mock("server-only", () => ({}));
vi.mock("@/lib/supabase/config", () => ({ isDemoMode: () => true }));
vi.mock("@/lib/merchant/draft-provider", async (importOriginal) => {
  const actual = await importOriginal<typeof import("@/lib/merchant/draft-provider")>();
  return {
    ...actual,
    generateMerchantDraft: vi.fn(),
  };
});

import { POST } from "./route";
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
});
