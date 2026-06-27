import {
  createContext,
  useContext,
  useState,
  ReactNode,
  useCallback,
  useMemo,
  useEffect,
} from "react";
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

  // Seçim değiştikçe URL'yi güncelle.
  useEffect(() => {
    patchUrl({ sel: selected.length ? selected.join(",") : null });
  }, [selected]);

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
    }),
    [
      selected,
      toggleSelect,
      clearSelected,
      isSelected,
      compareOpen,
      presetUsecase,
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
