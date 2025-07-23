import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Auth from "@/pages/auth";
import Home from "@/pages/home";
import Onboarding from "@/pages/onboarding";
import Profile from "@/pages/profile";
import AddActivity from "@/pages/add-activity";
import SelectActivity from "@/pages/select-activity";
import AddMacros from "@/pages/add-macros";
import Photos from "@/pages/photos";

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary-300 to-lavender-300">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <Switch>
      {!isAuthenticated ? (
        <Route path="/" component={Auth} />
      ) : (
        <>
          {!user?.onboardingCompleted ? (
            <Route path="/" component={Onboarding} />
          ) : (
            <>
              <Route path="/" component={Home} />
              <Route path="/profile" component={Profile} />
              <Route path="/photos" component={Photos} />
              <Route path="/add-activity" component={AddActivity} />
              <Route path="/select-activity" component={SelectActivity} />
              <Route path="/add-macros" component={AddMacros} />
            </>
          )}
        </>
      )}
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
