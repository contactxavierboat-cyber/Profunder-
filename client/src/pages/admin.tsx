import { useAuth } from "@/lib/store";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { RefreshCw, Power } from "lucide-react";
import { useEffect } from "react";

export default function AdminPage() {
  const { user, allUsers, resetUsage, toggleSubscription } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setLocation("/");
    }
  }, [user, setLocation]);

  if (!user || user.role !== 'admin') return null;

  return (
    <DashboardLayout>
      <div className="space-y-6 sm:space-y-8">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight">Admin Console</h2>
            <p className="text-muted-foreground text-sm">Manage users and subscriptions</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
          <Card className="glass-panel">
            <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Total Users</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-3xl sm:text-4xl font-mono font-bold">{allUsers.length}</div>
            </CardContent>
          </Card>
          
          <Card className="glass-panel">
            <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-muted-foreground">Active Subs</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-3xl sm:text-4xl font-mono font-bold text-primary">
                {allUsers.filter(u => u.subscriptionStatus === 'active').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="glass-panel">
          <CardHeader className="px-3 sm:px-6">
            <CardTitle className="text-base sm:text-lg">User Management</CardTitle>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-white/10 hover:bg-transparent">
                    <TableHead className="w-[80px]">ID</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Tier</TableHead>
                    <TableHead>Usage</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers.map((u) => (
                    <TableRow key={u.id} className="border-white/10 hover:bg-white/15">
                      <TableCell className="font-mono text-xs text-muted-foreground">{u.id}</TableCell>
                      <TableCell className="font-medium">{u.displayName || u.email}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={u.subscriptionStatus === 'active' 
                            ? "border-green-500/50 text-green-500 bg-green-500/10" 
                            : "border-red-500/50 text-red-500 bg-red-500/10"}
                        >
                          {u.subscriptionStatus}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {u.subscriptionTier ? (
                          <Badge
                            variant="outline"
                            className={
                              u.subscriptionTier === 'capital'
                                ? "border-amber-500/50 text-amber-600 bg-amber-500/10"
                                : u.subscriptionTier === 'repair'
                                ? "border-purple-500/50 text-purple-500 bg-purple-500/10"
                                : "border-blue-500/50 text-blue-500 bg-blue-500/10"
                            }
                            data-testid={`badge-tier-${u.id}`}
                          >
                            {u.subscriptionTier}
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground" data-testid={`badge-tier-${u.id}`}>—</span>
                        )}
                      </TableCell>
                      <TableCell className="font-mono">
                        {u.monthlyUsage} / {u.maxUsage}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 w-8 p-0"
                          onClick={() => resetUsage(u.id)}
                          title="Reset Usage"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 hover:text-destructive hover:bg-destructive/10"
                          onClick={() => toggleSubscription(u.id)}
                          title="Toggle Status"
                        >
                          <Power className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="sm:hidden space-y-2 px-3">
              {allUsers.map((u) => (
                <div key={u.id} className="bg-white/15 border border-white/10 rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium truncate max-w-[180px]">{u.displayName || u.email}</span>
                    <div className="flex items-center gap-1.5">
                      {u.subscriptionTier && (
                        <Badge
                          variant="outline"
                          className={`text-[10px] px-1.5 py-0 ${
                            u.subscriptionTier === 'capital'
                              ? "border-amber-500/50 text-amber-600 bg-amber-500/10"
                              : u.subscriptionTier === 'repair'
                              ? "border-purple-500/50 text-purple-500 bg-purple-500/10"
                              : "border-blue-500/50 text-blue-500 bg-blue-500/10"
                          }`}
                        >
                          {u.subscriptionTier}
                        </Badge>
                      )}
                      <Badge 
                        variant="outline" 
                        className={`text-[10px] px-1.5 py-0 ${u.subscriptionStatus === 'active' 
                          ? "border-green-500/50 text-green-500 bg-green-500/10" 
                          : "border-red-500/50 text-red-500 bg-red-500/10"}`}
                      >
                        {u.subscriptionStatus}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-mono">
                      ID: {u.id} | Usage: {u.monthlyUsage}/{u.maxUsage}
                    </span>
                    <div className="flex gap-1.5">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 w-7 p-0"
                        onClick={() => resetUsage(u.id)}
                        title="Reset Usage"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 w-7 p-0 hover:text-destructive hover:bg-destructive/10"
                        onClick={() => toggleSubscription(u.id)}
                        title="Toggle Status"
                      >
                        <Power className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
