import { describe, it, expect, beforeAll, afterAll, beforeEach } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../server/routes.js';
import { storage } from '../../server/storage.js';
import { createMockFile } from '../utils/testHelpers.js';

describe('Contract Management Integration Tests', () => {
  let app: express.Application;
  let server: any;
  let createdContractId: string;
  let createdDocumentId: string;

  beforeAll(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
  });

  afterAll(() => {
    if (server) {
      server.close();
    }
  });

  beforeEach(() => {
    // Reset any test data
  });

  describe('Complete Contract Workflow', () => {
    it('should complete the full contract lifecycle', async () => {
      // Step 1: Upload a document
      const uploadResponse = await request(app)
        .post('/api/documents/upload')
        .attach('document', Buffer.from('test contract content'), 'contract.pdf')
        .expect(201);

      expect(uploadResponse.body).toHaveProperty('id');
      expect(uploadResponse.body).toHaveProperty('extractedData');
      createdDocumentId = uploadResponse.body.id;

      // Step 2: Create a contract using the uploaded document
      const contractData = {
        name: 'Integration Test Contract',
        vendor: 'Test Vendor Corp',
        type: 'Service Agreement',
        amount: '2500',
        documentId: createdDocumentId
      };

      const contractResponse = await request(app)
        .post('/api/contracts')
        .send(contractData)
        .expect(201);

      expect(contractResponse.body).toHaveProperty('id');
      expect(contractResponse.body.name).toBe(contractData.name);
      createdContractId = contractResponse.body.id;

      // Step 3: Generate compliance schedule
      const scheduleData = {
        contractId: createdContractId,
        type: 'ASC842',
        leaseAmount: 2500,
        leaseTerm: 24,
        discountRate: 4.0
      };

      const scheduleResponse = await request(app)
        .post('/api/compliance/generate-schedule')
        .send(scheduleData)
        .expect(201);

      expect(scheduleResponse.body).toHaveProperty('id');
      expect(scheduleResponse.body).toHaveProperty('schedule');
      expect(scheduleResponse.body.schedule.length).toBe(24);

      // Step 4: Generate journal entries
      const journalData = {
        contractId: createdContractId,
        setupId: 'default-setup',
        entryDate: new Date().toISOString()
      };

      const journalResponse = await request(app)
        .post('/api/journal-entries/generate')
        .send(journalData)
        .expect(201);

      expect(journalResponse.body).toHaveProperty('entries');
      expect(Array.isArray(journalResponse.body.entries)).toBe(true);

      // Step 5: Generate AI recommendations
      const recommendationsResponse = await request(app)
        .post('/api/ai/recommendations/generate')
        .expect(201);

      expect(recommendationsResponse.body).toHaveProperty('recommendations');
      expect(Array.isArray(recommendationsResponse.body.recommendations)).toBe(true);

      // Step 6: Verify dashboard stats reflect the new contract
      const statsResponse = await request(app)
        .get('/api/dashboard/stats')
        .expect(200);

      expect(statsResponse.body.totalContracts).toBeGreaterThan(0);
      expect(statsResponse.body.activeContracts).toBeGreaterThan(0);
    });

    it('should handle contract updates and maintain data consistency', async () => {
      // Create initial contract
      const initialData = {
        name: 'Update Test Contract',
        vendor: 'Original Vendor',
        type: 'Lease Agreement',
        amount: '3000',
        documentId: createdDocumentId
      };

      const createResponse = await request(app)
        .post('/api/contracts')
        .send(initialData)
        .expect(201);

      const contractId = createResponse.body.id;

      // Update the contract
      const updateData = {
        name: 'Updated Contract Name',
        vendor: 'New Vendor Corp',
        amount: '3500'
      };

      const updateResponse = await request(app)
        .put(`/api/contracts/${contractId}`)
        .send(updateData)
        .expect(200);

      expect(updateResponse.body.name).toBe(updateData.name);
      expect(updateResponse.body.vendor).toBe(updateData.vendor);
      expect(updateResponse.body.amount).toBe(updateData.amount);

      // Verify the updated contract appears in contract list
      const listResponse = await request(app)
        .get('/api/contracts')
        .expect(200);

      const updatedContract = listResponse.body.find((c: any) => c.id === contractId);
      expect(updatedContract).toBeDefined();
      expect(updatedContract.name).toBe(updateData.name);
    });

    it('should handle document processing and contract creation errors gracefully', async () => {
      // Try to create contract with non-existent document
      const invalidContractData = {
        name: 'Invalid Contract',
        vendor: 'Test Vendor',
        type: 'Service Agreement',
        amount: '1000',
        documentId: 'non-existent-doc-id'
      };

      await request(app)
        .post('/api/contracts')
        .send(invalidContractData)
        .expect(400);

      // Try to upload unsupported file type
      await request(app)
        .post('/api/documents/upload')
        .attach('document', Buffer.from('invalid content'), 'test.txt')
        .expect(400);
    });

    it('should maintain referential integrity between entities', async () => {
      // Create contract
      const contractData = {
        name: 'Referential Test Contract',
        vendor: 'Test Vendor',
        type: 'Service Agreement',
        amount: '1500',
        documentId: createdDocumentId
      };

      const contractResponse = await request(app)
        .post('/api/contracts')
        .send(contractData)
        .expect(201);

      const contractId = contractResponse.body.id;

      // Create compliance schedule
      const scheduleData = {
        contractId: contractId,
        type: 'ASC842',
        leaseAmount: 1500,
        leaseTerm: 12,
        discountRate: 3.5
      };

      const scheduleResponse = await request(app)
        .post('/api/compliance/generate-schedule')
        .send(scheduleData)
        .expect(201);

      const scheduleId = scheduleResponse.body.id;

      // Delete contract should cascade to related entities
      await request(app)
        .delete(`/api/contracts/${contractId}`)
        .expect(204);

      // Verify compliance schedule is also deleted
      await request(app)
        .get(`/api/compliance/schedules/${scheduleId}`)
        .expect(404);
    });

    it('should handle concurrent operations safely', async () => {
      const contractData = {
        name: 'Concurrency Test Contract',
        vendor: 'Test Vendor',
        type: 'Service Agreement',
        amount: '2000',
        documentId: createdDocumentId
      };

      // Create multiple contracts concurrently
      const createPromises = Array.from({ length: 5 }, (_, i) =>
        request(app)
          .post('/api/contracts')
          .send({
            ...contractData,
            name: `${contractData.name} ${i + 1}`
          })
      );

      const responses = await Promise.all(createPromises);

      // All should succeed
      responses.forEach(response => {
        expect(response.status).toBe(201);
        expect(response.body).toHaveProperty('id');
      });

      // All should have unique IDs
      const ids = responses.map(r => r.body.id);
      const uniqueIds = new Set(ids);
      expect(uniqueIds.size).toBe(ids.length);
    });
  });

  describe('Data Validation and Error Handling', () => {
    it('should validate required fields across all endpoints', async () => {
      // Contract creation with missing fields
      await request(app)
        .post('/api/contracts')
        .send({})
        .expect(400);

      // Compliance schedule with invalid data
      await request(app)
        .post('/api/compliance/generate-schedule')
        .send({
          contractId: 'invalid-id',
          type: 'INVALID_TYPE'
        })
        .expect(400);

      // Journal entry with missing setup
      await request(app)
        .post('/api/journal-entries/generate')
        .send({})
        .expect(400);
    });

    it('should handle database connection failures gracefully', async () => {
      // Mock database failure
      const originalMethod = storage.getContracts;
      storage.getContracts = jest.fn().mockRejectedValue(new Error('Database unavailable'));

      const response = await request(app)
        .get('/api/contracts')
        .expect(200); // Should return mock data

      // Restore original method
      storage.getContracts = originalMethod;

      // Should return fallback data
      expect(Array.isArray(response.body)).toBe(true);
    });

    it('should handle API rate limiting and timeouts', async () => {
      // This would typically test rate limiting middleware
      // For now, just ensure endpoints respond within reasonable time
      const startTime = Date.now();

      await request(app)
        .get('/api/dashboard/stats')
        .expect(200);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(5000); // Should respond within 5 seconds
    });
  });

  describe('Performance and Load Testing', () => {
    it('should handle multiple simultaneous requests', async () => {
      const requests = Array.from({ length: 10 }, () =>
        request(app).get('/api/dashboard/stats')
      );

      const responses = await Promise.all(requests);

      responses.forEach(response => {
        expect(response.status).toBe(200);
        expect(response.body).toHaveProperty('totalContracts');
      });
    });

    it('should handle large datasets efficiently', async () => {
      // Create multiple contracts to test pagination/filtering
      const contracts = Array.from({ length: 50 }, (_, i) => ({
        name: `Bulk Contract ${i + 1}`,
        vendor: `Vendor ${i + 1}`,
        type: 'Service Agreement',
        amount: '1000',
        documentId: createdDocumentId
      }));

      // Create contracts in batches to avoid overwhelming the system
      const batchSize = 10;
      for (let i = 0; i < contracts.length; i += batchSize) {
        const batch = contracts.slice(i, i + batchSize);
        const promises = batch.map(contract =>
          request(app).post('/api/contracts').send(contract)
        );
        await Promise.all(promises);
      }

      // Test that listing contracts still performs well
      const startTime = Date.now();
      const response = await request(app)
        .get('/api/contracts')
        .expect(200);

      const endTime = Date.now();
      expect(endTime - startTime).toBeLessThan(2000); // Should complete within 2 seconds
      expect(response.body.length).toBeGreaterThan(0);
    });
  });
});