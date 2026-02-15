import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/store";
import { LayoutDashboard, Shield, LogOut, FileText, Users, BarChart3, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const [mobileOpen, setMobileOpen] = useState(false);

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const navItems = isAdmin ? [
    { href: "/admin", label: "Admin Overview", icon: Shield },
    { href: "/admin/users", label: "User Management", icon: Users },
  ] : [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/profile", label: "Credit Profile", icon: FileText },
    { href: "/dashboard/analysis", label: "Analysis", icon: BarChart3 },
  ];

  return (
    <div className="min-h-[100dvh] bg-background text-foreground flex">
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={cn(
        "w-64 border-r border-sidebar-border bg-sidebar flex flex-col fixed h-full z-40 transition-transform duration-200 ease-out",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        "md:flex",
        !mobileOpen && "hidden md:flex"
      )}>
        <div className="p-4 sm:p-6 border-b border-sidebar-border flex items-center justify-between">
          <div>
            <h1 className="font-sans font-bold text-lg sm:text-xl tracking-tighter flex items-center gap-2">
              <span className="relative w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center">
                <span className="absolute inset-0 rounded-full bg-[#E0E0E0]/15 animate-ping" />
                <span className="relative w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#E0E0E0] shadow-[0_0_8px_rgba(224,224,224,0.4)]" />
              </span>
              MentXr®
            </h1>
            <p className="text-[10px] sm:text-xs text-muted-foreground mt-1">Mentorship, On Demand</p>
          </div>
          <button
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/15"
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={cn(
              "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
              location === item.href 
                ? "bg-sidebar-accent text-white" 
                : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
            )}>
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 sm:p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-2 sm:py-3 mb-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-muted flex items-center justify-center text-[10px] sm:text-xs font-mono">
              {(user.displayName || user.email).substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.displayName || user.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Log out
          </Button>
        </div>
      </aside>

      <div className="flex-1 md:ml-64 bg-background relative flex flex-col min-h-[100dvh]">
        <header className="h-12 flex items-center justify-between px-3 border-b border-sidebar-border md:hidden shrink-0 relative z-10 bg-background">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/15"
          >
            <Menu className="w-5 h-5 text-muted-foreground" />
          </button>
          <h1 className="text-sm font-bold">MentXr®</h1>
          <div className="w-8" />
        </header>

        <main className="flex-1 relative">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
          <div className="relative p-4 sm:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
