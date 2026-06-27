import { describe, it, expect } from "vitest";
import {
  tierFromIntelligence,
  valueScore,
  classifyUsecases,
  modelFromApi,
  buildDataset,
  type ORModel,
  type ORResponse,
} from "./openrouter";
import type { Dataset, LLMModel } from "./types";

const apiModel = (over: Partial<ORModel> = {}): ORModel => ({
  id: "vendorx/model-a",
  name: "VendorX: Model A",
  context_length: 200000,
  architecture: {
    modality: "text+image->text",
    input_modalities: ["text", "image"],
    output_modalities: ["text"],
  },
  pricing: {
    prompt: "0.000003",
    completion: "0.000015",
    input_cache_read: "0.0000003",
  },
  top_provider: {
    context_length: 200000,
    max_completion_tokens: 8192,
    is_moderated: false,
  },
  supported_parameters: ["tools", "structured_outputs", "reasoning"],
  ...over,
});

describe("tierFromIntelligence", () => {
  it("benchmark yoksa unknown", () =>
    expect(tierFromIntelligence(null)).toBe("unknown"));
  it("eşikler", () => {
    expect(tierFromIntelligence(24)).toBe("lightweight");
    expect(tierFromIntelligence(34)).toBe("lightweight");
    expect(tierFromIntelligence(35)).toBe("standard");
    expect(tierFromIntelligence(44)).toBe("standard");
    expect(tierFromIntelligence(45)).toBe("advanced");
    expect(tierFromIntelligence(54)).toBe("advanced");
    expect(tierFromIntelligence(55)).toBe("frontier");
    expect(tierFromIntelligence(61)).toBe("frontier");
  });
});

describe("valueScore", () => {
  it("zekâ / harman, 2 ondalık", () =>
    expect(valueScore(50, 1.125)).toBe(44.44));
  it("eksik veri → null", () => {
    expect(valueScore(null, 5)).toBeNull();
    expect(valueScore(50, null)).toBeNull();
    expect(valueScore(50, 0)).toBeNull();
  });
});

describe("modelFromApi", () => {
  it("katalog/fiyat alanlarını doğru çevirir", () => {
    const m = modelFromApi(apiModel(), undefined);
    expect(m.vendor).toBe("vendorx");
    expect(m.prompt_price).toBe(3); // 0.000003 × 1e6
    expect(m.completion_price).toBe(15);
    expect(m.blended_price).toBe(6); // (3*3+15)/4
    expect(m.is_free).toBe(false);
    expect(m.cache_read).toBeCloseTo(0.0000003, 12); // ham değer
    expect(m.input_modalities).toBe("text|image");
    expect(m.is_multimodal).toBe(true);
    expect(m.image_input).toBe(true);
    expect(m.tools).toBe(true);
    expect(m.structured_outputs).toBe(true);
    expect(m.reasoning).toBe(true);
  });

  it("ücretsiz modeli işaretler", () => {
    const m = modelFromApi(
      apiModel({ pricing: { prompt: "0", completion: "0" } }),
      undefined
    );
    expect(m.is_free).toBe(true);
    expect(m.blended_price).toBe(0);
  });

  it("negatif sentinel fiyatı null yapar", () => {
    const m = modelFromApi(
      apiModel({ pricing: { prompt: "-1000000", completion: "-1000000" } }),
      undefined
    );
    expect(m.prompt_price).toBeNull();
    expect(m.blended_price).toBeNull();
  });

  it("reasoning include_reasoning ile de algılanır", () => {
    const m = modelFromApi(
      apiModel({ supported_parameters: ["include_reasoning"] }),
      undefined
    );
    expect(m.reasoning).toBe(true);
  });

  it("önceki kayıttan benchmark alanlarını korur, value_score'u yeniden hesaplar", () => {
    const prev: LLMModel = {
      ...modelFromApi(apiModel(), undefined),
      intelligence_index: 50,
      output_tps: 80,
      latency_s: 1.2,
      has_benchmark: true,
      usecases: ["coding", "reasoning"],
      tier: "advanced",
    };
    const m = modelFromApi(apiModel(), prev);
    expect(m.intelligence_index).toBe(50);
    expect(m.output_tps).toBe(80);
    expect(m.has_benchmark).toBe(true);
    expect(m.tier).toBe("advanced"); // intel 50 → advanced
    expect(m.value_score).toBe(valueScore(50, 6));
    expect(m.usecases).toEqual(["coding", "reasoning"]); // küratörlü korunur
  });

  it("yeni modelde (prev yok) benchmark boş, tier unknown, usecase türetilir", () => {
    const m = modelFromApi(apiModel(), undefined);
    expect(m.has_benchmark).toBe(false);
    expect(m.intelligence_index).toBeNull();
    expect(m.tier).toBe("unknown");
    expect(m.usecases.length).toBeGreaterThan(0); // classify
  });
});

describe("classifyUsecases", () => {
  it("yeteneklerden türetir", () => {
    const base = modelFromApi(apiModel(), undefined);
    const uc = classifyUsecases(base);
    expect(uc).toContain("agentic"); // tools+structured
    expect(uc).toContain("vision"); // image_input
    expect(uc).toContain("long_context"); // 200k
  });
  it("yeteneksiz model → general", () => {
    const bare = modelFromApi(
      apiModel({
        context_length: 8000,
        architecture: {
          modality: "text->text",
          input_modalities: ["text"],
          output_modalities: ["text"],
        },
        pricing: { prompt: "0.00002", completion: "0.00002" },
        supported_parameters: [],
      }),
      undefined
    );
    expect(classifyUsecases(bare)).toEqual(["general"]);
  });
});

describe("buildDataset", () => {
  const prev: Dataset = {
    generated_at: "2026-01-01T00:00:00Z",
    total: 1,
    vendors: ["vendorx"],
    usecase_meta: {
      coding: {
        tr: "Kod",
        en: "Coding",
        icon: "Code",
        desc_tr: "",
        desc_en: "",
      },
    },
    models: [
      {
        ...modelFromApi(apiModel(), undefined),
        intelligence_index: 50,
        has_benchmark: true,
        usecases: ["coding"],
        tier: "advanced",
      },
    ],
  };

  it("eklenen/çıkarılan modelleri raporlar, usecase_meta'yı korur", () => {
    const api: ORResponse = {
      data: [
        apiModel(),
        apiModel({ id: "newco/new-model", name: "NewCo: New" }),
      ],
    };
    const { dataset, added, removed, total } = buildDataset(
      api,
      prev,
      "2026-06-27T00:00:00Z"
    );
    expect(total).toBe(2);
    expect(added).toEqual(["newco/new-model"]);
    expect(removed).toEqual([]);
    expect(dataset.usecase_meta).toBe(prev.usecase_meta);
    expect(dataset.vendors).toEqual(["newco", "vendorx"]); // türetilmiş + sıralı
    expect(dataset.generated_at).toBe("2026-06-27T00:00:00Z");
  });

  it("API'de olmayan model removed olarak işaretlenir", () => {
    const api: ORResponse = { data: [apiModel({ id: "newco/only-new" })] };
    const { added, removed } = buildDataset(api, prev, "x");
    expect(added).toEqual(["newco/only-new"]);
    expect(removed).toEqual(["vendorx/model-a"]);
  });

  it("zekâya göre azalan sıralar (benchmark'lılar üstte)", () => {
    const api: ORResponse = {
      data: [apiModel({ id: "a/low" }), apiModel({ id: "vendorx/model-a" })],
    };
    const { dataset } = buildDataset(api, prev, "x");
    // vendorx/model-a prev'den intel=50 alır; a/low benchmark'sız → üstte vendorx olmalı
    expect(dataset.models[0].id).toBe("vendorx/model-a");
  });
});
