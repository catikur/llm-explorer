// Paylaşılabilir URL: filtreler, sıralama ve seçili modeller query param'a yazılır.
// Tek bir URL'yi iki yazar paylaşır (explorer filtreleri + global seçim); her yazar
// yalnızca kendi anahtarlarını günceller (patchUrl merge eder), böylece çakışmazlar.

import type { FilterState, SortKey, SortDir } from "@/hooks/useFilters";

export interface ParsedUrlState {
  filters: Partial<FilterState>;
  sortKey: SortKey | null;
  sortDir: SortDir | null;
  selected: string[];
}

const splitList = (v: string | null): string[] =>
  v
    ? v
        .split(",")
        .map(s => s.trim())
        .filter(Boolean)
    : [];

export function readUrlState(): ParsedUrlState {
  if (typeof window === "undefined") {
    return { filters: {}, sortKey: null, sortDir: null, selected: [] };
  }
  const p = new URLSearchParams(window.location.search);
  const filters: Partial<FilterState> = {};

  const q = p.get("q");
  if (q) filters.q = q;
  const uc = splitList(p.get("uc"));
  if (uc.length) filters.usecases = uc;
  const vendor = splitList(p.get("vendor"));
  if (vendor.length) filters.vendors = vendor;
  const tier = splitList(p.get("tier"));
  if (tier.length) filters.tiers = tier;
  const caps = splitList(p.get("caps"));
  if (caps.length) filters.caps = caps;
  const mod = p.get("mod");
  if (mod) filters.modality = mod;
  const maxp = p.get("maxp");
  if (maxp != null && maxp !== "" && !Number.isNaN(Number(maxp)))
    filters.maxPrice = Number(maxp);
  if (p.get("free") === "1") filters.onlyFree = true;
  if (p.get("bench") === "1") filters.onlyBench = true;

  let sortKey: SortKey | null = null;
  let sortDir: SortDir | null = null;
  const sort = p.get("sort");
  if (sort) {
    const [k, d] = sort.split(".");
    if (k) sortKey = k as SortKey;
    if (d === "asc" || d === "desc") sortDir = d;
  }

  return { filters, sortKey, sortDir, selected: splitList(p.get("sel")) };
}

// Verilen anahtarları URL'de günceller (null/"" → siler), diğerlerini korur.
// history spam'i olmaması için replaceState kullanır.
export function patchUrl(updates: Record<string, string | null | undefined>) {
  if (typeof window === "undefined") return;
  const p = new URLSearchParams(window.location.search);
  for (const [k, v] of Object.entries(updates)) {
    if (v == null || v === "") p.delete(k);
    else p.set(k, v);
  }
  const qs = p.toString();
  const url =
    window.location.pathname + (qs ? "?" + qs : "") + window.location.hash;
  window.history.replaceState(window.history.state, "", url);
}

// Filtre + sıralama durumunu URL anahtarlarına çevirir.
export function filtersToParams(
  f: FilterState,
  sortKey: SortKey,
  sortDir: SortDir
): Record<string, string | null> {
  return {
    q: f.q || null,
    uc: f.usecases.length ? f.usecases.join(",") : null,
    vendor: f.vendors.length ? f.vendors.join(",") : null,
    tier: f.tiers.length ? f.tiers.join(",") : null,
    caps: f.caps.length ? f.caps.join(",") : null,
    mod: f.modality || null,
    maxp: f.maxPrice != null ? String(f.maxPrice) : null,
    free: f.onlyFree ? "1" : null,
    bench: f.onlyBench ? "1" : null,
    sort: `${sortKey}.${sortDir}`,
  };
}
