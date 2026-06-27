import { useMemo } from "react";
import { Dataset, MetricBounds, displayName, vendorLabel, fmtPrice, fmtContext, fmtNum, TIER_LABEL } from "@/lib/models";
import { useI18n } from "@/contexts/I18nContext";
import { useAppState } from "@/contexts/AppState";
import { computeWinners, generateInsights } from "@/lib/advisor";
import { MetricBar, ModalityIcons, CapabilityDots, intelNorm, speedNorm, priceNorm, ctxNorm } from "@/components/MetricBits";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { X, GitCompare, Trash2, Trophy, Brain, Zap, DollarSign, Gauge, ScrollText, Lightbulb } from "lucide-react";

interface Props {
  data: Dataset;
  bounds: MetricBounds;
}

export default function CompareTray({ data, bounds }: Props) {
  const { t } = useI18n();
  const { selected, toggleSelect, clearSelected, compareOpen, setCompareOpen } = useAppState();

  const models = useMemo(
    () => selected.map((id) => data.models.find((m) => m.id === id)).filter(Boolean) as Dataset["models"],
    [selected, data.models]
  );

  if (selected.length === 0) return null;

  return (
    <>
      {/* Bottom tray */}
      <div className="fixed bottom-0 left-0 right-0 z-30 animate-tray">
        <div className="mx-auto max-w-[1600px] px-4 pb-4">
          <div className="rounded-xl border border-primary/30 bg-card/95 backdrop-blur-xl glow-cyan p-3 flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 shrink-0 pl-1">
              <GitCompare className="h-4 w-4 text-primary" />
              <span className="font-mono text-xs uppercase tracking-wider text-muted-foreground">
                {selected.length} {t("selected")}
              </span>
            </div>
            <div className="flex-1 flex items-center gap-2 overflow-x-auto">
              {models.map((m) => (
                <div key={m.id} className="flex items-center gap-1.5 pl-2.5 pr-1 py-1 rounded-md bg-white/[0.04] border border-border/60 shrink-0">
                  <span className="text-xs font-medium whitespace-nowrap max-w-[140px] truncate">{displayName(m)}</span>
                  <button onClick={() => toggleSelect(m.id)} className="grid place-items-center h-4 w-4 rounded hover:bg-white/10 text-muted-foreground hover:text-foreground">
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button onClick={clearSelected} className="grid place-items-center h-9 w-9 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors" aria-label={t("clear")}>
                <Trash2 className="h-4 w-4" />
              </button>
              <button
                onClick={() => setCompareOpen(true)}
                className="flex items-center gap-1.5 h-9 px-4 rounded-md bg-primary text-primary-foreground font-semibold text-sm transition-transform active:scale-[0.97] hover:brightness-110"
              >
                <GitCompare className="h-4 w-4" /> {t("open_compare")}
              </button>
            </div>
          </div>
        </div>
      </div>

      <CompareDialog data={data} bounds={bounds} open={compareOpen} onClose={() => setCompareOpen(false)} models={models} />
    </>
  );
}

function CompareDialog({ data, bounds, open, onClose, models }: {
  data: Dataset; bounds: MetricBounds; open: boolean; onClose: () => void; models: Dataset["models"];
}) {
  const { t, lang } = useI18n();
  const winners = useMemo(() => computeWinners(models), [models]);
  const insights = useMemo(() => generateInsights(models, lang), [models, lang]);

  const rows: {
    key: string; label: string; icon: typeof Brain;
    render: (m: Dataset["models"][number]) => React.ReactNode;
    winnerId?: string;
  }[] = [
    {
      key: "intel", label: t("col_intel"), icon: Brain, winnerId: winners.intelligence,
      render: (m) => intelNorm(m, bounds) == null
        ? <span className="font-mono text-xs text-muted-foreground/40">n/a</span>
        : <MetricBar value={intelNorm(m, bounds)!} label={`${m.intelligence_index}`} />,
    },
    {
      key: "speed", label: t("col_speed"), icon: Zap, winnerId: winners.speed,
      render: (m) => speedNorm(m, bounds) == null
        ? <span className="font-mono text-xs text-muted-foreground/40">n/a</span>
        : <MetricBar value={speedNorm(m, bounds)!} color="oklch(0.82 0.15 85)" label={fmtNum(m.output_tps)} />,
    },
    {
      key: "price", label: t("col_price"), icon: DollarSign, winnerId: winners.price,
      render: (m) => <span className={`font-mono tabular-nums ${m.is_free ? "text-emerald-300" : ""}`}>{m.is_free ? t("free") : fmtPrice(m.blended_price) + "/M"}</span>,
    },
    {
      key: "value", label: t("col_value"), icon: Gauge, winnerId: winners.value,
      render: (m) => <span className="font-mono tabular-nums">{m.value_score != null ? m.value_score.toFixed(0) : "—"}</span>,
    },
    {
      key: "context", label: t("col_context"), icon: ScrollText, winnerId: winners.context,
      render: (m) => <span className="font-mono tabular-nums">{fmtContext(m.context_length)}</span>,
    },
    {
      key: "modality", label: t("col_modality"), icon: Brain,
      render: (m) => <ModalityIcons m={m} />,
    },
    {
      key: "caps", label: t("f_capabilities"), icon: Brain,
      render: (m) => <CapabilityDots m={m} />,
    },
  ];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto p-0 gap-0">
        <DialogHeader className="px-5 py-4 border-b border-border/60 sticky top-0 bg-card z-10">
          <DialogTitle className="font-display flex items-center gap-2">
            <GitCompare className="h-5 w-5 text-primary" /> {t("compare_title")}
          </DialogTitle>
        </DialogHeader>

        {models.length < 2 ? (
          <div className="p-10 text-center text-muted-foreground">{t("min_two")}</div>
        ) : (
          <div className="p-5">
            {/* Comparison matrix */}
            <div className="overflow-x-auto rounded-lg border border-border/60">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border/60 bg-white/[0.02]">
                    <th className="px-3 py-3 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground w-32"></th>
                    {models.map((m) => {
                      const tier = TIER_LABEL[m.tier];
                      return (
                        <th key={m.id} className="px-3 py-3 text-left min-w-[150px]">
                          <div className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full" style={{ background: tier.color }} />
                            <span className="font-semibold">{displayName(m)}</span>
                          </div>
                          <div className="font-mono text-[10px] text-muted-foreground font-normal mt-0.5">{vendorLabel(m.vendor)}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row) => {
                    const Icon = row.icon;
                    return (
                      <tr key={row.key} className="border-b border-border/40 last:border-0">
                        <td className="px-3 py-3 align-middle">
                          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                            <Icon className="h-3 w-3" /> {row.label}
                          </span>
                        </td>
                        {models.map((m) => (
                          <td key={m.id} className={`px-3 py-3 align-middle ${row.winnerId === m.id ? "bg-primary/[0.06]" : ""}`}>
                            <div className="flex items-center gap-1.5">
                              {row.render(m)}
                              {row.winnerId === m.id && (
                                <Trophy className="h-3.5 w-3.5 text-amber-300 shrink-0" />
                              )}
                            </div>
                          </td>
                        ))}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Auto Insights */}
            {insights.length > 0 && (
              <div className="mt-5">
                <h3 className="flex items-center gap-2 font-display font-semibold mb-3">
                  <Lightbulb className="h-4 w-4 text-amber-300" /> {t("insights")}
                </h3>
                <ul className="space-y-2">
                  {insights.map((ins, i) => (
                    <li key={i} className="flex items-start gap-2.5 text-sm leading-relaxed rounded-lg border border-border/50 bg-white/[0.02] px-3.5 py-2.5">
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-foreground/90">{ins}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
