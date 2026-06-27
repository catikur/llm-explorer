import { useMemo, useState, useEffect } from "react";
import Layout from "@/components/Layout";
import FilterRail from "@/components/FilterRail";
import ModelTable from "@/components/ModelTable";
import { useDataset, refreshFromOpenRouter } from "@/hooks/useDataset";
import { useFilters } from "@/hooks/useFilters";
import { usePageTitle } from "@/hooks/usePageTitle";
import { useI18n } from "@/contexts/I18nContext";
import { useAppState } from "@/contexts/AppState";
import NavLink from "@/components/NavLink";
import { toast } from "sonner";
import {
  Sparkles,
  SlidersHorizontal,
  Search as SearchIcon,
  ArrowRight,
  Inbox,
  RefreshCw,
  Link2,
} from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
  SheetTitle,
} from "@/components/ui/sheet";

function HeroStat({
  value,
  label,
  color,
}: {
  value: string;
  label: string;
  color?: string;
}) {
  return (
    <div className="flex flex-col">
      <span
        className="font-display font-bold text-2xl sm:text-3xl tabular-nums"
        style={{ color }}
      >
        {value}
      </span>
      <span className="font-mono text-[10px] sm:text-[11px] uppercase tracking-wider text-muted-foreground mt-0.5">
        {label}
      </span>
    </div>
  );
}

export default function Home() {
  const { data, bounds, refreshing } = useDataset();
  const { t, lang } = useI18n();
  const { presetUsecase, setPresetUsecase } = useAppState();
  usePageTitle();

  const onRefresh = async () => {
    try {
      const r = await refreshFromOpenRouter();
      let msg = `${t("refresh_updated")} · ${r.total}`;
      if (r.added) msg += ` · ${r.added} ${t("refresh_new")}`;
      if (r.removed) msg += ` · ${r.removed} ${t("refresh_removed")}`;
      toast.success(msg);
    } catch {
      toast.error(t("refresh_failed"));
    }
  };

  const onShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success(t("share_ok"));
    } catch {
      toast.error(t("share"));
    }
  };

  const dataDate = data
    ? new Date(data.generated_at).toLocaleDateString(
        lang === "tr" ? "tr-TR" : "en-US",
        {
          day: "numeric",
          month: "short",
          year: "numeric",
        }
      )
    : "";

  const models = data?.models ?? [];
  const f = useFilters(models, bounds);

  // categories sayfasından gelen preset
  useEffect(() => {
    if (presetUsecase) {
      f.reset();
      f.toggleIn("usecases", presetUsecase);
      setPresetUsecase(null);
      window.scrollTo({ top: 0 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [presetUsecase]);

  const vendorCounts = useMemo(() => {
    const c: Record<string, number> = {};
    models.forEach(m => (c[m.vendor] = (c[m.vendor] || 0) + 1));
    return c;
  }, [models]);
  const usecaseCounts = useMemo(() => {
    const c: Record<string, number> = {};
    models.forEach(m => m.usecases.forEach(u => (c[u] = (c[u] || 0) + 1)));
    return c;
  }, [models]);

  const stats = useMemo(() => {
    const total = models.length;
    const multimodal = models.filter(m => m.is_multimodal).length;
    const free = models.filter(m => m.is_free).length;
    const vendors = new Set(models.map(m => m.vendor.replace(/^~/, ""))).size;
    return { total, multimodal, free, vendors };
  }, [models]);

  return (
    <Layout>
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-border/60">
        {/* HUD backdrop — saf CSS (ızgara + cyan radial glow), dış görsel yok */}
        <div className="absolute inset-0" aria-hidden="true">
          <div
            className="absolute inset-0 opacity-[0.35]"
            style={{
              backgroundImage:
                "linear-gradient(to right, color-mix(in oklab, var(--primary) 12%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, var(--primary) 12%, transparent) 1px, transparent 1px)",
              backgroundSize: "44px 44px",
              maskImage:
                "radial-gradient(ellipse 80% 70% at 30% 0%, black, transparent 75%)",
              WebkitMaskImage:
                "radial-gradient(ellipse 80% 70% at 30% 0%, black, transparent 75%)",
            }}
          />
          <div
            className="absolute -top-1/3 -left-1/4 w-[60vw] h-[60vw] rounded-full blur-3xl opacity-25"
            style={{
              background:
                "radial-gradient(circle, var(--primary), transparent 60%)",
            }}
          />
          <div className="absolute inset-0 bg-gradient-to-b from-background/20 via-background/60 to-background" />
        </div>
        <div className="relative max-w-[1600px] mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-primary/30 bg-primary/10 text-primary font-mono text-[11px] tracking-wider mb-5">
            <span className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
            {t("hero_kicker")}
          </div>
          <h1 className="font-display font-bold text-3xl sm:text-5xl lg:text-6xl leading-[1.05] max-w-3xl">
            {t("hero_title_1")}
            <br />
            <span className="text-primary text-glow">{t("hero_title_2")}</span>
          </h1>
          <p className="mt-5 text-base sm:text-lg text-muted-foreground max-w-2xl leading-relaxed">
            {t("hero_sub")}
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-7">
            <a
              href="#explorer"
              className="flex items-center gap-2 h-11 px-5 rounded-md bg-primary text-primary-foreground font-semibold transition-transform active:scale-[0.97] hover:brightness-110"
            >
              <SearchIcon className="h-4 w-4" /> {t("hero_cta_explore")}
            </a>
            <NavLink
              href="/advisor"
              className="flex items-center gap-2 h-11 px-5 rounded-md border border-border bg-white/[0.03] font-semibold transition-colors hover:border-primary/50 hover:text-primary"
            >
              <Sparkles className="h-4 w-4" /> {t("hero_cta_advisor")}
            </NavLink>
          </div>
          <div className="grid grid-cols-2 sm:flex sm:items-center gap-6 sm:gap-12 mt-12">
            <HeroStat
              value={`${stats.total}`}
              label={t("stat_models")}
              color="var(--primary)"
            />
            <HeroStat
              value={`${stats.multimodal}`}
              label={t("stat_multimodal")}
            />
            <HeroStat
              value={`${stats.free}`}
              label={t("stat_free")}
              color="oklch(0.7 0.16 145)"
            />
            <HeroStat value={`${stats.vendors}`} label={t("stat_vendors")} />
          </div>
        </div>
      </section>

      {/* Explorer */}
      <section
        id="explorer"
        className="max-w-[1600px] mx-auto px-4 sm:px-6 py-8 scroll-mt-16"
      >
        <div className="flex gap-6">
          {/* Desktop rail */}
          {data && (
            <aside className="hidden lg:block w-[300px] shrink-0">
              <div className="sticky top-20 max-h-[calc(100vh-6rem)]">
                <div className="rounded-xl border border-border/60 bg-card/40 p-4 flex flex-col max-h-[calc(100vh-6rem)]">
                  <FilterRail
                    data={data}
                    filters={f.filters}
                    setF={f.setF}
                    toggleIn={f.toggleIn}
                    reset={f.reset}
                    vendorCounts={vendorCounts}
                    usecaseCounts={usecaseCounts}
                  />
                </div>
              </div>
            </aside>
          )}

          {/* Table area */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="font-mono text-sm text-muted-foreground">
                <span className="text-primary font-semibold text-base">
                  {f.filtered.length}
                </span>{" "}
                {t("of")} {models.length} {t("showing")}
              </div>
              <div className="flex items-center gap-2">
                {/* Veri tarihi */}
                {data && (
                  <span className="hidden sm:inline font-mono text-[11px] text-muted-foreground/70">
                    {t("data_label")}: {dataDate}
                  </span>
                )}
                {/* Paylaş (URL kopyala) */}
                <button
                  onClick={onShare}
                  title={t("share")}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-border bg-white/[0.03] text-sm font-medium hover:border-primary/50 hover:text-primary transition-colors"
                >
                  <Link2 className="h-4 w-4" />
                  <span className="hidden md:inline">{t("share")}</span>
                </button>
                {/* Tazele (OpenRouter'dan canlı) */}
                <button
                  onClick={onRefresh}
                  disabled={refreshing}
                  title={t("refresh_tip")}
                  className="flex items-center gap-1.5 h-9 px-3 rounded-md border border-border bg-white/[0.03] text-sm font-medium hover:border-primary/50 hover:text-primary transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <RefreshCw
                    className={`h-4 w-4 ${refreshing ? "animate-spin" : ""}`}
                  />
                  <span className="hidden md:inline">
                    {refreshing ? t("refreshing") : t("refresh")}
                  </span>
                </button>
              </div>
            </div>
            <div className="flex items-center justify-end gap-3 mb-4 lg:hidden">
              {/* Mobile filter trigger */}
              {data && (
                <Sheet>
                  <SheetTrigger asChild>
                    <button className="lg:hidden flex items-center gap-2 h-9 px-3.5 rounded-md border border-border bg-white/[0.03] text-sm font-medium">
                      <SlidersHorizontal className="h-4 w-4" /> {t("filters")}
                    </button>
                  </SheetTrigger>
                  <SheetContent
                    side="left"
                    className="w-[88vw] max-w-sm p-4 overflow-hidden flex flex-col"
                  >
                    <SheetTitle className="sr-only">{t("filters")}</SheetTitle>
                    <FilterRail
                      data={data}
                      filters={f.filters}
                      setF={f.setF}
                      toggleIn={f.toggleIn}
                      reset={f.reset}
                      vendorCounts={vendorCounts}
                      usecaseCounts={usecaseCounts}
                    />
                  </SheetContent>
                </Sheet>
              )}
            </div>

            {bounds && f.filtered.length > 0 && (
              <ModelTable
                models={f.filtered}
                bounds={bounds}
                sortKey={f.sortKey}
                sortDir={f.sortDir}
                onSort={f.toggleSort}
              />
            )}
            {f.filtered.length === 0 && (
              <div className="grid place-items-center min-h-[40vh] text-center">
                <div>
                  <Inbox className="h-10 w-10 text-muted-foreground/40 mx-auto mb-3" />
                  <p className="font-display font-semibold text-lg">
                    {t("no_results")}
                  </p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {t("no_results_sub")}
                  </p>
                  <button
                    onClick={f.reset}
                    className="mt-4 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
                  >
                    {t("reset")} <ArrowRight className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>
    </Layout>
  );
}
