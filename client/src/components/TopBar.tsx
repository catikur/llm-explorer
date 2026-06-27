import { useI18n } from "@/contexts/I18nContext";
import { useLocation } from "wouter";
import NavLink from "@/components/NavLink";
import { Compass, LayoutGrid, Sparkles, GitCompare } from "lucide-react";
import { useAppState } from "@/contexts/AppState";

// Marka logosu — "router" metaforu: merkez düğüm + yörüngedeki düğümler, cyan glow.
// Inline SVG: dış bağımlılık/asset yok, her ortamda çalışır.
function Logo({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      className={className}
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
    >
      <circle
        cx="20"
        cy="20"
        r="18"
        stroke="currentColor"
        strokeOpacity="0.18"
        strokeWidth="1"
      />
      <circle
        cx="20"
        cy="20"
        r="11.5"
        stroke="currentColor"
        strokeOpacity="0.28"
        strokeWidth="1"
      />
      {/* yörünge bağlantı çizgileri */}
      <g stroke="currentColor" strokeOpacity="0.45" strokeWidth="1.4">
        <line x1="20" y1="20" x2="20" y2="6.5" />
        <line x1="20" y1="20" x2="31.7" y2="26.7" />
        <line x1="20" y1="20" x2="8.3" y2="26.7" />
      </g>
      {/* düğümler */}
      <circle cx="20" cy="6.5" r="2.6" fill="currentColor" />
      <circle cx="31.7" cy="26.7" r="2.6" fill="currentColor" />
      <circle cx="8.3" cy="26.7" r="2.6" fill="currentColor" />
      {/* merkez */}
      <circle cx="20" cy="20" r="4" fill="currentColor" />
      <circle cx="20" cy="20" r="4" fill="white" fillOpacity="0.25" />
    </svg>
  );
}

export default function TopBar() {
  const { t, lang, setLang } = useI18n();
  const [loc] = useLocation();
  const { selected } = useAppState();

  const nav = [
    { href: "/", label: t("nav_explore"), icon: Compass },
    { href: "/categories", label: t("nav_categories"), icon: LayoutGrid },
    { href: "/advisor", label: t("nav_recommend"), icon: Sparkles },
  ];

  return (
    <header className="sticky top-0 z-40 border-b border-border/70 bg-background/80 backdrop-blur-xl">
      <div className="flex items-center gap-3 sm:gap-5 h-16 px-4 sm:px-6 max-w-[1600px] mx-auto">
        <NavLink href="/" className="flex items-center gap-2.5 shrink-0 group">
          <Logo className="h-9 w-9 text-primary drop-shadow-[0_0_12px_rgba(34,211,238,0.5)] transition-transform group-hover:scale-105" />
          <div className="hidden sm:block leading-tight">
            <div className="font-display font-bold text-[15px] tracking-tight">
              OR<span className="text-primary">/</span>EXPLORER
            </div>
            <div className="font-mono text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
              {t("tagline")}
            </div>
          </div>
        </NavLink>

        <nav className="flex items-center gap-1 ml-auto">
          {nav.map(n => {
            const active = loc === n.href;
            const Icon = n.icon;
            return (
              <NavLink
                key={n.href}
                href={n.href}
                className={`relative flex items-center gap-1.5 px-2.5 sm:px-3.5 h-9 rounded-md text-sm font-medium transition-colors ${
                  active
                    ? "text-primary bg-primary/10"
                    : "text-muted-foreground hover:text-foreground hover:bg-white/[0.04]"
                }`}
              >
                <Icon className="h-4 w-4" />
                <span className="hidden md:inline">{n.label}</span>
              </NavLink>
            );
          })}
        </nav>

        {selected.length > 0 && (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 h-9 rounded-md bg-primary/10 text-primary text-sm font-mono">
            <GitCompare className="h-4 w-4" />
            {selected.length}
          </div>
        )}

        <div className="flex items-center rounded-md border border-border/70 overflow-hidden h-9 shrink-0">
          {(["tr", "en"] as const).map(l => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-2.5 h-full text-xs font-mono font-semibold uppercase transition-colors ${
                lang === l
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {l}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
