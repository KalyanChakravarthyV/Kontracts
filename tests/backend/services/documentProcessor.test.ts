import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { extractAndProcessContract } from '../../../server/services/documentProcessor.js';
import { createMockFile } from '../../utils/testHelpers.js';
import { createMockOpenAI } from '../../mocks/openai.js';

// Mock external dependencies
jest.mock('fs/promises');
jest.mock('pdf-parse');
jest.mock('mammoth');
jest.mock('xlsx');
jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => createMockOpenAI())
}));

describe('Document Processor Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('extractAndProcessContract', () => {
    it('should process PDF files correctly', async () => {
      const mockFile = createMockFile({
        mimetype: 'application/pdf',
        filename: 'contract.pdf',
        path: '/tmp/contract.pdf'
      });

      // Mock pdf-parse
      const { default: pdfParse } = await import('pdf-parse');
      (pdfParse as jest.Mock).mockResolvedValue({
        text: 'Contract with Test Vendor for $5000 monthly payments for 12 months'
      });

      const result = await extractAndProcessContract(mockFile);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('vendor');
      expect(result).toHaveProperty('amount');
      expect(result).toHaveProperty('terms');
      expect(result).toHaveProperty('type');
    });

    it('should process Word documents correctly', async () => {
      const mockFile = createMockFile({
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        filename: 'contract.docx',
        path: '/tmp/contract.docx'
      });

      // Mock mammoth
      const mammoth = await import('mammoth');
      (mammoth.extractRawText as jest.Mock).mockResolvedValue({
        value: 'Service Agreement with ABC Corp for $1200 monthly for 24 months'
      });

      const result = await extractAndProcessContract(mockFile);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('vendor');
      expect(result).toHaveProperty('amount');
      expect(result).toHaveProperty('terms');
      expect(result).toHaveProperty('type');
    });

    it('should process Excel files correctly', async () => {
      const mockFile = createMockFile({
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: 'contract.xlsx',
        path: '/tmp/contract.xlsx'
      });

      // Mock XLSX
      const XLSX = await import('xlsx');
      (XLSX.readFile as jest.Mock).mockReturnValue({
        SheetNames: ['Sheet1'],
        Sheets: {
          Sheet1: {
            'A1': { v: 'Vendor' },
            'B1': { v: 'ABC Corp' },
            'A2': { v: 'Amount' },
            'B2': { v: 1500 },
            'A3': { v: 'Terms' },
            'B3': { v: '12 months' }
          }
        }
      });
      (XLSX.utils.sheet_to_csv as jest.Mock).mockReturnValue(
        'Vendor,ABC Corp\nAmount,1500\nTerms,12 months'
      );

      const result = await extractAndProcessContract(mockFile);

      expect(result).toBeDefined();
      expect(result).toHaveProperty('vendor');
      expect(result).toHaveProperty('amount');
      expect(result).toHaveProperty('terms');
      expect(result).toHaveProperty('type');
    });

    it('should handle unsupported file types', async () => {
      const mockFile = createMockFile({
        mimetype: 'text/plain',
        filename: 'contract.txt',
        path: '/tmp/contract.txt'
      });

      await expect(extractAndProcessContract(mockFile)).rejects.toThrow('Unsupported file type');
    });

    it('should handle file read errors', async () => {
      const mockFile = createMockFile({
        mimetype: 'application/pdf',
        filename: 'contract.pdf',
        path: '/tmp/nonexistent.pdf'
      });

      // Mock fs.readFile to throw error
      const fs = await import('fs/promises');
      (fs.readFile as jest.Mock).mockRejectedValue(new Error('File not found'));

      await expect(extractAndProcessContract(mockFile)).rejects.toThrow('File not found');
    });

    it('should handle PDF parsing errors', async () => {
      const mockFile = createMockFile({
        mimetype: 'application/pdf',
        filename: 'corrupted.pdf',
        path: '/tmp/corrupted.pdf'
      });

      // Mock pdf-parse to throw error
      const { default: pdfParse } = await import('pdf-parse');
      (pdfParse as jest.Mock).mockRejectedValue(new Error('Invalid PDF'));

      await expect(extractAndProcessContract(mockFile)).rejects.toThrow('Invalid PDF');
    });

    it('should handle OpenAI API errors', async () => {
      const mockFile = createMockFile({
        mimetype: 'application/pdf',
        filename: 'contract.pdf',
        path: '/tmp/contract.pdf'
      });

      const { default: pdfParse } = await import('pdf-parse');
      (pdfParse as jest.Mock).mockResolvedValue({
        text: 'Contract text'
      });

      // Mock OpenAI to throw error
      const mockOpenAI = createMockOpenAI();
      mockOpenAI.chat.completions.create = jest.fn().mockRejectedValue(new Error('API Error'));

      jest.doMock('openai', () => ({
        default: jest.fn().mockImplementation(() => mockOpenAI)
      }));

      await expect(extractAndProcessContract(mockFile)).rejects.toThrow('API Error');
    });

    it('should handle empty file content', async () => {
      const mockFile = createMockFile({
        mimetype: 'application/pdf',
        filename: 'empty.pdf',
        path: '/tmp/empty.pdf'
      });

      const { default: pdfParse } = await import('pdf-parse');
      (pdfParse as jest.Mock).mockResolvedValue({
        text: ''
      });

      await expect(extractAndProcessContract(mockFile)).rejects.toThrow();
    });

    it('should extract specific contract data correctly', async () => {
      const mockFile = createMockFile({
        mimetype: 'application/pdf',
        filename: 'lease-agreement.pdf',
        path: '/tmp/lease-agreement.pdf'
      });

      const { default: pdfParse } = await import('pdf-parse');
      (pdfParse as jest.Mock).mockResolvedValue({
        text: 'Lease Agreement between Landlord and Tenant for office space at $5000 per month for 60 months starting January 1, 2024'
      });

      const result = await extractAndProcessContract(mockFile);

      expect(result).toBeDefined();
      expect(typeof result.vendor).toBe('string');
      expect(typeof result.amount).toBe('number');
      expect(typeof result.terms).toBe('string');
      expect(typeof result.type).toBe('string');
    });

    it('should validate extracted data structure', async () => {
      const mockFile = createMockFile({
        mimetype: 'application/pdf',
        filename: 'contract.pdf',
        path: '/tmp/contract.pdf'
      });

      const { default: pdfParse } = await import('pdf-parse');
      (pdfParse as jest.Mock).mockResolvedValue({
        text: 'Valid contract text'
      });

      const result = await extractAndProcessContract(mockFile);

      // Verify all required fields are present
      expect(result).toHaveProperty('vendor');
      expect(result).toHaveProperty('amount');
      expect(result).toHaveProperty('terms');
      expect(result).toHaveProperty('type');

      // Verify data types
      expect(typeof result.vendor).toBe('string');
      expect(typeof result.amount).toBe('number');
      expect(typeof result.terms).toBe('string');
      expect(typeof result.type).toBe('string');
    });

    it('should handle Word document with complex formatting', async () => {
      const mockFile = createMockFile({
        mimetype: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        filename: 'complex-contract.docx',
        path: '/tmp/complex-contract.docx'
      });

      const mammoth = await import('mammoth');
      (mammoth.extractRawText as jest.Mock).mockResolvedValue({
        value: 'EQUIPMENT LEASE AGREEMENT\n\nThis agreement is between XYZ Leasing Corp and Customer for equipment lease at $2500 monthly for 36 months with 4% annual interest rate.'
      });

      const result = await extractAndProcessContract(mockFile);

      expect(result).toBeDefined();
      expect(result.vendor).toBeTruthy();
      expect(result.amount).toBeGreaterThan(0);
      expect(result.terms).toBeTruthy();
      expect(result.type).toBeTruthy();
    });

    it('should handle Excel with multiple sheets', async () => {
      const mockFile = createMockFile({
        mimetype: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        filename: 'multi-sheet-contract.xlsx',
        path: '/tmp/multi-sheet-contract.xlsx'
      });

      const XLSX = await import('xlsx');
      (XLSX.readFile as jest.Mock).mockReturnValue({
        SheetNames: ['Summary', 'Details', 'Terms'],
        Sheets: {
          Summary: {
            'A1': { v: 'Contract Summary' },
            'A2': { v: 'Vendor: Tech Solutions Inc' },
            'A3': { v: 'Monthly Cost: $3000' },
            'A4': { v: 'Duration: 24 months' }
          }
        }
      });
      (XLSX.utils.sheet_to_csv as jest.Mock).mockReturnValue(
        'Contract Summary\nVendor: Tech Solutions Inc\nMonthly Cost: $3000\nDuration: 24 months'
      );

      const result = await extractAndProcessContract(mockFile);

      expect(result).toBeDefined();
      expect(result.vendor).toBeTruthy();
      expect(result.amount).toBeGreaterThan(0);
    });
  });
});