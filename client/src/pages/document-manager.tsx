import { Sidebar } from "@/components/Sidebar";
import { Header } from "@/components/Header";
import { DocumentUpload } from "@/components/DocumentUpload";

export default function DocumentManagerPage() {
  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar />
      
      <div className="flex-1 flex flex-col overflow-hidden">
        <Header />
        
        <main className="flex-1 overflow-y-auto p-6">
          <div className="max-w-7xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-bold mb-2">Document Manager</h1>
              <p className="text-muted-foreground">Upload and manage your contract documents</p>
            </div>
            <DocumentUpload />
          </div>
        </main>
      </div>
    </div>
  );
}