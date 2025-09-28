import { describe, it, expect } from '@jest/globals';

describe('Contract Validation Tests', () => {
  interface Contract {
    id?: string;
    name: string;
    vendor: string;
    type: string;
    amount: string;
    status?: string;
    userId: string;
    documentId?: string;
    createdAt?: string;
  }

  // Validation functions
  function validateContract(contract: Partial<Contract>): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!contract.name || contract.name.toString().trim().length === 0) {
      errors.push('Contract name is required');
    }

    if (!contract.vendor || contract.vendor.toString().trim().length === 0) {
      errors.push('Vendor is required');
    }

    if (!contract.type || contract.type.toString().trim().length === 0) {
      errors.push('Contract type is required');
    }

    if (!contract.amount || contract.amount.toString().trim().length === 0) {
      errors.push('Amount is required');
    } else {
      const amount = parseFloat(contract.amount.toString());
      if (isNaN(amount) || amount <= 0) {
        errors.push('Amount must be a positive number');
      }
    }

    if (!contract.userId || contract.userId.toString().trim().length === 0) {
      errors.push('User ID is required');
    }

    const validTypes = ['Lease Agreement', 'Service Agreement', 'Software License', 'Equipment Rental'];
    if (contract.type && !validTypes.includes(contract.type.toString().trim())) {
      errors.push('Invalid contract type');
    }

    const validStatuses = ['Active', 'Pending', 'Expired', 'Cancelled'];
    if (contract.status && !validStatuses.includes(contract.status.toString().trim())) {
      errors.push('Invalid contract status');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  function sanitizeContract(contract: Partial<Contract>): Contract {
    return {
      name: contract.name?.toString().trim() || '',
      vendor: contract.vendor?.toString().trim() || '',
      type: contract.type?.toString().trim() || '',
      amount: contract.amount?.toString().trim() || '',
      status: contract.status?.toString().trim() || 'Pending',
      userId: contract.userId?.toString().trim() || '',
      documentId: contract.documentId?.toString().trim(),
      createdAt: contract.createdAt || new Date().toISOString()
    };
  }

  describe('Contract Validation', () => {
    it('should validate a complete valid contract', () => {
      const contract = {
        name: 'Office Lease Agreement',
        vendor: 'Property Management Co',
        type: 'Lease Agreement',
        amount: '5000',
        status: 'Active',
        userId: 'user-123'
      };

      const result = validateContract(contract);

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject contract with missing required fields', () => {
      const contract = {
        name: '',
        vendor: '',
        type: '',
        amount: '',
        userId: ''
      };

      const result = validateContract(contract);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Contract name is required');
      expect(result.errors).toContain('Vendor is required');
      expect(result.errors).toContain('Contract type is required');
      expect(result.errors).toContain('Amount is required');
      expect(result.errors).toContain('User ID is required');
    });

    it('should reject contract with invalid amount', () => {
      const contract = {
        name: 'Test Contract',
        vendor: 'Test Vendor',
        type: 'Service Agreement',
        amount: 'invalid',
        userId: 'user-123'
      };

      const result = validateContract(contract);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Amount must be a positive number');
    });

    it('should reject contract with negative amount', () => {
      const contract = {
        name: 'Test Contract',
        vendor: 'Test Vendor',
        type: 'Service Agreement',
        amount: '-1000',
        userId: 'user-123'
      };

      const result = validateContract(contract);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Amount must be a positive number');
    });

    it('should reject contract with invalid type', () => {
      const contract = {
        name: 'Test Contract',
        vendor: 'Test Vendor',
        type: 'Invalid Type',
        amount: '1000',
        userId: 'user-123'
      };

      const result = validateContract(contract);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid contract type');
    });

    it('should reject contract with invalid status', () => {
      const contract = {
        name: 'Test Contract',
        vendor: 'Test Vendor',
        type: 'Service Agreement',
        amount: '1000',
        status: 'Invalid Status',
        userId: 'user-123'
      };

      const result = validateContract(contract);

      expect(result.isValid).toBe(false);
      expect(result.errors).toContain('Invalid contract status');
    });

    it('should handle whitespace in inputs', () => {
      const contract = {
        name: '  Office Lease  ',
        vendor: '  Property Co  ',
        type: '  Lease Agreement  ',
        amount: '  5000  ',
        userId: '  user-123  '
      };

      const result = validateContract(contract);

      // Debug: print errors if validation fails
      if (!result.isValid) {
        console.log('Validation errors:', result.errors);
      }

      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });
  });

  describe('Contract Sanitization', () => {
    it('should sanitize contract data', () => {
      const contract = {
        name: '  Office Lease  ',
        vendor: '  Property Co  ',
        type: '  Lease Agreement  ',
        amount: '  5000  ',
        userId: '  user-123  '
      };

      const sanitized = sanitizeContract(contract);

      expect(sanitized.name).toBe('Office Lease');
      expect(sanitized.vendor).toBe('Property Co');
      expect(sanitized.type).toBe('Lease Agreement');
      expect(sanitized.amount).toBe('5000');
      expect(sanitized.userId).toBe('user-123');
      expect(sanitized.status).toBe('Pending');
      expect(sanitized.createdAt).toBeDefined();
    });

    it('should provide default values for optional fields', () => {
      const contract = {
        name: 'Test Contract',
        vendor: 'Test Vendor',
        type: 'Service Agreement',
        amount: '1000',
        userId: 'user-123'
      };

      const sanitized = sanitizeContract(contract);

      expect(sanitized.status).toBe('Pending');
      expect(sanitized.createdAt).toBeDefined();
      expect(sanitized.documentId).toBeUndefined();
    });
  });

  describe('Business Logic Validation', () => {
    it('should validate lease terms', () => {
      function validateLeaseTerms(amount: number, term: number, discountRate: number): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];

        if (amount <= 0) {
          errors.push('Lease amount must be positive');
        }

        if (term <= 0 || term > 600) { // Max 50 years
          errors.push('Lease term must be between 1 and 600 months');
        }

        if (discountRate < 0 || discountRate > 50) {
          errors.push('Discount rate must be between 0% and 50%');
        }

        return {
          isValid: errors.length === 0,
          errors
        };
      }

      // Valid lease terms
      expect(validateLeaseTerms(5000, 60, 3.5).isValid).toBe(true);

      // Invalid lease terms
      expect(validateLeaseTerms(-5000, 60, 3.5).isValid).toBe(false);
      expect(validateLeaseTerms(5000, -60, 3.5).isValid).toBe(false);
      expect(validateLeaseTerms(5000, 60, -3.5).isValid).toBe(false);
      expect(validateLeaseTerms(5000, 60, 100).isValid).toBe(false);
    });

    it('should validate contract dates', () => {
      function validateContractDates(startDate: string, endDate: string): { isValid: boolean; errors: string[] } {
        const errors: string[] = [];
        const start = new Date(startDate);
        const end = new Date(endDate);

        if (isNaN(start.getTime())) {
          errors.push('Invalid start date');
        }

        if (isNaN(end.getTime())) {
          errors.push('Invalid end date');
        }

        if (start >= end) {
          errors.push('End date must be after start date');
        }

        const yearsDiff = (end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24 * 365);
        if (yearsDiff > 100) {
          errors.push('Contract term cannot exceed 100 years');
        }

        return {
          isValid: errors.length === 0,
          errors
        };
      }

      // Valid dates
      expect(validateContractDates('2024-01-01', '2025-01-01').isValid).toBe(true);

      // Invalid dates
      expect(validateContractDates('invalid', '2025-01-01').isValid).toBe(false);
      expect(validateContractDates('2024-01-01', 'invalid').isValid).toBe(false);
      expect(validateContractDates('2025-01-01', '2024-01-01').isValid).toBe(false);
      expect(validateContractDates('1900-01-01', '2100-01-01').isValid).toBe(false);
    });
  });
});