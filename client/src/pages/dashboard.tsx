import { useEffect } from "react";
import { useAuth } from "@/lib/store";
import { useLocation } from "wouter";
import { DashboardLayout } from "@/components/layout";
import { CreditProfileForm } from "@/components/profile-form";
import { FileUpload } from "@/components/file-upload";
import { ChatInterface } from "@/components/chat-interface";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AlertCircle, CheckCircle2, TrendingUp, DollarSign, Activity } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function DashboardPage() {
  const { user, updateUser } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setLocation("/");
      return;
    }
    if (user.subscriptionStatus !== "active" && user.role !== 'admin') {
      setLocation("/subscription");
    }
  }, [user, setLocation]);

  if (!user) return null;

  // Mock Analysis Logic
  const calculateFundability = () => {
    if (!user.creditScoreRange) return 0;
    let score = 0;
    if (user.creditScoreRange === "750+") score += 40;
    if (user.creditScoreRange === "700-749") score += 30;
    if (user.hasCreditReport) score += 30;
    if (user.hasBankStatement) score += 30;
    return Math.min(score, 100);
  };

  const fundabilityScore = calculateFundability();

  return (
    <DashboardLayout>
      <div className="space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
            <p className="text-muted-foreground">Welcome back to Start-Up Studio®</p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="px-3 py-1 border-primary/20 text-primary bg-primary/5">
              <span className="w-2 h-2 rounded-full bg-primary mr-2 animate-pulse"></span>
              {user.subscriptionStatus === 'active' ? 'Active Member' : 'Inactive'}
            </Badge>
          </div>
        </div>

        {/* Top Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="glass-panel border-l-4 border-l-primary">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Fundability Score</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-4xl font-mono font-bold text-white glow-text">{fundabilityScore}%</div>
                <Activity className="w-8 h-8 text-primary opacity-50" />
              </div>
              <Progress value={fundabilityScore} className="h-1 mt-4 bg-white/10" />
            </CardContent>
          </Card>

          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Monthly Usage</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-4xl font-mono font-bold text-white">
                  {user.monthlyUsage}<span className="text-lg text-muted-foreground">/{user.maxUsage}</span>
                </div>
                <TrendingUp className="w-8 h-8 text-blue-500 opacity-50" />
              </div>
              <p className="text-xs text-muted-foreground mt-4">Analyses remaining this month</p>
            </CardContent>
          </Card>
          
          <Card className="glass-panel">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-widest">Projected Funding</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-end justify-between">
                <div className="text-4xl font-mono font-bold text-white">$0.00</div>
                <DollarSign className="w-8 h-8 text-green-500 opacity-50" />
              </div>
              <p className="text-xs text-muted-foreground mt-4">Complete profile to estimate</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Column: Inputs */}
          <div className="lg:col-span-2 space-y-6">
            <CreditProfileForm />
            
            <Card className="glass-panel">
              <CardHeader>
                <CardTitle>Document Center</CardTitle>
                <CardDescription>Securely upload your financial documents for verification.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <FileUpload 
                  label="Credit Report" 
                  description="Upload your full credit report (all 3 bureaus)"
                  isUploaded={!!user.hasCreditReport}
                  onUpload={() => {
                    updateUser({ hasCreditReport: true });
                    toast({ title: "Document Uploaded", description: "Credit report analyzed successfully." });
                  }}
                  onRemove={() => updateUser({ hasCreditReport: false })}
                />
                
                <FileUpload 
                  label="Business Bank Statement" 
                  description="Upload your most recent 3 months of statements"
                  isUploaded={!!user.hasBankStatement}
                  onUpload={() => {
                    updateUser({ hasBankStatement: true });
                    toast({ title: "Document Uploaded", description: "Bank statements verified." });
                  }}
                  onRemove={() => updateUser({ hasBankStatement: false })}
                />
              </CardContent>
            </Card>
          </div>

          {/* Sidebar Column: Status/Chat */}
          <div className="space-y-6">
            <ChatInterface />
            
            <Card className="glass-panel bg-primary/5 border-primary/20">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="w-5 h-5 text-primary" />
                  Analysis Status
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm">
                    {user.creditScoreRange ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <div className="w-4 h-4 rounded-full border border-muted-foreground" />}
                    <span className={user.creditScoreRange ? "text-foreground" : "text-muted-foreground"}>Structure Phase</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {user.hasCreditReport ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <div className="w-4 h-4 rounded-full border border-muted-foreground" />}
                    <span className={user.hasCreditReport ? "text-foreground" : "text-muted-foreground"}>Scale Phase</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    {user.monthlyUsage > 0 ? <CheckCircle2 className="w-4 h-4 text-primary" /> : <div className="w-4 h-4 rounded-full border border-muted-foreground" />}
                    <span className={user.monthlyUsage > 0 ? "text-foreground" : "text-muted-foreground"}>Sequence Phase</span>
                  </div>
                </div>
                
                <Button className="w-full mt-4" disabled={!user.hasCreditReport}>
                  Run Full Analysis
                </Button>
              </CardContent>
            </Card>

            <Alert className="bg-muted/50 border-white/10">
              <AlertTitle>Start-Up Studio® AI</AlertTitle>
              <AlertDescription className="text-xs mt-2 text-muted-foreground">
                Chat analysis module coming soon. Complete your profile to unlock early access.
              </AlertDescription>
            </Alert>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
