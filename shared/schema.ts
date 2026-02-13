import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  role: text("role").notNull().default("user"),
  subscriptionStatus: text("subscription_status").notNull().default("active"),
  monthlyUsage: integer("monthly_usage").notNull().default(0),
  maxUsage: integer("max_usage").notNull().default(30),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  // Financial Profile
  creditScoreRange: text("credit_score_range"),
  totalRevolvingLimit: integer("total_revolving_limit"),
  totalBalances: integer("total_balances"),
  inquiries: integer("inquiries"),
  derogatoryAccounts: integer("derogatory_accounts"),
  
  // Stripe
  stripeCustomerId: text("stripe_customer_id"),

  // Document Flags
  hasCreditReport: boolean("has_credit_report").default(false),
  hasBankStatement: boolean("has_bank_statement").default(false),

  // AI Analysis Results
  lastAnalysisDate: timestamp("last_analysis_date"),
  analysisSummary: text("analysis_summary"),
  analysisNextSteps: text("analysis_next_steps"),

  // Credit Repair Analysis
  creditRepairData: text("credit_repair_data"),
  lastRepairAnalysisDate: timestamp("last_repair_analysis_date"),
  lastCreditReportText: text("last_credit_report_text"),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull(), // 'user' | 'assistant'
  content: text("content").notNull(),
  attachment: text("attachment"), // 'credit_report' | 'bank_statement'
  mentor: text("mentor"), // mentor name e.g. 'grant_cardone'
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const comments = pgTable("comments", {
  id: serial("id").primaryKey(),
  messageId: integer("message_id").notNull().references(() => messages.id),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  mentor: text("mentor"),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertUserSchema = createInsertSchema(users).omit({ id: true, createdAt: true });
export const insertMessageSchema = createInsertSchema(messages).omit({ id: true, timestamp: true });
export const posts = pgTable("posts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  likes: integer("likes").notNull().default(0),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  requesterId: integer("requester_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const dashboardQuestions = pgTable("dashboard_questions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, timestamp: true });
export const insertPostSchema = createInsertSchema(posts).omit({ id: true, timestamp: true });
export const insertFriendshipSchema = createInsertSchema(friendships).omit({ id: true, createdAt: true });
export const insertDashboardQuestionSchema = createInsertSchema(dashboardQuestions).omit({ id: true, timestamp: true });

export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;
export type Message = typeof messages.$inferSelect;
export type InsertMessage = z.infer<typeof insertMessageSchema>;
export type Comment = typeof comments.$inferSelect;
export type InsertComment = z.infer<typeof insertCommentSchema>;
export type Post = typeof posts.$inferSelect;
export type InsertPost = z.infer<typeof insertPostSchema>;
export type Friendship = typeof friendships.$inferSelect;
export type InsertFriendship = z.infer<typeof insertFriendshipSchema>;
export type DashboardQuestion = typeof dashboardQuestions.$inferSelect;
export type InsertDashboardQuestion = z.infer<typeof insertDashboardQuestionSchema>;
