import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { ScrollToTop } from "@/components/scroll-to-top";
import { PWAInstallPrompt } from "@/components/ui/pwa-install-prompt";
import { useAuth } from "@/hooks/useAuth";
import NotFound from "@/pages/not-found";
import Auth from "@/pages/auth";
import Landing from "@/pages/landing";
import BlogFeed from "@/pages/blog-feed";
import BlogPostView from "@/pages/blog-post";
import Login from "@/pages/login";
import Register from "@/pages/register";
import Home from "@/pages/home";
import Onboarding from "@/pages/onboarding";
import Profile from "@/pages/profile";
import EditProfile from "@/pages/edit-profile";
import Feedback from "@/pages/feedback";
import AddActivity from "@/pages/add-activity";
import SelectActivity from "@/pages/select-activity";
import AddMacros from "@/pages/add-macros";
import AddMetric from "@/pages/add-metric";
import Photos from "@/pages/photos";
import Progress from "@/pages/progress";
import Goals from "@/pages/goals";
import AddGoal from "@/pages/add-goal";
import Workouts from "@/pages/workouts";
import Nutrition from "@/pages/nutrition";
import Sleep from "@/pages/sleep";
import ForgotPassword from "@/pages/forgot-password"; 
import ResetPassword from "@/pages/reset-password";
import ResetPasswordToken from "@/pages/reset-password-token";
import JournalEntry from "@/pages/journal-entry";
import JournalHistory from "@/pages/journal-history";
import SubscriptionSuccess from "@/pages/subscription-success";
import PrivacyPolicy from "@/pages/privacy-policy";
import TermsOfService from "@/pages/terms-of-service";
import PublicFeedback from "@/pages/public-feedback";
// import Template from "@/pages/template"; // Uncomment when creating new pages
// import YourNewPage from "@/pages/your-new-page"; // Example: replace with actual page name

// Utility function to detect PWA mode
function isPWAMode(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches ||
         window.matchMedia('(display-mode: window-controls-overlay)').matches ||
         (window.navigator as any).standalone === true;
}

function Router() {
  const { user, isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="app-gradient-bg flex items-center justify-center">
        <div className="text-white text-xl">Loading...</div>
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      <Switch>
        {/* Public routes - accessible to everyone */}
        <Route path="/forgot-password" component={ForgotPassword} />
        <Route path="/reset-password" component={ResetPasswordToken} />
        <Route path="/blog-post" component={BlogPostView} />
        <Route path="/privacy-policy" component={PrivacyPolicy} />
        <Route path="/terms-of-service" component={TermsOfService} />
        <Route path="/login" component={Login} />
        <Route path="/register" component={Register} />
        <Route path="/public-feedback" component={PublicFeedback} />
        
        {!isAuthenticated ? (
          <>
            {/* Landing page for browser users, Auth for PWA */}
            <Route path="/" component={isPWAMode() ? Auth : Landing} />
            {/* Redirect all other routes to auth page for unauthenticated users */}
            <Route path="/:path*" component={Auth} />
          </>
        ) : (
          <>
            {!user?.onboardingCompleted ? (
              <Route path="/" component={Onboarding} />
            ) : (
              <>
                <Route path="/" component={Home} />
                <Route path="/home" component={Home} />
                <Route path="/blog-feed" component={BlogFeed} />
                <Route path="/profile" component={Profile} />
                <Route path="/edit-profile" component={EditProfile} />
                <Route path="/feedback" component={Feedback} />
                <Route path="/photos" component={Photos} />
                <Route path="/progress" component={Progress} />
                <Route path="/goals" component={Goals} />
                <Route path="/add-goal" component={AddGoal} />
                <Route path="/workouts" component={Workouts} />
                <Route path="/nutrition" component={Nutrition} />
                <Route path="/sleep" component={Sleep} />
                <Route path="/add-activity" component={AddActivity} />
                <Route path="/select-activity" component={SelectActivity} />
                <Route path="/add-macros" component={AddMacros} />
                <Route path="/add-metric" component={AddMetric} />
                <Route path="/change-password" component={ResetPassword} />
                <Route path="/journal-entry" component={JournalEntry} />
                <Route path="/journal-history" component={JournalHistory} />
                <Route path="/subscription/success" component={SubscriptionSuccess} />
                {/* <Route path="/template" component={Template} /> */} {/* Uncomment when using template */}
                {/* <Route path="/your-route" component={YourNewPage} /> */} {/* Example: replace with actual route and component */}
              </>
            )}
          </>
        )}
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <PWAInstallPrompt />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
