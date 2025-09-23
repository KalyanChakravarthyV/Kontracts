import { type User, type InsertUser, type Contract, type InsertContract, type Document, type InsertDocument, type ComplianceSchedule, type InsertComplianceSchedule, type JournalEntry, type InsertJournalEntry, type Payment, type InsertPayment, type UpdatePayment, type AIRecommendation, type InsertAIRecommendation, users, contracts, documents, complianceSchedules, journalEntries, payments, aiRecommendations } from "@shared/schema";
import { randomUUID } from "crypto";
import { db } from "./db";
import { eq, and } from "drizzle-orm";

export interface IStorage {
  // User management
  getUser(id: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Contract management
  getContracts(userId: string): Promise<Contract[]>;
  getContract(id: string): Promise<Contract | undefined>;
  createContract(contract: InsertContract): Promise<Contract>;
  updateContract(id: string, updates: Partial<Contract>): Promise<Contract | undefined>;
  
  // Document management
  getDocuments(userId: string): Promise<Document[]>;
  getDocument(id: string): Promise<Document | undefined>;
  createDocument(document: InsertDocument): Promise<Document>;
  updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined>;
  
  // Compliance schedules
  getComplianceSchedules(contractId: string): Promise<ComplianceSchedule[]>;
  getAllComplianceSchedules(userId: string): Promise<ComplianceSchedule[]>;
  createComplianceSchedule(schedule: InsertComplianceSchedule): Promise<ComplianceSchedule>;
  
  // Journal entries
  getJournalEntries(contractId: string): Promise<JournalEntry[]>;
  getAllJournalEntries(userId: string): Promise<JournalEntry[]>;
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  
  // Payments
  getPayments(userId: string): Promise<Payment[]>;
  createPayment(payment: InsertPayment): Promise<Payment>;
  updatePayment(paymentId: string, updates: UpdatePayment): Promise<Payment | undefined>;
  markPaymentPaid(paymentId: string): Promise<Payment | undefined>;
  
  
  
  // AI recommendations
  getAIRecommendations(userId: string): Promise<AIRecommendation[]>;
  createAIRecommendation(recommendation: InsertAIRecommendation): Promise<AIRecommendation>;
}

export class MemStorage implements IStorage {
  private users: Map<string, User> = new Map();
  private contracts: Map<string, Contract> = new Map();
  private documents: Map<string, Document> = new Map();
  private complianceSchedules: Map<string, ComplianceSchedule> = new Map();
  private journalEntries: Map<string, JournalEntry> = new Map();
  private payments: Map<string, Payment> = new Map();
  private aiRecommendations: Map<string, AIRecommendation> = new Map();

  constructor() {
    this.seedData();
  }

  private seedData() {
    // Create a default user
    const defaultUser: User = {
      id: "user-1",
      username: "jane.doe",
      password: "hashed_password",
      name: "Jane Doe",
      role: "Contract Administrator"
    };
    this.users.set(defaultUser.id, defaultUser);


    // Add sample contracts for testing
    const contract1: Contract = {
      id: "contract-1",
      name: "Office Lease Agreement",
      vendor: "Metro Properties LLC",
      type: "Real Estate",
      paymentTerms: "Monthly",
      nextPayment: new Date(2024, 0, 15), // Jan 15, 2024
      amount: "120000.00",
      status: "Active",
      documentId: null,
      userId: "user-1",
      createdAt: new Date()
    };
    this.contracts.set(contract1.id, contract1);

    const contract2: Contract = {
      id: "contract-2", 
      name: "Equipment Lease",
      vendor: "TechEquip Solutions",
      type: "Equipment",
      paymentTerms: "Quarterly",
      nextPayment: new Date(2024, 2, 1), // Mar 1, 2024
      amount: "85000.00",
      status: "Active",
      documentId: null,
      userId: "user-1",
      createdAt: new Date()
    };
    this.contracts.set(contract2.id, contract2);

  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(user => user.username === username);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser,
      id,
      role: insertUser.role || "Contract Administrator"
    };
    this.users.set(id, user);
    return user;
  }

  async getContracts(userId: string): Promise<Contract[]> {
    return Array.from(this.contracts.values()).filter(contract => contract.userId === userId);
  }

  async getContract(id: string): Promise<Contract | undefined> {
    return this.contracts.get(id);
  }

  async createContract(insertContract: InsertContract): Promise<Contract> {
    const id = randomUUID();
    const contract: Contract = { 
      ...insertContract, 
      id,
      documentId: insertContract.documentId || null,
      createdAt: new Date()
    };
    this.contracts.set(id, contract);
    return contract;
  }

  async updateContract(id: string, updates: Partial<Contract>): Promise<Contract | undefined> {
    const contract = this.contracts.get(id);
    if (!contract) return undefined;
    
    const updatedContract = { ...contract, ...updates };
    this.contracts.set(id, updatedContract);
    return updatedContract;
  }

  async getDocuments(userId: string): Promise<Document[]> {
    return Array.from(this.documents.values()).filter(doc => doc.userId === userId);
  }

  async getDocument(id: string): Promise<Document | undefined> {
    return this.documents.get(id);
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const id = randomUUID();
    const document: Document = { 
      ...insertDocument, 
      id,
      extractedData: insertDocument.extractedData || null,
      processingStatus: insertDocument.processingStatus || "pending",
      uploadedAt: new Date()
    };
    this.documents.set(id, document);
    return document;
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined> {
    const document = this.documents.get(id);
    if (!document) return undefined;
    
    const updatedDocument = { ...document, ...updates };
    this.documents.set(id, updatedDocument);
    return updatedDocument;
  }

  async getComplianceSchedules(contractId: string): Promise<ComplianceSchedule[]> {
    return Array.from(this.complianceSchedules.values()).filter(schedule => schedule.contractId === contractId);
  }

  async createComplianceSchedule(insertSchedule: InsertComplianceSchedule): Promise<ComplianceSchedule> {
    const id = randomUUID();
    const schedule: ComplianceSchedule = { 
      ...insertSchedule, 
      id,
      presentValue: insertSchedule.presentValue || null,
      discountRate: insertSchedule.discountRate || null,
      createdAt: new Date()
    };
    this.complianceSchedules.set(id, schedule);
    return schedule;
  }

  async getJournalEntries(contractId: string): Promise<JournalEntry[]> {
    return Array.from(this.journalEntries.values()).filter(entry => entry.contractId === contractId);
  }

  async createJournalEntry(insertEntry: InsertJournalEntry): Promise<JournalEntry> {
    const id = randomUUID();
    const entry: JournalEntry = { 
      ...insertEntry, 
      id,
      reference: insertEntry.reference || null,
      createdAt: new Date()
    };
    this.journalEntries.set(id, entry);
    return entry;
  }

  async getAllComplianceSchedules(userId: string): Promise<ComplianceSchedule[]> {
    const userContracts = Array.from(this.contracts.values()).filter(
      contract => contract.userId === userId
    );
    const contractIds = new Set(userContracts.map(contract => contract.id));
    
    return Array.from(this.complianceSchedules.values()).filter(
      schedule => contractIds.has(schedule.contractId)
    );
  }

  async getAllJournalEntries(userId: string): Promise<JournalEntry[]> {
    return Array.from(this.journalEntries.values()).filter(
      entry => entry.userId === userId
    );
  }

  async getPayments(userId: string): Promise<Payment[]> {
    return Array.from(this.payments.values()).filter(
      payment => payment.userId === userId
    );
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const id = randomUUID();
    const payment: Payment = {
      ...insertPayment,
      id,
      status: insertPayment.status || 'Scheduled',
      paidDate: null,
      createdAt: new Date()
    };
    this.payments.set(id, payment);
    return payment;
  }

  async updatePayment(paymentId: string, updates: UpdatePayment): Promise<Payment | undefined> {
    const payment = this.payments.get(paymentId);
    if (payment) {
      const updatedPayment = {
        ...payment,
        ...updates,
        // Preserve core fields that shouldn't be updated
        id: payment.id,
        contractId: payment.contractId,
        userId: payment.userId,
        createdAt: payment.createdAt
      };
      this.payments.set(paymentId, updatedPayment);
      return updatedPayment;
    }
    return undefined;
  }

  async markPaymentPaid(paymentId: string): Promise<Payment | undefined> {
    const payment = this.payments.get(paymentId);
    if (payment) {
      const updatedPayment = {
        ...payment,
        status: 'Paid',
        paidDate: new Date()
      };
      this.payments.set(paymentId, updatedPayment);
      return updatedPayment;
    }
    return undefined;
  }



  async getAIRecommendations(userId: string): Promise<AIRecommendation[]> {
    return Array.from(this.aiRecommendations.values()).filter(rec => rec.userId === userId);
  }

  async createAIRecommendation(insertRecommendation: InsertAIRecommendation): Promise<AIRecommendation> {
    const id = randomUUID();
    const recommendation: AIRecommendation = { 
      ...insertRecommendation, 
      id,
      actionUrl: insertRecommendation.actionUrl || null,
      priority: insertRecommendation.priority || "medium",
      isRead: insertRecommendation.isRead || false,
      createdAt: new Date()
    };
    this.aiRecommendations.set(id, recommendation);
    return recommendation;
  }
}

// Database Storage Implementation
export class DatabaseStorage implements IStorage {
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async getContracts(userId: string): Promise<Contract[]> {
    return await db.select().from(contracts).where(eq(contracts.userId, userId));
  }

  async getContract(id: string): Promise<Contract | undefined> {
    const [contract] = await db.select().from(contracts).where(eq(contracts.id, id));
    return contract || undefined;
  }

  async createContract(insertContract: InsertContract): Promise<Contract> {
    const [contract] = await db
      .insert(contracts)
      .values(insertContract)
      .returning();
    return contract;
  }

  async updateContract(id: string, updates: Partial<Contract>): Promise<Contract | undefined> {
    const [updatedContract] = await db
      .update(contracts)
      .set(updates)
      .where(eq(contracts.id, id))
      .returning();
    return updatedContract || undefined;
  }

  async getDocuments(userId: string): Promise<Document[]> {
    return await db.select().from(documents).where(eq(documents.userId, userId));
  }

  async getDocument(id: string): Promise<Document | undefined> {
    const [document] = await db.select().from(documents).where(eq(documents.id, id));
    return document || undefined;
  }

  async createDocument(insertDocument: InsertDocument): Promise<Document> {
    const [document] = await db
      .insert(documents)
      .values(insertDocument)
      .returning();
    return document;
  }

  async updateDocument(id: string, updates: Partial<Document>): Promise<Document | undefined> {
    const [updatedDocument] = await db
      .update(documents)
      .set(updates)
      .where(eq(documents.id, id))
      .returning();
    return updatedDocument || undefined;
  }

  async getComplianceSchedules(contractId: string): Promise<ComplianceSchedule[]> {
    return await db.select().from(complianceSchedules).where(eq(complianceSchedules.contractId, contractId));
  }

  async getAllComplianceSchedules(userId: string): Promise<ComplianceSchedule[]> {
    // Join with contracts to filter by user
    return await db
      .select({
        id: complianceSchedules.id,
        contractId: complianceSchedules.contractId,
        type: complianceSchedules.type,
        scheduleData: complianceSchedules.scheduleData,
        presentValue: complianceSchedules.presentValue,
        discountRate: complianceSchedules.discountRate,
        createdAt: complianceSchedules.createdAt
      })
      .from(complianceSchedules)
      .innerJoin(contracts, eq(complianceSchedules.contractId, contracts.id))
      .where(eq(contracts.userId, userId));
  }

  async createComplianceSchedule(insertSchedule: InsertComplianceSchedule): Promise<ComplianceSchedule> {
    const [schedule] = await db
      .insert(complianceSchedules)
      .values(insertSchedule)
      .returning();
    return schedule;
  }

  async getJournalEntries(contractId: string): Promise<JournalEntry[]> {
    return await db.select().from(journalEntries).where(eq(journalEntries.contractId, contractId));
  }

  async getAllJournalEntries(userId: string): Promise<JournalEntry[]> {
    return await db.select().from(journalEntries).where(eq(journalEntries.userId, userId));
  }

  async createJournalEntry(insertEntry: InsertJournalEntry): Promise<JournalEntry> {
    const [entry] = await db
      .insert(journalEntries)
      .values(insertEntry)
      .returning();
    return entry;
  }

  async getPayments(userId: string): Promise<Payment[]> {
    return await db.select().from(payments).where(eq(payments.userId, userId));
  }

  async createPayment(insertPayment: InsertPayment): Promise<Payment> {
    const [payment] = await db
      .insert(payments)
      .values(insertPayment)
      .returning();
    return payment;
  }

  async updatePayment(paymentId: string, updates: UpdatePayment): Promise<Payment | undefined> {
    const [updatedPayment] = await db
      .update(payments)
      .set(updates)
      .where(eq(payments.id, paymentId))
      .returning();
    return updatedPayment || undefined;
  }

  async markPaymentPaid(paymentId: string): Promise<Payment | undefined> {
    const [updatedPayment] = await db
      .update(payments)
      .set({ 
        status: 'Paid',
        paidDate: new Date()
      })
      .where(eq(payments.id, paymentId))
      .returning();
    return updatedPayment || undefined;
  }

  async getAIRecommendations(userId: string): Promise<AIRecommendation[]> {
    return await db.select().from(aiRecommendations).where(eq(aiRecommendations.userId, userId));
  }

  async createAIRecommendation(insertRecommendation: InsertAIRecommendation): Promise<AIRecommendation> {
    const [recommendation] = await db
      .insert(aiRecommendations)
      .values(insertRecommendation)
      .returning();
    return recommendation;
  }
}

// Create database storage instance
export const storage = new DatabaseStorage();
