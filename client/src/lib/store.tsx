import { createContext, useContext, useState, type ReactNode } from "react";
import { type User, type Message } from "@shared/schema";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

type SafeUser = Omit<User, "password">;

interface AuthContextType {
  user: SafeUser | null;
  isLoading: boolean;
  login: (email: string, username?: string, phone?: string) => Promise<void>;
  logout: () => void;
  updateUser: (data: Record<string, any>) => Promise<void>;
  resetUsage: (userId: number) => Promise<void>;
  toggleSubscription: (userId: number) => Promise<void>;
  allUsers: SafeUser[];
  messages: Message[];
  sendMessage: (content: string, attachment?: "credit_report" | "bank_statement", fileContent?: string, selectedMentor?: string | null) => Promise<void>;
  clearChat: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState<boolean>(() => {
    return localStorage.getItem("studio_logged_in") === "true";
  });
  
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const { data: user, isLoading: userLoading } = useQuery<SafeUser>({
    queryKey: ["/api/me"],
    queryFn: async () => {
      const res = await fetch("/api/me");
      if (!res.ok) {
        if (res.status === 401) {
          setIsLoggedIn(false);
          localStorage.removeItem("studio_logged_in");
          throw new Error("Not authenticated");
        }
        throw new Error("Failed to fetch user");
      }
      return res.json();
    },
    enabled: isLoggedIn,
    retry: false,
  });

  const { data: messages = [] } = useQuery<Message[]>({
    queryKey: ["/api/chat"],
    queryFn: async () => {
      const res = await fetch("/api/chat");
      if (!res.ok) throw new Error("Failed to fetch messages");
      return res.json();
    },
    enabled: isLoggedIn && !!user,
    refetchInterval: 3000,
  });

  const { data: allUsers = [] } = useQuery<SafeUser[]>({
    queryKey: ["/api/users"],
    queryFn: async () => {
      const res = await fetch("/api/users");
      if (!res.ok) throw new Error("Failed to fetch users");
      return res.json();
    },
    enabled: isLoggedIn && !!user && user.role === "admin",
  });

  const loginMutation = useMutation({
    mutationFn: async ({ email, username, phone }: { email: string; username?: string; phone?: string }) => {
      const res = await fetch("/api/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, username, phone }),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({ error: "Login failed" }));
        throw new Error(err.error || "Login failed");
      }
      return res.json();
    },
    onSuccess: (data) => {
      setIsLoggedIn(true);
      localStorage.setItem("studio_logged_in", "true");
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
      toast({ title: "Welcome back", description: `Logged in as ${data.displayName || data.email}` });
      setLocation(data.role === 'admin' ? '/admin' : '/dashboard');
    },
    onError: (error: Error) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: Record<string, any>) => {
      const res = await fetch("/api/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error("Failed to update profile");
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    }
  });

  const sendMutation = useMutation({
    mutationFn: async ({ content, attachment, fileContent, selectedMentor }: { content: string, attachment?: string, fileContent?: string, selectedMentor?: string | null }) => {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, attachment: attachment || null, fileContent: fileContent || null, selectedMentor: selectedMentor || null }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Failed to send message");
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
      queryClient.invalidateQueries({ queryKey: ["/api/me"] });
    },
    onError: (error: Error) => {
      toast({ variant: "destructive", title: "Analysis Failed", description: error.message });
    }
  });

  const clearMutation = useMutation({
    mutationFn: async () => {
      await fetch("/api/chat", { method: "DELETE" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
    }
  });

  const logout = async () => {
    await fetch("/api/logout", { method: "POST" });
    setIsLoggedIn(false);
    localStorage.removeItem("studio_logged_in");
    queryClient.clear();
    setLocation('/');
  };

  const resetUsage = async (id: number) => {
    await fetch(`/api/admin/user/${id}`, { 
      method: "PATCH", 
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ monthlyUsage: 0 })
    });
    queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    toast({ title: "Usage reset successfully" });
  };

  const toggleSubscription = async (id: number) => {
    const target = allUsers.find(u => u.id === id);
    if (!target) {
      const res = await fetch("/api/me");
      const me = await res.json();
      const newStatus = me.subscriptionStatus === 'active' ? 'inactive' : 'active';
      await fetch("/api/admin/user/" + id, { 
        method: "PATCH", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionStatus: newStatus })
      });
    } else {
      const newStatus = target.subscriptionStatus === 'active' ? 'inactive' : 'active';
      await fetch(`/api/admin/user/${id}`, { 
        method: "PATCH", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ subscriptionStatus: newStatus })
      });
    }
    queryClient.invalidateQueries({ queryKey: ["/api/users"] });
    queryClient.invalidateQueries({ queryKey: ["/api/me"] });
  };

  return (
    <AuthContext.Provider value={{ 
      user: user || null, 
      isLoading: userLoading,
      login: (email: string, username?: string, phone?: string) => loginMutation.mutateAsync({ email, username, phone }),
      logout,
      updateUser: updateMutation.mutateAsync,
      resetUsage,
      toggleSubscription,
      allUsers,
      messages,
      sendMessage: (content, attachment, fileContent, selectedMentor) => sendMutation.mutateAsync({ content, attachment, fileContent, selectedMentor }),
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
