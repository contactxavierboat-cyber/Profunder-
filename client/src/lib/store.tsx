import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { type User, type Message } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Partial<User>) => Promise<void>;
  resetUsage: (userId: number) => Promise<void>;
  toggleSubscription: (userId: number) => Promise<void>;
  allUsers: User[];
  messages: Message[];
  sendMessage: (content: string, attachment?: "credit_report" | "bank_statement") => Promise<void>;
  clearChat: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [userId, setUserId] = useState<number | null>(() => {
    const saved = localStorage.getItem("studio_user_id");
    return saved ? parseInt(saved) : null;
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: user, isLoading: userLoading } = useQuery<User>({
    queryKey: ["/api/user", userId],
    queryFn: async () => {
      const res = await fetch(`/api/user/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch user");
      return res.json();
    },
    enabled: !!userId,
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/chat", userId],
    queryFn: async () => {
      const res = await fetch(`/api/chat/${userId}`);
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: !!userId,
  });

  const loginMutation = useMutation({
    mutationFn: async (email: string) => {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      return res.json();
    },
    onSuccess: (data) => {
      setUserId(data.id);
      localStorage.setItem("studio_user_id", data.id.toString());
      toast({ title: "Welcome back", description: `Logged in as ${data.email}` });
      setLocation(data.role === 'admin' ? '/admin' : '/dashboard');
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<User>) => {
      const res = await fetch(`/api/user/${userId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/user", userId] });
    }
  });

  const sendMutation = useMutation({
    mutationFn: async ({ content, attachment }: { content: string, attachment?: string }) => {
      const res = await fetch(`/api/chat/${userId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, attachment }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send message");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat", userId] });
      queryClient.invalidateQueries({ queryKey: ["/api/user", userId] });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Analysis Failed", description: error.message });
    }
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      await fetch(`/api/chat/${userId}`, { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat", userId] });
    }
  });

  const logout = () => {
    setUserId(null);
    localStorage.removeItem("studio_user_id");
    setLocation('/');
  };

  return (
    <AuthContext.Provider value={{ 
      user: user || null, 
      isLoading: userLoading,
      login: loginMutation.mutateAsync,
      logout,
      updateUser: updateMutation.mutateAsync,
      resetUsage: async (id) => {
        await fetch(`/api/user/${id}`, { 
          method: "PATCH", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ monthlyUsage: 0 })
        });
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      },
      toggleSubscription: async (id) => {
        const u = await (await fetch(`/api/user/${id}`)).json();
        await fetch(`/api/user/${id}`, { 
          method: "PATCH", 
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ subscriptionStatus: u.subscriptionStatus === 'active' ? 'inactive' : 'active' })
        });
        queryClient.invalidateQueries({ queryKey: ["/api/user"] });
      },
      allUsers: [], // Add fetch if admin list needed
      messages,
      sendMessage: (content, attachment) => sendMutation.mutateAsync({ content, attachment }),
      clearChat: clearMutation.mutateAsync
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
