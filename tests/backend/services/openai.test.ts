import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { generateAIRecommendations } from '../../../server/services/openai.js';
import { createMockOpenAI, mockAIRecommendationsResponse } from '../../mocks/openai.js';
import { mockContracts } from '../../mocks/database.js';

// Mock OpenAI
jest.mock('openai', () => ({
  default: jest.fn().mockImplementation(() => createMockOpenAI())
}));

describe('OpenAI Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    process.env.OPENAI_API_KEY = 'test-api-key';
  });

  describe('generateAIRecommendations', () => {
    it('should generate AI recommendations for contracts', async () => {
      const result = await generateAIRecommendations(mockContracts, 'test-user-1');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBeGreaterThan(0);

      // Verify recommendation structure
      result.forEach(recommendation => {
        expect(recommendation).toHaveProperty('type');
        expect(recommendation).toHaveProperty('title');
        expect(recommendation).toHaveProperty('description');
        expect(recommendation).toHaveProperty('priority');
        expect(recommendation).toHaveProperty('contractId');
        expect(recommendation).toHaveProperty('userId');
      });
    });

    it('should handle different contract types', async () => {
      const leaseContract = {
        ...mockContracts[0],
        type: 'Lease Agreement'
      };

      const serviceContract = {
        ...mockContracts[1],
        type: 'Service Agreement'
      };

      const result = await generateAIRecommendations([leaseContract, serviceContract], 'test-user-1');

      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
    });

    it('should handle empty contracts array', async () => {
      const result = await generateAIRecommendations([], 'test-user-1');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });

    it('should handle API errors gracefully', async () => {
      // Mock OpenAI to throw an error
      const mockOpenAI = createMockOpenAI();
      mockOpenAI.chat.completions.create = jest.fn().mockRejectedValue(new Error('API Error'));

      jest.doMock('openai', () => ({
        default: jest.fn().mockImplementation(() => mockOpenAI)
      }));

      await expect(generateAIRecommendations(mockContracts, 'test-user-1'))
        .rejects.toThrow('API Error');
    });

    it('should validate recommendation types', async () => {
      const result = await generateAIRecommendations(mockContracts, 'test-user-1');

      const validTypes = ['cost_optimization', 'compliance', 'risk_management', 'contract_management'];

      result.forEach(recommendation => {
        expect(validTypes).toContain(recommendation.type);
      });
    });

    it('should validate recommendation priorities', async () => {
      const result = await generateAIRecommendations(mockContracts, 'test-user-1');

      const validPriorities = ['low', 'medium', 'high'];

      result.forEach(recommendation => {
        expect(validPriorities).toContain(recommendation.priority);
      });
    });

    it('should include contract context in recommendations', async () => {
      const result = await generateAIRecommendations(mockContracts, 'test-user-1');

      // Recommendations should reference the contracts provided
      const contractIds = mockContracts.map(c => c.id);

      result.forEach(recommendation => {
        expect(contractIds).toContain(recommendation.contractId);
      });
    });

    it('should handle missing API key', async () => {
      delete process.env.OPENAI_API_KEY;

      await expect(generateAIRecommendations(mockContracts, 'test-user-1'))
        .rejects.toThrow();
    });

    it('should generate different recommendations for different users', async () => {
      const result1 = await generateAIRecommendations(mockContracts, 'test-user-1');
      const result2 = await generateAIRecommendations(mockContracts, 'test-user-2');

      expect(result1).toBeDefined();
      expect(result2).toBeDefined();

      // Verify user IDs are different
      result1.forEach(rec => expect(rec.userId).toBe('test-user-1'));
      result2.forEach(rec => expect(rec.userId).toBe('test-user-2'));
    });
  });

  describe('AI Response Parsing', () => {
    it('should parse valid JSON responses', async () => {
      const result = await generateAIRecommendations(mockContracts, 'test-user-1');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
    });

    it('should handle malformed JSON responses', async () => {
      const mockOpenAI = createMockOpenAI();
      mockOpenAI.chat.completions.create = jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: 'Invalid JSON response'
          }
        }]
      });

      jest.doMock('openai', () => ({
        default: jest.fn().mockImplementation(() => mockOpenAI)
      }));

      // Should handle gracefully or throw appropriate error
      await expect(generateAIRecommendations(mockContracts, 'test-user-1'))
        .rejects.toThrow();
    });

    it('should handle empty responses', async () => {
      const mockOpenAI = createMockOpenAI();
      mockOpenAI.chat.completions.create = jest.fn().mockResolvedValue({
        choices: [{
          message: {
            content: JSON.stringify({ recommendations: [] })
          }
        }]
      });

      jest.doMock('openai', () => ({
        default: jest.fn().mockImplementation(() => mockOpenAI)
      }));

      const result = await generateAIRecommendations(mockContracts, 'test-user-1');

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(0);
    });
  });
});