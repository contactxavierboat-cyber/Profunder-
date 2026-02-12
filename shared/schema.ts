import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("user"),
  subscriptionStatus: text("subscription_status").notNull().default("inactive"),
  monthlyUsage: integer("monthly_usage").notNull().default(0),
  maxUsage: integer("max_usage").notNull().default(30),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  // Financial Profile
  creditScoreRange: text("credit_score_range"),
  totalRevolvingLimit: integer("total_revolving_limit"),
  totalBalances: integer("total_balances"),
  inquiries: integer("inquiries"),
  derogatoryAccounts: integer("derogatory_accounts"),
  
  // Document Flags
  hasCreditReport: boolean("has_credit_report").default(false),
  hasBankStatement: boolean("has_bank_statement").default(false),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  attachment: text("attachment"), // 'credit_report' | 'bank_statement'
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, timestamp: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
