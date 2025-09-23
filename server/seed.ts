import { db } from "./db";
import { users, contracts, payments, aiRecommendations } from "@shared/schema";

export async function seedDatabase() {
  console.log("Seeding database...");

  try {
    // Create default user
    const [user] = await db.insert(users).values({
      id: "user-1",
      username: "jane.doe",
      password: "hashed_password",
      name: "Jane Doe",
      role: "Contract Administrator"
    }).onConflictDoNothing().returning();

    console.log("User created:", user?.name || "already exists");

    // Create sample contracts
    const contract1 = await db.insert(contracts).values({
      id: "contract-1",
      name: "Office Lease Agreement",
      vendor: "Metro Properties LLC",
      type: "Real Estate",
      paymentTerms: "Monthly",
      nextPayment: new Date(2024, 0, 15), // Jan 15, 2024
      amount: "120000.00",
      status: "Active",
      documentId: null,
      userId: "user-1"
    }).onConflictDoNothing();

    const contract2 = await db.insert(contracts).values({
      id: "contract-2",
      name: "Equipment Lease",
      vendor: "TechEquip Solutions",
      type: "Equipment",
      paymentTerms: "Quarterly",
      nextPayment: new Date(2024, 2, 1), // Mar 1, 2024
      amount: "85000.00",
      status: "Active",
      documentId: null,
      userId: "user-1"
    }).onConflictDoNothing();

    console.log("Contracts seeded");

    // Create sample payments
    await db.insert(payments).values({
      id: "payment-1",
      contractId: "contract-1",
      amount: "10000.00",
      dueDate: new Date(2024, 11, 15), // Dec 15, 2024
      status: "Scheduled",
      paidDate: null,
      userId: "user-1"
    }).onConflictDoNothing();

    await db.insert(payments).values({
      id: "payment-2",
      contractId: "contract-2",
      amount: "21250.00",
      dueDate: new Date(2024, 11, 1), // Dec 1, 2024
      status: "Scheduled",
      paidDate: null,
      userId: "user-1"
    }).onConflictDoNothing();

    console.log("Payments seeded");

    // Create sample AI recommendations
    await db.insert(aiRecommendations).values({
      id: "rec-1",
      userId: "user-1",
      type: "Payment",
      title: "Payment Due Reminder",
      description: "You have 2 payments due in the next 30 days totaling $31,250. Consider setting up automatic payments to avoid late fees.",
      actionUrl: null,
      priority: "medium",
      isRead: false
    }).onConflictDoNothing();

    await db.insert(aiRecommendations).values({
      id: "rec-2",
      userId: "user-1",
      type: "Contract",
      title: "Contract Review Required",
      description: "Your Office Lease Agreement expires in 6 months. Start renewal negotiations now to secure better rates.",
      actionUrl: null,
      priority: "high",
      isRead: false
    }).onConflictDoNothing();

    console.log("AI recommendations seeded");
    console.log("Database seeding completed successfully!");

  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

// Run seeding
seedDatabase()
  .then(() => {
    console.log("Seeding completed");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seeding failed:", error);
    process.exit(1);
  });