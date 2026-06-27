// Model veri tipleri ve yardımcılar — OpenRouter LLM Explorer
// Veri şekli tipleri shared/ içinde (Node tazeleme scriptiyle paylaşılır).

export type { LLMModel, UsecaseMeta, Dataset } from "@shared/types";
import type { LLMModel, Dataset } from "@shared/types";

export const TIER_LABEL: Record<
  string,
  { tr: string; en: string; color: string }
> = {
  frontier: { tr: "Sınır", en: "Frontier", color: "#22D3EE" },
  advanced: { tr: "İleri", en: "Advanced", color: "#34D399" },
  standard: { tr: "Standart", en: "Standard", color: "#FBBF24" },
  lightweight: { tr: "Hafif", en: "Lightweight", color: "#A78BFA" },
  unknown: { tr: "Belirsiz", en: "Unknown", color: "#64748B" },
};

// Temiz, görüntülenebilir model adı (vendor önekini ayır)
export function displayName(m: LLMModel): string {
  const parts = m.name.split(":");
  return parts.length > 1 ? parts.slice(1).join(":").trim() : m.name;
}

export function vendorLabel(v: string): string {
  return v
    .replace(/^~/, "")
    .replace(/-/g, " ")
    .replace(/\b\w/g, c => c.toUpperCase());
}

// Fiyat formatı ($/M token)
export function fmtPrice(v: number | null): string {
  if (v === null || v === undefined) return "—";
  if (v === 0) return "Ücretsiz";
  if (v < 0.01) return `$${v.toFixed(4)}`;
  if (v < 1) return `$${v.toFixed(3)}`;
  if (v < 100) return `$${v.toFixed(2)}`;
  return `$${v.toFixed(0)}`;
}

export function fmtContext(v: number): string {
  if (!v) return "—";
  if (v >= 1_000_000)
    return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (v >= 1000) return `${Math.round(v / 1000)}K`;
  return `${v}`;
}

// Dolar tutarı biçimi (maliyet hesaplayıcıları için) — büyüklüğe göre ondalık.
export function fmtUsd(v: number, lang = "en"): string {
  if (v === 0) return "$0";
  if (v < 0.01) return "$" + v.toFixed(4);
  if (v < 1) return "$" + v.toFixed(3);
  if (v < 1000) return "$" + v.toFixed(2);
  return "$" + Math.round(v).toLocaleString(lang === "tr" ? "tr-TR" : "en-US");
}

export function fmtNum(v: number | null, suffix = ""): string {
  if (v === null || v === undefined) return "—";
  if (v >= 1000) return `${(v / 1000).toFixed(1)}K${suffix}`;
  return `${v}${suffix}`;
}

// Normalizasyon için global min/max (metrik çubukları için)
export interface MetricBounds {
  intelligence: [number, number];
  speed: [number, number];
  price: [number, number]; // log uzayında
  context: [number, number];
}

export function computeBounds(models: LLMModel[]): MetricBounds {
  const intel = models
    .map(m => m.intelligence_index)
    .filter((x): x is number => x != null);
  const speed = models
    .map(m => m.output_tps)
    .filter((x): x is number => x != null);
  const price = models
    .map(m => m.blended_price)
    .filter((x): x is number => x != null && x > 0);
  const ctx = models.map(m => m.context_length).filter(x => x > 0);
  return {
    intelligence: [Math.min(...intel), Math.max(...intel)],
    speed: [Math.min(...speed), Math.max(...speed)],
    price: [Math.log10(Math.min(...price)), Math.log10(Math.max(...price))],
    context: [Math.log10(Math.min(...ctx)), Math.log10(Math.max(...ctx))],
  };
}

// 0-1 normalize
export function norm(v: number, min: number, max: number): number {
  if (max === min) return 0.5;
  return Math.max(0, Math.min(1, (v - min) / (max - min)));
}

// Maliyet için "ucuzluk skoru" (düşük fiyat = yüksek skor)
export function affordability(
  m: LLMModel,
  bounds: MetricBounds
): number | null {
  if (m.is_free) return 1;
  if (m.blended_price == null || m.blended_price <= 0) return null;
  const logP = Math.log10(m.blended_price);
  return 1 - norm(logP, bounds.price[0], bounds.price[1]);
}

export async function loadDataset(): Promise<Dataset> {
  const res = await fetch("/models_dataset.json");
  if (!res.ok) throw new Error("Veri yüklenemedi");
  return res.json();
}
