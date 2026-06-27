# LLM Explorer

> OpenRouter üzerindeki **339 LLM**'i tek ekranda filtrele, sırala, karşılaştır ve önerі al.
> Filter, sort, compare and get recommendations for **339 LLMs** on OpenRouter — in one screen.

Tamamen istemci tarafında çalışan (client-side), TR/EN dilli, koyu temalı bir LLM keşif ve karşılaştırma panosu. "Mission Control" estetiğiyle tasarlanmıştır: yüksek bilgi yoğunluğu, tek canlı vurgu rengi (elektrik cyan) ve her hücrede inline metrik çubukları.

---

## ✨ Özellikler

**1. Explorer** (`/`)
Sol filtre rayı + sıralanabilir veri tablosu. Sağlayıcı, use-case, fiyat aralığı, bağlam uzunluğu, yetenekler (vision/audio/tools/reasoning), ücretsiz/multimodal'a göre filtrele. Her satırda zekâ / hız / fiyat / bağlam için mini metrik çubukları. Alttan çıkan **karşılaştırma tepsisi** ile seçtiğin modelleri yan yana koy.

**2. Categories** (`/categories`)
12 use-case kategorisi (kod, akıl yürütme, gerçek zamanlı, bütçe, vision, multimodal, uzun bağlam, ajan, yazım, üretim, kurumsal). Her kart, o işin doğasına uygun ağırlıklarla puanlanmış **top-3 modeli** gösterir.

**3. Advisor** (`/advisor`)
Zekâ / hız / fiyat / bağlam için ağırlık sliderları + zorunlu yetenek filtreleri → önceliklerine göre **% eşleşme skoruyla** sıralanmış kişisel öneri listesi ve her model için gerekçeler.

**Karşılaştırma matrisi:** Seçilen modeller için satır satır karşılaştırma, her metrikte kazananın işaretlenmesi ve otomatik üretilen içgörü cümleleri ("X, Y'den 2.4x daha pahalı", "Z en geniş bağlama sahip" vb.).

---

## 🧱 Teknoloji

- **React 19** + **TypeScript** + **Vite 7**
- **TailwindCSS 4** + **shadcn/ui** (Radix primitives)
- **wouter** (routing), **framer-motion** (animasyon), **lucide-react** (ikonlar)
- **Express** — yalnızca üretimde statik dosya sunumu + SPA fallback (API yok)
- Veri: derlenmiş statik `models_dataset.json` (istemci tarafında `fetch` ile yüklenir)

Tipografi: Space Grotesk (başlık) · Inter (gövde) · JetBrains Mono (sayısal veri).

---

## 🚀 Başlangıç

Gereksinim: **Node 20+** ve **pnpm 10+**.

```bash
pnpm install      # bağımlılıkları kur
pnpm dev          # geliştirme sunucusu — http://localhost:3000
pnpm build        # üretim derlemesi → dist/
pnpm preview      # üretim derlemesini yerelde önizle
pnpm check        # TypeScript tip kontrolü
```

---

## 📦 Dağıtım (Deployment)

Uygulama tamamen statiktir — `dist/public/` klasörünü herhangi bir statik barındırıcıya (Vercel, Netlify, GitHub Pages, Cloudflare Pages) atmak yeterlidir. Sunucuya gerek yoktur.

Dahil edilen Express sunucusu (`pnpm start`) yalnızca tek bir kutuda statik dosya sunmak ve SPA yönlendirmesi yapmak içindir:

```bash
pnpm build
pnpm start        # NODE_ENV=production node dist/index.js → http://localhost:3000
```

---

## 🗂️ Proje yapısı

```
client/
  src/
    pages/         Home (explorer) · Categories · Advisor · NotFound
    components/    FilterRail · ModelTable · CompareTray · MetricBits · TopBar …
    lib/           models.ts (tipler/format) · advisor.ts (skorlama/içgörü motoru)
    hooks/         useDataset · useFilters · useComposition …
    contexts/      ThemeContext · I18nContext (TR/EN) · AppState
  public/
    models_dataset.json   ← veri kümesi
    favicon.svg
server/
  index.ts         Üretim statik sunucusu (Express)
```

---

## 📊 Veri kümesi

`client/public/models_dataset.json` aşağıdaki yapıdadır:

```jsonc
{
  "generated_at": "2026-06-27T14:14:25Z",
  "total": 339,
  "vendors": ["anthropic", "openai", "google", ...],   // 56 sağlayıcı
  "usecase_meta": { "coding": { "tr": ..., "en": ..., "icon": ... }, ... },
  "models": [
    {
      "id": "anthropic/claude-...",
      "name": "...", "vendor": "anthropic",
      "context_length": 200000, "max_completion_tokens": 8192,
      "is_multimodal": true, "image_input": true, "audio_input": false,
      "prompt_price": 3.0, "completion_price": 15.0, "blended_price": 6.0, "is_free": false,
      "tools": true, "reasoning": true, "structured_outputs": true,
      "intelligence_index": 64, "output_tps": 78, "latency_s": 1.2, "has_benchmark": true,
      "usecases": ["coding", "reasoning", "agentic"],
      "tier": "frontier", "value_score": 42
    }
  ]
}
```

- **Katalog alanları** (model listesi, fiyat, bağlam, modalite, yetenekler) OpenRouter'dan türetilmiştir.
- **Benchmark alanları** (`intelligence_index`, `output_tps`, `latency_s`) harici benchmark verisinden gelir; 339 modelin 205'inde mevcuttur (`has_benchmark: true`).
- `tier`, `usecases` ve `value_score` bu alanlardan türetilen sınıflandırmalardır.

> Veri tarihli bir anlık görüntüdür (`generated_at`). Otomatik tazeleme scripti yol haritasındadır (aşağıya bakın).

---

## 🛣️ Yol haritası

- [ ] **OpenRouter veri-tazeleme scripti** + GitHub Action (cron) ile otomatik güncelleme
- [ ] **Paylaşılabilir URL**: filtre/seçim durumunu query param'a yazma ("şu 3 modeli karşılaştır" linki)
- [ ] **Kalıcı seçim**: seçili modelleri `localStorage`'da saklama
- [ ] **Maliyet hesaplayıcı**: token sayısından aylık maliyet tahmini
- [ ] **Dışa aktarma**: karşılaştırmayı CSV / PNG olarak
- [ ] CI: typecheck + build doğrulaması

---

## 📄 Lisans

MIT
