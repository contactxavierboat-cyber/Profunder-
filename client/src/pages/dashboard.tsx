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
    interface Blob { x: number; y: number; vx: number; vy: number; radius: number; opacity: number; phase: number; wobbleSpeed: number; wobbleAmp: number; points: number; squeezePhase: number; squeezeSpeed: number; squeezeAmount: number; }
    let blobs: Blob[] = [];
    let time = 0;
    const resize = () => {
      const w = window.innerWidth; const h = Math.max(window.innerHeight, document.documentElement.scrollHeight);
      canvas.style.width = w + 'px'; canvas.style.height = h + 'px';
      canvas.width = w * window.devicePixelRatio; canvas.height = h * window.devicePixelRatio;
      ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    };
    const init = () => {
      const w = window.innerWidth; const h = window.innerHeight;
      const count = Math.min(Math.floor((w * h) / 40000), 30);
      blobs = [];
      for (let i = 0; i < count; i++) {
        const speed = Math.random() * 1.0 + 0.5; const angle = Math.random() * Math.PI * 2;
        blobs.push({ x: Math.random() * w, y: Math.random() * h, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed, radius: Math.random() * 100 + 50, opacity: Math.random() * 0.18 + 0.1, phase: Math.random() * Math.PI * 2, wobbleSpeed: Math.random() * 1.2 + 0.5, wobbleAmp: Math.random() * 0.35 + 0.15, points: Math.floor(Math.random() * 4) + 6, squeezePhase: Math.random() * Math.PI * 2, squeezeSpeed: Math.random() * 1.5 + 0.6, squeezeAmount: Math.random() * 0.4 + 0.25 });
      }
    };
    const drawBlob = (b: Blob) => {
      const breathe = Math.sin(time * 0.6 + b.phase) * 0.12 + 1;
      const r = b.radius * breathe;
      const sqz = Math.sin(time * b.squeezeSpeed + b.squeezePhase) * b.squeezeAmount;
      const scaleX = 1 + sqz; const scaleY = 1 - sqz;
      const pts: { x: number; y: number }[] = [];
      for (let i = 0; i < b.points; i++) {
        const a = (Math.PI * 2 / b.points) * i;
        const wobble = Math.sin(time * b.wobbleSpeed + b.phase + i * 1.3) * b.wobbleAmp;
        const dist = r * (1 + wobble);
        pts.push({ x: b.x + Math.cos(a) * dist * scaleX, y: b.y + Math.sin(a) * dist * scaleY });
      }
      ctx.beginPath();
      ctx.moveTo((pts[pts.length - 1].x + pts[0].x) / 2, (pts[pts.length - 1].y + pts[0].y) / 2);
      for (let i = 0; i < pts.length; i++) {
        const next = pts[(i + 1) % pts.length];
        ctx.quadraticCurveTo(pts[i].x, pts[i].y, (pts[i].x + next.x) / 2, (pts[i].y + next.y) / 2);
      }
      ctx.closePath();
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, r * 1.3);
      grad.addColorStop(0, `rgba(155, 155, 172, ${b.opacity * 1.5})`);
      grad.addColorStop(0.35, `rgba(145, 145, 165, ${b.opacity * 1.1})`);
      grad.addColorStop(0.65, `rgba(135, 135, 155, ${b.opacity * 0.55})`);
      grad.addColorStop(1, `rgba(125, 125, 145, 0)`);
      ctx.fillStyle = grad; ctx.fill();
      const edgeGrad = ctx.createRadialGradient(b.x, b.y, r * 0.6, b.x, b.y, r * 1.1);
      edgeGrad.addColorStop(0, `rgba(170, 170, 185, 0)`);
      edgeGrad.addColorStop(0.7, `rgba(165, 165, 182, ${b.opacity * 0.45})`);
      edgeGrad.addColorStop(1, `rgba(165, 165, 182, 0)`);
      ctx.fillStyle = edgeGrad; ctx.fill();
    };
    const draw = () => {
      const w = window.innerWidth; const h = window.innerHeight;
      ctx.clearRect(0, 0, w, h); time += 0.016;
      blobs.forEach(b => {
        b.x += b.vx; b.y += b.vy;
        const margin = b.radius * 2;
        if (b.x < -margin) b.x = w + margin; if (b.x > w + margin) b.x = -margin;
        if (b.y < -margin) b.y = h + margin; if (b.y > h + margin) b.y = -margin;
        drawBlob(b);
      });
      animationId = requestAnimationFrame(draw);
    };
    resize(); init(); draw();
    const resizeHandler = () => { resize(); init(); };
    window.addEventListener('resize', resizeHandler);
    return () => { cancelAnimationFrame(animationId); window.removeEventListener('resize', resizeHandler); };
  }, []);
  return <canvas ref={canvasRef} className="fixed top-0 left-0 pointer-events-none" style={{ zIndex: 1 }} />;
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

function DonutChart({ value, max, size = 120, strokeWidth = 10, color = "#3a3a5a" }: { value: number; max: number; size?: number; strokeWidth?: number; color?: string }) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const pct = Math.min(value / max, 1);
  const offset = circumference - pct * circumference;
  return (
    <svg width={size} height={size} className="-rotate-90">
      <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e0e0ea" strokeWidth={strokeWidth} />
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
  const [activeTab, setActiveTab] = useState<"dashboard" | "feed" | "chat" | "creatorai" | "repair">("dashboard");
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
  const [creatorAiInput, setCreatorAiInput] = useState("");
  const [creatorAiLoading, setCreatorAiLoading] = useState(false);
  const [creatorAiMessages, setCreatorAiMessages] = useState<{role: "user" | "assistant"; content: string}[]>([]);
  const [creatorAiUploading, setCreatorAiUploading] = useState(false);
  const shortsContainerRef = useRef<HTMLDivElement>(null);

  const [dmFriendId, setDmFriendId] = useState<number | null>(null);
  const [dmFriendName, setDmFriendName] = useState("");
  const [dmMessages, setDmMessages] = useState<any[]>([]);
  const [dmInput, setDmInput] = useState("");
  const [dmLoading, setDmLoading] = useState(false);
  const [dmAiLoading, setDmAiLoading] = useState(false);
  const dmEndRef = useRef<HTMLDivElement>(null);

  const fetchDmMessages = async (friendId: number) => {
    try {
      const res = await fetch(`/api/dm/${friendId}`, { credentials: "include" });
      if (res.ok) setDmMessages(await res.json());
    } catch {}
  };

  const sendDm = async () => {
    if (!dmInput.trim() || !dmFriendId || dmLoading) return;
    setDmLoading(true);
    try {
      const res = await fetch(`/api/dm/${dmFriendId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: dmInput.trim() }),
      });
      if (res.ok) {
        setDmInput("");
        await fetchDmMessages(dmFriendId);
        setTimeout(() => dmEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch {} finally { setDmLoading(false); }
  };

  const sendTeamAi = async () => {
    if (!dmInput.trim() || !dmFriendId || dmAiLoading) return;
    setDmAiLoading(true);
    try {
      const res = await fetch(`/api/dm/${dmFriendId}/team-ai`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ question: dmInput.trim() }),
      });
      if (res.ok) {
        setDmInput("");
        await fetchDmMessages(dmFriendId);
        setTimeout(() => dmEndRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
      }
    } catch {} finally { setDmAiLoading(false); }
  };

  const openDm = (friendId: number, friendName: string) => {
    setDmFriendId(friendId);
    setDmFriendName(friendName);
    setDmMessages([]);
    fetchDmMessages(friendId);
    setActiveTab("chat");
  };

  useEffect(() => {
    if (activeTab !== "chat" || !dmFriendId) return;
    const interval = setInterval(() => fetchDmMessages(dmFriendId), 5000);
    return () => clearInterval(interval);
  }, [activeTab, dmFriendId]);

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
    <div className="h-[100dvh] flex text-[#1a1a2e] relative">
      <TechBackground />

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        "w-[260px] flex flex-col shrink-0 relative z-40 backdrop-blur-none",
        "fixed h-full md:static md:flex transition-transform duration-200 ease-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        "md:flex",
        !sidebarOpen && "hidden md:flex"
      )} style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)' }}>
        <div className="h-11 px-4 flex items-center justify-between border-b border-white/30 bg-white/50">
          <div className="flex items-center gap-2">
            <span className="relative w-7 h-7 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-[#3a3a5a]/15 animate-ping" />
              <span className="relative w-3 h-3 rounded-full bg-[#3a3a5a] shadow-[0_0_8px_rgba(58,58,90,0.4)]" />
            </span>
            <span className="text-[13px] font-bold text-[#1a1a2e] tracking-tight">MentXr®</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-[#1a1a2e]/75 hover:text-[#1a1a2e]/95" data-testid="button-close-sidebar">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="h-14 px-4 flex items-center gap-3 border-b border-white/30 bg-transparent">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-lg bg-white/50 border border-white/30 flex items-center justify-center text-[11px] font-bold text-[#1a1a2e]/90">
              {(user.displayName || user.email).substring(0, 2).toUpperCase()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-white/40" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-[#1a1a2e] truncate">{user.displayName || user.email.split("@")[0]}</p>
            <p className="text-[10px] text-[#1a1a2e]/60 italic truncate">Mentorship On Demand</p>
          </div>
        </div>

        <div className="h-10 px-4 flex items-center gap-2 border-b border-white/30 bg-transparent">
          <button
            data-testid="button-new-chat"
            onClick={() => { clearChat(); setSelectedMentor(null); setMentorCleared(true); setSidebarOpen(false); setActiveTab("chat"); }}
            className="flex-1 h-7 text-[11px] rounded-lg bg-white/60 border border-white/30 hover:bg-white/60 active:bg-white/50 text-[#1a1a2e]/90 font-medium transition-colors"
          >
            + New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-transparent" style={{ scrollbarWidth: 'thin' }}>
          <div className="border-b border-white/30">
            <button
              onClick={() => setBuddyGroups(prev => ({ ...prev, mentors: !prev.mentors }))}
              className="w-full h-9 flex items-center gap-2 px-4 hover:bg-white/50 text-left transition-colors"
              data-testid="buddy-group-mentors"
            >
              <span className="text-[10px] text-[#1a1a2e]/45 font-mono w-3">{buddyGroups.mentors ? "▾" : "▸"}</span>
              <span className="text-[11px] font-bold text-[#1a1a2e]/75 uppercase tracking-widest">Mentors</span>
              <span className="text-[10px] text-[#1a1a2e]/45 ml-auto">(7/7)</span>
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
                          ? "bg-white/50 border-l-2 border-l-[#8a8aa5]"
                          : "hover:bg-white/50 border-l-2 border-l-transparent"
                      )}
                    >
                      <div className="relative shrink-0">
                        <div className={cn("w-8 h-8 rounded-lg border border-white/30 flex items-center justify-center text-[#1a1a2e] text-[10px] font-bold", BOT_COLORS[key])}>{mentor.initials}</div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white/40" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn("text-[12px] font-semibold truncate leading-tight", isActive ? "text-[#1a1a2e]" : "text-[#1a1a2e]/90")}>{mentor.name}</p>
                        <p className={cn("text-[10px] truncate leading-tight", isActive ? "text-[#1a1a2e]/70" : "text-[#1a1a2e]/55")}>{statusMessages[key] || mentor.tagline}</p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-b border-white/30">
            <button
              onClick={() => setBuddyGroups(prev => ({ ...prev, friends: !prev.friends }))}
              className="w-full h-9 flex items-center gap-2 px-4 hover:bg-white/50 text-left transition-colors"
              data-testid="buddy-group-friends"
            >
              <span className="text-[10px] text-[#1a1a2e]/45 font-mono w-3">{buddyGroups.friends ? "▾" : "▸"}</span>
              <span className="text-[11px] font-bold text-[#1a1a2e]/75 uppercase tracking-widest">Friends</span>
              <span className="text-[10px] text-[#1a1a2e]/45 ml-auto">({friendsList.length})</span>
            </button>
            {buddyGroups.friends && (
              <div className="pb-1">
                <button
                  onClick={() => setShowAddFriend(true)}
                  className="w-full h-9 flex items-center gap-3 px-4 hover:bg-white/50 text-left transition-colors"
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
                  <div key={req.friendshipId} className="h-11 flex items-center gap-3 px-4 hover:bg-white/50 transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-[9px] font-bold text-amber-400">
                      {(req.displayName || "?").substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-[#1a1a2e]/80 truncate">{req.displayName}</p>
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
                  <div key={f.friendshipId} className="group h-11 flex items-center gap-3 px-4 hover:bg-white/50 transition-colors cursor-pointer" onClick={() => { openDm(f.id, f.displayName || f.email); setSidebarOpen(false); }}>
                    <div className="relative shrink-0">
                      <div className="w-7 h-7 rounded-lg bg-white/50 border border-white/30 flex items-center justify-center text-[9px] font-bold text-[#1a1a2e]/80">
                        {(f.displayName || "?").substring(0, 2).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 border-2 border-white/40" />
                    </div>
                    <p className="text-[11px] text-[#1a1a2e]/80 truncate flex-1">{f.displayName}</p>
                    <button onClick={(e) => { e.stopPropagation(); removeFriend(f.friendshipId); }} className="hidden group-hover:flex w-5 h-5 rounded-md bg-red-500/10 hover:bg-red-500/20 items-center justify-center" data-testid={`remove-friend-${f.id}`}>
                      <UserX className="w-3 h-3 text-red-400/60" />
                    </button>
                  </div>
                ))}
                {friendsList.length === 0 && pendingRequests.length === 0 && (
                  <div className="h-9 flex items-center px-4">
                    <span className="text-[10px] text-[#1a1a2e]/40 italic">No friends yet</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-b border-white/30">
            <button
              onClick={() => setBuddyGroups(prev => ({ ...prev, offline: !prev.offline }))}
              className="w-full h-9 flex items-center gap-2 px-4 hover:bg-white/50 text-left transition-colors"
              data-testid="buddy-group-offline"
            >
              <span className="text-[10px] text-[#1a1a2e]/45 font-mono w-3">{buddyGroups.offline ? "▾" : "▸"}</span>
              <span className="text-[11px] font-bold text-[#1a1a2e]/75 uppercase tracking-widest">Recent Chats</span>
            </button>
            {buddyGroups.offline && (
              <div className="pb-1">
                {messages.length > 0 ? (
                  <div className="h-9 flex items-center gap-3 px-4 hover:bg-white/50 cursor-pointer transition-colors">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                    <span className="text-[11px] text-[#1a1a2e]/65 truncate flex-1">{messages[0]?.content.substring(0, 35)}...</span>
                  </div>
                ) : (
                  <div className="h-9 flex items-center px-4">
                    <span className="text-[10px] text-[#1a1a2e]/40 italic">No recent conversations</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="h-11 px-4 flex items-center gap-3 border-t border-white/30 bg-white/50">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
          <span className="text-[10px] text-[#1a1a2e]/65 flex-1 truncate">{user.displayName || user.email}</span>
          <button
            data-testid="button-logout"
            onClick={logout}
            className="h-7 text-[10px] px-3 rounded-lg bg-white/60 border border-white/30 hover:bg-white/60 text-[#1a1a2e]/65 transition-colors"
          >
            Sign Off
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative z-10 bg-transparent">

        <header className="shrink-0 relative z-10 bg-white/90 backdrop-blur-md border-b border-white/30">
          <div className="h-14 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <button
                data-testid="button-menu"
                onClick={() => setSidebarOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/60 transition-colors md:hidden"
              >
                <Menu className="w-5 h-5 text-[#1a1a2e]/80" />
              </button>
            </div>
            <button data-testid="button-new-chat-header" onClick={() => { clearChat(); setSelectedMentor(null); setMentorCleared(true); setActiveTab("chat"); }} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/60 transition-colors">
              <Plus className="w-5 h-5 text-[#1a1a2e]/75" />
            </button>
          </div>
          <div className="flex px-4">
            <button
              data-testid="tab-dashboard"
              onClick={() => setActiveTab("dashboard")}
              className={cn(
                "flex-1 py-2.5 text-[13px] font-semibold text-center transition-colors relative",
                activeTab === "dashboard" ? "text-[#1a1a2e]" : "text-[#1a1a2e]/65 hover:text-[#1a1a2e]/80"
              )}
            >
              <div className="flex items-center justify-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                Dashboard
              </div>
              {activeTab === "dashboard" && <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-[#3a3a5a] rounded-full" />}
            </button>
            <button
              data-testid="tab-feed"
              onClick={() => { setActiveTab("feed"); if (feedItems.length === 0) fetchFeed(); }}
              className={cn(
                "flex-1 py-2.5 text-[13px] font-semibold text-center transition-colors relative",
                activeTab === "feed" ? "text-[#1a1a2e]" : "text-[#1a1a2e]/65 hover:text-[#1a1a2e]/80"
              )}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Radio className="w-3.5 h-3.5" />
                Live Feed
              </div>
              {activeTab === "feed" && <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-[#3a3a5a] rounded-full" />}
            </button>
            <button
              data-testid="tab-creatorai"
              onClick={() => setActiveTab("creatorai")}
              className={cn(
                "flex-1 py-2.5 text-[13px] font-semibold text-center transition-colors relative",
                activeTab === "creatorai" ? "text-[#1a1a2e]" : "text-[#1a1a2e]/65 hover:text-[#1a1a2e]/80"
              )}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Sparkles className="w-3.5 h-3.5" />
                Creator AI
              </div>
              {activeTab === "creatorai" && <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-purple-400 rounded-full" />}
            </button>
            <button
              data-testid="tab-repair"
              onClick={() => setActiveTab("repair")}
              className={cn(
                "flex-1 py-2.5 text-[13px] font-semibold text-center transition-colors relative",
                activeTab === "repair" ? "text-[#1a1a2e]" : "text-[#1a1a2e]/65 hover:text-[#1a1a2e]/80"
              )}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Shield className="w-3.5 h-3.5" />
                Repair
              </div>
              {activeTab === "repair" && <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-orange-400 rounded-full" />}
            </button>
            <button
              data-testid="tab-chat"
              onClick={() => setActiveTab("chat")}
              className={cn(
                "flex-1 py-2.5 text-[13px] font-semibold text-center transition-colors relative",
                activeTab === "chat" ? "text-[#1a1a2e]" : "text-[#1a1a2e]/65 hover:text-[#1a1a2e]/80"
              )}
            >
              <div className="flex items-center justify-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5" />
                Messages
              </div>
              {activeTab === "chat" && <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-[#3a3a5a] rounded-full" />}
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
                  <Loader2 className="w-8 h-8 animate-spin text-[#1a1a2e]/65" />
                </div>
              ) : fundingData ? (
                <>
                  <div className="mb-8">
                    <h1 className="text-2xl sm:text-3xl font-light text-[#1a1a2e] tracking-tight" style={{ fontFamily: "'Inter', sans-serif" }} data-testid="text-overview-title">Overview</h1>
                    <p className="text-sm text-[#1a1a2e]/70 mt-1">Welcome back, {user.displayName || user.email.split("@")[0]}!</p>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
                    <div className="lg:col-span-2 rounded-2xl bg-white/80 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.02)] p-6" data-testid="funding-score-card">
                      <p className="text-xs text-[#1a1a2e]/75 mb-1">Capital Readiness Score</p>
                      <div className="flex items-end gap-1">
                        <span className="text-4xl sm:text-5xl font-bold text-[#1a1a2e] tracking-tight font-mono" data-testid="text-score">{fundingData.score}</span>
                        <span className="text-lg text-[#1a1a2e]/60 font-light mb-1">/ 100</span>
                      </div>
                      <div className="flex gap-2 mt-5">
                        <button
                          onClick={fetchFundingReadiness}
                          className="flex-1 h-10 rounded-xl bg-white/50 border border-white/30 hover:bg-white/60 text-xs font-medium text-[#1a1a2e]/95 transition-colors flex items-center justify-center gap-2"
                          data-testid="button-refresh-score"
                        >
                          <RefreshCw className="w-3.5 h-3.5" /> REFRESH
                        </button>
                        <button
                          onClick={() => setActiveTab("chat")}
                          className="flex-1 h-10 rounded-xl bg-white/50 border border-white/30 hover:bg-white/60 text-xs font-medium text-[#1a1a2e]/95 transition-colors flex items-center justify-center gap-2"
                          data-testid="button-go-chat"
                        >
                          <MessageCircle className="w-3.5 h-3.5" /> ANALYZE
                        </button>
                      </div>
                    </div>

                    <div className="lg:col-span-3 rounded-2xl bg-white/80 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.02)] p-6" data-testid="stats-row">
                      <div className="grid grid-cols-3 h-full">
                        <div className="flex flex-col justify-center px-2">
                          <p className="text-xs text-[#1a1a2e]/70 mb-1">Tier</p>
                          <p className="text-xl sm:text-2xl font-bold text-[#1a1a2e]" data-testid="text-tier">
                            {fundingData.tierEligibility ? `Tier ${fundingData.tierEligibility.tier}` : "—"}
                          </p>
                          <p className="text-[10px] text-[#1a1a2e]/60 mt-0.5 truncate">{fundingData.tierEligibility?.label || "No data"}</p>
                        </div>
                        <div className="flex flex-col justify-center px-2 border-l border-white/30">
                          <p className="text-xs text-[#1a1a2e]/70 mb-1">Mode</p>
                          <p className="text-xl sm:text-2xl font-bold text-[#1a1a2e]" data-testid="text-mode">
                            {fundingData.operatingMode ? (fundingData.operatingMode.mode === "pre_funding" ? "Pre-Fund" : "Repair") : "—"}
                          </p>
                          <p className="text-[10px] text-[#1a1a2e]/60 mt-0.5 truncate">{fundingData.operatingMode?.label || "No data"}</p>
                        </div>
                        <div className="flex flex-col justify-center px-2 border-l border-white/30">
                          <p className="text-xs text-[#1a1a2e]/70 mb-1">Exposure</p>
                          <p className="text-xl sm:text-2xl font-bold text-[#1a1a2e]" data-testid="text-exposure">
                            {fundingData.exposureCeiling ? `$${(fundingData.exposureCeiling.ceiling / 1000).toFixed(0)}K` : "—"}
                          </p>
                          <p className="text-[10px] text-[#1a1a2e]/60 mt-0.5">
                            {fundingData.exposureCeiling ? `${fundingData.exposureCeiling.multiplier}x ceiling` : "No data"}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-5 gap-4 mb-4">
                    <div className="lg:col-span-2 space-y-4">
                      <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.02)] p-6" data-testid="savings-donut-card">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-[#1a1a2e]/70 mb-1">Funding Range</p>
                            {fundingData.estimatedRange ? (
                              <>
                                <p className="text-2xl font-bold text-[#1a1a2e] font-mono" data-testid="text-range">
                                  ${fundingData.estimatedRange.min.toLocaleString()}
                                </p>
                                <p className="text-xs text-[#1a1a2e]/60 mt-0.5">/ ${fundingData.estimatedRange.max.toLocaleString()}</p>
                              </>
                            ) : (
                              <p className="text-2xl font-bold text-[#1a1a2e]/65 font-mono">—</p>
                            )}
                          </div>
                          <div className="relative">
                            <DonutChart value={fundingData.score} max={100} size={80} strokeWidth={8} color={getScoreColor(fundingData.score)} />
                            <div className="absolute inset-0 flex items-center justify-center">
                              <span className="text-sm font-bold text-[#1a1a2e]">{fundingData.score}%</span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.02)] p-6" data-testid="document-upload-card">
                        <div className="flex items-center justify-between mb-4">
                          <p className="text-xs text-[#1a1a2e]/75">Document Analysis</p>
                          <span className="text-[9px] text-[#1a1a2e]/55 bg-white/50 px-2 py-0.5 rounded-full">GPT-4o</span>
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
                                : "border-white/30 bg-white/50 hover:bg-white/60",
                              docUploading && docUploadType === "credit_report" && "opacity-50"
                            )}
                            data-testid="button-upload-credit-report"
                          >
                            {docUploading && docUploadType === "credit_report" ? (
                              <Loader2 className="w-5 h-5 text-[#1a1a2e]/75 animate-spin shrink-0" />
                            ) : fundingData.hasCreditReport ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                            ) : (
                              <Upload className="w-5 h-5 text-[#1a1a2e]/65 shrink-0" />
                            )}
                            <div>
                              <p className="text-xs font-medium text-[#1a1a2e]/90">{fundingData.hasCreditReport ? "Credit Report Uploaded" : "Upload Credit Report"}</p>
                              <p className="text-[10px] text-[#1a1a2e]/55">PDF, DOC, TXT</p>
                            </div>
                          </button>
                          <button
                            onClick={() => bankStatementInputRef.current?.click()}
                            disabled={docUploading}
                            className={cn(
                              "w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                              fundingData.hasBankStatement
                                ? "border-green-500/20 bg-green-500/[0.04]"
                                : "border-white/30 bg-white/50 hover:bg-white/60",
                              docUploading && docUploadType === "bank_statement" && "opacity-50"
                            )}
                            data-testid="button-upload-bank-statement"
                          >
                            {docUploading && docUploadType === "bank_statement" ? (
                              <Loader2 className="w-5 h-5 text-[#1a1a2e]/75 animate-spin shrink-0" />
                            ) : fundingData.hasBankStatement ? (
                              <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" />
                            ) : (
                              <Upload className="w-5 h-5 text-[#1a1a2e]/65 shrink-0" />
                            )}
                            <div>
                              <p className="text-xs font-medium text-[#1a1a2e]/90">{fundingData.hasBankStatement ? "Bank Statement Uploaded" : "Upload Bank Statement"}</p>
                              <p className="text-[10px] text-[#1a1a2e]/55">PDF, DOC, TXT</p>
                            </div>
                          </button>
                        </div>
                        {docUploading && (
                          <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-white/30">
                            <Loader2 className="w-4 h-4 text-[#1a1a2e]/75 animate-spin shrink-0" />
                            <p className="text-[10px] text-[#1a1a2e]/75">Analyzing document...</p>
                          </div>
                        )}
                        {fundingData.analysisSummary && (
                          <div className="mt-3 p-3 rounded-xl bg-white/50 border border-white/30">
                            <p className="text-[10px] text-[#1a1a2e]/80 leading-relaxed">{fundingData.analysisSummary}</p>
                            {fundingData.lastAnalysisDate && (
                              <p className="text-[9px] text-[#1a1a2e]/55 mt-1.5">{timeAgo(fundingData.lastAnalysisDate)} ago</p>
                            )}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="lg:col-span-3 rounded-2xl bg-white/80 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.02)] p-6" data-testid="component-breakdown-card">
                      <div className="flex items-center justify-between mb-5">
                        <p className="text-xs text-[#1a1a2e]/75">Component Breakdown</p>
                      </div>
                      {componentChartData.length > 0 ? (
                        <div className="h-[200px] mb-4">
                          <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={componentChartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                              <defs>
                                <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#3a3a5a" stopOpacity={0.35} />
                                  <stop offset="95%" stopColor="#3a3a5a" stopOpacity={0} />
                                </linearGradient>
                                <linearGradient id="maxGrad" x1="0" y1="0" x2="0" y2="1">
                                  <stop offset="5%" stopColor="#c0c0d0" stopOpacity={0.25} />
                                  <stop offset="95%" stopColor="#c0c0d0" stopOpacity={0} />
                                </linearGradient>
                              </defs>
                              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'rgba(58,58,90,0.6)', fontSize: 10 }} />
                              <YAxis axisLine={false} tickLine={false} tick={{ fill: 'rgba(58,58,90,0.5)', fontSize: 10 }} domain={[0, 20]} />
                              <Tooltip
                                contentStyle={{ background: '#f2f2f8', border: '1px solid rgba(58,58,90,0.2)', borderRadius: '12px', fontSize: '11px', color: '#3a3a5a' }}
                                labelStyle={{ color: 'rgba(58,58,90,0.8)' }}
                              />
                              <Area type="monotone" dataKey="max" stroke="rgba(58,58,90,0.2)" fill="url(#maxGrad)" strokeWidth={1} dot={false} />
                              <Area type="monotone" dataKey="score" stroke="rgba(58,58,90,0.85)" fill="url(#scoreGrad)" strokeWidth={2} dot={{ fill: '#3a3a5a', r: 3, strokeWidth: 0 }} activeDot={{ r: 5, fill: '#3a3a5a' }} />
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
                                <span className="text-[11px] text-[#1a1a2e]/80">{comp.label}</span>
                                <span className="text-[11px] font-mono text-[#1a1a2e]/70">{comp.score}/{comp.max}</span>
                              </div>
                              <div className="w-full h-1.5 rounded-full bg-white/50 overflow-hidden">
                                <div className="h-full rounded-full transition-all duration-700 bg-[#8a8aa5]/60" style={{ width: `${pct}%` }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>

                  {fundingData.alerts.length > 0 && (
                    <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.02)] p-6 mb-4" data-testid="risk-alerts-card">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-xs text-[#1a1a2e]/75">Risk Alerts</p>
                        <span className="text-[10px] text-[#1a1a2e]/55">{fundingData.alerts.length} alert{fundingData.alerts.length > 1 ? "s" : ""}</span>
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
                              "w-full text-left rounded-xl border-l-[3px] bg-white/50 hover:bg-white/60 transition-all p-3.5",
                              alert.severity === "red" ? "border-l-red-500/60" : alert.severity === "yellow" ? "border-l-yellow-500/60" : "border-l-[#c0c0d0]"
                            )}
                            data-testid={`alert-${idx}`}
                          >
                            <div className="flex items-start gap-3">
                              {alert.severity === "red" ? <AlertCircle className="w-4 h-4 text-red-400/70 shrink-0 mt-0.5" /> :
                               alert.severity === "yellow" ? <AlertTriangle className="w-4 h-4 text-yellow-400/70 shrink-0 mt-0.5" /> :
                               <Info className="w-4 h-4 text-[#1a1a2e]/55 shrink-0 mt-0.5" />}
                              <div className="flex-1 min-w-0">
                                <p className="text-sm text-[#1a1a2e]/95">{alert.title}</p>
                                {expandedAlerts.has(idx) && (
                                  <div className="mt-2 space-y-1.5 text-xs">
                                    <p className="text-[#1a1a2e]/75">{alert.explanation}</p>
                                    <p className="text-[#1a1a2e]/65"><span className="text-[#1a1a2e]/80 font-medium">Impact:</span> {alert.impact}</p>
                                    <p className="text-green-400/60"><span className="text-green-400/70 font-medium">Fix:</span> {alert.fix}</p>
                                  </div>
                                )}
                              </div>
                              <ChevronRight className={cn("w-4 h-4 text-[#1a1a2e]/45 shrink-0 transition-transform mt-0.5", expandedAlerts.has(idx) && "rotate-90")} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {fundingData.denialSimulation && fundingData.denialSimulation.length > 0 && (
                    <div className="rounded-2xl bg-white/50 backdrop-blur-none border border-red-500/10 p-6 mb-4" data-testid="denial-simulation-card">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-xs text-red-400/60">Denial Simulation</p>
                        <span className="text-[10px] text-[#1a1a2e]/45">{fundingData.denialSimulation.length} trigger{fundingData.denialSimulation.length > 1 ? "s" : ""}</span>
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
                            className="w-full text-left rounded-xl bg-white/50 hover:bg-white/60 transition-all p-3.5"
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
                                <p className="text-sm text-[#1a1a2e]/90">{denial.trigger}</p>
                                {expandedDenials.has(idx) && (
                                  <div className="mt-2 space-y-1.5 text-xs">
                                    <p className="text-[#1a1a2e]/70">{denial.explanation}</p>
                                    <p className="text-green-400/50"><span className="text-green-400/60 font-medium">Fix:</span> {denial.fix}</p>
                                  </div>
                                )}
                              </div>
                              <ChevronRight className={cn("w-4 h-4 text-[#1a1a2e]/40 shrink-0 transition-transform mt-0.5", expandedDenials.has(idx) && "rotate-90")} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {fundingData.actionPlan.length > 0 && (
                    <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.02)] p-6 mb-4" data-testid="action-plan-card">
                      <p className="text-xs text-[#1a1a2e]/75 mb-4">Action Plan</p>
                      <div className="space-y-2">
                        {fundingData.actionPlan.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/50" data-testid={`action-step-${idx}`}>
                            <div className="w-6 h-6 rounded-full bg-white/50 flex items-center justify-center text-[10px] font-mono text-[#1a1a2e]/75 shrink-0">
                              {idx + 1}
                            </div>
                            <p className="text-sm text-[#1a1a2e]/90 leading-relaxed">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {fundingData.analysisNextSteps && fundingData.analysisNextSteps.length > 0 && (
                    <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.02)] p-6 mb-4" data-testid="next-steps-card">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-xs text-[#1a1a2e]/75">Next Steps</p>
                        <span className="text-[9px] text-[#1a1a2e]/45 bg-white/50 px-2 py-0.5 rounded-full">AI Generated</span>
                      </div>
                      <div className="space-y-2">
                        {fundingData.analysisNextSteps.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/50" data-testid={`next-step-${idx}`}>
                            <Sparkles className="w-4 h-4 text-[#1a1a2e]/55 shrink-0 mt-0.5" />
                            <p className="text-sm text-[#1a1a2e]/80 leading-relaxed">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.02)] p-6 mb-4" data-testid="insights-card">
                    <p className="text-xs text-[#1a1a2e]/75 mb-4">Insights</p>
                    <div className="space-y-2">
                      {INSIGHTS.map((insight, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-white/50 border border-white/30" data-testid={`insight-${idx}`}>
                          <p className="text-sm text-[#1a1a2e]/90 mb-1">{insight.title}</p>
                          <p className="text-[11px] text-[#1a1a2e]/65 leading-relaxed">{insight.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <AlertCircle className="w-8 h-8 text-[#1a1a2e]/45 mb-3" />
                  <p className="text-sm text-[#1a1a2e]/70">Unable to load dashboard</p>
                  <button onClick={fetchFundingReadiness} className="mt-3 text-xs text-[#1a1a2e]/60 hover:text-[#1a1a2e]/80 underline">
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
                    <Loader2 className="w-8 h-8 animate-spin text-[#1a1a2e]/65" />
                    <p className="text-xs text-[#1a1a2e]/65">Loading shorts...</p>
                  </div>
                </div>
              ) : feedItems.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center">
                  <Radio className="w-8 h-8 text-[#1a1a2e]/45 mb-3" />
                  <p className="text-sm text-[#1a1a2e]/70">No content available yet</p>
                  <button onClick={() => fetchFeed()} className="mt-3 text-xs text-[#1a1a2e]/60 hover:text-[#1a1a2e]/80 underline" data-testid="button-refresh-feed">Refresh</button>
                </div>
              ) : (() => {
                const videoItems = feedItems.filter((item: any) => {
                  if (item.contentType !== "video") return false;
                  const vid = item.link?.match(/[?&]v=([^&]+)/)?.[1];
                  return !!vid;
                });
                if (videoItems.length === 0) return (
                  <div className="flex-1 flex flex-col items-center justify-center">
                    <Play className="w-8 h-8 text-[#1a1a2e]/45 mb-3" />
                    <p className="text-sm text-[#1a1a2e]/70">No videos available</p>
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
                                  <div className="w-16 h-16 rounded-full bg-white/70 backdrop-blur-none flex items-center justify-center border border-white/30">
                                    <Play className="w-7 h-7 text-[#1a1a2e] ml-1" fill="white" />
                                  </div>
                                </button>
                              </>
                            )}
                          </div>

                          <div className="absolute bottom-0 left-0 right-16 p-4 pb-6 z-20" style={{ background: 'linear-gradient(transparent, rgba(0,0,0,0.85))' }}>
                            <div className="flex items-center gap-2.5 mb-2.5">
                              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-red-500 via-pink-500 to-purple-500 flex items-center justify-center text-[11px] font-bold text-[#1a1a2e] border-2 border-[#c0c0d0] shadow-lg">
                                {item.source.charAt(0)}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-semibold text-[#1a1a2e] truncate">{item.source}</p>
                                <p className="text-[10px] text-[#1a1a2e]/80">{timeAgo(item.publishedAt)}</p>
                              </div>
                              <span className="text-[9px] px-2 py-1 rounded-full bg-white/60 text-[#1a1a2e]/90 border border-white/40 uppercase tracking-wider font-medium">
                                {item.category}
                              </span>
                            </div>
                            <h3 className="text-[14px] font-medium text-[#1a1a2e] leading-snug line-clamp-2 drop-shadow-lg">{item.title}</h3>
                            {item.description && (
                              <p className="text-[11px] text-[#1a1a2e]/80 leading-relaxed line-clamp-1 mt-1">{item.description}</p>
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
                              <div className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-none flex items-center justify-center border border-white/40 group-hover:bg-white/70 transition-colors">
                                <ExternalLink className="w-4 h-4 text-[#1a1a2e]" />
                              </div>
                              <span className="text-[9px] text-[#1a1a2e]/80">Open</span>
                            </button>
                            <button
                              className="flex flex-col items-center gap-1 group"
                              onClick={() => {
                                navigator.clipboard.writeText(item.link || '');
                                toast({ title: "Link copied!" });
                              }}
                            >
                              <div className="w-10 h-10 rounded-full bg-white/60 backdrop-blur-none flex items-center justify-center border border-white/40 group-hover:bg-white/70 transition-colors">
                                <Share2 className="w-4 h-4 text-[#1a1a2e]" />
                              </div>
                              <span className="text-[9px] text-[#1a1a2e]/80">Share</span>
                            </button>
                          </div>

                          <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <h1 className="text-[15px] font-bold text-[#1a1a2e] drop-shadow-lg flex items-center gap-1.5" data-testid="text-feed-title">
                                Shorts
                                <span className="relative flex h-2 w-2">
                                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                                </span>
                              </h1>
                              <span className="text-[10px] text-[#1a1a2e]/65 ml-1">{idx + 1}/{videoItems.length}</span>
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
                                        ? "bg-white/70 text-[#1a1a2e]"
                                        : "bg-white/70 text-[#1a1a2e]/75 hover:bg-white/60"
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
          ) : activeTab === "repair" ? (
            <div className="w-full h-full flex flex-col" style={{ background: 'transparent' }}>
              <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 max-w-[800px] mx-auto w-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-600 to-amber-600 flex items-center justify-center">
                    <Shield className="w-5 h-5 text-[#1a1a2e]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#1a1a2e]" data-testid="text-repair-center-title">Repair Center</h2>
                    <p className="text-[11px] text-[#1a1a2e]/75">AI-powered credit repair, dispute letters & report Q&A</p>
                  </div>
                </div>

                <div className="rounded-2xl bg-white/50 backdrop-blur-none border border-orange-500/10 p-6 mb-4" data-testid="credit-repair-card">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs text-orange-400/60">Credit Repair System</p>
                    <span className="text-[9px] text-[#1a1a2e]/45 bg-white/50 px-2 py-0.5 rounded-full">GPT-4o</span>
                  </div>

                  {!fundingData?.hasCreditReport ? (
                    <div className="text-center py-8">
                      <FileText className="w-8 h-8 text-[#1a1a2e]/40 mx-auto mb-3" />
                      <p className="text-sm text-[#1a1a2e]/70 mb-1">Upload a credit report first</p>
                      <p className="text-[10px] text-[#1a1a2e]/55">Go to Dashboard and upload your credit report to enable the repair system.</p>
                    </div>
                  ) : !repairData ? (
                    <div className="text-center py-8">
                      <p className="text-sm text-[#1a1a2e]/75 mb-4">Credit report uploaded. Run the repair analysis to detect issues.</p>
                      <button
                        onClick={runRepairAnalysis}
                        disabled={repairAnalyzing}
                        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-white/50 border border-white/30 hover:bg-white/60 text-[#1a1a2e]/90 text-sm font-medium transition-all disabled:opacity-50"
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
                          className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/60 border border-white/30 hover:bg-white/60 text-[10px] text-[#1a1a2e]/70 hover:text-[#1a1a2e]/80 transition-all disabled:opacity-50"
                          data-testid="button-rerun-repair"
                        >
                          {repairAnalyzing ? <Loader2 className="w-3 h-3 animate-spin" /> : <RefreshCw className="w-3 h-3" />}
                          Re-analyze
                        </button>
                      </div>

                      {repairData.summary && (
                        <div className="p-4 rounded-xl bg-white/50 border border-white/30">
                          <p className="text-[10px] text-[#1a1a2e]/65 mb-1.5">What's Hurting Your Profile</p>
                          <p className="text-sm text-[#1a1a2e]/90 leading-relaxed mb-2">{repairData.summary.mainIssues}</p>
                          <p className="text-[10px] text-orange-400/50 mb-1">Priority Action</p>
                          <p className="text-sm text-[#1a1a2e]/80 leading-relaxed">{repairData.summary.priorityAction}</p>
                        </div>
                      )}

                      {repairData.detectedIssues && repairData.detectedIssues.length > 0 && (
                        <div>
                          <p className="text-[10px] text-[#1a1a2e]/60 uppercase tracking-widest mb-3">Detected Issues ({repairData.detectedIssues.length})</p>
                          <div className="space-y-2">
                            {repairData.detectedIssues.map((issue: any, idx: number) => (
                              <div key={idx} className="p-3.5 rounded-xl bg-white/50 border border-white/30" data-testid={`repair-issue-${idx}`}>
                                <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                                  <span className={cn(
                                    "text-[9px] font-bold uppercase px-2 py-0.5 rounded",
                                    issue.severity === "High" ? "bg-red-500/10 text-red-400/70" :
                                    issue.severity === "Medium" ? "bg-yellow-500/10 text-yellow-400/70" :
                                    "bg-green-500/10 text-green-400/70"
                                  )}>{issue.severity}</span>
                                  <span className="text-[10px] text-[#1a1a2e]/60">{issue.bureau}</span>
                                  <span className="text-[10px] text-[#1a1a2e]/45">{'\u00B7'}</span>
                                  <span className="text-[10px] text-[#1a1a2e]/70">{issue.issueType}</span>
                                </div>
                                <p className="text-sm text-[#1a1a2e]/90">{issue.creditor} {issue.accountLast4 !== "N/A" ? `(****${issue.accountLast4})` : ""}</p>
                                {issue.monthsAffected !== "N/A" && (
                                  <p className="text-[10px] text-[#1a1a2e]/60 mt-1">Months: {issue.monthsAffected}</p>
                                )}
                                <p className="text-[10px] text-[#1a1a2e]/65 mt-1.5">Attach: {issue.proofToAttach}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {repairData.actionPlan && repairData.actionPlan.length > 0 && (
                        <div>
                          <p className="text-[10px] text-[#1a1a2e]/60 uppercase tracking-widest mb-3">Repair Action Plan</p>
                          <div className="space-y-2">
                            {repairData.actionPlan.map((step: any, idx: number) => (
                              <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/50" data-testid={`repair-step-${idx}`}>
                                <div className="w-6 h-6 rounded-full bg-white/50 flex items-center justify-center text-[10px] font-mono text-[#1a1a2e]/65 shrink-0">
                                  {step.step || idx + 1}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-sm text-[#1a1a2e]/90">{step.action}</p>
                                  <div className="flex items-center gap-3 mt-1">
                                    <span className="text-[10px] text-orange-400/40 font-mono">{step.timing}</span>
                                    {step.details && <span className="text-[10px] text-[#1a1a2e]/60">{step.details}</span>}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {repairData.letters && repairData.letters.length > 0 && (
                        <div>
                          <p className="text-[10px] text-[#1a1a2e]/60 uppercase tracking-widest mb-3">Generated Dispute Letters ({repairData.letters.length})</p>
                          <div className="space-y-2">
                            {repairData.letters.map((letter: any, idx: number) => (
                              <div key={idx} className="rounded-xl bg-white/50 border border-white/30 overflow-hidden" data-testid={`letter-${idx}`}>
                                <button
                                  onClick={() => setExpandedLetters(prev => {
                                    const next = new Set(prev);
                                    if (next.has(idx)) next.delete(idx); else next.add(idx);
                                    return next;
                                  })}
                                  className="w-full text-left p-3.5 flex items-center gap-3 hover:bg-white/50 transition-colors"
                                  data-testid={`button-expand-letter-${idx}`}
                                >
                                  <FileText className="w-4 h-4 text-orange-400/40 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm text-[#1a1a2e]/90 truncate">{letter.subject || `${letter.type === "bureau_dispute" ? "Bureau" : letter.type === "creditor_dispute" ? "Creditor" : "Info Correction"} Letter`}</p>
                                    <p className="text-[10px] text-[#1a1a2e]/60 truncate">To: {letter.recipientName}</p>
                                  </div>
                                  <ChevronRight className={cn("w-4 h-4 text-[#1a1a2e]/40 shrink-0 transition-transform", expandedLetters.has(idx) && "rotate-90")} />
                                </button>
                                {expandedLetters.has(idx) && (
                                  <div className="px-3.5 pb-3.5 border-t border-white/30">
                                    <div className="flex items-center gap-2 py-2">
                                      <span className="text-[9px] text-[#1a1a2e]/55">To: {letter.recipientAddress}</span>
                                      <button
                                        onClick={() => copyLetterToClipboard(letter.body, idx)}
                                        className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/60 border border-white/30 hover:bg-white/60 text-[10px] text-[#1a1a2e]/75 font-medium transition-all"
                                        data-testid={`button-copy-letter-${idx}`}
                                      >
                                        {copiedLetter === idx ? <CheckCircle2 className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                                        {copiedLetter === idx ? "Copied!" : "Copy Letter"}
                                      </button>
                                    </div>
                                    <div className="mt-2 p-4 rounded-xl bg-white/60 border border-white/30 font-mono text-[10px] text-[#1a1a2e]/80 leading-relaxed whitespace-pre-wrap max-h-96 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
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
                        <p className="text-[9px] text-[#1a1a2e]/45 italic mt-2 px-1">{repairData.disclaimer}</p>
                      )}
                    </div>
                  )}
                </div>

                <div className="rounded-2xl bg-white/80 backdrop-blur-md border border-white/40 shadow-[0_8px_32px_rgba(0,0,0,0.04),0_2px_8px_rgba(0,0,0,0.02)] overflow-hidden mb-4" data-testid="repair-qa-card">
                  <div className="px-6 py-4 flex items-center gap-3 border-b border-white/30">
                    <div className="w-8 h-8 rounded-xl bg-white/60 border border-white/30 flex items-center justify-center">
                      <MessageCircle className="w-4 h-4 text-orange-400/50" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[#1a1a2e]/95">Ask AI About Your Report</p>
                      <p className="text-[10px] text-[#1a1a2e]/60">Get personalized answers based on your uploaded financial data</p>
                    </div>
                    {qaMessages.length > 0 && (
                      <span className="ml-auto text-[9px] text-[#1a1a2e]/55 bg-white/50 px-2 py-0.5 rounded-full">{Math.floor(qaMessages.length / 2)} Q&A</span>
                    )}
                  </div>

                  <div className="max-h-[500px] overflow-y-auto px-4 py-3 space-y-3" style={{ scrollbarWidth: 'thin' }}>
                    {qaMessages.length === 0 && !qaLoading && (
                      <div className="flex flex-col items-center justify-center py-8">
                        <Sparkles className="w-6 h-6 text-[#1a1a2e]/40 mb-2" />
                        <p className="text-xs text-[#1a1a2e]/60 text-center">Ask anything about your credit report, funding readiness, or financial profile</p>
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
                              className="text-left px-3 py-2.5 rounded-xl border border-white/30 bg-white/50 hover:bg-white/60 transition-all text-[11px] text-[#1a1a2e]/70 hover:text-[#1a1a2e]/90"
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
                          <div className="w-7 h-7 rounded-lg bg-white/60 border border-white/30 flex items-center justify-center shrink-0 mt-0.5">
                            <Cpu className="w-3.5 h-3.5 text-[#1a1a2e]/65" />
                          </div>
                        )}
                        <div className={cn(
                          "max-w-[80%] rounded-2xl px-4 py-3",
                          msg.role === "user"
                            ? "bg-white/60 border border-white/30"
                            : "bg-white/50 border border-white/30"
                        )}>
                          <p className="text-[12px] text-[#1a1a2e]/90 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                          <p className="text-[9px] text-[#1a1a2e]/45 mt-1.5">
                            {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))}

                    {qaLoading && (
                      <div className="flex gap-2.5 justify-start">
                        <div className="w-7 h-7 rounded-lg bg-white/60 border border-white/30 flex items-center justify-center shrink-0">
                          <Cpu className="w-3.5 h-3.5 text-[#1a1a2e]/65" />
                        </div>
                        <div className="bg-white/50 border border-white/30 rounded-2xl px-4 py-3">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1a1a2e]/60" />
                            <span className="text-[11px] text-[#1a1a2e]/60">Analyzing your data...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={qaEndRef} />
                  </div>

                  <div className="px-4 pb-4 pt-2 border-t border-white/30">
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
                        className="flex-1 bg-white/50 border border-white/30 rounded-xl px-3.5 py-2.5 text-sm text-[#1a1a2e]/95 placeholder:text-[#8a8aa5]/50 resize-none focus:outline-none focus:border-[#c0c0d0] transition-colors"
                        rows={1}
                      />
                      <button
                        data-testid="button-send-qa"
                        onClick={sendQA}
                        disabled={!qaInput.trim() || qaLoading}
                        className="w-10 h-10 rounded-xl bg-white/50 border border-white/30 hover:bg-white/60 disabled:opacity-30 flex items-center justify-center transition-colors shrink-0"
                      >
                        <Send className="w-4 h-4 text-[#1a1a2e]/80" />
                      </button>
                    </div>
                    {qaMessages.length > 0 && (
                      <button
                        data-testid="button-clear-qa"
                        onClick={clearQA}
                        className="mt-2 text-[10px] text-[#1a1a2e]/45 hover:text-[#1a1a2e]/65 transition-colors"
                      >
                        Clear conversation
                      </button>
                    )}
                  </div>
                </div>

              </div>
            </div>
          ) : activeTab === "creatorai" ? (
            <div className="w-full h-full flex flex-col" style={{ background: 'transparent' }}>
              <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 max-w-[800px] mx-auto w-full">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-[#1a1a2e]" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#1a1a2e]" data-testid="text-creator-ai-title">Creator-Informed Analysis</h2>
                    <p className="text-[11px] text-[#1a1a2e]/75">AI aggregates insights from 75+ top finance creators</p>
                  </div>
                </div>

                <div className="bg-white/50 border border-white/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Upload className="w-4 h-4 text-purple-400" />
                    <span className="text-sm font-medium text-[#1a1a2e]">Upload Credit Report</span>
                  </div>
                  <p className="text-[11px] text-[#1a1a2e]/70 mb-3">Upload your credit report so the AI can give personalized creator-informed guidance based on your actual data.</p>
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <input
                        type="file"
                        accept=".pdf,.txt,.csv"
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setCreatorAiUploading(true);
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
                              if (isPdf) reader.readAsDataURL(file);
                              else reader.readAsText(file);
                            });
                            const res = await fetch("/api/analyze-document", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              credentials: "include",
                              body: JSON.stringify({ fileContent, documentType: "credit_report" }),
                            });
                            if (res.ok) {
                              toast({ title: "Report Uploaded", description: "Your credit report has been analyzed. Ask questions below for creator-informed insights." });
                              await fetchFundingReadiness();
                            } else {
                              const data = await res.json();
                              toast({ title: "Upload Failed", description: data.error || "Could not process report.", variant: "destructive" });
                            }
                          } catch {
                            toast({ title: "Upload Error", description: "Failed to upload. Try again.", variant: "destructive" });
                          } finally {
                            setCreatorAiUploading(false);
                          }
                        }}
                        data-testid="creator-ai-upload-input"
                      />
                      <div className={cn(
                        "flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-purple-400/30 bg-purple-500/5 cursor-pointer hover:bg-purple-500/10 transition-colors",
                        creatorAiUploading && "opacity-50 pointer-events-none"
                      )}>
                        {creatorAiUploading ? (
                          <><Loader2 className="w-4 h-4 animate-spin text-purple-400" /><span className="text-xs text-purple-300">Analyzing...</span></>
                        ) : (
                          <><FileText className="w-4 h-4 text-purple-400" /><span className="text-xs text-purple-300">Choose Credit Report (PDF/TXT)</span></>
                        )}
                      </div>
                    </label>
                  </div>
                  {user?.hasCreditReport && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-400" />
                      <span className="text-[11px] text-green-400/70">Credit report on file — AI will use your data</span>
                    </div>
                  )}
                </div>

                <div className="space-y-4 mb-4">
                  {creatorAiMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-500/15 to-blue-500/15 flex items-center justify-center mb-4 border border-purple-400/15">
                        <Sparkles className="w-7 h-7 text-purple-400/60" />
                      </div>
                      <p className="text-sm text-[#1a1a2e]/80 mb-2">Ask any financial question</p>
                      <p className="text-[11px] text-[#1a1a2e]/60 max-w-sm leading-relaxed">The AI will aggregate perspectives from top creators like Graham Stephan, Dave Ramsey, Alex Hormozi, Credit Shifu, and 70+ more — synthesizing their publicly known frameworks into personalized guidance.</p>
                      <div className="flex flex-wrap justify-center gap-2 mt-4">
                        {["How should I improve my credit score?", "What's the best way to build business credit?", "How do I prepare for funding?", "What would top creators say about my report?"].map((q) => (
                          <button
                            key={q}
                            onClick={() => setCreatorAiInput(q)}
                            className="px-3 py-1.5 rounded-full bg-white/60 border border-white/30 text-[10px] text-[#1a1a2e]/75 hover:bg-purple-500/10 hover:border-purple-400/20 hover:text-purple-300 transition-all"
                            data-testid={`creator-ai-suggestion-${q.slice(0,20)}`}
                          >
                            {q}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {creatorAiMessages.map((msg, idx) => (
                    <div key={idx} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                      <div className={cn(
                        "max-w-[85%] rounded-xl px-4 py-3",
                        msg.role === "user"
                          ? "bg-purple-600/20 border border-purple-400/20 text-[#1a1a2e]"
                          : "bg-white/60 border border-white/30 text-[#1a1a2e]"
                      )}>
                        {msg.role === "assistant" && (
                          <div className="flex items-center gap-1.5 mb-2 text-[10px] text-purple-300/60">
                            <Sparkles className="w-3 h-3" />
                            Creator-Informed Insight
                          </div>
                        )}
                        <div className="text-[13px] leading-relaxed whitespace-pre-wrap" data-testid={`creator-ai-msg-${idx}`}>{msg.content}</div>
                      </div>
                    </div>
                  ))}

                  {creatorAiLoading && (
                    <div className="flex justify-start">
                      <div className="bg-white/60 border border-white/30 rounded-xl px-4 py-3 flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-purple-400" />
                        <span className="text-xs text-[#1a1a2e]/75">Aggregating creator insights...</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              <div className="px-5 sm:px-8 py-4 border-t border-white/30 max-w-[800px] mx-auto w-full">
                <div className="flex gap-2">
                  <input
                    value={creatorAiInput}
                    onChange={(e) => setCreatorAiInput(e.target.value)}
                    onKeyDown={async (e) => {
                      if (e.key === "Enter" && creatorAiInput.trim() && !creatorAiLoading) {
                        const question = creatorAiInput.trim();
                        setCreatorAiMessages(prev => [...prev, { role: "user", content: question }]);
                        setCreatorAiInput("");
                        setCreatorAiLoading(true);
                        try {
                          const resp = await fetch("/api/creator-insight", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            credentials: "include",
                            body: JSON.stringify({ question }),
                          });
                          const data = await resp.json();
                          if (!resp.ok) throw new Error(data.error || "Failed");
                          setCreatorAiMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
                        } catch (err: any) {
                          setCreatorAiMessages(prev => [...prev, { role: "assistant", content: "Error: " + (err.message || "Could not get insight.") }]);
                        } finally {
                          setCreatorAiLoading(false);
                        }
                      }
                    }}
                    placeholder="Ask any financial question — AI aggregates 75+ creator perspectives..."
                    className="flex-1 bg-white/60 border border-white/30 rounded-xl px-4 py-3 text-sm text-[#1a1a2e] placeholder:text-[#8a8aa5]/50 focus:outline-none focus:border-purple-400/40 transition-colors"
                    disabled={creatorAiLoading}
                    data-testid="creator-ai-input"
                  />
                  <button
                    onClick={async () => {
                      if (!creatorAiInput.trim() || creatorAiLoading) return;
                      const question = creatorAiInput.trim();
                      setCreatorAiMessages(prev => [...prev, { role: "user", content: question }]);
                      setCreatorAiInput("");
                      setCreatorAiLoading(true);
                      try {
                        const resp = await fetch("/api/creator-insight", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          credentials: "include",
                          body: JSON.stringify({ question }),
                        });
                        const data = await resp.json();
                        if (!resp.ok) throw new Error(data.error || "Failed");
                        setCreatorAiMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
                      } catch (err: any) {
                        setCreatorAiMessages(prev => [...prev, { role: "assistant", content: "Error: " + (err.message || "Could not get insight.") }]);
                      } finally {
                        setCreatorAiLoading(false);
                      }
                    }}
                    disabled={!creatorAiInput.trim() || creatorAiLoading}
                    className="px-5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-[#1a1a2e] text-sm font-medium disabled:opacity-30 hover:from-purple-500 hover:to-blue-500 transition-all flex items-center gap-1.5"
                    data-testid="creator-ai-send"
                  >
                    {creatorAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col" style={{ background: 'transparent' }}>
              {!dmFriendId ? (
                <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 max-w-[600px] mx-auto w-full">
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-[#1a1a2e]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#1a1a2e]" data-testid="text-messages-title">Messages</h2>
                      <p className="text-[11px] text-[#1a1a2e]/75">Chat with friends & ask AI together as a team</p>
                    </div>
                  </div>

                  {friendsList.length === 0 ? (
                    <div className="text-center py-16">
                      <UserPlus className="w-10 h-10 text-[#1a1a2e]/40 mx-auto mb-3" />
                      <p className="text-sm text-[#1a1a2e]/70 mb-1">No friends yet</p>
                      <p className="text-[11px] text-[#1a1a2e]/55 mb-4">Add friends from the buddy list to start messaging</p>
                      <button onClick={() => setShowAddFriend(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/50 border border-white/30 text-sm text-[#1a1a2e]/80 hover:bg-white/60 transition-colors" data-testid="button-add-friend-dm">
                        <UserPlus className="w-4 h-4" />
                        Add Friend
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {friendsList.map((f: any) => (
                        <button
                          key={f.id}
                          onClick={() => openDm(f.id, f.displayName || f.email)}
                          className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/50 border border-white/30 hover:bg-white/50 transition-all text-left"
                          data-testid={`dm-friend-${f.id}`}
                        >
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border border-white/40 flex items-center justify-center text-sm font-bold text-[#1a1a2e]/80">
                            {(f.displayName || f.email || "?").substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#1a1a2e]/95 truncate">{f.displayName || f.email}</p>
                            <p className="text-[10px] text-[#1a1a2e]/60">Tap to chat</p>
                          </div>
                          <ChevronRight className="w-4 h-4 text-[#1a1a2e]/45" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <div className="flex-1 flex flex-col min-h-0">
                  <div className="shrink-0 px-4 py-3 border-b border-white/30 flex items-center gap-3">
                    <button onClick={() => { setDmFriendId(null); setDmMessages([]); }} className="w-8 h-8 rounded-xl bg-white/50 hover:bg-white/60 flex items-center justify-center transition-colors" data-testid="button-dm-back">
                      <ChevronRight className="w-4 h-4 text-[#1a1a2e]/75 rotate-180" />
                    </button>
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500/30 to-cyan-500/30 border border-white/40 flex items-center justify-center text-[10px] font-bold text-[#1a1a2e]/80">
                      {dmFriendName.substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-[#1a1a2e]/95 truncate">{dmFriendName}</p>
                      <p className="text-[9px] text-[#1a1a2e]/55">Direct Message · Team AI available</p>
                    </div>
                    <button onClick={() => { fetchDmMessages(dmFriendId!); }} className="w-8 h-8 rounded-xl bg-white/50 hover:bg-white/60 flex items-center justify-center transition-colors" data-testid="button-dm-refresh">
                      <RefreshCw className="w-3.5 h-3.5 text-[#1a1a2e]/65" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3" style={{ scrollbarWidth: 'thin' }}>
                    {dmMessages.length === 0 && (
                      <div className="flex flex-col items-center justify-center py-12">
                        <MessageSquare className="w-8 h-8 text-[#1a1a2e]/40 mb-3" />
                        <p className="text-sm text-[#1a1a2e]/65 mb-1">Start the conversation</p>
                        <p className="text-[10px] text-[#1a1a2e]/45">Send a message or ask AI together</p>
                      </div>
                    )}

                    {dmMessages.map((msg: any) => {
                      const isMe = msg.senderId === user.id;
                      const isAi = msg.isAi;
                      return (
                        <div key={msg.id} className={cn("flex gap-2.5", isMe ? "justify-end" : "justify-start")} data-testid={`dm-msg-${msg.id}`}>
                          {!isMe && (
                            <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5", isAi ? "bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20" : "bg-white/60 border border-white/30")}>
                              {isAi ? <Sparkles className="w-3.5 h-3.5 text-purple-400/60" /> : <span className="text-[9px] font-bold text-[#1a1a2e]/65">{dmFriendName.substring(0, 2).toUpperCase()}</span>}
                            </div>
                          )}
                          <div className={cn(
                            "max-w-[80%] rounded-2xl px-4 py-3",
                            isAi ? "bg-purple-500/[0.08] border border-purple-500/[0.12]" :
                            isMe ? "bg-white/60 border border-white/30" :
                            "bg-white/50 border border-white/30"
                          )}>
                            {isAi && <p className="text-[9px] text-purple-400/50 font-medium mb-1">MentXr® Team AI</p>}
                            {!isMe && !isAi && <p className="text-[9px] text-[#1a1a2e]/60 font-medium mb-1">{dmFriendName}</p>}
                            <p className="text-[12px] text-[#1a1a2e]/90 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            <p className="text-[9px] text-[#1a1a2e]/45 mt-1.5">
                              {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </p>
                          </div>
                        </div>
                      );
                    })}

                    {(dmLoading || dmAiLoading) && (
                      <div className="flex gap-2.5 justify-start">
                        <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center shrink-0", dmAiLoading ? "bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-purple-500/20" : "bg-white/60 border border-white/30")}>
                          {dmAiLoading ? <Sparkles className="w-3.5 h-3.5 text-purple-400/60" /> : <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1a1a2e]/65" />}
                        </div>
                        <div className={cn("rounded-2xl px-4 py-3", dmAiLoading ? "bg-purple-500/[0.08] border border-purple-500/[0.12]" : "bg-white/50 border border-white/30")}>
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1a1a2e]/60" />
                            <span className="text-[11px] text-[#1a1a2e]/60">{dmAiLoading ? "Team AI thinking..." : "Sending..."}</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={dmEndRef} />
                  </div>

                  <div className="shrink-0 px-4 pb-4 pt-2 border-t border-white/30 bg-white/90 backdrop-blur-md">
                    <div className="flex gap-2">
                      <textarea
                        data-testid="input-dm"
                        value={dmInput}
                        onChange={(e) => setDmInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            sendDm();
                          }
                        }}
                        placeholder={`Message ${dmFriendName}...`}
                        className="flex-1 bg-white/50 border border-white/30 rounded-xl px-3.5 py-2.5 text-sm text-[#1a1a2e]/95 placeholder:text-[#8a8aa5]/50 resize-none focus:outline-none focus:border-[#c0c0d0] transition-colors"
                        rows={1}
                      />
                      <button
                        data-testid="button-send-dm"
                        onClick={sendDm}
                        disabled={!dmInput.trim() || dmLoading || dmAiLoading}
                        className="w-10 h-10 rounded-xl bg-white/50 border border-white/30 hover:bg-white/60 disabled:opacity-30 flex items-center justify-center transition-colors shrink-0"
                        title="Send message"
                      >
                        <Send className="w-4 h-4 text-[#1a1a2e]/80" />
                      </button>
                      <button
                        data-testid="button-team-ai"
                        onClick={sendTeamAi}
                        disabled={!dmInput.trim() || dmLoading || dmAiLoading}
                        className="h-10 px-3 rounded-xl bg-gradient-to-r from-purple-600/80 to-blue-600/80 border border-purple-500/20 hover:from-purple-500 hover:to-blue-500 disabled:opacity-30 flex items-center gap-1.5 transition-all shrink-0"
                        title="Ask Team AI"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-[#1a1a2e]" />
                        <span className="text-[11px] text-[#1a1a2e] font-medium">AI</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {showAddFriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-none" onClick={() => setShowAddFriend(false)}>
          <div className="w-[340px] bg-white/95 backdrop-blur-md border border-white/30 rounded-2xl p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-[#1a1a2e]/95">Add Friend</p>
              <button onClick={() => setShowAddFriend(false)} className="text-[#1a1a2e]/60 hover:text-[#1a1a2e]/80">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1a2e]/55" />
              <input
                data-testid="input-friend-search"
                type="text"
                value={friendSearch}
                onChange={e => { setFriendSearch(e.target.value); searchFriends(e.target.value); }}
                placeholder="Search by name..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/60 border border-white/30 text-sm text-[#1a1a2e]/95 placeholder-white/50 outline-none focus:border-[#c0c0d0]"
              />
            </div>
            {friendSearchLoading && <p className="text-[10px] text-[#1a1a2e]/60 text-center py-2">Searching...</p>}
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {friendSearchResults.map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-white/60 border border-white/30 flex items-center justify-center text-[10px] font-bold text-[#1a1a2e]/70">
                    {(u.displayName || u.email || "?").substring(0, 2).toUpperCase()}
                  </div>
                  <p className="text-sm text-[#1a1a2e]/80 flex-1 truncate">{u.displayName || u.email}</p>
                  <button onClick={() => sendFriendRequest(u.id)} className="h-7 px-3 rounded-lg bg-white/50 hover:bg-white/60 text-[10px] text-[#1a1a2e]/80 font-medium transition-colors" data-testid={`add-friend-${u.id}`}>
                    Add
                  </button>
                </div>
              ))}
              {friendSearch.length >= 2 && !friendSearchLoading && friendSearchResults.length === 0 && (
                <p className="text-[10px] text-[#1a1a2e]/55 text-center py-3">No users found</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
