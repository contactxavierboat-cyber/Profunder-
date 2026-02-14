import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/store";
import { useLocation } from "wouter";
import { Send, Plus, Paperclip, Loader2, ArrowDown, FileText, X, Menu, MessageCircle, RefreshCw, TrendingUp, UserPlus, Check, UserX, Search, AlertTriangle, Shield, ChevronRight, Target, BarChart3, BookOpen, CheckCircle2, AlertCircle, Info, Zap, Activity, Upload, Sparkles, Eye, Lock, Cpu, ChevronDown, Radio, Play, ExternalLink, Clock, Filter, ChevronUp, Volume2, VolumeX, Heart, MessageSquare, Share2, ThumbsUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, RadialBarChart, RadialBar } from "recharts";

function TechBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    let animationId: number;
    let mouseX = -1000;
    let mouseY = -1000;
    interface Particle {
      x: number; y: number; vx: number; vy: number;
      size: number; opacity: number; pulse: number; pulseSpeed: number;
      isNode: boolean;
    }
    let particles: Particle[] = [];
    const resize = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      canvas.width = w * window.devicePixelRatio;
      canvas.height = h * window.devicePixelRatio;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };
    const init = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      const count = Math.min(Math.floor((w * h) / 4000), 380);
      particles = [];
      for (let i = 0; i < count; i++) {
        const isNode = Math.random() < 0.2;
        particles.push({
          x: Math.random() * w, y: Math.random() * h,
          vx: (Math.random() - 0.5) * 0.5, vy: (Math.random() - 0.5) * 0.5,
          size: isNode ? Math.random() * 2.5 + 1.5 : Math.random() * 1.3 + 0.4,
          opacity: isNode ? Math.random() * 0.4 + 0.3 : Math.random() * 0.25 + 0.1,
          pulse: Math.random() * Math.PI * 2, pulseSpeed: Math.random() * 0.03 + 0.008,
          isNode,
        });
      }
    };
    const onMouseMove = (e: MouseEvent) => { mouseX = e.clientX; mouseY = e.clientY; };
    window.addEventListener('mousemove', onMouseMove);
    const draw = () => {
      const w = window.innerWidth;
      const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h);
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy; p.pulse += p.pulseSpeed;
        if (p.x < -10) p.x = w + 10; if (p.x > w + 10) p.x = -10;
        if (p.y < -10) p.y = h + 10; if (p.y > h + 10) p.y = -10;
        const dx = p.x - mouseX; const dy = p.y - mouseY;
        const mouseDist = Math.sqrt(dx * dx + dy * dy);
        if (mouseDist < 180 && mouseDist > 0) {
          const force = (180 - mouseDist) / 180 * 0.02;
          p.vx += (dx / mouseDist) * force; p.vy += (dy / mouseDist) * force;
        }
        const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
        if (speed > 0.8) { p.vx = (p.vx / speed) * 0.8; p.vy = (p.vy / speed) * 0.8; }
      });
      const connectionDist = 160;
      for (let i = 0; i < particles.length; i++) {
        const pi = particles[i];
        if (!pi.isNode) continue;
        for (let j = i + 1; j < particles.length; j++) {
          const pj = particles[j];
          const dx = pi.x - pj.x; const dy = pi.y - pj.y;
          if (Math.abs(dx) > connectionDist || Math.abs(dy) > connectionDist) continue;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < connectionDist) {
            const alpha = (1 - dist / connectionDist) * 0.18;
            ctx.beginPath();
            ctx.strokeStyle = `rgba(255, 255, 255, ${alpha})`;
            ctx.lineWidth = 0.7;
            ctx.moveTo(pi.x, pi.y); ctx.lineTo(pj.x, pj.y); ctx.stroke();
          }
        }
      }
      particles.forEach(p => {
        const glow = Math.sin(p.pulse) * 0.4 + 0.6;
        const mouseDist = Math.sqrt((p.x - mouseX) ** 2 + (p.y - mouseY) ** 2);
        const mouseBoost = mouseDist < 180 ? 1 + (180 - mouseDist) / 180 * 1.5 : 1;
        const alpha = Math.min(p.opacity * glow * mouseBoost, 0.85);
        const drawSize = p.size * (mouseBoost > 1 ? mouseBoost * 0.5 + 0.5 : 1);
        ctx.beginPath();
        ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
        ctx.arc(p.x, p.y, drawSize, 0, Math.PI * 2); ctx.fill();
        if (p.isNode || drawSize > 1.2) {
          ctx.beginPath();
          const glowRadius = drawSize * (p.isNode ? 6 : 3);
          const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, glowRadius);
          grad.addColorStop(0, `rgba(255, 255, 255, ${alpha * 0.25})`);
          grad.addColorStop(0.5, `rgba(255, 255, 255, ${alpha * 0.06})`);
          grad.addColorStop(1, 'rgba(255, 255, 255, 0)');
          ctx.fillStyle = grad;
          ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2); ctx.fill();
        }
      });
      if (mouseX > 0 && mouseY > 0) {
        const mGrad = ctx.createRadialGradient(mouseX, mouseY, 0, mouseX, mouseY, 200);
        mGrad.addColorStop(0, 'rgba(255, 255, 255, 0.03)');
        mGrad.addColorStop(0.5, 'rgba(255, 255, 255, 0.01)');
        mGrad.addColorStop(1, 'rgba(255, 255, 255, 0)');
        ctx.fillStyle = mGrad;
        ctx.fillRect(mouseX - 200, mouseY - 200, 400, 400);
      }
      animationId = requestAnimationFrame(draw);
    };
    resize(); init(); draw();
    const resizeHandler = () => { resize(); init(); };
    window.addEventListener('resize', resizeHandler);
    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener('resize', resizeHandler);
      window.removeEventListener('mousemove', onMouseMove);
    };
  }, []);
  return (
    <canvas ref={canvasRef} className="fixed top-0 left-0 pointer-events-none" style={{ zIndex: 1 }} />
  );
}

const BOT_COLORS: Record<string, string> = {
  nova_sage: "bg-gradient-to-br from-orange-500 to-red-600",
  alpha_volt: "bg-gradient-to-br from-blue-500 to-cyan-600",
  blaze_echo: "bg-gradient-to-br from-yellow-500 to-amber-600",
  lunar_peak: "bg-gradient-to-br from-purple-500 to-pink-600",
  iron_flux: "bg-gradient-to-br from-emerald-500 to-teal-600",
  zen_cipher: "bg-gradient-to-br from-indigo-500 to-violet-600",
  steel_wraith: "bg-gradient-to-br from-slate-500 to-zinc-600",
};

const MENTOR_INFO: Record<string, { name: string; initials: string; tagline: string; specialty: string }> = {
  nova_sage: { name: "NovaSage247", initials: "NS", tagline: "Scale Everything", specialty: "Sales & Business Growth" },
  alpha_volt: { name: "AlphaVolt889", initials: "AV", tagline: "Patient Capital", specialty: "Investing & Value" },
  blaze_echo: { name: "BlazeEcho512", initials: "BE", tagline: "Hustle & Heart", specialty: "Marketing & Social Media" },
  lunar_peak: { name: "LunarPeak303", initials: "LP", tagline: "Live Your Best Life", specialty: "Leadership & Growth" },
  iron_flux: { name: "IronFlux771", initials: "IF", tagline: "Fearless Innovation", specialty: "Entrepreneurship & Product" },
  zen_cipher: { name: "ZenCipher108", initials: "ZC", tagline: "Unlock Your Potential", specialty: "Mindset & Financial Literacy" },
  steel_wraith: { name: "SteelWraith666", initials: "SW", tagline: "Real Talk, Real Change", specialty: "Youth Advocacy & Transformation" },
};

const INSIGHTS = [
  { title: "What Lenders Look for in Strong Profiles", summary: "Consistent payment history, low utilization, established credit age, and minimal inquiries are the top factors lenders evaluate." },
  { title: "How to Avoid Common Denials", summary: "Most denials come from high utilization, too many recent inquiries, or unresolved derogatory marks. Address these before applying." },
  { title: "Timing Your Applications Correctly", summary: "Apply when your utilization is lowest (after paying statements) and when you have zero recent inquiries for the best approval odds." },
  { title: "Separating Business and Personal Credit", summary: "Lenders prefer clean separation. Use an EIN, open business accounts, and keep personal credit reserved for personal use." },
  { title: "The 30-Day Optimization Window", summary: "Most credit improvements take 30-45 days to reflect. Plan your application timeline around statement closing dates." },
];

interface FundingReadiness {
  score: number;
  status: string;
  statusLabel: string;
  estimatedRange: { min: number; max: number } | null;
  exposureCeiling: { totalExposure: number; multiplier: number; ceiling: number } | null;
  operatingMode: { mode: string; label: string; description: string } | null;
  tierEligibility: { tier: number; label: string; description: string } | null;
  componentBreakdown: Record<string, { score: number; max: number; label: string }> | null;
  denialSimulation: { trigger: string; riskLevel: "High" | "Moderate" | "Low"; explanation: string; fix: string }[];
  alerts: { severity: "red" | "yellow" | "gray"; title: string; explanation: string; impact: string; fix: string }[];
  actionPlan: string[];
  progress: { current: number; target: number };
  hasProfile: boolean;
  analysisSummary: string | null;
  analysisNextSteps: string[];
  lastAnalysisDate: string | null;
  hasCreditReport: boolean;
  hasBankStatement: boolean;
}

function timeAgo(date: Date | string): string {
  const now = new Date();
  const then = new Date(date);
  const diff = Math.floor((now.getTime() - then.getTime()) / 1000);
  if (diff < 60) return "just now";
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

function DonutChart({ value, max, size = 120, strokeWidth = 10, color = "#fff" }: { value: number; max: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const offset = circumference - pct * circumference;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#1F1F1F" strokeWidth={strokeWidth} />
      <circle
        cx={size / 2} cy={size / 2} r={radius} fill="none"
        stroke={color} strokeWidth={strokeWidth} strokeLinecap="round"
        strokeDasharray={circumference} strokeDashoffset={offset}
        style={{ transition: "stroke-dashoffset 1s ease", filter: `drop-shadow(0 0 4px ${color}40)` }}
      />
    </svg>
  );
}

export default function DashboardPage() {
  const { user, messages, sendMessage, clearChat, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  const [mentorCleared, setMentorCleared] = useState(false);
  const [buddyGroups, setBuddyGroups] = useState<Record<string, boolean>>({
    mentors: true,
    friends: true,
    offline: false,
  });
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<"dashboard" | "feed" | "chat">("dashboard");
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");
  const [friendSearchResults, setFriendSearchResults] = useState<any[]>([]);
  const [friendSearchLoading, setFriendSearchLoading] = useState(false);
  const [fundingData, setFundingData] = useState<FundingReadiness | null>(null);
  const [fundingLoading, setFundingLoading] = useState(false);
  const [expandedAlerts, setExpandedAlerts] = useState<Set<number>>(new Set());
  const [docUploading, setDocUploading] = useState(false);
  const [docUploadType, setDocUploadType] = useState<"credit_report" | "bank_statement" | null>(null);
  const creditReportInputRef = useRef<HTMLInputElement>(null);
  const bankStatementInputRef = useRef<HTMLInputElement>(null);
  const [repairData, setRepairData] = useState<any>(null);
  const [repairLoading, setRepairLoading] = useState(false);
  const [repairAnalyzing, setRepairAnalyzing] = useState(false);
  const [expandedLetters, setExpandedLetters] = useState<Set<number>>(new Set());
  const [copiedLetter, setCopiedLetter] = useState<number | null>(null);
  const [expandedDenials, setExpandedDenials] = useState<Set<number>>(new Set());
  const [qaMessages, setQaMessages] = useState<any[]>([]);
  const [qaInput, setQaInput] = useState("");
  const [qaLoading, setQaLoading] = useState(false);
  const [qaOpen, setQaOpen] = useState(false);
  const qaEndRef = useRef<HTMLDivElement>(null);
  const qaInputRef = useRef<HTMLTextAreaElement>(null);

  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const [feedLastUpdated, setFeedLastUpdated] = useState<string | null>(null);
  const [feedFilter, setFeedFilter] = useState<string>("all");
  const [feedPage, setFeedPage] = useState(0);
  const [feedHasMore, setFeedHasMore] = useState(false);
  const [feedTotal, setFeedTotal] = useState(0);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [currentShortIndex, setCurrentShortIndex] = useState(0);
  const [shortsAutoplay, setShortsAutoplay] = useState(true);
  const shortsContainerRef = useRef<HTMLDivElement>(null);

  const TRUNCATE_LENGTH = 280;

  const toggleExpand = (id: number) => {
    setExpandedMessages(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const fetchFriends = async () => {
    try {
      const res = await fetch("/api/friends", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setFriendsList(data.friends || []);
        setPendingRequests(data.pending || []);
      }
    } catch (err) { console.error("Failed to fetch friends", err); }
  };

  const searchFriends = async (q: string) => {
    if (q.length < 2) { setFriendSearchResults([]); return; }
    setFriendSearchLoading(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`, { credentials: "include" });
      if (res.ok) { setFriendSearchResults(await res.json()); }
    } catch (err) { console.error(err); } finally { setFriendSearchLoading(false); }
  };

  const sendFriendRequest = async (receiverId: number) => {
    try {
      const res = await fetch("/api/friends/request", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ receiverId }) });
      if (res.ok) { toast({ title: "Friend request sent!" }); fetchFriends(); setFriendSearchResults(prev => prev.filter(u => u.id !== receiverId)); }
      else { const d = await res.json(); toast({ title: "Error", description: d.error, variant: "destructive" }); }
    } catch (err) { toast({ title: "Error", description: "Failed to send request", variant: "destructive" }); }
  };

  const acceptFriend = async (friendshipId: number) => {
    try {
      await fetch("/api/friends/accept", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ friendshipId }) });
      fetchFriends();
      toast({ title: "Friend request accepted!" });
    } catch (err) { toast({ title: "Error", description: "Failed to accept", variant: "destructive" }); }
  };

  const rejectFriend = async (friendshipId: number) => {
    try {
      await fetch("/api/friends/reject", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ friendshipId }) });
      fetchFriends();
    } catch (err) { toast({ title: "Error", description: "Failed to reject", variant: "destructive" }); }
  };

  const removeFriend = async (friendshipId: number) => {
    try {
      await fetch("/api/friends/remove", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ friendshipId }) });
      fetchFriends();
      toast({ title: "Friend removed" });
    } catch (err) { toast({ title: "Error", description: "Failed to remove", variant: "destructive" }); }
  };

  const fetchQA = async () => {
    try {
      const res = await fetch("/api/dashboard-qa", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setQaMessages(data);
      }
    } catch (err) {
      console.error("Failed to fetch Q&A", err);
    }
  };

  const sendQA = async () => {
    const q = qaInput.trim();
    if (!q || qaLoading) return;
    setQaInput("");
    setQaLoading(true);
    try {
      const res = await fetch("/api/dashboard-qa", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: q }),
      });
      if (res.ok) {
        const data = await res.json();
        setQaMessages(prev => [...prev, data.userQuestion, data.aiAnswer]);
        setTimeout(() => qaEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      } else {
        const err = await res.json();
        toast({ title: "Error", description: err.error || "Failed to send question", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to send question", variant: "destructive" });
    } finally {
      setQaLoading(false);
    }
  };

  const clearQA = async () => {
    try {
      await fetch("/api/dashboard-qa", { method: "DELETE", credentials: "include" });
      setQaMessages([]);
    } catch {}
  };

  const fetchFundingReadiness = async () => {
    setFundingLoading(true);
    try {
      const res = await fetch("/api/funding-readiness", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setFundingData(data);
      }
    } catch (err) {
      console.error("Failed to fetch funding readiness", err);
    } finally {
      setFundingLoading(false);
    }
  };

  const handleDocumentUpload = async (file: File, documentType: "credit_report" | "bank_statement") => {
    setDocUploading(true);
    setDocUploadType(documentType);
    try {
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        const isPdf = file.name.toLowerCase().endsWith(".pdf");
        reader.onload = () => {
          if (isPdf) {
            const base64 = (reader.result as string).split(",")[1];
            resolve(base64);
          } else {
            resolve(reader.result as string);
          }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        if (isPdf) {
          reader.readAsDataURL(file);
        } else {
          reader.readAsText(file);
        }
      });

      const res = await fetch("/api/analyze-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fileContent, documentType }),
      });

      if (res.ok) {
        const data = await res.json();
        toast({ title: "Analysis Complete", description: "Your document has been analyzed and your funding score has been updated." });
        await fetchFundingReadiness();
        if (data.repairResult) {
          setRepairData(data.repairResult);
          toast({ title: "Credit Repair Updated", description: `${data.repairResult.detectedIssues?.length || 0} issues detected. ${data.repairResult.letters?.length || 0} letters generated.` });
        } else {
          await fetchRepairData();
        }
      } else {
        const data = await res.json();
        toast({ title: "Analysis Failed", description: data.error || "Could not analyze document.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Upload Error", description: "Failed to upload document. Please try again.", variant: "destructive" });
    } finally {
      setDocUploading(false);
      setDocUploadType(null);
    }
  };

  const fetchRepairData = async () => {
    setRepairLoading(true);
    try {
      const res = await fetch("/api/credit-repair-data", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.hasData) setRepairData(data);
      }
    } catch (err) {
      console.error("Failed to fetch repair data", err);
    } finally {
      setRepairLoading(false);
    }
  };

  const runRepairAnalysis = async () => {
    setRepairAnalyzing(true);
    try {
      const res = await fetch("/api/credit-repair-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ useStored: true }),
      });
      if (res.ok) {
        const data = await res.json();
        setRepairData(data);
        toast({ title: "Repair Analysis Complete", description: `${data.detectedIssues?.length || 0} issues detected. ${data.letters?.length || 0} letters generated.` });
      } else {
        const data = await res.json();
        toast({ title: "Analysis Failed", description: data.error || "Could not run repair analysis.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Error", description: "Failed to run repair analysis.", variant: "destructive" });
    } finally {
      setRepairAnalyzing(false);
    }
  };

  const copyLetterToClipboard = (text: string, idx: number) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedLetter(idx);
      setTimeout(() => setCopiedLetter(null), 2000);
      toast({ title: "Copied to clipboard" });
    });
  };

  const fetchFeed = async (page = 0, filter = "all", append = false) => {
    try {
      if (!append) setFeedLoading(true);
      const params = new URLSearchParams({ page: String(page), limit: "40" });
      if (filter !== "all") params.set("category", filter);
      const res = await fetch(`/api/feed?${params}`, { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (append) {
          setFeedItems(prev => [...prev, ...data.items]);
        } else {
          setFeedItems(data.items);
        }
        setFeedTotal(data.total);
        setFeedHasMore(data.hasMore);
        setFeedLastUpdated(data.lastUpdated);
      }
    } catch (err) { console.error("Feed error:", err); }
    finally { setFeedLoading(false); }
  };

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchFundingReadiness();
      fetchRepairData();
      fetchQA();
      fetchFeed();
    }
  }, [user]);

  useEffect(() => {
    if (activeTab !== "feed") return;
    if (feedPage > 0) return;
    const interval = setInterval(() => { fetchFeed(0, feedFilter); }, 5000);
    return () => clearInterval(interval);
  }, [activeTab, feedFilter, feedPage]);

  const lastMentorMsg = [...messages].reverse().find(m => m.role === 'assistant' && m.mentor);
  const activeMentorKey = selectedMentor !== null ? selectedMentor : (mentorCleared ? null : (lastMentorMsg?.mentor || null));
  const activeMentor = activeMentorKey ? MENTOR_INFO[activeMentorKey] : null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setLocation("/");
      return;
    }
  }, [user, setLocation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const handleScroll = () => {
    if (!scrollContainerRef.current) return;
    const { scrollTop, scrollHeight, clientHeight } = scrollContainerRef.current;
    setShowScrollBtn(scrollHeight - scrollTop - clientHeight > 100);
  };

  const handleSend = async () => {
    if (!user || (!input.trim() && !attachedFile) || isLoading) return;
    const msg = input.trim() || (attachedFile ? `Analyze my attached ${attachedFile.name}` : "");
    if (!msg) return;
    const attachment = attachedFile ? (attachedFile.name.toLowerCase().includes("bank") ? "bank_statement" as const : "credit_report" as const) : undefined;
    const file = attachedFile;
    setInput("");
    setAttachedFile(null);
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsLoading(true);
    setActiveTab("chat");
    try {
      let fileContent: string | undefined;
      if (file) {
        fileContent = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          const isPdf = file.name.toLowerCase().endsWith(".pdf");
          reader.onload = () => {
            if (isPdf) {
              const base64 = (reader.result as string).split(",")[1];
              resolve(base64);
            } else {
              resolve(reader.result as string);
            }
          };
          reader.onerror = () => reject(new Error("Failed to read file"));
          if (isPdf) {
            reader.readAsDataURL(file);
          } else {
            reader.readAsText(file);
          }
        });
      }
      await sendMessage(msg, attachment, fileContent, activeMentorKey);
    } catch {
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  if (!user) return null;

  const hasMessages = messages.length > 0;

  const getScoreColor = (score: number) => {
    if (score >= 85) return "#22c55e";
    if (score >= 70) return "#eab308";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
  };

  const componentChartData = fundingData?.componentBreakdown
    ? Object.entries(fundingData.componentBreakdown).map(([key, comp]) => ({
        name: comp.label.split(" ")[0],
        score: comp.score,
        max: comp.max,
        pct: Math.round((comp.score / comp.max) * 100),
      }))
    : [];

  return (
    <div className="h-[100dvh] flex text-white relative">
      <TechBackground />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        "w-[260px] flex flex-col shrink-0 relative z-40 backdrop-blur-xl",
        "fixed h-full md:static md:flex transition-transform duration-200 ease-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        "md:flex",
        !sidebarOpen && "hidden md:flex"
      )} style={{ background: 'rgba(8,8,8,0.92)' }}>
        <div className="h-11 px-4 flex items-center justify-between border-b border-white/[0.06] bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <span className="relative w-7 h-7 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-[#E0E0E0]/15 animate-ping" />
              <span className="relative w-3 h-3 rounded-full bg-[#E0E0E0] shadow-[0_0_8px_rgba(224,224,224,0.4)]" />
            </span>
            <span className="text-[13px] font-bold text-white/90 tracking-tight">MentXr®</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white/40 hover:text-white/70" data-testid="button-close-sidebar">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="h-14 px-4 flex items-center gap-3 border-b border-white/[0.06] bg-transparent">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[11px] font-bold text-white/60">
              {(user.displayName || user.email).substring(0, 2).toUpperCase()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#0D0D0D]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-white/80 truncate">{user.displayName || user.email.split("@")[0]}</p>
            <p className="text-[10px] text-white/25 italic truncate">Mentorship On Demand</p>
          </div>
        </div>

        <div className="h-10 px-4 flex items-center gap-2 border-b border-white/[0.06] bg-transparent">
          <button
            data-testid="button-new-chat"
            onClick={() => { clearChat(); setSelectedMentor(null); setMentorCleared(true); setSidebarOpen(false); setActiveTab("chat"); }}
            className="flex-1 h-7 text-[11px] rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] active:bg-white/[0.03] text-white/60 font-medium transition-colors"
          >
            + New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-transparent" style={{ scrollbarWidth: 'thin' }}>
          <div className="border-b border-white/[0.04]">
            <button
              onClick={() => setBuddyGroups(prev => ({ ...prev, mentors: !prev.mentors }))}
              className="w-full h-9 flex items-center gap-2 px-4 hover:bg-white/[0.02] text-left transition-colors"
              data-testid="buddy-group-mentors"
            >
              <span className="text-[10px] text-white/15 font-mono w-3">{buddyGroups.mentors ? "▾" : "▸"}</span>
              <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Mentors</span>
              <span className="text-[10px] text-white/15 ml-auto">(7/7)</span>
            </button>
            {buddyGroups.mentors && (
              <div className="pb-1">
                {Object.entries(MENTOR_INFO).map(([key, mentor]) => {
                  const isActive = activeMentorKey === key;
                  const statusMessages: Record<string, string> = {
                    nova_sage: "Scaling up! Let's close deals",
                    alpha_volt: "Analyzing market trends...",
                    blaze_echo: "Creating content rn",
                    lunar_peak: "Living my best life",
                    iron_flux: "Building the next big thing",
                    zen_cipher: "Unlocking potential...",
                    steel_wraith: "Speaking truth to power",
                  };
                  return (
                    <button
                      key={key}
                      data-testid={`buddy-${key}`}
                      onClick={() => {
                        setSelectedMentor(key);
                        setMentorCleared(false);
                        setActiveTab("chat");
                        setSidebarOpen(false);
                      }}
                      className={cn(
                        "w-full h-11 flex items-center gap-3 px-4 text-left transition-all",
                        isActive
                          ? "bg-white/[0.06] border-l-2 border-l-white/60"
                          : "hover:bg-white/[0.03] border-l-2 border-l-transparent"
                      )}
                    >
                      <div className="relative shrink-0">
                        <div className={cn("w-8 h-8 rounded-lg border border-white/[0.08] flex items-center justify-center text-white text-[10px] font-bold", BOT_COLORS[key])}>{mentor.initials}</div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#0a0a0a]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-[12px] font-semibold truncate leading-tight", isActive ? "text-white" : "text-white/60")}>{mentor.name}</p>
                        <p className={cn("text-[10px] truncate leading-tight", isActive ? "text-white/35" : "text-white/20")}>{statusMessages[key] || mentor.tagline}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-b border-white/[0.04]">
            <button
              onClick={() => setBuddyGroups(prev => ({ ...prev, friends: !prev.friends }))}
              className="w-full h-9 flex items-center gap-2 px-4 hover:bg-white/[0.02] text-left transition-colors"
              data-testid="buddy-group-friends"
            >
              <span className="text-[10px] text-white/15 font-mono w-3">{buddyGroups.friends ? "▾" : "▸"}</span>
              <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Friends</span>
              <span className="text-[10px] text-white/15 ml-auto">({friendsList.length})</span>
            </button>
            {buddyGroups.friends && (
              <div className="pb-1">
                <button
                  onClick={() => setShowAddFriend(true)}
                  className="w-full h-9 flex items-center gap-3 px-4 hover:bg-white/[0.03] text-left transition-colors"
                  data-testid="button-add-friend"
                >
                  <UserPlus className="w-3.5 h-3.5 text-green-400/50" />
                  <span className="text-[11px] text-green-400/50 font-medium">Add Friend</span>
                </button>
                {pendingRequests.length > 0 && (
                  <div className="px-4 py-1">
                    <span className="text-[10px] text-amber-400/50 font-medium">{pendingRequests.length} pending request{pendingRequests.length > 1 ? "s" : ""}</span>
                  </div>
                )}
                {pendingRequests.map((req: any) => (
                  <div key={req.friendshipId} className="h-11 flex items-center gap-3 px-4 hover:bg-white/[0.03] transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-[9px] font-bold text-amber-400">
                      {(req.displayName || "?").substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-white/50 truncate">{req.displayName}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => acceptFriend(req.friendshipId)} className="w-6 h-6 rounded-md bg-green-500/15 hover:bg-green-500/25 flex items-center justify-center" data-testid={`accept-friend-${req.id}`}>
                        <Check className="w-3 h-3 text-green-400" />
                      </button>
                      <button onClick={() => rejectFriend(req.friendshipId)} className="w-6 h-6 rounded-md bg-red-500/15 hover:bg-red-500/25 flex items-center justify-center" data-testid={`reject-friend-${req.id}`}>
                        <X className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
                {friendsList.map((f: any) => (
                  <div key={f.friendshipId} className="group h-11 flex items-center gap-3 px-4 hover:bg-white/[0.03] transition-colors">
                    <div className="relative shrink-0">
                      <div className="w-7 h-7 rounded-lg bg-white/[0.06] border border-white/[0.08] flex items-center justify-center text-[9px] font-bold text-white/50">
                        {(f.displayName || "?").substring(0, 2).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 border-2 border-[#0a0a0a]" />
                    </div>
                    <p className="text-[11px] text-white/50 truncate flex-1">{f.displayName}</p>
                    <button onClick={() => removeFriend(f.friendshipId)} className="hidden group-hover:flex w-5 h-5 rounded-md bg-red-500/10 hover:bg-red-500/20 items-center justify-center" data-testid={`remove-friend-${f.id}`}>
                      <UserX className="w-3 h-3 text-red-400/60" />
                    </button>
                  </div>
                ))}
                {friendsList.length === 0 && pendingRequests.length === 0 && (
                  <div className="h-9 flex items-center px-4">
                    <span className="text-[10px] text-white/10 italic">No friends yet</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-b border-white/[0.04]">
            <button
              onClick={() => setBuddyGroups(prev => ({ ...prev, offline: !prev.offline }))}
              className="w-full h-9 flex items-center gap-2 px-4 hover:bg-white/[0.02] text-left transition-colors"
              data-testid="buddy-group-offline"
            >
              <span className="text-[10px] text-white/15 font-mono w-3">{buddyGroups.offline ? "▾" : "▸"}</span>
              <span className="text-[11px] font-bold text-white/40 uppercase tracking-widest">Recent Chats</span>
            </button>
            {buddyGroups.offline && (
              <div className="pb-1">
                {messages.length > 0 ? (
                  <div className="h-9 flex items-center gap-3 px-4 hover:bg-white/[0.03] cursor-pointer transition-colors">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                    <span className="text-[11px] text-white/30 truncate flex-1">{messages[0]?.content.substring(0, 35)}...</span>
                  </div>
                ) : (
                  <div className="h-9 flex items-center px-4">
                    <span className="text-[10px] text-white/10 italic">No recent conversations</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="h-11 px-4 flex items-center gap-3 border-t border-white/[0.06] bg-white/[0.02]">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
          <span className="text-[10px] text-white/30 flex-1 truncate">{user.displayName || user.email}</span>
          <button
            data-testid="button-logout"
            onClick={logout}
            className="h-7 text-[10px] px-3 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] text-white/30 transition-colors"
          >
            Sign Off
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative z-10 bg-transparent">

        <header className="shrink-0 relative z-10 bg-[#080808]/80 backdrop-blur-xl border-b border-white/[0.06]">
          <div className="h-14 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <button
                data-testid="button-menu"
                onClick={() => setSidebarOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/[0.04] transition-colors md:hidden"
              >
                <Menu className="w-5 h-5 text-white/50" />
              </button>
            </div>
            <button data-testid="button-new-chat-header" onClick={() => { clearChat(); setSelectedMentor(null); setMentorCleared(true); setActiveTab("chat"); }} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/[0.04] transition-colors">
              <Plus className="w-5 h-5 text-white/40" />
            </button>
          </div>
          <div className="flex px-4">
            <button
              data-testid="tab-dashboard"
              onClick={() => setActiveTab("dashboard")}
              className={cn(
                "flex-1 py-2.5 text-[13px] font-semibold text-center transition-colors relative",
                activeTab === "dashboard" ? "text-white" : "text-white/30 hover:text-white/50"
              )}
            >
              <div className="flex items-center justify-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                Dashboard
              </div>
              {activeTab === "dashboard" && <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-white rounded-full" />}
            </button>
            <button
              data-testid="tab-feed"
              onClick={() => { setActiveTab("feed"); if (feedItems.length === 0) fetchFeed(); }}
              className={cn(
                "flex-1 py-2.5 text-[13px] font-semibold text-center transition-colors relative",
                activeTab === "feed" ? "text-white" : "text-white/30 hover:text-white/50"
              )}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Radio className="w-3.5 h-3.5" />
                Live Feed
              </div>
              {activeTab === "feed" && <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-white rounded-full" />}
            </button>
            <button
              data-testid="tab-chat"
              onClick={() => setActiveTab("chat")}
              className={cn(
                "flex-1 py-2.5 text-[13px] font-semibold text-center transition-colors relative",
                activeTab === "chat" ? "text-white" : "text-white/30 hover:text-white/50"
              )}
            >
              <div className="flex items-center justify-center gap-1.5">
                <MessageCircle className="w-3.5 h-3.5" />
                Workspace
              </div>
              {activeTab === "chat" && <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-white rounded-full" />}
            </button>
          </div>
        </header>

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
        >
          {activeTab === "dashboard" ? (
            <div className="w-full px-5 sm:px-8 py-8 max-w-[1200px] mx-auto">

              {fundingLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-white/30" />
                </div>
              ) : fundingData ? (
                <>
                  <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-light text-white tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }} data-testid="text-overview-title">Overview</h1>
                    <p className="text-sm text-white/35 mt-1">Welcome back, {user.displayName || user.email.split("@")[0]}!</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
                    <div className="lg:col-span-2 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/[0.08] p-6" data-testid="funding-score-card">
                      <p className="text-xs text-white/40 mb-1">Capital Readiness Score</p>
                      <div className="flex items-end gap-1">
                        <span className="text-4xl sm:text-5xl font-bold text-white tracking-tight font-mono" data-testid="text-score">{fundingData.score}</span>
                        <span className="text-lg text-white/25 font-light mb-1">/ 100</span>
                      </div>
                      <div className="flex gap-2 mt-5">
                        <button
                          onClick={fetchFundingReadiness}
                          className="flex-1 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] text-xs font-medium text-white/70 transition-colors flex items-center justify-center gap-2"
                          data-testid="button-refresh-score"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> REFRESH
                        </button>
                        <button
                          onClick={() => setActiveTab("chat")}
                          className="flex-1 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] text-xs font-medium text-white/70 transition-colors flex items-center justify-center gap-2"
                          data-testid="button-go-chat"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> ANALYZE
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-3 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/[0.08] p-6" data-testid="stats-row">
                      <div className="grid grid-cols-3 h-full">
                        <div className="flex flex-col justify-center px-2">
                          <p className="text-xs text-white/35 mb-1">Tier</p>
                          <p className="text-xl sm:text-2xl font-bold text-white" data-testid="text-tier">
                            {fundingData.tierEligibility ? `Tier ${fundingData.tierEligibility.tier}` : "—"}
                          </p>
                          <p className="text-[10px] text-white/25 mt-0.5 truncate">{fundingData.tierEligibility?.label || "No data"}</p>
                        </div>
                        <div className="flex flex-col justify-center px-2 border-l border-white/[0.06]">
                          <p className="text-xs text-white/35 mb-1">Mode</p>
                          <p className="text-xl sm:text-2xl font-bold text-white" data-testid="text-mode">
                            {fundingData.operatingMode ? (fundingData.operatingMode.mode === "pre_funding" ? "Pre-Fund" : "Repair") : "—"}
                          </p>
                          <p className="text-[10px] text-white/25 mt-0.5 truncate">{fundingData.operatingMode?.label || "No data"}</p>
                        </div>
                        <div className="flex flex-col justify-center px-2 border-l border-white/[0.06]">
                          <p className="text-xs text-white/35 mb-1">Exposure</p>
                          <p className="text-xl sm:text-2xl font-bold text-white" data-testid="text-exposure">
                            {fundingData.exposureCeiling ? `$${(fundingData.exposureCeiling.ceiling / 1000).toFixed(0)}K` : "—"}
                          </p>
                          <p className="text-[10px] text-white/25 mt-0.5">
                            {fundingData.exposureCeiling ? `${fundingData.exposureCeiling.multiplier}x ceiling` : "No data"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
                    <div className="lg:col-span-2 space-y-4">
                      <div className="rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/[0.08] p-6" data-testid="savings-donut-card">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-white/35 mb-1">Funding Range</p>
                            {fundingData.estimatedRange ? (
                              <>
                                <p className="text-2xl font-bold text-white font-mono" data-testid="text-range">
                                  ${fundingData.estimatedRange.min.toLocaleString()}
                                </p>
                                <p className="text-xs text-white/25 mt-0.5">/ ${fundingData.estimatedRange.max.toLocaleString()}</p>
                              </>
                            ) : (
                              <p className="text-2xl font-bold text-white/30 font-mono">—</p>
                            )}
                          </div>
                          <div className="relative">
                            <DonutChart value={fundingData.score} max={100} size={80} strokeWidth={8} color={getScoreColor(fundingData.score)} />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-sm font-bold text-white">{fundingData.score}%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/[0.08] p-6" data-testid="document-upload-card">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs text-white/40">Document Analysis</p>
                          <span className="text-[9px] text-white/20 bg-white/[0.04] px-2 py-0.5 rounded-full">GPT-4o</span>
                        </div>
                        <input
                          ref={creditReportInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx,.txt,.csv"
                          className="hidden"
                          data-testid="input-credit-report-upload"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleDocumentUpload(file, "credit_report");
                            e.target.value = "";
                          }}
                        />
                        <input
                          ref={bankStatementInputRef}
                          type="file"
                          accept=".pdf,.doc,.docx,.txt,.csv"
                          className="hidden"
                          data-testid="input-bank-statement-upload"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file) handleDocumentUpload(file, "bank_statement");
                            e.target.value = "";
                          }}
                        />
                        <div className="space-y-2">
                          <button
                            onClick={() => creditReportInputRef.current?.click()}
                            disabled={docUploading}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                              fundingData.hasCreditReport
                                ? "border-green-500/20 bg-green-500/[0.04]"
                                : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]",
                              docUploading && docUploadType === "credit_report" && "opacity-50"
                            )}
                            data-testid="button-upload-credit-report"
                          >
                            {docUploading && docUploadType === "credit_report" ? (
                              <Loader2 className="w-5 h-5 text-white/40 animate-spin shrink-0" />
                            ) : fundingData.hasCreditReport ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                            ) : (
                              <Upload className="w-5 h-5 text-white/30 shrink-0" />
                            )}
                            <div>
                              <p className="text-xs font-medium text-white/60">{fundingData.hasCreditReport ? "Credit Report Uploaded" : "Upload Credit Report"}</p>
                              <p className="text-[10px] text-white/20">PDF, DOC, TXT</p>
                            </div>
                          </button>
                          <button
                            onClick={() => bankStatementInputRef.current?.click()}
                            disabled={docUploading}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                              fundingData.hasBankStatement
                                ? "border-green-500/20 bg-green-500/[0.04]"
                                : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.04]",
                              docUploading && docUploadType === "bank_statement" && "opacity-50"
                            )}
                            data-testid="button-upload-bank-statement"
                          >
                            {docUploading && docUploadType === "bank_statement" ? (
                              <Loader2 className="w-5 h-5 text-white/40 animate-spin shrink-0" />
                            ) : fundingData.hasBankStatement ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                            ) : (
                              <Upload className="w-5 h-5 text-white/30 shrink-0" />
                            )}
                            <div>
                              <p className="text-xs font-medium text-white/60">{fundingData.hasBankStatement ? "Bank Statement Uploaded" : "Upload Bank Statement"}</p>
                              <p className="text-[10px] text-white/20">PDF, DOC, TXT</p>
                            </div>
                          </button>
                        </div>
                        {docUploading && (
                          <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                            <Loader2 className="w-4 h-4 text-white/40 animate-spin shrink-0" />
                            <p className="text-[10px] text-white/40">Analyzing document...</p>
                          </div>
                        )}
                        {fundingData.analysisSummary && (
                          <div className="mt-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                            <p className="text-[10px] text-white/50 leading-relaxed">{fundingData.analysisSummary}</p>
                            {fundingData.lastAnalysisDate && (
                              <p className="text-[9px] text-white/20 mt-1.5">{timeAgo(fundingData.lastAnalysisDate)} ago</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="lg:col-span-3 rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/[0.08] p-6" data-testid="component-breakdown-card">
                      <div className="flex items-center justify-between mb-5">
                        <p className="text-xs text-white/40">Component Breakdown</p>
                      </div>
                      {componentChartData.length > 0 ? (
                        <div className="h-[200px] mb-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={componentChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#ffffff" stopOpacity={0.15} />
                                  <stop offset="95%" stopColor="#ffffff" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="maxGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#555555" stopOpacity={0.1} />
                                  <stop offset="95%" stopColor="#555555" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.25)', fontSize: 10 }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(255,255,255,0.15)', fontSize: 10 }} domain={[0, 20]} />
                              <Tooltip
                                contentStyle={{ background: '#222', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '12px', fontSize: '11px', color: '#ccc' }}
                                labelStyle={{ color: 'rgba(255,255,255,0.5)' }}
                              />
                              <Area type="monotone" dataKey="max" stroke="rgba(255,255,255,0.08)" fill="url(#maxGrad)" strokeWidth={1} dot={false} />
                              <Area type="monotone" dataKey="score" stroke="rgba(255,255,255,0.6)" fill="url(#scoreGrad)" strokeWidth={2} dot={{ fill: '#fff', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#fff' }} />
                            </AreaChart>
                          </ResponsiveContainer>
                        </div>
                      ) : null}
                      <div className="space-y-2.5">
                        {fundingData.componentBreakdown && Object.entries(fundingData.componentBreakdown).map(([key, comp]) => {
                          const pct = (comp.score / comp.max) * 100;
                          return (
                            <div key={key} data-testid={`component-${key}`}>
                              <div className="flex items-center justify-between mb-1">
                                <span className="text-[11px] text-white/50">{comp.label}</span>
                                <span className="text-[11px] font-mono text-white/35">{comp.score}/{comp.max}</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-white/[0.04] overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-700 bg-white/40" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {fundingData.alerts.length > 0 && (
                    <div className="rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/[0.08] p-6 mb-4" data-testid="risk-alerts-card">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-xs text-white/40">Risk Alerts</p>
                        <span className="text-[10px] text-white/20">{fundingData.alerts.length} alert{fundingData.alerts.length > 1 ? "s" : ""}</span>
                      </div>
                      <div className="space-y-2">
                        {fundingData.alerts.map((alert, idx) => (
                          <button
                            key={idx}
                            onClick={() => setExpandedAlerts(prev => {
                              const next = new Set(prev);
                              if (next.has(idx)) next.delete(idx); else next.add(idx);
                              return next;
                            })}
                            className={cn(
                              "w-full text-left rounded-xl border-l-[3px] bg-white/[0.02] hover:bg-white/[0.04] transition-all p-3.5",
                              alert.severity === "red" ? "border-l-red-500/60" : alert.severity === "yellow" ? "border-l-yellow-500/60" : "border-l-white/10"
                            )}
                            data-testid={`alert-${idx}`}
                          >
                            <div className="flex items-start gap-3">
                              {alert.severity === "red" ? <AlertCircle className="w-4 h-4 text-red-400/70 shrink-0 mt-0.5" /> :
                               alert.severity === "yellow" ? <AlertTriangle className="w-4 h-4 text-yellow-400/70 shrink-0 mt-0.5" /> :
                               <Info className="w-4 h-4 text-white/20 shrink-0 mt-0.5" />}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white/70">{alert.title}</p>
                                {expandedAlerts.has(idx) && (
                                  <div className="mt-2 space-y-1.5 text-xs">
                                    <p className="text-white/40">{alert.explanation}</p>
                                    <p className="text-white/30"><span className="text-white/45 font-medium">Impact:</span> {alert.impact}</p>
                                    <p className="text-green-400/60"><span className="text-green-400/70 font-medium">Fix:</span> {alert.fix}</p>
                                  </div>
                                )}
                              </div>
                              <ChevronRight className={cn("w-4 h-4 text-white/15 shrink-0 transition-transform mt-0.5", expandedAlerts.has(idx) && "rotate-90")} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {fundingData.denialSimulation && fundingData.denialSimulation.length > 0 && (
                    <div className="rounded-2xl bg-white/[0.03] backdrop-blur-md border border-red-500/10 p-6 mb-4" data-testid="denial-simulation-card">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-xs text-red-400/60">Denial Simulation</p>
                        <span className="text-[10px] text-white/15">{fundingData.denialSimulation.length} trigger{fundingData.denialSimulation.length > 1 ? "s" : ""}</span>
                      </div>
                      <div className="space-y-2">
                        {fundingData.denialSimulation.map((denial, idx) => (
                          <button
                            key={idx}
                            onClick={() => setExpandedDenials(prev => {
                              const next = new Set(prev);
                              if (next.has(idx)) next.delete(idx); else next.add(idx);
                              return next;
                            })}
                            className="w-full text-left rounded-xl bg-white/[0.02] hover:bg-white/[0.04] transition-all p-3.5"
                            data-testid={`denial-${idx}`}
                          >
                            <div className="flex items-start gap-3">
                              <span className={cn(
                                "text-[9px] font-bold uppercase px-2 py-0.5 rounded mt-0.5 shrink-0",
                                denial.riskLevel === "High" ? "bg-red-500/15 text-red-400/80" :
                                denial.riskLevel === "Moderate" ? "bg-yellow-500/15 text-yellow-400/80" :
                                "bg-green-500/15 text-green-400/80"
                              )}>{denial.riskLevel}</span>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-white/60">{denial.trigger}</p>
                                {expandedDenials.has(idx) && (
                                  <div className="mt-2 space-y-1.5 text-xs">
                                    <p className="text-white/35">{denial.explanation}</p>
                                    <p className="text-green-400/50"><span className="text-green-400/60 font-medium">Fix:</span> {denial.fix}</p>
                                  </div>
                                )}
                              </div>
                              <ChevronRight className={cn("w-4 h-4 text-white/10 shrink-0 transition-transform mt-0.5", expandedDenials.has(idx) && "rotate-90")} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {fundingData.actionPlan.length > 0 && (
                    <div className="rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/[0.08] p-6 mb-4" data-testid="action-plan-card">
                      <p className="text-xs text-white/40 mb-4">Action Plan</p>
                      <div className="space-y-2">
                        {fundingData.actionPlan.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02]" data-testid={`action-step-${idx}`}>
                            <div className="w-6 h-6 rounded-full bg-white/[0.06] flex items-center justify-center text-[10px] font-mono text-white/40 shrink-0">
                              {idx + 1}
                            </div>
                            <p className="text-sm text-white/55 leading-relaxed">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {fundingData.analysisNextSteps && fundingData.analysisNextSteps.length > 0 && (
                    <div className="rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/[0.08] p-6 mb-4" data-testid="next-steps-card">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-xs text-white/40">Next Steps</p>
                        <span className="text-[9px] text-white/15 bg-white/[0.04] px-2 py-0.5 rounded-full">AI Generated</span>
                      </div>
                      <div className="space-y-2">
                        {fundingData.analysisNextSteps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02]" data-testid={`next-step-${idx}`}>
                            <Sparkles className="w-4 h-4 text-white/20 shrink-0 mt-0.5" />
                            <p className="text-sm text-white/50 leading-relaxed">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl bg-white/[0.03] backdrop-blur-md border border-orange-500/10 p-6 mb-4" data-testid="credit-repair-card">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs text-orange-400/60">Credit Repair System</p>
                      <span className="text-[9px] text-white/15 bg-white/[0.04] px-2 py-0.5 rounded-full">GPT-4o</span>
                    </div>

                    {!fundingData?.hasCreditReport ? (
                      <div className="text-center py-8">
                        <FileText className="w-8 h-8 text-white/10 mx-auto mb-3" />
                        <p className="text-sm text-white/35 mb-1">Upload a credit report first</p>
                        <p className="text-[10px] text-white/20">The repair system needs your credit report to detect issues and generate dispute letters.</p>
                      </div>
                    ) : !repairData ? (
                      <div className="text-center py-8">
                        <p className="text-sm text-white/40 mb-4">Credit report uploaded. Run the repair analysis to detect issues.</p>
                        <button
                          onClick={runRepairAnalysis}
                          disabled={repairAnalyzing}
                          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] text-white/60 text-sm font-medium transition-all disabled:opacity-50"
                          data-testid="button-run-repair"
                        >
                          {repairAnalyzing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                          {repairAnalyzing ? "Analyzing Report..." : "Run Credit Repair Analysis"}
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        <div className="flex items-center gap-2">
                          <span className={cn(
                            "text-[9px] font-bold uppercase px-2.5 py-1 rounded",
                            repairData.mode === "repair" ? "bg-amber-500/10 text-amber-400/70" : "bg-emerald-500/10 text-emerald-400/70"
                          )}>{repairData.mode === "repair" ? "Repair Mode" : "Pre-Funding Mode"}</span>
                          <button
                            onClick={runRepairAnalysis}
                            disabled={repairAnalyzing}
                            className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] text-[10px] text-white/35 hover:text-white/50 transition-all disabled:opacity-50"
                            data-testid="button-rerun-repair"
                          >
                            {repairAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                            Re-analyze
                          </button>
                        </div>

                        {repairData.summary && (
                          <div className="p-4 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                            <p className="text-[10px] text-white/30 mb-1.5">What's Hurting Your Profile</p>
                            <p className="text-sm text-white/55 leading-relaxed mb-2">{repairData.summary.mainIssues}</p>
                            <p className="text-[10px] text-orange-400/50 mb-1">Priority Action</p>
                            <p className="text-sm text-white/45 leading-relaxed">{repairData.summary.priorityAction}</p>
                          </div>
                        )}

                        {repairData.detectedIssues && repairData.detectedIssues.length > 0 && (
                          <div>
                            <p className="text-[10px] text-white/25 uppercase tracking-widest mb-3">Detected Issues ({repairData.detectedIssues.length})</p>
                            <div className="space-y-2">
                              {repairData.detectedIssues.map((issue: any, idx: number) => (
                                <div key={idx} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]" data-testid={`repair-issue-${idx}`}>
                                  <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                    <span className={cn(
                                      "text-[9px] font-bold uppercase px-2 py-0.5 rounded",
                                      issue.severity === "High" ? "bg-red-500/10 text-red-400/70" :
                                      issue.severity === "Medium" ? "bg-yellow-500/10 text-yellow-400/70" :
                                      "bg-green-500/10 text-green-400/70"
                                    )}>{issue.severity}</span>
                                    <span className="text-[10px] text-white/25">{issue.bureau}</span>
                                    <span className="text-[10px] text-white/15">·</span>
                                    <span className="text-[10px] text-white/35">{issue.issueType}</span>
                                  </div>
                                  <p className="text-sm text-white/60">{issue.creditor} {issue.accountLast4 !== "N/A" ? `(****${issue.accountLast4})` : ""}</p>
                                  {issue.monthsAffected !== "N/A" && (
                                    <p className="text-[10px] text-white/25 mt-1">Months: {issue.monthsAffected}</p>
                                  )}
                                  <p className="text-[10px] text-white/30 mt-1.5">Attach: {issue.proofToAttach}</p>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {repairData.actionPlan && repairData.actionPlan.length > 0 && (
                          <div>
                            <p className="text-[10px] text-white/25 uppercase tracking-widest mb-3">Repair Action Plan</p>
                            <div className="space-y-2">
                              {repairData.actionPlan.map((step: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02]" data-testid={`repair-step-${idx}`}>
                                  <div className="w-6 h-6 rounded-full bg-white/[0.04] flex items-center justify-center text-[10px] font-mono text-white/30 shrink-0">
                                    {step.step || idx + 1}
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white/55">{step.action}</p>
                                    <div className="flex items-center gap-3 mt-1">
                                      <span className="text-[10px] text-orange-400/40 font-mono">{step.timing}</span>
                                      {step.details && <span className="text-[10px] text-white/25">{step.details}</span>}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {repairData.letters && repairData.letters.length > 0 && (
                          <div>
                            <p className="text-[10px] text-white/25 uppercase tracking-widest mb-3">Generated Dispute Letters ({repairData.letters.length})</p>
                            <div className="space-y-2">
                              {repairData.letters.map((letter: any, idx: number) => (
                                <div key={idx} className="rounded-xl bg-white/[0.02] border border-white/[0.04] overflow-hidden" data-testid={`letter-${idx}`}>
                                  <button
                                    onClick={() => setExpandedLetters(prev => {
                                      const next = new Set(prev);
                                      if (next.has(idx)) next.delete(idx); else next.add(idx);
                                      return next;
                                    })}
                                    className="w-full text-left p-3.5 flex items-center gap-3 hover:bg-white/[0.02] transition-colors"
                                    data-testid={`button-expand-letter-${idx}`}
                                  >
                                    <FileText className="w-4 h-4 text-orange-400/40 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-white/55 truncate">{letter.subject || `${letter.type === "bureau_dispute" ? "Bureau" : letter.type === "creditor_dispute" ? "Creditor" : "Info Correction"} Letter`}</p>
                                      <p className="text-[10px] text-white/25 truncate">To: {letter.recipientName}</p>
                                    </div>
                                    <ChevronRight className={cn("w-4 h-4 text-white/10 shrink-0 transition-transform", expandedLetters.has(idx) && "rotate-90")} />
                                  </button>
                                  {expandedLetters.has(idx) && (
                                    <div className="px-3.5 pb-3.5 border-t border-white/[0.04]">
                                      <div className="flex items-center gap-2 py-2">
                                        <span className="text-[9px] text-white/20">To: {letter.recipientAddress}</span>
                                        <button
                                          onClick={() => copyLetterToClipboard(letter.body, idx)}
                                          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.04] border border-white/[0.06] hover:bg-white/[0.08] text-[10px] text-white/40 font-medium transition-all"
                                          data-testid={`button-copy-letter-${idx}`}
                                        >
                                          {copiedLetter === idx ? <CheckCircle2 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                          {copiedLetter === idx ? "Copied!" : "Copy Letter"}
                                        </button>
                                      </div>
                                      <div className="mt-2 p-4 rounded-xl bg-black/40 border border-white/[0.04] font-mono text-[10px] text-white/45 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                                        {letter.body}
                                      </div>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {repairData.disclaimer && (
                          <p className="text-[9px] text-white/15 italic mt-2 px-1">{repairData.disclaimer}</p>
                        )}
                      </div>
                    )}
                  </div>

                  <div className="rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/[0.08] p-6 mb-4" data-testid="insights-card">
                    <p className="text-xs text-white/40 mb-4">Insights</p>
                    <div className="space-y-2">
                      {INSIGHTS.map((insight, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]" data-testid={`insight-${idx}`}>
                          <p className="text-sm text-white/55 mb-1">{insight.title}</p>
                          <p className="text-[11px] text-white/30 leading-relaxed">{insight.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/[0.03] backdrop-blur-md border border-white/[0.08] overflow-hidden mb-4" data-testid="dashboard-qa-card">
                    <button
                      onClick={() => setQaOpen(!qaOpen)}
                      className="w-full px-6 py-4 flex items-center justify-between hover:bg-white/[0.02] transition-colors"
                      data-testid="button-toggle-qa"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-xl bg-white/[0.04] border border-white/[0.06] flex items-center justify-center">
                          <MessageCircle className="w-4 h-4 text-white/40" />
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-medium text-white/70">Ask AI About Your Report</p>
                          <p className="text-[10px] text-white/25">Get personalized answers based on your uploaded financial data</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {qaMessages.length > 0 && (
                          <span className="text-[9px] text-white/20 bg-white/[0.04] px-2 py-0.5 rounded-full">{Math.floor(qaMessages.length / 2)} Q&A</span>
                        )}
                        <ChevronDown className={cn("w-4 h-4 text-white/20 transition-transform", qaOpen && "rotate-180")} />
                      </div>
                    </button>

                    {qaOpen && (
                      <div className="border-t border-white/[0.06]">
                        <div className="max-h-[400px] overflow-y-auto px-4 py-3 space-y-3" style={{ scrollbarWidth: 'thin' }}>
                          {qaMessages.length === 0 && !qaLoading && (
                            <div className="flex flex-col items-center justify-center py-8">
                              <Sparkles className="w-6 h-6 text-white/10 mb-2" />
                              <p className="text-xs text-white/25 text-center">Ask anything about your credit report, funding readiness, or financial profile</p>
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-4 w-full max-w-md">
                                {[
                                  "What's hurting my credit score?",
                                  "Am I ready for funding?",
                                  "How can I lower my balances?",
                                  "What accounts should I dispute?",
                                ].map((suggestion, i) => (
                                  <button
                                    key={i}
                                    data-testid={`button-qa-suggestion-${i}`}
                                    onClick={() => { setQaInput(suggestion); qaInputRef.current?.focus(); }}
                                    className="text-left px-3 py-2.5 rounded-xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-all text-[11px] text-white/35 hover:text-white/55"
                                  >
                                    {suggestion}
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {qaMessages.map((msg: any) => (
                            <div key={msg.id} className={cn("flex gap-2.5", msg.role === "user" ? "justify-end" : "justify-start")} data-testid={`qa-msg-${msg.id}`}>
                              {msg.role === "assistant" && (
                                <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0 mt-0.5">
                                  <Cpu className="w-3.5 h-3.5 text-white/30" />
                                </div>
                              )}
                              <div className={cn(
                                "max-w-[80%] rounded-2xl px-4 py-3",
                                msg.role === "user"
                                  ? "bg-white/[0.08] border border-white/[0.1]"
                                  : "bg-white/[0.02] border border-white/[0.04]"
                              )}>
                                <p className="text-[12px] text-white/55 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                <p className="text-[9px] text-white/15 mt-1.5">
                                  {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                </p>
                              </div>
                            </div>
                          ))}

                          {qaLoading && (
                            <div className="flex gap-2.5 justify-start">
                              <div className="w-7 h-7 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center shrink-0">
                                <Cpu className="w-3.5 h-3.5 text-white/30" />
                              </div>
                              <div className="bg-white/[0.02] border border-white/[0.04] rounded-2xl px-4 py-3">
                                <div className="flex items-center gap-2">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white/25" />
                                  <span className="text-[11px] text-white/25">Analyzing your data...</span>
                                </div>
                              </div>
                            </div>
                          )}
                          <div ref={qaEndRef} />
                        </div>

                        <div className="px-4 pb-4 pt-2 border-t border-white/[0.04]">
                          <div className="flex gap-2">
                            <textarea
                              ref={qaInputRef}
                              data-testid="input-qa"
                              value={qaInput}
                              onChange={(e) => setQaInput(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" && !e.shiftKey) {
                                  e.preventDefault();
                                  sendQA();
                                }
                              }}
                              placeholder="Ask about your report..."
                              className="flex-1 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3.5 py-2.5 text-sm text-white/70 placeholder:text-white/20 resize-none focus:outline-none focus:border-white/[0.12] transition-colors"
                              rows={1}
                            />
                            <button
                              data-testid="button-send-qa"
                              onClick={sendQA}
                              disabled={!qaInput.trim() || qaLoading}
                              className="w-10 h-10 rounded-xl bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] disabled:opacity-30 flex items-center justify-center transition-colors shrink-0"
                            >
                              <Send className="w-4 h-4 text-white/50" />
                            </button>
                          </div>
                          {qaMessages.length > 0 && (
                            <button
                              data-testid="button-clear-qa"
                              onClick={clearQA}
                              className="mt-2 text-[10px] text-white/15 hover:text-white/30 transition-colors"
                            >
                              Clear conversation
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <AlertCircle className="w-8 h-8 text-white/15 mb-3" />
                  <p className="text-sm text-white/35">Unable to load dashboard</p>
                  <button onClick={fetchFundingReadiness} className="mt-3 text-xs text-white/25 hover:text-white/50 underline">
                    Try again
                  </button>
                </div>
              )}
            </div>
          ) : activeTab === "feed" ? (
            <div className="w-full h-full flex flex-col" style={{ background: '#000' }}>
              {feedLoading && feedItems.length === 0 ? (
                <div className="flex-1 flex items-center justify-center">
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-8 h-8 animate-spin text-white/30" />
                    <p className="text-xs text-white/30">Loading shorts...</p>
                  </div>
                </div>
              ) : feedItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <Radio className="w-8 h-8 text-white/15 mb-3" />
                  <p className="text-sm text-white/35">No content available yet</p>
                  <button onClick={() => fetchFeed()} className="mt-3 text-xs text-white/25 hover:text-white/50 underline" data-testid="button-refresh-feed">Refresh</button>
                </div>
              ) : (() => {
                const videoItems = feedItems.filter((item: any) => {
                  if (item.contentType !== "video") return false;
                  const vid = item.link?.match(/[?&]v=([^&]+)/)?.[1];
                  return !!vid;
                });
                if (videoItems.length === 0) return (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <Play className="w-8 h-8 text-white/15 mb-3" />
                    <p className="text-sm text-white/35">No videos available</p>
                  </div>
                );

                return (
                  <div
                    ref={shortsContainerRef}
                    className="flex-1 overflow-y-scroll snap-y snap-mandatory scrollbar-hide"
                    style={{ scrollBehavior: 'smooth' }}
                    onScroll={(e) => {
                      const el = e.currentTarget;
                      const idx = Math.round(el.scrollTop / el.clientHeight);
                      if (idx !== currentShortIndex) {
                        setCurrentShortIndex(idx);
                        if (idx >= videoItems.length - 3 && feedHasMore) {
                          const next = feedPage + 1;
                          setFeedPage(next);
                          fetchFeed(next, feedFilter, true);
                        }
                      }
                    }}
                    data-testid="shorts-container"
                  >
                    {videoItems.map((item: any, idx: number) => {
                      const videoId = item.link.match(/[?&]v=([^&]+)/)?.[1];
                      const isActive = idx === currentShortIndex;

                      return (
                        <div
                          key={item.id}
                          className="snap-start w-full relative flex items-center justify-center"
                          style={{ height: '100%', minHeight: '100%' }}
                          data-testid={`short-${item.id}`}
                        >
                          <div className="absolute inset-0 bg-black">
                            {isActive && shortsAutoplay ? (
                              <iframe
                                src={`https://www.youtube.com/embed/${videoId}?autoplay=1&rel=0&modestbranding=1&playsinline=1&loop=1&playlist=${videoId}&controls=1`}
                                className="absolute inset-0 w-full h-full"
                                allow="autoplay; encrypted-media; picture-in-picture"
                                allowFullScreen
                                title={item.title}
                              />
                            ) : (
                              <>
                                <img
                                  src={`https://img.youtube.com/vi/${videoId}/hqdefault.jpg`}
                                  alt={item.title}
                                  className="absolute inset-0 w-full h-full object-cover"
                                  loading="lazy"
                                />
                                <div className="absolute inset-0 bg-black/40" />
                                <button
                                  onClick={() => {
                                    setCurrentShortIndex(idx);
                                    setShortsAutoplay(true);
                                  }}
                                  className="absolute inset-0 flex items-center justify-center z-10"
                                  data-testid={`play-short-${idx}`}
                                >
                                  <div className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/20">
                                    <Play className="w-7 h-7 text-white ml-1" fill="white" />
                                  </div>
                                </button>
                              </>
                            )}
                          </div>

                          <div className="absolute bottom-0 left-0 right-16 p-4 pb-6 z-20" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.85))' }}>
                            <div className="flex items-center gap-2.5 mb-2.5">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 via-pink-500 to-purple-500 flex items-center justify-center text-[11px] font-bold text-white border-2 border-white/30 shadow-lg">
                                {item.source.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-white truncate">{item.source}</p>
                                <p className="text-[10px] text-white/50">{timeAgo(item.publishedAt)}</p>
                              </div>
                              <span className="text-[9px] px-2 py-1 rounded-full bg-white/10 text-white/60 border border-white/10 uppercase tracking-wider font-medium">
                                {item.category}
                              </span>
                            </div>
                            <h3 className="text-[14px] font-medium text-white leading-snug line-clamp-2 drop-shadow-lg">{item.title}</h3>
                            {item.description && (
                              <p className="text-[11px] text-white/50 leading-relaxed line-clamp-1 mt-1">{item.description}</p>
                            )}
                          </div>

                          <div className="absolute right-3 bottom-20 z-20 flex flex-col items-center gap-5">
                            <button
                              className="flex flex-col items-center gap-1 group"
                              onClick={() => {
                                if (item.link) window.open(item.link, '_blank');
                              }}
                              data-testid={`link-${item.id}`}
                            >
                              <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-colors">
                                <ExternalLink className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-[9px] text-white/50">Open</span>
                            </button>
                            <button
                              className="flex flex-col items-center gap-1 group"
                              onClick={() => {
                                navigator.clipboard.writeText(item.link || '');
                                toast({ title: "Link copied!" });
                              }}
                            >
                              <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center border border-white/10 group-hover:bg-white/20 transition-colors">
                                <Share2 className="w-4 h-4 text-white" />
                              </div>
                              <span className="text-[9px] text-white/50">Share</span>
                            </button>
                          </div>

                          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h1 className="text-[15px] font-bold text-white drop-shadow-lg flex items-center gap-1.5" data-testid="text-feed-title">
                                Shorts
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                              </h1>
                              <span className="text-[10px] text-white/30 ml-1">{idx + 1}/{videoItems.length}</span>
                            </div>
                            <div className="flex items-center gap-2">
                              <div className="flex gap-1 overflow-x-auto scrollbar-hide" data-testid="feed-filters">
                                {[
                                  { key: "all", label: "All" },
                                  { key: "finance", label: "Finance" },
                                  { key: "business", label: "Business" },
                                  { key: "realestate", label: "Real Estate" },
                                  { key: "credit", label: "Credit" },
                                  { key: "stocks", label: "Stocks" },
                                ].map(f => (
                                  <button
                                    key={f.key}
                                    data-testid={`filter-${f.key}`}
                                    onClick={() => { setFeedFilter(f.key); setFeedPage(0); setCurrentShortIndex(0); fetchFeed(0, f.key); }}
                                    className={cn(
                                      "px-2.5 py-1 rounded-full text-[9px] font-medium whitespace-nowrap transition-all",
                                      feedFilter === f.key
                                        ? "bg-white/20 text-white"
                                        : "bg-white/5 text-white/40 hover:bg-white/10"
                                    )}
                                  >
                                    {f.label}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                );
              })()}
            </div>
          ) : (
            <div className="max-w-xl mx-auto w-full">
              {!hasMessages && (
                <div className="flex flex-col items-center justify-center py-16 px-4">
                  {activeMentor ? (
                    <>
                      <div className={cn("w-20 h-20 rounded-2xl flex items-center justify-center text-white text-xl font-bold border border-white/10 mb-4", activeMentorKey ? BOT_COLORS[activeMentorKey] : "")}>
                        {activeMentor.initials}
                      </div>
                      <h2 className="text-xl font-bold mb-0.5">{activeMentor.name}</h2>
                      <p className="text-white/30 text-sm text-center max-w-xs">{activeMentor.specialty} · {activeMentor.tagline}</p>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-2xl mb-4 bg-white/[0.06] border border-white/[0.06] flex items-center justify-center relative">
                        <span className="absolute w-10 h-10 rounded-full bg-white/[0.06] animate-ping" />
                        <span className="relative w-5 h-5 rounded-full bg-white shadow-[0_0_12px_rgba(255,255,255,0.2)]" />
                      </div>
                      <h2 className="text-xl font-bold mb-0.5">MentXr®</h2>
                      <p className="text-white/30 text-sm text-center max-w-xs">Mentorship On Demand</p>
                    </>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-8 max-w-md w-full">
                    {[
                      { text: "Analyze my credit report", icon: "📊" },
                      { text: "How do I improve my funding score?", icon: "📈" },
                      { text: "What do lenders look for?", icon: "🎯" },
                      { text: "Help me build a funding strategy", icon: "💡" },
                    ].map((prompt, i) => (
                      <button
                        key={i}
                        data-testid={`button-chat-suggestion-${i}`}
                        onClick={() => {
                          setInput(prompt.text);
                          textareaRef.current?.focus();
                        }}
                        className="text-left px-4 py-3 rounded-2xl border border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05] transition-all text-sm text-white/40 hover:text-white/60 flex items-center gap-3"
                      >
                        <span className="text-lg">{prompt.icon}</span>
                        <span>{prompt.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="divide-y divide-white/[0.04]">
                {messages.map((m) => {
                  const mentorData = m.role === 'assistant' && m.mentor ? MENTOR_INFO[m.mentor] : null;
                  const isUser = m.role === "user";
                  const posterName = isUser ? "You" : (mentorData ? mentorData.name : "MentXr® AI");
                  const posterHandle = isUser ? `@${user.displayName || user.email.split("@")[0]}` : (mentorData ? `@${m.mentor}` : "@mentxr");
                  const posterInitials = isUser ? null : (mentorData ? mentorData.initials : null);
                  const posterMentorKey = isUser ? null : (m.mentor || null);
                  const posterSpecialty = !isUser && mentorData ? mentorData.specialty : (!isUser ? "AI Mentor" : null);

                  return (
                    <div key={m.id} className="px-4 py-4 hover:bg-white/[0.01] transition-colors" data-testid={`post-${m.id}`}>
                      <div className="flex gap-3">
                        <div className="shrink-0">
                          {isUser ? (
                            <div className="w-10 h-10 rounded-full bg-white/[0.06] border border-white/[0.06] flex items-center justify-center text-[12px] font-bold text-white/40">
                              {(user.displayName || user.email).substring(0, 2).toUpperCase()}
                            </div>
                          ) : posterInitials && posterMentorKey ? (
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold border border-white/10", BOT_COLORS[posterMentorKey])}>{posterInitials}</div>
                          ) : (
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center relative bg-white/[0.06]">
                              <span className="absolute w-5 h-5 rounded-full bg-white/[0.08] animate-ping" />
                              <span className="relative w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[14px] font-bold text-white/80 truncate">{posterName}</span>
                            {!isUser && (
                              <span className="shrink-0">
                                <svg className="w-[14px] h-[14px] text-white/50" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                              </span>
                            )}
                            <span className="text-[13px] text-white/20 truncate">{posterHandle}</span>
                            <span className="text-white/10 text-[13px]">·</span>
                            <span className="text-[13px] text-white/20 shrink-0">{m.timestamp ? timeAgo(m.timestamp) : "now"}</span>
                          </div>

                          {posterSpecialty && (
                            <p className="text-[11px] text-white/25 mb-2">{posterSpecialty}</p>
                          )}

                          {m.attachment && (
                            <div className="inline-flex items-center gap-2 mb-2.5 px-3 py-1.5 rounded-xl bg-white/[0.03] border border-white/[0.06] text-[12px] text-white/30">
                              <FileText className="w-3.5 h-3.5" />
                              {m.attachment.replace("_", " ")}.pdf
                            </div>
                          )}

                          <div className="text-[14px] sm:text-[15px] leading-[1.6] text-white/65 whitespace-pre-wrap break-words">
                            {m.content.length > TRUNCATE_LENGTH && !expandedMessages.has(m.id) ? (
                              <>
                                {m.content.substring(0, TRUNCATE_LENGTH).trimEnd()}...
                                <button
                                  onClick={() => toggleExpand(m.id)}
                                  className="text-white/40 hover:text-white/60 ml-1 text-[13px] font-medium"
                                  data-testid={`button-readmore-${m.id}`}
                                >
                                  Read more
                                </button>
                              </>
                            ) : (
                              <>
                                {m.content}
                                {m.content.length > TRUNCATE_LENGTH && (
                                  <button
                                    onClick={() => toggleExpand(m.id)}
                                    className="block text-white/25 hover:text-white/40 mt-1 text-[13px] font-medium"
                                    data-testid={`button-showless-${m.id}`}
                                  >
                                    Show less
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {isLoading && (
                  <div className="px-4 py-4">
                    <div className="flex gap-3">
                      <div className="shrink-0">
                        {activeMentor ? (
                          <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold border border-white/10", activeMentorKey ? BOT_COLORS[activeMentorKey] : "")}>{activeMentor.initials}</div>
                        ) : (
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center relative bg-white/[0.06]">
                            <span className="absolute w-5 h-5 rounded-full bg-white/[0.08] animate-ping" />
                            <span className="relative w-2.5 h-2.5 rounded-full bg-white shadow-[0_0_8px_rgba(255,255,255,0.2)]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[14px] font-bold text-white/80">{activeMentor ? activeMentor.name : "MentXr® AI"}</span>
                          <span className="shrink-0">
                            <svg className="w-[14px] h-[14px] text-white/50" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 py-2">
                          <span className="w-2 h-2 bg-white/20 rounded-full animate-bounce"></span>
                          <span className="w-2 h-2 bg-white/20 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                          <span className="w-2 h-2 bg-white/20 rounded-full animate-bounce [animation-delay:0.3s]"></span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div ref={messagesEndRef} className="h-4" />
            </div>
          )}
        </div>

        {showScrollBtn && (
          <div className="absolute bottom-28 sm:bottom-32 left-1/2 -translate-x-1/2 z-10 md:left-[calc(50%+130px)]">
            <button
              onClick={scrollToBottom}
              className="w-9 h-9 rounded-full bg-white/[0.06] border border-white/[0.06] backdrop-blur-lg flex items-center justify-center hover:bg-white/[0.1] transition-colors shadow-lg"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="shrink-0 border-t border-white/[0.04] bg-[#080808]/80 backdrop-blur-xl px-3 sm:px-4 pb-3 sm:pb-4 pt-2 safe-area-pb">
          <div className="max-w-xl mx-auto">
            {activeMentor && hasMessages && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold border border-white/10", activeMentorKey ? BOT_COLORS[activeMentorKey] : "")}>{activeMentor.initials}</div>
                <span className="text-[11px] text-white/20">Replying to <span className="text-white/40 font-medium">{activeMentor.name}</span></span>
                <button onClick={() => { setSelectedMentor(null); setMentorCleared(true); }} className="text-white/15 hover:text-white/40 ml-auto" data-testid="button-clear-mentor">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {attachedFile && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="flex items-center gap-2 bg-white/[0.03] border border-white/[0.06] rounded-xl px-3 py-1.5 text-[12px] text-white/40">
                  <FileText className="w-3.5 h-3.5 text-white/25 shrink-0" />
                  <span className="truncate max-w-[180px]">{attachedFile.name}</span>
                  <button
                    onClick={() => setAttachedFile(null)}
                    className="text-white/20 hover:text-white/50 ml-1"
                    data-testid="button-remove-file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-end gap-2">
              <div className="shrink-0">
                <div className="w-8 h-8 rounded-full bg-white/[0.06] border border-white/[0.06] flex items-center justify-center text-[10px] font-bold text-white/35">
                  {(user.displayName || user.email).substring(0, 2).toUpperCase()}
                </div>
              </div>
              <div className="flex-1 relative flex items-end bg-white/[0.03] border border-white/[0.06] rounded-2xl px-4 py-2.5 focus-within:border-white/[0.1] focus-within:bg-white/[0.04] transition-all">
                <textarea
                  ref={textareaRef}
                  data-testid="input-message"
                  value={input}
                  onChange={handleTextareaInput}
                  onKeyDown={handleKeyDown}
                  placeholder="Message MentXr..."
                  rows={1}
                  className="flex-1 bg-transparent outline-none resize-none text-[14px] text-white/80 placeholder-white/20 max-h-[200px] leading-relaxed"
                  style={{ scrollbarWidth: 'thin' }}
                />
                <div className="flex items-center gap-1 ml-2">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.csv"
                    className="hidden"
                    data-testid="input-file"
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setAttachedFile(e.target.files[0]);
                      }
                      e.target.value = "";
                    }}
                  />
                  <button
                    data-testid="button-attach"
                    onClick={() => fileInputRef.current?.click()}
                    className="w-8 h-8 flex items-center justify-center rounded-xl hover:bg-white/[0.06] transition-colors text-white/25 hover:text-white/50"
                  >
                    <Paperclip className="w-4 h-4" />
                  </button>
                  <button
                    data-testid="button-send"
                    onClick={handleSend}
                    disabled={!input.trim() && !attachedFile || isLoading}
                    className={cn(
                      "w-8 h-8 flex items-center justify-center rounded-xl transition-all",
                      (input.trim() || attachedFile) && !isLoading
                        ? "bg-white text-black hover:bg-white/90"
                        : "text-white/15"
                    )}
                  >
                    {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>

      {showAddFriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowAddFriend(false)}>
          <div className="w-[340px] bg-[#111]/95 backdrop-blur-xl border border-white/[0.06] rounded-2xl p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-white/70">Add Friend</p>
              <button onClick={() => setShowAddFriend(false)} className="text-white/25 hover:text-white/50">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
              <input
                data-testid="input-friend-search"
                type="text"
                value={friendSearch}
                onChange={e => { setFriendSearch(e.target.value); searchFriends(e.target.value); }}
                placeholder="Search by name..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/[0.04] border border-white/[0.06] text-sm text-white/70 placeholder-white/20 outline-none focus:border-white/[0.12]"
              />
            </div>
            {friendSearchLoading && <p className="text-[10px] text-white/25 text-center py-2">Searching...</p>}
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {friendSearchResults.map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.03] transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-white/[0.04] border border-white/[0.06] flex items-center justify-center text-[10px] font-bold text-white/35">
                    {(u.displayName || u.email || "?").substring(0, 2).toUpperCase()}
                  </div>
                  <p className="text-sm text-white/50 flex-1 truncate">{u.displayName || u.email}</p>
                  <button onClick={() => sendFriendRequest(u.id)} className="h-7 px-3 rounded-lg bg-white/[0.06] hover:bg-white/[0.1] text-[10px] text-white/50 font-medium transition-colors" data-testid={`add-friend-${u.id}`}>
                    Add
                  </button>
                </div>
              ))}
              {friendSearch.length >= 2 && !friendSearchLoading && friendSearchResults.length === 0 && (
                <p className="text-[10px] text-white/20 text-center py-3">No users found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
