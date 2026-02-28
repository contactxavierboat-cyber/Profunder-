import { users, messages, comments, posts, friendships, dashboardQuestions, directMessages, disputeCases, systemAlerts, type User, type InsertUser, type Message, type InsertMessage, type Comment, type InsertComment, type Post, type InsertPost, type Friendship, type DashboardQuestion, type InsertDashboardQuestion, type DirectMessage, type InsertDirectMessage, type DisputeCase, type InsertDisputeCase, type SystemAlert, type InsertSystemAlert } from "@shared/schema";
import { db } from "./db";
import { eq, count, desc, or, and, ne, ilike, isNull, sql, asc } from "drizzle-orm";

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
}

export const storage = new DatabaseStorage();
