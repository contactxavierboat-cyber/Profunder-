import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/store";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import DashboardPage from "@/pages/dashboard";
import AdminPage from "@/pages/admin";
import SubscriptionPage from "@/pages/subscription";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/users" component={AdminPage} />
      <Route path="/subscription" component={SubscriptionPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function SiliconValleyMesh() {
  return (
    <div className="sv-mesh-bg" aria-hidden="true">
      <div className="sv-blob sv-blob-1" />
      <div className="sv-blob sv-blob-2" />
      <div className="sv-blob sv-blob-3" />
      <div className="sv-blob sv-blob-4" />
      <div className="sv-blob sv-blob-5" />
      <div className="sv-mesh-grid" />
    </div>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <SiliconValleyMesh />
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
