import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient.js";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster.jsx";
import { AuthProvider } from "./hooks/use-auth.jsx";
import { ProtectedRoute } from "./lib/protected-route.jsx";
import HomePage from "@/pages/home-page.jsx";
import AuthPage from "@/pages/auth-page.jsx";
import ProfilePage from "@/pages/profile-page.jsx";
import MyPropertiesPage from "@/pages/my-properties-page.jsx";
import NotFound from "@/pages/not-found.jsx";

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={HomePage} />
      <ProtectedRoute path="/profile" component={ProfilePage} />
      <ProtectedRoute path="/my-properties" component={MyPropertiesPage} />
      <Route path="/auth" component={AuthPage} />
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
