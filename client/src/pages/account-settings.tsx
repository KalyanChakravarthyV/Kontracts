import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";

export default function AccountSettingsPage() {
  const queryClient = useQueryClient();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout");
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/auth";
    },
    onError: (error) => {
      console.error("Logout failed:", error);
      queryClient.clear();
      window.location.href = "/auth";
    }
  });

  const logoutAllMutation = useMutation({
    mutationFn: async () => {
      await apiRequest("POST", "/api/auth/logout-all");
    },
    onSuccess: () => {
      queryClient.clear();
      window.location.href = "/auth";
    },
    onError: (error) => {
      console.error("Logout all failed:", error);
      queryClient.clear();
      window.location.href = "/auth";
    }
  });

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  const handleLogoutAll = () => {
    if (confirm("This will log you out of all devices. Are you sure?")) {
      logoutAllMutation.mutate();
    }
  };

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Account Settings</h1>
              <p className="text-muted-foreground">Manage your account preferences and settings</p>
            </div>
            
            <div className="grid gap-6">
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Profile Information</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Name</label>
                    <p className="text-base">Jane Doe</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Role</label>
                    <p className="text-base">Contract Administrator</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Email</label>
                    <p className="text-base">jane.doe@example.com</p>
                  </div>
                </div>
              </div>
              
              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Preferences</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Default Currency</label>
                    <p className="text-base">USD ($)</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Date Format</label>
                    <p className="text-base">MM/DD/YYYY</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Timezone</label>
                    <p className="text-base">Eastern Time (UTC-5)</p>
                  </div>
                </div>
              </div>

              <div className="bg-card border rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-4">Security</h3>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Session Management</label>
                    <p className="text-sm text-muted-foreground mb-3">Manage your active sessions across devices</p>
                    <div className="flex gap-3">
                      <button
                        onClick={handleLogout}
                        disabled={logoutMutation.isPending}
                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md hover:bg-secondary/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {logoutMutation.isPending ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          <i className="fas fa-sign-out-alt"></i>
                        )}
                        Logout This Device
                      </button>
                      <button
                        onClick={handleLogoutAll}
                        disabled={logoutAllMutation.isPending}
                        className="px-4 py-2 bg-destructive text-destructive-foreground rounded-md hover:bg-destructive/80 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                      >
                        {logoutAllMutation.isPending ? (
                          <i className="fas fa-spinner fa-spin"></i>
                        ) : (
                          <i className="fas fa-power-off"></i>
                        )}
                        Logout All Devices
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}