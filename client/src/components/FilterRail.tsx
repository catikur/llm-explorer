import { useI18n } from "@/contexts/I18nContext";
import { Dataset, vendorLabel, TIER_LABEL } from "@/lib/models";
import { FilterState } from "@/hooks/useFilters";
import { getUsecaseIcon } from "@/lib/icons";
import { Search, RotateCcw, X } from "lucide-react";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";

interface Props {
  data: Dataset;
  filters: FilterState;
  setF: <K extends keyof FilterState>(k: K, v: FilterState[K]) => void;
  toggleIn: (k: "usecases" | "vendors" | "tiers" | "caps", v: string) => void;
  reset: () => void;
  vendorCounts: Record<string, number>;
  usecaseCounts: Record<string, number>;
}

const MODALITIES = [
  { key: "text", tr: "Salt metin", en: "Text only" },
  { key: "image", tr: "Görsel", en: "Image" },
  { key: "audio", tr: "Ses", en: "Audio" },
  { key: "file", tr: "Dosya", en: "File" },
  { key: "video", tr: "Video", en: "Video" },
  { key: "imgout", tr: "Görsel çıkışı", en: "Image out" },
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="py-4 border-b border-border/50 last:border-0">
      <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-3">{title}</h3>
      {children}
    </div>
  );
}

function Chip({ active, onClick, children, count }: { active: boolean; onClick: () => void; children: React.ReactNode; count?: number }) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium border transition-all ${
        active
          ? "border-primary/60 bg-primary/15 text-primary"
          : "border-border/60 bg-white/[0.02] text-muted-foreground hover:text-foreground hover:border-border"
      }`}
    >
      {children}
      {count != null && <span className="font-mono text-[10px] opacity-60">{count}</span>}
    </button>
  );
}

export default function FilterRail({ data, filters, setF, toggleIn, reset, vendorCounts, usecaseCounts }: Props) {
  const { t, lang } = useI18n();
  const ucKeys = Object.keys(data.usecase_meta).filter((k) => k !== "general");
  const topVendors = [...data.vendors]
    .filter((v) => !v.startsWith("~"))
    .sort((a, b) => (vendorCounts[b] || 0) - (vendorCounts[a] || 0))
    .slice(0, 16);

  const hasActive =
    filters.q || filters.usecases.length || filters.vendors.length || filters.tiers.length ||
    filters.modality || filters.caps.length || filters.maxPrice != null || filters.onlyFree || filters.onlyBench;

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center justify-between mb-3 px-1">
        <h2 className="font-display font-semibold text-base">{t("filters")}</h2>
        {hasActive && (
          <button onClick={reset} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors">
            <RotateCcw className="h-3 w-3" /> {t("reset")}
          </button>
        )}
      </div>

      {/* Search */}
      <div className="relative mb-1">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <input
          value={filters.q}
          onChange={(e) => setF("q", e.target.value)}
          placeholder={t("search_ph")}
          className="w-full h-10 pl-9 pr-9 rounded-md bg-white/[0.03] border border-border/60 text-sm focus:outline-none focus:border-primary/60 focus:ring-1 focus:ring-primary/40 transition-colors"
        />
        {filters.q && (
          <button onClick={() => setF("q", "")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      <div className="overflow-y-auto -mr-2 pr-2 flex-1">
        <Section title={t("f_usecase")}>
          <div className="flex flex-wrap gap-1.5">
            {ucKeys.map((k) => {
              const meta = data.usecase_meta[k];
              const Icon = getUsecaseIcon(meta.icon);
              return (
                <Chip key={k} active={filters.usecases.includes(k)} onClick={() => toggleIn("usecases", k)} count={usecaseCounts[k]}>
                  <Icon className="h-3 w-3" /> {lang === "tr" ? meta.tr : meta.en}
                </Chip>
              );
            })}
          </div>
        </Section>

        <Section title={t("f_tier")}>
          <div className="flex flex-wrap gap-1.5">
            {Object.entries(TIER_LABEL).map(([k, v]) => (
              <Chip key={k} active={filters.tiers.includes(k)} onClick={() => toggleIn("tiers", k)}>
                <span className="h-2 w-2 rounded-full" style={{ background: v.color }} />
                {lang === "tr" ? v.tr : v.en}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title={t("f_modality")}>
          <div className="flex flex-wrap gap-1.5">
            {MODALITIES.map((m) => (
              <Chip key={m.key} active={filters.modality === m.key} onClick={() => setF("modality", filters.modality === m.key ? null : m.key)}>
                {lang === "tr" ? m.tr : m.en}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title={t("f_capabilities")}>
          <div className="flex flex-wrap gap-1.5">
            {[
              { k: "tools", label: t("cap_tools") },
              { k: "reasoning", label: t("cap_reasoning") },
              { k: "structured", label: t("cap_structured") },
            ].map((c) => (
              <Chip key={c.k} active={filters.caps.includes(c.k)} onClick={() => toggleIn("caps", c.k)}>
                {c.label}
              </Chip>
            ))}
          </div>
        </Section>

        <Section title={t("f_price")}>
          <div className="px-1">
            <div className="flex justify-between mb-2 font-mono text-xs">
              <span className="text-muted-foreground">$0</span>
              <span className="text-primary">
                {filters.maxPrice == null ? "∞" : `$${filters.maxPrice}`}
              </span>
            </div>
            <Slider
              value={[filters.maxPrice == null ? 270 : filters.maxPrice]}
              min={0} max={270} step={1}
              onValueChange={(v) => setF("maxPrice", v[0] >= 270 ? null : v[0])}
            />
          </div>
          <div className="flex flex-col gap-2.5 mt-4">
            <label className="flex items-center justify-between text-sm">
              <span>{t("f_only_free")}</span>
              <Switch checked={filters.onlyFree} onCheckedChange={(v) => setF("onlyFree", v)} />
            </label>
            <label className="flex items-center justify-between text-sm">
              <span>{t("f_only_bench")}</span>
              <Switch checked={filters.onlyBench} onCheckedChange={(v) => setF("onlyBench", v)} />
            </label>
          </div>
        </Section>

        <Section title={t("f_vendor")}>
          <div className="flex flex-wrap gap-1.5">
            {topVendors.map((v) => (
              <Chip key={v} active={filters.vendors.includes(v)} onClick={() => toggleIn("vendors", v)} count={vendorCounts[v]}>
                {vendorLabel(v)}
              </Chip>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
