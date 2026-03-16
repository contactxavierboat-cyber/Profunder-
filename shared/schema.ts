import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  username: text("username").unique(),
  phone: text("phone"),
  profilePhoto: text("profile_photo"),
  role: text("role").notNull().default("user"),
  subscriptionStatus: text("subscription_status").notNull().default("active"),
  monthlyUsage: integer("monthly_usage").notNull().default(0),
  maxUsage: integer("max_usage").notNull().default(30),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  
  // Financial Profile
  creditScoreRange: text("credit_score_range"),
  creditScoreExact: integer("credit_score_exact"),
  totalRevolvingLimit: integer("total_revolving_limit"),
  totalBalances: integer("total_balances"),
  inquiries: integer("inquiries"),
  derogatoryAccounts: integer("derogatory_accounts"),
  latePayments: integer("late_payments"),
  collections: integer("collections"),
  openAccounts: integer("open_accounts"),
  closedAccounts: integer("closed_accounts"),
  oldestAccountYears: integer("oldest_account_years"),
  avgAccountAgeYears: integer("avg_account_age_years"),
  publicRecords: integer("public_records"),
  utilizationPercent: integer("utilization_percent"),
  largestRevolvingLimit: integer("largest_revolving_limit"),
  newAccountsLast12Months: integer("new_accounts_last_12_months"),
  inquiriesLast6Months: integer("inquiries_last_6_months"),
  paidCollections: integer("paid_collections"),
  chargeOffs: integer("charge_offs"),
  bankruptcyYearsSinceDischarge: integer("bankruptcy_years_since_discharge"),
  lates30Days12Months: integer("lates_30_days_12_months"),
  lates60Days24Months: integer("lates_60_days_24_months"),
  lates90PlusDays24Months: integer("lates_90_plus_days_24_months"),
  underwritingScore: integer("underwriting_score"),
  riskTier: text("risk_tier"),
  creditQualityScore: integer("credit_quality_score"),
  utilizationExposureScore: integer("utilization_exposure_score"),
  depthStabilityScore: integer("depth_stability_score"),
  velocityRiskScore: integer("velocity_risk_score"),
  velocityRiskData: text("velocity_risk_data"),
  exposureCeiling: integer("exposure_ceiling"),
  remainingSafeCapacity: integer("remaining_safe_capacity"),
  recommendedNewApprovalRange: text("recommended_new_approval_range"),
  approvalProbability: text("approval_probability"),
  primaryDenialTriggers: text("primary_denial_triggers"),
  riskDepartmentNotes: text("risk_department_notes"),
  utilizationLevel: text("utilization_level"),
  paymentPerformance: text("payment_performance"),
  derogatoryStatus: text("derogatory_status"),
  inquiryVelocity: text("inquiry_velocity"),
  creditDepthAssessment: text("credit_depth_assessment"),
  paymentRecency: text("payment_recency"),
  accountMix: text("account_mix"),
  balanceTrend: text("balance_trend"),
  authorizedUserAccounts: integer("authorized_user_accounts"),
  revolvingAccountsOver50Util: integer("revolving_accounts_over_50_util"),
  revolvingAccountsOver75Util: integer("revolving_accounts_over_75_util"),
  zeroBalanceRevolvingAccounts: integer("zero_balance_revolving_accounts"),
  highestSingleCardUtil: integer("highest_single_card_util"),
  totalInstallmentAccounts: integer("total_installment_accounts"),
  totalInstallmentBalance: integer("total_installment_balance"),
  hasMortgage: boolean("has_mortgage"),
  monthsSinceMostRecentLate: integer("months_since_most_recent_late"),
  collectionsBalance: integer("collections_balance"),
  accountsOlderThan5Years: integer("accounts_older_than_5_years"),
  avgOpenAccountAgeYears: integer("avg_open_account_age_years"),
  
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

  // User Address (for dispute letters)
  fullName: text("full_name"),
  streetAddress: text("street_address"),
  city: text("city"),
  state: text("state"),
  zipCode: text("zip_code"),

  // Capital Operating System - Funding Phase
  fundingPhase: text("funding_phase").default("repair"),
  lastPhaseUpdate: timestamp("last_phase_update"),

  // Bureau Health Data (JSON strings)
  bureauHealthData: text("bureau_health_data"),

  // Build Strategy
  avgMonthlyDeposits: integer("avg_monthly_deposits"),
  bankRelationshipYears: integer("bank_relationship_years"),
  targetInstitution: text("target_institution"),

  // Funding Strategy
  lastApplicationWindowCalc: timestamp("last_application_window_calc"),
  optimalWindowDate: timestamp("optimal_window_date"),
  capitalStackData: text("capital_stack_data"),
});

export const messages = pgTable("messages", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  role: text("role").notNull(),
  content: text("content").notNull(),
  attachment: text("attachment"),
  mentor: text("mentor"),
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

export const directMessages = pgTable("direct_messages", {
  id: serial("id").primaryKey(),
  conversationKey: text("conversation_key").notNull(),
  senderId: integer("sender_id").notNull().references(() => users.id),
  receiverId: integer("receiver_id").notNull().references(() => users.id),
  content: text("content").notNull(),
  isAi: boolean("is_ai").default(false),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
});

// Dispute Cases for Repair Engine
export const disputeCases = pgTable("dispute_cases", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  bureau: text("bureau").notNull(),
  accountName: text("account_name").notNull(),
  accountNumber: text("account_number"),
  disputeType: text("dispute_type").notNull(),
  disputeMethod: text("dispute_method").notNull(),
  fcraCitation: text("fcra_citation"),
  status: text("status").notNull().default("draft"),
  letterContent: text("letter_content"),
  sentDate: timestamp("sent_date"),
  reminderDate: timestamp("reminder_date"),
  responseDeadline: timestamp("response_deadline"),
  resolution: text("resolution"),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

// System Alerts for Messaging
export const systemAlerts = pgTable("system_alerts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull().references(() => users.id),
  alertType: text("alert_type").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  severity: text("severity").notNull().default("info"),
  isRead: boolean("is_read").default(false),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

export const communityDataPoints = pgTable("community_data_points", {
  id: serial("id").primaryKey(),
  source: text("source").notNull().default("manual"),
  sourceUrl: text("source_url"),
  sourceReference: text("source_reference"),
  lender: text("lender").notNull(),
  product: text("product"),
  outcome: text("outcome").notNull(),
  limitAmount: integer("limit_amount"),
  apr: text("apr"),
  score: integer("score"),
  scoreBand: text("score_band"),
  income: integer("income"),
  incomeBand: text("income_band"),
  utilization: integer("utilization"),
  inquiryCount: integer("inquiry_count"),
  newAccounts6m: integer("new_accounts_6m"),
  oldestAccountAgeMonths: integer("oldest_account_age_months"),
  avgAccountAgeMonths: integer("avg_account_age_months"),
  bureauPulled: text("bureau_pulled"),
  state: text("state"),
  applicationType: text("application_type").default("personal"),
  businessRevenue: integer("business_revenue"),
  relationshipWithLender: text("relationship_with_lender"),
  derogatoriesPresent: boolean("derogatories_present"),
  rawText: text("raw_text"),
  aiSummary: text("ai_summary"),
  notes: text("notes"),
  confidenceScore: integer("confidence_score"),
  moderationStatus: text("moderation_status").notNull().default("pending"),
  smartTags: text("smart_tags").array(),
  submittedBy: integer("submitted_by").references(() => users.id),
  createdAt: timestamp("created_at").defaultNow().notNull(),
  updatedAt: timestamp("updated_at").defaultNow().notNull(),
});

export const ingestionState = pgTable("ingestion_state", {
  id: serial("id").primaryKey(),
  sourceKey: text("source_key").notNull(),
  lastSeenId: text("last_seen_id"),
  lastFetchedAt: timestamp("last_fetched_at").defaultNow().notNull(),
  metadata: text("metadata"),
});

export const insertCommentSchema = createInsertSchema(comments).omit({ id: true, timestamp: true });
export const insertPostSchema = createInsertSchema(posts).omit({ id: true, timestamp: true });
export const insertFriendshipSchema = createInsertSchema(friendships).omit({ id: true, createdAt: true });
export const insertDashboardQuestionSchema = createInsertSchema(dashboardQuestions).omit({ id: true, timestamp: true });
export const insertDirectMessageSchema = createInsertSchema(directMessages).omit({ id: true, timestamp: true });
export const insertDisputeCaseSchema = createInsertSchema(disputeCases).omit({ id: true, createdAt: true, updatedAt: true });
export const insertSystemAlertSchema = createInsertSchema(systemAlerts).omit({ id: true, createdAt: true });
export const insertCommunityDataPointSchema = createInsertSchema(communityDataPoints).omit({ id: true, createdAt: true, updatedAt: true });

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
export type DirectMessage = typeof directMessages.$inferSelect;
export type InsertDirectMessage = z.infer<typeof insertDirectMessageSchema>;
export type DisputeCase = typeof disputeCases.$inferSelect;
export type InsertDisputeCase = z.infer<typeof insertDisputeCaseSchema>;
export type SystemAlert = typeof systemAlerts.$inferSelect;
export type InsertSystemAlert = z.infer<typeof insertSystemAlertSchema>;
export type CommunityDataPoint = typeof communityDataPoints.$inferSelect;
export type InsertCommunityDataPoint = z.infer<typeof insertCommunityDataPointSchema>;
