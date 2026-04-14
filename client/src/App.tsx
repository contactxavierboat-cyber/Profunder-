import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/store";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import SMBPage from "@/pages/smb";
import CreatorsPage from "@/pages/creators";
import LoginPage from "@/pages/login";
import AdminPage from "@/pages/admin";
import SubscriptionPage from "@/pages/subscription";
import PrivacyPage from "@/pages/privacy";
import TermsPage from "@/pages/terms";
import StudentRefundsPage from "@/pages/student-refunds";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/smb" component={SMBPage} />
      <Route path="/creators" component={CreatorsPage} />
      <Route path="/student-refunds" component={StudentRefundsPage} />
      <Route path="/login" component={LoginPage} />
      <Route path="/privacy" component={PrivacyPage} />
      <Route path="/terms" component={TermsPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/users" component={AdminPage} />
      <Route path="/subscription" component={SubscriptionPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
