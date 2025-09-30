import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Link, useLocation } from "wouter";
import { apiRequest } from "@/lib/queryClient";

export function Sidebar() {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [location] = useLocation();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ["/api/user/profile"],
  });

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear();
      // Redirect to login page or refresh
      window.location.href = "/auth";
    },
    onError: (error) => {
      console.error("Logout failed:", error);
      // Even if logout fails on server, clear local cache and redirect
      queryClient.clear();
      window.location.href = "/auth";
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className={`bg-card border-r border-border flex flex-col shadow-lg transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-64'}`}>
      {/* Logo and Brand */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="bg-primary text-primary-foreground rounded-lg p-2">
              <i className="fas fa-file-contract text-xl"></i>
            </div>
            {!isCollapsed && (
              <div>
                <h1 className="font-bold text-lg">Kontracts</h1>
                <p className="text-sm text-muted-foreground">Pro Platform</p>
              </div>
            )}
          </div>
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="text-muted-foreground hover:text-foreground p-1 rounded-md hover:bg-accent transition-colors"
            data-testid="button-toggle-sidebar"
          >
            {isCollapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        <div className="space-y-1">
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Main
            </h3>
          )}
          <Link 
            href="/" 
            className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
              location === '/' 
                ? 'bg-accent text-accent-foreground font-medium' 
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
            data-testid="link-dashboard"
            title={isCollapsed ? "Dashboard" : ""}
          >
            <i className="fas fa-chart-pie w-5"></i>
            {!isCollapsed && <span>Dashboard</span>}
          </Link>
          <Link 
            href="/ai-recommendations" 
            className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
              location === '/ai-recommendations' 
                ? 'bg-accent text-accent-foreground font-medium' 
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
            data-testid="link-ai-recommendations"
            title={isCollapsed ? "AI Recommendations" : ""}
          >
            <i className="fas fa-robot w-5"></i>
            {!isCollapsed && <span>AI Recommendations</span>}
          </Link>
        </div>

        <div className="space-y-1 pt-4">
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Contracts
            </h3>
          )}
          <Link 
            href="/document-manager" 
            className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
              location === '/document-manager' 
                ? 'bg-accent text-accent-foreground font-medium' 
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
            data-testid="link-document-manager"
            title={isCollapsed ? "Document Manager" : ""}
          >
            <i className="fas fa-file-contract w-5"></i>
            {!isCollapsed && <span>Document Manager</span>}
          </Link>
          <Link 
            href="/asc842-schedules" 
            className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
              location === '/asc842-schedules' 
                ? 'bg-accent text-accent-foreground font-medium' 
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
            data-testid="link-asc842"
            title={isCollapsed ? "ASC 842 Schedules" : ""}
          >
            <i className="fas fa-calculator w-5"></i>
            {!isCollapsed && <span>ASC 842 Schedules</span>}
          </Link>
          <Link 
            href="/ifrs16-compliance" 
            className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
              location === '/ifrs16-compliance' 
                ? 'bg-accent text-accent-foreground font-medium' 
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
            data-testid="link-ifrs16"
            title={isCollapsed ? "IFRS 16 Compliance" : ""}
          >
            <i className="fas fa-chart-line w-5"></i>
            {!isCollapsed && <span>IFRS 16 Compliance</span>}
          </Link>
          <Link 
            href="/journal-entries" 
            className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
              location === '/journal-entries' 
                ? 'bg-accent text-accent-foreground font-medium' 
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
            data-testid="link-journal-entries"
            title={isCollapsed ? "Journal Entries" : ""}
          >
            <i className="fas fa-book w-5"></i>
            {!isCollapsed && <span>Journal Entries</span>}
          </Link>
        </div>

        <div className="space-y-1 pt-4">
          {!isCollapsed && (
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
              Settings
            </h3>
          )}
          <Link 
            href="/account-settings" 
            className={`flex items-center space-x-3 px-3 py-2 rounded-md transition-colors ${
              location === '/account-settings' 
                ? 'bg-accent text-accent-foreground font-medium' 
                : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
            }`}
            data-testid="link-settings"
            title={isCollapsed ? "Account Settings" : ""}
          >
            <i className="fas fa-cog w-5"></i>
            {!isCollapsed && <span>Account Settings</span>}
          </Link>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center font-semibold">
            <span data-testid="text-user-initials">
              {(user as any)?.name ? getInitials((user as any).name) : "JD"}
            </span>
          </div>
          {!isCollapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate" data-testid="text-user-name">
                {(user as any)?.name || "Jane Doe"}
              </p>
              <p className="text-xs text-muted-foreground truncate" data-testid="text-user-role">
                {(user as any)?.role || "Contract Administrator"}
              </p>
            </div>
          )}
          <button
            onClick={handleLogout}
            disabled={logoutMutation.isPending}
            className="text-muted-foreground hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            data-testid="button-logout"
            title={isCollapsed ? "Logout" : ""}
          >
            {logoutMutation.isPending ? (
              <i className="fas fa-spinner fa-spin"></i>
            ) : (
              <i className="fas fa-sign-out-alt"></i>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
