import { type User, type InsertUser, type Contract, type InsertContract, type Document, type InsertDocument, type ComplianceSchedule, type InsertComplianceSchedule, type JournalEntry, type InsertJournalEntry, type UserPet, type InsertUserPet, type AIRecommendation, type InsertAIRecommendation } from "@shared/schema";
import { randomUUID } from "crypto";

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
  createComplianceSchedule(schedule: InsertComplianceSchedule): Promise<ComplianceSchedule>;
  
  // Journal entries
  getJournalEntries(contractId: string): Promise<JournalEntry[]>;
  createJournalEntry(entry: InsertJournalEntry): Promise<JournalEntry>;
  
  
  // User pets
  getUserPets(userId: string): Promise<UserPet[]>;
  createUserPet(pet: InsertUserPet): Promise<UserPet>;
  
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
  private userPets: Map<string, UserPet> = new Map();
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


    // Add sample user pet
    const userPet: UserPet = {
      id: "pet-1",
      userId: "user-1",
      name: "Buddy",
      species: "dog",
      breed: "Golden Retriever",
      age: 3,
      specialRequirements: "Friendly with other dogs",
      createdAt: new Date()
    };
    this.userPets.set(userPet.id, userPet);
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


  async getUserPets(userId: string): Promise<UserPet[]> {
    return Array.from(this.userPets.values()).filter(pet => pet.userId === userId);
  }

  async createUserPet(insertPet: InsertUserPet): Promise<UserPet> {
    const id = randomUUID();
    const pet: UserPet = { 
      ...insertPet, 
      id,
      breed: insertPet.breed || null,
      age: insertPet.age || null,
      specialRequirements: insertPet.specialRequirements || null,
      createdAt: new Date()
    };
    this.userPets.set(id, pet);
    return pet;
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

export const storage = new MemStorage();
