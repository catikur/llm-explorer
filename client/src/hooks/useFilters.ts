import { useMemo, useState, useCallback, useEffect } from "react";
import { LLMModel, MetricBounds } from "@/lib/models";
import {
  intelNorm,
  speedNorm,
  priceNorm,
  ctxNorm,
} from "@/components/MetricBits";
import { readUrlState, patchUrl, filtersToParams } from "@/lib/urlState";

export type SortKey =
  | "intelligence"
  | "speed"
  | "price"
  | "value"
  | "context"
  | "name"
  | "vendor";
export type SortDir = "asc" | "desc";

export interface FilterState {
  q: string;
  usecases: string[];
  vendors: string[];
  tiers: string[];
  modality: string | null; // text | image | audio | file | video | imgout
  caps: string[]; // tools reasoning structured
  maxPrice: number | null;
  onlyFree: boolean;
  onlyBench: boolean;
}

export const EMPTY_FILTERS: FilterState = {
  q: "",
  usecases: [],
  vendors: [],
  tiers: [],
  modality: null,
  caps: [],
  maxPrice: null,
  onlyFree: false,
  onlyBench: false,
};

const SORT_KEYS: SortKey[] = [
  "intelligence",
  "speed",
  "price",
  "value",
  "context",
  "name",
  "vendor",
];

export function useFilters(models: LLMModel[], bounds: MetricBounds | null) {
  // Başlangıç durumu paylaşılabilir URL'den okunur (varsa).
  const [filters, setFilters] = useState<FilterState>(() => ({
    ...EMPTY_FILTERS,
    ...readUrlState().filters,
  }));
  const [sortKey, setSortKey] = useState<SortKey>(() => {
    const k = readUrlState().sortKey;
    return k && SORT_KEYS.includes(k) ? k : "intelligence";
  });
  const [sortDir, setSortDir] = useState<SortDir>(
    () => readUrlState().sortDir ?? "desc"
  );

  // Durum değiştikçe URL'yi güncelle (yalnızca filtre/sıralama anahtarları).
  useEffect(() => {
    patchUrl(filtersToParams(filters, sortKey, sortDir));
  }, [filters, sortKey, sortDir]);

  const setF = useCallback(
    <K extends keyof FilterState>(key: K, val: FilterState[K]) => {
      setFilters(prev => ({ ...prev, [key]: val }));
    },
    []
  );

  const toggleIn = useCallback(
    (key: "usecases" | "vendors" | "tiers" | "caps", val: string) => {
      setFilters(prev => {
        const arr = prev[key];
        return {
          ...prev,
          [key]: arr.includes(val) ? arr.filter(x => x !== val) : [...arr, val],
        };
      });
    },
    []
  );

  const reset = useCallback(() => setFilters(EMPTY_FILTERS), []);

  const toggleSort = useCallback((key: SortKey) => {
    setSortKey(prevKey => {
      if (prevKey === key) {
        setSortDir(d => (d === "asc" ? "desc" : "asc"));
        return key;
      }
      setSortDir(key === "name" || key === "vendor" ? "asc" : "desc");
      return key;
    });
  }, []);

  const filtered = useMemo(() => {
    const q = filters.q.trim().toLowerCase();
    return models.filter(m => {
      if (
        q &&
        !m.name.toLowerCase().includes(q) &&
        !m.vendor.toLowerCase().includes(q) &&
        !m.id.toLowerCase().includes(q)
      )
        return false;
      if (
        filters.usecases.length &&
        !filters.usecases.some(u => m.usecases.includes(u))
      )
        return false;
      if (filters.vendors.length && !filters.vendors.includes(m.vendor))
        return false;
      if (filters.tiers.length && !filters.tiers.includes(m.tier)) return false;
      if (filters.onlyFree && !m.is_free) return false;
      if (filters.onlyBench && !m.has_benchmark) return false;
      if (filters.maxPrice != null) {
        const p = m.is_free ? 0 : m.blended_price;
        if (p == null || p > filters.maxPrice) return false;
      }
      if (filters.modality) {
        const mod = filters.modality;
        if (mod === "image" && !m.image_input) return false;
        if (mod === "audio" && !m.audio_input) return false;
        if (mod === "file" && !m.file_input) return false;
        if (mod === "video" && !m.input_modalities.includes("video"))
          return false;
        if (mod === "imgout" && !m.image_output) return false;
        if (mod === "text" && m.is_multimodal) return false;
      }
      for (const c of filters.caps) {
        if (c === "tools" && !m.tools) return false;
        if (c === "reasoning" && !m.reasoning) return false;
        if (c === "structured" && !m.structured_outputs) return false;
      }
      return true;
    });
  }, [models, filters]);

  const sorted = useMemo(() => {
    if (!bounds) return filtered;
    const dir = sortDir === "asc" ? 1 : -1;
    const val = (m: LLMModel): number | string => {
      switch (sortKey) {
        case "name":
          return m.name.toLowerCase();
        case "vendor":
          return m.vendor.toLowerCase();
        case "intelligence":
          return intelNorm(m, bounds) ?? -1;
        case "speed":
          return speedNorm(m, bounds) ?? -1;
        case "context":
          return ctxNorm(m, bounds) ?? -1;
        case "value":
          return m.value_score ?? -1;
        case "price": {
          // for price asc means cheapest first; use affordability inverse
          const aff = priceNorm(m, bounds);
          return aff ?? -1;
        }
        default:
          return -1;
      }
    };
    const arr = [...filtered];
    arr.sort((a, b) => {
      const va = val(a),
        vb = val(b);
      if (typeof va === "string" && typeof vb === "string")
        return va.localeCompare(vb) * dir;
      return ((va as number) - (vb as number)) * dir;
    });
    return arr;
  }, [filtered, sortKey, sortDir, bounds]);

  return {
    filters,
    setF,
    toggleIn,
    reset,
    filtered: sorted,
    rawCount: filtered.length,
    sortKey,
    sortDir,
    toggleSort,
  };
}
