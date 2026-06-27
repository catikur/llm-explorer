import {
  Code2, Brain, Zap, PiggyBank, Eye, Layers, ScrollText, Workflow,
  PenLine, Sparkles, ShieldCheck, Bot, LucideIcon,
} from "lucide-react";

export const USECASE_ICONS: Record<string, LucideIcon> = {
  Code2, Brain, Zap, PiggyBank, Eye, Layers, ScrollText, Workflow,
  PenLine, Sparkles, ShieldCheck, Bot,
};

export function getUsecaseIcon(name: string): LucideIcon {
  return USECASE_ICONS[name] || Bot;
}
