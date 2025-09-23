import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { upload, extractAndProcessContract } from "./services/documentProcessor.js";
import { generateASC842Schedule, generateIFRS16Schedule, generateJournalEntries, calculatePresentValue } from "./services/complianceCalculator.js";
import { generateAIRecommendations } from "./services/openai.js";
import { insertContractSchema, insertDocumentSchema, insertComplianceScheduleSchema, insertJournalEntrySchema } from "@shared/schema";
import type { MulterRequest } from "./types/multer.js";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const userId = "user-1"; // In real app, get from session
      
      const contracts = await storage.getContracts(userId);
      const activeContracts = contracts.filter(c => c.status === 'Active');
      
      const pendingPayments = contracts
        .filter(c => new Date(c.nextPayment) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
        .reduce((sum, c) => sum + parseFloat(c.amount), 0);
      
      res.json({
        activeContracts: activeContracts.length,
        pendingPayments,
        complianceScore: 98
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Contract management
  app.get("/api/contracts", async (req, res) => {
    try {
      const userId = "user-1";
      const contracts = await storage.getContracts(userId);
      res.json(contracts);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/contracts", async (req, res) => {
    try {
      const validated = insertContractSchema.parse(req.body);
      validated.userId = "user-1";
      const contract = await storage.createContract(validated);
      res.status(201).json(contract);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  app.get("/api/contracts/:id", async (req, res) => {
    try {
      const contract = await storage.getContract(req.params.id);
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }
      res.json(contract);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Document upload and processing
  app.post("/api/documents/upload", upload.single('document'), async (req: MulterRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const userId = "user-1";
      
      // Create document record
      const documentData = {
        filename: req.file.filename,
        originalName: req.file.originalname,
        mimeType: req.file.mimetype,
        size: req.file.size,
        uploadPath: req.file.path,
        processingStatus: "processing",
        userId
      };

      const document = await storage.createDocument(documentData);

      // Process document in background
      const processingResult = await extractAndProcessContract(req.file.path, req.file.mimetype);
      
      // Update document with processing results
      await storage.updateDocument(document.id, {
        extractedData: processingResult.contractData,
        processingStatus: processingResult.processingStatus
      });

      // Create contract from extracted data if successful
      if (processingResult.contractData && processingResult.processingStatus === 'completed') {
        const contractData = {
          name: processingResult.contractData.contractName,
          vendor: processingResult.contractData.vendor,
          type: processingResult.contractData.contractType,
          paymentTerms: processingResult.contractData.paymentTerms,
          nextPayment: new Date(processingResult.contractData.nextPaymentDate),
          amount: processingResult.contractData.amount.toString(),
          status: "Active",
          documentId: document.id,
          userId
        };

        await storage.createContract(contractData);
      }

      res.status(201).json({
        document,
        processingResult
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/documents", async (req, res) => {
    try {
      const userId = "user-1";
      const documents = await storage.getDocuments(userId);
      res.json(documents);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Compliance schedules
  app.post("/api/contracts/:contractId/compliance/:type", async (req, res) => {
    try {
      const { contractId, type } = req.params;
      const contract = await storage.getContract(contractId);
      
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }

      const amount = parseFloat(contract.amount);
      const discountRate = req.body.discountRate || 0.05;
      const leaseTerm = req.body.leaseTerm || 5;
      const annualPayment = req.body.annualPayment || (amount / leaseTerm);

      let scheduleData;
      let presentValue = 0;

      if (type === 'ASC842') {
        scheduleData = generateASC842Schedule(amount, annualPayment, leaseTerm, discountRate);
        presentValue = calculatePresentValue(
          scheduleData.map(s => s.leasePayment),
          discountRate, // Use annual discount rate for annual payments
          scheduleData.map((_, i) => i + 1)
        );
      } else if (type === 'IFRS16') {
        scheduleData = generateIFRS16Schedule(amount, annualPayment, leaseTerm, discountRate);
        presentValue = calculatePresentValue(
          scheduleData.map(s => s.leasePayment),
          discountRate,
          scheduleData.map((_, i) => i + 1)
        );
      } else {
        return res.status(400).json({ message: "Invalid compliance type. Use ASC842 or IFRS16" });
      }

      const complianceSchedule = await storage.createComplianceSchedule({
        contractId,
        type,
        scheduleData: scheduleData,
        presentValue: presentValue.toString(),
        discountRate: discountRate.toString()
      });

      // Generate payment records for each schedule period
      const userId = "user-1";
      const createdPayments = [];
      
      if (type === 'ASC842') {
        for (const scheduleItem of scheduleData as any[]) {
          const payment = await storage.createPayment({
            contractId,
            amount: scheduleItem.leasePayment.toString(),
            dueDate: new Date(scheduleItem.paymentDate),
            status: new Date(scheduleItem.paymentDate) <= new Date() ? 'Due' : 'Scheduled',
            userId
          });
          createdPayments.push(payment);
        }
      } else if (type === 'IFRS16') {
        for (let i = 0; i < (scheduleData as any[]).length; i++) {
          const scheduleItem = (scheduleData as any[])[i];
          const dueDate = new Date();
          dueDate.setFullYear(dueDate.getFullYear() + i + 1);
          
          const payment = await storage.createPayment({
            contractId,
            amount: scheduleItem.leasePayment.toString(),
            dueDate,
            status: dueDate <= new Date() ? 'Due' : 'Scheduled',
            userId
          });
          createdPayments.push(payment);
        }
      }

      res.status(201).json({
        schedule: complianceSchedule,
        data: scheduleData,
        presentValue,
        paymentsCreated: createdPayments.length
      });
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/contracts/:contractId/compliance", async (req, res) => {
    try {
      const schedules = await storage.getComplianceSchedules(req.params.contractId);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Journal entries
  app.post("/api/contracts/:contractId/journal-entries", async (req, res) => {
    try {
      const { contractId } = req.params;
      const contract = await storage.getContract(contractId);
      
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }

      const { scheduleType } = req.body;
      const generatedEntries = generateJournalEntries(contract, scheduleType);

      const journalEntries = [];
      for (const entryData of generatedEntries) {
        const entry = await storage.createJournalEntry({
          contractId,
          entryDate: new Date(entryData.entryDate),
          description: entryData.description,
          debitAccount: entryData.debitAccount,
          creditAccount: entryData.creditAccount,
          amount: entryData.amount.toString(),
          reference: entryData.reference,
          userId: "user-1"
        });
        journalEntries.push(entry);
      }

      res.status(201).json(journalEntries);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.get("/api/contracts/:contractId/journal-entries", async (req, res) => {
    try {
      const entries = await storage.getJournalEntries(req.params.contractId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Global compliance schedules
  app.get("/api/compliance-schedules", async (req, res) => {
    try {
      const userId = "user-1";
      const schedules = await storage.getAllComplianceSchedules(userId);
      res.json(schedules);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Global journal entries
  app.get("/api/journal-entries", async (req, res) => {
    try {
      const userId = "user-1";
      const entries = await storage.getAllJournalEntries(userId);
      res.json(entries);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // Payment tracking
  app.get("/api/payments", async (req, res) => {
    try {
      const userId = "user-1";
      const payments = await storage.getPayments(userId);
      res.json(payments);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/payments/:paymentId/mark-paid", async (req, res) => {
    try {
      const { paymentId } = req.params;
      const payment = await storage.markPaymentPaid(paymentId);
      res.json(payment);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/contracts/:contractId/payments", async (req, res) => {
    try {
      const { contractId } = req.params;
      const contract = await storage.getContract(contractId);
      
      if (!contract) {
        return res.status(404).json({ message: "Contract not found" });
      }

      // Generate payment schedule based on contract terms
      const payments = [];
      const amount = parseFloat(contract.amount);
      const baseDate = new Date(contract.nextPayment);
      
      let paymentAmount;
      let numPayments;
      
      if (contract.paymentTerms === 'Monthly') {
        paymentAmount = amount / 12;
        numPayments = 12;
      } else if (contract.paymentTerms === 'Quarterly') {
        paymentAmount = amount / 4;
        numPayments = 4;
      } else if (contract.paymentTerms === 'Annually') {
        paymentAmount = amount;
        numPayments = 1;
      } else {
        return res.status(400).json({ message: "Invalid payment terms" });
      }
      
      for (let i = 0; i < Math.min(numPayments * 2, 24); i++) {
        const dueDate = new Date(baseDate);
        
        if (contract.paymentTerms === 'Monthly') {
          dueDate.setMonth(dueDate.getMonth() + i);
        } else if (contract.paymentTerms === 'Quarterly') {
          dueDate.setMonth(dueDate.getMonth() + (i * 3));
        } else if (contract.paymentTerms === 'Annually') {
          dueDate.setFullYear(dueDate.getFullYear() + i);
        }
        
        const payment = await storage.createPayment({
          contractId,
          amount: paymentAmount.toString(),
          dueDate,
          status: i === 0 && dueDate <= new Date() ? 'Due' : 'Scheduled',
          userId: "user-1"
        });
        
        payments.push(payment);
      }
      
      res.status(201).json(payments);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });



  // AI recommendations
  app.get("/api/recommendations", async (req, res) => {
    try {
      const userId = "user-1";
      
      // Generate fresh recommendations
      const contracts = await storage.getContracts(userId);
      
      const upcomingPayments = contracts.filter(c => 
        new Date(c.nextPayment) <= new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      );

      const aiRecommendations = await generateAIRecommendations({
        recentContracts: contracts.slice(0, 5),
        upcomingPayments
      });

      // Store recommendations
      for (const rec of aiRecommendations) {
        await storage.createAIRecommendation({
          userId,
          type: rec.type,
          title: rec.title,
          description: rec.description,
          actionUrl: '',
          priority: rec.priority,
          isRead: false
        });
      }

      const storedRecommendations = await storage.getAIRecommendations(userId);
      res.json(storedRecommendations);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // User profile
  app.get("/api/user/profile", async (req, res) => {
    try {
      const user = await storage.getUser("user-1");
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      const { password, ...userProfile } = user;
      res.json(userProfile);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
