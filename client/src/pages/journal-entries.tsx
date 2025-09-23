import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { ContractManagement } from "@/components/ContractManagement";

export default function JournalEntriesPage() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Journal Entries</h1>
              <p className="text-muted-foreground">View and manage automated journal entries for your contracts</p>
            </div>
            {/* Pass initial tab to show journal entries */}
            <ContractManagement initialTab="journals" />
          </div>
        </main>
      </div>
    </div>
  );
}