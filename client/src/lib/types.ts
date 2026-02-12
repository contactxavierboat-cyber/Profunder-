import { type ReactNode } from "react";

export type UserRole = "user" | "admin";
export type SubscriptionStatus = "active" | "inactive" | "crowned";

export interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: string;
  attachment?: "credit_report" | "bank_statement";
}

export interface UserProfile {
  id: string;
  email: string;
  role: UserRole;
  subscriptionStatus: SubscriptionStatus;
  monthlyUsage: number;
  maxUsage: number;
  createdAt: string;
  
  // Financial Profile Data
  creditScoreRange?: string;
  totalRevolvingLimit?: number;
  totalBalances?: number;
  inquiries?: number;
  derogatoryAccounts?: number;
  
  // Upload statuses
  hasCreditReport?: boolean;
  hasBankStatement?: boolean;
  
  // Chat History
  chatHistory: Message[];
}

export const MOCK_USERS: UserProfile[] = [
  {
    id: "user-1",
    email: "demo@startupstudio.com",
    role: "user",
    subscriptionStatus: "active",
    monthlyUsage: 2,
    maxUsage: 5,
    createdAt: "2024-01-15T10:00:00Z",
    creditScoreRange: "700-749",
    totalRevolvingLimit: 15000,
    totalBalances: 3500,
    inquiries: 1,
    derogatoryAccounts: 0,
    hasCreditReport: true,
    hasBankStatement: false,
    chatHistory: [
      {
        id: "m1",
        role: "assistant",
        content: "Hello! I've analyzed your current profile. Your Structure phase is looking strong, but we should look at your inquiry count. How can I help you today?",
        timestamp: new Date().toISOString()
      }
    ]
  },
  {
    id: "user-2",
    email: "inactive@example.com",
    role: "user",
    subscriptionStatus: "inactive",
    monthlyUsage: 0,
    maxUsage: 5,
    createdAt: "2024-02-01T14:30:00Z",
    chatHistory: []
  },
  {
    id: "admin-1",
    email: "admin@startupstudio.com",
    role: "admin",
    subscriptionStatus: "active",
    monthlyUsage: 0,
    maxUsage: 9999,
    createdAt: "2023-11-20T09:00:00Z",
    chatHistory: []
  }
];
