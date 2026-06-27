import { ReactNode } from "react";
import TopBar from "@/components/TopBar";
import CompareTray from "@/components/CompareTray";
import ModelDetail from "@/components/ModelDetail";
import { useDataset } from "@/hooks/useDataset";
import { useI18n } from "@/contexts/I18nContext";
import { Loader2 } from "lucide-react";

export default function Layout({
  children,
  padBottom = true,
}: {
  children: ReactNode;
  padBottom?: boolean;
}) {
  const { data, bounds, error, loading } = useDataset();
  const { t } = useI18n();

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />
      <main className={`flex-1 ${padBottom ? "pb-28" : ""}`}>
        {loading && (
          <div className="grid place-items-center min-h-[60vh]">
            <Loader2 className="h-7 w-7 animate-spin text-primary" />
          </div>
        )}
        {error && (
          <div className="grid place-items-center min-h-[60vh] text-destructive font-mono text-sm">
            {error}
          </div>
        )}
        {data && children}
      </main>
      <footer className="border-t border-border/60 py-6 text-center">
        <p className="text-xs text-muted-foreground max-w-2xl mx-auto px-4 leading-relaxed">
          {t("footer_note")}
        </p>
        <p className="mt-2 font-mono text-[11px] text-muted-foreground/60">
          {t("built")}
        </p>
      </footer>
      {data && bounds && <CompareTray data={data} bounds={bounds} />}
      {data && bounds && <ModelDetail data={data} bounds={bounds} />}
    </div>
  );
}
