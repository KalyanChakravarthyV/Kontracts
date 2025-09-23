import type { Express, Request } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage.js";
import { upload, extractAndProcessContract } from "./services/documentProcessor.js";
import { generateASC842Schedule, generateIFRS16Schedule, generateJournalEntries, calculatePresentValue } from "./services/complianceCalculator.js";
import { generateAIRecommendations, analyzePetFriendlyPlaces } from "./services/openai.js";
import { insertContractSchema, insertDocumentSchema, insertComplianceScheduleSchema, insertJournalEntrySchema } from "@shared/schema";
import type { MulterRequest } from "./types/multer.js";

export async function registerRoutes(app: Express): Promise<Server> {
  
  // Dashboard stats
  app.get("/api/dashboard/stats", async (req, res) => {
    try {
      const userId = "user-1"; // In real app, get from session
      
      const contracts = await storage.getContracts(userId);
      const activeContracts = contracts.filter(c => c.status === 'Active');
      const petFriendlyPlaces = await storage.getPetFriendlyPlaces();
      
      const pendingPayments = contracts
        .filter(c => new Date(c.nextPayment) <= new Date(Date.now() + 30 * 24 * 60 * 60 * 1000))
        .reduce((sum, c) => sum + parseFloat(c.amount), 0);
      
      res.json({
        activeContracts: activeContracts.length,
        petFriendlyPlaces: petFriendlyPlaces.length,
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
      const annualPayment = req.body.annualPayment || amount / leaseTerm;

      let scheduleData;
      let presentValue = 0;

      if (type === 'ASC842') {
        scheduleData = generateASC842Schedule(amount, annualPayment, leaseTerm, discountRate);
        presentValue = calculatePresentValue(
          scheduleData.map(s => s.leasePayment),
          discountRate / 12,
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
        scheduleData: JSON.stringify(scheduleData),
        presentValue: presentValue.toString(),
        discountRate: discountRate.toString()
      });

      res.status(201).json({
        schedule: complianceSchedule,
        data: scheduleData,
        presentValue
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

  // Pet-friendly places
  app.get("/api/pet-friendly-places", async (req, res) => {
    try {
      const { type, location } = req.query;
      const places = await storage.getPetFriendlyPlaces(
        type as string,
        location as string
      );
      res.json(places);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/pet-friendly-places/search", async (req, res) => {
    try {
      const { location, petRequirements } = req.body;
      
      if (!location) {
        return res.status(400).json({ message: "Location is required" });
      }

      const aiPlaces = await analyzePetFriendlyPlaces(location, petRequirements || []);
      
      // Store AI-generated places
      for (const place of aiPlaces) {
        await storage.createPetFriendlyPlace({
          name: place.name,
          type: place.type,
          location: place.location,
          description: place.description,
          rating: place.rating?.toString(),
          priceRange: place.priceRange,
          amenities: JSON.stringify(place.amenities),
          coordinates: JSON.stringify({ lat: 0, lng: 0 }),
          imageUrl: null
        });
      }

      const existingPlaces = await storage.getPetFriendlyPlaces();
      res.json(existingPlaces);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  // User pets
  app.get("/api/user/pets", async (req, res) => {
    try {
      const userId = "user-1";
      const pets = await storage.getUserPets(userId);
      res.json(pets);
    } catch (error) {
      res.status(500).json({ message: (error as Error).message });
    }
  });

  app.post("/api/user/pets", async (req, res) => {
    try {
      const petData = { ...req.body, userId: "user-1" };
      const pet = await storage.createUserPet(petData);
      res.status(201).json(pet);
    } catch (error) {
      res.status(400).json({ message: (error as Error).message });
    }
  });

  // AI recommendations
  app.get("/api/recommendations", async (req, res) => {
    try {
      const userId = "user-1";
      
      // Generate fresh recommendations
      const contracts = await storage.getContracts(userId);
      const pets = await storage.getUserPets(userId);
      
      const upcomingPayments = contracts.filter(c => 
        new Date(c.nextPayment) <= new Date(Date.now() + 60 * 24 * 60 * 60 * 1000)
      );

      const aiRecommendations = await generateAIRecommendations({
        recentContracts: contracts.slice(0, 5),
        upcomingPayments,
        location: "Seattle, WA",
        pets
      });

      // Store recommendations
      for (const rec of aiRecommendations) {
        await storage.createAIRecommendation({
          userId,
          type: rec.type,
          title: rec.title,
          description: rec.description,
          actionUrl: rec.location || '',
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
