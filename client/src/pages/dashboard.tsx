import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { StatsCards } from "@/components/StatsCards";
import { DocumentUpload } from "@/components/DocumentUpload";
import { AIRecommendations } from "@/components/AIRecommendations";
import { ContractManagement } from "@/components/ContractManagement";
import { PetFriendlyTravel } from "@/components/PetFriendlyTravel";

export default function Dashboard() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <StatsCards />
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            <DocumentUpload />
            <AIRecommendations />
          </div>
          
          <ContractManagement />
          
          <PetFriendlyTravel />
        </main>
      </div>
    </div>
  );
}
