# Tasarım Beyin Fırtınası — OpenRouter LLM Explorer

## Üç Stilistik Yaklaşım

### 1. "Mission Control" (Uzay/Komuta Merkezi)
Koyu, derin lacivert-siyah arka plan üzerinde neon-cyan ve amber vurgular; bir uçuş kontrol panosu / terminal estetiği. Veri yoğun, profesyonel ve "yeni nesil AI lab" hissi.
**Olasılık: 0.07**

### 2. "Editorial Data Journal" (Aydınlık, Tipografik)
Açık krem zemin, koyu serif başlıklar, geniş beyaz alan; bir veri gazeteciliği / Bloomberg-benzeri analiz dergisi hissi. Sakin ama otoriter.
**Olasılık: 0.04**

### 3. "Neo-Brutalist Spec Sheet" (Kalın hatlar, monospace)
Sert kenarlıklar, yüksek kontrast, monospace tipografi, fonksiyon önceliği. Geliştirici dostu, ham ve teknik.
**Olasılık: 0.03**

## SEÇİLEN YAKLAŞIM: "Mission Control"

Veri yoğun bir karşılaştırma/keşif platformu için en uygun olan, koyu temalı, yüksek bilgi yoğunluklu ve "AI laboratuvarı komuta merkezi" hissi veren yaklaşımdır. Geliştiriciler ve teknik karar vericiler için tanıdık (terminal/dashboard) ama yeni nesil ve cilalı.

- **Design Movement**: Modern dashboard / "spatial dark UI" — Linear, Vercel Observability ve uçuş kontrol panellerinin kesişimi.
- **Core Principles**:
  1. Bilgi yoğunluğu okunabilirlikle dengelenir — her piksel veri taşır ama nefes alır.
  2. Koyu zemin + tek canlı vurgu rengi (cyan) ile hiyerarşi.
  3. Veri her zaman görselleştirilir (mini-bar, sparkline, rozet) — çıplak sayı yok.
  4. Anlık geri bildirim: her seçim/filtre canlı insight üretir.
- **Color Philosophy**: Derin uzay laciverti (#0A0E1A) zemin, panel için biraz daha açık (#121829). Birincil vurgu **elektrik cyan (#22D3EE)**; ikincil **amber (#FBBF24)** uyarı/sıcaklık; başarı **emerald**. Renk = anlam (hız=amber, zeka=cyan, maliyet=emerald/red gradyan).
- **Layout Paradigm**: Sol kalıcı filtre/komuta rayı (sidebar) + sağda geniş veri kanvası. Üstte sticky komuta çubuğu (arama + global insight). Asimetrik, grid-merkezli değil.
- **Signature Elements**:
  1. "Metric bars" — her hücrede inline mini ilerleme çubukları.
  2. Glow/halo efektli seçili satırlar ve karşılaştırma tepsisi (comparison tray) altta sabit.
  3. Köşe nişanları (corner ticks) ve ince ızgara çizgileri — HUD hissi.
- **Interaction Philosophy**: Seçim yap → anında insight. Karşılaştırma tepsisi büyür. Filtreler canlı sayaç gösterir. Snappy ease-out geçişler (<250ms).
- **Animation**: Satır girişlerinde 40ms stagger; karşılaştırma tepsisi alttan yukarı kayar; sayılar count-up; hover'da glow. prefers-reduced-motion saygı.
- **Typography System**: Başlık/marka **Space Grotesk** (geometrik, teknik); gövde **Inter**; sayısal veri **JetBrains Mono** (hizalı rakamlar). 
- **Brand Essence**: "OpenRouter'daki tüm modelleri tek bakışta kıyasla, seç, anla." — Teknik karar vericiler için. Adjectives: precise, powerful, luminous.
- **Brand Voice**: Net, güvenli, teknik ama davetkâr. Örnek başlık: "339 model. Tek komuta merkezi." CTA: "Modelleri karşılaştır →". Genel dolgu yasak.
- **Wordmark & Logo**: Yörünge/rota düğümü konsepti — bir merkez nokta etrafında dönen düğümler (router metaforu), cyan glow. Monospace "OR//EXPLORER" wordmark.
- **Signature Brand Color**: Elektrik cyan #22D3EE.

## Dil
TR + EN dil değiştirme desteklenecek (varsayılan TR).
