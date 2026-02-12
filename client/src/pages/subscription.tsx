import { useAuth } from "@/lib/store";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, ShieldCheck, CreditCard } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";

export default function SubscriptionPage() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const queryClient = useQueryClient();

  if (!user) {
    setLocation("/");
    return null;
  }

  const handleSubscribe = async () => {
    setIsProcessing(true);
    toast({
      title: "Processing Payment...",
      description: "Redirecting to secure checkout.",
    });

    setTimeout(async () => {
      try {
        const res = await fetch("/api/subscribe", { method: "POST" });
        if (!res.ok) throw new Error("Subscription failed");
        queryClient.invalidateQueries({ queryKey: ["/api/me"] });
        toast({
          title: "Subscription Activated!",
          description: "Welcome to Start-Up Studio®.",
        });
        setLocation("/dashboard");
      } catch {
        toast({ variant: "destructive", title: "Error", description: "Could not activate subscription." });
      } finally {
        setIsProcessing(false);
      }
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

      <div className="z-10 w-full max-w-lg space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-700">
        <div className="text-center space-y-2">
           <h1 className="text-3xl font-bold tracking-tight" data-testid="text-subscription-title">Complete Access</h1>
           <p className="text-muted-foreground">Unlock the full power of the Digital Underwriting Engine.</p>
        </div>

        {user.subscriptionStatus === "inactive" && (
          <div className="bg-destructive/10 border border-destructive/30 rounded-lg p-4 text-center">
            <p className="text-sm text-destructive" data-testid="text-subscription-inactive">Subscription inactive. Please update billing to continue.</p>
          </div>
        )}

        <Card className="glass-panel border-primary/20 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-primary to-transparent"></div>
          
          <CardHeader className="text-center pb-2">
            <CardTitle className="text-xl">Start-Up Studio® Monthly Access</CardTitle>
            <CardDescription>All-in-one fundability platform</CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pt-6">
            <div className="text-center">
               <span className="text-5xl font-bold tracking-tight" data-testid="text-price">$97</span>
               <span className="text-muted-foreground text-sm">/month</span>
            </div>

            <div className="space-y-4 pt-4">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Check className="w-4 h-4" /></div>
                <span className="text-sm">30 AI-Powered Fundability Analyses</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Check className="w-4 h-4" /></div>
                <span className="text-sm">Bank-Level Underwriting Logic</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Check className="w-4 h-4" /></div>
                <span className="text-sm">Document Verification & Storage</span>
              </div>
              <div className="flex items-center gap-3">
                 <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary"><Check className="w-4 h-4" /></div>
                <span className="text-sm">Priority Support</span>
              </div>
            </div>
          </CardContent>
          
          <CardFooter className="pt-2 pb-8">
            <Button 
              data-testid="button-activate"
              className="w-full h-12 text-lg bg-primary text-black hover:bg-primary/90 font-bold"
              onClick={handleSubscribe}
              disabled={isProcessing || user.subscriptionStatus === 'active'}
            >
              <CreditCard className="w-5 h-5 mr-2" />
              {user.subscriptionStatus === 'active' ? 'Already Active' : 'Activate Membership'}
            </Button>
          </CardFooter>
        </Card>
        
        <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
          <ShieldCheck className="w-3 h-3" />
          <span>Secure SSL Payment via Stripe</span>
        </div>
      </div>
    </div>
  );
}
