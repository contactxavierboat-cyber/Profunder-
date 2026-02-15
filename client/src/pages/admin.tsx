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
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[#1A1A1A]">Admin Console</h2>
            <p className="text-[#666] text-sm">Manage users and subscriptions</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 sm:gap-6">
          <Card className="bg-white border border-[#E5E7EB] shadow-sm">
            <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-[#666]">Total Users</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-3xl sm:text-4xl font-mono font-bold text-[#1A1A1A]">{allUsers.length}</div>
            </CardContent>
          </Card>
          
          <Card className="bg-white border border-[#E5E7EB] shadow-sm">
            <CardHeader className="pb-1 sm:pb-2 px-3 sm:px-6 pt-3 sm:pt-6">
              <CardTitle className="text-xs sm:text-sm font-medium text-[#666]">Active Subs</CardTitle>
            </CardHeader>
            <CardContent className="px-3 sm:px-6 pb-3 sm:pb-6">
              <div className="text-3xl sm:text-4xl font-mono font-bold text-[#2E7D32]">
                {allUsers.filter(u => u.subscriptionStatus === 'active').length}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-white border border-[#E5E7EB] shadow-sm">
          <CardHeader className="px-3 sm:px-6">
            <CardTitle className="text-base sm:text-lg text-[#1A1A1A]">User Management</CardTitle>
          </CardHeader>
          <CardContent className="px-0 sm:px-6">
            <div className="hidden sm:block">
              <Table>
                <TableHeader>
                  <TableRow className="border-[#E5E7EB] hover:bg-transparent bg-[#F1F3F5]">
                    <TableHead className="w-[80px] text-[#333]">ID</TableHead>
                    <TableHead className="text-[#333]">Email</TableHead>
                    <TableHead className="text-[#333]">Status</TableHead>
                    <TableHead className="text-[#333]">Usage</TableHead>
                    <TableHead className="text-right text-[#333]">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {allUsers.map((u) => (
                    <TableRow key={u.id} className="border-[#E5E7EB] hover:bg-[#F8F9FA]">
                      <TableCell className="font-mono text-xs text-[#666]">{u.id}</TableCell>
                      <TableCell className="font-medium text-[#1A1A1A]">{u.displayName || u.email}</TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={u.subscriptionStatus === 'active' 
                            ? "border-green-200 text-green-700 bg-green-50" 
                            : "border-red-200 text-red-700 bg-red-50"}
                        >
                          {u.subscriptionStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-[#333]">
                        {u.monthlyUsage} / {u.maxUsage}
                      </TableCell>
                      <TableCell className="text-right space-x-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="h-8 w-8 p-0 border-[#E5E7EB] text-[#333] hover:bg-[#F1F3F5]"
                          onClick={() => resetUsage(u.id)}
                          title="Reset Usage"
                        >
                          <RefreshCw className="h-4 w-4" />
                        </Button>
                        <Button 
                          size="sm" 
                          variant="ghost" 
                          className="h-8 w-8 p-0 text-[#333] hover:text-destructive hover:bg-destructive/10"
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
                <div key={u.id} className="bg-[#F8F9FA] border border-[#E5E7EB] rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium text-[#1A1A1A] truncate max-w-[180px]">{u.displayName || u.email}</span>
                    <Badge 
                      variant="outline" 
                      className={`text-[10px] px-1.5 py-0 ${u.subscriptionStatus === 'active' 
                        ? "border-green-200 text-green-700 bg-green-50" 
                        : "border-red-200 text-red-700 bg-red-50"}`}
                    >
                      {u.subscriptionStatus}
                    </Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[#666] font-mono">
                      ID: {u.id} | Usage: {u.monthlyUsage}/{u.maxUsage}
                    </span>
                    <div className="flex gap-1.5">
                      <Button 
                        size="sm" 
                        variant="outline" 
                        className="h-7 w-7 p-0 border-[#E5E7EB] text-[#333] hover:bg-[#F1F3F5]"
                        onClick={() => resetUsage(u.id)}
                        title="Reset Usage"
                      >
                        <RefreshCw className="h-3.5 w-3.5" />
                      </Button>
                      <Button 
                        size="sm" 
                        variant="ghost" 
                        className="h-7 w-7 p-0 text-[#333] hover:text-destructive hover:bg-destructive/10"
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
