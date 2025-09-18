import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { ThemeToggle } from "@/components/ThemeToggle";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { ProtectedRoute } from "@/lib/protected-route";
import Dashboard from "@/pages/Dashboard";
import Students from "@/pages/Students";
import Groups from "@/pages/Groups";
import Sessions from "@/pages/Sessions";
import Submissions from "@/pages/Submissions";
import Grading from "@/pages/Grading";
import Analytics from "@/pages/Analytics";
import Settings from "@/pages/Settings";
import { Timetable } from "@/pages/Timetable";
import AuthPage from "@/pages/auth-page";
import NotFound from "@/pages/not-found";
import { Button } from "@/components/ui/button";
import { LogOut, User } from "lucide-react";

function UserInfo() {
  const { user, logoutMutation } = useAuth();
  
  if (!user) return null;
  
  return (
    <div className="flex items-center gap-2 text-sm">
      <User className="h-4 w-4" />
      <span className="text-muted-foreground">
        {user.firstName} {user.lastName}
      </span>
      <Button
        variant="ghost"
        size="sm"
        onClick={() => logoutMutation.mutate()}
        disabled={logoutMutation.isPending}
        data-testid="button-logout"
      >
        <LogOut className="h-4 w-4" />
      </Button>
    </div>
  );
}

function Router() {
  return (
    <Switch>
      <ProtectedRoute path="/" component={Dashboard} />
      <ProtectedRoute path="/students" component={Students} />
      <ProtectedRoute path="/groups" component={Groups} />
      <ProtectedRoute path="/sessions" component={Sessions} />
      <ProtectedRoute path="/submissions" component={Submissions} />
      <ProtectedRoute path="/grading" component={Grading} />
      <ProtectedRoute path="/analytics" component={Analytics} />
      <ProtectedRoute path="/timetable" component={Timetable} />
      <ProtectedRoute path="/settings" component={Settings} />
      <Route path="/auth" component={AuthPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuthenticatedLayout() {
  // Custom sidebar width for better content display
  const style = {
    "--sidebar-width": "16rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex items-center justify-between p-4 border-b bg-card">
            <SidebarTrigger data-testid="button-sidebar-toggle" />
            <div className="flex items-center gap-4">
              <UserInfo />
              <ThemeToggle />
            </div>
          </header>
          <main className="flex-1 overflow-auto p-6">
            <Router />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Switch>
            <Route path="/auth" component={AuthPage} />
            <Route>
              <AuthenticatedLayout />
            </Route>
          </Switch>
          <Toaster />
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
