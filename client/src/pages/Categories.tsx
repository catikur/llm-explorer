import { useMemo } from "react";
import Layout from "@/components/Layout";
import { useDataset } from "@/hooks/useDataset";
import { useI18n } from "@/contexts/I18nContext";
import { useAppState } from "@/contexts/AppState";
import { getUsecaseIcon } from "@/lib/icons";
import { displayName, LLMModel, MetricBounds } from "@/lib/models";
import { intelNorm, speedNorm, priceNorm } from "@/components/MetricBits";
import { useLocation } from "wouter";
import { ArrowRight } from "lucide-react";

// Bir kategori için en iyi 3 modeli seç — her kategori kendi doğasına uygun
// ağırlık karmasıyla puanlanır, böylece sıralama çeşitlenir.
function topPicks(
  models: LLMModel[],
  uc: string,
  bounds: MetricBounds
): LLMModel[] {
  const inCat = models.filter(m => m.usecases.includes(uc));
  const intel = (m: LLMModel) => intelNorm(m, bounds) ?? 0.35;
  const speed = (m: LLMModel) => speedNorm(m, bounds) ?? 0.3;
  const price = (m: LLMModel) => priceNorm(m, bounds) ?? 0.3;
  const ctx = (m: LLMModel) =>
    Math.min(1, Math.log10(m.context_length || 1) / 6.3);
  const modalityBreadth = (m: LLMModel) =>
    ((m.image_input ? 1 : 0) +
      (m.audio_input ? 1 : 0) +
      (m.file_input ? 1 : 0) +
      (m.input_modalities.includes("video") ? 1 : 0)) /
    4;

  const scored = inCat.map(m => {
    let s: number;
    switch (uc) {
      case "realtime":
        s = speed(m) * 0.62 + intel(m) * 0.28 + price(m) * 0.1;
        break;
      case "budget":
        s = price(m) * 0.58 + intel(m) * 0.32 + (m.is_free ? 0.1 : 0);
        break;
      case "long_context":
        s = ctx(m) * 0.58 + intel(m) * 0.32 + price(m) * 0.1;
        break;
      case "vision":
        // Görsel giriş zorunlu sinyali + zekâ + araç
        s =
          (m.image_input ? 0.3 : 0) +
          intel(m) * 0.5 +
          (m.tools ? 0.1 : 0) +
          modalityBreadth(m) * 0.1;
        break;
      case "multimodal":
        s =
          modalityBreadth(m) * 0.5 +
          intel(m) * 0.4 +
          (m.image_output ? 0.1 : 0);
        break;
      case "generation":
        s = (m.image_output ? 0.45 : 0) + intel(m) * 0.4 + speed(m) * 0.15;
        break;
      case "agentic":
        s =
          (m.tools ? 0.28 : 0) +
          (m.structured_outputs ? 0.14 : 0) +
          intel(m) * 0.46 +
          ctx(m) * 0.12;
        break;
      case "coding":
        s =
          intel(m) * 0.62 +
          (m.tools ? 0.14 : 0) +
          ctx(m) * 0.14 +
          (m.has_benchmark ? 0.1 : 0);
        break;
      case "reasoning":
        s =
          intel(m) * 0.7 +
          (m.reasoning ? 0.2 : 0) +
          (m.has_benchmark ? 0.1 : 0);
        break;
      case "enterprise":
        s =
          intel(m) * 0.5 +
          (m.is_moderated ? 0.18 : 0) +
          (m.structured_outputs ? 0.12 : 0) +
          (m.tools ? 0.1 : 0) +
          (m.has_benchmark ? 0.1 : 0);
        break;
      case "writing":
        s = intel(m) * 0.58 + ctx(m) * 0.24 + price(m) * 0.18;
        break;
      default:
        s = intel(m) * 0.7 + (m.has_benchmark ? 0.15 : 0) + price(m) * 0.15;
    }
    return { m, s };
  });
  scored.sort((a, b) => b.s - a.s);
  return scored.slice(0, 3).map(x => x.m);
}

export default function Categories() {
  const { data, bounds } = useDataset();
  const { t, lang } = useI18n();
  const { setPresetUsecase } = useAppState();
  const [, navigate] = useLocation();

  const models = data?.models ?? [];
  const ucKeys = data
    ? Object.keys(data.usecase_meta).filter(k => k !== "general")
    : [];

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    models.forEach(m => m.usecases.forEach(u => (c[u] = (c[u] || 0) + 1)));
    return c;
  }, [models]);

  const goCategory = (uc: string) => {
    setPresetUsecase(uc);
    navigate("/");
  };

  return (
    <Layout>
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-2xl mb-10">
          <h1 className="font-display font-bold text-3xl sm:text-4xl">
            {t("cat_title")}
          </h1>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            {t("cat_sub")}
          </p>
        </div>

        <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {data &&
            bounds &&
            ucKeys.map(uc => {
              const meta = data.usecase_meta[uc];
              const Icon = getUsecaseIcon(meta.icon);
              const picks = topPicks(models, uc, bounds);
              return (
                <button
                  key={uc}
                  onClick={() => goCategory(uc)}
                  className="group text-left rounded-xl border border-border/60 bg-card/40 p-5 transition-all hover:border-primary/50 hover:bg-card/70 hover:-translate-y-0.5"
                >
                  <div className="flex items-start justify-between">
                    <div className="grid place-items-center h-11 w-11 rounded-lg bg-primary/10 text-primary border border-primary/20">
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="font-mono text-xs text-muted-foreground">
                      {counts[uc] || 0} {t("cat_models")}
                    </span>
                  </div>
                  <h2 className="font-display font-semibold text-lg mt-4">
                    {lang === "tr" ? meta.tr : meta.en}
                  </h2>
                  <p className="text-sm text-muted-foreground mt-1 leading-relaxed min-h-[40px]">
                    {lang === "tr" ? meta.desc_tr : meta.desc_en}
                  </p>

                  <div className="mt-4 pt-3 border-t border-border/50">
                    <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-2">
                      {t("cat_top")}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      {picks.map((m, idx) => (
                        <div
                          key={m.id}
                          className="flex items-center gap-2 text-sm"
                        >
                          <span className="font-mono text-xs text-primary w-4">
                            {idx + 1}
                          </span>
                          <span className="truncate">{displayName(m)}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5 mt-4 text-sm text-primary font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                    {t("explore_cat")}{" "}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </div>
                </button>
              );
            })}
        </div>
      </section>
    </Layout>
  );
}
