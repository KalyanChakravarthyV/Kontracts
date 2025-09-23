import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export function ContractManagement() {
  const [activeTab, setActiveTab] = useState("contracts");
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [scheduleParams, setScheduleParams] = useState({
    discountRate: 0.05,
    leaseTerm: 5,
    annualPayment: 0
  });
  const [showScheduleForm, setShowScheduleForm] = useState(false);
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
        description: "The schedule and payment records have been created successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/contracts"] });
      queryClient.invalidateQueries({ queryKey: ["/api/compliance-schedules"] });
      queryClient.invalidateQueries({ queryKey: ["/api/payments"] });
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
      queryClient.invalidateQueries({ queryKey: ["/api/journal-entries"] });
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
    const contract = contracts?.find((c: any) => c.id === contractId);
    const contractAmount = contract ? parseFloat(contract.amount) : 100000;
    
    const data = {
      discountRate: 0.05,
      leaseTerm: 5,
      annualPayment: contractAmount / 5, // Default annual payment based on contract amount
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

  // Payment Schedule View Component
  function PaymentScheduleView({ contracts }: { contracts: any[] }) {
    const { data: payments, isLoading: paymentsLoading } = useQuery({
      queryKey: ['/api/payments'],
    });

    const markPaidMutation = useMutation({
      mutationFn: async (paymentId: string) => {
        return await apiRequest('POST', `/api/payments/${paymentId}/mark-paid`, {});
      },
      onSuccess: () => {
        toast({
          title: 'Payment marked as paid',
          description: 'The payment status has been updated.',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
      },
      onError: (error: any) => {
        toast({
          title: 'Failed to mark payment',
          description: error.message,
          variant: 'destructive',
        });
      },
    });

    // Get contract info for display
    const enrichedPayments = payments?.map((payment: any) => {
      const contract = contracts?.find((c: any) => c.id === payment.contractId);
      return {
        ...payment,
        contractName: contract?.name || 'Unknown Contract',
        vendor: contract?.vendor || 'Unknown Vendor',
        dueDate: new Date(payment.dueDate)
      };
    }) || [];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold">Upcoming Payments</h4>
          <div className="flex space-x-2">
            <button className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90" data-testid="button-export-payments">
              <i className="fas fa-download mr-2"></i>Export Schedule
            </button>
            <button className="px-3 py-1 text-sm border border-border rounded-md hover:bg-accent" data-testid="button-filter-payments">
              <i className="fas fa-filter mr-2"></i>Filter
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-accent/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Total Due This Month</p>
                <p className="text-2xl font-bold" data-testid="text-total-due-month">
                  ${enrichedPayments.filter(p => {
                    const now = new Date();
                    return p.dueDate.getMonth() === now.getMonth() && 
                           p.dueDate.getFullYear() === now.getFullYear() && 
                           p.status !== 'Paid';
                  }).reduce((sum, p) => sum + parseFloat(p.amount), 0).toLocaleString()}
                </p>
              </div>
              <i className="fas fa-calendar-alt text-2xl text-muted-foreground"></i>
            </div>
          </div>
          <div className="bg-accent/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Overdue Payments</p>
                <p className="text-2xl font-bold text-red-600" data-testid="text-overdue-payments">
                  {enrichedPayments.filter(p => p.dueDate < new Date() && p.status !== 'Paid').length}
                </p>
              </div>
              <i className="fas fa-exclamation-triangle text-2xl text-red-600"></i>
            </div>
          </div>
          <div className="bg-accent/50 rounded-lg p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Next 90 Days</p>
                <p className="text-2xl font-bold" data-testid="text-next-90-days">
                  ${enrichedPayments.filter(p => {
                    const diffTime = p.dueDate.getTime() - new Date().getTime();
                    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                    return diffDays <= 90 && diffDays >= 0 && p.status !== 'Paid';
                  }).reduce((sum, p) => sum + parseFloat(p.amount), 0).toLocaleString()}
                </p>
              </div>
              <i className="fas fa-clock text-2xl text-muted-foreground"></i>
            </div>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Contract</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Vendor</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Due Date</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Amount</th>
                <th className="text-left py-3 px-4 font-medium text-muted-foreground">Status</th>
                <th className="text-right py-3 px-4 font-medium text-muted-foreground">Actions</th>
              </tr>
            </thead>
            <tbody>
              {paymentsLoading ? (
                <tr><td colSpan={6} className="py-8 text-center">Loading payments...</td></tr>
              ) : enrichedPayments.length > 0 ? (
                enrichedPayments.slice(0, 10).map((payment) => (
                  <tr key={payment.id} className="border-b border-border hover:bg-muted/50" data-testid={`payment-row-${payment.id}`}>
                    <td className="py-4 px-4 font-medium" data-testid={`text-payment-contract-${payment.id}`}>{payment.contractName}</td>
                    <td className="py-4 px-4 text-muted-foreground" data-testid={`text-payment-vendor-${payment.id}`}>{payment.vendor}</td>
                    <td className="py-4 px-4" data-testid={`text-payment-due-${payment.id}`}>{payment.dueDate.toLocaleDateString()}</td>
                    <td className="py-4 px-4 font-medium" data-testid={`text-payment-amount-${payment.id}`}>${parseFloat(payment.amount).toLocaleString()}</td>
                    <td className="py-4 px-4">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        payment.status === 'Paid' ? 'bg-green-100 text-green-800' :
                        payment.status === 'Due' ? 'bg-red-100 text-red-800' :
                        payment.status === 'Overdue' ? 'bg-red-200 text-red-900' :
                        'bg-blue-100 text-blue-800'
                      }`} data-testid={`badge-payment-status-${payment.id}`}>
                        {payment.status}
                      </span>
                    </td>
                    <td className="py-4 px-4 text-right">
                      {payment.status !== 'Paid' ? (
                        <button 
                          onClick={() => markPaidMutation.mutate(payment.id)}
                          disabled={markPaidMutation.isPending}
                          className="text-primary hover:text-primary/80 text-sm font-medium disabled:opacity-50" 
                          data-testid={`button-mark-paid-${payment.id}`}
                        >
                          {markPaidMutation.isPending ? 'Updating...' : 'Mark as Paid'}
                        </button>
                      ) : (
                        <span className="text-green-600 text-sm font-medium">Paid</span>
                      )}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-muted-foreground">
                    <div className="flex flex-col items-center">
                      <i className="fas fa-calendar-times text-4xl mb-4"></i>
                      <p className="text-lg font-medium mb-2">No upcoming payments</p>
                      <p className="text-sm">All payments are up to date</p>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  // ASC 842 Schedule View Component
  function ASC842ScheduleView({ 
    contracts, 
    scheduleParams, 
    setScheduleParams, 
    showScheduleForm, 
    setShowScheduleForm, 
    onGenerateSchedule, 
    isGenerating 
  }: any) {
    const [generatedSchedule, setGeneratedSchedule] = useState<any>(null);
    const [selectedContractForSchedule, setSelectedContractForSchedule] = useState<string>('');

    const { data: complianceSchedules } = useQuery({
      queryKey: ['/api/compliance-schedules'],
    });

    const handleGenerateWithParams = async () => {
      if (!selectedContractForSchedule) return;
      
      try {
        const response = await apiRequest('POST', `/api/contracts/${selectedContractForSchedule}/compliance/ASC842`, scheduleParams);
        console.log('ASC 842 Response:', response); // Debug log
        setGeneratedSchedule(response.data);
        setShowScheduleForm(false);
        
        // Query invalidation to refresh all relevant data
        queryClient.invalidateQueries({ queryKey: ['/api/compliance-schedules'] });
        queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
        queryClient.invalidateQueries({ queryKey: ['/api/contracts'] });
        
        toast({
          title: 'ASC 842 Schedule Generated',
          description: `The schedule has been created with ${response.paymentsCreated || 0} payment records.`,
        });
      } catch (error: any) {
        toast({
          title: 'Failed to generate schedule',
          description: error.message,
          variant: 'destructive',
        });
      }
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold">ASC 842 Compliance Schedules</h4>
          <button 
            onClick={() => setShowScheduleForm(!showScheduleForm)}
            className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            data-testid="button-new-asc842-schedule"
          >
            <i className="fas fa-plus mr-2"></i>Generate New Schedule
          </button>
        </div>

        {showScheduleForm && (
          <div className="bg-accent/50 rounded-lg p-6 border border-border">
            <h5 className="text-md font-semibold mb-4">Generate ASC 842 Schedule</h5>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Select Contract</label>
                <select 
                  value={selectedContractForSchedule}
                  onChange={(e) => setSelectedContractForSchedule(e.target.value)}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  data-testid="select-contract-asc842"
                >
                  <option value="">Choose a contract...</option>
                  {contracts?.map((contract: any) => (
                    <option key={contract.id} value={contract.id}>
                      {contract.name} - {contract.vendor}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Discount Rate (%)</label>
                <input 
                  type="number"
                  step="0.01"
                  min="0"
                  max="1"
                  value={scheduleParams.discountRate}
                  onChange={(e) => setScheduleParams({...scheduleParams, discountRate: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  data-testid="input-discount-rate"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Lease Term (Years)</label>
                <input 
                  type="number"
                  min="1"
                  max="50"
                  value={scheduleParams.leaseTerm}
                  onChange={(e) => setScheduleParams({...scheduleParams, leaseTerm: parseInt(e.target.value) || 1})}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  data-testid="input-lease-term"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-2">Annual Payment ($)</label>
                <input 
                  type="number"
                  min="0"
                  value={scheduleParams.annualPayment}
                  onChange={(e) => setScheduleParams({...scheduleParams, annualPayment: parseFloat(e.target.value) || 0})}
                  className="w-full px-3 py-2 border border-border rounded-md bg-background"
                  data-testid="input-annual-payment"
                />
              </div>
            </div>
            <div className="flex space-x-3 mt-4">
              <button 
                onClick={handleGenerateWithParams}
                disabled={!selectedContractForSchedule || isGenerating}
                className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                data-testid="button-generate-asc842"
              >
                {isGenerating ? 'Generating...' : 'Generate Schedule'}
              </button>
              <button 
                onClick={() => setShowScheduleForm(false)}
                className="px-4 py-2 border border-border rounded-md hover:bg-accent"
                data-testid="button-cancel-asc842"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {generatedSchedule && (
          <div className="bg-card rounded-lg border border-border p-6">
            <h5 className="text-md font-semibold mb-4">Generated ASC 842 Schedule</h5>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Period</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Payment Date</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Lease Payment</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Interest Expense</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Principal Payment</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Lease Liability</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">RoU Asset Value</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">RoU Amortization</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Cumulative Amort.</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Short Term Liability</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Long Term Liability</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Interest Amortized</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Accrued Interest</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Prepaid Rent</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedSchedule.map((item: any, index: number) => (
                    <tr key={index} className="border-b border-border">
                      <td className="py-2 px-2 font-medium" data-testid={`asc842-period-${index}`}>{item.period}</td>
                      <td className="py-2 px-2" data-testid={`asc842-date-${index}`}>{item.paymentDate}</td>
                      <td className="py-2 px-2" data-testid={`asc842-payment-${index}`}>${item.leasePayment?.toLocaleString() || '0'}</td>
                      <td className="py-2 px-2" data-testid={`asc842-interest-${index}`}>${item.interestExpense?.toLocaleString() || '0'}</td>
                      <td className="py-2 px-2" data-testid={`asc842-principal-${index}`}>${item.principalPayment?.toLocaleString() || '0'}</td>
                      <td className="py-2 px-2" data-testid={`asc842-liability-${index}`}>${item.leaseLIABILITY?.toLocaleString() || '0'}</td>
                      <td className="py-2 px-2" data-testid={`asc842-rou-value-${index}`}>${item.routAssetValue?.toLocaleString() || '0'}</td>
                      <td className="py-2 px-2" data-testid={`asc842-rou-amort-${index}`}>${item.routAssetAmortization?.toLocaleString() || '0'}</td>
                      <td className="py-2 px-2" data-testid={`asc842-cumul-amort-${index}`}>${item.cumulativeAmortization?.toLocaleString() || '0'}</td>
                      <td className="py-2 px-2" data-testid={`asc842-short-term-${index}`}>${item.shortTermLiability?.toLocaleString() || '0'}</td>
                      <td className="py-2 px-2" data-testid={`asc842-long-term-${index}`}>${item.longTermLiability?.toLocaleString() || '0'}</td>
                      <td className="py-2 px-2" data-testid={`asc842-interest-amort-${index}`}>${item.interestAmortized?.toLocaleString() || '0'}</td>
                      <td className="py-2 px-2" data-testid={`asc842-accrued-${index}`}>${item.accruedInterest?.toLocaleString() || '0'}</td>
                      <td className="py-2 px-2" data-testid={`asc842-prepaid-${index}`}>${item.prepaidRent?.toLocaleString() || '0'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        <div className="bg-card rounded-lg border border-border p-6">
          <h5 className="text-md font-semibold mb-4">Existing ASC 842 Schedules</h5>
          {complianceSchedules && complianceSchedules.length > 0 ? (
            <div className="space-y-4">
              {complianceSchedules.filter((schedule: any) => schedule.type === 'ASC842').map((schedule: any) => (
                <div key={schedule.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Schedule #{schedule.id}</p>
                      <p className="text-sm text-muted-foreground">Created: {new Date(schedule.createdAt || Date.now()).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground">Present Value: ${parseFloat(schedule.presentValue || '0').toLocaleString()}</p>
                    </div>
                    <button className="text-primary hover:text-primary/80 text-sm font-medium" data-testid={`button-view-schedule-${schedule.id}`}>
                      View Details
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <i className="fas fa-file-invoice text-4xl mb-4"></i>
              <p className="text-lg font-medium mb-2">No ASC 842 schedules found</p>
              <p className="text-sm">Generate your first compliance schedule above</p>
            </div>
          )}
        </div>
      </div>
    );
  }

  // IFRS 16 View Component
  function IFRS16View({ contracts, onGenerateSchedule, isGenerating }: any) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold">IFRS 16 Compliance</h4>
        </div>
        
        <div className="bg-accent/50 rounded-lg p-6 border border-border">
          <div className="text-center">
            <i className="fas fa-globe text-4xl text-muted-foreground mb-4"></i>
            <h5 className="text-lg font-semibold mb-2">IFRS 16 Implementation</h5>
            <p className="text-muted-foreground mb-4">
              International Financial Reporting Standards for lease accounting. 
              Similar to ASC 842 but with some key differences in measurement and presentation.
            </p>
            <div className="space-y-3">
              {contracts?.map((contract: any) => (
                <div key={contract.id} className="flex items-center justify-between bg-background rounded-lg p-4">
                  <div>
                    <p className="font-medium">{contract.name}</p>
                    <p className="text-sm text-muted-foreground">{contract.vendor}</p>
                  </div>
                  <button 
                    onClick={() => onGenerateSchedule(contract.id)}
                    disabled={isGenerating}
                    className="px-3 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                    data-testid={`button-ifrs16-${contract.id}`}
                  >
                    Generate IFRS 16
                  </button>
                </div>
              )) || (
                <p className="text-muted-foreground">No contracts available for IFRS 16 compliance</p>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Journal Entries View Component  
  function JournalEntriesView({ contracts, onGenerateJournal, isGenerating }: any) {
    const { data: journalEntries } = useQuery({
      queryKey: ['/api/journal-entries'],
    });

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold">Journal Entries</h4>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90" data-testid="button-export-journal">
            <i className="fas fa-download mr-2"></i>Export Entries
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h5 className="text-md font-semibold mb-4">Generate Journal Entries</h5>
            <div className="space-y-3">
              {contracts?.map((contract: any) => (
                <div key={contract.id} className="flex items-center justify-between border border-border rounded-lg p-3">
                  <div>
                    <p className="font-medium text-sm">{contract.name}</p>
                    <p className="text-xs text-muted-foreground">{contract.vendor} - ${parseFloat(contract.amount).toLocaleString()}</p>
                  </div>
                  <button 
                    onClick={() => onGenerateJournal(contract.id, 'ASC842')}
                    disabled={isGenerating}
                    className="px-3 py-1 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary/90 disabled:opacity-50"
                    data-testid={`button-journal-${contract.id}`}
                  >
                    Generate
                  </button>
                </div>
              )) || (
                <p className="text-muted-foreground text-sm">No contracts available</p>
              )}
            </div>
          </div>

          <div className="bg-card rounded-lg border border-border p-6">
            <h5 className="text-md font-semibold mb-4">Recent Journal Entries</h5>
            {journalEntries && journalEntries.length > 0 ? (
              <div className="space-y-3">
                {journalEntries.slice(0, 5).map((entry: any, index: number) => (
                  <div key={index} className="border border-border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-sm font-medium">{entry.description}</p>
                      <span className="text-xs text-muted-foreground">{new Date(entry.entryDate).toLocaleDateString()}</span>
                    </div>
                    <div className="text-xs text-muted-foreground">
                      <p>Debit: {entry.debitAccount} | Credit: {entry.creditAccount}</p>
                      <p className="font-medium">${parseFloat(entry.amount).toLocaleString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <i className="fas fa-book-open text-3xl mb-3"></i>
                <p className="text-sm">No journal entries found</p>
                <p className="text-xs">Generate entries from contracts above</p>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

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

        {/* Payment Schedule Tab */}
        {activeTab === "payments" && (
          <PaymentScheduleView contracts={contracts} />
        )}

        {/* ASC 842 Schedule Tab */}
        {activeTab === "asc842" && (
          <ASC842ScheduleView 
            contracts={contracts}
            scheduleParams={scheduleParams}
            setScheduleParams={setScheduleParams}
            showScheduleForm={showScheduleForm}
            setShowScheduleForm={setShowScheduleForm}
            onGenerateSchedule={handleGenerateSchedule}
            isGenerating={complianceScheduleMutation.isPending}
          />
        )}

        {/* IFRS 16 Tab */}
        {activeTab === "ifrs16" && (
          <IFRS16View 
            contracts={contracts}
            onGenerateSchedule={(contractId) => handleGenerateSchedule(contractId, 'IFRS16')}
            isGenerating={complianceScheduleMutation.isPending}
          />
        )}

        {/* Journal Entries Tab */}
        {activeTab === "journal" && (
          <JournalEntriesView 
            contracts={contracts}
            onGenerateJournal={handleGenerateJournal}
            isGenerating={journalEntryMutation.isPending}
          />
        )}
      </div>
    </div>
  );
}
