import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function ContractManagement() {
  const [activeTab, setActiveTab] = useState("contracts");
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: contracts, isLoading: contractsLoading } = useQuery({
    queryKey: ["/api/contracts"],
  });

  const complianceScheduleMutation = useMutation({
    mutationFn: async ({ contractId, type, data }: { contractId: string; type: string; data: any }) => {
      return await apiRequest("POST", `/api/contracts/${contractId}/compliance/${type}`, data);
    },
    onSuccess: () => {
      toast({
        title: "Compliance schedule generated",
        description: "The schedule has been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate schedule",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const journalEntryMutation = useMutation({
    mutationFn: async ({ contractId, scheduleType }: { contractId: string; scheduleType: string }) => {
      return await apiRequest("POST", `/api/contracts/${contractId}/journal-entries`, { scheduleType });
    },
    onSuccess: () => {
      toast({
        title: "Journal entries generated",
        description: "The entries have been created successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Failed to generate entries",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleGenerateSchedule = async (contractId: string, type: 'ASC842' | 'IFRS16') => {
    const data = {
      discountRate: 0.05,
      leaseTerm: 5,
    };
    
    complianceScheduleMutation.mutate({ contractId, type, data });
  };

  const handleGenerateJournal = async (contractId: string, scheduleType: string) => {
    journalEntryMutation.mutate({ contractId, scheduleType });
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-600';
      case 'renewal due':
        return 'bg-amber-100 text-amber-600';
      case 'expired':
        return 'bg-red-100 text-red-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type.toLowerCase()) {
      case 'real estate':
        return 'bg-blue-100 text-blue-600';
      case 'equipment':
        return 'bg-purple-100 text-purple-600';
      case 'software':
        return 'bg-green-100 text-green-600';
      default:
        return 'bg-gray-100 text-gray-600';
    }
  };

  const tabs = [
    { id: "contracts", label: "Active Contracts" },
    { id: "payments", label: "Payment Schedule" },
    { id: "asc842", label: "ASC 842 Schedules" },
    { id: "ifrs16", label: "IFRS 16 Compliance" },
    { id: "journal", label: "Journal Entries" },
  ];

  return (
    <div className="mt-8 bg-card rounded-lg border border-border shadow-sm">
      <div className="p-6 border-b border-border">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-lg font-semibold mb-2">Contract Administration Dashboard</h3>
            <p className="text-sm text-muted-foreground">
              Manage contracts, track payments, and ensure compliance
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <button 
              className="px-3 py-1 text-sm border border-border rounded-md hover:bg-accent transition-colors"
              data-testid="button-filter"
            >
              <i className="fas fa-filter mr-2"></i>Filter
            </button>
            <button 
              className="px-3 py-1 text-sm border border-border rounded-md hover:bg-accent transition-colors"
              data-testid="button-export"
            >
              <i className="fas fa-download mr-2"></i>Export
            </button>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Tabs */}
        <div className="border-b border-border mb-6">
          <nav className="flex space-x-8">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-2 px-1 border-b-2 text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? "border-primary text-primary"
                    : "border-transparent text-muted-foreground hover:text-foreground"
                }`}
                data-testid={`tab-${tab.id}`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>

        {/* Contract Table */}
        {activeTab === "contracts" && (
          <div className="overflow-x-auto">
            {contractsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse flex items-center space-x-4 py-4">
                    <div className="h-4 bg-muted rounded flex-1"></div>
                    <div className="h-4 bg-muted rounded w-20"></div>
                    <div className="h-4 bg-muted rounded w-24"></div>
                    <div className="h-4 bg-muted rounded w-16"></div>
                  </div>
                ))}
              </div>
            ) : (
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Contract</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Type</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Payment Terms</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Next Payment</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Amount</th>
                    <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                    <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {contracts && contracts.length > 0 ? (
                    contracts.map((contract: any) => (
                      <tr 
                        key={contract.id}
                        className="border-b border-border hover:bg-muted/50 transition-colors"
                        data-testid={`contract-row-${contract.id}`}
                      >
                        <td className="py-4 px-4">
                          <div>
                            <p className="font-medium" data-testid={`text-contract-name-${contract.id}`}>
                              {contract.name}
                            </p>
                            <p className="text-xs text-muted-foreground" data-testid={`text-vendor-${contract.id}`}>
                              {contract.vendor}
                            </p>
                          </div>
                        </td>
                        <td className="py-4 px-4">
                          <span 
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeBadge(contract.type)}`}
                            data-testid={`badge-type-${contract.id}`}
                          >
                            {contract.type}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-muted-foreground" data-testid={`text-payment-terms-${contract.id}`}>
                          {contract.paymentTerms}
                        </td>
                        <td className="py-4 px-4 text-muted-foreground" data-testid={`text-next-payment-${contract.id}`}>
                          {new Date(contract.nextPayment).toLocaleDateString()}
                        </td>
                        <td className="py-4 px-4 font-medium" data-testid={`text-amount-${contract.id}`}>
                          ${parseFloat(contract.amount).toLocaleString()}
                        </td>
                        <td className="py-4 px-4">
                          <span 
                            className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusBadge(contract.status)}`}
                            data-testid={`badge-status-${contract.id}`}
                          >
                            {contract.status}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex items-center justify-end space-x-2">
                            <button 
                              className="text-muted-foreground hover:text-foreground p-1"
                              data-testid={`button-view-${contract.id}`}
                            >
                              <i className="fas fa-eye"></i>
                            </button>
                            <button 
                              className="text-muted-foreground hover:text-foreground p-1"
                              data-testid={`button-edit-${contract.id}`}
                            >
                              <i className="fas fa-edit"></i>
                            </button>
                            <button 
                              onClick={() => handleGenerateSchedule(contract.id, 'ASC842')}
                              className="text-muted-foreground hover:text-foreground p-1"
                              disabled={complianceScheduleMutation.isPending}
                              data-testid={`button-schedule-${contract.id}`}
                            >
                              <i className="fas fa-calculator"></i>
                            </button>
                            <button 
                              onClick={() => handleGenerateJournal(contract.id, 'ASC842')}
                              className="text-muted-foreground hover:text-foreground p-1"
                              disabled={journalEntryMutation.isPending}
                              data-testid={`button-journal-${contract.id}`}
                            >
                              <i className="fas fa-book"></i>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-muted-foreground">
                        <div className="flex flex-col items-center">
                          <div className="bg-muted rounded-full w-16 h-16 flex items-center justify-center mb-4">
                            <i className="fas fa-file-contract text-2xl"></i>
                          </div>
                          <p className="text-lg font-medium mb-2">No contracts found</p>
                          <p className="text-sm">Upload contract documents to get started</p>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            )}

            {/* Pagination */}
            {contracts && contracts.length > 0 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-muted-foreground">
                  Showing 1 to {contracts.length} of {contracts.length} results
                </p>
                <div className="flex items-center space-x-2">
                  <button 
                    className="px-3 py-1 text-sm border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
                    disabled
                    data-testid="button-prev-page"
                  >
                    Previous
                  </button>
                  <button 
                    className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md"
                    data-testid="button-current-page"
                  >
                    1
                  </button>
                  <button 
                    className="px-3 py-1 text-sm border border-border rounded-md hover:bg-accent transition-colors disabled:opacity-50"
                    disabled
                    data-testid="button-next-page"
                  >
                    Next
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Other tab content */}
        {activeTab !== "contracts" && (
          <div className="text-center py-12 text-muted-foreground">
            <div className="bg-muted rounded-full w-16 h-16 mx-auto flex items-center justify-center mb-4">
              <i className="fas fa-cog text-2xl"></i>
            </div>
            <p className="text-lg font-medium mb-2">Coming Soon</p>
            <p className="text-sm">
              {activeTab === "payments" && "Payment schedule management features"}
              {activeTab === "asc842" && "ASC 842 compliance schedules"}
              {activeTab === "ifrs16" && "IFRS 16 compliance tracking"}
              {activeTab === "journal" && "Journal entry management"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
