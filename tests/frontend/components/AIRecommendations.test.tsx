import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import AIRecommendations from '../../../client/src/components/AIRecommendations';
import { mockAIRecommendations } from '../../mocks/database';

// Mock the fetch API
global.fetch = jest.fn();

// Mock useQuery and useMutation
jest.mock('@tanstack/react-query', () => ({
  ...jest.requireActual('@tanstack/react-query'),
  useQuery: jest.fn(),
  useMutation: jest.fn(),
}));

const createTestQueryClient = () => new QueryClient({
  defaultOptions: {
    queries: { retry: false },
    mutations: { retry: false },
  },
});

const renderWithQueryClient = (component: React.ReactElement) => {
  const queryClient = createTestQueryClient();
  return render(
    <QueryClientProvider client={queryClient}>
      {component}
    </QueryClientProvider>
  );
};

describe('AIRecommendations Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render AI recommendations', () => {
    const { useQuery } = require('@tanstack/react-query');
    useQuery.mockReturnValue({
      data: mockAIRecommendations,
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<AIRecommendations />);

    expect(screen.getByText(/AI Recommendations/i)).toBeInTheDocument();
    expect(screen.getByText('Negotiate Better Terms')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    const { useQuery } = require('@tanstack/react-query');
    useQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    renderWithQueryClient(<AIRecommendations />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should show error state', () => {
    const { useQuery } = require('@tanstack/react-query');
    useQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch recommendations'),
    });

    renderWithQueryClient(<AIRecommendations />);

    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  it('should display recommendation details', () => {
    const { useQuery } = require('@tanstack/react-query');
    useQuery.mockReturnValue({
      data: mockAIRecommendations,
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<AIRecommendations />);

    expect(screen.getByText('Negotiate Better Terms')).toBeInTheDocument();
    expect(screen.getByText(/Consider renegotiating lease terms/)).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText('Cost Optimization')).toBeInTheDocument();
  });

  it('should filter recommendations by type', async () => {
    const multipleRecommendations = [
      ...mockAIRecommendations,
      {
        id: 'test-rec-2',
        contractId: 'test-contract-1',
        userId: 'test-user-1',
        type: 'compliance' as const,
        title: 'Compliance Check Required',
        description: 'Review compliance requirements for this contract',
        priority: 'high' as const,
        status: 'active' as const,
        createdAt: new Date().toISOString()
      }
    ];

    const { useQuery } = require('@tanstack/react-query');
    useQuery.mockReturnValue({
      data: multipleRecommendations,
      isLoading: false,
      error: null,
    });

    const user = userEvent.setup();
    renderWithQueryClient(<AIRecommendations />);

    // Both recommendations should be visible initially
    expect(screen.getByText('Negotiate Better Terms')).toBeInTheDocument();
    expect(screen.getByText('Compliance Check Required')).toBeInTheDocument();

    // Filter by cost optimization
    const typeFilter = screen.getByLabelText(/filter by type/i);
    await user.click(typeFilter);

    const costOptimizationOption = screen.getByText('Cost Optimization');
    await user.click(costOptimizationOption);

    // Only cost optimization recommendation should be visible
    expect(screen.getByText('Negotiate Better Terms')).toBeInTheDocument();
    expect(screen.queryByText('Compliance Check Required')).not.toBeInTheDocument();
  });

  it('should filter recommendations by priority', async () => {
    const multipleRecommendations = [
      ...mockAIRecommendations,
      {
        id: 'test-rec-2',
        contractId: 'test-contract-1',
        userId: 'test-user-1',
        type: 'compliance' as const,
        title: 'High Priority Alert',
        description: 'Urgent action required',
        priority: 'high' as const,
        status: 'active' as const,
        createdAt: new Date().toISOString()
      }
    ];

    const { useQuery } = require('@tanstack/react-query');
    useQuery.mockReturnValue({
      data: multipleRecommendations,
      isLoading: false,
      error: null,
    });

    const user = userEvent.setup();
    renderWithQueryClient(<AIRecommendations />);

    // Filter by high priority
    const priorityFilter = screen.getByLabelText(/filter by priority/i);
    await user.click(priorityFilter);

    const highPriorityOption = screen.getByText('High');
    await user.click(highPriorityOption);

    // Only high priority recommendation should be visible
    expect(screen.getByText('High Priority Alert')).toBeInTheDocument();
    expect(screen.queryByText('Negotiate Better Terms')).not.toBeInTheDocument();
  });

  it('should show priority badges with correct colors', () => {
    const multipleRecommendations = [
      {
        ...mockAIRecommendations[0],
        priority: 'high' as const,
        title: 'High Priority Item'
      },
      {
        ...mockAIRecommendations[0],
        id: 'test-rec-2',
        priority: 'low' as const,
        title: 'Low Priority Item'
      }
    ];

    const { useQuery } = require('@tanstack/react-query');
    useQuery.mockReturnValue({
      data: multipleRecommendations,
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<AIRecommendations />);

    const highPriorityBadge = screen.getByText('High');
    const lowPriorityBadge = screen.getByText('Low');

    expect(highPriorityBadge).toHaveClass('bg-red-100'); // High priority styling
    expect(lowPriorityBadge).toHaveClass('bg-gray-100'); // Low priority styling
  });

  it('should mark recommendation as implemented', async () => {
    const { useQuery, useMutation } = require('@tanstack/react-query');

    useQuery.mockReturnValue({
      data: mockAIRecommendations,
      isLoading: false,
      error: null,
    });

    const mockMutate = jest.fn();
    useMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
    });

    const user = userEvent.setup();
    renderWithQueryClient(<AIRecommendations />);

    // Find and click implement button
    const implementButton = screen.getByRole('button', { name: /implement/i });
    await user.click(implementButton);

    expect(mockMutate).toHaveBeenCalledWith({
      id: mockAIRecommendations[0].id,
      status: 'implemented'
    });
  });

  it('should dismiss recommendation', async () => {
    const { useQuery, useMutation } = require('@tanstack/react-query');

    useQuery.mockReturnValue({
      data: mockAIRecommendations,
      isLoading: false,
      error: null,
    });

    const mockMutate = jest.fn();
    useMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
    });

    const user = userEvent.setup();
    renderWithQueryClient(<AIRecommendations />);

    // Find and click dismiss button
    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    await user.click(dismissButton);

    expect(mockMutate).toHaveBeenCalledWith({
      id: mockAIRecommendations[0].id,
      status: 'dismissed'
    });
  });

  it('should generate new recommendations', async () => {
    const { useQuery, useMutation } = require('@tanstack/react-query');

    useQuery.mockReturnValue({
      data: mockAIRecommendations,
      isLoading: false,
      error: null,
    });

    const mockMutate = jest.fn();
    useMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
    });

    const user = userEvent.setup();
    renderWithQueryClient(<AIRecommendations />);

    // Find and click generate button
    const generateButton = screen.getByRole('button', { name: /generate new/i });
    await user.click(generateButton);

    expect(mockMutate).toHaveBeenCalled();
  });

  it('should show empty state when no recommendations', () => {
    const { useQuery } = require('@tanstack/react-query');
    useQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<AIRecommendations />);

    expect(screen.getByText(/no recommendations/i)).toBeInTheDocument();
    expect(screen.getByText(/generate recommendations/i)).toBeInTheDocument();
  });

  it('should show loading state when generating recommendations', () => {
    const { useQuery, useMutation } = require('@tanstack/react-query');

    useQuery.mockReturnValue({
      data: mockAIRecommendations,
      isLoading: false,
      error: null,
    });

    useMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: true,
      error: null,
    });

    renderWithQueryClient(<AIRecommendations />);

    expect(screen.getByText(/generating/i)).toBeInTheDocument();
  });

  it('should display recommendation icons based on type', () => {
    const multipleRecommendations = [
      {
        ...mockAIRecommendations[0],
        type: 'cost_optimization' as const,
        title: 'Cost Optimization'
      },
      {
        ...mockAIRecommendations[0],
        id: 'test-rec-2',
        type: 'compliance' as const,
        title: 'Compliance Check'
      },
      {
        ...mockAIRecommendations[0],
        id: 'test-rec-3',
        type: 'risk_management' as const,
        title: 'Risk Assessment'
      }
    ];

    const { useQuery } = require('@tanstack/react-query');
    useQuery.mockReturnValue({
      data: multipleRecommendations,
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<AIRecommendations />);

    // Should have different icons for different types
    expect(screen.getByTestId('cost-optimization-icon')).toBeInTheDocument();
    expect(screen.getByTestId('compliance-icon')).toBeInTheDocument();
    expect(screen.getByTestId('risk-management-icon')).toBeInTheDocument();
  });

  it('should sort recommendations by priority', () => {
    const mixedPriorityRecommendations = [
      {
        ...mockAIRecommendations[0],
        priority: 'low' as const,
        title: 'Low Priority Item'
      },
      {
        ...mockAIRecommendations[0],
        id: 'test-rec-2',
        priority: 'high' as const,
        title: 'High Priority Item'
      },
      {
        ...mockAIRecommendations[0],
        id: 'test-rec-3',
        priority: 'medium' as const,
        title: 'Medium Priority Item'
      }
    ];

    const { useQuery } = require('@tanstack/react-query');
    useQuery.mockReturnValue({
      data: mixedPriorityRecommendations,
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<AIRecommendations />);

    const recommendations = screen.getAllByTestId(/recommendation-item/);

    // Should be sorted by priority (high, medium, low)
    expect(recommendations[0]).toHaveTextContent('High Priority Item');
    expect(recommendations[1]).toHaveTextContent('Medium Priority Item');
    expect(recommendations[2]).toHaveTextContent('Low Priority Item');
  });

  it('should handle recommendation actions with confirmation', async () => {
    const { useQuery, useMutation } = require('@tanstack/react-query');

    useQuery.mockReturnValue({
      data: mockAIRecommendations,
      isLoading: false,
      error: null,
    });

    const mockMutate = jest.fn();
    useMutation.mockReturnValue({
      mutate: mockMutate,
      isPending: false,
      error: null,
    });

    const user = userEvent.setup();
    renderWithQueryClient(<AIRecommendations />);

    // Click dismiss button
    const dismissButton = screen.getByRole('button', { name: /dismiss/i });
    await user.click(dismissButton);

    // Should show confirmation dialog
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();

    // Confirm action
    const confirmButton = screen.getByRole('button', { name: /confirm/i });
    await user.click(confirmButton);

    expect(mockMutate).toHaveBeenCalled();
  });
});