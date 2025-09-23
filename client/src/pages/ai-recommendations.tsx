import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { AIRecommendations } from "@/components/AIRecommendations";

export default function AIRecommendationsPage() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">AI Recommendations</h1>
              <p className="text-muted-foreground">Get AI-powered insights and suggestions for your contract management</p>
            </div>
            <AIRecommendations />
          </div>
        </main>
      </div>
    </div>
  );
}