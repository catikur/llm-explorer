import { LLMModel, norm, MetricBounds, affordability } from "@/lib/models";
import { Image as ImageIcon, Mic, FileText, Sparkles, Video, Wrench, Brain, Braces } from "lucide-react";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

// Inline metrik çubuğu (HUD bar)
export function MetricBar({
  value,
  color = "var(--primary)",
  label,
  empty,
}: {
  value: number; // 0-1
  color?: string;
  label?: string;
  empty?: boolean;
}) {
  if (empty) {
    return <span className="font-mono text-xs text-muted-foreground/50">—</span>;
  }
  const pct = Math.round(value * 100);
  return (
    <div className="flex items-center gap-2 w-full">
      <div className="relative h-1.5 flex-1 rounded-full bg-white/[0.06] overflow-hidden min-w-[36px]">
        <div
          className="absolute inset-y-0 left-0 rounded-full transition-[width] duration-500"
          style={{ width: `${pct}%`, background: color, boxShadow: `0 0 8px ${color}66` }}
        />
      </div>
      {label && <span className="font-mono text-xs tabular-nums text-foreground/80 w-10 text-right">{label}</span>}
    </div>
  );
}

const MOD_ICON: Record<string, { icon: typeof ImageIcon; label: string }> = {
  image: { icon: ImageIcon, label: "Görsel" },
  audio: { icon: Mic, label: "Ses" },
  file: { icon: FileText, label: "Dosya" },
  video: { icon: Video, label: "Video" },
};

export function ModalityIcons({ m }: { m: LLMModel }) {
  const mods: string[] = [];
  if (m.image_input) mods.push("image");
  if (m.audio_input) mods.push("audio");
  if (m.file_input) mods.push("file");
  if (m.input_modalities.includes("video")) mods.push("video");
  if (mods.length === 0) {
    return <span className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground/60">text</span>;
  }
  return (
    <div className="flex items-center gap-1.5">
      {mods.map((mod) => {
        const cfg = MOD_ICON[mod];
        if (!cfg) return null;
        const Icon = cfg.icon;
        return (
          <Tooltip key={mod}>
            <TooltipTrigger asChild>
              <span className="grid place-items-center h-5 w-5 rounded bg-primary/10 text-primary">
                <Icon className="h-3 w-3" />
              </span>
            </TooltipTrigger>
            <TooltipContent>{cfg.label} girişi</TooltipContent>
          </Tooltip>
        );
      })}
      {m.image_output && (
        <Tooltip>
          <TooltipTrigger asChild>
            <span className="grid place-items-center h-5 w-5 rounded bg-amber-400/15 text-amber-300">
              <Sparkles className="h-3 w-3" />
            </span>
          </TooltipTrigger>
          <TooltipContent>Görsel çıkışı üretir</TooltipContent>
        </Tooltip>
      )}
    </div>
  );
}

export function CapabilityDots({ m }: { m: LLMModel }) {
  const caps = [
    { on: m.tools, icon: Wrench, label: "Araç çağırma" },
    { on: m.reasoning, icon: Brain, label: "Akıl yürütme" },
    { on: m.structured_outputs, icon: Braces, label: "Yapılandırılmış çıktı" },
  ];
  return (
    <div className="flex items-center gap-1">
      {caps.map(({ on, icon: Icon, label }, i) => (
        <Tooltip key={i}>
          <TooltipTrigger asChild>
            <span
              className={`grid place-items-center h-5 w-5 rounded transition-colors ${
                on ? "bg-emerald-400/15 text-emerald-300" : "bg-white/[0.04] text-muted-foreground/30"
              }`}
            >
              <Icon className="h-3 w-3" />
            </span>
          </TooltipTrigger>
          <TooltipContent>{label}: {on ? "Var" : "Yok"}</TooltipContent>
        </Tooltip>
      ))}
    </div>
  );
}

// metrik normalize yardımcıları (tablo/karşılaştırma için)
export function intelNorm(m: LLMModel, b: MetricBounds) {
  return m.intelligence_index != null
    ? norm(m.intelligence_index, b.intelligence[0], b.intelligence[1])
    : null;
}
export function speedNorm(m: LLMModel, b: MetricBounds) {
  return m.output_tps != null
    ? norm(Math.log10(m.output_tps), Math.log10(b.speed[0]), Math.log10(b.speed[1]))
    : null;
}
export function priceNorm(m: LLMModel, b: MetricBounds) {
  return affordability(m, b);
}
export function ctxNorm(m: LLMModel, b: MetricBounds) {
  return m.context_length > 0
    ? norm(Math.log10(m.context_length), b.context[0], b.context[1])
    : null;
}
