import { describe, expect, it } from "vitest";
import { Output } from "ai";
import { z } from "zod";

import {
  merchantAIResponseSchema,
  normalizeMerchantAIResponse,
} from "./contracts";

function expectOpenAIStrictObjects(value: unknown, path = "$") {
  if (Array.isArray(value)) {
    value.forEach((item, index) => expectOpenAIStrictObjects(item, `${path}[${index}]`));
    return;
  }
  if (!value || typeof value !== "object") return;

  const schema = value as Record<string, unknown>;
  if (schema.properties && typeof schema.properties === "object") {
    const propertyNames = Object.keys(schema.properties);
    expect(schema.additionalProperties, `${path} must reject unknown properties`).toBe(false);
    expect(
      [...((schema.required as string[] | undefined) ?? [])].sort(),
      `${path} must require every property`,
    ).toEqual([...propertyNames].sort());
  }

  for (const unsupported of ["minLength", "maxLength", "const"]) {
    expect(schema, `${path} must not use ${unsupported}`).not.toHaveProperty(unsupported);
  }

  Object.entries(schema).forEach(([key, item]) => {
    expectOpenAIStrictObjects(item, `${path}.${key}`);
  });
}

const emptyResponse = {
  kinds: [],
  offering: null,
  menuItems: null,
  menuNote: null,
  openingNote: null,
  workation: null,
  fieldEvidence: [],
  unresolvedFields: [],
} as const;

describe("merchant OpenAI response contract", () => {
  it("emits only strict object schemas and supported string constraints", () => {
    expectOpenAIStrictObjects(z.toJSONSchema(merchantAIResponseSchema));
  });

  it("preserves the strict schema through the AI SDK wire conversion", async () => {
    const responseFormat = await Output.object({
      name: "MerchantProfilePatch",
      schema: merchantAIResponseSchema,
    }).responseFormat;

    expect(responseFormat?.type).toBe("json");
    if (responseFormat?.type !== "json") throw new Error("Expected a JSON response format");
    expectOpenAIStrictObjects(responseFormat.schema);
  });

  it("requires nullable properties to be present at the OpenAI boundary", () => {
    const incompleteResponse = {
      kinds: [],
      offering: null,
      menuItems: null,
      menuNote: null,
      workation: null,
      fieldEvidence: [],
      unresolvedFields: [],
    };

    expect(merchantAIResponseSchema.safeParse(incompleteResponse).success).toBe(false);
    expect(merchantAIResponseSchema.safeParse(emptyResponse).success).toBe(true);
  });

  it("normalizes nulls to omitted domain fields at every object level", () => {
    const response = {
      ...emptyResponse,
      kinds: ["offering", "menu", "workation"],
      offering: {
        beanName: "Doi Suan Ya Luang",
        originProvince: null,
        originName: null,
        producer: null,
        altitudeMeters: null,
        varietal: null,
        process: "natural",
        processingLocation: { province: "Nan", locality: null },
        roastLevel: null,
        roasterLocation: null,
        tastingNotes: [],
        tasteProfiles: ["fruity"],
        brewMethods: ["filter"],
        price: null,
        availability: null,
      },
      menuItems: [{
        id: null,
        nameTh: "กาแฟดริป",
        nameEn: null,
        descriptionTh: null,
        descriptionEn: null,
        priceThb: 120,
        isAvailable: null,
        isCafePick: null,
        usesFeaturedSingleOrigin: true,
      }],
      workation: {
        wifi: "available",
        downloadMbps: null,
        uploadMbps: null,
        pingMs: null,
        outlets: null,
        workSeating: null,
        videoCalls: null,
        policyText: null,
      },
    } as const;

    expect(normalizeMerchantAIResponse(response)).toEqual({
      kinds: ["offering", "menu", "workation"],
      offering: {
        beanName: "Doi Suan Ya Luang",
        process: "natural",
        processingLocation: { province: "Nan" },
        tastingNotes: [],
        tasteProfiles: ["fruity"],
        brewMethods: ["filter"],
      },
      menuItems: [{
        nameTh: "กาแฟดริป",
        priceThb: 120,
        usesFeaturedSingleOrigin: true,
      }],
      workation: { wifi: "available" },
      fieldEvidence: [],
      unresolvedFields: [],
    });
  });

  it("revalidates normalized output with the existing domain schema", () => {
    expect(merchantAIResponseSchema.safeParse({
      ...emptyResponse,
      menuNote: "x".repeat(2_001),
    }).success).toBe(true);

    expect(() => normalizeMerchantAIResponse({
      ...emptyResponse,
      menuNote: "x".repeat(2_001),
    })).toThrow();
  });
});
