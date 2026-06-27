import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { I18nProvider } from "./contexts/I18nContext";
import { AppStateProvider } from "./contexts/AppState";
import Home from "./pages/Home";
import Categories from "./pages/Categories";
import Advisor from "./pages/Advisor";
import Costs from "./pages/Costs";
import Versus from "./pages/Versus";

// Pareto haritası recharts içerir → yalnızca o sayfaya girilince yüklenir.
const Landscape = lazy(() => import("./pages/Landscape"));

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/categories" component={Categories} />
      <Route path="/advisor" component={Advisor} />
      <Route path="/costs" component={Costs} />
      <Route path="/vs" component={Versus} />
      <Route path="/landscape">
        <Suspense
          fallback={
            <div className="grid place-items-center min-h-[60vh]">
              <Loader2 className="h-7 w-7 animate-spin text-primary" />
            </div>
          }
        >
          <Landscape />
        </Suspense>
      </Route>
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <I18nProvider>
          <AppStateProvider>
            <TooltipProvider delayDuration={150}>
              <Toaster />
              <Router />
            </TooltipProvider>
          </AppStateProvider>
        </I18nProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
