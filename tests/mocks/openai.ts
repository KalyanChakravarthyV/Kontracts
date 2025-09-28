export const mockOpenAIResponse = {
  extractedData: {
    vendor: "Test Vendor Inc",
    amount: 1500,
    terms: "12 months",
    type: "Service Agreement",
    startDate: "2024-01-01",
    endDate: "2024-12-31",
    paymentTerms: "Monthly"
  }
};

export const mockAIRecommendationsResponse = {
  recommendations: [
    {
      type: "cost_optimization",
      title: "Review Payment Terms",
      description: "Consider negotiating net-30 payment terms to improve cash flow",
      priority: "medium"
    },
    {
      type: "compliance",
      title: "ASC842 Compliance Required",
      description: "This lease requires ASC842 compliance reporting",
      priority: "high"
    }
  ]
};

export const createMockOpenAI = () => ({
  chat: {
    completions: {
      create: jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify(mockOpenAIResponse)
          }
        }]
      })
    }
  }
});