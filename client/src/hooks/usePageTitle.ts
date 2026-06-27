import { useEffect } from "react";

const BASE = "LLM Explorer — OpenRouter modellerini karşılaştır";

// Sayfa başına sekme başlığı (SPA). Etiket verilirse "<Etiket> · LLM Explorer",
// verilmezse ana başlık kullanılır. Dil değişiminde etiket değişeceği için güncellenir.
export function usePageTitle(label?: string) {
  useEffect(() => {
    document.title = label ? `${label} · LLM Explorer` : BASE;
  }, [label]);
}
