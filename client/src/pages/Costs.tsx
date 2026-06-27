import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { useDataset } from "@/hooks/useDataset";
import { useI18n } from "@/contexts/I18nContext";
import { useAppState } from "@/contexts/AppState";
import { usePageTitle } from "@/hooks/usePageTitle";
import { displayName, vendorLabel, fmtUsd, TIER_LABEL } from "@/lib/models";
import { Slider } from "@/components/ui/slider";
import { Coins, Trophy } from "lucide-react";

interface Workload {
  id: string;
  in: number;
  out: number;
  req: number;
}

// Gerçekçi token profilleri (girdi/çıktı token, aylık istek).
const WORKLOADS: Workload[] = [
  { id: "chatbot", in: 500, out: 300, req: 50000 },
  { id: "rag", in: 8000, out: 600, req: 20000 },
  { id: "agent", in: 6000, out: 1500, req: 10000 },
  { id: "batch", in: 4000, out: 500, req: 100000 },
];

const MAX_ROWS = 60;

function NumField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
        {label}
      </span>
      <input
        type="number"
        min={0}
        value={value}
        onChange={e => onChange(Math.max(0, Number(e.target.value) || 0))}
        className="w-full h-9 px-3 rounded-md border border-border bg-white/[0.03] font-mono text-sm tabular-nums focus:outline-none focus:border-primary/60"
      />
    </label>
  );
}

export default function Costs() {
  const { data } = useDataset();
  const { t, lang } = useI18n();
  const { openDetail } = useAppState();
  usePageTitle(t("costs_title"));

  const [wl, setWl] = useState("chatbot");
  const [inTok, setInTok] = useState(WORKLOADS[0].in);
  const [outTok, setOutTok] = useState(WORKLOADS[0].out);
  const [reqs, setReqs] = useState(WORKLOADS[0].req);
  const [minIntel, setMinIntel] = useState(0);
  const [inclFree, setInclFree] = useState(true);

  const maxIntel = useMemo(() => {
    if (!data) return 70;
    return Math.max(...data.models.map(m => m.intelligence_index ?? 0), 10);
  }, [data]);

  const applyWorkload = (w: Workload) => {
    setWl(w.id);
    setInTok(w.in);
    setOutTok(w.out);
    setReqs(w.req);
  };
  const edit = (setter: (v: number) => void) => (v: number) => {
    setter(v);
    setWl("custom");
  };

  const rows = useMemo(() => {
    if (!data) return [];
    return data.models
      .filter(m => {
        if (!inclFree && m.is_free) return false;
        if (
          !m.is_free &&
          (m.prompt_price == null || m.completion_price == null)
        )
          return false;
        if (minIntel > 0 && (m.intelligence_index ?? -1) < minIntel)
          return false;
        return true;
      })
      .map(m => {
        const per = m.is_free
          ? 0
          : (inTok / 1e6) * (m.prompt_price ?? 0) +
            (outTok / 1e6) * (m.completion_price ?? 0);
        return { m, per, monthly: per * reqs };
      })
      .sort((a, b) => a.monthly - b.monthly);
  }, [data, inTok, outTok, reqs, minIntel, inclFree]);

  const shown = rows.slice(0, MAX_ROWS);

  return (
    <Layout>
      <section className="max-w-[1200px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-2xl mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-mono text-[11px] tracking-wider mb-4">
            <Coins className="h-3.5 w-3.5" /> {t("nav_costs")}
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl">
            {t("costs_title")}
          </h1>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            {t("costs_sub")}
          </p>
        </div>

        {/* Kontrol paneli */}
        <div className="rounded-xl border border-border/60 bg-card/40 p-5 mb-5">
          <h3 className="font-mono text-[11px] uppercase tracking-[0.16em] text-muted-foreground mb-3">
            {t("costs_workload")}
          </h3>
          <div className="flex flex-wrap gap-1.5 mb-5">
            {WORKLOADS.map(w => (
              <button
                key={w.id}
                onClick={() => applyWorkload(w)}
                className={`px-2.5 py-1.5 rounded-md text-xs font-medium border transition-colors ${
                  wl === w.id
                    ? "border-primary/60 bg-primary/15 text-primary"
                    : "border-border/60 text-muted-foreground hover:text-foreground"
                }`}
              >
                {t("wl_" + w.id)}
              </button>
            ))}
            <span
              className={`px-2.5 py-1.5 rounded-md text-xs font-medium border ${
                wl === "custom"
                  ? "border-primary/60 bg-primary/15 text-primary"
                  : "border-border/40 text-muted-foreground/50"
              }`}
            >
              {t("wl_custom")}
            </span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <NumField
              label={t("cost_in")}
              value={inTok}
              onChange={edit(setInTok)}
            />
            <NumField
              label={t("cost_out")}
              value={outTok}
              onChange={edit(setOutTok)}
            />
            <NumField
              label={t("cost_req")}
              value={reqs}
              onChange={edit(setReqs)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-x-8 gap-y-3 mt-5 pt-4 border-t border-border/50">
            <div className="flex-1 min-w-[220px]">
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  {t("costs_min_intel")}
                </span>
                <span className="font-mono text-xs tabular-nums text-foreground/80">
                  {minIntel}
                </span>
              </div>
              <Slider
                value={[minIntel]}
                min={0}
                max={maxIntel}
                step={1}
                onValueChange={v => setMinIntel(v[0])}
              />
            </div>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={inclFree}
                onChange={e => setInclFree(e.target.checked)}
                className="accent-[var(--primary)]"
              />
              {t("costs_incl_free")}
            </label>
          </div>
        </div>

        {/* Sıralı tablo */}
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-sm text-muted-foreground">
            <span className="text-primary font-semibold">{rows.length}</span>{" "}
            {t("costs_count")}
          </span>
          {rows.length > MAX_ROWS && (
            <span className="font-mono text-xs text-muted-foreground/60">
              {`1–${MAX_ROWS}`}
            </span>
          )}
        </div>

        {shown.length === 0 ? (
          <div className="rounded-xl border border-border/60 bg-card/40 p-10 text-center text-muted-foreground">
            {t("costs_none")}
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border/60 bg-card/40">
            <table className="w-full text-sm">
              <thead className="border-b border-border/60 bg-white/[0.02]">
                <tr className="text-left font-mono text-[11px] uppercase tracking-wider text-muted-foreground">
                  <th className="px-3 py-2.5 w-12">{t("costs_rank")}</th>
                  <th className="px-3 py-2.5">Model</th>
                  <th className="px-3 py-2.5 text-right">{t("col_intel")}</th>
                  <th className="px-3 py-2.5 text-right">
                    {t("cost_per_req")}
                  </th>
                  <th className="px-3 py-2.5 text-right">
                    {t("cost_monthly")}
                  </th>
                </tr>
              </thead>
              <tbody>
                {shown.map((r, i) => {
                  const tier = TIER_LABEL[r.m.tier];
                  return (
                    <tr
                      key={r.m.id}
                      className={`border-b border-border/40 last:border-0 ${i === 0 ? "bg-emerald-400/[0.06]" : "hover:bg-white/[0.025]"}`}
                    >
                      <td className="px-3 py-2.5 font-mono tabular-nums text-muted-foreground">
                        {i === 0 ? (
                          <Trophy className="h-4 w-4 text-emerald-300" />
                        ) : (
                          i + 1
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-2">
                          <span
                            className="h-1.5 w-1.5 rounded-full shrink-0"
                            style={{ background: tier.color }}
                          />
                          <button
                            onClick={() => openDetail(r.m.id)}
                            className="font-medium truncate text-left hover:text-primary transition-colors"
                            title={t("detail_view")}
                          >
                            {displayName(r.m)}
                          </button>
                          {r.m.is_free && (
                            <span className="font-mono text-[9px] uppercase px-1.5 py-0.5 rounded bg-emerald-400/15 text-emerald-300">
                              {t("free")}
                            </span>
                          )}
                          <span className="font-mono text-[11px] text-muted-foreground hidden sm:inline">
                            {vendorLabel(r.m.vendor)}
                          </span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-foreground/80">
                        {r.m.intelligence_index ?? "—"}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums text-muted-foreground">
                        {fmtUsd(r.per, lang)}
                      </td>
                      <td className="px-3 py-2.5 text-right font-mono tabular-nums font-semibold">
                        {fmtUsd(r.monthly, lang)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </Layout>
  );
}
