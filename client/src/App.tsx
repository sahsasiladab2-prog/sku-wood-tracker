import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ProjectProvider } from "./contexts/ProjectContext";
import { CustomDataProvider } from "./contexts/CustomDataContext";
import Home from "./pages/Home";
import Calculator from "./pages/Calculator";
import Tracker from "./pages/Tracker";
import Compare from "./pages/Compare";
import FactoryDashboard from "./pages/FactoryDashboard";
import Production from "./pages/Production";
import InventoryPage from "./pages/InventoryPage";
import Workers from "./pages/Workers";
import MainLayout from "./components/MainLayout";
function Router() {
  // make sure to consider if you need authentication for certain routes
  return (
    <MainLayout>
      <Switch>
        <Route path={"/"} component={FactoryDashboard} />
        <Route path={"/dashboard"} component={Home} />
        <Route path={"/calculator"} component={Calculator} />
        <Route path={"/tracker"} component={Tracker} />
        <Route path={"/compare"} component={Compare} />
        <Route path={"/production"} component={Production} />
        <Route path={"/inventory"} component={InventoryPage} />
        <Route path={"/workers"} component={Workers} />
        <Route path={"/404"} component={NotFound} />
        {/* Final fallback route */}
        <Route component={NotFound} />
      </Switch>
    </MainLayout>
  );
}

// NOTE: About Theme
// - First choose a default theme according to your design style (dark or light bg), than change color palette in index.css
//   to keep consistent foreground/background color across components
// - If you want to make theme switchable, pass `switchable` ThemeProvider and use `useTheme` hook

function App() {
  return (
    <ErrorBoundary>
      <ProjectProvider>
        <CustomDataProvider>
      <ThemeProvider
        defaultTheme="light"
        // switchable
      >
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </CustomDataProvider>
      </ProjectProvider>
    </ErrorBoundary>
  );
}

export default App;
