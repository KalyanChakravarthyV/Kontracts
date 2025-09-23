import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ContractManagement } from "@/components/ContractManagement";

export default function IFRS16CompliancePage() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">IFRS 16 Compliance</h1>
              <p className="text-muted-foreground">Generate and manage IFRS 16 compliance schedules for international lease accounting</p>
            </div>
            {/* Pass initial tab to show IFRS 16 compliance */}
            <ContractManagement initialTab="ifrs16" />
          </div>
        </main>
      </div>
    </div>
  );
}