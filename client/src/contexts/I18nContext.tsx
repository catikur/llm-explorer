import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
  useCallback,
} from "react";

export type Lang = "tr" | "en";

type Dict = Record<string, { tr: string; en: string }>;

const DICT: Dict = {
  // Brand / nav
  brand: { tr: "LLM Explorer", en: "LLM Explorer" },
  tagline: { tr: "OpenRouter Komuta Merkezi", en: "OpenRouter Command Center" },
  nav_explore: { tr: "Keşfet", en: "Explore" },
  nav_categories: { tr: "Kategoriler", en: "Categories" },
  nav_recommend: { tr: "Öneri Motoru", en: "Advisor" },
  nav_compare: { tr: "Karşılaştır", en: "Compare" },
  // Hero
  hero_kicker: {
    tr: "339 MODEL · 56 SAĞLAYICI · TEK EKRAN",
    en: "339 MODELS · 56 PROVIDERS · ONE SCREEN",
  },
  hero_title_1: {
    tr: "OpenRouter'daki her modeli",
    en: "Compare every model on",
  },
  hero_title_2: {
    tr: "kıyasla, seç, anla.",
    en: "OpenRouter. Pick & understand.",
  },
  hero_sub: {
    tr: "Hız, doğruluk, maliyet ve multimodal yetenekleri tek bir komuta merkezinde filtreleyin, sıralayın, çoklu seçimle karşılaştırın ve anlık içgörü alın.",
    en: "Filter, sort and multi-select across speed, accuracy, cost and multimodal capabilities — with instant insights in a single command center.",
  },
  hero_cta_explore: { tr: "Modelleri keşfet", en: "Explore models" },
  hero_cta_advisor: { tr: "Bana model öner", en: "Recommend a model" },
  // Stats
  stat_models: { tr: "Toplam model", en: "Total models" },
  stat_multimodal: { tr: "Multimodal", en: "Multimodal" },
  stat_free: { tr: "Ücretsiz model", en: "Free models" },
  stat_vendors: { tr: "Sağlayıcı", en: "Providers" },
  // Filters
  filters: { tr: "Filtreler", en: "Filters" },
  reset: { tr: "Sıfırla", en: "Reset" },
  search_ph: {
    tr: "Model veya sağlayıcı ara…",
    en: "Search model or provider…",
  },
  f_usecase: { tr: "Kullanım Alanı", en: "Use case" },
  f_vendor: { tr: "Sağlayıcı", en: "Provider" },
  f_tier: { tr: "Segment", en: "Tier" },
  f_modality: { tr: "Modalite", en: "Modality" },
  f_capabilities: { tr: "Yetenekler", en: "Capabilities" },
  f_price: { tr: "Maks. maliyet ($/M)", en: "Max cost ($/M)" },
  f_only_free: { tr: "Sadece ücretsiz", en: "Free only" },
  f_only_bench: { tr: "Sadece benchmark'lı", en: "Benchmarked only" },
  cap_vision: { tr: "Görsel girişi", en: "Vision input" },
  cap_audio: { tr: "Ses girişi", en: "Audio input" },
  cap_file: { tr: "Dosya girişi", en: "File input" },
  cap_imgout: { tr: "Görsel çıkışı", en: "Image output" },
  cap_tools: { tr: "Araç çağırma", en: "Tool calling" },
  cap_reasoning: { tr: "Akıl yürütme", en: "Reasoning" },
  cap_structured: { tr: "Yapılandırılmış çıktı", en: "Structured output" },
  // Table
  col_model: { tr: "Model", en: "Model" },
  col_vendor: { tr: "Sağlayıcı", en: "Provider" },
  col_intel: { tr: "Zekâ", en: "Intelligence" },
  col_speed: { tr: "Hız (tok/s)", en: "Speed (tok/s)" },
  col_latency: { tr: "Gecikme", en: "Latency" },
  col_price: { tr: "Maliyet", en: "Cost" },
  col_value: { tr: "Değer", en: "Value" },
  col_context: { tr: "Bağlam", en: "Context" },
  col_modality: { tr: "Modalite", en: "Modality" },
  col_usecases: { tr: "Kategoriler", en: "Categories" },
  showing: { tr: "gösteriliyor", en: "showing" },
  of: { tr: "/", en: "of" },
  no_results: { tr: "Eşleşen model yok", en: "No matching models" },
  no_results_sub: {
    tr: "Filtreleri gevşetmeyi deneyin.",
    en: "Try relaxing your filters.",
  },
  na_bench: {
    tr: "Bu model için bağımsız benchmark verisi yok",
    en: "No independent benchmark for this model",
  },
  add_compare: { tr: "Karşılaştırmaya ekle", en: "Add to compare" },
  remove_compare: { tr: "Karşılaştırmadan çıkar", en: "Remove from compare" },
  // Compare tray
  compare_tray: { tr: "Karşılaştırma", en: "Comparison" },
  selected: { tr: "seçili", en: "selected" },
  open_compare: { tr: "Karşılaştır", en: "Compare" },
  clear: { tr: "Temizle", en: "Clear" },
  compare_title: { tr: "Model Karşılaştırması", en: "Model Comparison" },
  insights: { tr: "Otomatik İçgörüler", en: "Auto Insights" },
  winner_intel: { tr: "En zeki", en: "Smartest" },
  winner_speed: { tr: "En hızlı", en: "Fastest" },
  winner_price: { tr: "En ucuz", en: "Cheapest" },
  winner_value: { tr: "En iyi değer", en: "Best value" },
  winner_context: { tr: "En uzun bağlam", en: "Longest context" },
  min_two: {
    tr: "Karşılaştırmak için en az 2 model seçin.",
    en: "Select at least 2 models to compare.",
  },
  // Categories page
  cat_title: {
    tr: "Kullanım Alanına Göre Kategoriler",
    en: "Categories by Use Case",
  },
  cat_sub: {
    tr: "Her kategori, o görev için en uygun modelleri gruplar. Bir karta tıklayıp o kategoriyi keşfedin.",
    en: "Each category groups the best-fit models for that task. Click a card to explore it.",
  },
  cat_models: { tr: "model", en: "models" },
  cat_top: { tr: "Öne çıkanlar", en: "Top picks" },
  explore_cat: { tr: "Kategoriyi keşfet", en: "Explore category" },
  // Advisor
  adv_title: { tr: "Akıllı Öneri Motoru", en: "Smart Advisor" },
  adv_sub: {
    tr: "Önceliklerinizi ayarlayın, size en uygun modelleri sıralayalım.",
    en: "Set your priorities and we'll rank the best-fit models for you.",
  },
  adv_priority: { tr: "Öncelikleriniz", en: "Your priorities" },
  adv_w_intel: { tr: "Zekâ / Doğruluk", en: "Intelligence / Accuracy" },
  adv_w_speed: { tr: "Hız", en: "Speed" },
  adv_w_price: { tr: "Düşük maliyet", en: "Low cost" },
  adv_w_context: { tr: "Uzun bağlam", en: "Long context" },
  adv_req: { tr: "Zorunlu yetenekler", en: "Required capabilities" },
  adv_usecase: { tr: "Birincil kullanım alanı", en: "Primary use case" },
  adv_any: { tr: "Farketmez", en: "Any" },
  adv_results: {
    tr: "Sizin için en iyi eşleşmeler",
    en: "Best matches for you",
  },
  adv_match: { tr: "uyum", en: "match" },
  adv_why: { tr: "Neden bu model?", en: "Why this model?" },
  adv_none: {
    tr: "Kriterlere uyan model bulunamadı. Zorunlu yetenekleri azaltın.",
    en: "No models match. Try removing required capabilities.",
  },
  view_in_table: { tr: "Tabloda gör", en: "View in table" },
  // misc
  free: { tr: "Ücretsiz", en: "Free" },
  footer_note: {
    tr: "Veriler OpenRouter API'sinden; benchmark & hız tahminleri Artificial Analysis ve sektörel kaynaklardan derlenmiştir. Bilgilendirme amaçlıdır.",
    en: "Data from the OpenRouter API; benchmark & speed estimates compiled from Artificial Analysis and industry sources. For informational purposes.",
  },
  built: {
    tr: "LLM Explorer · Açık kaynak proje",
    en: "LLM Explorer · Open-source project",
  },
  back: { tr: "Geri", en: "Back" },
  customize_cols: { tr: "Sütunlar", en: "Columns" },
  density: { tr: "Yoğunluk", en: "Density" },
  comfortable: { tr: "Rahat", en: "Comfortable" },
  compact: { tr: "Sıkışık", en: "Compact" },
  // veri tazeleme
  data_label: { tr: "Veri", en: "Data" },
  refresh: { tr: "Tazele", en: "Refresh" },
  refreshing: { tr: "Tazeleniyor…", en: "Refreshing…" },
  refresh_tip: {
    tr: "OpenRouter'dan canlı tazele",
    en: "Live refresh from OpenRouter",
  },
  refresh_updated: { tr: "Veri güncellendi", en: "Data updated" },
  refresh_new: { tr: "yeni", en: "new" },
  refresh_removed: { tr: "çıkarıldı", en: "removed" },
  refresh_failed: { tr: "Tazeleme başarısız", en: "Refresh failed" },
  // paylaşım
  share: { tr: "Bağlantıyı kopyala", en: "Copy link" },
  share_ok: { tr: "Bağlantı kopyalandı", en: "Link copied" },
  share_compare: { tr: "Karşılaştırmayı paylaş", en: "Share comparison" },
  // maliyet hesaplayıcı
  cost_title: { tr: "Maliyet hesaplayıcı", en: "Cost calculator" },
  cost_hint: {
    tr: "Token hacmini gir; seçili modeller için tahmini maliyeti karşılaştır.",
    en: "Enter token volume to compare estimated cost across selected models.",
  },
  cost_in: { tr: "Girdi token / istek", en: "Input tokens / req" },
  cost_out: { tr: "Çıktı token / istek", en: "Output tokens / req" },
  cost_req: { tr: "İstek / ay", en: "Requests / mo" },
  cost_per_req: { tr: "İstek başı", en: "Per request" },
  cost_monthly: { tr: "Aylık tahmini", en: "Est. monthly" },
  cost_na: { tr: "Fiyat yok", en: "No pricing" },
  cost_cheapest: { tr: "En ucuz", en: "Cheapest" },
  // model detay
  detail_view: { tr: "Detayı gör", en: "View details" },
  detail_pricing: {
    tr: "Fiyatlandırma ($/M token)",
    en: "Pricing ($/M tokens)",
  },
  detail_prompt: { tr: "Girdi", en: "Input" },
  detail_completion: { tr: "Çıktı", en: "Output" },
  detail_blended: { tr: "Harman", en: "Blended" },
  detail_cache: { tr: "Önbellek okuma", en: "Cache read" },
  detail_specs: { tr: "Teknik özellikler", en: "Specifications" },
  detail_max_out: { tr: "Maks. çıktı token", en: "Max output tokens" },
  detail_input_mod: { tr: "Girdi modaliteleri", en: "Input modalities" },
  detail_output_mod: { tr: "Çıktı modaliteleri", en: "Output modalities" },
  detail_moderated: { tr: "Moderasyonlu", en: "Moderated" },
  detail_usecases: { tr: "Kullanım alanları", en: "Use cases" },
  detail_similar: { tr: "Benzer modeller", en: "Similar models" },
  detail_open_or: { tr: "OpenRouter'da aç", en: "Open on OpenRouter" },
  yes: { tr: "Evet", en: "Yes" },
  no: { tr: "Hayır", en: "No" },
};

interface I18nCtx {
  lang: Lang;
  setLang: (l: Lang) => void;
  t: (key: keyof typeof DICT | string) => string;
}

const Ctx = createContext<I18nCtx | null>(null);

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(() => {
    const saved =
      typeof localStorage !== "undefined" ? localStorage.getItem("lang") : null;
    return saved === "en" ? "en" : "tr";
  });
  const setLang = useCallback((l: Lang) => {
    setLangState(l);
    try {
      localStorage.setItem("lang", l);
    } catch {
      /* noop */
    }
  }, []);
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
  const t = useCallback(
    (key: string) => {
      const entry = (DICT as Dict)[key];
      if (!entry) return key;
      return entry[lang];
    },
    [lang]
  );
  return <Ctx.Provider value={{ lang, setLang, t }}>{children}</Ctx.Provider>;
}

export function useI18n() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useI18n must be used within I18nProvider");
  return c;
}
