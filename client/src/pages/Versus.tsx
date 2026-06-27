import { useMemo, useState, useEffect, useRef } from "react";
import Layout from "@/components/Layout";
import { useDataset } from "@/hooks/useDataset";
import { useI18n } from "@/contexts/I18nContext";
import { useAppState } from "@/contexts/AppState";
import { usePageTitle } from "@/hooks/usePageTitle";
import { patchUrl } from "@/lib/urlState";
import { generateInsights } from "@/lib/advisor";
import {
  LLMModel,
  displayName,
  vendorLabel,
  fmtPrice,
  fmtContext,
  fmtNum,
  TIER_LABEL,
} from "@/lib/models";
import { Swords, ArrowLeftRight, Link2, Trophy, Lightbulb } from "lucide-react";
import { toast } from "sonner";

type Cmp = 1 | -1 | 0; // 1: a kazanır, -1: b kazanır, 0: eşit/yok

function readParam(k: string): string {
  if (typeof window === "undefined") return "";
  return new URLSearchParams(window.location.search).get(k) || "";
}

// Etiket→id eşlemesi (datalist autocomplete için benzersiz etiket).
function labelOf(m: LLMModel): string {
  return `${displayName(m)} · ${vendorLabel(m.vendor)}`;
}

interface RowDef {
  key: string;
  label: string;
  fmt: (m: LLMModel) => string;
  cmp: (a: LLMModel, b: LLMModel) => Cmp;
}

function num(a: number | null, b: number | null, higher: boolean): Cmp {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (a === b) return 0;
  const aWins = higher ? a > b : a < b;
  return aWins ? 1 : -1;
}

export default function Versus() {
  const { data } = useDataset();
  const { t, lang } = useI18n();
  const { openDetail } = useAppState();
  usePageTitle(t("vs_title"));

  const [aId, setAId] = useState(() => readParam("a"));
  const [bId, setBId] = useState(() => readParam("b"));

  const byLabel = useMemo(() => {
    const map = new Map<string, string>();
    data?.models.forEach(m => map.set(labelOf(m), m.id));
    return map;
  }, [data]);

  const a = data?.models.find(m => m.id === aId) ?? null;
  const b = data?.models.find(m => m.id === bId) ?? null;

  const setSide = (side: "a" | "b", id: string) => {
    if (side === "a") {
      setAId(id);
      patchUrl({ a: id || null });
    } else {
      setBId(id);
      patchUrl({ b: id || null });
    }
  };
  const swap = () => {
    setAId(bId);
    setBId(aId);
    patchUrl({ a: bId || null, b: aId || null });
  };
  const share = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t("share_ok"));
    } catch {
      toast.error(t("share"));
    }
  };

  const insights = useMemo(
    () => (a && b ? generateInsights([a, b], lang) : []),
    [a, b, lang]
  );

  const rows: RowDef[] = [
    {
      key: "intel",
      label: t("col_intel"),
      fmt: m =>
        m.intelligence_index != null ? `${m.intelligence_index}` : "—",
      cmp: (x, y) => num(x.intelligence_index, y.intelligence_index, true),
    },
    {
      key: "speed",
      label: t("col_speed"),
      fmt: m => fmtNum(m.output_tps),
      cmp: (x, y) => num(x.output_tps, y.output_tps, true),
    },
    {
      key: "price",
      label: t("col_price"),
      fmt: m => (m.is_free ? t("free") : fmtPrice(m.blended_price) + "/M"),
      cmp: (x, y) =>
        num(
          x.is_free ? 0 : x.blended_price,
          y.is_free ? 0 : y.blended_price,
          false
        ),
    },
    {
      key: "value",
      label: t("col_value"),
      fmt: m => (m.value_score != null ? m.value_score.toFixed(0) : "—"),
      cmp: (x, y) => num(x.value_score, y.value_score, true),
    },
    {
      key: "context",
      label: t("col_context"),
      fmt: m => fmtContext(m.context_length),
      cmp: (x, y) => num(x.context_length, y.context_length, true),
    },
    {
      key: "latency",
      label: t("col_latency"),
      fmt: m => (m.latency_s != null ? `${m.latency_s}s` : "—"),
      cmp: (x, y) => num(x.latency_s, y.latency_s, false),
    },
  ];

  return (
    <Layout>
      <section className="max-w-[1000px] mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <div className="max-w-2xl mb-6">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-mono text-[11px] tracking-wider mb-4">
            <Swords className="h-3.5 w-3.5" /> {t("vs_title")}
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-4xl">
            {t("vs_title")}
          </h1>
          <p className="mt-3 text-muted-foreground leading-relaxed">
            {t("vs_sub")}
          </p>
        </div>

        {/* Seçiciler */}
        <datalist id="vs-models">
          {data?.models.map(m => (
            <option key={m.id} value={labelOf(m)} />
          ))}
        </datalist>
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_auto_1fr] gap-3 items-end mb-6">
          <Picker
            label={t("vs_pick_a")}
            model={a}
            byLabel={byLabel}
            onPick={id => setSide("a", id)}
          />
          <button
            onClick={swap}
            className="hidden sm:grid place-items-center h-10 w-10 rounded-md border border-border hover:border-primary/50 hover:text-primary transition-colors mb-0.5"
            title={t("vs_swap")}
          >
            <ArrowLeftRight className="h-4 w-4" />
          </button>
          <Picker
            label={t("vs_pick_b")}
            model={b}
            byLabel={byLabel}
            onPick={id => setSide("b", id)}
          />
        </div>

        {a && b ? (
          <>
            {/* Versus kartı */}
            <div className="rounded-xl border border-primary/30 bg-card/50 glow-cyan overflow-hidden">
              <div className="grid grid-cols-[1fr_auto_1fr]">
                <SideHeader
                  m={a}
                  onOpen={() => openDetail(a.id)}
                  lang={lang}
                  t={t}
                />
                <div className="grid place-items-center px-3 border-x border-border/60 bg-white/[0.02]">
                  <span className="font-display font-bold text-lg text-primary">
                    VS
                  </span>
                </div>
                <SideHeader
                  m={b}
                  onOpen={() => openDetail(b.id)}
                  lang={lang}
                  t={t}
                />
              </div>
              <div className="border-t border-border/60">
                {rows.map(row => {
                  const c = row.cmp(a, b);
                  return (
                    <div
                      key={row.key}
                      className="grid grid-cols-[1fr_auto_1fr] items-center border-b border-border/40 last:border-0"
                    >
                      <div
                        className={`flex items-center justify-end gap-2 px-4 py-3 font-mono tabular-nums ${c === 1 ? "text-emerald-300 font-semibold" : ""}`}
                      >
                        {c === 1 && (
                          <Trophy className="h-3.5 w-3.5 text-emerald-300" />
                        )}
                        {row.fmt(a)}
                      </div>
                      <div className="px-3 py-3 text-center font-mono text-[10px] uppercase tracking-wider text-muted-foreground w-28">
                        {row.label}
                      </div>
                      <div
                        className={`flex items-center gap-2 px-4 py-3 font-mono tabular-nums ${c === -1 ? "text-emerald-300 font-semibold" : ""}`}
                      >
                        {row.fmt(b)}
                        {c === -1 && (
                          <Trophy className="h-3.5 w-3.5 text-emerald-300" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Paylaş */}
            <div className="flex justify-center mt-4">
              <button
                onClick={share}
                className="flex items-center gap-1.5 h-9 px-4 rounded-md border border-border bg-white/[0.03] text-sm font-medium hover:border-primary/50 hover:text-primary transition-colors"
              >
                <Link2 className="h-4 w-4" /> {t("share")}
              </button>
            </div>

            {/* İçgörüler */}
            {insights.length > 0 && (
              <div className="mt-6">
                <h3 className="flex items-center gap-2 font-display font-semibold mb-3">
                  <Lightbulb className="h-4 w-4 text-amber-300" />{" "}
                  {t("insights")}
                </h3>
                <ul className="space-y-2">
                  {insights.map((ins, i) => (
                    <li
                      key={i}
                      className="flex items-start gap-2.5 text-sm leading-relaxed rounded-lg border border-border/50 bg-white/[0.02] px-3.5 py-2.5"
                    >
                      <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-primary shrink-0" />
                      <span className="text-foreground/90">{ins}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </>
        ) : (
          <div className="rounded-xl border border-border/60 bg-card/40 p-12 text-center text-muted-foreground">
            {t("vs_pick_prompt")}
          </div>
        )}
      </section>
    </Layout>
  );
}

function Picker({
  label,
  model,
  byLabel,
  onPick,
}: {
  label: string;
  model: LLMModel | null;
  byLabel: Map<string, string>;
  onPick: (id: string) => void;
}) {
  const [text, setText] = useState(model ? labelOf(model) : "");
  const lastId = useRef(model?.id);
  // model dışarıdan değişince (swap / URL) input metnini senkronla.
  useEffect(() => {
    if (model?.id !== lastId.current) {
      lastId.current = model?.id;
      setText(model ? labelOf(model) : "");
    }
  }, [model]);
  return (
    <label className="block">
      <span className="block font-mono text-[10px] uppercase tracking-wider text-muted-foreground mb-1.5">
        {label}
      </span>
      <input
        list="vs-models"
        value={text}
        onChange={e => {
          const v = e.target.value;
          setText(v);
          const id = byLabel.get(v);
          if (id) onPick(id);
        }}
        placeholder="…"
        className="w-full h-10 px-3 rounded-md border border-border bg-white/[0.03] text-sm focus:outline-none focus:border-primary/60"
      />
    </label>
  );
}

function SideHeader({
  m,
  onOpen,
  lang,
  t,
}: {
  m: LLMModel;
  onOpen: () => void;
  lang: string;
  t: (k: string) => string;
}) {
  const tier = TIER_LABEL[m.tier];
  return (
    <div className="p-4 text-center">
      <div className="flex items-center justify-center gap-2">
        <span
          className="h-2 w-2 rounded-full shrink-0"
          style={{ background: tier.color }}
        />
        <button
          onClick={onOpen}
          className="font-display font-semibold truncate hover:text-primary transition-colors"
          title={t("detail_view")}
        >
          {displayName(m)}
        </button>
      </div>
      <div className="font-mono text-[11px] text-muted-foreground mt-1">
        {vendorLabel(m.vendor)} · {lang === "tr" ? tier.tr : tier.en}
        {m.is_free ? " · " + t("free") : ""}
      </div>
    </div>
  );
}
