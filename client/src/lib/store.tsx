import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import { type UserProfile, MOCK_USERS } from "./types";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";

interface AuthContextType {
  user: UserProfile | null;
  login: (email: string) => void;
  logout: () => void;
  updateUser: (data: Partial<UserProfile>) => void;
  resetUsage: (userId: string) => void;
  toggleSubscription: (userId: string) => void;
  allUsers: UserProfile[];
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [allUsers, setAllUsers] = useState<UserProfile[]>(MOCK_USERS);
  const { toast } = useToast();
  const [, setLocation] = useLocation();

  const login = (email: string) => {
    // Simple mock login
    const foundUser = allUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
    
    if (foundUser) {
      setUser(foundUser);
      toast({
        title: "Welcome back",
        description: `Logged in as ${foundUser.email}`,
      });
      setLocation(foundUser.role === 'admin' ? '/admin' : '/dashboard');
    } else {
      // Create new user for demo purposes if not found in mock list
      const newUser: UserProfile = {
        id: `user-${Date.now()}`,
        email,
        role: "user",
        subscriptionStatus: "inactive", // Default to inactive until they "pay"
        monthlyUsage: 0,
        maxUsage: 5,
        createdAt: new Date().toISOString()
      };
      setAllUsers([...allUsers, newUser]);
      setUser(newUser);
      toast({
        title: "Account created",
        description: "Please set up your subscription.",
      });
      setLocation('/subscription');
    }
  };

  const logout = () => {
    setUser(null);
    setLocation('/');
    toast({
      title: "Logged out",
    });
  };

  const updateUser = (data: Partial<UserProfile>) => {
    if (!user) return;
    const updatedUser = { ...user, ...data };
    setUser(updatedUser);
    setAllUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
  };

  const resetUsage = (userId: string) => {
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        return { ...u, monthlyUsage: 0 };
      }
      return u;
    }));
    toast({ title: "Usage reset successfully" });
  };

  const toggleSubscription = (userId: string) => {
    setAllUsers(prev => prev.map(u => {
      if (u.id === userId) {
        const newStatus = u.subscriptionStatus === 'active' ? 'inactive' : 'active';
        // If current user is the one being toggled, update local state too
        if (user && user.id === userId) {
          setUser({ ...user, subscriptionStatus: newStatus });
        }
        return { ...u, subscriptionStatus: newStatus };
      }
      return u;
    }));
  };

  return (
    <AuthContext.Provider value={{ user, login, logout, updateUser, resetUsage, toggleSubscription, allUsers }}>
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
