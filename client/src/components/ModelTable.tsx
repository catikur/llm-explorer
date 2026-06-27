import {
  LLMModel,
  MetricBounds,
  displayName,
  vendorLabel,
  fmtPrice,
  fmtContext,
  fmtNum,
  TIER_LABEL,
} from "@/lib/models";
import { useI18n } from "@/contexts/I18nContext";
import { useAppState } from "@/contexts/AppState";
import {
  MetricBar,
  ModalityIcons,
  CapabilityDots,
  intelNorm,
  speedNorm,
  priceNorm,
  ctxNorm,
} from "@/components/MetricBits";
import { SortKey, SortDir } from "@/hooks/useFilters";
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Check,
  Plus,
  Info,
} from "lucide-react";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Props {
  models: LLMModel[];
  bounds: MetricBounds;
  sortKey: SortKey;
  sortDir: SortDir;
  onSort: (k: SortKey) => void;
}

function SortHead({
  label,
  k,
  active,
  dir,
  onSort,
  align = "left",
}: {
  label: string;
  k: SortKey;
  active: boolean;
  dir: SortDir;
  onSort: (k: SortKey) => void;
  align?: "left" | "right";
}) {
  const Icon = !active ? ArrowUpDown : dir === "asc" ? ArrowUp : ArrowDown;
  return (
    <th
      className={`px-3 py-2.5 font-medium ${align === "right" ? "text-right" : "text-left"}`}
    >
      <button
        onClick={() => onSort(k)}
        className={`inline-flex items-center gap-1.5 group ${align === "right" ? "flex-row-reverse" : ""} ${active ? "text-primary" : "text-muted-foreground hover:text-foreground"}`}
      >
        <span className="font-mono text-[11px] uppercase tracking-wider">
          {label}
        </span>
        <Icon
          className={`h-3 w-3 ${active ? "opacity-100" : "opacity-40 group-hover:opacity-80"}`}
        />
      </button>
    </th>
  );
}

export default function ModelTable({
  models,
  bounds,
  sortKey,
  sortDir,
  onSort,
}: Props) {
  const { t, lang } = useI18n();
  const { isSelected, toggleSelect, openDetail } = useAppState();

  return (
    <div className="w-full">
      {/* Desktop table */}
      <div className="hidden lg:block overflow-x-auto rounded-lg border border-border/60 bg-card/40">
        <table className="w-full text-sm border-collapse">
          <thead className="sticky top-0 z-10 bg-card/95 backdrop-blur border-b border-border/60">
            <tr>
              <th className="w-10 px-3 py-2.5"></th>
              <SortHead
                label={t("col_model")}
                k="name"
                active={sortKey === "name"}
                dir={sortDir}
                onSort={onSort}
              />
              <SortHead
                label={t("col_intel")}
                k="intelligence"
                active={sortKey === "intelligence"}
                dir={sortDir}
                onSort={onSort}
              />
              <SortHead
                label={t("col_speed")}
                k="speed"
                active={sortKey === "speed"}
                dir={sortDir}
                onSort={onSort}
              />
              <SortHead
                label={t("col_price")}
                k="price"
                active={sortKey === "price"}
                dir={sortDir}
                onSort={onSort}
                align="right"
              />
              <SortHead
                label={t("col_value")}
                k="value"
                active={sortKey === "value"}
                dir={sortDir}
                onSort={onSort}
                align="right"
              />
              <SortHead
                label={t("col_context")}
                k="context"
                active={sortKey === "context"}
                dir={sortDir}
                onSort={onSort}
                align="right"
              />
              <th className="px-3 py-2.5 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {t("col_modality")}
              </th>
              <th className="px-3 py-2.5 text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                {t("f_capabilities")}
              </th>
            </tr>
          </thead>
          <tbody>
            {models.map((m, i) => {
              const sel = isSelected(m.id);
              const tier = TIER_LABEL[m.tier];
              return (
                <tr
                  key={m.id}
                  className={`border-b border-border/40 transition-colors animate-in-row ${sel ? "bg-primary/[0.07]" : "hover:bg-white/[0.025]"}`}
                  style={{ animationDelay: `${Math.min(i, 20) * 18}ms` }}
                >
                  <td className="px-3 py-2.5">
                    <button
                      onClick={() => toggleSelect(m.id)}
                      className={`grid place-items-center h-5 w-5 rounded border transition-all ${
                        sel
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-border hover:border-primary/60"
                      }`}
                      aria-label={sel ? t("remove_compare") : t("add_compare")}
                    >
                      {sel ? (
                        <Check className="h-3.5 w-3.5" />
                      ) : (
                        <Plus className="h-3 w-3 opacity-50" />
                      )}
                    </button>
                  </td>
                  <td className="px-3 py-2.5 max-w-[260px]">
                    <div className="flex items-center gap-2">
                      <span
                        className="h-1.5 w-1.5 rounded-full shrink-0"
                        style={{ background: tier.color }}
                      />
                      <div className="min-w-0">
                        <button
                          onClick={() => openDetail(m.id)}
                          className="font-medium truncate block max-w-full text-left hover:text-primary transition-colors"
                          title={t("detail_view")}
                        >
                          {displayName(m)}
                        </button>
                        <div className="font-mono text-[11px] text-muted-foreground truncate">
                          {vendorLabel(m.vendor)}
                        </div>
                      </div>
                      {m.is_free && (
                        <span className="shrink-0 font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-400/15 text-emerald-300">
                          {t("free")}
                        </span>
                      )}
                    </div>
                  </td>
                  <td className="px-3 py-2.5 w-[120px]">
                    {intelNorm(m, bounds) == null ? (
                      <NoBench />
                    ) : (
                      <MetricBar
                        value={intelNorm(m, bounds)!}
                        color="var(--primary)"
                        label={`${m.intelligence_index}`}
                      />
                    )}
                  </td>
                  <td className="px-3 py-2.5 w-[120px]">
                    {speedNorm(m, bounds) == null ? (
                      <NoBench />
                    ) : (
                      <MetricBar
                        value={speedNorm(m, bounds)!}
                        color="oklch(0.82 0.15 85)"
                        label={fmtNum(m.output_tps)}
                      />
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right whitespace-nowrap">
                    <span
                      className={`font-mono tabular-nums ${m.is_free ? "text-emerald-300" : ""}`}
                    >
                      {m.is_free ? t("free") : fmtPrice(m.blended_price)}
                    </span>
                    {!m.is_free && m.blended_price != null && (
                      <span className="font-mono text-[10px] text-muted-foreground">
                        /M
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right">
                    {m.value_score == null ? (
                      <span className="font-mono text-xs text-muted-foreground/40">
                        —
                      </span>
                    ) : (
                      <span className="font-mono tabular-nums text-foreground/80">
                        {m.value_score.toFixed(0)}
                      </span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-right font-mono tabular-nums text-foreground/80">
                    {fmtContext(m.context_length)}
                  </td>
                  <td className="px-3 py-2.5">
                    <ModalityIcons m={m} />
                  </td>
                  <td className="px-3 py-2.5">
                    <CapabilityDots m={m} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile / tablet cards */}
      <div className="lg:hidden flex flex-col gap-2.5">
        {models.map((m, i) => {
          const sel = isSelected(m.id);
          const tier = TIER_LABEL[m.tier];
          return (
            <div
              key={m.id}
              className={`rounded-lg border p-3 animate-in-row ${sel ? "border-primary/60 bg-primary/[0.07]" : "border-border/60 bg-card/40"}`}
              style={{ animationDelay: `${Math.min(i, 14) * 22}ms` }}
            >
              <div className="flex items-start gap-2.5">
                <button
                  onClick={() => toggleSelect(m.id)}
                  className={`mt-0.5 grid place-items-center h-5 w-5 rounded border shrink-0 ${sel ? "bg-primary border-primary text-primary-foreground" : "border-border"}`}
                >
                  {sel ? (
                    <Check className="h-3.5 w-3.5" />
                  ) : (
                    <Plus className="h-3 w-3 opacity-50" />
                  )}
                </button>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span
                      className="h-1.5 w-1.5 rounded-full shrink-0"
                      style={{ background: tier.color }}
                    />
                    <button
                      onClick={() => openDetail(m.id)}
                      className="font-medium truncate text-left"
                      title={t("detail_view")}
                    >
                      {displayName(m)}
                    </button>
                    {m.is_free && (
                      <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-400/15 text-emerald-300">
                        {t("free")}
                      </span>
                    )}
                  </div>
                  <div className="font-mono text-[11px] text-muted-foreground">
                    {vendorLabel(m.vendor)} ·{" "}
                    {lang === "tr" ? tier.tr : tier.en}
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div
                    className={`font-mono text-sm tabular-nums ${m.is_free ? "text-emerald-300" : ""}`}
                  >
                    {m.is_free ? t("free") : fmtPrice(m.blended_price)}
                  </div>
                  <div className="font-mono text-[10px] text-muted-foreground">
                    {fmtContext(m.context_length)} ctx
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 mt-3 pl-7">
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground w-10">
                    {t("col_intel")}
                  </span>
                  {intelNorm(m, bounds) == null ? (
                    <NoBench />
                  ) : (
                    <MetricBar
                      value={intelNorm(m, bounds)!}
                      label={`${m.intelligence_index}`}
                    />
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-[10px] text-muted-foreground w-10">
                    {t("col_speed")}
                  </span>
                  {speedNorm(m, bounds) == null ? (
                    <NoBench />
                  ) : (
                    <MetricBar
                      value={speedNorm(m, bounds)!}
                      color="oklch(0.82 0.15 85)"
                      label={fmtNum(m.output_tps)}
                    />
                  )}
                </div>
              </div>
              <div className="flex items-center justify-between mt-3 pl-7">
                <ModalityIcons m={m} />
                <CapabilityDots m={m} />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function NoBench() {
  const { t } = useI18n();
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex items-center gap-1 font-mono text-xs text-muted-foreground/40">
          <Info className="h-3 w-3" /> n/a
        </span>
      </TooltipTrigger>
      <TooltipContent>{t("na_bench")}</TooltipContent>
    </Tooltip>
  );
}
