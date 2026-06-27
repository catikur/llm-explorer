// OpenRouter veri tazeleme — saf dönüşüm mantığı.
// Hem tarayıcı (sitedeki "Tazele" butonu) hem de Node scripti (scripts/refresh-dataset.ts)
// bu modülü kullanır. DOM/Node'a özgü API YOK — her iki ortamda da çalışır.
//
// Strateji: Katalog/fiyat alanları OpenRouter API'sinden tazelenir. Benchmark alanları
// (intelligence_index, output_tps, latency_s) API'de YOKTUR → mevcut veri kümesinden
// model id'siyle eşleştirilerek KORUNUR. Yeni modeller eklenir; benchmark'ları boş kalır.

import type { Dataset, LLMModel } from "./types";

export const OPENROUTER_MODELS_URL = "https://openrouter.ai/api/v1/models";

// --- OpenRouter API model şekli (yalnızca kullandığımız alanlar) ---
export interface ORModel {
  id: string;
  name: string;
  context_length: number | null;
  architecture: {
    modality: string;
    input_modalities: string[];
    output_modalities: string[];
  };
  pricing: {
    prompt: string;
    completion: string;
    input_cache_read?: string;
  };
  top_provider: {
    context_length: number | null;
    max_completion_tokens: number | null;
    is_moderated: boolean;
  };
  supported_parameters?: string[];
}
export interface ORResponse {
  data: ORModel[];
}

const round = (n: number, d = 6) => Math.round(n * 10 ** d) / 10 ** d;

// $/M token. API fiyatları token başınadır → ×1e6. Negatif sentinel (-1000000) → null.
function perMillion(v: string | undefined): number | null {
  if (v == null) return null;
  const n = Number(v);
  if (!isFinite(n) || n < 0) return null;
  return round(n * 1e6);
}

// Benchmark eşiğine göre seviye. Benchmark yoksa "unknown".
export function tierFromIntelligence(intel: number | null): LLMModel["tier"] {
  if (intel == null) return "unknown";
  if (intel < 35) return "lightweight";
  if (intel < 45) return "standard";
  if (intel < 55) return "advanced";
  return "frontier";
}

// Değer skoru = zekâ / harmanlanmış fiyat (dolar başına zekâ).
export function valueScore(
  intel: number | null,
  blended: number | null
): number | null {
  if (intel == null || blended == null || blended <= 0) return null;
  return round(intel / blended, 2);
}

// Yetenek-temelli use-case sınıflandırması — YALNIZCA API'de yeni görülen modellere
// uygulanır (mevcut modellerde küratörlü usecases korunur). En iyi çaba/yaklaşıktır.
export function classifyUsecases(m: LLMModel): string[] {
  const uc: string[] = [];
  const intel = m.intelligence_index ?? 0;
  const cheap = m.is_free || (m.blended_price != null && m.blended_price <= 1);
  const modalityCount =
    (m.image_input ? 1 : 0) + (m.audio_input ? 1 : 0) + (m.file_input ? 1 : 0);

  if (m.tools && m.structured_outputs) uc.push("agentic");
  if (m.image_input) uc.push("vision");
  if (modalityCount >= 2 || m.audio_input) uc.push("multimodal");
  if (m.reasoning && m.has_benchmark) uc.push("reasoning");
  if (m.tools && m.structured_outputs && m.has_benchmark && intel >= 45)
    uc.push("coding");
  if (m.output_tps != null && m.output_tps >= 100) uc.push("realtime");
  if (m.context_length >= 200_000) uc.push("long_context");
  if (cheap) uc.push("budget");
  if (m.is_moderated && m.tools && m.reasoning && m.image_input)
    uc.push("enterprise");
  if (m.image_output) uc.push("generation");
  if (m.reasoning && intel >= 45) uc.push("writing");
  if (uc.length === 0) uc.push("general");

  return Array.from(new Set(uc));
}

// Tek bir API modelini, varsa önceki küratörlü kaydı koruyarak LLMModel'e çevirir.
export function modelFromApi(o: ORModel, prev: LLMModel | undefined): LLMModel {
  const inMods = o.architecture?.input_modalities ?? [];
  const outMods = o.architecture?.output_modalities ?? [];
  const sp = new Set(o.supported_parameters ?? []);

  const prompt_price = perMillion(o.pricing?.prompt);
  const completion_price = perMillion(o.pricing?.completion);
  const blended_price =
    prompt_price != null && completion_price != null
      ? round((3 * prompt_price + completion_price) / 4)
      : null;
  const is_free =
    Number(o.pricing?.prompt) === 0 && Number(o.pricing?.completion) === 0;

  const cacheRaw = o.pricing?.input_cache_read;
  const cache_read =
    cacheRaw != null && Number(cacheRaw) >= 0
      ? round(Number(cacheRaw), 12)
      : null;

  // API'de bulunmayan, mevcut veriden korunan alanlar:
  const intelligence_index = prev?.intelligence_index ?? null;
  const output_tps = prev?.output_tps ?? null;
  const latency_s = prev?.latency_s ?? null;
  const has_benchmark = prev?.has_benchmark ?? false;

  const m: LLMModel = {
    id: o.id,
    name: o.name,
    vendor: o.id.split("/")[0],
    context_length: o.context_length ?? o.top_provider?.context_length ?? 0,
    max_completion_tokens: o.top_provider?.max_completion_tokens ?? null,
    modality: o.architecture?.modality ?? "text->text",
    input_modalities: inMods.join("|"),
    output_modalities: outMods.join("|"),
    is_multimodal: inMods.length > 1,
    image_input: inMods.includes("image"),
    audio_input: inMods.includes("audio"),
    file_input: inMods.includes("file"),
    image_output: outMods.includes("image"),
    prompt_price,
    completion_price,
    blended_price,
    is_free,
    cache_read,
    tools: sp.has("tools"),
    reasoning: sp.has("reasoning") || sp.has("include_reasoning"),
    structured_outputs: sp.has("structured_outputs"),
    is_moderated: o.top_provider?.is_moderated ?? false,
    intelligence_index,
    output_tps,
    latency_s,
    has_benchmark,
    usecases: [],
    tier: tierFromIntelligence(intelligence_index),
    value_score: valueScore(intelligence_index, blended_price),
  };

  // Mevcut modelde küratörlü usecases'i koru; yeni modelde yetenekten türet.
  m.usecases = prev?.usecases?.length ? prev.usecases : classifyUsecases(m);
  return m;
}

export interface RefreshResult {
  dataset: Dataset;
  added: string[]; // yeni model id'leri
  removed: string[]; // API'de artık olmayan model id'leri
  total: number;
}

// API yanıtını + önceki veri kümesini alıp yeni Dataset üretir.
// usecase_meta önceki kümeden korunur (statik TR/EN meta, API'de yoktur).
export function buildDataset(
  api: ORResponse,
  prev: Dataset,
  generatedAt: string
): RefreshResult {
  const prevById = new Map(prev.models.map(m => [m.id, m]));
  const apiIds = new Set(api.data.map(m => m.id));

  const models = api.data.map(o => modelFromApi(o, prevById.get(o.id)));
  models.sort((a, b) => {
    // Önce zekâya göre (varsa), sonra ada göre — istikrarlı sıralama.
    const ai = a.intelligence_index ?? -1;
    const bi = b.intelligence_index ?? -1;
    if (bi !== ai) return bi - ai;
    return a.name.localeCompare(b.name);
  });

  const vendors = Array.from(new Set(models.map(m => m.vendor))).sort();
  const added = models.filter(m => !prevById.has(m.id)).map(m => m.id);
  const removed = prev.models.filter(m => !apiIds.has(m.id)).map(m => m.id);

  const dataset: Dataset = {
    generated_at: generatedAt,
    total: models.length,
    vendors,
    usecase_meta: prev.usecase_meta,
    models,
  };
  return { dataset, added, removed, total: models.length };
}

// API'den modelleri çeker (tarayıcı ve Node'da fetch globaldir).
export async function fetchOpenRouterModels(): Promise<ORResponse> {
  const res = await fetch(OPENROUTER_MODELS_URL, {
    headers: { Accept: "application/json" },
  });
  if (!res.ok) {
    throw new Error(`OpenRouter API ${res.status}: ${res.statusText}`);
  }
  return (await res.json()) as ORResponse;
}
