import { useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { useDataset } from "@/hooks/useDataset";
import { useI18n } from "@/contexts/I18nContext";
import { useAppState } from "@/contexts/AppState";
import { usePageTitle } from "@/hooks/usePageTitle";
import {
  LLMModel,
  displayName,
  vendorLabel,
  fmtPrice,
  TIER_LABEL,
} from "@/lib/models";
import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { ScatterChart as ScatterIcon } from "lucide-react";

interface Point {
  x: number; // blended price ($/M)
  y: number; // intelligence
  m: LLMModel;
  tier: string;
  pareto: boolean;
}

// Pareto sınırı: hiçbir başka model tarafından hem zekâda (>=) hem fiyatta (<=)
// domine edilmeyen modeller (en az birinde kesin daha iyi).
function markPareto(pts: Point[]): void {
  for (const p of pts) {
    p.pareto = !pts.some(
      q => q !== p && q.y >= p.y && q.x <= p.x && (q.y > p.y || q.x < p.x)
    );
  }
}

function ChartTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const p: Point = payload[0].payload;
  const tier = TIER_LABEL[p.tier];
  return (
    <div className="rounded-lg border border-border/70 bg-card/95 backdrop-blur px-3 py-2 text-xs shadow-xl">
      <div className="flex items-center gap-1.5 font-semibold">
        <span
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: tier.color }}
        />
        {displayName(p.m)}
      </div>
      <div className="font-mono text-[11px] text-muted-foreground mt-1">
        {vendorLabel(p.m.vendor)}
      </div>
      <div className="font-mono text-[11px] mt-1.5 flex gap-3">
        <span>
          <span className="text-muted-foreground">zekâ </span>
          {p.m.intelligence_index}
        </span>
        <span>
          <span className="text-muted-foreground">fiyat </span>
          {fmtPrice(p.x)}
        </span>
      </div>
    </div>
  );
}

export default function Landscape() {
  const { data } = useDataset();
  const { t, lang } = useI18n();
  const { openDetail } = useAppState();
  const [paretoOnly, setParetoOnly] = useState(false);
  usePageTitle(t("landscape_title"));

  const points = useMemo(() => {
    if (!data) return [];
    const pts: Point[] = data.models
      .filter(
        m =>
          m.intelligence_index != null &&
          m.blended_price != null &&
          m.blended_price > 0
      )
      .map(m => ({
        x: m.blended_price!,
        y: m.intelligence_index!,
        m,
        tier: m.tier,
        pareto: false,
      }));
    markPareto(pts);
    return pts;
  }, [data]);

  const frontier = useMemo(
    () => points.filter(p => p.pareto).sort((a, b) => a.x - b.x),
    [points]
  );
  const shown = paretoOnly ? frontier : points;

  const tiersInView = useMemo(() => {
    const set = new Set(shown.map(p => p.tier));
    return Object.keys(TIER_LABEL).filter(k => set.has(k) && k !== "unknown");
  }, [shown]);

  const handleClick = (node: any) => {
    const m: LLMModel | undefined = node?.m ?? node?.payload?.m;
    if (m) openDetail(m.id);
  };

  return (
    <Layout>
      <section className="max-w-[1400px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-2xl mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-mono text-[11px] tracking-wider mb-4">
            <ScatterIcon className="h-3.5 w-3.5" /> {t("nav_landscape")}
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl">
            {t("landscape_title")}
          </h1>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            {t("landscape_sub")}
          </p>
        </div>

        {/* Kontroller + lejant */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
          <div className="flex flex-wrap items-center gap-3">
            {tiersInView.map(k => (
              <span
                key={k}
                className="inline-flex items-center gap-1.5 text-xs"
              >
                <span
                  className="h-2 w-2 rounded-full"
                  style={{ background: TIER_LABEL[k].color }}
                />
                {lang === "tr" ? TIER_LABEL[k].tr : TIER_LABEL[k].en}
              </span>
            ))}
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <span className="h-2 w-2 rounded-full bg-white/80 ring-1 ring-white" />
              {t("landscape_frontier")}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="font-mono text-xs text-muted-foreground">
              <span className="text-primary font-semibold">{shown.length}</span>{" "}
              {t("landscape_count")}
            </span>
            <label className="flex items-center gap-2 text-sm cursor-pointer select-none">
              <input
                type="checkbox"
                checked={paretoOnly}
                onChange={e => setParetoOnly(e.target.checked)}
                className="accent-[var(--primary)]"
              />
              {t("landscape_pareto_only")}
            </label>
          </div>
        </div>

        {/* Grafik */}
        <div className="rounded-xl border border-border/60 bg-card/40 p-3 sm:p-5">
          <ResponsiveContainer width="100%" height={520}>
            <ScatterChart margin={{ top: 10, right: 20, bottom: 40, left: 10 }}>
              <CartesianGrid stroke="rgba(255,255,255,0.06)" />
              <XAxis
                type="number"
                dataKey="x"
                scale="log"
                domain={["auto", "auto"]}
                tickFormatter={v => fmtPrice(v)}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                stroke="rgba(255,255,255,0.15)"
                label={{
                  value: t("landscape_axis_x"),
                  position: "insideBottom",
                  offset: -20,
                  fontSize: 12,
                  fill: "var(--muted-foreground)",
                }}
              />
              <YAxis
                type="number"
                dataKey="y"
                domain={["auto", "auto"]}
                tick={{ fontSize: 11, fill: "var(--muted-foreground)" }}
                stroke="rgba(255,255,255,0.15)"
                label={{
                  value: t("landscape_axis_y"),
                  angle: -90,
                  position: "insideLeft",
                  fontSize: 12,
                  fill: "var(--muted-foreground)",
                }}
              />
              <Tooltip
                content={<ChartTooltip />}
                cursor={{ stroke: "rgba(255,255,255,0.15)" }}
              />
              {/* Pareto sınır çizgisi (yalnızca tüm görünümde) */}
              {!paretoOnly && frontier.length > 1 && (
                <Scatter
                  data={frontier}
                  line={{
                    stroke: "var(--primary)",
                    strokeWidth: 1,
                    strokeDasharray: "5 4",
                  }}
                  shape={() => <g />}
                  legendType="none"
                  isAnimationActive={false}
                />
              )}
              <Scatter
                data={shown}
                onClick={handleClick}
                isAnimationActive={false}
                shape={(props: any) => {
                  const p: Point = props.payload;
                  const color = TIER_LABEL[p.tier].color;
                  const r = p.pareto ? 6 : 4;
                  return (
                    <circle
                      cx={props.cx}
                      cy={props.cy}
                      r={r}
                      fill={color}
                      fillOpacity={p.pareto ? 0.95 : 0.5}
                      stroke={p.pareto ? "#fff" : "none"}
                      strokeWidth={p.pareto ? 1.25 : 0}
                      style={{ cursor: "pointer" }}
                    />
                  );
                }}
              />
            </ScatterChart>
          </ResponsiveContainer>
        </div>
        <p className="text-xs text-muted-foreground/70 mt-3">
          {t("landscape_note")}
        </p>
      </section>
    </Layout>
  );
}
