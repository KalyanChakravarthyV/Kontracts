import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import ContractManagement from '../../../client/src/components/ContractManagement';
import { mockContracts } from '../../mocks/database';

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

describe('ContractManagement Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render contract list', async () => {
    const { useQuery } = require('@tanstack/react-query');
    useQuery.mockReturnValue({
      data: mockContracts,
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<ContractManagement />);

    expect(screen.getByText('Contracts')).toBeInTheDocument();
    expect(screen.getByText('Office Lease Agreement')).toBeInTheDocument();
    expect(screen.getByText('Software License')).toBeInTheDocument();
  });

  it('should show loading state', () => {
    const { useQuery } = require('@tanstack/react-query');
    useQuery.mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    renderWithQueryClient(<ContractManagement />);

    expect(screen.getByText(/loading/i)).toBeInTheDocument();
  });

  it('should show error state', () => {
    const { useQuery } = require('@tanstack/react-query');
    useQuery.mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('Failed to fetch contracts'),
    });

    renderWithQueryClient(<ContractManagement />);

    expect(screen.getByText(/error/i)).toBeInTheDocument();
  });

  it('should display contract details correctly', () => {
    const { useQuery } = require('@tanstack/react-query');
    useQuery.mockReturnValue({
      data: mockContracts,
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<ContractManagement />);

    // Check if contract details are displayed
    expect(screen.getByText('Property Management Co')).toBeInTheDocument();
    expect(screen.getByText('Tech Solutions Inc')).toBeInTheDocument();
    expect(screen.getByText('$5000')).toBeInTheDocument();
    expect(screen.getByText('$1200')).toBeInTheDocument();
  });

  it('should filter contracts by status', async () => {
    const { useQuery } = require('@tanstack/react-query');
    useQuery.mockReturnValue({
      data: mockContracts,
      isLoading: false,
      error: null,
    });

    const user = userEvent.setup();
    renderWithQueryClient(<ContractManagement />);

    // Find and click status filter
    const statusFilter = screen.getByLabelText(/filter by status/i);
    await user.click(statusFilter);

    // Select "Active" status
    const activeOption = screen.getByText('Active');
    await user.click(activeOption);

    // Only active contracts should be visible
    expect(screen.getByText('Office Lease Agreement')).toBeInTheDocument();
    expect(screen.queryByText('Software License')).not.toBeInTheDocument();
  });

  it('should search contracts by name', async () => {
    const { useQuery } = require('@tanstack/react-query');
    useQuery.mockReturnValue({
      data: mockContracts,
      isLoading: false,
      error: null,
    });

    const user = userEvent.setup();
    renderWithQueryClient(<ContractManagement />);

    // Find search input
    const searchInput = screen.getByPlaceholderText(/search contracts/i);

    // Type in search term
    await user.type(searchInput, 'Office');

    // Only matching contracts should be visible
    expect(screen.getByText('Office Lease Agreement')).toBeInTheDocument();
    expect(screen.queryByText('Software License')).not.toBeInTheDocument();
  });

  it('should open create contract dialog', async () => {
    const { useQuery } = require('@tanstack/react-query');
    useQuery.mockReturnValue({
      data: mockContracts,
      isLoading: false,
      error: null,
    });

    const user = userEvent.setup();
    renderWithQueryClient(<ContractManagement />);

    // Find and click create button
    const createButton = screen.getByText(/create contract/i);
    await user.click(createButton);

    // Dialog should be open
    expect(screen.getByText(/new contract/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/contract name/i)).toBeInTheDocument();
  });

  it('should create a new contract', async () => {
    const { useQuery, useMutation } = require('@tanstack/react-query');

    useQuery.mockReturnValue({
      data: mockContracts,
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
    renderWithQueryClient(<ContractManagement />);

    // Open create dialog
    const createButton = screen.getByText(/create contract/i);
    await user.click(createButton);

    // Fill form
    await user.type(screen.getByLabelText(/contract name/i), 'New Test Contract');
    await user.type(screen.getByLabelText(/vendor/i), 'Test Vendor');
    await user.type(screen.getByLabelText(/amount/i), '2000');

    // Submit form
    const submitButton = screen.getByText(/create/i);
    await user.click(submitButton);

    // Mutation should be called
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        name: 'New Test Contract',
        vendor: 'Test Vendor',
        amount: '2000',
      })
    );
  });

  it('should edit an existing contract', async () => {
    const { useQuery, useMutation } = require('@tanstack/react-query');

    useQuery.mockReturnValue({
      data: mockContracts,
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
    renderWithQueryClient(<ContractManagement />);

    // Find and click edit button for first contract
    const editButtons = screen.getAllByText(/edit/i);
    await user.click(editButtons[0]);

    // Edit form should be open with pre-filled data
    const nameInput = screen.getByDisplayValue('Office Lease Agreement');
    expect(nameInput).toBeInTheDocument();

    // Update the name
    await user.clear(nameInput);
    await user.type(nameInput, 'Updated Office Lease');

    // Submit changes
    const saveButton = screen.getByText(/save/i);
    await user.click(saveButton);

    // Mutation should be called with updated data
    expect(mockMutate).toHaveBeenCalledWith(
      expect.objectContaining({
        id: mockContracts[0].id,
        name: 'Updated Office Lease',
      })
    );
  });

  it('should delete a contract', async () => {
    const { useQuery, useMutation } = require('@tanstack/react-query');

    useQuery.mockReturnValue({
      data: mockContracts,
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
    renderWithQueryClient(<ContractManagement />);

    // Find and click delete button
    const deleteButtons = screen.getAllByText(/delete/i);
    await user.click(deleteButtons[0]);

    // Confirmation dialog should appear
    expect(screen.getByText(/are you sure/i)).toBeInTheDocument();

    // Confirm deletion
    const confirmButton = screen.getByText(/confirm/i);
    await user.click(confirmButton);

    // Delete mutation should be called
    expect(mockMutate).toHaveBeenCalledWith(mockContracts[0].id);
  });

  it('should handle form validation errors', async () => {
    const { useQuery, useMutation } = require('@tanstack/react-query');

    useQuery.mockReturnValue({
      data: mockContracts,
      isLoading: false,
      error: null,
    });

    useMutation.mockReturnValue({
      mutate: jest.fn(),
      isPending: false,
      error: null,
    });

    const user = userEvent.setup();
    renderWithQueryClient(<ContractManagement />);

    // Open create dialog
    const createButton = screen.getByText(/create contract/i);
    await user.click(createButton);

    // Try to submit empty form
    const submitButton = screen.getByText(/create/i);
    await user.click(submitButton);

    // Validation errors should be displayed
    expect(screen.getByText(/name is required/i)).toBeInTheDocument();
    expect(screen.getByText(/vendor is required/i)).toBeInTheDocument();
  });

  it('should display contract status badges', () => {
    const { useQuery } = require('@tanstack/react-query');
    useQuery.mockReturnValue({
      data: mockContracts,
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<ContractManagement />);

    // Check for status badges
    expect(screen.getByText('Active')).toBeInTheDocument();
    expect(screen.getByText('Pending')).toBeInTheDocument();
  });

  it('should sort contracts by different criteria', async () => {
    const { useQuery } = require('@tanstack/react-query');
    useQuery.mockReturnValue({
      data: mockContracts,
      isLoading: false,
      error: null,
    });

    const user = userEvent.setup();
    renderWithQueryClient(<ContractManagement />);

    // Find sort dropdown
    const sortDropdown = screen.getByLabelText(/sort by/i);
    await user.click(sortDropdown);

    // Select sort by amount
    const amountOption = screen.getByText(/amount/i);
    await user.click(amountOption);

    // Contracts should be reordered (implementation depends on actual component)
    const contractElements = screen.getAllByTestId(/contract-item/i);
    expect(contractElements.length).toBe(mockContracts.length);
  });

  it('should handle empty contract list', () => {
    const { useQuery } = require('@tanstack/react-query');
    useQuery.mockReturnValue({
      data: [],
      isLoading: false,
      error: null,
    });

    renderWithQueryClient(<ContractManagement />);

    expect(screen.getByText(/no contracts found/i)).toBeInTheDocument();
  });
});