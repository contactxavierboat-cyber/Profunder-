import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/store";
import { LayoutDashboard, Shield, LogOut, FileText, Users, BarChart3, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { BaalioLogo } from "@/components/baalio-logo";

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
    <div
      className="min-h-[100dvh] flex"
      style={{ fontFamily: "'Inter', sans-serif", background: 'linear-gradient(180deg, #ffffff 0%, #f5f5fc 15%, #eef0fa 30%, #f8f8ff 45%, #f2f0fb 60%, #f6f5fc 75%, #f0eff8 88%, #eceaf5 100%)' }}
    >
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm z-30 md:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      <aside className={cn(
        "w-64 flex flex-col fixed h-full z-40 transition-transform duration-200 ease-out",
        "bg-white/70 backdrop-blur-xl border-r border-white/40 shadow-[4px_0_24px_rgba(0,0,0,0.03)]",
        mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        "md:flex",
        !mobileOpen && "hidden md:flex"
      )}>
        <div className="p-4 sm:p-6 border-b border-white/40 flex items-center justify-between">
          <div>
            <span className="relative w-7 h-7 sm:w-8 sm:h-8 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-[#8a8aa5]/15 animate-ping" />
              <span className="relative w-3 h-3 sm:w-3.5 sm:h-3.5 rounded-full bg-[#8a8aa5] shadow-[0_0_8px_rgba(138,138,165,0.4)]" />
            </span>
            <p className="text-[10px] sm:text-xs text-[#8a8aa5] mt-1">Mentorship, On Demand</p>
          </div>
          <button
            className="md:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/50"
            onClick={() => setMobileOpen(false)}
          >
            <X className="w-5 h-5 text-[#8a8aa5]" />
          </button>
        </div>

        <nav className="flex-1 p-3 sm:p-4 space-y-1 sm:space-y-1.5">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href} onClick={() => setMobileOpen(false)} className={cn(
              "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
              location === item.href
                ? "bg-white/90 text-[#1a1a2e] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-white/60"
                : "text-[#6a6a8a] hover:bg-white/50 hover:text-[#3a3a5a]"
            )}>
              <item.icon className="w-4 h-4" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="p-3 sm:p-4 border-t border-white/40">
          <div className="flex items-center gap-3 px-3 py-2 sm:py-3 mb-2">
            <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-white/50 border border-white/40 flex items-center justify-center text-[10px] sm:text-xs font-mono text-[#5a5a7a]">
              {(user.displayName || user.email).substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate text-[#1a1a2e]">{user.displayName || user.email}</p>
              <p className="text-xs text-[#8a8aa5] capitalize">{user.role}</p>
            </div>
          </div>
          <button
            onClick={logout}
            className="w-full flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-[#8a8aa5] hover:bg-white/50 hover:text-[#5a5a7a] transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Log out
          </button>
        </div>
      </aside>

      <div className="flex-1 md:ml-64 relative flex flex-col min-h-[100dvh]">
        <header className="h-12 flex items-center justify-between px-3 border-b border-white/30 md:hidden shrink-0 relative z-10 bg-white/60 backdrop-blur-md">
          <button
            onClick={() => setMobileOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/50"
          >
            <Menu className="w-5 h-5 text-[#6a6a8a]" />
          </button>
          <h1><BaalioLogo size="sm" className="text-[#1a1a2e]" /></h1>
          <div className="w-8" />
        </header>

        <main className="flex-1 relative">
          <div className="relative p-4 sm:p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
