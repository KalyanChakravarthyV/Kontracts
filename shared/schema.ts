import { sql } from "drizzle-orm";
import { pgTable, text, varchar, decimal, timestamp, jsonb, boolean, integer } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  role: text("role").notNull().default("Contract Administrator"),
});

export const contracts = pgTable("contracts", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  vendor: text("vendor").notNull(),
  type: text("type").notNull(),
  paymentTerms: text("payment_terms").notNull(),
  nextPayment: timestamp("next_payment").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  status: text("status").notNull(),
  documentId: varchar("document_id"),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const documents = pgTable("documents", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  filename: text("filename").notNull(),
  originalName: text("original_name").notNull(),
  mimeType: text("mime_type").notNull(),
  size: integer("size").notNull(),
  uploadPath: text("upload_path").notNull(),
  extractedData: jsonb("extracted_data"),
  processingStatus: text("processing_status").notNull().default("pending"),
  userId: varchar("user_id").notNull(),
  uploadedAt: timestamp("uploaded_at").default(sql`now()`),
});

export const complianceSchedules = pgTable("compliance_schedules", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(),
  type: text("type").notNull(), // ASC842 or IFRS16
  scheduleData: jsonb("schedule_data").notNull(),
  presentValue: decimal("present_value", { precision: 12, scale: 2 }),
  discountRate: decimal("discount_rate", { precision: 5, scale: 4 }),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const journalEntries = pgTable("journal_entries", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(),
  entryDate: timestamp("entry_date").notNull(),
  description: text("description").notNull(),
  debitAccount: text("debit_account").notNull(),
  creditAccount: text("credit_account").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  reference: text("reference"),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const journalEntrySetups = pgTable("journal_entry_setups", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  description: text("description"),
  entryType: text("entry_type").notNull(), // 'initial', 'periodic', 'final'
  triggerEvent: text("trigger_event").notNull(), // 'contract_start', 'payment_due', 'period_end'
  debitAccount: text("debit_account").notNull(),
  creditAccount: text("credit_account").notNull(),
  amountColumn: text("amount_column").notNull(), // ASC 842 column reference
  periodReference: text("period_reference").notNull().default("n"), // n, n-1, n+1, etc.
  isActive: boolean("is_active").notNull().default(true),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});



export const payments = pgTable("payments", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  contractId: varchar("contract_id").notNull(),
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  dueDate: timestamp("due_date").notNull(),
  status: text("status").notNull().default("Scheduled"), // Scheduled, Due, Paid, Overdue
  paidDate: timestamp("paid_date"),
  userId: varchar("user_id").notNull(),
  createdAt: timestamp("created_at").default(sql`now()`),
});

export const aiRecommendations = pgTable("ai_recommendations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  type: text("type").notNull(), // travel, contract, payment
  title: text("title").notNull(),
  description: text("description").notNull(),
  actionUrl: text("action_url"),
  priority: text("priority").notNull().default("medium"),
  isRead: boolean("is_read").notNull().default(false),
  createdAt: timestamp("created_at").default(sql`now()`),
});

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
});

export const insertContractSchema = createInsertSchema(contracts).omit({
  id: true,
  createdAt: true,
});

export const insertDocumentSchema = createInsertSchema(documents).omit({
  id: true,
  uploadedAt: true,
});

export const insertComplianceScheduleSchema = createInsertSchema(complianceSchedules).omit({
  id: true,
  createdAt: true,
});

export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({
  id: true,
  createdAt: true,
});

export const insertJournalEntrySetupSchema = createInsertSchema(journalEntrySetups).omit({
  id: true,
  createdAt: true,
});



export const insertPaymentSchema = createInsertSchema(payments).omit({
  id: true,
  createdAt: true,
  paidDate: true,
});

export const updatePaymentSchema = createInsertSchema(payments).omit({
  id: true,
  contractId: true,
  userId: true,
  createdAt: true,
}).partial().extend({
  dueDate: z.string().optional().transform((dateStr) => dateStr ? new Date(dateStr) : undefined)
});

export const insertAIRecommendationSchema = createInsertSchema(aiRecommendations).omit({
  id: true,
  createdAt: true,
});

// Types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertContract = z.infer<typeof insertContractSchema>;
export type Contract = typeof contracts.$inferSelect;

export type InsertDocument = z.infer<typeof insertDocumentSchema>;
export type Document = typeof documents.$inferSelect;

export type InsertComplianceSchedule = z.infer<typeof insertComplianceScheduleSchema>;
export type ComplianceSchedule = typeof complianceSchedules.$inferSelect;

export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;

export type InsertJournalEntrySetup = z.infer<typeof insertJournalEntrySetupSchema>;
export type JournalEntrySetup = typeof journalEntrySetups.$inferSelect;

export type InsertPayment = z.infer<typeof insertPaymentSchema>;
export type UpdatePayment = z.infer<typeof updatePaymentSchema>;
export type Payment = typeof payments.$inferSelect;


export type InsertAIRecommendation = z.infer<typeof insertAIRecommendationSchema>;
export type AIRecommendation = typeof aiRecommendations.$inferSelect;
