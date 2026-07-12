import { createHash, timingSafeEqual } from "node:crypto";
import { createOpenAI, type OpenAILanguageModelResponsesOptions } from "@ai-sdk/openai";
import { APICallError, generateText } from "ai";
import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const TOKEN_SHA256 = "5b62af40ec75863e94048a1c840c20ccb2f49e9effb9d93864f35d6dc72d0485";
const MODEL = "gpt-5.6-luna";
let requestAttempted = false;

function hasValidToken(value: string | null) {
  if (!value) return false;
  const actual = createHash("sha256").update(value, "utf8").digest();
  const expected = Buffer.from(TOKEN_SHA256, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

function calculateCostUsd(usage: {
  inputTokens?: number;
  inputTokenDetails: {
    noCacheTokens?: number;
    cacheReadTokens?: number;
    cacheWriteTokens?: number;
  };
  outputTokens?: number;
}) {
  const cacheReadTokens = usage.inputTokenDetails.cacheReadTokens ?? 0;
  const cacheWriteTokens = usage.inputTokenDetails.cacheWriteTokens ?? 0;
  const noCacheTokens = usage.inputTokenDetails.noCacheTokens
    ?? Math.max((usage.inputTokens ?? 0) - cacheReadTokens - cacheWriteTokens, 0);
  const outputTokens = usage.outputTokens ?? 0;

  return (
    noCacheTokens * 1
    + cacheReadTokens * 0.1
    + cacheWriteTokens * 1.25
    + outputTokens * 6
  ) / 1_000_000;
}

export async function POST(request: Request) {
  if (process.env.VERCEL_ENV !== "preview") {
    return new NextResponse(null, { status: 404 });
  }
  if (!hasValidToken(request.headers.get("x-openai-smoke-token"))) {
    return new NextResponse(null, { status: 404 });
  }
  if (requestAttempted) {
    return NextResponse.json({ ok: false, code: "ALREADY_ATTEMPTED" }, { status: 409 });
  }

  const apiKey = process.env.OPENAI_API_KEY?.trim();
  if (!apiKey) {
    return NextResponse.json({ ok: false, code: "OPENAI_API_KEY_MISSING" }, { status: 503 });
  }

  requestAttempted = true;
  const openai = createOpenAI({ apiKey });

  try {
    const result = await generateText({
      model: openai.responses(MODEL),
      prompt: "Reply with exactly: OK",
      maxOutputTokens: 64,
      maxRetries: 0,
      providerOptions: {
        openai: {
          store: false,
          reasoningEffort: "minimal",
          textVerbosity: "low",
        } satisfies OpenAILanguageModelResponsesOptions,
      },
    });

    return NextResponse.json({
      ok: true,
      model: MODEL,
      responseMatched: result.text.trim() === "OK",
      usage: result.usage,
      estimatedCostUsd: calculateCostUsd(result.usage),
      pricingUsdPerMillionTokens: {
        input: 1,
        cachedInput: 0.1,
        cacheWrite: 1.25,
        output: 6,
      },
    });
  } catch (error) {
    const statusCode = APICallError.isInstance(error) ? error.statusCode : undefined;
    return NextResponse.json(
      {
        ok: false,
        code: statusCode === 429 ? "OPENAI_LIMIT_OR_QUOTA" : "OPENAI_REQUEST_FAILED",
        providerStatus: statusCode ?? null,
      },
      { status: statusCode === 429 ? 429 : 502 },
    );
  }
}
