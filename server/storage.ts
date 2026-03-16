import { users, messages, comments, posts, friendships, dashboardQuestions, directMessages, disputeCases, systemAlerts, communityDataPoints, type User, type InsertUser, type Message, type InsertMessage, type Comment, type InsertComment, type Post, type InsertPost, type Friendship, type DashboardQuestion, type InsertDashboardQuestion, type DirectMessage, type InsertDirectMessage, type DisputeCase, type InsertDisputeCase, type SystemAlert, type InsertSystemAlert, type CommunityDataPoint, type InsertCommunityDataPoint } from "@shared/schema";
import { db } from "./db";
import { eq, count, desc, or, and, ne, ilike, isNull, sql, asc, gte, lte, inArray } from "drizzle-orm";

export async function incrementMonthlyUsage(userId: number): Promise<void> {
  await db.update(users).set({ monthlyUsage: sql`${users.monthlyUsage} + 1` }).where(eq(users.id, userId));
}

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, data: Partial<User>): Promise<User>;
  
  getMessages(userId: number): Promise<Message[]>;
  createMessage(message: InsertMessage): Promise<Message>;
  clearMessages(userId: number): Promise<void>;

  getComments(messageId: number): Promise<Comment[]>;
  getCommentsByUser(userId: number): Promise<Comment[]>;
  createComment(comment: InsertComment): Promise<Comment>;
  getUserCount(): Promise<number>;
  getRecentPosts(limit: number): Promise<Post[]>;
  createPost(post: InsertPost): Promise<Post>;
  getRandomBotUserIds(count: number): Promise<number[]>;
  
  sendFriendRequest(requesterId: number, receiverId: number): Promise<Friendship>;
  acceptFriendRequest(friendshipId: number, userId: number): Promise<Friendship>;
  addTeamMember(requesterId: number, receiverId: number): Promise<Friendship>;
  rejectFriendRequest(friendshipId: number, userId: number): Promise<void>;
  removeFriend(friendshipId: number, userId: number): Promise<void>;
  getFriends(userId: number): Promise<{ friendship: Friendship; friend: User }[]>;
  getPendingRequests(userId: number): Promise<{ friendship: Friendship; requester: User }[]>;
  getSentPendingRequests(userId: number): Promise<{ friendship: Friendship; receiver: User }[]>;
  getFriendship(userId1: number, userId2: number): Promise<Friendship | undefined>;
  searchUsers(query: string, currentUserId: number): Promise<User[]>;
  
  getDashboardQuestions(userId: number): Promise<DashboardQuestion[]>;
  createDashboardQuestion(question: InsertDashboardQuestion): Promise<DashboardQuestion>;
  clearDashboardQuestions(userId: number): Promise<void>;

  getDirectMessages(conversationKey: string): Promise<DirectMessage[]>;
  createDirectMessage(dm: InsertDirectMessage): Promise<DirectMessage>;
  clearDirectMessages(conversationKey: string): Promise<void>;

  getDisputeCases(userId: number): Promise<DisputeCase[]>;
  createDisputeCase(dispute: InsertDisputeCase): Promise<DisputeCase>;
  updateDisputeCase(id: number, data: Partial<DisputeCase>): Promise<DisputeCase>;
  deleteDisputeCase(id: number, userId: number): Promise<void>;

  getSystemAlerts(userId: number): Promise<SystemAlert[]>;
  createSystemAlert(alert: InsertSystemAlert): Promise<SystemAlert>;
  markAlertRead(id: number, userId: number): Promise<void>;
  getUnreadAlertCount(userId: number): Promise<number>;

  getCommunityDataPoints(filters?: CommunityFilters): Promise<{ data: CommunityDataPoint[]; total: number }>;
  getCommunityDataPoint(id: number): Promise<CommunityDataPoint | undefined>;
  createCommunityDataPoint(dp: InsertCommunityDataPoint): Promise<CommunityDataPoint>;
  updateCommunityDataPoint(id: number, data: Partial<CommunityDataPoint>): Promise<CommunityDataPoint>;
  deleteCommunityDataPoint(id: number): Promise<void>;
  getCommunityTrends(): Promise<CommunityTrends>;
  getSimilarProfiles(profile: SimilarProfileQuery): Promise<CommunityDataPoint[]>;
}

export interface CommunityFilters {
  source?: string;
  outcome?: string;
  lender?: string;
  product?: string;
  scoreMin?: number;
  scoreMax?: number;
  inquiryMin?: number;
  inquiryMax?: number;
  utilizationMin?: number;
  utilizationMax?: number;
  incomeMin?: number;
  incomeMax?: number;
  state?: string;
  bureauPulled?: string;
  applicationType?: string;
  moderationStatus?: string;
  search?: string;
  dateRange?: string;
  limit?: number;
  offset?: number;
}

export interface SimilarProfileQuery {
  score?: number;
  utilization?: number;
  inquiries?: number;
  oldestAccountMonths?: number;
  income?: number;
  applicationType?: string;
}

export interface CommunityTrends {
  totalPoints: number;
  approvals: number;
  denials: number;
  avgLimit: number;
  topBureau: string;
  topLender: string;
  topLendersByApproval: { lender: string; count: number }[];
  avgLimitByLender: { lender: string; avgLimit: number }[];
  outcomeByScoreBand: { band: string; approvals: number; denials: number }[];
  bureauByLender: { lender: string; bureau: string; count: number }[];
  recentTrendingLenders: { lender: string; count: number }[];
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, data: Partial<User>): Promise<User> {
    const [user] = await db.update(users).set(data).where(eq(users.id, id)).returning();
    return user;
  }

  async getMessages(userId: number): Promise<Message[]> {
    return db.select().from(messages).where(eq(messages.userId, userId)).orderBy(messages.timestamp);
  }

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const [message] = await db.insert(messages).values(insertMessage).returning();
    return message;
  }

  async clearMessages(userId: number): Promise<void> {
    await db.delete(messages).where(eq(messages.userId, userId));
  }

  async getComments(messageId: number): Promise<Comment[]> {
    return db.select().from(comments).where(eq(comments.messageId, messageId)).orderBy(comments.timestamp);
  }

  async getCommentsByUser(userId: number): Promise<Comment[]> {
    return db.select().from(comments).where(eq(comments.userId, userId)).orderBy(comments.timestamp);
  }

  async createComment(insertComment: InsertComment): Promise<Comment> {
    const [comment] = await db.insert(comments).values(insertComment).returning();
    return comment;
  }

  async getUserCount(): Promise<number> {
    const [result] = await db.select({ value: count() }).from(users);
    return result?.value || 0;
  }

  async getRecentPosts(limit: number): Promise<Post[]> {
    return db.select().from(posts).orderBy(desc(posts.timestamp)).limit(limit);
  }

  async createPost(insertPost: InsertPost): Promise<Post> {
    const [post] = await db.insert(posts).values(insertPost).returning();
    return post;
  }

  async getRandomBotUserIds(count: number): Promise<number[]> {
    const result = await db.select({ id: users.id }).from(users).where(eq(users.password, "bot_no_login")).limit(count);
    return result.map(r => r.id);
  }

  async sendFriendRequest(requesterId: number, receiverId: number): Promise<Friendship> {
    const [friendship] = await db.insert(friendships).values({ requesterId, receiverId, status: "pending" }).returning();
    return friendship;
  }

  async addTeamMember(requesterId: number, receiverId: number): Promise<Friendship> {
    const [friendship] = await db.insert(friendships).values({ requesterId, receiverId, status: "accepted" }).returning();
    return friendship;
  }

  async acceptFriendRequest(friendshipId: number, userId: number): Promise<Friendship> {
    const [friendship] = await db.update(friendships).set({ status: "accepted" }).where(and(eq(friendships.id, friendshipId), eq(friendships.receiverId, userId), eq(friendships.status, "pending"))).returning();
    return friendship;
  }

  async rejectFriendRequest(friendshipId: number, userId: number): Promise<void> {
    await db.delete(friendships).where(and(eq(friendships.id, friendshipId), eq(friendships.receiverId, userId)));
  }

  async removeFriend(friendshipId: number, userId: number): Promise<void> {
    await db.delete(friendships).where(and(eq(friendships.id, friendshipId), or(eq(friendships.requesterId, userId), eq(friendships.receiverId, userId))));
  }

  async getFriends(userId: number): Promise<{ friendship: Friendship; friend: User }[]> {
    const sent = await db.select().from(friendships).innerJoin(users, eq(friendships.receiverId, users.id)).where(and(eq(friendships.requesterId, userId), eq(friendships.status, "accepted")));
    const received = await db.select().from(friendships).innerJoin(users, eq(friendships.requesterId, users.id)).where(and(eq(friendships.receiverId, userId), eq(friendships.status, "accepted")));
    return [
      ...sent.map(r => ({ friendship: r.friendships, friend: r.users })),
      ...received.map(r => ({ friendship: r.friendships, friend: r.users })),
    ];
  }

  async getPendingRequests(userId: number): Promise<{ friendship: Friendship; requester: User }[]> {
    const results = await db.select().from(friendships).innerJoin(users, eq(friendships.requesterId, users.id)).where(and(eq(friendships.receiverId, userId), eq(friendships.status, "pending")));
    return results.map(r => ({ friendship: r.friendships, requester: r.users }));
  }

  async getSentPendingRequests(userId: number): Promise<{ friendship: Friendship; receiver: User }[]> {
    const results = await db.select().from(friendships).innerJoin(users, eq(friendships.receiverId, users.id)).where(and(eq(friendships.requesterId, userId), eq(friendships.status, "pending")));
    return results.map(r => ({ friendship: r.friendships, receiver: r.users }));
  }

  async getFriendship(userId1: number, userId2: number): Promise<Friendship | undefined> {
    const [result] = await db.select().from(friendships).where(or(and(eq(friendships.requesterId, userId1), eq(friendships.receiverId, userId2)), and(eq(friendships.requesterId, userId2), eq(friendships.receiverId, userId1))));
    return result;
  }

  async searchUsers(query: string, currentUserId: number): Promise<User[]> {
    return db.select().from(users).where(and(ne(users.id, currentUserId), ne(users.password, "bot_no_login"), or(ilike(users.displayName, `%${query}%`), ilike(users.email, `%${query}%`)))).limit(50);
  }

  async getDashboardQuestions(userId: number): Promise<DashboardQuestion[]> {
    return db.select().from(dashboardQuestions).where(eq(dashboardQuestions.userId, userId)).orderBy(dashboardQuestions.timestamp);
  }

  async createDashboardQuestion(question: InsertDashboardQuestion): Promise<DashboardQuestion> {
    const [q] = await db.insert(dashboardQuestions).values(question).returning();
    return q;
  }

  async clearDashboardQuestions(userId: number): Promise<void> {
    await db.delete(dashboardQuestions).where(eq(dashboardQuestions.userId, userId));
  }

  async getDirectMessages(conversationKey: string): Promise<DirectMessage[]> {
    return db.select().from(directMessages).where(eq(directMessages.conversationKey, conversationKey)).orderBy(asc(directMessages.timestamp));
  }

  async createDirectMessage(dm: InsertDirectMessage): Promise<DirectMessage> {
    const [msg] = await db.insert(directMessages).values(dm).returning();
    return msg;
  }

  async clearDirectMessages(conversationKey: string): Promise<void> {
    await db.delete(directMessages).where(eq(directMessages.conversationKey, conversationKey));
  }

  async getDisputeCases(userId: number): Promise<DisputeCase[]> {
    return db.select().from(disputeCases).where(eq(disputeCases.userId, userId)).orderBy(desc(disputeCases.createdAt));
  }

  async createDisputeCase(dispute: InsertDisputeCase): Promise<DisputeCase> {
    const [d] = await db.insert(disputeCases).values(dispute).returning();
    return d;
  }

  async updateDisputeCase(id: number, data: Partial<DisputeCase>): Promise<DisputeCase> {
    const [d] = await db.update(disputeCases).set({ ...data, updatedAt: new Date() }).where(eq(disputeCases.id, id)).returning();
    return d;
  }

  async deleteDisputeCase(id: number, userId: number): Promise<void> {
    await db.delete(disputeCases).where(and(eq(disputeCases.id, id), eq(disputeCases.userId, userId)));
  }

  async getSystemAlerts(userId: number): Promise<SystemAlert[]> {
    return db.select().from(systemAlerts).where(eq(systemAlerts.userId, userId)).orderBy(desc(systemAlerts.createdAt));
  }

  async createSystemAlert(alert: InsertSystemAlert): Promise<SystemAlert> {
    const [a] = await db.insert(systemAlerts).values(alert).returning();
    return a;
  }

  async markAlertRead(id: number, userId: number): Promise<void> {
    await db.update(systemAlerts).set({ isRead: true }).where(and(eq(systemAlerts.id, id), eq(systemAlerts.userId, userId)));
  }

  async getUnreadAlertCount(userId: number): Promise<number> {
    const [result] = await db.select({ value: count() }).from(systemAlerts).where(and(eq(systemAlerts.userId, userId), eq(systemAlerts.isRead, false)));
    return result?.value || 0;
  }

  async getCommunityDataPoints(filters?: CommunityFilters): Promise<{ data: CommunityDataPoint[]; total: number }> {
    const conditions: any[] = [];
    if (filters?.source) conditions.push(eq(communityDataPoints.source, filters.source));
    if (filters?.outcome) conditions.push(eq(communityDataPoints.outcome, filters.outcome));
    if (filters?.lender) conditions.push(ilike(communityDataPoints.lender, `%${filters.lender}%`));
    if (filters?.product) conditions.push(ilike(communityDataPoints.product, `%${filters.product}%`));
    if (filters?.scoreMin) conditions.push(gte(communityDataPoints.score, filters.scoreMin));
    if (filters?.scoreMax) conditions.push(lte(communityDataPoints.score, filters.scoreMax));
    if (filters?.inquiryMin) conditions.push(gte(communityDataPoints.inquiryCount, filters.inquiryMin));
    if (filters?.inquiryMax) conditions.push(lte(communityDataPoints.inquiryCount, filters.inquiryMax));
    if (filters?.utilizationMin) conditions.push(gte(communityDataPoints.utilization, filters.utilizationMin));
    if (filters?.utilizationMax) conditions.push(lte(communityDataPoints.utilization, filters.utilizationMax));
    if (filters?.incomeMin) conditions.push(gte(communityDataPoints.income, filters.incomeMin));
    if (filters?.incomeMax) conditions.push(lte(communityDataPoints.income, filters.incomeMax));
    if (filters?.state) conditions.push(eq(communityDataPoints.state, filters.state));
    if (filters?.bureauPulled) conditions.push(eq(communityDataPoints.bureauPulled, filters.bureauPulled));
    if (filters?.applicationType) conditions.push(eq(communityDataPoints.applicationType, filters.applicationType));
    if (filters?.moderationStatus) conditions.push(eq(communityDataPoints.moderationStatus, filters.moderationStatus));
    if (filters?.search) {
      conditions.push(or(
        ilike(communityDataPoints.lender, `%${filters.search}%`),
        ilike(communityDataPoints.product, `%${filters.search}%`),
        ilike(communityDataPoints.notes, `%${filters.search}%`),
        ilike(communityDataPoints.bureauPulled, `%${filters.search}%`)
      ));
    }
    if (filters?.dateRange) {
      const now = new Date();
      let since: Date;
      switch (filters.dateRange) {
        case "30d": since = new Date(now.getTime() - 30 * 86400000); break;
        case "90d": since = new Date(now.getTime() - 90 * 86400000); break;
        case "1y": since = new Date(now.getTime() - 365 * 86400000); break;
        default: since = new Date(0);
      }
      if (filters.dateRange !== "all") conditions.push(gte(communityDataPoints.createdAt, since));
    }
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const limit = filters?.limit || 50;
    const offset = filters?.offset || 0;
    const [totalResult] = await db.select({ value: count() }).from(communityDataPoints).where(where);
    const data = await db.select().from(communityDataPoints).where(where).orderBy(desc(communityDataPoints.createdAt)).limit(limit).offset(offset);
    return { data, total: totalResult?.value || 0 };
  }

  async getCommunityDataPoint(id: number): Promise<CommunityDataPoint | undefined> {
    const [dp] = await db.select().from(communityDataPoints).where(eq(communityDataPoints.id, id));
    return dp;
  }

  async createCommunityDataPoint(dp: InsertCommunityDataPoint): Promise<CommunityDataPoint> {
    const [created] = await db.insert(communityDataPoints).values(dp).returning();
    return created;
  }

  async updateCommunityDataPoint(id: number, data: Partial<CommunityDataPoint>): Promise<CommunityDataPoint> {
    const [updated] = await db.update(communityDataPoints).set({ ...data, updatedAt: new Date() }).where(eq(communityDataPoints.id, id)).returning();
    return updated;
  }

  async deleteCommunityDataPoint(id: number): Promise<void> {
    await db.delete(communityDataPoints).where(eq(communityDataPoints.id, id));
  }

  async getCommunityTrends(): Promise<CommunityTrends> {
    const approved = eq(communityDataPoints.moderationStatus, "approved");
    const [totalResult] = await db.select({ value: count() }).from(communityDataPoints).where(approved);
    const totalPoints = totalResult?.value || 0;

    const [approvalsResult] = await db.select({ value: count() }).from(communityDataPoints).where(and(approved, eq(communityDataPoints.outcome, "approval")));
    const approvals = approvalsResult?.value || 0;

    const [denialsResult] = await db.select({ value: count() }).from(communityDataPoints).where(and(approved, eq(communityDataPoints.outcome, "denial")));
    const denials = denialsResult?.value || 0;

    const avgLimitResult = await db.select({ avg: sql<number>`coalesce(avg(${communityDataPoints.limitAmount}), 0)` }).from(communityDataPoints).where(and(approved, sql`${communityDataPoints.limitAmount} is not null`));
    const avgLimit = Math.round(Number(avgLimitResult[0]?.avg) || 0);

    const bureauCounts = await db.select({ bureau: communityDataPoints.bureauPulled, cnt: count() }).from(communityDataPoints).where(and(approved, sql`${communityDataPoints.bureauPulled} is not null`)).groupBy(communityDataPoints.bureauPulled).orderBy(desc(count())).limit(1);
    const topBureau = bureauCounts[0]?.bureau || "N/A";

    const lenderCounts = await db.select({ lender: communityDataPoints.lender, cnt: count() }).from(communityDataPoints).where(approved).groupBy(communityDataPoints.lender).orderBy(desc(count())).limit(1);
    const topLender = lenderCounts[0]?.lender || "N/A";

    const topLendersByApproval = await db.select({ lender: communityDataPoints.lender, cnt: count() }).from(communityDataPoints).where(and(approved, eq(communityDataPoints.outcome, "approval"))).groupBy(communityDataPoints.lender).orderBy(desc(count())).limit(10);

    const avgLimitByLender = await db.select({ lender: communityDataPoints.lender, avg: sql<number>`coalesce(avg(${communityDataPoints.limitAmount}), 0)` }).from(communityDataPoints).where(and(approved, sql`${communityDataPoints.limitAmount} is not null`)).groupBy(communityDataPoints.lender).orderBy(desc(sql`avg(${communityDataPoints.limitAmount})`)).limit(10);

    const bureauByLender = await db.select({ lender: communityDataPoints.lender, bureau: communityDataPoints.bureauPulled, cnt: count() }).from(communityDataPoints).where(and(approved, sql`${communityDataPoints.bureauPulled} is not null`)).groupBy(communityDataPoints.lender, communityDataPoints.bureauPulled).orderBy(desc(count())).limit(30);

    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000);
    const recentTrendingLenders = await db.select({ lender: communityDataPoints.lender, cnt: count() }).from(communityDataPoints).where(and(approved, gte(communityDataPoints.createdAt, thirtyDaysAgo))).groupBy(communityDataPoints.lender).orderBy(desc(count())).limit(10);

    const allApprovedWithScore = await db.select({ score: communityDataPoints.score, outcome: communityDataPoints.outcome }).from(communityDataPoints).where(and(approved, sql`${communityDataPoints.score} is not null`));

    const bandMap: Record<string, { approvals: number; denials: number }> = {};
    for (const row of allApprovedWithScore) {
      const s = row.score!;
      let band: string;
      if (s < 580) band = "< 580";
      else if (s < 670) band = "580-669";
      else if (s < 740) band = "670-739";
      else if (s < 800) band = "740-799";
      else band = "800+";
      if (!bandMap[band]) bandMap[band] = { approvals: 0, denials: 0 };
      if (row.outcome === "approval") bandMap[band].approvals++;
      else if (row.outcome === "denial") bandMap[band].denials++;
    }
    const outcomeByScoreBand = Object.entries(bandMap).map(([band, v]) => ({ band, ...v }));

    return {
      totalPoints, approvals, denials, avgLimit, topBureau, topLender,
      topLendersByApproval: topLendersByApproval.map(r => ({ lender: r.lender, count: r.cnt })),
      avgLimitByLender: avgLimitByLender.map(r => ({ lender: r.lender, avgLimit: Math.round(Number(r.avg)) })),
      outcomeByScoreBand,
      bureauByLender: bureauByLender.map(r => ({ lender: r.lender, bureau: r.bureau || "", count: r.cnt })),
      recentTrendingLenders: recentTrendingLenders.map(r => ({ lender: r.lender, count: r.cnt })),
    };
  }

  async getSimilarProfiles(profile: SimilarProfileQuery): Promise<CommunityDataPoint[]> {
    const conditions: any[] = [eq(communityDataPoints.moderationStatus, "approved")];
    if (profile.score) {
      conditions.push(gte(communityDataPoints.score, profile.score - 40));
      conditions.push(lte(communityDataPoints.score, profile.score + 40));
    }
    if (profile.utilization !== undefined) {
      conditions.push(gte(communityDataPoints.utilization, Math.max(0, profile.utilization - 15)));
      conditions.push(lte(communityDataPoints.utilization, profile.utilization + 15));
    }
    if (profile.inquiries !== undefined) {
      conditions.push(gte(communityDataPoints.inquiryCount, Math.max(0, profile.inquiries - 3)));
      conditions.push(lte(communityDataPoints.inquiryCount, profile.inquiries + 3));
    }
    if (profile.applicationType) {
      conditions.push(eq(communityDataPoints.applicationType, profile.applicationType));
    }
    return db.select().from(communityDataPoints).where(and(...conditions)).orderBy(desc(communityDataPoints.createdAt)).limit(50);
  }
}

export const storage = new DatabaseStorage();
