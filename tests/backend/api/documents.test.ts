import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import request from 'supertest';
import express from 'express';
import { registerRoutes } from '../../../server/routes.js';
import { storage } from '../../../server/storage.js';
import { mockDocuments } from '../../mocks/database.js';
import { createMockFile } from '../../utils/testHelpers.js';

jest.mock('../../../server/storage.js');
jest.mock('../../../server/services/documentProcessor.js', () => ({
  upload: {
    single: () => (req: any, res: any, next: any) => {
      req.file = createMockFile();
      next();
    }
  },
  extractAndProcessContract: jest.fn().mockResolvedValue({
    vendor: 'Test Vendor',
    amount: 1000,
    terms: '12 months',
    type: 'Service Agreement'
  })
}));

describe('Document API Routes', () => {
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

  describe('GET /api/documents', () => {
    it('should return all documents for user', async () => {
      (storage.getDocuments as jest.Mock).mockResolvedValue(mockDocuments);

      const response = await request(app)
        .get('/api/documents')
        .expect(200);

      expect(response.body).toEqual(mockDocuments);
      expect(storage.getDocuments).toHaveBeenCalledWith('user-1');
    });
  });

  describe('POST /api/documents/upload', () => {
    it('should upload and process a document', async () => {
      const mockDocument = {
        id: 'new-doc-1',
        filename: 'test.pdf',
        originalname: 'test.pdf',
        mimetype: 'application/pdf',
        size: 1024,
        path: '/uploads/test.pdf',
        userId: 'user-1',
        extractedData: {
          vendor: 'Test Vendor',
          amount: 1000,
          terms: '12 months',
          type: 'Service Agreement'
        }
      };

      (storage.createDocument as jest.Mock).mockResolvedValue(mockDocument);

      const response = await request(app)
        .post('/api/documents/upload')
        .attach('document', Buffer.from('test file content'), 'test.pdf')
        .expect(201);

      expect(response.body).toEqual(mockDocument);
      expect(storage.createDocument).toHaveBeenCalled();
    });

    it('should handle upload errors', async () => {
      (storage.createDocument as jest.Mock).mockRejectedValue(new Error('Upload failed'));

      const response = await request(app)
        .post('/api/documents/upload')
        .attach('document', Buffer.from('test file content'), 'test.pdf')
        .expect(500);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/documents/:id', () => {
    it('should return a specific document', async () => {
      const document = mockDocuments[0];
      (storage.getDocument as jest.Mock).mockResolvedValue(document);

      const response = await request(app)
        .get(`/api/documents/${document.id}`)
        .expect(200);

      expect(response.body).toEqual(document);
      expect(storage.getDocument).toHaveBeenCalledWith(document.id);
    });

    it('should return 404 for non-existent document', async () => {
      (storage.getDocument as jest.Mock).mockResolvedValue(null);

      const response = await request(app)
        .get('/api/documents/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });

  describe('DELETE /api/documents/:id', () => {
    it('should delete a document', async () => {
      (storage.deleteDocument as jest.Mock).mockResolvedValue(true);

      await request(app)
        .delete('/api/documents/test-doc-1')
        .expect(204);

      expect(storage.deleteDocument).toHaveBeenCalledWith('test-doc-1');
    });

    it('should return 404 for non-existent document', async () => {
      (storage.deleteDocument as jest.Mock).mockResolvedValue(false);

      const response = await request(app)
        .delete('/api/documents/non-existent')
        .expect(404);

      expect(response.body).toHaveProperty('error');
    });
  });
});