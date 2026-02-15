import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { AuthProvider } from "@/lib/store";
import { useEffect, useRef } from "react";
import NotFound from "@/pages/not-found";
import LandingPage from "@/pages/landing";
import DashboardPage from "@/pages/dashboard";
import AdminPage from "@/pages/admin";
import SubscriptionPage from "@/pages/subscription";

function Router() {
  return (
    <Switch>
      <Route path="/" component={LandingPage} />
      <Route path="/dashboard" component={DashboardPage} />
      <Route path="/admin" component={AdminPage} />
      <Route path="/admin/users" component={AdminPage} />
      <Route path="/subscription" component={SubscriptionPage} />
      <Route component={NotFound} />
    </Switch>
  );
}

function AuroraBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationId: number;
    let time = 0;

    interface Orb {
      x: number; y: number;
      baseX: number; baseY: number;
      radius: number;
      color: [number, number, number];
      speedX: number; speedY: number;
      phaseX: number; phaseY: number;
      amplitudeX: number; amplitudeY: number;
    }

    const orbs: Orb[] = [
      { x: 0, y: 0, baseX: 0.15, baseY: 0.2, radius: 0.35, color: [46, 125, 50], speedX: 0.0003, speedY: 0.0004, phaseX: 0, phaseY: 0.5, amplitudeX: 0.12, amplitudeY: 0.08 },
      { x: 0, y: 0, baseX: 0.75, baseY: 0.15, radius: 0.30, color: [8, 145, 178], speedX: 0.0004, speedY: 0.0003, phaseX: 1.2, phaseY: 2.1, amplitudeX: 0.10, amplitudeY: 0.12 },
      { x: 0, y: 0, baseX: 0.5, baseY: 0.7, radius: 0.32, color: [124, 58, 237], speedX: 0.00025, speedY: 0.00035, phaseX: 2.5, phaseY: 0.8, amplitudeX: 0.15, amplitudeY: 0.10 },
      { x: 0, y: 0, baseX: 0.85, baseY: 0.6, radius: 0.28, color: [234, 88, 12], speedX: 0.00035, speedY: 0.00025, phaseX: 3.8, phaseY: 1.5, amplitudeX: 0.08, amplitudeY: 0.14 },
      { x: 0, y: 0, baseX: 0.3, baseY: 0.85, radius: 0.25, color: [14, 165, 233], speedX: 0.0003, speedY: 0.0004, phaseX: 5.0, phaseY: 3.2, amplitudeX: 0.12, amplitudeY: 0.06 },
      { x: 0, y: 0, baseX: 0.6, baseY: 0.35, radius: 0.22, color: [168, 85, 247], speedX: 0.00045, speedY: 0.00035, phaseX: 1.8, phaseY: 4.0, amplitudeX: 0.10, amplitudeY: 0.10 },
    ];

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const drawDotGrid = (w: number, h: number) => {
      const spacing = 32;
      const dotSize = 1;
      ctx.fillStyle = 'rgba(0, 0, 0, 0.06)';
      for (let x = spacing; x < w; x += spacing) {
        for (let y = spacing; y < h; y += spacing) {
          ctx.beginPath();
          ctx.arc(x, y, dotSize, 0, Math.PI * 2);
          ctx.fill();
        }
      }
    };

    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      time += 1;

      ctx.clearRect(0, 0, w, h);

      ctx.fillStyle = '#FAFBFC';
      ctx.fillRect(0, 0, w, h);

      orbs.forEach(orb => {
        orb.x = (orb.baseX + Math.sin(time * orb.speedX + orb.phaseX) * orb.amplitudeX) * w;
        orb.y = (orb.baseY + Math.sin(time * orb.speedY + orb.phaseY) * orb.amplitudeY) * h;

        const r = orb.radius * Math.max(w, h);
        const grad = ctx.createRadialGradient(orb.x, orb.y, 0, orb.x, orb.y, r);
        const [cr, cg, cb] = orb.color;
        grad.addColorStop(0, `rgba(${cr}, ${cg}, ${cb}, 0.15)`);
        grad.addColorStop(0.3, `rgba(${cr}, ${cg}, ${cb}, 0.08)`);
        grad.addColorStop(0.6, `rgba(${cr}, ${cg}, ${cb}, 0.03)`);
        grad.addColorStop(1, `rgba(${cr}, ${cg}, ${cb}, 0)`);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, w, h);
      });

      const auroraY = h * 0.3 + Math.sin(time * 0.0008) * h * 0.05;
      const auroraGrad = ctx.createLinearGradient(0, auroraY - h * 0.15, 0, auroraY + h * 0.15);
      auroraGrad.addColorStop(0, 'rgba(46, 125, 50, 0)');
      auroraGrad.addColorStop(0.3, `rgba(46, 125, 50, ${0.04 + Math.sin(time * 0.001) * 0.02})`);
      auroraGrad.addColorStop(0.5, `rgba(8, 145, 178, ${0.05 + Math.sin(time * 0.0012 + 1) * 0.02})`);
      auroraGrad.addColorStop(0.7, `rgba(124, 58, 237, ${0.03 + Math.sin(time * 0.0015 + 2) * 0.015})`);
      auroraGrad.addColorStop(1, 'rgba(124, 58, 237, 0)');
      ctx.fillStyle = auroraGrad;
      ctx.fillRect(0, 0, w, h);

      drawDotGrid(w, h);

      animationId = requestAnimationFrame(draw);
    };

    resize();
    draw();

    window.addEventListener('resize', resize);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <AuroraBackground />
        <Router />
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
