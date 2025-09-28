export const mockContracts = [
  {
    id: "test-contract-1",
    name: "Office Lease Agreement",
    vendor: "Property Management Co",
    type: "Lease Agreement",
    status: "Active" as const,
    nextPayment: new Date('2024-12-15').toISOString(),
    amount: "5000",
    userId: "test-user-1",
    documentId: "test-doc-1",
    createdAt: new Date().toISOString()
  },
  {
    id: "test-contract-2",
    name: "Software License",
    vendor: "Tech Solutions Inc",
    type: "Software License",
    status: "Pending" as const,
    nextPayment: new Date('2024-11-30').toISOString(),
    amount: "1200",
    userId: "test-user-1",
    documentId: "test-doc-2",
    createdAt: new Date().toISOString()
  }
];

export const mockDocuments = [
  {
    id: "test-doc-1",
    filename: "office-lease.pdf",
    originalname: "office-lease.pdf",
    mimetype: "application/pdf",
    size: 102400,
    path: "/uploads/test-doc-1.pdf",
    userId: "test-user-1",
    extractedData: {
      vendor: "Property Management Co",
      amount: 5000,
      terms: "5 years",
      type: "Lease Agreement"
    },
    createdAt: new Date().toISOString()
  }
];

export const mockComplianceSchedules = [
  {
    id: "test-schedule-1",
    contractId: "test-contract-1",
    userId: "test-user-1",
    type: "ASC842" as const,
    leaseAmount: 5000,
    leaseTerm: 60,
    discountRate: 3.5,
    presentValue: 285000,
    schedule: [
      {
        period: 1,
        payment: 5000,
        interest: 831.25,
        principal: 4168.75,
        balance: 280831.25
      }
    ],
    createdAt: new Date().toISOString()
  }
];

export const mockJournalEntries = [
  {
    id: "test-journal-1",
    contractId: "test-contract-1",
    userId: "test-user-1",
    entryDate: new Date().toISOString(),
    description: "Monthly lease payment",
    debitAccount: "Lease Expense",
    creditAccount: "Cash",
    amount: 5000,
    reference: "Contract: test-contract-1",
    createdAt: new Date().toISOString()
  }
];

export const mockAIRecommendations = [
  {
    id: "test-rec-1",
    contractId: "test-contract-1",
    userId: "test-user-1",
    type: "cost_optimization" as const,
    title: "Negotiate Better Terms",
    description: "Consider renegotiating lease terms to reduce monthly payments",
    priority: "medium" as const,
    status: "active" as const,
    createdAt: new Date().toISOString()
  }
];