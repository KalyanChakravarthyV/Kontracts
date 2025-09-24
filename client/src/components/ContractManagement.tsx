import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

interface ContractManagementProps {
  initialTab?: string;
}

export function ContractManagement({ initialTab = "contracts" }: ContractManagementProps = {}) {
  const [activeTab, setActiveTab] = useState(initialTab);
  const [selectedContract, setSelectedContract] = useState<string | null>(null);
  const [selectedContractForSchedule, setSelectedContractForSchedule] = useState<string>('');
  const [scheduleParams, setScheduleParams] = useState({
    // ASC 842 properties
    discountRate: 0.05,
    leaseTerm: 5,
    annualPayment: 0,
    // IFRS 16 properties  
    leaseAmount: '',
    interestRate: '',
    paymentFrequency: 'monthly',
    startDate: ''
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
    const [editingPayment, setEditingPayment] = useState<any | null>(null);
    const [editForm, setEditForm] = useState({
      amount: '',
      dueDate: '',
      status: ''
    });

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

    const updatePaymentMutation = useMutation({
      mutationFn: async ({ paymentId, updates }: { paymentId: string; updates: any }) => {
        return await apiRequest('PUT', `/api/payments/${paymentId}`, updates);
      },
      onSuccess: () => {
        toast({
          title: 'Payment updated successfully',
          description: 'The payment details have been updated.',
        });
        // Invalidate payments query to trigger refetch
        queryClient.invalidateQueries({ queryKey: ['/api/payments'] });
        setEditingPayment(null);
      },
      onError: (error: any) => {
        toast({
          title: 'Failed to update payment',
          description: error.message,
          variant: 'destructive',
        });
      },
    });

    const handleEditPayment = (payment: any) => {
      setEditingPayment(payment);
      setEditForm({
        amount: payment.amount,
        dueDate: new Date(payment.dueDate).toISOString().split('T')[0],
        status: payment.status
      });
    };

    const handleSavePayment = () => {
      if (!editingPayment) return;
      
      const updates = {
        amount: editForm.amount,
        dueDate: new Date(editForm.dueDate).toISOString(),
        status: editForm.status
      };
      
      updatePaymentMutation.mutate({
        paymentId: editingPayment.id,
        updates
      });
    };

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
                    <td className="py-4 px-4 font-medium" data-testid={`text-payment-amount-${payment.id}`}>{`$${parseFloat(payment.amount).toLocaleString()}`}</td>
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
                      <div className="flex items-center justify-end space-x-2">
                        <button 
                          onClick={() => handleEditPayment(payment)}
                          className="text-blue-600 hover:text-blue-800 text-sm font-medium" 
                          data-testid={`button-edit-${payment.id}`}
                        >
                          Edit
                        </button>
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
                      </div>
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

        {/* Edit Payment Dialog */}
        <Dialog open={!!editingPayment} onOpenChange={() => setEditingPayment(null)}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Payment</DialogTitle>
            </DialogHeader>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="amount">Amount</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  value={editForm.amount}
                  onChange={(e) => setEditForm(prev => ({ ...prev, amount: e.target.value }))}
                  data-testid="input-edit-amount"
                />
              </div>
              
              <div>
                <Label htmlFor="dueDate">Due Date</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={editForm.dueDate}
                  onChange={(e) => setEditForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  data-testid="input-edit-due-date"
                />
              </div>
              
              <div>
                <Label htmlFor="status">Status</Label>
                <Select value={editForm.status} onValueChange={(value) => setEditForm(prev => ({ ...prev, status: value }))}>
                  <SelectTrigger data-testid="select-edit-status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Scheduled">Scheduled</SelectItem>
                    <SelectItem value="Due">Due</SelectItem>
                    <SelectItem value="Overdue">Overdue</SelectItem>
                    <SelectItem value="Paid">Paid</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setEditingPayment(null)}
                data-testid="button-cancel-edit"
              >
                Cancel
              </Button>
              <Button 
                onClick={handleSavePayment}
                disabled={updatePaymentMutation.isPending}
                data-testid="button-save-payment"
              >
                {updatePaymentMutation.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  // ASC 842 Schedule View Component
  function ASC842ScheduleView({ 
    contracts, 
    scheduleParams, 
    setScheduleParams, 
    selectedContractForSchedule,
    setSelectedContractForSchedule,
    showScheduleForm, 
    setShowScheduleForm, 
    onGenerateSchedule, 
    isGenerating 
  }: any) {
    const [generatedSchedule, setGeneratedSchedule] = useState<any>(null);
    const [selectedScheduleDetails, setSelectedScheduleDetails] = useState<any>(null);
    const [selectedScheduleId, setSelectedScheduleId] = useState<string | null>(null);
    const [showScheduleDetails, setShowScheduleDetails] = useState<boolean>(false);

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
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Begin Liability</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">End Liability</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Short Term</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Long Term</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Begin RoU Asset</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">RoU Amortization</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">End RoU Asset</th>
                    <th className="text-left py-2 px-2 font-medium text-muted-foreground">Cumulative Amort.</th>
                  </tr>
                </thead>
                <tbody>
                  {generatedSchedule.map((item: any, index: number) => (
                    <tr key={index} className="border-b border-border">
                      <td className="py-2 px-2 font-medium" data-testid={`asc842-period-${index}`}>{item.period}</td>
                      <td className="py-2 px-2" data-testid={`asc842-date-${index}`}>{item.paymentDate}</td>
                      <td className="py-2 px-2" data-testid={`asc842-payment-${index}`}>{`$${item.leasePayment?.toLocaleString() || '0'}`}</td>
                      <td className="py-2 px-2" data-testid={`asc842-interest-${index}`}>{`$${(item.interestExpense || item.interest)?.toLocaleString() || '0'}`}</td>
                      <td className="py-2 px-2" data-testid={`asc842-principal-${index}`}>{`$${(item.principalPayment || item.principal)?.toLocaleString() || '0'}`}</td>
                      <td className="py-2 px-2" data-testid={`asc842-begin-liability-${index}`}>{`$${(item.beginningLeaseLiability || item.leaseLiability)?.toLocaleString() || '0'}`}</td>
                      <td className="py-2 px-2" data-testid={`asc842-end-liability-${index}`}>{`$${(item.endingLeaseLiability || item.leaseLiability)?.toLocaleString() || '0'}`}</td>
                      <td className="py-2 px-2" data-testid={`asc842-short-term-${index}`}>{`$${item.shortTermLiability?.toLocaleString() || '0'}`}</td>
                      <td className="py-2 px-2" data-testid={`asc842-long-term-${index}`}>{`$${item.longTermLiability?.toLocaleString() || '0'}`}</td>
                      <td className="py-2 px-2" data-testid={`asc842-begin-rou-${index}`}>{`$${(item.beginningRouAsset || item.rouAssetValue)?.toLocaleString() || '0'}`}</td>
                      <td className="py-2 px-2" data-testid={`asc842-rou-amort-${index}`}>{`$${(item.rouAssetAmortization || item.routAssetAmortization)?.toLocaleString() || '0'}`}</td>
                      <td className="py-2 px-2" data-testid={`asc842-end-rou-${index}`}>{`$${(item.endingRouAsset || item.rouAssetValue)?.toLocaleString() || '0'}`}</td>
                      <td className="py-2 px-2" data-testid={`asc842-cumul-amort-${index}`}>{`$${item.cumulativeAmortization?.toLocaleString() || '0'}`}</td>
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
                      <p className="text-sm text-muted-foreground">Present Value: {`$${parseFloat(schedule.presentValue || '0').toLocaleString()}`}</p>
                    </div>
                    <button 
                      onClick={() => {
                        try {
                          // Handle both object and stringified JSON for backward compatibility
                          let parsedScheduleData;
                          if (typeof schedule.scheduleData === 'string') {
                            parsedScheduleData = JSON.parse(schedule.scheduleData || '[]');
                          } else {
                            parsedScheduleData = schedule.scheduleData || [];
                          }
                          setSelectedScheduleDetails(parsedScheduleData);
                          setSelectedScheduleId(schedule.id);
                          setShowScheduleDetails(true);
                        } catch (error) {
                          console.error('Error loading schedule data:', error);
                          toast({
                            title: 'Error',
                            description: 'Could not load schedule details',
                            variant: 'destructive'
                          });
                        }
                      }}
                      className="text-primary hover:text-primary/80 text-sm font-medium" 
                      data-testid={`button-view-schedule-${schedule.id}`}
                    >
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

        {/* Schedule Details Modal */}
        {showScheduleDetails && selectedScheduleDetails && (
          <div 
            className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50" 
            data-testid="schedule-details-modal"
            onClick={(e) => {
              if (e.target === e.currentTarget) {
                setShowScheduleDetails(false);
                setSelectedScheduleDetails(null);
                setSelectedScheduleId(null);
              }
            }}
          >
            <div className="bg-card rounded-lg border border-border p-6 max-w-7xl w-full mx-4 max-h-[90vh] overflow-hidden relative">
              <div className="flex items-center justify-between mb-4">
                <h5 className="text-lg font-semibold">ASC 842 Schedule Details</h5>
                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => {
                      if (!selectedScheduleId) {
                        toast({
                          title: 'Error',
                          description: 'No schedule selected for export',
                          variant: 'destructive'
                        });
                        return;
                      }
                      // Create a download link that will trigger the backend endpoint
                      const downloadUrl = `/api/compliance-schedules/${selectedScheduleId}/export-excel`;
                      const link = document.createElement('a');
                      link.href = downloadUrl;
                      link.download = `ASC842_Schedule_${selectedScheduleId}_${new Date().toISOString().split('T')[0]}.xlsx`;
                      document.body.appendChild(link);
                      link.click();
                      document.body.removeChild(link);
                      
                      toast({
                        title: 'Excel Export',
                        description: 'Your ASC 842 schedule is being downloaded as an Excel file'
                      });
                    }}
                    className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm font-medium flex items-center gap-2" 
                    data-testid="button-download-excel"
                    type="button"
                  >
                    <i className="fas fa-download"></i>
                    Download Excel
                  </button>
                  <button 
                    onClick={(e) => {
                      e.preventDefault();
                      e.stopPropagation();
                      setShowScheduleDetails(false);
                      setSelectedScheduleDetails(null);
                      setSelectedScheduleId(null);
                    }}
                    className="text-muted-foreground hover:text-foreground p-2 rounded hover:bg-accent z-10 relative"
                    data-testid="button-close-schedule-details"
                    type="button"
                  >
                    <i className="fas fa-times text-xl"></i>
                  </button>
                </div>
              </div>
              
              <div className="overflow-auto max-h-[70vh]">
                <table className="w-full text-xs" data-testid="schedule-details-table">
                  <thead className="sticky top-0 bg-card">
                    <tr className="border-b border-border">
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Period</th>
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Payment Date</th>
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Lease Payment</th>
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Interest Expense</th>
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Principal Payment</th>
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Begin Liability</th>
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">End Liability</th>
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Short Term</th>
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Long Term</th>
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Begin RoU Asset</th>
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">RoU Amortization</th>
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">End RoU Asset</th>
                      <th className="text-left py-2 px-2 font-medium text-muted-foreground">Cumulative Amort.</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedScheduleDetails.map((item: any, index: number) => (
                      <tr key={index} className="border-b border-border">
                        <td className="py-2 px-2 font-medium" data-testid={`details-period-${index}`}>{item.period || (index + 1)}</td>
                        <td className="py-2 px-2" data-testid={`details-date-${index}`}>{item.paymentDate}</td>
                        <td className="py-2 px-2" data-testid={`details-payment-${index}`}>{`$${item.leasePayment?.toLocaleString() || '0'}`}</td>
                        <td className="py-2 px-2" data-testid={`details-interest-${index}`}>{`$${(item.interestExpense || item.interest)?.toLocaleString() || '0'}`}</td>
                        <td className="py-2 px-2" data-testid={`details-principal-${index}`}>{`$${(item.principalPayment || item.principal)?.toLocaleString() || '0'}`}</td>
                        <td className="py-2 px-2" data-testid={`details-begin-liability-${index}`}>{`$${(item.beginningLeaseLiability || item.leaseLiability)?.toLocaleString() || '0'}`}</td>
                        <td className="py-2 px-2" data-testid={`details-end-liability-${index}`}>{`$${(item.endingLeaseLiability || item.leaseLiability)?.toLocaleString() || '0'}`}</td>
                        <td className="py-2 px-2" data-testid={`details-short-term-${index}`}>{`$${item.shortTermLiability?.toLocaleString() || '0'}`}</td>
                        <td className="py-2 px-2" data-testid={`details-long-term-${index}`}>{`$${item.longTermLiability?.toLocaleString() || '0'}`}</td>
                        <td className="py-2 px-2" data-testid={`details-begin-rou-${index}`}>{`$${(item.beginningRouAsset || item.rouAssetValue)?.toLocaleString() || '0'}`}</td>
                        <td className="py-2 px-2" data-testid={`details-rou-amort-${index}`}>{`$${(item.rouAssetAmortization || item.routAssetAmortization)?.toLocaleString() || '0'}`}</td>
                        <td className="py-2 px-2" data-testid={`details-end-rou-${index}`}>{`$${(item.endingRouAsset || item.rouAssetValue)?.toLocaleString() || '0'}`}</td>
                        <td className="py-2 px-2" data-testid={`details-cumul-amort-${index}`}>{`$${item.cumulativeAmortization?.toLocaleString() || '0'}`}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  // IFRS 16 View Component
  function IFRS16View({ 
    contracts, 
    scheduleParams,
    setScheduleParams,
    selectedContractForSchedule,
    setSelectedContractForSchedule,
    onGenerateSchedule, 
    isGenerating 
  }: any) {
    const [generatedSchedule, setGeneratedSchedule] = useState<any[]>([]);
    const [selectedScheduleDetails, setSelectedScheduleDetails] = useState<any[]>([]);
    const [complianceSchedules, setComplianceSchedules] = useState<any[]>([]);
    
    // Load existing IFRS 16 schedules
    const { data: allSchedules } = useQuery({
      queryKey: ['/api/compliance-schedules'],
    });
    
    useEffect(() => {
      if (allSchedules) {
        setComplianceSchedules(allSchedules.filter((schedule: any) => schedule.type === 'IFRS16'));
      }
    }, [allSchedules]);

    const complianceScheduleMutation = useMutation({
      mutationFn: async ({ contractId, params }: any) => {
        return await apiRequest('POST', `/api/contracts/${contractId}/compliance/IFRS16`, params);
      },
      onSuccess: (data: any) => {
        setGeneratedSchedule(data.schedule || []);
        toast({
          title: "IFRS 16 Schedule Generated",
          description: `The schedule has been created with ${data.paymentsCreated || 0} payment records.`,
        });
        queryClient.invalidateQueries({ queryKey: ['/api/compliance-schedules'] });
      },
      onError: (error: Error) => {
        toast({
          title: "Error",
          description: error.message || "Failed to generate IFRS 16 schedule",
          variant: "destructive"
        });
      }
    });

    const handleGenerateSchedule = () => {
      if (!selectedContractForSchedule) return;
      complianceScheduleMutation.mutate({ contractId: selectedContractForSchedule, params: scheduleParams });
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold">IFRS 16 Compliance</h4>
        </div>
        
        {/* Schedule Generation Interface */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h5 className="text-md font-semibold mb-4">Generate New IFRS 16 Schedule</h5>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="ifrs16-contract">Select Contract</Label>
              <Select value={selectedContractForSchedule} onValueChange={setSelectedContractForSchedule}>
                <SelectTrigger data-testid="select-ifrs16-contract">
                  <SelectValue placeholder="Choose a contract" />
                </SelectTrigger>
                <SelectContent>
                  {contracts?.map((contract: any) => (
                    <SelectItem key={contract.id} value={contract.id}>
                      {contract.name} - {contract.vendor}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ifrs16-amount">Lease Amount</Label>
              <Input 
                id="ifrs16-amount"
                value={scheduleParams.leaseAmount}
                onChange={(e) => setScheduleParams({...scheduleParams, leaseAmount: e.target.value})}
                placeholder="Enter total lease amount"
                data-testid="input-ifrs16-amount"
              />
            </div>
            <div>
              <Label htmlFor="ifrs16-term">Lease Term (months)</Label>
              <Input 
                id="ifrs16-term"
                value={scheduleParams.leaseTerm}
                onChange={(e) => setScheduleParams({...scheduleParams, leaseTerm: e.target.value})}
                placeholder="Enter lease term"
                data-testid="input-ifrs16-term"
              />
            </div>
            <div>
              <Label htmlFor="ifrs16-rate">Interest Rate (%)</Label>
              <Input 
                id="ifrs16-rate"
                value={scheduleParams.interestRate}
                onChange={(e) => setScheduleParams({...scheduleParams, interestRate: e.target.value})}
                placeholder="Enter interest rate"
                data-testid="input-ifrs16-rate"
              />
            </div>
            <div>
              <Label htmlFor="ifrs16-frequency">Payment Frequency</Label>
              <Select value={scheduleParams.paymentFrequency} onValueChange={(value) => setScheduleParams({...scheduleParams, paymentFrequency: value})}>
                <SelectTrigger data-testid="select-ifrs16-frequency">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monthly</SelectItem>
                  <SelectItem value="quarterly">Quarterly</SelectItem>
                  <SelectItem value="annual">Annual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="ifrs16-start">Start Date</Label>
              <Input 
                id="ifrs16-start"
                type="date"
                value={scheduleParams.startDate}
                onChange={(e) => setScheduleParams({...scheduleParams, startDate: e.target.value})}
                data-testid="input-ifrs16-start"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button 
              onClick={handleGenerateSchedule}
              disabled={!selectedContractForSchedule || complianceScheduleMutation.isPending}
              className="w-full"
              data-testid="button-generate-ifrs16"
            >
              {complianceScheduleMutation.isPending ? 'Generating...' : 'Generate IFRS 16 Schedule'}
            </Button>
          </div>
        </div>

        {/* Generated Schedule Preview */}
        {generatedSchedule.length > 0 && (
          <div className="bg-card rounded-lg border border-border p-6">
            <h5 className="text-md font-semibold mb-4">Generated IFRS 16 Schedule</h5>
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
                  </tr>
                </thead>
                <tbody>
                  {generatedSchedule.map((item: any, index: number) => (
                    <tr key={index} className="border-b border-border">
                      <td className="py-2 px-2 font-medium" data-testid={`ifrs16-period-${index}`}>{item.period}</td>
                      <td className="py-2 px-2" data-testid={`ifrs16-date-${index}`}>{item.paymentDate}</td>
                      <td className="py-2 px-2" data-testid={`ifrs16-payment-${index}`}>{`$${item.leasePayment?.toLocaleString() || '0'}`}</td>
                      <td className="py-2 px-2" data-testid={`ifrs16-interest-${index}`}>{`$${(item.interestExpense || item.interest)?.toLocaleString() || '0'}`}</td>
                      <td className="py-2 px-2" data-testid={`ifrs16-principal-${index}`}>{`$${(item.principalPayment || item.principal)?.toLocaleString() || '0'}`}</td>
                      <td className="py-2 px-2" data-testid={`ifrs16-liability-${index}`}>{`$${(item.leaseLiability)?.toLocaleString() || '0'}`}</td>
                      <td className="py-2 px-2" data-testid={`ifrs16-rou-asset-${index}`}>{`$${(item.rouAssetValue)?.toLocaleString() || '0'}`}</td>
                      <td className="py-2 px-2" data-testid={`ifrs16-rou-amort-${index}`}>{`$${(item.routAssetAmortization)?.toLocaleString() || '0'}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Existing IFRS 16 Schedules */}
        <div className="bg-card rounded-lg border border-border p-6">
          <h5 className="text-md font-semibold mb-4">Existing IFRS 16 Schedules</h5>
          {complianceSchedules && complianceSchedules.length > 0 ? (
            <div className="space-y-4">
              {complianceSchedules.map((schedule: any) => (
                <div key={schedule.id} className="border border-border rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Schedule #{schedule.id}</p>
                      <p className="text-sm text-muted-foreground">Created: {new Date(schedule.createdAt || Date.now()).toLocaleDateString()}</p>
                      <p className="text-sm text-muted-foreground">Present Value: {`$${parseFloat(schedule.presentValue || '0').toLocaleString()}`}</p>
                    </div>
                    <button 
                      onClick={() => {
                        try {
                          const scheduleData = JSON.parse(schedule.scheduleData || '[]');
                          setSelectedScheduleDetails(scheduleData);
                        } catch (e) {
                          console.error('Failed to parse schedule data:', e);
                          toast({
                            title: "Error",
                            description: "Failed to load schedule details",
                            variant: "destructive"
                          });
                        }
                      }}
                      className="px-3 py-1 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
                      data-testid={`button-view-ifrs16-schedule-${schedule.id}`}
                    >
                      View Schedule
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-muted-foreground text-center py-8">No IFRS 16 schedules have been generated yet.</p>
          )}
        </div>

        {/* Schedule Details Modal */}
        {selectedScheduleDetails.length > 0 && (
          <div className="bg-card rounded-lg border border-border p-6">
            <div className="flex items-center justify-between mb-4">
              <h5 className="text-md font-semibold">IFRS 16 Schedule Details</h5>
              <button 
                onClick={() => setSelectedScheduleDetails([])}
                className="text-muted-foreground hover:text-foreground"
                data-testid="button-close-ifrs16-details"
              >
                ✕
              </button>
            </div>
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
                  </tr>
                </thead>
                <tbody>
                  {selectedScheduleDetails.map((item: any, index: number) => (
                    <tr key={index} className="border-b border-border">
                      <td className="py-2 px-2 font-medium" data-testid={`ifrs16-details-period-${index}`}>{item.period || (index + 1)}</td>
                      <td className="py-2 px-2" data-testid={`ifrs16-details-date-${index}`}>{item.paymentDate}</td>
                      <td className="py-2 px-2" data-testid={`ifrs16-details-payment-${index}`}>{`$${item.leasePayment?.toLocaleString() || '0'}`}</td>
                      <td className="py-2 px-2" data-testid={`ifrs16-details-interest-${index}`}>{`$${(item.interestExpense || item.interest)?.toLocaleString() || '0'}`}</td>
                      <td className="py-2 px-2" data-testid={`ifrs16-details-principal-${index}`}>{`$${(item.principalPayment || item.principal)?.toLocaleString() || '0'}`}</td>
                      <td className="py-2 px-2" data-testid={`ifrs16-details-liability-${index}`}>{`$${(item.leaseLiability)?.toLocaleString() || '0'}`}</td>
                      <td className="py-2 px-2" data-testid={`ifrs16-details-rou-asset-${index}`}>{`$${(item.rouAssetValue)?.toLocaleString() || '0'}`}</td>
                      <td className="py-2 px-2" data-testid={`ifrs16-details-rou-amort-${index}`}>{`$${(item.routAssetAmortization)?.toLocaleString() || '0'}`}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    );
  }

  // Journal Entries View Component  
  function JournalEntriesView({ contracts, onGenerateJournal, isGenerating }: any) {
    const [showSetupForm, setShowSetupForm] = useState(false);
    const [editingSetup, setEditingSetup] = useState<any>(null);
    const [setupForm, setSetupForm] = useState({
      name: '',
      description: '',
      entryType: 'periodic',
      triggerEvent: 'payment_due',
      debitAccount: '',
      creditAccount: '',
      amountColumn: '',
      periodReference: 'n'
    });

    const { data: journalEntries } = useQuery({
      queryKey: ['/api/journal-entries'],
    });

    const { data: journalSetups } = useQuery({
      queryKey: ['/api/journal-entry-setups'],
    });

    const createSetupMutation = useMutation({
      mutationFn: async (data: any) => {
        return await apiRequest('POST', '/api/journal-entry-setups', data);
      },
      onSuccess: () => {
        toast({
          title: 'Journal entry setup created',
          description: 'The setup has been created successfully.',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/journal-entry-setups'] });
        setShowSetupForm(false);
        setSetupForm({
          name: '',
          description: '',
          entryType: 'periodic',
          triggerEvent: 'payment_due',
          debitAccount: '',
          creditAccount: '',
          amountColumn: '',
          periodReference: 'n'
        });
      },
      onError: (error: any) => {
        toast({
          title: 'Failed to create setup',
          description: error.message,
          variant: 'destructive',
        });
      },
    });

    const updateSetupMutation = useMutation({
      mutationFn: async ({ id, data }: { id: string; data: any }) => {
        return await apiRequest('PUT', `/api/journal-entry-setups/${id}`, data);
      },
      onSuccess: () => {
        toast({
          title: 'Journal entry setup updated',
          description: 'The setup has been updated successfully.',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/journal-entry-setups'] });
        setEditingSetup(null);
      },
      onError: (error: any) => {
        toast({
          title: 'Failed to update setup',
          description: error.message,
          variant: 'destructive',
        });
      },
    });

    const deleteSetupMutation = useMutation({
      mutationFn: async (id: string) => {
        return await apiRequest('DELETE', `/api/journal-entry-setups/${id}`);
      },
      onSuccess: () => {
        toast({
          title: 'Journal entry setup deleted',
          description: 'The setup has been deleted successfully.',
        });
        queryClient.invalidateQueries({ queryKey: ['/api/journal-entry-setups'] });
      },
      onError: (error: any) => {
        toast({
          title: 'Failed to delete setup',
          description: error.message,
          variant: 'destructive',
        });
      },
    });

    const handleSaveSetup = () => {
      if (editingSetup) {
        updateSetupMutation.mutate({ id: editingSetup.id, data: setupForm });
      } else {
        createSetupMutation.mutate(setupForm);
      }
    };

    const handleEditSetup = (setup: any) => {
      setEditingSetup(setup);
      setSetupForm({
        name: setup.name,
        description: setup.description || '',
        entryType: setup.entryType,
        triggerEvent: setup.triggerEvent,
        debitAccount: setup.debitAccount,
        creditAccount: setup.creditAccount,
        amountColumn: setup.amountColumn,
        periodReference: setup.periodReference
      });
      setShowSetupForm(true);
    };

    const handleDeleteSetup = (setupId: string) => {
      if (confirm('Are you sure you want to delete this journal entry setup?')) {
        deleteSetupMutation.mutate(setupId);
      }
    };

    // ASC 842 schedule columns for dropdown
    const asc842Columns = [
      { value: 'leasePayment', label: 'Lease Payment' },
      { value: 'interestExpense', label: 'Interest Expense' },
      { value: 'principalPayment', label: 'Principal Payment' },
      { value: 'beginningLeaseLiability', label: 'Beginning Lease Liability' },
      { value: 'endingLeaseLiability', label: 'Ending Lease Liability' },
      { value: 'shortTermLiability', label: 'Short Term Liability' },
      { value: 'longTermLiability', label: 'Long Term Liability' },
      { value: 'beginningRouAsset', label: 'Beginning ROU Asset' },
      { value: 'rouAssetAmortization', label: 'ROU Asset Amortization' },
      { value: 'endingRouAsset', label: 'Ending ROU Asset' },
      { value: 'cumulativeAmortization', label: 'Cumulative Amortization' }
    ];

    const periodReferences = [
      { value: 'n', label: 'Current Period (n)' },
      { value: 'n-1', label: 'Previous Period (n-1)' },
      { value: 'n+1', label: 'Next Period (n+1)' },
      { value: '1', label: 'First Period (1)' },
      { value: 'last', label: 'Last Period' }
    ];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h4 className="text-lg font-semibold">Journal Entries</h4>
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90" data-testid="button-export-journal">
            <i className="fas fa-download mr-2"></i>Export Entries
          </button>
        </div>

        {/* Journal Entry Setups Section */}
        <div className="bg-card rounded-lg border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h5 className="text-md font-semibold">Journal Entry Setup</h5>
            <Button 
              onClick={() => setShowSetupForm(!showSetupForm)}
              data-testid="button-add-setup"
            >
              {showSetupForm ? 'Cancel' : 'Add Setup'}
            </Button>
          </div>

          {showSetupForm && (
            <div className="bg-accent/20 rounded-lg p-4 mb-4">
              <h6 className="font-medium mb-3">{editingSetup ? 'Edit' : 'Create'} Journal Entry Setup</h6>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="setup-name">Name</Label>
                  <Input 
                    id="setup-name"
                    value={setupForm.name}
                    onChange={(e) => setSetupForm({...setupForm, name: e.target.value})}
                    placeholder="Setup name"
                    data-testid="input-setup-name"
                  />
                </div>
                <div>
                  <Label htmlFor="setup-description">Description</Label>
                  <Input 
                    id="setup-description"
                    value={setupForm.description}
                    onChange={(e) => setSetupForm({...setupForm, description: e.target.value})}
                    placeholder="Optional description"
                    data-testid="input-setup-description"
                  />
                </div>
                <div>
                  <Label htmlFor="setup-entry-type">Entry Type</Label>
                  <Select value={setupForm.entryType} onValueChange={(value) => setSetupForm({...setupForm, entryType: value})}>
                    <SelectTrigger data-testid="select-entry-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="initial">Initial Recognition</SelectItem>
                      <SelectItem value="periodic">Periodic Entry</SelectItem>
                      <SelectItem value="final">Final Entry</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="setup-trigger">Trigger Event</Label>
                  <Select value={setupForm.triggerEvent} onValueChange={(value) => setSetupForm({...setupForm, triggerEvent: value})}>
                    <SelectTrigger data-testid="select-trigger-event">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="contract_start">Contract Start</SelectItem>
                      <SelectItem value="payment_due">Payment Due</SelectItem>
                      <SelectItem value="period_end">Period End</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="setup-debit">Debit Account</Label>
                  <Input 
                    id="setup-debit"
                    value={setupForm.debitAccount}
                    onChange={(e) => setSetupForm({...setupForm, debitAccount: e.target.value})}
                    placeholder="Debit account"
                    data-testid="input-debit-account"
                  />
                </div>
                <div>
                  <Label htmlFor="setup-credit">Credit Account</Label>
                  <Input 
                    id="setup-credit"
                    value={setupForm.creditAccount}
                    onChange={(e) => setSetupForm({...setupForm, creditAccount: e.target.value})}
                    placeholder="Credit account"
                    data-testid="input-credit-account"
                  />
                </div>
                <div>
                  <Label htmlFor="setup-amount-column">ASC 842 Amount Column</Label>
                  <Select value={setupForm.amountColumn} onValueChange={(value) => setSetupForm({...setupForm, amountColumn: value})}>
                    <SelectTrigger data-testid="select-amount-column">
                      <SelectValue placeholder="Select column" />
                    </SelectTrigger>
                    <SelectContent>
                      {asc842Columns.map((column) => (
                        <SelectItem key={column.value} value={column.value}>
                          {column.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="setup-period-ref">Period Reference</Label>
                  <Select value={setupForm.periodReference} onValueChange={(value) => setSetupForm({...setupForm, periodReference: value})}>
                    <SelectTrigger data-testid="select-period-reference">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {periodReferences.map((period) => (
                        <SelectItem key={period.value} value={period.value}>
                          {period.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end mt-4 space-x-2">
                <Button 
                  variant="outline" 
                  onClick={() => {
                    setShowSetupForm(false);
                    setEditingSetup(null);
                    setSetupForm({
                      name: '',
                      description: '',
                      entryType: 'periodic',
                      triggerEvent: 'payment_due',
                      debitAccount: '',
                      creditAccount: '',
                      amountColumn: '',
                      periodReference: 'n'
                    });
                  }}
                  data-testid="button-cancel-setup"
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleSaveSetup}
                  disabled={createSetupMutation.isPending || updateSetupMutation.isPending}
                  data-testid="button-save-setup"
                >
                  {createSetupMutation.isPending || updateSetupMutation.isPending ? 'Saving...' : 'Save Setup'}
                </Button>
              </div>
            </div>
          )}

          {/* Existing setups table */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border">
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Name</th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Entry Type</th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Trigger</th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Accounts</th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Amount Source</th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Period</th>
                  <th className="text-left py-2 px-2 font-medium text-muted-foreground">Actions</th>
                </tr>
              </thead>
              <tbody>
                {journalSetups?.map((setup: any) => (
                  <tr key={setup.id} className="border-b border-border">
                    <td className="py-2 px-2 font-medium" data-testid={`setup-name-${setup.id}`}>
                      {setup.name}
                      {setup.description && (
                        <div className="text-xs text-muted-foreground">{setup.description}</div>
                      )}
                    </td>
                    <td className="py-2 px-2" data-testid={`setup-type-${setup.id}`}>
                      <span className={`px-2 py-1 rounded-full text-xs ${
                        setup.entryType === 'initial' ? 'bg-blue-100 text-blue-600' :
                        setup.entryType === 'periodic' ? 'bg-green-100 text-green-600' :
                        'bg-orange-100 text-orange-600'
                      }`}>
                        {setup.entryType}
                      </span>
                    </td>
                    <td className="py-2 px-2" data-testid={`setup-trigger-${setup.id}`}>
                      {setup.triggerEvent.replace('_', ' ')}
                    </td>
                    <td className="py-2 px-2" data-testid={`setup-accounts-${setup.id}`}>
                      <div className="text-xs">
                        <div>Dr: {setup.debitAccount}</div>
                        <div>Cr: {setup.creditAccount}</div>
                      </div>
                    </td>
                    <td className="py-2 px-2" data-testid={`setup-amount-${setup.id}`}>
                      {asc842Columns.find(col => col.value === setup.amountColumn)?.label || setup.amountColumn}
                    </td>
                    <td className="py-2 px-2" data-testid={`setup-period-${setup.id}`}>
                      {periodReferences.find(period => period.value === setup.periodReference)?.label || setup.periodReference}
                    </td>
                    <td className="py-2 px-2">
                      <div className="flex space-x-1">
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleEditSetup(setup)}
                          data-testid={`button-edit-setup-${setup.id}`}
                        >
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => handleDeleteSetup(setup.id)}
                          disabled={deleteSetupMutation.isPending}
                          data-testid={`button-delete-setup-${setup.id}`}
                        >
                          Delete
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
                {(!journalSetups || journalSetups.length === 0) && (
                  <tr>
                    <td colSpan={7} className="py-8 text-center text-muted-foreground">
                      No journal entry setups configured. Create your first setup to automate journal entry generation.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-card rounded-lg border border-border p-6">
            <h5 className="text-md font-semibold mb-4">Generate Journal Entries</h5>
            <div className="space-y-3">
              {contracts?.map((contract: any) => (
                <div key={contract.id} className="flex items-center justify-between border border-border rounded-lg p-3">
                  <div>
                    <p className="font-medium text-sm">{contract.name}</p>
                    <p className="text-xs text-muted-foreground">{contract.vendor} - {`$${parseFloat(contract.amount).toLocaleString()}`}</p>
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
                      <p className="font-medium">{`$${parseFloat(entry.amount).toLocaleString()}`}</p>
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
            selectedContractForSchedule={selectedContractForSchedule}
            setSelectedContractForSchedule={setSelectedContractForSchedule}
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
            scheduleParams={scheduleParams}
            setScheduleParams={setScheduleParams}
            selectedContractForSchedule={selectedContractForSchedule}
            setSelectedContractForSchedule={setSelectedContractForSchedule}
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
