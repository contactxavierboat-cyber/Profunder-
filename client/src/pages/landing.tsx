import { useState } from "react";
import { useAuth } from "@/lib/store";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { ArrowRight, Lock } from "lucide-react";

export default function LandingPage() {
  const [email, setEmail] = useState("");
  const { login } = useAuth();
  const [, setLocation] = useLocation();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    login(email);
  };

  return (
    <div className="min-h-screen bg-black flex flex-col items-center justify-center relative overflow-hidden font-sans text-white p-4">
      {/* Abstract Background Shapes */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
        <div className="absolute top-[-20%] right-[-10%] w-[600px] h-[600px] bg-primary/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/5 rounded-full blur-[100px]"></div>
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:40px_40px]"></div>
      </div>

      <div className="z-10 w-full max-w-md animate-in fade-in zoom-in duration-500 space-y-8">
        <div className="text-center space-y-4">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/5 border border-white/10 mb-4 shadow-2xl">
            <span className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-white/60">X</span>
          </div>
          
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-xs font-mono text-primary mb-2">
            <span className="w-2 h-2 rounded-full bg-primary animate-pulse"></span>
            NOW AVAILABLE
          </div>

          <h1 className="text-4xl md:text-5xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-b from-white via-white to-white/50">
            "Digital Underwriting Engine"
          </h1>
          
          <p className="text-muted-foreground text-sm md:text-base leading-relaxed">
            Upload your <span className="text-white font-medium">credit profile</span> and receive a verified Fundability Score calculated using real bank-level underwriting logic.
          </p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 relative">
          <div className="relative group">
            <div className="absolute -inset-0.5 bg-gradient-to-r from-primary/50 to-blue-600/50 rounded-lg blur opacity-30 group-hover:opacity-100 transition duration-1000"></div>
            <div className="relative flex gap-2">
              <Input 
                type="email" 
                placeholder="Enter your email" 
                className="bg-black/80 border-white/10 h-12 text-lg focus-visible:ring-primary/50"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
              <Button 
                type="submit" 
                className="h-12 px-8 bg-primary text-black hover:bg-primary/90 font-semibold text-lg"
              >
                Join Now
              </Button>
            </div>
          </div>
          <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Lock className="w-3 h-3" />
            <span>Bank-level encryption</span>
            <span>•</span>
            <span>Secure Access</span>
          </div>
        </form>

        <div className="pt-8 flex items-center justify-center gap-4 opacity-50 grayscale hover:grayscale-0 transition-all duration-500">
          <div className="flex -space-x-3">
             {[1, 2, 3, 4].map((i) => (
               <div key={i} className="w-8 h-8 rounded-full bg-zinc-800 border border-black flex items-center justify-center text-[10px] text-zinc-500">U{i}</div>
             ))}
          </div>
          <p className="text-xs font-mono">Join 12,500+ founders already scaling</p>
        </div>
      </div>
      
      <div className="absolute bottom-8 text-center w-full z-10">
        <p className="text-xs font-mono text-white/20 uppercase tracking-widest">Countdown Finished</p>
      </div>
    </div>
  );
}
