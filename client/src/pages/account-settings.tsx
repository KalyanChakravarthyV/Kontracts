import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";

export default function AccountSettingsPage() {
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
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}