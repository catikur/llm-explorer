import { describe, it, expect, beforeEach } from "vitest";
import { readUrlState, patchUrl, filtersToParams } from "./urlState";
import type { FilterState } from "@/hooks/useFilters";

// window stub (node) — gerçek tarayıcı history davranışını taklit eder.
const store = { search: "", pathname: "/", hash: "" };
beforeEach(() => {
  store.search = "";
  (globalThis as any).window = {
    location: store,
    history: {
      state: null,
      replaceState: (_s: any, _t: string, url: string) => {
        const q = url.indexOf("?");
        store.search = q >= 0 ? url.slice(q) : "";
      },
    },
  };
});

const fullFilters: FilterState = {
  q: "claude",
  usecases: ["coding", "reasoning"],
  vendors: ["anthropic"],
  tiers: ["frontier"],
  modality: "image",
  caps: ["tools"],
  maxPrice: 5,
  onlyFree: true,
  onlyBench: false,
};

describe("urlState codec", () => {
  it("filtre + sıralama round-trip", () => {
    patchUrl(filtersToParams(fullFilters, "price", "asc"));
    const r = readUrlState();
    expect(r.filters.q).toBe("claude");
    expect(r.filters.usecases).toEqual(["coding", "reasoning"]);
    expect(r.filters.vendors).toEqual(["anthropic"]);
    expect(r.filters.tiers).toEqual(["frontier"]);
    expect(r.filters.modality).toBe("image");
    expect(r.filters.caps).toEqual(["tools"]);
    expect(r.filters.maxPrice).toBe(5);
    expect(r.filters.onlyFree).toBe(true);
    expect(r.filters.onlyBench).toBeUndefined(); // false → param yok
    expect(r.sortKey).toBe("price");
    expect(r.sortDir).toBe("asc");
  });

  it("seçim ve model id'lerini (slash içeren) korur", () => {
    patchUrl({
      sel: "anthropic/claude-opus-4.8,openai/gpt-5.4",
      model: "google/gemini-3-pro",
    });
    const r = readUrlState();
    expect(r.selected).toEqual(["anthropic/claude-opus-4.8", "openai/gpt-5.4"]);
    expect(r.detail).toBe("google/gemini-3-pro");
  });

  it("patchUrl diğer anahtarları koruyarak merge eder", () => {
    patchUrl(filtersToParams(fullFilters, "intelligence", "desc"));
    patchUrl({ sel: "a/b" });
    let r = readUrlState();
    expect(r.filters.q).toBe("claude");
    expect(r.selected).toEqual(["a/b"]);
    // sel'i sil → filtreler kalır
    patchUrl({ sel: null });
    r = readUrlState();
    expect(r.selected).toEqual([]);
    expect(r.filters.q).toBe("claude");
  });

  it("boş durum tüm alanlarda nötr döner", () => {
    const r = readUrlState();
    expect(r.filters).toEqual({});
    expect(r.selected).toEqual([]);
    expect(r.detail).toBeNull();
    expect(r.sortKey).toBeNull();
  });
});
