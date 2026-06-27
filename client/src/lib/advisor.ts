// Öneri (advisor) ve karşılaştırma içgörü (insight) motoru
import { LLMModel, MetricBounds, norm, affordability } from "./models";
import { Lang } from "@/contexts/I18nContext";

export interface AdvisorWeights {
  intelligence: number; // 0-100
  speed: number;
  price: number;
  context: number;
}

export interface AdvisorReq {
  vision: boolean;
  audio: boolean;
  tools: boolean;
  reasoning: boolean;
  imageOutput: boolean;
}

export interface ScoredModel {
  model: LLMModel;
  score: number; // 0-100
  reasons: string[];
}

function fmtCtx(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(v % 1_000_000 === 0 ? 0 : 1)}M`;
  if (v >= 1000) return `${Math.round(v / 1000)}K`;
  return `${v}`;
}

// Bir modelin ağırlıklara göre skoru (öneri motoru)
export function scoreModels(
  models: LLMModel[],
  weights: AdvisorWeights,
  req: AdvisorReq,
  usecase: string | null,
  bounds: MetricBounds,
  lang: Lang
): ScoredModel[] {
  const wSum = weights.intelligence + weights.speed + weights.price + weights.context || 1;
  const out: ScoredModel[] = [];

  for (const m of models) {
    // Zorunlu yetenek filtreleri
    if (req.vision && !m.image_input) continue;
    if (req.audio && !m.audio_input) continue;
    if (req.tools && !m.tools) continue;
    if (req.reasoning && !m.reasoning) continue;
    if (req.imageOutput && !m.image_output) continue;
    if (usecase && !m.usecases.includes(usecase)) continue;

    // Metrik normalizasyonları (eksik veri için nötr 0.5)
    const sIntel = m.intelligence_index != null
      ? norm(m.intelligence_index, bounds.intelligence[0], bounds.intelligence[1]) : 0.45;
    const sSpeed = m.output_tps != null
      ? norm(Math.log10(m.output_tps), Math.log10(bounds.speed[0]), Math.log10(bounds.speed[1])) : 0.45;
    const aff = affordability(m, bounds);
    const sPrice = aff != null ? aff : 0.45;
    const sCtx = m.context_length > 0
      ? norm(Math.log10(m.context_length), bounds.context[0], bounds.context[1]) : 0.3;

    const raw =
      (weights.intelligence * sIntel +
        weights.speed * sSpeed +
        weights.price * sPrice +
        weights.context * sCtx) / wSum;

    const score = Math.round(raw * 100);

    // Gerekçeler
    const reasons: string[] = [];
    if (weights.intelligence >= 40 && sIntel >= 0.7)
      reasons.push(lang === "tr" ? "Üst düzey zekâ/doğruluk skoru" : "Top-tier intelligence score");
    if (weights.speed >= 40 && sSpeed >= 0.7)
      reasons.push(lang === "tr" ? `Çok hızlı (~${m.output_tps} tok/s)` : `Very fast (~${m.output_tps} tok/s)`);
    if (weights.price >= 40 && sPrice >= 0.75)
      reasons.push(m.is_free
        ? (lang === "tr" ? "Tamamen ücretsiz" : "Completely free")
        : (lang === "tr" ? "Düşük maliyet" : "Low cost"));
    if (weights.context >= 40 && sCtx >= 0.7)
      reasons.push(lang === "tr" ? `Geniş bağlam (${fmtCtx(m.context_length)} token)` : `Large context (${fmtCtx(m.context_length)} tokens)`);
    if (m.is_multimodal && (req.vision || req.audio))
      reasons.push(lang === "tr" ? "Multimodal giriş desteği" : "Multimodal input support");
    if (m.tools && m.structured_outputs && reasons.length < 3)
      reasons.push(lang === "tr" ? "Ajan & araç çağırma hazır" : "Agent & tool-calling ready");
    if (reasons.length === 0)
      reasons.push(lang === "tr" ? "Önceliklerinizle dengeli uyum" : "Balanced fit for your priorities");

    out.push({ model: m, score, reasons: reasons.slice(0, 3) });
  }

  out.sort((a, b) => b.score - a.score);
  return out;
}

// Karşılaştırma kazananları
export interface CompareWinners {
  intelligence?: string;
  speed?: string;
  price?: string;
  value?: string;
  context?: string;
}

export function computeWinners(models: LLMModel[]): CompareWinners {
  const w: CompareWinners = {};
  const byIntel = models.filter((m) => m.intelligence_index != null)
    .sort((a, b) => (b.intelligence_index! - a.intelligence_index!));
  if (byIntel.length) w.intelligence = byIntel[0].id;
  const bySpeed = models.filter((m) => m.output_tps != null)
    .sort((a, b) => (b.output_tps! - a.output_tps!));
  if (bySpeed.length) w.speed = bySpeed[0].id;
  const byPrice = models.filter((m) => m.blended_price != null)
    .sort((a, b) => (a.blended_price! - b.blended_price!));
  if (byPrice.length) w.price = byPrice[0].id;
  const byValue = models.filter((m) => m.value_score != null)
    .sort((a, b) => (b.value_score! - a.value_score!));
  if (byValue.length) w.value = byValue[0].id;
  const byCtx = [...models].sort((a, b) => b.context_length - a.context_length);
  if (byCtx.length && byCtx[0].context_length > 0) w.context = byCtx[0].id;
  return w;
}

// Otomatik içgörü cümleleri (karşılaştırma için)
export function generateInsights(models: LLMModel[], lang: Lang): string[] {
  if (models.length < 2) return [];
  const tr = lang === "tr";
  const ins: string[] = [];
  const name = (m: LLMModel) => m.name.split(":").pop()!.trim();

  // Zekâ farkı
  const wi = models.filter((m) => m.intelligence_index != null);
  if (wi.length >= 2) {
    const top = [...wi].sort((a, b) => b.intelligence_index! - a.intelligence_index!)[0];
    const bot = [...wi].sort((a, b) => a.intelligence_index! - b.intelligence_index!)[0];
    if (top.id !== bot.id) {
      const diff = (top.intelligence_index! - bot.intelligence_index!).toFixed(0);
      ins.push(tr
        ? `${name(top)}, zekâ endeksinde en güçlü model (${name(bot)}'den ${diff} puan önde).`
        : `${name(top)} leads on intelligence (${diff} points ahead of ${name(bot)}).`);
    }
  }

  // Hız vs zekâ trade-off
  const ws = models.filter((m) => m.output_tps != null);
  if (ws.length >= 2) {
    const fast = [...ws].sort((a, b) => b.output_tps! - a.output_tps!)[0];
    ins.push(tr
      ? `${name(fast)} en hızlısı (~${fast.output_tps} tok/s); gerçek zamanlı senaryolar için ideal.`
      : `${name(fast)} is the fastest (~${fast.output_tps} tok/s); ideal for real-time scenarios.`);
  }

  // Maliyet
  const wp = models.filter((m) => m.blended_price != null);
  if (wp.length >= 2) {
    const cheap = [...wp].sort((a, b) => a.blended_price! - b.blended_price!)[0];
    const exp = [...wp].sort((a, b) => b.blended_price! - a.blended_price!)[0];
    if (cheap.id !== exp.id && exp.blended_price! > 0) {
      const ratio = (exp.blended_price! / Math.max(cheap.blended_price!, 0.0001));
      if (ratio >= 1.5) {
        ins.push(tr
          ? `${name(exp)}, ${name(cheap)}'e kıyasla ~${ratio.toFixed(1)}x daha pahalı. Bütçe kritikse ${name(cheap)} öne çıkıyor.`
          : `${name(exp)} is ~${ratio.toFixed(1)}x pricier than ${name(cheap)}. If budget matters, ${name(cheap)} stands out.`);
      }
    }
  }

  // Değer (zeka/maliyet)
  const wv = models.filter((m) => m.value_score != null);
  if (wv.length >= 2) {
    const best = [...wv].sort((a, b) => b.value_score! - a.value_score!)[0];
    ins.push(tr
      ? `${name(best)}, fiyat/performans (değer) açısından en verimli seçenek.`
      : `${name(best)} offers the best value (intelligence per dollar).`);
  }

  // Bağlam
  const byCtx = [...models].sort((a, b) => b.context_length - a.context_length);
  if (byCtx.length >= 2 && byCtx[0].context_length >= byCtx[1].context_length * 2) {
    ins.push(tr
      ? `${name(byCtx[0])}, ${fmtCtx(byCtx[0].context_length)} token bağlamıyla uzun belge/kod tabanı işlemede açık ara önde.`
      : `${name(byCtx[0])} dominates long-document/codebase work with a ${fmtCtx(byCtx[0].context_length)} token context.`);
  }

  // Multimodal kapsam
  const mm = models.filter((m) => m.is_multimodal);
  if (mm.length && mm.length < models.length) {
    const names = mm.map(name).join(", ");
    ins.push(tr
      ? `Yalnızca ${names} görsel/çoklu ortam girdisini destekliyor; diğerleri salt metin.`
      : `Only ${names} support image/multimodal input; the others are text-only.`);
  }

  return ins;
}
