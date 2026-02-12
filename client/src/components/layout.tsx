import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/store";
import { LayoutDashboard, CreditCard, Shield, LogOut, FileText, Settings, Users, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useAuth();
  const [location] = useLocation();

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  const navItems = isAdmin ? [
    { href: "/admin", label: "Admin Overview", icon: Shield },
    { href: "/admin/users", label: "User Management", icon: Users },
  ] : [
    { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
    { href: "/dashboard/profile", label: "Credit Profile", icon: FileText },
    { href: "/dashboard/analysis", label: "Analysis", icon: BarChart3 },
    { href: "/subscription", label: "Subscription", icon: CreditCard },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground flex">
      {/* Sidebar */}
      <aside className="w-64 border-r border-sidebar-border bg-sidebar flex flex-col fixed h-full z-10 hidden md:flex">
        <div className="p-6 border-b border-sidebar-border">
          <h1 className="font-sans font-bold text-xl tracking-tighter flex items-center gap-2">
            <span className="w-8 h-8 bg-primary rounded-md flex items-center justify-center text-black font-mono">X</span>
            Start-Up Studio®
          </h1>
          <p className="text-xs text-muted-foreground mt-1">Digital Underwriting Engine</p>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <a className={cn(
                "flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                location === item.href 
                  ? "bg-sidebar-accent text-primary" 
                  : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-foreground"
              )}>
                <item.icon className="w-4 h-4" />
                {item.label}
              </a>
            </Link>
          ))}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <div className="flex items-center gap-3 px-3 py-3 mb-2">
            <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-mono">
              {user.email.substring(0, 2).toUpperCase()}
            </div>
            <div className="overflow-hidden">
              <p className="text-sm font-medium truncate">{user.email}</p>
              <p className="text-xs text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>
          <Button variant="outline" className="w-full justify-start text-muted-foreground" onClick={logout}>
            <LogOut className="w-4 h-4 mr-2" />
            Log out
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 md:ml-64 bg-background relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none"></div>
        <div className="relative p-8 max-w-7xl mx-auto animate-in fade-in duration-500">
          {children}
        </div>
      </main>
    </div>
  );
}
