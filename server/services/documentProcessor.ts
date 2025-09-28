import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import mammoth from 'mammoth';
import { extractContractData } from './openai.js';

let pdfParseModule: any = null;

async function getPdfParser() {
  if (!pdfParseModule) {
    // Import only the specific module we need
    pdfParseModule = (await import('pdf-parse/lib/pdf-parse.js')).default;
  }
  return pdfParseModule;
}

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
      try {
        const fileBuffer = await fs.readFile(filePath);
        const pdfParse = await getPdfParser();
        const pdfData = await pdfParse(fileBuffer);
        extractedText = pdfData.text;
      } catch (pdfError) {
        console.warn('PDF parsing failed, using fallback:', pdfError);
        // Fallback to basic text extraction
        const fileBuffer = await fs.readFile(filePath);
        extractedText = fileBuffer.toString('utf8').replace(/[^\x20-\x7E]/g, ' ').substring(0, 2000);
      }
    } else if (mimeType === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
      try {
        const result = await mammoth.extractRawText({ path: filePath });
        extractedText = result.value;
      } catch (docError) {
        console.warn('DOCX parsing failed, using fallback:', docError);
        // Fallback to basic text extraction
        const fileBuffer = await fs.readFile(filePath);
        extractedText = fileBuffer.toString('utf8').replace(/[^\x20-\x7E]/g, ' ').substring(0, 2000);
      }
    } else if (mimeType === 'application/msword') {
      // For older .doc files, fallback to buffer reading (limited support)
      const fileBuffer = await fs.readFile(filePath);
      extractedText = fileBuffer.toString('utf8').replace(/[^\x20-\x7E]/g, ' ').substring(0, 2000);
    } else if (mimeType.includes('excel') || mimeType.includes('sheet')) {
      // For Excel files - basic text extraction (could be improved with xlsx library)
      const fileBuffer = await fs.readFile(filePath);
      extractedText = fileBuffer.toString('utf8').replace(/[^\x20-\x7E]/g, ' ').substring(0, 1000);
    } else {
      // Fallback for other file types
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
    console.log('🔍 Processing document:', filePath, 'Type:', mimeType);
    const documentText = await processDocument(filePath, mimeType);
    console.log('📝 Extracted text length:', documentText.length, 'characters');
    console.log('📝 Text preview:', documentText.substring(0, 200) + '...');

    console.log('🤖 Sending to OpenAI for contract extraction...');
    const contractData = await extractContractData(documentText);
    console.log('✅ Contract data extracted:', contractData);

    return {
      extractedText: documentText,
      contractData,
      processingStatus: 'completed'
    };
  } catch (error) {
    console.error('❌ Document processing failed:', error);
    return {
      extractedText: '',
      contractData: null,
      processingStatus: 'failed',
      error: (error as Error).message
    };
  }
}
