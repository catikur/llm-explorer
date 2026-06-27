import { describe, it, expect } from "vitest";
import {
  fmtPrice,
  fmtContext,
  fmtUsd,
  computeBounds,
  affordability,
  displayName,
  vendorLabel,
} from "./models";
import type { LLMModel } from "@shared/types";

const mk = (over: Partial<LLMModel>): LLMModel =>
  ({
    id: "v/m",
    name: "V: M",
    vendor: "v",
    context_length: 128000,
    max_completion_tokens: null,
    modality: "text->text",
    input_modalities: "text",
    output_modalities: "text",
    is_multimodal: false,
    image_input: false,
    audio_input: false,
    file_input: false,
    image_output: false,
    prompt_price: 1,
    completion_price: 2,
    blended_price: 1.25,
    is_free: false,
    cache_read: null,
    tools: false,
    reasoning: false,
    structured_outputs: false,
    is_moderated: false,
    intelligence_index: null,
    output_tps: null,
    latency_s: null,
    has_benchmark: false,
    usecases: [],
    tier: "unknown",
    value_score: null,
    ...over,
  }) as LLMModel;

describe("fmtPrice", () => {
  it("biçimlendirme eşikleri", () => {
    expect(fmtPrice(null)).toBe("—");
    expect(fmtPrice(0)).toBe("Ücretsiz");
    expect(fmtPrice(0.004)).toBe("$0.0040");
    expect(fmtPrice(0.5)).toBe("$0.500");
    expect(fmtPrice(12.5)).toBe("$12.50");
    expect(fmtPrice(250)).toBe("$250");
  });
});

describe("fmtUsd", () => {
  it("büyüklüğe göre ondalık", () => {
    expect(fmtUsd(0)).toBe("$0");
    expect(fmtUsd(0.0005)).toBe("$0.0005");
    expect(fmtUsd(0.033)).toBe("$0.033");
    expect(fmtUsd(660)).toBe("$660.00");
    expect(fmtUsd(12345, "en")).toBe("$12,345");
  });
});

describe("fmtContext", () => {
  it("K / M kısaltması", () => {
    expect(fmtContext(0)).toBe("—");
    expect(fmtContext(128000)).toBe("128K");
    expect(fmtContext(1000000)).toBe("1M");
    expect(fmtContext(1500000)).toBe("1.5M");
  });
});

describe("vendorLabel / displayName", () => {
  it("vendor etiketi", () => {
    expect(vendorLabel("meta-llama")).toBe("Meta Llama");
    expect(vendorLabel("~anthropic")).toBe("Anthropic");
  });
  it("model adından vendor önekini ayırır", () => {
    expect(displayName(mk({ name: "Anthropic: Claude Opus" }))).toBe(
      "Claude Opus"
    );
    expect(displayName(mk({ name: "PlainName" }))).toBe("PlainName");
  });
});

describe("computeBounds / affordability", () => {
  const models = [
    mk({
      intelligence_index: 30,
      output_tps: 50,
      blended_price: 0.5,
      context_length: 8000,
    }),
    mk({
      intelligence_index: 60,
      output_tps: 200,
      blended_price: 10,
      context_length: 1000000,
    }),
  ];
  it("min/max sınırları (fiyat ve bağlam log uzayında)", () => {
    const b = computeBounds(models);
    expect(b.intelligence).toEqual([30, 60]);
    expect(b.speed).toEqual([50, 200]);
    expect(b.price[0]).toBeCloseTo(Math.log10(0.5));
    expect(b.price[1]).toBeCloseTo(Math.log10(10));
  });
  it("ücretsiz model en yüksek ucuzluk skoru (1)", () => {
    const b = computeBounds(models);
    expect(affordability(mk({ is_free: true }), b)).toBe(1);
  });
  it("en pahalı model en düşük ucuzluk skoru", () => {
    const b = computeBounds(models);
    const cheap = affordability(models[0], b)!;
    const exp = affordability(models[1], b)!;
    expect(cheap).toBeGreaterThan(exp);
  });
});
