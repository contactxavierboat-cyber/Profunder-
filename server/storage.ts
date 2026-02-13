import { users, messages, comments, posts, friendships, type User, type InsertUser, type Message, type InsertMessage, type Comment, type InsertComment, type Post, type InsertPost, type Friendship } from "@shared/schema";
import { db } from "./db";
import { eq, count, desc, or, and, ne, ilike } from "drizzle-orm";

export interface IStorage {
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
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
  rejectFriendRequest(friendshipId: number, userId: number): Promise<void>;
  removeFriend(friendshipId: number, userId: number): Promise<void>;
  getFriends(userId: number): Promise<{ friendship: Friendship; friend: User }[]>;
  getPendingRequests(userId: number): Promise<{ friendship: Friendship; requester: User }[]>;
  getFriendship(userId1: number, userId2: number): Promise<Friendship | undefined>;
  searchUsers(query: string, currentUserId: number): Promise<User[]>;
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

  async acceptFriendRequest(friendshipId: number, userId: number): Promise<Friendship> {
    const [friendship] = await db.update(friendships).set({ status: "accepted" }).where(and(eq(friendships.id, friendshipId), eq(friendships.receiverId, userId))).returning();
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

  async getFriendship(userId1: number, userId2: number): Promise<Friendship | undefined> {
    const [result] = await db.select().from(friendships).where(or(and(eq(friendships.requesterId, userId1), eq(friendships.receiverId, userId2)), and(eq(friendships.requesterId, userId2), eq(friendships.receiverId, userId1))));
    return result;
  }

  async searchUsers(query: string, currentUserId: number): Promise<User[]> {
    return db.select().from(users).where(and(ne(users.password, "bot_no_login"), or(ilike(users.displayName, `%${query}%`), ilike(users.email, `%${query}%`)))).limit(50);
  }
}

export const storage = new DatabaseStorage();
