import { Switch, Route } from "wouter";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "./lib/queryClient";
import { Toaster } from "@/components/ui/toaster";
import { StoreProvider } from "@/lib/store";
import { Layout } from "@/components/layout/Sidebar";

import DashboardPage from "@/pages/dashboard";
import InventoryPage from "@/pages/inventory";
import POSPage from "@/pages/pos";
import KitchenPage from "@/pages/kitchen";
import AnalyticsPage from "@/pages/analytics";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={DashboardPage} />
        <Route path="/inventory" component={InventoryPage} />
        <Route path="/pos" component={POSPage} />
        <Route path="/kitchen" component={KitchenPage} />
        <Route path="/analytics" component={AnalyticsPage} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <StoreProvider>
        <Router />
        <Toaster />
      </StoreProvider>
    </QueryClientProvider>
  );
}

export default App;
