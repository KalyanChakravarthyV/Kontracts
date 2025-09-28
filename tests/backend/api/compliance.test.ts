import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../../server/routes.js';
import { storage } from '../../../server/storage.js';
import { mockComplianceSchedules } from '../../mocks/database.js';

jest.mock('../../../server/storage.js');
jest.mock('../../../server/services/complianceCalculator.js', () => ({
  generateASC842Schedule: jest.fn().mockReturnValue([
    {
      period: 1,
      payment: 5000,
      interest: 831.25,
      principal: 4168.75,
      balance: 280831.25
    }
  ]),
  generateIFRS16Schedule: jest.fn().mockReturnValue([
    {
      period: 1,
      payment: 5000,
      interest: 831.25,
      principal: 4168.75,
      balance: 280831.25
    }
  ]),
  calculatePresentValue: jest.fn().mockReturnValue(285000)
}));

describe('Compliance API Routes', () => {
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

  describe('GET /api/compliance/schedules', () => {
    it('should return all compliance schedules for user', async () => {
      (storage.getComplianceSchedules as jest.Mock).mockResolvedValue(mockComplianceSchedules);

      const response = await request(app)
        .get('/api/compliance/schedules')
        .expect(200);

      expect(response.body).toEqual(mockComplianceSchedules);
      expect(storage.getComplianceSchedules).toHaveBeenCalledWith('user-1');
    });
  });

  describe('POST /api/compliance/generate-schedule', () => {
    it('should generate ASC842 compliance schedule', async () => {
      const scheduleData = {
        contractId: 'test-contract-1',
        type: 'ASC842',
        leaseAmount: 5000,
        leaseTerm: 60,
        discountRate: 3.5
      };

      const mockSchedule = {
        id: 'new-schedule-1',
        ...scheduleData,
        userId: 'user-1',
        presentValue: 285000,
        schedule: [
          {
            period: 1,
            payment: 5000,
            interest: 831.25,
            principal: 4168.75,
            balance: 280831.25
          }
        ]
      };

      (storage.createComplianceSchedule as jest.Mock).mockResolvedValue(mockSchedule);

      const response = await request(app)
        .post('/api/compliance/generate-schedule')
        .send(scheduleData)
        .expect(201);

      expect(response.body).toEqual(mockSchedule);
      expect(storage.createComplianceSchedule).toHaveBeenCalled();
    });

    it('should generate IFRS16 compliance schedule', async () => {
      const scheduleData = {
        contractId: 'test-contract-1',
        type: 'IFRS16',
        leaseAmount: 5000,
        leaseTerm: 60,
        discountRate: 3.5
      };

      const mockSchedule = {
        id: 'new-schedule-1',
        ...scheduleData,
        userId: 'user-1',
        presentValue: 285000,
        schedule: [
          {
            period: 1,
            payment: 5000,
            interest: 831.25,
            principal: 4168.75,
            balance: 280831.25
          }
        ]
      };

      (storage.createComplianceSchedule as jest.Mock).mockResolvedValue(mockSchedule);

      const response = await request(app)
        .post('/api/compliance/generate-schedule')
        .send(scheduleData)
        .expect(201);

      expect(response.body).toEqual(mockSchedule);
    });

    it('should validate required fields', async () => {
      const invalidData = {
        contractId: 'test-contract-1'
        // missing required fields
      };

      const response = await request(app)
        .post('/api/compliance/generate-schedule')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/compliance/schedules/:id', () => {
    it('should return a specific compliance schedule', async () => {
      const schedule = mockComplianceSchedules[0];
      (storage.getComplianceSchedule as jest.Mock).mockResolvedValue(schedule);

      const response = await request(app)
        .get(`/api/compliance/schedules/${schedule.id}`)
        .expect(200);

      expect(response.body).toEqual(schedule);
      expect(storage.getComplianceSchedule).toHaveBeenCalledWith(schedule.id);
    });

    it('should return 404 for non-existent schedule', async () => {
      (storage.getComplianceSchedule as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/compliance/schedules/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/compliance/schedules/:id', () => {
    it('should delete a compliance schedule', async () => {
      (storage.deleteComplianceSchedule as jest.Mock).mockResolvedValue(true);

      await request(app)
        .delete('/api/compliance/schedules/test-schedule-1')
        .expect(204);

      expect(storage.deleteComplianceSchedule).toHaveBeenCalledWith('test-schedule-1');
    });

    it('should return 404 for non-existent schedule', async () => {
      (storage.deleteComplianceSchedule as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/compliance/schedules/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});