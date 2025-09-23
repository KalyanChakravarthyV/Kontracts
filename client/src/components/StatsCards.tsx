import { useQuery } from "@tanstack/react-query";

export function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: ["/api/dashboard/stats"],
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-card rounded-lg border border-border p-6 shadow-sm">
            <div className="animate-pulse">
              <div className="h-4 bg-muted rounded mb-4"></div>
              <div className="h-8 bg-muted rounded mb-2"></div>
              <div className="h-3 bg-muted rounded w-24"></div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Active Contracts</h3>
          <div className="bg-primary/10 text-primary rounded-full p-2">
            <i className="fas fa-file-contract text-sm"></i>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-2xl font-bold" data-testid="text-active-contracts">
            {stats?.activeContracts || 0}
          </p>
          <p className="text-xs text-green-600">
            <i className="fas fa-arrow-up mr-1"></i>
            12% from last month
          </p>
        </div>
      </div>


      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Pending Payments</h3>
          <div className="bg-amber-100 text-amber-600 rounded-full p-2">
            <i className="fas fa-dollar-sign text-sm"></i>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-2xl font-bold" data-testid="text-pending-payments">
            ${stats?.pendingPayments?.toLocaleString() || '0'}
          </p>
          <p className="text-xs text-amber-600">
            <i className="fas fa-clock mr-1"></i>
            Due within 30 days
          </p>
        </div>
      </div>

      <div className="bg-card rounded-lg border border-border p-6 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-muted-foreground">Compliance Score</h3>
          <div className="bg-green-100 text-green-600 rounded-full p-2">
            <i className="fas fa-shield-alt text-sm"></i>
          </div>
        </div>
        <div className="space-y-2">
          <p className="text-2xl font-bold text-green-600" data-testid="text-compliance-score">
            {stats?.complianceScore || 0}%
          </p>
          <p className="text-xs text-green-600">
            <i className="fas fa-check mr-1"></i>
            IFRS 16 Compliant
          </p>
        </div>
      </div>
    </div>
  );
}
