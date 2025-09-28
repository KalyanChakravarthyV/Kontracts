import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import DocumentUpload from '../../../client/src/components/DocumentUpload';

// Mock the fetch API
global.fetch = jest.fn();

// Mock URL.createObjectURL
global.URL.createObjectURL = jest.fn().mockReturnValue('mock-url');

// Mock file reader
global.FileReader = class MockFileReader {
  readAsDataURL = jest.fn();
  readAsText = jest.fn();
  result = null;
  onload = null;
  onerror = null;
} as any;

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

describe('DocumentUpload Component', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('should render upload interface', () => {
    renderWithQueryClient(<DocumentUpload />);

    expect(screen.getByText(/upload document/i)).toBeInTheDocument();
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /browse files/i })).toBeInTheDocument();
  });

  it('should accept file drop', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<DocumentUpload />);

    const dropZone = screen.getByTestId('upload-dropzone');
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

    // Mock the drop event
    Object.defineProperty(file, 'size', { value: 1024 * 1024 }); // 1MB

    fireEvent.drop(dropZone, {
      dataTransfer: {
        files: [file],
      },
    });

    await waitFor(() => {
      expect(screen.getByText('test.pdf')).toBeInTheDocument();
    });
  });

  it('should handle file selection via browse button', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<DocumentUpload />);

    const fileInput = screen.getByLabelText(/choose file/i);
    const file = new File(['test content'], 'contract.pdf', { type: 'application/pdf' });

    await user.upload(fileInput, file);

    expect(screen.getByText('contract.pdf')).toBeInTheDocument();
  });

  it('should validate file types', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<DocumentUpload />);

    const fileInput = screen.getByLabelText(/choose file/i);
    const invalidFile = new File(['test'], 'test.txt', { type: 'text/plain' });

    await user.upload(fileInput, invalidFile);

    expect(screen.getByText(/unsupported file type/i)).toBeInTheDocument();
  });

  it('should validate file size', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<DocumentUpload />);

    const fileInput = screen.getByLabelText(/choose file/i);
    const largeFile = new File(['x'.repeat(50 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' });

    await user.upload(fileInput, largeFile);

    expect(screen.getByText(/file too large/i)).toBeInTheDocument();
  });

  it('should show upload progress', async () => {
    // Mock useMutation to return pending state
    jest.doMock('@tanstack/react-query', () => ({
      ...jest.requireActual('@tanstack/react-query'),
      useMutation: jest.fn().mockReturnValue({
        mutate: jest.fn(),
        isPending: true,
        error: null,
      }),
    }));

    const user = userEvent.setup();
    renderWithQueryClient(<DocumentUpload />);

    const fileInput = screen.getByLabelText(/choose file/i);
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

    await user.upload(fileInput, file);

    // Click upload button
    const uploadButton = screen.getByRole('button', { name: /upload/i });
    await user.click(uploadButton);

    expect(screen.getByText(/uploading/i)).toBeInTheDocument();
    expect(screen.getByRole('progressbar')).toBeInTheDocument();
  });

  it('should handle successful upload', async () => {
    const mockMutate = jest.fn();
    jest.doMock('@tanstack/react-query', () => ({
      ...jest.requireActual('@tanstack/react-query'),
      useMutation: jest.fn().mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        isSuccess: true,
        error: null,
      }),
    }));

    const user = userEvent.setup();
    renderWithQueryClient(<DocumentUpload />);

    const fileInput = screen.getByLabelText(/choose file/i);
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

    await user.upload(fileInput, file);

    const uploadButton = screen.getByRole('button', { name: /upload/i });
    await user.click(uploadButton);

    expect(screen.getByText(/upload successful/i)).toBeInTheDocument();
  });

  it('should handle upload error', async () => {
    const mockMutate = jest.fn();
    jest.doMock('@tanstack/react-query', () => ({
      ...jest.requireActual('@tanstack/react-query'),
      useMutation: jest.fn().mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        isSuccess: false,
        error: new Error('Upload failed'),
      }),
    }));

    const user = userEvent.setup();
    renderWithQueryClient(<DocumentUpload />);

    const fileInput = screen.getByLabelText(/choose file/i);
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

    await user.upload(fileInput, file);

    const uploadButton = screen.getByRole('button', { name: /upload/i });
    await user.click(uploadButton);

    expect(screen.getByText(/upload failed/i)).toBeInTheDocument();
  });

  it('should support multiple file formats', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<DocumentUpload />);

    const fileInput = screen.getByLabelText(/choose file/i);

    // Test PDF
    const pdfFile = new File(['pdf content'], 'test.pdf', { type: 'application/pdf' });
    await user.upload(fileInput, pdfFile);
    expect(screen.getByText('test.pdf')).toBeInTheDocument();

    // Clear and test Word document
    const clearButton = screen.getByRole('button', { name: /clear/i });
    await user.click(clearButton);

    const docxFile = new File(['docx content'], 'test.docx', {
      type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
    await user.upload(fileInput, docxFile);
    expect(screen.getByText('test.docx')).toBeInTheDocument();
  });

  it('should show file preview information', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<DocumentUpload />);

    const fileInput = screen.getByLabelText(/choose file/i);
    const file = new File(['test content'], 'contract.pdf', { type: 'application/pdf' });
    Object.defineProperty(file, 'size', { value: 1024 * 500 }); // 500KB

    await user.upload(fileInput, file);

    expect(screen.getByText('contract.pdf')).toBeInTheDocument();
    expect(screen.getByText(/500/)).toBeInTheDocument(); // File size
    expect(screen.getByText(/pdf/i)).toBeInTheDocument(); // File type
  });

  it('should allow file removal before upload', async () => {
    const user = userEvent.setup();
    renderWithQueryClient(<DocumentUpload />);

    const fileInput = screen.getByLabelText(/choose file/i);
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

    await user.upload(fileInput, file);
    expect(screen.getByText('test.pdf')).toBeInTheDocument();

    const removeButton = screen.getByRole('button', { name: /remove/i });
    await user.click(removeButton);

    expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
  });

  it('should handle drag events properly', async () => {
    renderWithQueryClient(<DocumentUpload />);

    const dropZone = screen.getByTestId('upload-dropzone');

    // Test drag enter
    fireEvent.dragEnter(dropZone);
    expect(dropZone).toHaveClass('drag-over');

    // Test drag leave
    fireEvent.dragLeave(dropZone);
    expect(dropZone).not.toHaveClass('drag-over');

    // Test drag over
    fireEvent.dragOver(dropZone, { preventDefault: jest.fn() });
    expect(dropZone).toHaveClass('drag-over');
  });

  it('should display extracted data after successful upload', async () => {
    const mockExtractedData = {
      vendor: 'Test Vendor',
      amount: 1500,
      terms: '12 months',
      type: 'Service Agreement'
    };

    const mockMutate = jest.fn();
    jest.doMock('@tanstack/react-query', () => ({
      ...jest.requireActual('@tanstack/react-query'),
      useMutation: jest.fn().mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        isSuccess: true,
        data: {
          extractedData: mockExtractedData
        },
        error: null,
      }),
    }));

    const user = userEvent.setup();
    renderWithQueryClient(<DocumentUpload />);

    const fileInput = screen.getByLabelText(/choose file/i);
    const file = new File(['test content'], 'contract.pdf', { type: 'application/pdf' });

    await user.upload(fileInput, file);

    const uploadButton = screen.getByRole('button', { name: /upload/i });
    await user.click(uploadButton);

    // Should display extracted data
    expect(screen.getByText('Test Vendor')).toBeInTheDocument();
    expect(screen.getByText('$1500')).toBeInTheDocument();
    expect(screen.getByText('12 months')).toBeInTheDocument();
    expect(screen.getByText('Service Agreement')).toBeInTheDocument();
  });

  it('should reset form after successful upload', async () => {
    const mockMutate = jest.fn();
    jest.doMock('@tanstack/react-query', () => ({
      ...jest.requireActual('@tanstack/react-query'),
      useMutation: jest.fn().mockReturnValue({
        mutate: mockMutate,
        isPending: false,
        isSuccess: true,
        error: null,
      }),
    }));

    const user = userEvent.setup();
    renderWithQueryClient(<DocumentUpload />);

    const fileInput = screen.getByLabelText(/choose file/i);
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' });

    await user.upload(fileInput, file);

    const uploadButton = screen.getByRole('button', { name: /upload/i });
    await user.click(uploadButton);

    // After successful upload, form should reset
    await waitFor(() => {
      expect(screen.queryByText('test.pdf')).not.toBeInTheDocument();
    });

    expect(screen.getByText(/drag and drop/i)).toBeInTheDocument();
  });
});