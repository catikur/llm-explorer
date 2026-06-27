import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { useDataset } from "@/hooks/useDataset";
import { useI18n } from "@/contexts/I18nContext";
import { useAppState } from "@/contexts/AppState";
import { scoreModels, AdvisorWeights, AdvisorReq } from "@/lib/advisor";
import { displayName, vendorLabel, fmtPrice, fmtContext, fmtNum, TIER_LABEL } from "@/lib/models";
import { getUsecaseIcon } from "@/lib/icons";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { useLocation } from "wouter";
import { Brain, Zap, PiggyBank, ScrollText, Check, Plus, Trophy, Sparkles } from "lucide-react";

const PRESETS: { id: string; tr: string; en: string; w: AdvisorWeights }[] = [
  { id: "balanced", tr: "Dengeli", en: "Balanced", w: { intelligence: 50, speed: 50, price: 50, context: 40 } },
  { id: "smartest", tr: "En akıllı", en: "Smartest", w: { intelligence: 100, speed: 20, price: 15, context: 40 } },
  { id: "cheapest", tr: "En ekonomik", en: "Most economical", w: { intelligence: 30, speed: 40, price: 100, context: 25 } },
  { id: "fastest", tr: "En hızlı", en: "Fastest", w: { intelligence: 35, speed: 100, price: 45, context: 20 } },
  { id: "longctx", tr: "Uzun bağlam", en: "Long context", w: { intelligence: 55, speed: 25, price: 30, context: 100 } },
];

function WeightRow({ icon: Icon, label, value, onChange, color }: {
  icon: typeof Brain; label: string; value: number; onChange: (v: number) => void; color: string;
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <span className="flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4" style={{ color }} /> {label}
        </span>
        <span className="font-mono text-xs tabular-nums text-muted-foreground">{value}</span>
      </div>
      <Slider value={[value]} min={0} max={100} step={5} onValueChange={(v) => onChange(v[0])} />
    </div>
  );
}

export default function Advisor() {
  const { data, bounds } = useDataset();
  const { t, lang } = useI18n();
  const { toggleSelect, isSelected, setPresetUsecase } = useAppState();
  const [, navigate] = useLocation();

  const [weights, setWeights] = useState<AdvisorWeights>({ intelligence: 70, speed: 45, price: 55, context: 40 });
  const [req, setReq] = useState<AdvisorReq>({ vision: false, audio: false, tools: false, reasoning: false, imageOutput: false });
  const [usecase, setUsecase] = useState<string | null>(null);

  const setW = (k: keyof AdvisorWeights, v: number) => setWeights((p) => ({ ...p, [k]: v }));
  const setR = (k: keyof AdvisorReq, v: boolean) => setReq((p) => ({ ...p, [k]: v }));

  const results = useMemo(() => {
    if (!data || !bounds) return [];
    return scoreModels(data.models, weights, req, usecase, bounds, lang).slice(0, 12);
  }, [data, bounds, weights, req, usecase, lang]);

  const ucKeys = data ? Object.keys(data.usecase_meta).filter((k) => k !== "general") : [];

  const reqRows: { k: keyof AdvisorReq; label: string }[] = [
    { k: "vision", label: t("cap_vision") },
    { k: "audio", label: t("cap_audio") },
    { k: "tools", label: t("cap_tools") },
    { k: "reasoning", label: t("cap_reasoning") },
    { k: "imageOutput", label: t("cap_imgout") },
  ];

  return (
    <Layout>
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-2xl mb-8">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-mono text-[11px] tracking-wider mb-4">
            <Sparkles className="h-3.5 w-3.5" /> {t("nav_recommend")}
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl">{t("adv_title")}</h1>
          <p className="mt-3 text-muted-foreground leading-relaxed">{t("adv_sub")}</p>
        </div>

        <div className="grid lg:grid-cols-[360px_1fr] gap-6">
          {/* Controls */}
          <aside className="lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-xl border border-border/60 bg-card/40 p-5 space-y-6">
              {/* Presets */}
              <div className="flex flex-wrap gap-1.5">
                {PRESETS.map((p) => (
                  <button
                    key={p.id}
                    onClick={() => setWeights(p.w)}
                    className="px-2.5 py-1.5 rounded-md text-xs font-medium border border-border/60 bg-white/[0.02] text-muted-foreground hover:text-primary hover:border-primary/50 transition-colors"
                  >
                    {lang === "tr" ? p.tr : p.en}
                  </button>
                ))}
              </div>

              <div>
                <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-4">{t("adv_priority")}</h3>
                <div className="space-y-4">
                  <WeightRow icon={Brain} label={t("adv_w_intel")} value={weights.intelligence} onChange={(v) => setW("intelligence", v)} color="var(--primary)" />
                  <WeightRow icon={Zap} label={t("adv_w_speed")} value={weights.speed} onChange={(v) => setW("speed", v)} color="oklch(0.82 0.15 85)" />
                  <WeightRow icon={PiggyBank} label={t("adv_w_price")} value={weights.price} onChange={(v) => setW("price", v)} color="oklch(0.7 0.16 145)" />
                  <WeightRow icon={ScrollText} label={t("adv_w_context")} value={weights.context} onChange={(v) => setW("context", v)} color="oklch(0.7 0.15 300)" />
                </div>
              </div>

              <div className="border-t border-border/50 pt-5">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-3">{t("adv_usecase")}</h3>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => setUsecase(null)}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${usecase === null ? "border-primary/60 bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground"}`}
                  >
                    {t("adv_any")}
                  </button>
                  {ucKeys.map((k) => {
                    const meta = data!.usecase_meta[k];
                    const Icon = getUsecaseIcon(meta.icon);
                    return (
                      <button
                        key={k}
                        onClick={() => setUsecase(usecase === k ? null : k)}
                        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${usecase === k ? "border-primary/60 bg-primary/15 text-primary" : "border-border/60 text-muted-foreground hover:text-foreground"}`}
                      >
                        <Icon className="h-3 w-3" /> {lang === "tr" ? meta.tr : meta.en}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-border/50 pt-5">
                <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-3">{t("adv_req")}</h3>
                <div className="space-y-2.5">
                  {reqRows.map((r) => (
                    <label key={r.k} className="flex items-center justify-between text-sm">
                      <span>{r.label}</span>
                      <Switch checked={req[r.k]} onCheckedChange={(v) => setR(r.k, v)} />
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </aside>

          {/* Results */}
          <div>
            <h3 className="font-display font-semibold text-lg mb-4">{t("adv_results")}</h3>
            {results.length === 0 ? (
              <div className="rounded-xl border border-border/60 bg-card/40 p-10 text-center text-muted-foreground">{t("adv_none")}</div>
            ) : (
              <div className="space-y-2.5">
                {results.map((r, i) => {
                  const m = r.model;
                  const tier = TIER_LABEL[m.tier];
                  const sel = isSelected(m.id);
                  return (
                    <div key={m.id} className="rounded-xl border border-border/60 bg-card/40 p-4 transition-colors hover:border-primary/40">
                      <div className="flex items-center gap-3">
                        <div className="grid place-items-center h-9 w-9 rounded-lg font-display font-bold text-sm shrink-0" style={{ background: i < 3 ? "var(--primary)" : "rgba(255,255,255,0.05)", color: i < 3 ? "var(--primary-foreground)" : "var(--muted-foreground)" }}>
                          {i === 0 ? <Trophy className="h-4 w-4" /> : i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="h-1.5 w-1.5 rounded-full shrink-0" style={{ background: tier.color }} />
                            <span className="font-semibold truncate">{displayName(m)}</span>
                            {m.is_free && <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-400/15 text-emerald-300">{t("free")}</span>}
                          </div>
                          <div className="font-mono text-[11px] text-muted-foreground">{vendorLabel(m.vendor)}</div>
                        </div>
                        {/* match score */}
                        <div className="text-right shrink-0">
                          <div className="font-display font-bold text-lg text-primary tabular-nums">{r.score}<span className="text-xs text-muted-foreground">%</span></div>
                          <div className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">{t("adv_match")}</div>
                        </div>
                        <button
                          onClick={() => toggleSelect(m.id)}
                          className={`grid place-items-center h-8 w-8 rounded-md border shrink-0 transition-all ${sel ? "bg-primary border-primary text-primary-foreground" : "border-border hover:border-primary/60"}`}
                        >
                          {sel ? <Check className="h-4 w-4" /> : <Plus className="h-4 w-4 opacity-60" />}
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-3 pl-12 font-mono text-xs text-muted-foreground">
                        <span><span className="text-foreground/70">{m.intelligence_index ?? "—"}</span> {t("col_intel").toLowerCase()}</span>
                        <span><span className="text-foreground/70">{fmtNum(m.output_tps)}</span> tok/s</span>
                        <span><span className="text-foreground/70">{m.is_free ? t("free") : fmtPrice(m.blended_price)}</span></span>
                        <span><span className="text-foreground/70">{fmtContext(m.context_length)}</span> ctx</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5 mt-2.5 pl-12">
                        {r.reasons.map((reason, idx) => (
                          <span key={idx} className="px-2 py-0.5 rounded text-[11px] bg-primary/[0.08] text-primary/90 border border-primary/15">{reason}</span>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
