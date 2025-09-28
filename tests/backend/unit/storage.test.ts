import { describe, it, expect, beforeEach, afterEach, jest } from '@jest/globals';
import { storage } from '../../../server/storage.js';
import { db } from '../../../server/db.js';
import { mockContracts, mockDocuments, mockComplianceSchedules, mockJournalEntries } from '../../mocks/database.js';

// Mock the database
jest.mock('../../../server/db.js', () => ({
  db: {
    select: jest.fn(),
    insert: jest.fn(),
    update: jest.fn(),
    delete: jest.fn(),
  }
}));

describe('Storage Layer', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('Contract Operations', () => {
    describe('getContracts', () => {
      it('should return all contracts for a user', async () => {
        const mockSelect = {
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue(mockContracts)
        };
        (db.select as jest.Mock).mockReturnValue(mockSelect);

        const result = await storage.getContracts('test-user-1');

        expect(result).toEqual(mockContracts);
        expect(db.select).toHaveBeenCalled();
        expect(mockSelect.from).toHaveBeenCalled();
        expect(mockSelect.where).toHaveBeenCalled();
      });

      it('should return empty array when no contracts found', async () => {
        const mockSelect = {
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue([])
        };
        (db.select as jest.Mock).mockReturnValue(mockSelect);

        const result = await storage.getContracts('test-user-1');

        expect(result).toEqual([]);
      });
    });

    describe('createContract', () => {
      it('should create a new contract', async () => {
        const newContract = {
          name: 'Test Contract',
          vendor: 'Test Vendor',
          type: 'Service Agreement',
          amount: '1000',
          userId: 'test-user-1',
          documentId: 'test-doc-1'
        };

        const createdContract = { id: 'new-contract-1', ...newContract };
        const mockInsert = {
          into: jest.fn().mockReturnThis(),
          values: jest.fn().mockReturnThis(),
          returning: jest.fn().mockResolvedValue([createdContract])
        };
        (db.insert as jest.Mock).mockReturnValue(mockInsert);

        const result = await storage.createContract(newContract);

        expect(result).toEqual(createdContract);
        expect(db.insert).toHaveBeenCalled();
        expect(mockInsert.into).toHaveBeenCalled();
        expect(mockInsert.values).toHaveBeenCalledWith(expect.objectContaining(newContract));
        expect(mockInsert.returning).toHaveBeenCalled();
      });
    });

    describe('updateContract', () => {
      it('should update an existing contract', async () => {
        const contractId = 'test-contract-1';
        const updates = { name: 'Updated Contract Name' };
        const updatedContract = { ...mockContracts[0], ...updates };

        const mockUpdate = {
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          returning: jest.fn().mockResolvedValue([updatedContract])
        };
        (db.update as jest.Mock).mockReturnValue(mockUpdate);

        const result = await storage.updateContract(contractId, updates);

        expect(result).toEqual(updatedContract);
        expect(db.update).toHaveBeenCalled();
        expect(mockUpdate.set).toHaveBeenCalledWith(updates);
        expect(mockUpdate.where).toHaveBeenCalled();
        expect(mockUpdate.returning).toHaveBeenCalled();
      });

      it('should return undefined when contract not found', async () => {
        const mockUpdate = {
          set: jest.fn().mockReturnThis(),
          where: jest.fn().mockReturnThis(),
          returning: jest.fn().mockResolvedValue([])
        };
        (db.update as jest.Mock).mockReturnValue(mockUpdate);

        const result = await storage.updateContract('non-existent', { name: 'Updated' });

        expect(result).toBeUndefined();
      });
    });
  });

  describe('Document Operations', () => {
    describe('getDocuments', () => {
      it('should return all documents for a user', async () => {
        const mockSelect = {
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue(mockDocuments)
        };
        (db.select as jest.Mock).mockReturnValue(mockSelect);

        const result = await storage.getDocuments('test-user-1');

        expect(result).toEqual(mockDocuments);
        expect(db.select).toHaveBeenCalled();
        expect(mockSelect.from).toHaveBeenCalled();
        expect(mockSelect.where).toHaveBeenCalled();
      });
    });

    describe('createDocument', () => {
      it('should create a new document', async () => {
        const newDocument = {
          filename: 'test.pdf',
          originalname: 'test.pdf',
          mimetype: 'application/pdf',
          size: 1024,
          path: '/uploads/test.pdf',
          userId: 'test-user-1',
          extractedData: { vendor: 'Test Vendor' }
        };

        const createdDocument = { id: 'new-doc-1', ...newDocument };
        const mockInsert = {
          into: jest.fn().mockReturnThis(),
          values: jest.fn().mockReturnThis(),
          returning: jest.fn().mockResolvedValue([createdDocument])
        };
        (db.insert as jest.Mock).mockReturnValue(mockInsert);

        const result = await storage.createDocument(newDocument);

        expect(result).toEqual(createdDocument);
        expect(db.insert).toHaveBeenCalled();
        expect(mockInsert.into).toHaveBeenCalled();
        expect(mockInsert.values).toHaveBeenCalledWith(expect.objectContaining(newDocument));
        expect(mockInsert.returning).toHaveBeenCalled();
      });
    });
  });

  describe('Compliance Schedule Operations', () => {
    describe('getComplianceSchedules', () => {
      it('should return all compliance schedules for a contract', async () => {
        const mockSelect = {
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue(mockComplianceSchedules)
        };
        (db.select as jest.Mock).mockReturnValue(mockSelect);

        const result = await storage.getComplianceSchedules('test-contract-1');

        expect(result).toEqual(mockComplianceSchedules);
        expect(db.select).toHaveBeenCalled();
        expect(mockSelect.from).toHaveBeenCalled();
        expect(mockSelect.where).toHaveBeenCalled();
      });
    });

    describe('createComplianceSchedule', () => {
      it('should create a new compliance schedule', async () => {
        const newSchedule = {
          contractId: 'test-contract-1',
          userId: 'test-user-1',
          type: 'ASC842' as const,
          leaseAmount: 5000,
          leaseTerm: 60,
          discountRate: 3.5,
          presentValue: 285000,
          schedule: []
        };

        const createdSchedule = { id: 'new-schedule-1', ...newSchedule };
        const mockInsert = {
          into: jest.fn().mockReturnThis(),
          values: jest.fn().mockReturnThis(),
          returning: jest.fn().mockResolvedValue([createdSchedule])
        };
        (db.insert as jest.Mock).mockReturnValue(mockInsert);

        const result = await storage.createComplianceSchedule(newSchedule);

        expect(result).toEqual(createdSchedule);
        expect(db.insert).toHaveBeenCalled();
        expect(mockInsert.into).toHaveBeenCalled();
        expect(mockInsert.values).toHaveBeenCalledWith(expect.objectContaining(newSchedule));
        expect(mockInsert.returning).toHaveBeenCalled();
      });
    });
  });

  describe('Journal Entry Operations', () => {
    describe('getJournalEntries', () => {
      it('should return all journal entries for a contract', async () => {
        const mockSelect = {
          from: jest.fn().mockReturnThis(),
          where: jest.fn().mockResolvedValue(mockJournalEntries)
        };
        (db.select as jest.Mock).mockReturnValue(mockSelect);

        const result = await storage.getJournalEntries('test-contract-1');

        expect(result).toEqual(mockJournalEntries);
        expect(db.select).toHaveBeenCalled();
        expect(mockSelect.from).toHaveBeenCalled();
        expect(mockSelect.where).toHaveBeenCalled();
      });
    });

    describe('createJournalEntry', () => {
      it('should create a new journal entry', async () => {
        const newEntry = {
          contractId: 'test-contract-1',
          userId: 'test-user-1',
          entryDate: new Date().toISOString(),
          description: 'Test journal entry',
          debitAccount: 'Test Debit',
          creditAccount: 'Test Credit',
          amount: 1000,
          reference: 'Test Reference'
        };

        const createdEntry = { id: 'new-entry-1', ...newEntry };
        const mockInsert = {
          into: jest.fn().mockReturnThis(),
          values: jest.fn().mockReturnThis(),
          returning: jest.fn().mockResolvedValue([createdEntry])
        };
        (db.insert as jest.Mock).mockReturnValue(mockInsert);

        const result = await storage.createJournalEntry(newEntry);

        expect(result).toEqual(createdEntry);
        expect(db.insert).toHaveBeenCalled();
        expect(mockInsert.into).toHaveBeenCalled();
        expect(mockInsert.values).toHaveBeenCalledWith(expect.objectContaining(newEntry));
        expect(mockInsert.returning).toHaveBeenCalled();
      });
    });
  });

  describe('Error Handling', () => {
    it('should handle database errors gracefully', async () => {
      const mockSelect = {
        from: jest.fn().mockReturnThis(),
        where: jest.fn().mockRejectedValue(new Error('Database connection failed'))
      };
      (db.select as jest.Mock).mockReturnValue(mockSelect);

      await expect(storage.getContracts('test-user-1')).rejects.toThrow('Database connection failed');
    });
  });
});