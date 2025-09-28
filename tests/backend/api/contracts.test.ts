import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../../server/routes.js';
import { storage } from '../../../server/storage.js';
import { mockContracts } from '../../mocks/database.js';

// Mock the storage module
jest.mock('../../../server/storage.js', () => ({
  storage: {
    getContracts: jest.fn(),
    getContract: jest.fn(),
    createContract: jest.fn(),
    updateContract: jest.fn(),
    deleteContract: jest.fn(),
    getDashboardStats: jest.fn(),
  }
}));

describe('Contract API Routes', () => {
  let app: express.Application;
  let server: any;

  beforeEach(async () => {
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
    jest.clearAllMocks();
  });

  afterEach(() => {
    if (server) {
      server.close();
    }
  });

  describe('GET /api/dashboard/stats', () => {
    it('should return dashboard statistics', async () => {
      const mockStats = {
        totalContracts: 2,
        activeContracts: 1,
        pendingPayments: 1,
        totalValue: 6200
      };

      (storage.getDashboardStats as jest.Mock).mockResolvedValue(mockStats);

      const response = await request(app)
        .get('/api/dashboard/stats')
        .expect(200);

      expect(response.body).toEqual(mockStats);
    });

    it('should handle database errors gracefully', async () => {
      (storage.getDashboardStats as jest.Mock).mockRejectedValue(new Error('Database error'));

      const response = await request(app)
        .get('/api/dashboard/stats')
        .expect(200);

      // Should return mock data on error
      expect(response.body).toHaveProperty('totalContracts');
      expect(response.body).toHaveProperty('activeContracts');
    });
  });

  describe('GET /api/contracts', () => {
    it('should return all contracts for user', async () => {
      (storage.getContracts as jest.Mock).mockResolvedValue(mockContracts);

      const response = await request(app)
        .get('/api/contracts')
        .expect(200);

      expect(response.body).toEqual(mockContracts);
      expect(storage.getContracts).toHaveBeenCalledWith('user-1');
    });
  });

  describe('POST /api/contracts', () => {
    it('should create a new contract', async () => {
      const newContract = {
        name: 'Test Contract',
        vendor: 'Test Vendor',
        type: 'Service Agreement',
        amount: '1000',
        documentId: 'test-doc-1'
      };

      const createdContract = { id: 'new-contract-1', ...newContract, userId: 'user-1' };
      (storage.createContract as jest.Mock).mockResolvedValue(createdContract);

      const response = await request(app)
        .post('/api/contracts')
        .send(newContract)
        .expect(201);

      expect(response.body).toEqual(createdContract);
      expect(storage.createContract).toHaveBeenCalledWith(expect.objectContaining(newContract));
    });

    it('should validate required fields', async () => {
      const invalidContract = {
        name: 'Test Contract'
        // missing required fields
      };

      const response = await request(app)
        .post('/api/contracts')
        .send(invalidContract)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/contracts/:id', () => {
    it('should update an existing contract', async () => {
      const contractId = 'test-contract-1';
      const updates = {
        name: 'Updated Contract Name',
        amount: '1500'
      };

      const updatedContract = { ...mockContracts[0], ...updates };
      (storage.updateContract as jest.Mock).mockResolvedValue(updatedContract);

      const response = await request(app)
        .put(`/api/contracts/${contractId}`)
        .send(updates)
        .expect(200);

      expect(response.body).toEqual(updatedContract);
      expect(storage.updateContract).toHaveBeenCalledWith(contractId, updates);
    });

    it('should return 404 for non-existent contract', async () => {
      (storage.updateContract as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .put('/api/contracts/non-existent')
        .send({ name: 'Updated Name' })
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/contracts/:id', () => {
    it('should delete a contract', async () => {
      const contractId = 'test-contract-1';
      (storage.deleteContract as jest.Mock).mockResolvedValue(true);

      await request(app)
        .delete(`/api/contracts/${contractId}`)
        .expect(204);

      expect(storage.deleteContract).toHaveBeenCalledWith(contractId);
    });

    it('should return 404 for non-existent contract', async () => {
      (storage.deleteContract as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/contracts/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});