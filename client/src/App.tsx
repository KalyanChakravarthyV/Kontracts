import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import SuperTokens from "supertokens-auth-react";
import { AuthWrapper } from "@/components/auth/AuthWrapper";
import { SuperTokensConfig } from "./supertokens-config";
import NotFound from "@/pages/not-found";
import Dashboard from "@/pages/dashboard";
import DocumentManager from "@/pages/document-manager";
import ASC842Schedules from "@/pages/asc842-schedules";
import IFRS16Compliance from "@/pages/ifrs16-compliance";
import JournalEntries from "@/pages/journal-entries";
import AccountSettings from "@/pages/account-settings";
import AIRecommendations from "@/pages/ai-recommendations";
import Auth from "@/pages/auth";

// Initialize SuperTokens
SuperTokens.init(SuperTokensConfig);

function Router() {
  return (
    <Switch>
      <Route path="/auth" component={Auth} />
      <Route path="/auth/*" component={Auth} />
      <Route path="/" component={Dashboard} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/ai-recommendations" component={AIRecommendations} />
      <Route path="/document-manager" component={DocumentManager} />
      <Route path="/asc842-schedules" component={ASC842Schedules} />
      <Route path="/ifrs16-compliance" component={IFRS16Compliance} />
      <Route path="/journal-entries" component={JournalEntries} />
      <Route path="/account-settings" component={AccountSettings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <AuthWrapper>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <Toaster />
          <Router />
        </TooltipProvider>
      </QueryClientProvider>
    </AuthWrapper>
  );
}

export default App;
