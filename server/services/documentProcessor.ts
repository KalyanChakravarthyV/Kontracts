import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { extractContractData } from './openai.js';

const storage = multer.diskStorage({
  destination: async (req: any, file: any, cb: any) => {
    const uploadDir = path.join(process.cwd(), 'uploads');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error, '');
    }
  },
  filename: (req: any, file: any, cb: any) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, file.fieldname + '-' + uniqueSuffix + path.extname(file.originalname));
  }
});

export const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req: any, file: any, cb: any) => {
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    ];
    
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, Word, and Excel files are allowed.'));
    }
  }
});

export async function processDocument(filePath: string, mimeType: string): Promise<string> {
  try {
    let extractedText = '';

    if (mimeType === 'application/pdf') {
      // For PDF processing, we'll use a simple text extraction
      // In a real implementation, you'd use pdf-parse or similar
      const fileBuffer = await fs.readFile(filePath);
      extractedText = fileBuffer.toString('utf8', 0, Math.min(1000, fileBuffer.length));
    } else if (mimeType.includes('word')) {
      // For Word documents, similar approach
      const fileBuffer = await fs.readFile(filePath);
      extractedText = fileBuffer.toString('utf8', 0, Math.min(1000, fileBuffer.length));
    } else if (mimeType.includes('excel') || mimeType.includes('sheet')) {
      // For Excel files
      const fileBuffer = await fs.readFile(filePath);
      extractedText = fileBuffer.toString('utf8', 0, Math.min(1000, fileBuffer.length));
    }

    return extractedText;
  } catch (error) {
    throw new Error(`Failed to process document: ${(error as Error).message}`);
  }
}

export async function extractAndProcessContract(filePath: string, mimeType: string) {
  try {
    const documentText = await processDocument(filePath, mimeType);
    const contractData = await extractContractData(documentText);
    
    return {
      extractedText: documentText,
      contractData,
      processingStatus: 'completed'
    };
  } catch (error) {
    return {
      extractedText: '',
      contractData: null,
      processingStatus: 'failed',
      error: (error as Error).message
    };
  }
}
