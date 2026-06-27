import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
  useEffect,
} from "react";
import { useLocation } from "wouter";
import { LLMModel } from "@/lib/models";
import { readUrlState, patchUrl } from "@/lib/urlState";

interface AppStateCtx {
  selected: string[]; // model ids for comparison
  toggleSelect: (id: string) => void;
  clearSelected: () => void;
  isSelected: (id: string) => boolean;
  compareOpen: boolean;
  setCompareOpen: (v: boolean) => void;
  // active usecase filter shortcut (from categories page)
  presetUsecase: string | null;
  setPresetUsecase: (v: string | null) => void;
  // açık model detayı (drawer) — URL'de model=<id>
  detailId: string | null;
  openDetail: (id: string) => void;
  closeDetail: () => void;
}

const Ctx = createContext<AppStateCtx | null>(null);

const MAX_COMPARE = 5;

export function AppStateProvider({ children }: { children: ReactNode }) {
  // Seçili modeller paylaşılabilir URL'den okunur (karşılaştırma bağlantısı).
  const [selected, setSelected] = useState<string[]>(() =>
    readUrlState().selected.slice(0, MAX_COMPARE)
  );
  const [compareOpen, setCompareOpen] = useState(false);
  const [presetUsecase, setPresetUsecase] = useState<string | null>(null);
  const [detailId, setDetailId] = useState<string | null>(
    () => readUrlState().detail
  );
  const [location] = useLocation();

  // Seçim ve açık detay, her değişimde VE her sayfa geçişinde URL'ye yeniden
  // yazılır; böylece paylaşılabilir durum navigasyonda URL'den düşmez.
  useEffect(() => {
    patchUrl({
      sel: selected.length ? selected.join(",") : null,
      model: detailId,
    });
  }, [selected, detailId, location]);

  const openDetail = useCallback((id: string) => setDetailId(id), []);
  const closeDetail = useCallback(() => setDetailId(null), []);

  const toggleSelect = useCallback((id: string) => {
    setSelected(prev => {
      if (prev.includes(id)) return prev.filter(x => x !== id);
      if (prev.length >= MAX_COMPARE) return prev; // cap
      return [...prev, id];
    });
  }, []);
  const clearSelected = useCallback(() => setSelected([]), []);
  const isSelected = useCallback(
    (id: string) => selected.includes(id),
    [selected]
  );

  const value = useMemo(
    () => ({
      selected,
      toggleSelect,
      clearSelected,
      isSelected,
      compareOpen,
      setCompareOpen,
      presetUsecase,
      setPresetUsecase,
      detailId,
      openDetail,
      closeDetail,
    }),
    [
      selected,
      toggleSelect,
      clearSelected,
      isSelected,
      compareOpen,
      presetUsecase,
      detailId,
      openDetail,
      closeDetail,
    ]
  );
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAppState() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useAppState must be used within AppStateProvider");
  return c;
}

export const MAX_COMPARE_MODELS = MAX_COMPARE;
export type { LLMModel };
