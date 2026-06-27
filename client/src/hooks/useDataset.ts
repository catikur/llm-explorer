import { useSyncExternalStore, useEffect } from "react";
import {
  Dataset,
  loadDataset,
  computeBounds,
  MetricBounds,
} from "@/lib/models";
import { fetchOpenRouterModels, buildDataset } from "@shared/openrouter";

// Veri kümesi tüm uygulamada tek bir harici store'da tutulur; böylece "Tazele"
// butonu veriyi güncellediğinde her bileşen (tablo, kategoriler, advisor) yeniden
// render olur. useSyncExternalStore ile React'e bağlanır.

interface DatasetState {
  data: Dataset | null;
  bounds: MetricBounds | null;
  error: string | null;
  loading: boolean;
  refreshing: boolean;
}

let state: DatasetState = {
  data: null,
  bounds: null,
  error: null,
  loading: true,
  refreshing: false,
};

const listeners = new Set<() => void>();
function set(patch: Partial<DatasetState>) {
  state = { ...state, ...patch };
  listeners.forEach(l => l());
}
function subscribe(l: () => void) {
  listeners.add(l);
  return () => {
    listeners.delete(l);
  };
}
function getSnapshot() {
  return state;
}

let started = false;
function ensureLoaded() {
  if (started) return;
  started = true;
  loadDataset()
    .then(d =>
      set({ data: d, bounds: computeBounds(d.models), loading: false })
    )
    .catch(e => set({ error: String(e), loading: false }));
}

// OpenRouter API'sinden canlı tazeleme (tarayıcıda doğrudan; API CORS açık).
// Katalog/fiyat güncellenir, benchmark alanları mevcut veriden korunur.
export async function refreshFromOpenRouter(): Promise<{
  added: number;
  removed: number;
  total: number;
}> {
  if (!state.data) throw new Error("Veri henüz yüklenmedi");
  set({ refreshing: true, error: null });
  try {
    const api = await fetchOpenRouterModels();
    const { dataset, added, removed, total } = buildDataset(
      api,
      state.data,
      new Date().toISOString()
    );
    set({
      data: dataset,
      bounds: computeBounds(dataset.models),
      refreshing: false,
    });
    return { added: added.length, removed: removed.length, total };
  } catch (e) {
    set({ refreshing: false });
    throw e;
  }
}

export function useDataset() {
  const s = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  useEffect(ensureLoaded, []);
  return s;
}
