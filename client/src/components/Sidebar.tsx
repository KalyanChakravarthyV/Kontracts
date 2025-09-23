import { useQuery } from "@tanstack/react-query";

export function Sidebar() {
  const { data: user } = useQuery({
    queryKey: ["/api/user/profile"],
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase();
  };

  return (
    <div className="bg-card border-r border-border w-64 flex flex-col shadow-lg">
      {/* Logo and Brand */}
      <div className="p-6 border-b border-border">
        <div className="flex items-center space-x-3">
          <div className="bg-primary text-primary-foreground rounded-lg p-2">
            <i className="fas fa-paw text-xl"></i>
          </div>
          <div>
            <h1 className="font-bold text-lg">TravelContract</h1>
            <p className="text-sm text-muted-foreground">Pro Platform</p>
          </div>
        </div>
      </div>

      {/* Navigation Menu */}
      <nav className="flex-1 p-4 space-y-2">
        <div className="space-y-1">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Main
          </h3>
          <a 
            href="#" 
            className="flex items-center space-x-3 px-3 py-2 rounded-md bg-accent text-accent-foreground font-medium"
            data-testid="link-dashboard"
          >
            <i className="fas fa-chart-pie w-5"></i>
            <span>Dashboard</span>
          </a>
          <a 
            href="#" 
            className="flex items-center space-x-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            data-testid="link-ai-recommendations"
          >
            <i className="fas fa-robot w-5"></i>
            <span>AI Recommendations</span>
          </a>
        </div>

        <div className="space-y-1 pt-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Contracts
          </h3>
          <a 
            href="#" 
            className="flex items-center space-x-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            data-testid="link-document-manager"
          >
            <i className="fas fa-file-contract w-5"></i>
            <span>Document Manager</span>
          </a>
          <a 
            href="#" 
            className="flex items-center space-x-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            data-testid="link-asc842"
          >
            <i className="fas fa-calculator w-5"></i>
            <span>ASC 842 Schedules</span>
          </a>
          <a 
            href="#" 
            className="flex items-center space-x-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            data-testid="link-ifrs16"
          >
            <i className="fas fa-chart-line w-5"></i>
            <span>IFRS 16 Compliance</span>
          </a>
          <a 
            href="#" 
            className="flex items-center space-x-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            data-testid="link-journal-entries"
          >
            <i className="fas fa-book w-5"></i>
            <span>Journal Entries</span>
          </a>
        </div>

        <div className="space-y-1 pt-4">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
            Settings
          </h3>
          <a 
            href="#" 
            className="flex items-center space-x-3 px-3 py-2 rounded-md text-muted-foreground hover:bg-accent hover:text-accent-foreground transition-colors"
            data-testid="link-settings"
          >
            <i className="fas fa-cog w-5"></i>
            <span>Account Settings</span>
          </a>
        </div>
      </nav>

      {/* User Profile */}
      <div className="p-4 border-t border-border">
        <div className="flex items-center space-x-3">
          <div className="bg-primary text-primary-foreground rounded-full w-10 h-10 flex items-center justify-center font-semibold">
            <span data-testid="text-user-initials">
              {user ? getInitials(user.name) : "JD"}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium truncate" data-testid="text-user-name">
              {user?.name || "Jane Doe"}
            </p>
            <p className="text-xs text-muted-foreground truncate" data-testid="text-user-role">
              {user?.role || "Contract Administrator"}
            </p>
          </div>
          <button 
            className="text-muted-foreground hover:text-foreground"
            data-testid="button-logout"
          >
            <i className="fas fa-sign-out-alt"></i>
          </button>
        </div>
      </div>
    </div>
  );
}
