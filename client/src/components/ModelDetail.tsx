import { useMemo, useEffect } from "react";
import {
  Dataset,
  MetricBounds,
  LLMModel,
  displayName,
  vendorLabel,
  fmtPrice,
  fmtContext,
  fmtNum,
  TIER_LABEL,
} from "@/lib/models";
import { useI18n } from "@/contexts/I18nContext";
import { useAppState } from "@/contexts/AppState";
import { getUsecaseIcon } from "@/lib/icons";
import {
  MetricBar,
  ModalityIcons,
  CapabilityDots,
  intelNorm,
  speedNorm,
  ctxNorm,
} from "@/components/MetricBits";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  Check,
  Plus,
  ExternalLink,
  Brain,
  Zap,
  Timer,
  ScrollText,
  Gauge,
} from "lucide-react";

interface Props {
  data: Dataset;
  bounds: MetricBounds;
}

function StatRow({
  icon: Icon,
  label,
  children,
}: {
  icon: typeof Brain;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <span className="flex items-center gap-1.5 w-28 shrink-0 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
        <Icon className="h-3.5 w-3.5" /> {label}
      </span>
      <div className="flex-1 min-w-0">{children}</div>
    </div>
  );
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-2 mt-5">
      {children}
    </h3>
  );
}

function similarModels(m: LLMModel, all: LLMModel[]): LLMModel[] {
  const scored = all
    .filter(x => x.id !== m.id)
    .map(x => {
      const sharedUc = x.usecases.filter(u => m.usecases.includes(u)).length;
      const sameTier = x.tier === m.tier && m.tier !== "unknown" ? 1 : 0;
      const sameVendor = x.vendor === m.vendor ? 0.5 : 0;
      return { x, score: sharedUc + sameTier + sameVendor };
    })
    .filter(s => s.score > 0);
  scored.sort(
    (a, b) =>
      b.score - a.score ||
      (b.x.value_score ?? 0) - (a.x.value_score ?? 0) ||
      (b.x.intelligence_index ?? 0) - (a.x.intelligence_index ?? 0)
  );
  return scored.slice(0, 5).map(s => s.x);
}

export default function ModelDetail({ data, bounds }: Props) {
  const { t, lang } = useI18n();
  const { detailId, closeDetail, isSelected, toggleSelect, openDetail } =
    useAppState();

  const m = useMemo(
    () =>
      detailId ? (data.models.find(x => x.id === detailId) ?? null) : null,
    [detailId, data.models]
  );
  const similar = useMemo(
    () => (m ? similarModels(m, data.models) : []),
    [m, data.models]
  );

  // Bayat URL (artık var olmayan model id'si) → drawer'ı kapat.
  useEffect(() => {
    if (detailId && !m) closeDetail();
  }, [detailId, m, closeDetail]);

  const open = !!detailId;
  const tier = m ? TIER_LABEL[m.tier] : null;
  const sel = m ? isSelected(m.id) : false;

  return (
    <Sheet open={open} onOpenChange={v => !v && closeDetail()}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-md p-0 flex flex-col gap-0 overflow-hidden"
      >
        {m && tier ? (
          <>
            <SheetHeader className="px-5 py-4 border-b border-border/60 space-y-0 text-left">
              <div className="flex items-center gap-2">
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{ background: tier.color }}
                />
                <SheetTitle className="font-display text-lg truncate">
                  {displayName(m)}
                </SheetTitle>
                {m.is_free && (
                  <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-400/15 text-emerald-300">
                    {t("free")}
                  </span>
                )}
              </div>
              <div className="font-mono text-[11px] text-muted-foreground mt-1">
                {vendorLabel(m.vendor)} · {lang === "tr" ? tier.tr : tier.en}
              </div>
              <div className="font-mono text-[10px] text-muted-foreground/60 mt-0.5 break-all">
                {m.id}
              </div>
            </SheetHeader>

            <div className="flex-1 overflow-y-auto px-5 py-3">
              {/* Metrikler */}
              <SectionTitle>{t("adv_results")}</SectionTitle>
              <div className="rounded-lg border border-border/50 bg-white/[0.02] px-3 divide-y divide-border/40">
                <StatRow icon={Brain} label={t("col_intel")}>
                  {intelNorm(m, bounds) == null ? (
                    <span className="font-mono text-xs text-muted-foreground/40">
                      n/a
                    </span>
                  ) : (
                    <MetricBar
                      value={intelNorm(m, bounds)!}
                      label={`${m.intelligence_index}`}
                    />
                  )}
                </StatRow>
                <StatRow icon={Zap} label={t("col_speed")}>
                  {speedNorm(m, bounds) == null ? (
                    <span className="font-mono text-xs text-muted-foreground/40">
                      n/a
                    </span>
                  ) : (
                    <MetricBar
                      value={speedNorm(m, bounds)!}
                      color="oklch(0.82 0.15 85)"
                      label={fmtNum(m.output_tps)}
                    />
                  )}
                </StatRow>
                <StatRow icon={Timer} label={t("col_latency")}>
                  <span className="font-mono text-sm tabular-nums">
                    {m.latency_s != null ? `${m.latency_s}s` : "—"}
                  </span>
                </StatRow>
                <StatRow icon={ScrollText} label={t("col_context")}>
                  <span className="font-mono text-sm tabular-nums">
                    {fmtContext(m.context_length)}
                  </span>
                </StatRow>
                <StatRow icon={Gauge} label={t("col_value")}>
                  <span className="font-mono text-sm tabular-nums">
                    {m.value_score != null ? m.value_score.toFixed(0) : "—"}
                  </span>
                </StatRow>
              </div>

              {/* Fiyatlandırma */}
              <SectionTitle>{t("detail_pricing")}</SectionTitle>
              <div className="grid grid-cols-2 gap-2">
                <PriceCell
                  label={t("detail_prompt")}
                  v={m.prompt_price}
                  free={m.is_free}
                />
                <PriceCell
                  label={t("detail_completion")}
                  v={m.completion_price}
                  free={m.is_free}
                />
                <PriceCell
                  label={t("detail_blended")}
                  v={m.blended_price}
                  free={m.is_free}
                />
                <div className="rounded-lg border border-border/50 bg-white/[0.02] px-3 py-2">
                  <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
                    {t("detail_cache")}
                  </div>
                  <div className="font-mono text-sm tabular-nums mt-0.5">
                    {m.cache_read != null
                      ? `$${(m.cache_read * 1e6).toFixed(2)}`
                      : "—"}
                  </div>
                </div>
              </div>

              {/* Yetenekler & modalite */}
              <SectionTitle>{t("f_capabilities")}</SectionTitle>
              <div className="flex items-center justify-between rounded-lg border border-border/50 bg-white/[0.02] px-3 py-2.5">
                <CapabilityDots m={m} />
                <ModalityIcons m={m} />
              </div>

              {/* Teknik özellikler */}
              <SectionTitle>{t("detail_specs")}</SectionTitle>
              <div className="rounded-lg border border-border/50 bg-white/[0.02] px-3 divide-y divide-border/40 text-sm">
                <SpecRow
                  label={t("detail_max_out")}
                  value={
                    m.max_completion_tokens != null
                      ? fmtNum(m.max_completion_tokens)
                      : "—"
                  }
                />
                <SpecRow
                  label={t("detail_input_mod")}
                  value={m.input_modalities.replace(/\|/g, ", ")}
                />
                <SpecRow
                  label={t("detail_output_mod")}
                  value={m.output_modalities.replace(/\|/g, ", ")}
                />
                <SpecRow
                  label={t("detail_moderated")}
                  value={m.is_moderated ? t("yes") : t("no")}
                />
              </div>

              {/* Kullanım alanları */}
              {m.usecases.length > 0 && (
                <>
                  <SectionTitle>{t("detail_usecases")}</SectionTitle>
                  <div className="flex flex-wrap gap-1.5">
                    {m.usecases.map(u => {
                      const meta = data.usecase_meta[u];
                      if (!meta) return null;
                      const Icon = getUsecaseIcon(meta.icon);
                      return (
                        <span
                          key={u}
                          className="inline-flex items-center gap-1.5 px-2 py-1 rounded text-[11px] bg-primary/[0.08] text-primary/90 border border-primary/15"
                        >
                          <Icon className="h-3 w-3" />{" "}
                          {lang === "tr" ? meta.tr : meta.en}
                        </span>
                      );
                    })}
                  </div>
                </>
              )}

              {/* Benzer modeller */}
              {similar.length > 0 && (
                <>
                  <SectionTitle>{t("detail_similar")}</SectionTitle>
                  <div className="flex flex-col gap-1.5 pb-2">
                    {similar.map(s => {
                      const st = TIER_LABEL[s.tier];
                      return (
                        <button
                          key={s.id}
                          onClick={() => openDetail(s.id)}
                          className="flex items-center gap-2 rounded-lg border border-border/50 bg-white/[0.02] px-3 py-2 text-left hover:border-primary/40 transition-colors"
                        >
                          <span
                            className="h-1.5 w-1.5 rounded-full shrink-0"
                            style={{ background: st.color }}
                          />
                          <span className="flex-1 min-w-0 truncate text-sm">
                            {displayName(s)}
                          </span>
                          <span className="font-mono text-[11px] tabular-nums text-muted-foreground shrink-0">
                            {s.is_free ? t("free") : fmtPrice(s.blended_price)}
                          </span>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Aksiyonlar */}
            <div className="border-t border-border/60 px-5 py-3 flex items-center gap-2">
              <button
                onClick={() => toggleSelect(m.id)}
                className={`flex-1 flex items-center justify-center gap-1.5 h-10 rounded-md font-semibold text-sm transition-all ${
                  sel
                    ? "bg-primary text-primary-foreground"
                    : "border border-border hover:border-primary/60"
                }`}
              >
                {sel ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <Plus className="h-4 w-4" />
                )}
                {sel ? t("remove_compare") : t("add_compare")}
              </button>
              <a
                href={`https://openrouter.ai/${m.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-1.5 h-10 px-3 rounded-md border border-border text-sm font-medium hover:border-primary/50 hover:text-primary transition-colors"
              >
                <ExternalLink className="h-4 w-4" />
                <span className="hidden sm:inline">{t("detail_open_or")}</span>
              </a>
            </div>
          </>
        ) : (
          <div className="grid place-items-center h-full text-sm text-muted-foreground">
            —
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function PriceCell({
  label,
  v,
  free,
}: {
  label: string;
  v: number | null;
  free: boolean;
}) {
  return (
    <div className="rounded-lg border border-border/50 bg-white/[0.02] px-3 py-2">
      <div className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
        {label}
      </div>
      <div className="font-mono text-sm tabular-nums mt-0.5">
        {free ? "$0" : fmtPrice(v)}
      </div>
    </div>
  );
}

function SpecRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3 py-2">
      <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground shrink-0">
        {label}
      </span>
      <span className="font-mono text-xs text-right truncate">{value}</span>
    </div>
  );
}
