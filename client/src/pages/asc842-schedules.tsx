import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ContractManagement } from "@/components/ContractManagement";

export default function ASC842SchedulesPage() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">ASC 842 Schedules</h1>
              <p className="text-muted-foreground">Generate and manage ASC 842 compliance schedules for lease accounting</p>
            </div>
            {/* Pass initial tab to show ASC 842 schedules */}
            <ContractManagement initialTab="asc842" />
          </div>
        </main>
      </div>
    </div>
  );
}