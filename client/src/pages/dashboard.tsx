import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/store";
import { useLocation } from "wouter";
import { Send, Plus, Paperclip, Loader2, ArrowDown, FileText, X, Menu, MessageCircle, RefreshCw, TrendingUp, UserPlus, Check, UserX, Search, AlertTriangle, Shield, ChevronRight, Target, BarChart3, BookOpen, CheckCircle2, AlertCircle, Info, Zap, Activity, Upload, Sparkles, Eye, Lock, Cpu, ChevronDown, Radio, Play, ExternalLink, Clock, Filter, ChevronUp, Volume2, VolumeX, Heart, MessageSquare, Share2, ThumbsUp, Users, DollarSign, Building2, Gauge, Calendar, ArrowRight, Copy, ChevronLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { ProfundrLogo } from "@/components/profundr-logo";
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

interface CapitalOsDashboard {
  phase: {
    phase: string;
    phaseIndex: number;
    phaseLabel: string;
    progress: number;
    phases: { key: string; label: string; active: boolean; completed: boolean }[];
    reasoning: string;
  };
  readiness: {
    riskTier: string;
    riskTierColor: string;
    metrics: { name: string; status: string; severity: string; detail: string }[];
    exposureCeiling: number;
    remainingSafeCapacity: number;
    recommendedApproval: string;
    approvalProbability: string;
    primaryDenialTriggers: string[];
    riskDepartmentNotes: string;
  };
  exposure: {
    safeAmount: number;
    currentExposure: number;
    maxSafeExposure: number;
    zone: "safe" | "caution" | "denial";
    zoneLabel: string;
    zoneColor: string;
    percentage: number;
    reasoning: string;
    limits: { safe: number; caution: number; denial: number };
  };
  bureauHealth: {
    bureaus: { bureau: string; uploaded: boolean; utilization: number; hardInquiries: number; derogatoryCount: number; oldestAccountAge: number; riskStatus: string; riskColor: string; priority: boolean; recommendation: string; guidance: { riskTier: string; riskTierColor: string; exposureCeiling: number; exposureMultiplier: number; actionItems: string[]; denialTriggers: string[]; fundingPhase: string; applicationReady: boolean; score: number | null; latePayments: number; collections: number; chargeOffs: number; openAccounts: number; totalRevolvingLimit: number; authorizedUserAccounts: number; revolvingAccountsOver75Util: number; zeroBalanceRevolvingAccounts: number; highestSingleCardUtil: number | null; totalInstallmentAccounts: number; hasMortgage: boolean; monthsSinceMostRecentLate: number | null; collectionsBalance: number; paymentRecency: string | null; accountMix: string | null; balanceTrend: string | null; newAccountsLast6Months: number; newAccountsLast12Months: number; avgOpenAccountAgeYears: number; accountsOlderThan5Years: number; velocityRisk: { portfolioExpansionGrade: string; velocityTier: string; velocityTierLabel: string; adjustedExposureCeiling: number; mandatoryWaitingMonths: number; velocityDenialTriggers: string[]; velocityNotes: string } | null } | null }[];
    priorityBureau: string;
  };
  applicationWindow: {
    daysUntilOptimal: number;
    optimalDate: string;
    currentStatus: "ready" | "wait" | "repair_first";
    reasoning: string;
    factors: { factor: string; status: "good" | "warning" | "bad"; detail: string }[];
  };
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

type TabKey = "mission_control" | "repair_engine" | "funding_strategy" | "creator_connect" | "messages";

const NAV_ITEMS: { key: TabKey; label: string; icon: any }[] = [
  { key: "mission_control", label: "Mission Control", icon: Target },
  { key: "repair_engine", label: "Repair Engine", icon: Shield },
  { key: "funding_strategy", label: "Funding Strategy", icon: DollarSign },
  { key: "creator_connect", label: "Creator Connect", icon: Sparkles },
  { key: "messages", label: "Messages", icon: MessageSquare },
];

export default function DashboardPage() {
  const { user, messages, sendMessage, clearChat, logout, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!authLoading && user && user.subscriptionStatus !== 'active' && user.role !== 'admin') {
      setLocation('/subscription');
    }
  }, [user, authLoading, setLocation]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [buddyOpen, setBuddyOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  const [mentorCleared, setMentorCleared] = useState(false);
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<TabKey>("mission_control");
  const [fundingBureauTab, setFundingBureauTab] = useState("Experian");
  const [mcBureauTab, setMcBureauTab] = useState("Experian");
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
  const bureauUploadRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const [bureauUploading, setBureauUploading] = useState<string | null>(null);
  const [repairData, setRepairData] = useState<any>(null);
  const [repairLoading, setRepairLoading] = useState(false);
  const [repairAnalyzing, setRepairAnalyzing] = useState(false);
  const [expandedLetters, setExpandedLetters] = useState<Set<string>>(new Set());
  const [copiedLetter, setCopiedLetter] = useState<string | null>(null);
  const [expandedDenials, setExpandedDenials] = useState<Set<number>>(new Set());
  const [activeRepairRound, setActiveRepairRound] = useState(1);
  const [repairBureauFilter, setRepairBureauFilter] = useState<string>("Experian");
  const [showWelcome, setShowWelcome] = useState(() => {
    return !localStorage.getItem("profundr_welcome_seen");
  });
  const [userAddressForm, setUserAddressForm] = useState({ fullName: "", streetAddress: "", city: "", state: "", zipCode: "" });
  const [addressSaving, setAddressSaving] = useState(false);
  const [addressLoaded, setAddressLoaded] = useState(false);
  const [qaMessages, setQaMessages] = useState<any[]>([]);
  const [qaInput, setQaInput] = useState("");
  const [qaLoading, setQaLoading] = useState(false);
  const [qaOpen, setQaOpen] = useState(false);
  const qaEndRef = useRef<HTMLDivElement>(null);
  const qaInputRef = useRef<HTMLTextAreaElement>(null);

  const [creatorAiInput, setCreatorAiInput] = useState("");
  const [creatorAiLoading, setCreatorAiLoading] = useState(false);
  const [creatorAiMessages, setCreatorAiMessages] = useState<{role: "user" | "assistant"; content: string}[]>([]);
  const [creatorAiUploading, setCreatorAiUploading] = useState(false);
  const [creatorMatchLoading, setCreatorMatchLoading] = useState(false);
  const [creatorMatchResults, setCreatorMatchResults] = useState<{mode: string; summary: string; searches: any[]; creators: any[]} | null>(null);
  const [creatorAvatarErrors, setCreatorAvatarErrors] = useState<Set<string>>(new Set());

  const [dmFriendId, setDmFriendId] = useState<number | null>(null);
  const [dmFriendName, setDmFriendName] = useState("");
  const [dmMessages, setDmMessages] = useState<any[]>([]);
  const [dmInput, setDmInput] = useState("");
  const [dmLoading, setDmLoading] = useState(false);
  const dmEndRef = useRef<HTMLDivElement>(null);

  const [capitalOsData, setCapitalOsData] = useState<CapitalOsDashboard | null>(null);
  const [capitalOsLoading, setCapitalOsLoading] = useState(false);


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


  const openDm = (friendId: number, friendName: string) => {
    setDmFriendId(friendId);
    setDmFriendName(friendName);
    setDmMessages([]);
    fetchDmMessages(friendId);
    setActiveTab("messages");
  };

  useEffect(() => {
    if (activeTab !== "messages" || !dmFriendId) return;
    const interval = setInterval(() => fetchDmMessages(dmFriendId), 5000);
    return () => clearInterval(interval);
  }, [activeTab, dmFriendId]);

  const getCreatorAvatarUrl = (handle: string) => {
    const clean = handle.replace(/^@/, "");
    if (!clean || creatorAvatarErrors.has(clean)) return null;
    return `/api/youtube-avatar/${encodeURIComponent(clean)}`;
  };

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
      if (res.ok) { toast({ title: "Team invite sent!" }); fetchFriends(); setFriendSearchResults(prev => prev.filter(u => u.id !== receiverId)); }
      else { const d = await res.json(); toast({ title: "Error", description: d.error, variant: "destructive" }); }
    } catch (err) { toast({ title: "Error", description: "Failed to send request", variant: "destructive" }); }
  };

  const acceptFriend = async (friendshipId: number) => {
    try {
      await fetch("/api/friends/accept", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ friendshipId }) });
      fetchFriends();
      toast({ title: "Team member added!" });
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
      toast({ title: "Team member removed" });
    } catch (err) { toast({ title: "Error", description: "Failed to remove", variant: "destructive" }); }
  };

  const fetchQA = async () => {
    try {
      const res = await fetch("/api/dashboard-qa", { credentials: "include" });
      if (res.ok) setQaMessages(await res.json());
    } catch (err) { console.error("Failed to fetch Q&A", err); }
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
    } finally { setQaLoading(false); }
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
      if (res.ok) setFundingData(await res.json());
    } catch (err) { console.error("Failed to fetch funding readiness", err); }
    finally { setFundingLoading(false); }
  };

  const fetchCapitalOsDashboard = async () => {
    setCapitalOsLoading(true);
    try {
      const res = await fetch("/api/capital-os/dashboard", { credentials: "include" });
      if (res.ok) setCapitalOsData(await res.json());
    } catch (err) { console.error("Failed to fetch capital OS data", err); }
    finally { setCapitalOsLoading(false); }
  };

  const handleDocumentUpload = async (file: File, documentType: "credit_report" | "bank_statement", bureau?: string) => {
    setDocUploading(true);
    setDocUploadType(documentType);
    if (bureau) setBureauUploading(bureau);
    try {
      const fileContent = await new Promise<string>((resolve, reject) => {
        const reader = new FileReader();
        const isPdf = file.name.toLowerCase().endsWith(".pdf");
        reader.onload = () => {
          if (isPdf) {
            const base64 = (reader.result as string).split(",")[1];
            resolve(base64);
          } else { resolve(reader.result as string); }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        if (isPdf) reader.readAsDataURL(file);
        else reader.readAsText(file);
      });
      const body: any = { fileContent, documentType };
      if (bureau) body.bureau = bureau;
      const res = await fetch("/api/analyze-document", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      if (res.ok) {
        const data = await res.json();
        toast({ title: "Analysis Complete", description: "Your document has been analyzed and your funding score has been updated." });
        queryClient.invalidateQueries({ queryKey: ["/api/me"] });
        queryClient.invalidateQueries({ queryKey: ["/api/chat"] });
        await Promise.all([fetchFundingReadiness(), fetchCapitalOsDashboard()]);
        if (data.repairResult) {
          setRepairData(data.repairResult);
          toast({ title: "Credit Repair Updated", description: `${data.repairResult.detectedIssues?.length || 0} issues detected. ${data.repairResult.letters?.length || 0} letters generated.` });
        }
        await fetchRepairData();
      } else {
        const data = await res.json();
        toast({ title: "Analysis Failed", description: data.error || "Could not analyze document.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Upload Error", description: "Failed to upload document. Please try again.", variant: "destructive" });
    } finally { setDocUploading(false); setDocUploadType(null); setBureauUploading(null); }
  };

  const fetchRepairData = async () => {
    setRepairLoading(true);
    try {
      const res = await fetch("/api/credit-repair-data", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        if (data.hasData) setRepairData(data);
      }
    } catch (err) { console.error("Failed to fetch repair data", err); }
    finally { setRepairLoading(false); }
  };

  const runRepairAnalysis = async (bureau?: string) => {
    setRepairAnalyzing(true);
    try {
      const res = await fetch("/api/credit-repair-analysis", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ useStored: true, bureau: bureau || repairBureauFilter }),
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
    } finally { setRepairAnalyzing(false); }
  };

  const copyLetterToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedLetter(key);
      setTimeout(() => setCopiedLetter(null), 2000);
      toast({ title: "Copied to clipboard" });
    });
  };

  const loadUserAddress = async () => {
    try {
      const res = await fetch("/api/user-address", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        setUserAddressForm(data);
        setAddressLoaded(true);
      }
    } catch (err) { console.error("Failed to load address", err); }
  };

  const saveUserAddress = async () => {
    setAddressSaving(true);
    try {
      const res = await fetch("/api/user-address", {
        method: "POST", headers: { "Content-Type": "application/json" },
        credentials: "include", body: JSON.stringify(userAddressForm),
      });
      if (res.ok) {
        toast({ title: "Address saved", description: "Your info will appear on all generated letters." });
      } else {
        toast({ title: "Error", description: "Please fill in all address fields.", variant: "destructive" });
      }
    } catch { toast({ title: "Error", description: "Failed to save address.", variant: "destructive" }); }
    finally { setAddressSaving(false); }
  };



  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchFundingReadiness();
      fetchRepairData();
      loadUserAddress();
      fetchQA();
      fetchCapitalOsDashboard();
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      if (activeTab === "mission_control" || activeTab === "funding_strategy") {
        fetchFundingReadiness();
        fetchCapitalOsDashboard();
      }
      if (activeTab === "repair_engine") {
        fetchRepairData();
        fetchFundingReadiness();
        fetchCapitalOsDashboard();
      }
    }
  }, [activeTab]);

  const lastMentorMsg = [...messages].reverse().find(m => m.role === 'assistant' && m.mentor);
  const activeMentorKey = selectedMentor !== null ? selectedMentor : (mentorCleared ? null : (lastMentorMsg?.mentor || null));
  const activeMentor = activeMentorKey ? MENTOR_INFO[activeMentorKey] : null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!authLoading && !user) { setLocation("/"); return; }
  }, [user, authLoading, setLocation]);

  useEffect(() => { scrollToBottom(); }, [messages]);

  const scrollToBottom = () => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); };

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
    try {
      let fileContent: string | undefined;
      if (file) {
        fileContent = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          const isPdf = file.name.toLowerCase().endsWith(".pdf");
          reader.onload = () => {
            if (isPdf) { resolve((reader.result as string).split(",")[1]); }
            else { resolve(reader.result as string); }
          };
          reader.onerror = () => reject(new Error("Failed to read file"));
          if (isPdf) reader.readAsDataURL(file);
          else reader.readAsText(file);
        });
      }
      await sendMessage(msg, attachment, fileContent, activeMentorKey);
    } catch {} finally { setIsLoading(false); }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const el = e.target;
    el.style.height = "auto";
    el.style.height = Math.min(el.scrollHeight, 200) + "px";
  };

  if (authLoading || !user) return null;

  const hasMessages = messages.length > 0;

  const getScoreColor = (score: number) => {
    if (score >= 85) return "#22c55e";
    if (score >= 70) return "#eab308";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
  };

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
    <div className="h-[100dvh] flex text-[#1a1a2e] relative">
      <TechBackground />

      {sidebarOpen && <div className="fixed inset-0 bg-black/60 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={cn(
        "w-[240px] flex flex-col shrink-0 relative z-50",
        "fixed h-full lg:static lg:flex transition-transform duration-200 ease-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0",
        "lg:flex",
        !sidebarOpen && "hidden lg:flex"
      )} style={{ background: 'rgba(255,255,255,0.8)', backdropFilter: 'blur(20px)' }}>
        <div className="h-14 px-5 flex items-center justify-between border-b border-white/30">
          <div className="flex items-center gap-2.5">
            <span className="relative w-7 h-7 flex items-center justify-center">
              <span className="absolute inset-0 rounded-full bg-[#3a3a5a]/15 animate-ping" />
              <span className="relative w-3 h-3 rounded-full bg-[#3a3a5a] shadow-[0_0_8px_rgba(58,58,90,0.4)]" />
            </span>
            <ProfundrLogo size="sm" />
          </div>
          <button onClick={() => setSidebarOpen(false)} className="lg:hidden text-[#1a1a2e]/60 hover:text-[#1a1a2e]" data-testid="button-close-sidebar">
            <X className="w-4 h-4" />
          </button>
        </div>

        <nav className="flex-1 py-3 px-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon;
            const isActive = activeTab === item.key;
            return (
              <button
                key={item.key}
                data-testid={`nav-${item.key}`}
                onClick={() => { setActiveTab(item.key); setSidebarOpen(false); }}
                className={cn(
                  "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[12px] font-medium transition-all text-left",
                  isActive
                    ? "bg-white/90 text-[#1a1a2e] shadow-[0_2px_8px_rgba(0,0,0,0.04)] border border-white/60"
                    : "text-[#1a1a2e]/65 hover:bg-white/50 hover:text-[#1a1a2e]/85"
                )}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span className="truncate">{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="px-3 pb-3 border-t border-white/30 pt-3">
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <div className="relative shrink-0">
              <div className="w-8 h-8 rounded-lg bg-white/50 border border-white/30 flex items-center justify-center text-[10px] font-bold text-[#1a1a2e]/80">
                {(user.displayName || user.email).substring(0, 2).toUpperCase()}
              </div>
              <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white/40" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[11px] font-semibold text-[#1a1a2e] truncate">{user.displayName || user.email.split("@")[0]}</p>
              <p className="text-[9px] text-[#1a1a2e]/50">Online</p>
            </div>
          </div>
          <button
            data-testid="button-logout"
            onClick={logout}
            className="w-full h-8 text-[10px] rounded-lg bg-white/50 border border-white/30 hover:bg-white/60 text-[#1a1a2e]/60 font-medium transition-colors"
          >
            Sign Off
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative z-10 bg-transparent">
        <header className="shrink-0 h-12 flex items-center justify-between px-4 bg-white/80 backdrop-blur-md border-b border-white/30 relative z-10">
          <div className="flex items-center gap-3">
            <button
              data-testid="button-menu"
              onClick={() => setSidebarOpen(true)}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/60 transition-colors lg:hidden"
            >
              <Menu className="w-5 h-5 text-[#1a1a2e]/70" />
            </button>
            <span className="text-[13px] font-semibold text-[#1a1a2e]/80">{NAV_ITEMS.find(n => n.key === activeTab)?.label}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              data-testid="button-toggle-buddy"
              onClick={() => setBuddyOpen(!buddyOpen)}
              className={cn("w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/60 transition-colors", buddyOpen && "bg-white/60")}
              title="Team Members"
            >
              <Users className="w-4 h-4 text-[#1a1a2e]/60" />
            </button>
          </div>
        </header>

        <div ref={scrollContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto">

          {activeTab === "mission_control" && (
            <div className="w-full px-5 sm:px-8 py-6 max-w-[1200px] mx-auto">
              {capitalOsLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-[#1a1a2e]/50" />
                </div>
              ) : capitalOsData ? (
                <>
                  {(() => {
                    const phaseDescriptions: Record<string, string> = {
                      "Repair": "Your credit has issues that need fixing before you can get approved. Focus on removing negative items like late payments, collections, or charge-offs. This is the first step to building a strong credit profile.",
                      "Build": "Your credit is clean but still young. You need more time and more accounts to show lenders you can be trusted. Keep making on-time payments and let your accounts age.",
                      "Optimize": "You're getting close! Your credit is decent but needs fine-tuning. Pay down balances, reduce how much of your credit you're using, and avoid opening new accounts for now.",
                      "Apply": "You're almost ready to apply for funding. Your credit is in good shape — just make sure your balances are low and you haven't applied for anything recently. Timing matters here.",
                      "Scale": "You're in great shape! Your credit profile is strong and you're ready to grow your funding. Focus on strategic applications and maintaining what you've built."
                    };
                    const nextStepsByPhase: Record<string, string[]> = {
                      "Repair": ["Dispute any errors or negative items using the Repair Engine", "Pay off collections if possible", "Make all payments on time going forward", "Don't apply for any new credit right now"],
                      "Build": ["Keep all accounts in good standing", "Consider a secured credit card if you have few accounts", "Wait for accounts to age — at least 6 months", "Avoid unnecessary hard inquiries"],
                      "Optimize": ["Pay down credit card balances to below 10% of your limit", "Don't close old accounts — they help your average age", "Avoid opening new accounts", "Check for any remaining negative items to dispute"],
                      "Apply": ["Get all card balances under 10% before applying", "Make sure you haven't applied for credit in the last 90 days", "Check your application window status below", "Target the type of funding that matches your profile"],
                      "Scale": ["Maintain low utilization across all accounts", "Strategically apply for higher-limit products", "Monitor your profile for any changes", "Consider diversifying your account types"]
                    };
                    const mcBureau = capitalOsData.bureauHealth.bureaus.find(b => b.bureau === mcBureauTab)!;
                    const mcBureauG = mcBureau.guidance;
                    const currentPhase = mcBureauG?.fundingPhase || capitalOsData.phase.phaseLabel.split(":")[0]?.trim() || "Repair";
                    return (
                      <>
                        <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-6 mb-6" data-testid="doc-upload-section">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center gap-2">
                              <BookOpen className="w-4 h-4 text-[#1a1a2e]/60" />
                              <p className="text-sm font-semibold text-[#1a1a2e]">Your Analysis</p>
                            </div>
                            <button onClick={() => { fetchCapitalOsDashboard(); fetchFundingReadiness(); }} className="text-[10px] text-[#1a1a2e]/50 hover:text-[#1a1a2e]/80 flex items-center gap-1" data-testid="button-refresh-score">
                              <RefreshCw className="w-3 h-3" /> Refresh
                            </button>
                          </div>

                          <div className="flex items-center gap-3 p-4 rounded-xl bg-white/60 border border-white/30 mb-4">
                            {fundingData?.hasCreditReport ? <CheckCircle2 className="w-6 h-6 text-green-400 shrink-0" /> : <Upload className="w-6 h-6 text-[#1a1a2e]/40 shrink-0" />}
                            <div className="flex-1">
                              <p className="text-sm font-medium text-[#1a1a2e]/90">
                                {capitalOsData ? `${capitalOsData.bureauHealth.bureaus.filter(b => b.uploaded).length} of 3 Bureau Reports Uploaded` : "No Reports Uploaded Yet"}
                              </p>
                              <p className="text-[11px] text-[#1a1a2e]/55">Upload each bureau below to see your full picture</p>
                            </div>
                          </div>

                          {fundingData?.analysisSummary && (
                            <div className="p-4 rounded-xl bg-[#f8f8fc] border border-[#e8e8f0] mb-4">
                              <p className="text-[11px] text-[#1a1a2e]/80 leading-relaxed">{fundingData.analysisSummary}</p>
                              {fundingData.lastAnalysisDate && <p className="text-[9px] text-[#1a1a2e]/45 mt-2">{timeAgo(fundingData.lastAnalysisDate)} ago</p>}
                            </div>
                          )}

                          {mcBureauG && (
                            <div className="p-4 rounded-xl bg-gradient-to-br from-white/80 to-[#f8f8fc] border border-[#e0e0ea]">
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: mcBureauG.riskTierColor + '15', color: mcBureauG.riskTierColor }}>{mcBureauG.fundingPhase} Phase</span>
                                <span className="text-[10px] text-[#1a1a2e]/40">on {mcBureauTab}</span>
                              </div>
                              <p className="text-[12px] text-[#1a1a2e]/70 leading-relaxed mb-3">{phaseDescriptions[currentPhase] || phaseDescriptions["Repair"]}</p>
                              <p className="text-[10px] font-semibold text-[#1a1a2e]/60 uppercase tracking-wider mb-2">What to do next</p>
                              <div className="space-y-1.5">
                                {(nextStepsByPhase[currentPhase] || nextStepsByPhase["Repair"]).map((step, i) => (
                                  <div key={i} className="flex items-start gap-2">
                                    <div className="w-4 h-4 rounded-full bg-[#3a3a5a]/10 flex items-center justify-center shrink-0 mt-0.5">
                                      <span className="text-[8px] font-bold text-[#3a3a5a]">{i + 1}</span>
                                    </div>
                                    <p className="text-[11px] text-[#1a1a2e]/65 leading-relaxed">{step}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}

                          <div className="mt-4">
                            <input ref={bankStatementInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.csv" className="hidden" data-testid="input-bank-statement-upload"
                              onChange={(e) => { const file = e.target.files?.[0]; if (file) handleDocumentUpload(file, "bank_statement"); e.target.value = ""; }} />
                            <button onClick={() => bankStatementInputRef.current?.click()} disabled={docUploading}
                              className={cn("w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                                fundingData?.hasBankStatement ? "border-green-500/20 bg-green-500/[0.04]" : "border-white/30 bg-white/50 hover:bg-white/60",
                                docUploading && docUploadType === "bank_statement" && "opacity-50"
                              )} data-testid="button-upload-bank-statement">
                              {docUploading && docUploadType === "bank_statement" ? <Loader2 className="w-5 h-5 text-[#1a1a2e]/75 animate-spin shrink-0" /> :
                                fundingData?.hasBankStatement ? <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" /> :
                                <Upload className="w-5 h-5 text-[#1a1a2e]/65 shrink-0" />}
                              <div>
                                <p className="text-xs font-medium text-[#1a1a2e]/90">{fundingData?.hasBankStatement ? "Bank Statement Uploaded" : "Upload Bank Statement (Optional)"}</p>
                                <p className="text-[10px] text-[#1a1a2e]/55">Adds extra detail to your analysis</p>
                              </div>
                            </button>
                          </div>
                          {docUploading && (
                            <div className="mt-3 flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-white/30">
                              <Loader2 className="w-4 h-4 text-[#1a1a2e]/75 animate-spin shrink-0" />
                              <p className="text-[10px] text-[#1a1a2e]/75">Analyzing document...</p>
                            </div>
                          )}
                        </div>

                        <div className="flex gap-2 mb-4">
                          {["Experian", "Equifax", "TransUnion"].map(name => {
                            const bData = capitalOsData.bureauHealth.bureaus.find(b => b.bureau === name);
                            return (
                              <button key={name} onClick={() => setMcBureauTab(name)}
                                className={cn("flex-1 px-3 py-2.5 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2",
                                  mcBureauTab === name ? "bg-[#1a1a2e] text-white shadow-lg" : "bg-white/70 text-[#1a1a2e]/60 hover:bg-white/90 border border-white/40"
                                )} data-testid={`mc-tab-${name.toLowerCase()}`}>
                                {bData?.uploaded && <span className={cn("w-2 h-2 rounded-full", mcBureauTab === name ? "bg-green-400" : "bg-green-500")} />}
                                {name}
                              </button>
                            );
                          })}
                        </div>

                        {mcBureau.uploaded && mcBureauG ? (
                          <>
                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                              <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-5" data-testid="card-readiness">
                                <p className="text-[10px] text-[#1a1a2e]/60 uppercase tracking-wider mb-1">Risk Tier</p>
                                <p className="text-[9px] text-[#1a1a2e]/40 mb-3">How lenders see this bureau</p>
                                <div className="flex items-center gap-3">
                                  <div className="w-14 h-14 rounded-xl flex items-center justify-center" style={{ backgroundColor: mcBureauG.riskTierColor + "18" }}>
                                    <Shield className="w-6 h-6" style={{ color: mcBureauG.riskTierColor }} />
                                  </div>
                                  <div>
                                    <span className="text-lg font-bold" style={{ color: mcBureauG.riskTierColor }} data-testid="text-risk-tier">{mcBureauG.riskTier.replace("_", " ")}</span>
                                    <p className="text-[10px] text-[#1a1a2e]/50 mt-0.5">{
                                      mcBureauG.riskTier === "PRIME" ? "Strong approval odds" :
                                      mcBureauG.riskTier === "STANDARD" ? "Decent approval odds" :
                                      mcBureauG.riskTier === "SUBPRIME" ? "Low approval odds" :
                                      "Very unlikely to be approved"
                                    }</p>
                                  </div>
                                </div>
                              </div>

                              <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-5" data-testid="card-phase">
                                <p className="text-[10px] text-[#1a1a2e]/60 uppercase tracking-wider mb-1">Funding Phase</p>
                                <p className="text-[9px] text-[#1a1a2e]/40 mb-3">Where you are in the journey</p>
                                <p className="text-lg font-bold text-[#1a1a2e] mb-3" data-testid="text-phase-label">{mcBureauG.fundingPhase}</p>
                                <div className="flex gap-1">
                                  {["Repair", "Build", "Optimize", "Apply", "Scale"].map((p) => {
                                    const phases = ["Repair", "Build", "Optimize", "Apply", "Scale"];
                                    const currentIdx = phases.indexOf(mcBureauG.fundingPhase);
                                    const thisIdx = phases.indexOf(p);
                                    return (
                                      <div key={p} className="flex-1 flex flex-col items-center gap-1">
                                        <div className={cn("w-full h-1.5 rounded-full transition-all",
                                          thisIdx < currentIdx ? "bg-[#3a3a5a]" : thisIdx === currentIdx ? "bg-[#3a3a5a]/60" : "bg-[#e0e0ea]"
                                        )} />
                                        <span className={cn("text-[8px]", thisIdx === currentIdx ? "text-[#1a1a2e] font-medium" : "text-[#1a1a2e]/40")}>{p}</span>
                                      </div>
                                    );
                                  })}
                                </div>
                              </div>

                              <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-5" data-testid="card-exposure">
                                <p className="text-[10px] text-[#1a1a2e]/60 uppercase tracking-wider mb-1">Potential Funding</p>
                                <p className="text-[9px] text-[#1a1a2e]/40 mb-3">Based on your highest limit x2.5</p>
                                <p className="text-2xl font-bold text-[#1a1a2e] font-mono" data-testid="text-potential-funding">${mcBureauG.exposureCeiling.toLocaleString()}</p>
                                <p className="text-[10px] text-[#1a1a2e]/50 mt-1">This is what you could expect from {mcBureauTab} when ready — not a guarantee of approval</p>
                              </div>

                              <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-5" data-testid="card-window">
                                <p className="text-[10px] text-[#1a1a2e]/60 uppercase tracking-wider mb-1">Application Window</p>
                                <p className="text-[9px] text-[#1a1a2e]/40 mb-3">When to apply</p>
                                {mcBureauG.applicationReady ? (
                                  <div>
                                    <span className="text-lg font-bold text-green-600" data-testid="text-window-status">Ready</span>
                                    <p className="text-[10px] text-[#1a1a2e]/60 mt-1">Your {mcBureauTab} profile looks strong enough to apply</p>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="text-lg font-bold text-orange-500" data-testid="text-window-status">Not Yet</span>
                                    <p className="text-[10px] text-[#1a1a2e]/50 mt-1">There are still things to fix before applying — check the action items below</p>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                              <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-5" data-testid={`bureau-stats-${mcBureauTab.toLowerCase()}`}>
                                <p className="text-xs font-semibold text-[#1a1a2e]/70 mb-3">Credit Snapshot — {mcBureauTab}</p>
                                <div className="grid grid-cols-3 gap-3 text-center mb-3">
                                  <div className="p-2.5 rounded-xl bg-white/60">
                                    <p className={cn("text-xl font-bold font-mono", mcBureau.utilization > 50 ? "text-red-600" : mcBureau.utilization > 30 ? "text-yellow-600" : mcBureau.utilization > 10 ? "text-orange-500" : "text-green-600")}>{mcBureau.utilization}%</p>
                                    <p className="text-[9px] text-[#1a1a2e]/50 mt-0.5">Credit Usage</p>
                                    <p className="text-[8px] text-[#1a1a2e]/35">{mcBureau.utilization <= 10 ? "Great" : mcBureau.utilization <= 30 ? "Okay" : "Too high"}</p>
                                  </div>
                                  <div className="p-2.5 rounded-xl bg-white/60">
                                    <p className={cn("text-xl font-bold font-mono", mcBureau.hardInquiries > 4 ? "text-red-600" : mcBureau.hardInquiries > 2 ? "text-yellow-600" : "text-green-600")}>{mcBureau.hardInquiries}</p>
                                    <p className="text-[9px] text-[#1a1a2e]/50 mt-0.5">Hard Inquiries</p>
                                    <p className="text-[8px] text-[#1a1a2e]/35">{mcBureau.hardInquiries <= 2 ? "Low" : mcBureau.hardInquiries <= 4 ? "Moderate" : "High"}</p>
                                  </div>
                                  <div className="p-2.5 rounded-xl bg-white/60">
                                    <p className={cn("text-xl font-bold font-mono", mcBureau.derogatoryCount > 0 ? "text-red-600" : "text-green-600")}>{mcBureau.derogatoryCount}</p>
                                    <p className="text-[9px] text-[#1a1a2e]/50 mt-0.5">Negative Items</p>
                                    <p className="text-[8px] text-[#1a1a2e]/35">{mcBureau.derogatoryCount === 0 ? "Clean" : "Needs work"}</p>
                                  </div>
                                </div>
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="flex justify-between p-2 rounded-lg bg-white/50 text-[10px]">
                                    <span className="text-[#1a1a2e]/50">Late Payments</span>
                                    <span className={cn("font-semibold", mcBureauG.latePayments > 0 ? "text-red-600" : "text-green-600")}>{mcBureauG.latePayments}</span>
                                  </div>
                                  <div className="flex justify-between p-2 rounded-lg bg-white/50 text-[10px]">
                                    <span className="text-[#1a1a2e]/50">Collections</span>
                                    <span className={cn("font-semibold", mcBureauG.collections > 0 ? "text-red-600" : "text-green-600")}>{mcBureauG.collections}</span>
                                  </div>
                                  <div className="flex justify-between p-2 rounded-lg bg-white/50 text-[10px]">
                                    <span className="text-[#1a1a2e]/50">Account Mix</span>
                                    <span className="font-semibold text-[#1a1a2e]/70">{mcBureauG.accountMix || "—"}</span>
                                  </div>
                                  <div className="flex justify-between p-2 rounded-lg bg-white/50 text-[10px]">
                                    <span className="text-[#1a1a2e]/50">Balance Trend</span>
                                    <span className={cn("font-semibold", mcBureauG.balanceTrend === "Improving" ? "text-green-600" : mcBureauG.balanceTrend === "Stable" ? "text-[#1a1a2e]/70" : "text-red-600")}>{mcBureauG.balanceTrend || "—"}</span>
                                  </div>
                                </div>
                                {mcBureauG.velocityRisk && (
                                  <div className="mt-3 p-3 rounded-xl bg-white/50 border border-white/30">
                                    <div className="flex items-center justify-between mb-1">
                                      <span className="text-[10px] text-[#1a1a2e]/50">Application Speed Check</span>
                                      <span className={cn("text-[10px] font-bold px-2 py-0.5 rounded-full",
                                        mcBureauG.velocityRisk.velocityTier === "A" ? "bg-green-500/15 text-green-600" :
                                        mcBureauG.velocityRisk.velocityTier === "B" ? "bg-yellow-500/15 text-yellow-600" :
                                        mcBureauG.velocityRisk.velocityTier === "C" ? "bg-orange-500/15 text-orange-600" :
                                        "bg-red-500/15 text-red-600"
                                      )}>Tier {mcBureauG.velocityRisk.velocityTier} — {mcBureauG.velocityRisk.velocityTierLabel}</span>
                                    </div>
                                    {mcBureauG.velocityRisk.mandatoryWaitingMonths > 0 && (
                                      <p className="text-[10px] text-red-500/80 mt-1">Wait at least {mcBureauG.velocityRisk.mandatoryWaitingMonths} months before applying again</p>
                                    )}
                                  </div>
                                )}
                              </div>

                              <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-5" data-testid="action-items-panel">
                                <p className="text-xs font-semibold text-[#1a1a2e]/70 mb-1">What To Work On — {mcBureauTab}</p>
                                <p className="text-[10px] text-[#1a1a2e]/40 mb-3">Steps to improve your profile on this bureau</p>
                                {mcBureauG.actionItems.length > 0 ? (
                                  <div className="space-y-2">
                                    {mcBureauG.actionItems.map((item, i) => (
                                      <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/50">
                                        <div className="w-5 h-5 rounded-full bg-[#3a3a5a]/10 flex items-center justify-center shrink-0 mt-0.5">
                                          <ChevronRight className="w-3 h-3 text-[#3a3a5a]/60" />
                                        </div>
                                        <p className="text-[11px] text-[#1a1a2e]/70 leading-relaxed">{item}</p>
                                      </div>
                                    ))}
                                  </div>
                                ) : (
                                  <div className="flex items-center gap-2 p-3 rounded-xl bg-green-500/5">
                                    <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                    <p className="text-[11px] text-green-600/80">No action items — this bureau looks good!</p>
                                  </div>
                                )}
                                {mcBureauG.denialTriggers.length > 0 && (
                                  <div className="mt-3 p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                                    <p className="text-[10px] font-semibold text-red-500/80 mb-2">Things That Could Get You Denied</p>
                                    {mcBureauG.denialTriggers.map((t, ti) => (
                                      <div key={ti} className="flex items-start gap-2 mb-1">
                                        <AlertCircle className="w-3 h-3 text-red-400/70 shrink-0 mt-0.5" />
                                        <p className="text-[10px] text-[#1a1a2e]/60 leading-relaxed">{t}</p>
                                      </div>
                                    ))}
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="mt-3 mb-6">
                              <input
                                ref={(el) => { bureauUploadRefs.current[mcBureauTab] = el; }}
                                type="file" accept=".pdf,.doc,.docx,.txt,.csv" className="hidden"
                                data-testid={`input-bureau-reupload-${mcBureauTab.toLowerCase()}`}
                                onChange={(e) => { const file = e.target.files?.[0]; if (file) handleDocumentUpload(file, "credit_report", mcBureauTab); e.target.value = ""; }}
                              />
                              <button
                                onClick={() => bureauUploadRefs.current[mcBureauTab]?.click()}
                                disabled={docUploading}
                                className={cn("w-full px-4 py-3 rounded-xl bg-white/70 border border-white/40 hover:bg-white/90 text-[12px] font-medium text-[#1a1a2e]/70 transition-colors flex items-center justify-center gap-2",
                                  docUploading && bureauUploading === mcBureauTab && "opacity-50")}
                                data-testid={`button-reupload-bureau-${mcBureauTab.toLowerCase()}`}
                              >
                                {docUploading && bureauUploading === mcBureauTab ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                {docUploading && bureauUploading === mcBureauTab ? "Analyzing..." : `Update ${mcBureauTab} Report`}
                              </button>
                            </div>
                          </>
                        ) : (
                          <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-10 mb-6">
                            <div className="flex flex-col items-center justify-center text-center">
                              <Upload className="w-10 h-10 text-[#1a1a2e]/25 mb-3" />
                              <p className="text-sm font-medium text-[#1a1a2e]/70 mb-1">No {mcBureauTab} report uploaded yet</p>
                              <p className="text-[11px] text-[#1a1a2e]/45 mb-5 max-w-sm">Upload your {mcBureauTab} credit report to see your risk tier, funding potential, and personalized next steps for this bureau.</p>
                              <input
                                ref={(el) => { bureauUploadRefs.current[mcBureauTab] = el; }}
                                type="file" accept=".pdf,.doc,.docx,.txt,.csv" className="hidden"
                                data-testid={`input-bureau-upload-${mcBureauTab.toLowerCase()}`}
                                onChange={(e) => { const file = e.target.files?.[0]; if (file) handleDocumentUpload(file, "credit_report", mcBureauTab); e.target.value = ""; }}
                              />
                              <button
                                onClick={() => bureauUploadRefs.current[mcBureauTab]?.click()}
                                disabled={docUploading}
                                className={cn("px-6 py-3 rounded-xl bg-[#1a1a2e] text-white text-[12px] font-medium hover:bg-[#2a2a4a] transition-colors flex items-center gap-2",
                                  docUploading && bureauUploading === mcBureauTab && "opacity-50")}
                                data-testid={`button-upload-bureau-${mcBureauTab.toLowerCase()}`}
                              >
                                {docUploading && bureauUploading === mcBureauTab ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                                Upload {mcBureauTab} Report
                              </button>
                            </div>
                          </div>
                        )}

                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                          <button onClick={() => setActiveTab("messages")} className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-5 hover:bg-white/90 text-left transition-colors" data-testid="button-go-chat">
                            <div className="flex items-center gap-3">
                              <MessageCircle className="w-5 h-5 text-[#1a1a2e]/50" />
                              <div>
                                <p className="text-xs font-semibold text-[#1a1a2e]/80">Team Messages</p>
                                <p className="text-[10px] text-[#1a1a2e]/45">Message your team members</p>
                              </div>
                            </div>
                          </button>
                          <button onClick={() => setActiveTab("repair_engine")} className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-5 hover:bg-white/90 text-left transition-colors">
                            <div className="flex items-center gap-3">
                              <Shield className="w-5 h-5 text-[#1a1a2e]/50" />
                              <div>
                                <p className="text-xs font-semibold text-[#1a1a2e]/80">Repair Engine</p>
                                <p className="text-[10px] text-[#1a1a2e]/45">Dispute errors on your reports</p>
                              </div>
                            </div>
                          </button>
                          <button onClick={() => setActiveTab("funding_strategy")} className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-5 hover:bg-white/90 text-left transition-colors">
                            <div className="flex items-center gap-3">
                              <DollarSign className="w-5 h-5 text-[#1a1a2e]/50" />
                              <div>
                                <p className="text-xs font-semibold text-[#1a1a2e]/80">Funding Strategy</p>
                                <p className="text-[10px] text-[#1a1a2e]/45">Plan when and where to apply</p>
                              </div>
                            </div>
                          </button>
                        </div>

                        {fundingData && fundingData.alerts.length > 0 && (
                          <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-6 mb-4" data-testid="risk-alerts-card">
                            <p className="text-xs font-semibold text-[#1a1a2e]/70 mb-1">Alerts</p>
                            <p className="text-[10px] text-[#1a1a2e]/40 mb-4">Things that need your attention</p>
                            <div className="space-y-2">
                              {fundingData.alerts.map((alert, idx) => (
                                <button key={idx}
                                  onClick={() => setExpandedAlerts(prev => { const next = new Set(prev); if (next.has(idx)) next.delete(idx); else next.add(idx); return next; })}
                                  className={cn("w-full text-left rounded-xl border-l-[3px] bg-white/50 hover:bg-white/60 transition-all p-3.5",
                                    alert.severity === "red" ? "border-l-red-500/60" : alert.severity === "yellow" ? "border-l-yellow-500/60" : "border-l-[#c0c0d0]"
                                  )} data-testid={`alert-${idx}`}>
                                  <div className="flex items-start gap-3">
                                    {alert.severity === "red" ? <AlertCircle className="w-4 h-4 text-red-400/70 shrink-0 mt-0.5" /> :
                                     alert.severity === "yellow" ? <AlertTriangle className="w-4 h-4 text-yellow-400/70 shrink-0 mt-0.5" /> :
                                     <Info className="w-4 h-4 text-[#1a1a2e]/55 shrink-0 mt-0.5" />}
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm text-[#1a1a2e]/95">{alert.title}</p>
                                      {expandedAlerts.has(idx) && (
                                        <div className="mt-2 space-y-1.5 text-xs">
                                          <p className="text-[#1a1a2e]/75">{alert.explanation}</p>
                                          <p className="text-[#1a1a2e]/65"><span className="font-medium">Impact:</span> {alert.impact}</p>
                                          <p className="text-green-600/70"><span className="font-medium">Fix:</span> {alert.fix}</p>
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
                      </>
                    );
                  })()}
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <AlertCircle className="w-8 h-8 text-[#1a1a2e]/45 mb-3" />
                  <p className="text-sm text-[#1a1a2e]/70">Unable to load dashboard data</p>
                  <button onClick={fetchCapitalOsDashboard} className="mt-3 text-xs text-[#1a1a2e]/60 hover:text-[#1a1a2e]/80 underline" data-testid="button-retry-dashboard">Retry</button>
                </div>
              )}
            </div>
          )}

          {activeTab === "repair_engine" && (
            <div className="w-full px-5 sm:px-8 py-6 max-w-[900px] mx-auto">
              <div className="flex items-center justify-between mb-5">
                <div>
                  <h2 className="text-lg font-semibold text-[#1a1a2e]" data-testid="text-repair-title">Repair Engine</h2>
                  <p className="text-[11px] text-[#1a1a2e]/60">FCRA-compliant dispute letters per bureau</p>
                </div>
              </div>

              <div className="flex gap-1 p-1 rounded-xl bg-white/50 border border-white/30 mb-5" data-testid="repair-bureau-tabs">
                {["Experian", "Equifax", "TransUnion"].map(bureau => (
                  <button key={bureau} onClick={() => setRepairBureauFilter(bureau)}
                    className={cn("flex-1 py-2 px-3 rounded-lg text-xs font-medium transition-all",
                      repairBureauFilter === bureau ? "bg-white shadow-sm text-[#1a1a2e]" : "text-[#1a1a2e]/45 hover:text-[#1a1a2e]/70"
                    )} data-testid={`repair-tab-${bureau.toLowerCase()}`}>{bureau}</button>
                ))}
              </div>

              {(() => {
                const bureau = repairBureauFilter;
                const bureauData = capitalOsData?.bureauHealth?.bureaus?.find(b => b.bureau === bureau);
                const g = bureauData?.guidance;
                const needsRepair = g ? (g.denialTriggers.length > 0 || (bureauData?.derogatoryCount || 0) > 0 || g.latePayments > 0 || g.collections > 0 || g.chargeOffs > 0) : false;
                const bureauIssues = repairData?.detectedIssues?.filter((issue: any) => {
                  if (!issue.bureau) return true;
                  return issue.bureau.toLowerCase().includes(bureau.toLowerCase()) || issue.bureau === "All";
                }) || [];
                const bureauLetters = repairData?.letters?.filter((l: any) => {
                  if (!l.bureau) return true;
                  return l.bureau.toLowerCase().includes(bureau.toLowerCase()) || l.bureau === "All";
                }) || [];

                const disputeAddr: Record<string, string> = {
                  "Experian": "P.O. Box 4500, Allen, TX 75013",
                  "Equifax": "P.O. Box 740256, Atlanta, GA 30374-0256",
                  "TransUnion": "P.O. Box 2000, Chester, PA 19016-2000",
                };

                return (
                  <>
                    {g && bureauData?.uploaded && (
                      <div className={cn("rounded-2xl backdrop-blur-md border p-4 mb-4", needsRepair ? "bg-red-50/30 border-red-200/25" : "bg-green-50/30 border-green-200/25")} data-testid="repair-bureau-status">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-semibold text-[#1a1a2e]">{bureau}</span>
                            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: g.riskTierColor + '15', color: g.riskTierColor }}>{g.riskTier.replace("_", " ")}</span>
                          </div>
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium", needsRepair ? "bg-red-500/15 text-red-600" : "bg-green-500/15 text-green-600")}>{needsRepair ? "Repair Needed" : "Clean"}</span>
                        </div>
                        <div className="grid grid-cols-4 gap-2">
                          {[
                            { label: "Derogatory", val: bureauData.derogatoryCount, bad: bureauData.derogatoryCount > 0 },
                            { label: "Late Pmts", val: g.latePayments, bad: g.latePayments > 0 },
                            { label: "Collections", val: g.collections, bad: g.collections > 0 },
                            { label: "Charge-Offs", val: g.chargeOffs, bad: g.chargeOffs > 0 },
                          ].map(item => (
                            <div key={item.label} className="text-center p-2 rounded-lg bg-white/60">
                              <p className="text-[9px] text-[#1a1a2e]/50">{item.label}</p>
                              <p className={cn("text-sm font-bold font-mono", item.bad ? "text-red-600" : "text-green-600")}>{item.val}</p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-4 mb-4" data-testid="user-address-form">
                      <p className="text-[10px] font-medium text-[#1a1a2e]/60 uppercase tracking-wider mb-3">Your Mailing Address</p>
                      <div className="grid grid-cols-2 gap-2 mb-2">
                        <input type="text" placeholder="Full Name" value={userAddressForm.fullName} onChange={e => setUserAddressForm(p => ({ ...p, fullName: e.target.value }))}
                          className="col-span-2 h-8 px-3 rounded-lg bg-white/60 border border-white/30 text-xs text-[#1a1a2e] placeholder:text-[#1a1a2e]/30 outline-none focus:border-[#c0c0d0]" data-testid="input-full-name" />
                        <input type="text" placeholder="Street Address" value={userAddressForm.streetAddress} onChange={e => setUserAddressForm(p => ({ ...p, streetAddress: e.target.value }))}
                          className="col-span-2 h-8 px-3 rounded-lg bg-white/60 border border-white/30 text-xs text-[#1a1a2e] placeholder:text-[#1a1a2e]/30 outline-none focus:border-[#c0c0d0]" data-testid="input-street-address" />
                        <input type="text" placeholder="City" value={userAddressForm.city} onChange={e => setUserAddressForm(p => ({ ...p, city: e.target.value }))}
                          className="h-8 px-3 rounded-lg bg-white/60 border border-white/30 text-xs text-[#1a1a2e] placeholder:text-[#1a1a2e]/30 outline-none focus:border-[#c0c0d0]" data-testid="input-city" />
                        <div className="flex gap-2">
                          <input type="text" placeholder="State" value={userAddressForm.state} onChange={e => setUserAddressForm(p => ({ ...p, state: e.target.value }))}
                            className="w-1/2 h-8 px-3 rounded-lg bg-white/60 border border-white/30 text-xs text-[#1a1a2e] placeholder:text-[#1a1a2e]/30 outline-none focus:border-[#c0c0d0]" data-testid="input-state" />
                          <input type="text" placeholder="ZIP" value={userAddressForm.zipCode} onChange={e => setUserAddressForm(p => ({ ...p, zipCode: e.target.value }))}
                            className="w-1/2 h-8 px-3 rounded-lg bg-white/60 border border-white/30 text-xs text-[#1a1a2e] placeholder:text-[#1a1a2e]/30 outline-none focus:border-[#c0c0d0]" data-testid="input-zip" />
                        </div>
                      </div>
                      <button onClick={saveUserAddress} disabled={addressSaving}
                        className="h-7 px-3 rounded-lg bg-[#3a3a5a] text-white text-[10px] font-medium hover:bg-[#2a2a4a] disabled:opacity-50 transition-colors flex items-center gap-1.5" data-testid="button-save-address">
                        {addressSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                        Save
                      </button>
                    </div>

                    <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-medium text-[#1a1a2e]/60 uppercase tracking-wider">Mail Disputes To</p>
                      </div>
                      <div className="flex items-center gap-3 p-3 rounded-lg bg-white/50 border border-white/30">
                        <Send className="w-4 h-4 text-[#1a1a2e]/40 shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-[#1a1a2e]/80">{bureau} Dispute Center</p>
                          <p className="text-[10px] text-[#1a1a2e]/55">{disputeAddr[bureau]}</p>
                        </div>
                      </div>
                      <p className="text-[9px] text-[#1a1a2e]/35 mt-2">Send via USPS Certified Mail with Return Receipt</p>
                    </div>

                    <div className="flex items-center justify-between mb-4">
                      <button onClick={runRepairAnalysis} disabled={repairAnalyzing}
                        className="h-9 px-5 rounded-xl bg-[#3a3a5a] text-white text-xs font-medium hover:bg-[#2a2a4a] disabled:opacity-50 transition-colors flex items-center gap-2" data-testid="button-run-repair">
                        {repairAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Shield className="w-3.5 h-3.5" />}
                        {repairAnalyzing ? "Generating..." : `Generate ${bureau} Letters`}
                      </button>
                      <div className="flex gap-1 p-0.5 rounded-lg bg-white/40 border border-white/20">
                        {[1, 2, 3].map(round => (
                          <button key={round} onClick={() => setActiveRepairRound(round)}
                            className={cn("px-3 py-1.5 rounded-md text-[10px] font-medium transition-all",
                              activeRepairRound === round ? "bg-white shadow-sm text-[#1a1a2e]" : "text-[#1a1a2e]/40 hover:text-[#1a1a2e]/60"
                            )} data-testid={`button-round-${round}`}>
                            R{round}
                          </button>
                        ))}
                      </div>
                    </div>

                    {repairLoading ? (
                      <div className="flex items-center justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-[#1a1a2e]/40" /></div>
                    ) : !repairData ? (
                      <div className="rounded-2xl bg-white/60 border border-white/30 p-8 text-center">
                        <Shield className="w-8 h-8 text-[#1a1a2e]/20 mx-auto mb-3" />
                        <p className="text-xs text-[#1a1a2e]/60 mb-1">No dispute data yet</p>
                        <p className="text-[10px] text-[#1a1a2e]/40">Upload a credit report in Mission Control, then generate dispute letters</p>
                      </div>
                    ) : (
                      <>
                        {bureauIssues.length > 0 && (
                          <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-4 mb-4" data-testid="detected-issues-card">
                            <p className="text-[10px] font-medium text-[#1a1a2e]/60 uppercase tracking-wider mb-3">Detected Issues · {bureauIssues.length}</p>
                            <div className="space-y-1.5">
                              {bureauIssues.map((issue: any, idx: number) => (
                                <div key={idx} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/50 border border-white/30" data-testid={`issue-${idx}`}>
                                  <AlertTriangle className="w-3.5 h-3.5 text-orange-500/60 shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-[11px] text-[#1a1a2e]/85 font-medium">
                                      {typeof issue === "string" ? issue : (issue.creditor || issue.issueType || issue.issue || `Item ${idx + 1}`)}
                                    </p>
                                    <div className="flex flex-wrap gap-1.5 mt-1">
                                      {issue.issueType && <span className="text-[9px] bg-red-500/10 text-red-600/70 px-1.5 py-0.5 rounded">{issue.issueType}</span>}
                                      {issue.severity && <span className={cn("text-[9px] px-1.5 py-0.5 rounded", issue.severity === "High" ? "bg-red-500/10 text-red-600" : issue.severity === "Medium" ? "bg-yellow-500/10 text-yellow-700" : "bg-gray-500/10 text-gray-600")}>{issue.severity}</span>}
                                      {issue.accountLast4 && issue.accountLast4 !== "N/A" && <span className="text-[9px] text-[#1a1a2e]/40">...{issue.accountLast4}</span>}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {(() => {
                          const roundLetters = bureauLetters.filter((l: any) => (l.round || 1) === activeRepairRound);
                          return (
                            <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-4" data-testid="dispute-letters-card">
                              <div className="flex items-center justify-between mb-3">
                                <p className="text-[10px] font-medium text-[#1a1a2e]/60 uppercase tracking-wider">
                                  Round {activeRepairRound} Letters · {bureau}
                                </p>
                                <span className="text-[10px] text-[#1a1a2e]/40">{roundLetters.length} letter{roundLetters.length !== 1 ? "s" : ""}</span>
                              </div>

                              {roundLetters.length === 0 ? (
                                <div className="text-center py-6">
                                  <p className="text-[11px] text-[#1a1a2e]/45">No Round {activeRepairRound} letters for {bureau}</p>
                                  <p className="text-[9px] text-[#1a1a2e]/30 mt-1">
                                    {activeRepairRound === 1 ? "Click Generate to create dispute letters" :
                                     activeRepairRound === 2 ? "Send after Day 35 if Round 1 unresolved" :
                                     "Fraud escalation after Day 65"}
                                  </p>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {roundLetters.map((letter: any, idx: number) => {
                                    const key = `${bureau}-r${letter.round || 1}-${idx}`;
                                    return (
                                      <div key={key} className="rounded-xl bg-white/50 border border-white/30 overflow-hidden" data-testid={`letter-${key}`}>
                                        <button
                                          onClick={() => setExpandedLetters(prev => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; })}
                                          className="w-full flex items-center justify-between p-3 text-left hover:bg-white/60 transition-colors"
                                        >
                                          <div className="flex items-center gap-2.5 flex-1 min-w-0">
                                            <FileText className="w-4 h-4 text-[#1a1a2e]/50 shrink-0" />
                                            <div className="flex-1 min-w-0">
                                              <p className="text-[11px] font-medium text-[#1a1a2e]/85 truncate">{letter.title || letter.creditor || `Letter ${idx + 1}`}</p>
                                              {letter.disputeType && <p className="text-[9px] text-[#1a1a2e]/40 mt-0.5">{letter.disputeType}</p>}
                                            </div>
                                          </div>
                                          <ChevronDown className={cn("w-3.5 h-3.5 text-[#1a1a2e]/30 transition-transform shrink-0", expandedLetters.has(key) && "rotate-180")} />
                                        </button>
                                        {expandedLetters.has(key) && (
                                          <div className="px-3 pb-3 border-t border-white/30">
                                            <pre className="text-[11px] text-[#1a1a2e]/75 leading-relaxed whitespace-pre-wrap font-sans mt-3">{letter.content || letter.text || letter.body}</pre>
                                            <button
                                              onClick={() => copyLetterToClipboard(letter.content || letter.text || letter.body, key)}
                                              className="mt-3 flex items-center gap-1.5 h-7 px-3 rounded-lg bg-white/60 border border-white/30 text-[10px] text-[#1a1a2e]/60 hover:bg-white/80 transition-colors"
                                              data-testid={`copy-letter-${key}`}
                                            >
                                              {copiedLetter === key ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              )}
                            </div>
                          );
                        })()}
                      </>
                    )}
                  </>
                );
              })()}
            </div>
          )}

          {activeTab === "funding_strategy" && (
            <div className="w-full px-5 sm:px-8 py-6 max-w-[1000px] mx-auto">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-[#1a1a2e]" data-testid="text-funding-title">Optimize Funding Strategy</h2>
                <p className="text-[11px] text-[#1a1a2e]/60">Your step-by-step path to funding-ready applications — bureau by bureau</p>
              </div>

              {capitalOsData ? (
                <>
                  {(() => {
                    const uploadedBureaus = capitalOsData.bureauHealth.bureaus.filter(b => b.uploaded && b.guidance);
                    const readyCount = uploadedBureaus.filter(b => b.guidance!.applicationReady).length;
                    const totalUploaded = uploadedBureaus.length;
                    const overallPhase = capitalOsData.phase.phaseLabel.split(":")[0]?.trim() || "Repair";
                    const phaseSteps = [
                      { key: "repair", label: "Repair", desc: "Fix errors, remove negatives, dispute inaccuracies" },
                      { key: "build", label: "Build", desc: "Establish strong payment history and account mix" },
                      { key: "optimize", label: "Optimize", desc: "Lower utilization, season accounts, reduce inquiries" },
                      { key: "apply", label: "Apply", desc: "Submit applications through strongest bureau first" },
                      { key: "scale", label: "Scale", desc: "Expand limits, add products, grow credit portfolio" },
                    ];
                    const activePhaseIdx = phaseSteps.findIndex(p => p.label.toLowerCase() === overallPhase.toLowerCase());

                    return (
                      <>
                        <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-6 mb-6" data-testid="funding-overview">
                          <div className="flex items-center justify-between mb-4">
                            <p className="text-xs font-medium text-[#1a1a2e]/70">Funding Readiness Overview</p>
                            <div className="flex items-center gap-2">
                              <span className={cn("text-[10px] px-2.5 py-1 rounded-full font-semibold",
                                readyCount === totalUploaded && totalUploaded > 0 ? "bg-green-500/15 text-green-600" :
                                readyCount > 0 ? "bg-yellow-500/15 text-yellow-600" :
                                "bg-red-500/15 text-red-600"
                              )}>{readyCount} of {totalUploaded} Bureau{totalUploaded !== 1 ? "s" : ""} Ready</span>
                            </div>
                          </div>

                          <div className="flex items-center gap-0 mb-5">
                            {phaseSteps.map((step, i) => {
                              const isCompleted = i < activePhaseIdx;
                              const isActive = i === activePhaseIdx;
                              return (
                                <div key={step.key} className="flex items-center flex-1">
                                  <div className="flex flex-col items-center flex-1">
                                    <div className={cn(
                                      "w-9 h-9 rounded-full flex items-center justify-center text-[10px] font-bold mb-1.5 transition-all",
                                      isCompleted ? "bg-green-500 text-white" :
                                      isActive ? "bg-[#3a3a5a] text-white ring-2 ring-[#3a3a5a]/30 ring-offset-2" :
                                      "bg-[#e0e0ea] text-[#1a1a2e]/30"
                                    )}>
                                      {isCompleted ? <Check className="w-4 h-4" /> : i + 1}
                                    </div>
                                    <span className={cn("text-[9px] text-center leading-tight", isActive ? "text-[#1a1a2e] font-semibold" : isCompleted ? "text-green-600" : "text-[#1a1a2e]/40")}>{step.label}</span>
                                  </div>
                                  {i < phaseSteps.length - 1 && (
                                    <div className={cn("h-0.5 flex-1 -mx-1 mt-[-12px]", i < activePhaseIdx ? "bg-green-500" : "bg-[#e0e0ea]")} />
                                  )}
                                </div>
                              );
                            })}
                          </div>

                          <div className="p-3 rounded-xl bg-white/50 border border-white/30">
                            <p className="text-[11px] text-[#1a1a2e]/80 leading-relaxed">
                              <span className="font-semibold">Current Phase: {overallPhase}</span> — {phaseSteps[activePhaseIdx >= 0 ? activePhaseIdx : 0]?.desc}
                            </p>
                          </div>
                        </div>

                        <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 overflow-hidden mb-6" data-testid="funding-bureau-tabs">
                          <div className="flex gap-0 p-1.5 bg-white/50 border-b border-white/30">
                            {capitalOsData.bureauHealth.bureaus.map(b => (
                              <button
                                key={b.bureau}
                                onClick={() => setFundingBureauTab(b.bureau)}
                                className={cn(
                                  "flex-1 py-3 px-3 rounded-xl text-[11px] font-medium transition-all",
                                  fundingBureauTab === b.bureau
                                    ? "bg-white shadow-sm text-[#1a1a2e]"
                                    : "text-[#1a1a2e]/50 hover:text-[#1a1a2e]/70"
                                )}
                                data-testid={`tab-funding-bureau-${b.bureau.toLowerCase()}`}
                              >
                                <div className="flex flex-col items-center gap-1">
                                  <span className="font-semibold">{b.bureau}</span>
                                  {b.uploaded && b.guidance ? (
                                    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-full" style={{ backgroundColor: b.guidance.riskTierColor + '15', color: b.guidance.riskTierColor }}>{b.guidance.riskTier.replace("_", " ")}</span>
                                  ) : (
                                    <span className="text-[9px] text-[#1a1a2e]/30">Not Uploaded</span>
                                  )}
                                </div>
                              </button>
                            ))}
                          </div>

                          <div className="p-6">
                            {(() => {
                              const activeBureau = capitalOsData.bureauHealth.bureaus.find(b => b.bureau === fundingBureauTab);
                              if (!activeBureau) return null;
                              if (!activeBureau.uploaded || !activeBureau.guidance) {
                                return (
                                  <div className="text-center py-10">
                                    <Upload className="w-10 h-10 text-[#1a1a2e]/15 mx-auto mb-3" />
                                    <p className="text-[13px] text-[#1a1a2e]/60 mb-1 font-medium">No {activeBureau.bureau} report uploaded</p>
                                    <p className="text-[10px] text-[#1a1a2e]/40 mb-3">Upload your {activeBureau.bureau} credit report from Mission Control to see your funding roadmap</p>
                                    <button onClick={() => setActiveTab("mission_control")} className="text-[11px] text-[#3a3a5a] hover:underline font-medium" data-testid="link-go-upload">Go to Mission Control →</button>
                                  </div>
                                );
                              }
                              const g = activeBureau.guidance;
                              const bureauPhaseIdx = phaseSteps.findIndex(p => p.label.toLowerCase() === g.fundingPhase.toLowerCase());

                              const steps: { title: string; detail: string; status: "done" | "current" | "pending"; icon: any }[] = [];

                              const hasNoNegatives = g.collections === 0 && g.chargeOffs === 0 && g.latePayments === 0;
                              steps.push({
                                title: "Clean Up Negative Items",
                                detail: hasNoNegatives
                                  ? "No collections, charge-offs, or late payments found — you're clean."
                                  : `${g.collections} collection(s), ${g.chargeOffs} charge-off(s), ${g.latePayments} late payment(s) need attention.`,
                                status: hasNoNegatives ? "done" : (bureauPhaseIdx <= 0 ? "current" : "pending"),
                                icon: Shield,
                              });

                              const goodUtil = activeBureau.utilization <= 10;
                              steps.push({
                                title: "Optimize Utilization to ≤10%",
                                detail: goodUtil
                                  ? `Current utilization is ${activeBureau.utilization}% — optimal for approvals.`
                                  : `Current utilization is ${activeBureau.utilization}% — pay down balances to get below 10%.`,
                                status: goodUtil ? "done" : (hasNoNegatives ? "current" : "pending"),
                                icon: TrendingUp,
                              });

                              const goodSeasoning = (g as any).avgOpenAccountAgeYears >= 2 && (g as any).newAccountsLast6Months <= 1;
                              steps.push({
                                title: "Season Your Accounts",
                                detail: goodSeasoning
                                  ? `Average account age is ${(g as any).avgOpenAccountAgeYears}yr with ${(g as any).newAccountsLast6Months} new account(s) in 6 months — well seasoned.`
                                  : `Average age: ${(g as any).avgOpenAccountAgeYears || 0}yr, ${(g as any).newAccountsLast6Months ?? 0} new account(s) in 6mo. Avoid opening new accounts.`,
                                status: goodSeasoning ? "done" : (hasNoNegatives && goodUtil ? "current" : "pending"),
                                icon: Clock,
                              });

                              const lowInquiries = activeBureau.hardInquiries <= 2;
                              steps.push({
                                title: "Minimize Hard Inquiries",
                                detail: lowInquiries
                                  ? `Only ${activeBureau.hardInquiries} hard inquir${activeBureau.hardInquiries === 1 ? "y" : "ies"} — inquiry velocity is safe.`
                                  : `${activeBureau.hardInquiries} hard inquiries detected — stop applying for new credit.`,
                                status: lowInquiries ? "done" : (hasNoNegatives && goodUtil && goodSeasoning ? "current" : "pending"),
                                icon: Eye,
                              });

                              const goodMix = g.accountMix === "Strong Mix" || g.accountMix === "Adequate Mix";
                              steps.push({
                                title: "Build Account Mix",
                                detail: goodMix
                                  ? `Account mix is "${g.accountMix}" with ${g.openAccounts} open accounts — diverse portfolio.`
                                  : `Account mix is "${g.accountMix || "Limited"}" — consider adding different account types.`,
                                status: goodMix ? "done" : "pending",
                                icon: Building2,
                              });

                              steps.push({
                                title: "Submit Funding Application",
                                detail: g.applicationReady
                                  ? `This bureau is ready! Potential funding: $${g.exposureCeiling.toLocaleString()} based on your highest limit.`
                                  : `Not ready yet — resolve ${g.denialTriggers.length} denial trigger(s) first.`,
                                status: g.applicationReady ? "done" : "pending",
                                icon: DollarSign,
                              });

                              const waitMonths = g.velocityRisk?.mandatoryWaitingMonths || 0;
                              const daysUntilOptimal = capitalOsData.applicationWindow.daysUntilOptimal;

                              return (
                                <div className="space-y-6">
                                  <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-3">
                                      <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: g.riskTierColor + '15' }}>
                                        <Target className="w-5 h-5" style={{ color: g.riskTierColor }} />
                                      </div>
                                      <div>
                                        <p className="text-sm font-bold" style={{ color: g.riskTierColor }}>{g.riskTier.replace("_", " ")}</p>
                                        <p className="text-[10px] text-[#1a1a2e]/50">{g.fundingPhase} Phase · {g.openAccounts} accounts</p>
                                      </div>
                                    </div>
                                    <div className="text-right">
                                      <p className="text-[9px] text-[#1a1a2e]/40 uppercase">Potential Funding</p>
                                      <p className="text-lg font-bold text-[#1a1a2e] font-mono">${g.exposureCeiling.toLocaleString()}</p>
                                    </div>
                                  </div>

                                  <div data-testid="funding-steps">
                                    <p className="text-[10px] text-[#1a1a2e]/50 uppercase mb-3 font-medium">Step-by-Step to Funding Ready</p>
                                    <div className="space-y-0">
                                      {steps.map((step, i) => {
                                        const StepIcon = step.icon;
                                        return (
                                          <div key={i} className="flex gap-3" data-testid={`funding-step-${i}`}>
                                            <div className="flex flex-col items-center">
                                              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0 transition-all",
                                                step.status === "done" ? "bg-green-500 text-white" :
                                                step.status === "current" ? "bg-[#3a3a5a] text-white ring-2 ring-[#3a3a5a]/20" :
                                                "bg-[#e0e0ea] text-[#1a1a2e]/30"
                                              )}>
                                                {step.status === "done" ? <Check className="w-3.5 h-3.5" /> : <StepIcon className="w-3.5 h-3.5" />}
                                              </div>
                                              {i < steps.length - 1 && <div className={cn("w-0.5 flex-1 my-1", step.status === "done" ? "bg-green-400" : "bg-[#e0e0ea]")} />}
                                            </div>
                                            <div className={cn("flex-1 pb-4", step.status === "pending" && "opacity-50")}>
                                              <p className={cn("text-[12px] font-semibold mb-0.5", step.status === "done" ? "text-green-600" : step.status === "current" ? "text-[#1a1a2e]" : "text-[#1a1a2e]/50")}>{step.title}</p>
                                              <p className="text-[10px] text-[#1a1a2e]/60 leading-relaxed">{step.detail}</p>
                                            </div>
                                          </div>
                                        );
                                      })}
                                    </div>
                                  </div>

                                  <div className="rounded-xl bg-white/50 border border-white/30 p-4" data-testid="funding-timeline">
                                    <p className="text-[10px] text-[#1a1a2e]/50 uppercase mb-3 font-medium flex items-center gap-1.5"><Calendar className="w-3 h-3" /> Estimated Timeline</p>
                                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                      <div className="text-center p-2 rounded-lg bg-white/60">
                                        <p className="text-[8px] text-[#1a1a2e]/40 uppercase mb-1">Application Window</p>
                                        <p className={cn("text-[11px] font-bold", g.applicationReady ? "text-green-600" : "text-yellow-600")}>
                                          {g.applicationReady ? "Open Now" : daysUntilOptimal > 0 ? `~${daysUntilOptimal} days` : "Pending"}
                                        </p>
                                      </div>
                                      <div className="text-center p-2 rounded-lg bg-white/60">
                                        <p className="text-[8px] text-[#1a1a2e]/40 uppercase mb-1">Wait Period</p>
                                        <p className={cn("text-[11px] font-bold font-mono", waitMonths > 0 ? "text-red-600" : "text-green-600")}>
                                          {waitMonths > 0 ? `${waitMonths} month${waitMonths > 1 ? "s" : ""}` : "None"}
                                        </p>
                                      </div>
                                      <div className="text-center p-2 rounded-lg bg-white/60">
                                        <p className="text-[8px] text-[#1a1a2e]/40 uppercase mb-1">Avg Account Age</p>
                                        <p className={cn("text-[11px] font-bold font-mono", (g as any).avgOpenAccountAgeYears < 2 ? "text-yellow-600" : "text-green-600")}>
                                          {(g as any).avgOpenAccountAgeYears ? `${(g as any).avgOpenAccountAgeYears} yr` : "—"}
                                        </p>
                                      </div>
                                      <div className="text-center p-2 rounded-lg bg-white/60">
                                        <p className="text-[8px] text-[#1a1a2e]/40 uppercase mb-1">Velocity Tier</p>
                                        <p className={cn("text-[11px] font-bold",
                                          !g.velocityRisk || g.velocityRisk.velocityTier === "A" ? "text-green-600" :
                                          g.velocityRisk.velocityTier === "B" ? "text-yellow-600" : "text-red-600"
                                        )}>
                                          {g.velocityRisk ? `Tier ${g.velocityRisk.velocityTier}` : "Tier A"}
                                        </p>
                                      </div>
                                    </div>
                                  </div>

                                  {g.denialTriggers.length > 0 && (
                                    <div className="rounded-xl bg-red-500/[0.04] border border-red-500/10 p-4" data-testid="denial-triggers">
                                      <p className="text-[10px] text-red-600/70 uppercase mb-2 font-medium flex items-center gap-1.5"><AlertTriangle className="w-3 h-3" /> Denial Triggers — Fix These First</p>
                                      {g.denialTriggers.map((t, i) => (
                                        <p key={i} className="text-[11px] text-[#1a1a2e]/70 flex items-start gap-2 mb-1.5"><AlertTriangle className="w-3 h-3 text-red-500/60 shrink-0 mt-0.5" />{t}</p>
                                      ))}
                                    </div>
                                  )}

                                  <div className="rounded-xl bg-white/50 border border-white/30 p-4" data-testid="funding-next-steps">
                                    <p className="text-[10px] text-[#1a1a2e]/50 uppercase mb-3 font-medium flex items-center gap-1.5"><ArrowRight className="w-3 h-3" /> Next Steps for {activeBureau.bureau}</p>
                                    <div className="space-y-2">
                                      {g.actionItems.map((item, i) => (
                                        <div key={i} className="flex items-start gap-2.5 p-2.5 rounded-lg bg-white/60" data-testid={`next-step-${i}`}>
                                          <div className="w-5 h-5 rounded-full bg-[#3a3a5a]/10 flex items-center justify-center shrink-0 mt-0.5">
                                            <span className="text-[9px] font-bold text-[#3a3a5a]">{i + 1}</span>
                                          </div>
                                          <p className="text-[11px] text-[#1a1a2e]/75 leading-relaxed">{item}</p>
                                        </div>
                                      ))}
                                    </div>
                                    {g.applicationReady && (
                                      <div className="mt-3 p-3 rounded-lg bg-green-500/[0.06] border border-green-500/15 flex items-center gap-2">
                                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                                        <p className="text-[11px] text-green-700/80">This bureau is application-ready. Apply through {activeBureau.bureau} for best approval odds.</p>
                                      </div>
                                    )}
                                  </div>
                                </div>
                              );
                            })()}
                          </div>
                        </div>

                        {capitalOsData.readiness.riskDepartmentNotes && (
                          <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-6" data-testid="risk-notes">
                            <p className="text-xs text-[#1a1a2e]/70 mb-3 flex items-center gap-1.5"><Info className="w-3.5 h-3.5" /> Risk Assessment Notes</p>
                            <p className="text-[11px] text-[#1a1a2e]/70 leading-relaxed">{capitalOsData.readiness.riskDepartmentNotes}</p>
                          </div>
                        )}
                      </>
                    );
                  })()}
                </>
              ) : capitalOsLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#1a1a2e]/50" /></div>
              ) : (
                <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-8 text-center">
                  <DollarSign className="w-10 h-10 text-[#1a1a2e]/30 mx-auto mb-3" />
                  <p className="text-sm text-[#1a1a2e]/70 mb-1">No funding data available</p>
                  <p className="text-[10px] text-[#1a1a2e]/40 mb-3">Upload a credit report from Mission Control to see your funding strategy</p>
                  <button onClick={() => setActiveTab("mission_control")} className="text-xs text-[#3a3a5a] hover:underline font-medium" data-testid="link-go-upload-2">Go to Mission Control →</button>
                </div>
              )}
            </div>
          )}

          {activeTab === "creator_connect" && (
            <div className="w-full h-full flex flex-col" style={{ background: 'transparent' }}>
              <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 max-w-[900px] mx-auto w-full">
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-purple-600 to-blue-600 flex items-center justify-center">
                    <Sparkles className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-[#1a1a2e]" data-testid="text-creator-ai-title">Creator Connect</h2>
                    <p className="text-[11px] text-[#1a1a2e]/70">We connect you with the best YouTube creators for your situation</p>
                  </div>
                </div>

                <div className="bg-white/50 border border-white/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Upload className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-semibold text-[#1a1a2e]">Step 1: Upload Your Credit Report</span>
                  </div>
                  <p className="text-[11px] text-[#1a1a2e]/65 mb-3">Upload your report and our AI will analyze your situation, then search all of YouTube to find the best creators to help you.</p>
                  <div className="flex gap-2">
                    <label className="flex-1">
                      <input type="file" accept=".pdf,.txt,.csv" className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (!file) return;
                          setCreatorAiUploading(true);
                          try {
                            const fileContent = await new Promise<string>((resolve, reject) => {
                              const reader = new FileReader();
                              const isPdf = file.name.toLowerCase().endsWith(".pdf");
                              reader.onload = () => { if (isPdf) { resolve((reader.result as string).split(",")[1]); } else { resolve(reader.result as string); } };
                              reader.onerror = () => reject(new Error("Failed to read file"));
                              if (isPdf) reader.readAsDataURL(file); else reader.readAsText(file);
                            });
                            const res = await fetch("/api/analyze-document", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ fileContent, documentType: "credit_report" }) });
                            if (res.ok) { toast({ title: "Report Analyzed", description: "Now click 'Find My Creators' to get matched." }); await fetchFundingReadiness(); }
                            else { const data = await res.json(); toast({ title: "Upload Failed", description: data.error || "Could not process report.", variant: "destructive" }); }
                          } catch { toast({ title: "Upload Error", description: "Failed to upload. Try again.", variant: "destructive" }); }
                          finally { setCreatorAiUploading(false); }
                        }}
                        data-testid="creator-ai-upload-input"
                      />
                      <div className={cn("flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border border-dashed border-purple-400/30 bg-purple-500/5 cursor-pointer hover:bg-purple-500/10 transition-colors", creatorAiUploading && "opacity-50 pointer-events-none")}>
                        {creatorAiUploading ? <><Loader2 className="w-4 h-4 animate-spin text-purple-500" /><span className="text-xs text-purple-600">Analyzing your report...</span></> :
                          <><FileText className="w-4 h-4 text-purple-500" /><span className="text-xs text-purple-600">Choose Credit Report (PDF/TXT)</span></>}
                      </div>
                    </label>
                  </div>
                  {user?.hasCreditReport && (
                    <div className="mt-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5 text-green-500" />
                      <span className="text-[11px] text-green-600">Credit report on file</span>
                    </div>
                  )}
                </div>

                <div className="bg-white/50 border border-white/30 rounded-xl p-4 mb-6">
                  <div className="flex items-center gap-2 mb-2">
                    <Search className="w-4 h-4 text-purple-500" />
                    <span className="text-sm font-semibold text-[#1a1a2e]">Step 2: Find Your Best-Fit Creators</span>
                  </div>
                  <p className="text-[11px] text-[#1a1a2e]/65 mb-3">AI analyzes your credit profile, determines if you need repair or funding help, then searches YouTube for specialists.</p>
                  <button
                    onClick={async () => {
                      setCreatorMatchLoading(true); setCreatorMatchResults(null);
                      try {
                        const resp = await fetch("/api/creator-match", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include" });
                        const data = await resp.json();
                        if (!resp.ok) throw new Error(data.error || "Failed");
                        setCreatorMatchResults(data);
                      } catch (err: any) { toast({ title: "Match Error", description: err.message || "Could not find creators.", variant: "destructive" }); }
                      finally { setCreatorMatchLoading(false); }
                    }}
                    disabled={creatorMatchLoading}
                    className="w-full py-3 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-semibold disabled:opacity-50 hover:from-purple-500 hover:to-blue-500 transition-all flex items-center justify-center gap-2"
                    data-testid="creator-match-btn"
                  >
                    {creatorMatchLoading ? <><Loader2 className="w-4 h-4 animate-spin" /> Searching all of YouTube...</> : <><Sparkles className="w-4 h-4" /> Find My Creators</>}
                  </button>
                </div>

                {creatorMatchResults && (
                  <div className="space-y-4 mb-6">
                    <div className={cn("rounded-xl p-4 border", creatorMatchResults.mode === "repair" ? "bg-orange-50/80 border-orange-200/50" : "bg-emerald-50/80 border-emerald-200/50")}>
                      <div className="flex items-center gap-2 mb-2">
                        {creatorMatchResults.mode === "repair" ? <AlertTriangle className="w-4 h-4 text-orange-500" /> : <TrendingUp className="w-4 h-4 text-emerald-500" />}
                        <span className={cn("text-sm font-bold", creatorMatchResults.mode === "repair" ? "text-orange-700" : "text-emerald-700")}>
                          {creatorMatchResults.mode === "repair" ? "Credit Repair Mode" : "Funding Ready Mode"}
                        </span>
                      </div>
                      <p className="text-[12px] leading-relaxed text-[#1a1a2e]/80">{creatorMatchResults.summary}</p>
                    </div>
                    <div className="flex items-center gap-2 mb-1">
                      <Play className="w-4 h-4 text-red-500" />
                      <h3 className="text-sm font-bold text-[#1a1a2e]">Your Best-Fit YouTube Creators</h3>
                      <span className="text-[10px] text-[#1a1a2e]/50 ml-auto">{(creatorMatchResults.creators || []).length} found</span>
                    </div>
                    {(!creatorMatchResults.creators || creatorMatchResults.creators.length === 0) ? (
                      <div className="bg-white/50 border border-white/30 rounded-xl p-6 text-center">
                        <p className="text-sm text-[#1a1a2e]/70">No creators found. Try uploading your credit report first.</p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {creatorMatchResults.creators.map((creator: any, idx: number) => {
                          const categoryColors: Record<string, string> = { credit_repair: "from-orange-400 to-red-400", business_funding: "from-green-400 to-emerald-500", business_credit: "from-blue-400 to-indigo-500", financial_literacy: "from-purple-400 to-violet-500", entrepreneurship: "from-amber-400 to-orange-500", credit_building: "from-teal-400 to-cyan-500", investing: "from-pink-400 to-rose-500" };
                          const gradient = categoryColors[creator.category] || "from-purple-400 to-blue-400";
                          const handle = creator.handle?.replace(/^@/, "") || "";
                          const avatarSrc = getCreatorAvatarUrl(creator.handle || "");
                          return (
                            <div key={idx} className="bg-white/70 backdrop-blur-sm border border-white/40 rounded-2xl overflow-hidden hover:shadow-lg transition-all" data-testid={`creator-card-${idx}`}>
                              <div className="flex items-center gap-3 p-4 border-b border-white/30 bg-white/40">
                                {avatarSrc ? (
                                  <img src={avatarSrc} alt={creator.channelName} className="w-12 h-12 rounded-full object-cover shadow-md border-2 border-white"
                                    onError={() => setCreatorAvatarErrors(prev => new Set(prev).add(handle))} data-testid={`img-avatar-${idx}`} />
                                ) : (
                                  <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-base shrink-0 shadow-md border-2 border-white`}>{(creator.channelName || "?")[0]}</div>
                                )}
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-sm font-bold text-[#1a1a2e] truncate">{creator.channelName}</h4>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {creator.handle && <span className="text-[11px] text-purple-500 font-medium">{creator.handle}</span>}
                                    {creator.subscriberEstimate && <span className="text-[10px] text-[#1a1a2e]/40">{creator.subscriberEstimate} subs</span>}
                                  </div>
                                  <p className="text-[10px] text-[#1a1a2e]/50 mt-0.5">{creator.specialty}</p>
                                </div>
                                <a href={creator.channelUrl} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500 text-white text-[11px] font-medium hover:bg-red-600 transition-colors shrink-0" data-testid={`creator-yt-link-${idx}`}>
                                  <Play className="w-3 h-3" /> Channel
                                </a>
                              </div>

                              {creator.creatorMessage && (
                                <div className="px-4 pt-3 pb-2">
                                  <div className="flex items-start gap-3">
                                    {avatarSrc ? (
                                      <img src={avatarSrc} alt="" className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5 shadow-sm"
                                        onError={() => setCreatorAvatarErrors(prev => new Set(prev).add(handle))} />
                                    ) : (
                                      <div className={`w-8 h-8 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-xs shrink-0 mt-0.5 shadow-sm`}>{(creator.channelName || "?")[0]}</div>
                                    )}
                                    <div className="flex-1 bg-[#f0f0f8] rounded-2xl rounded-tl-sm px-4 py-3 relative">
                                      <p className="text-[12px] text-[#1a1a2e]/85 leading-relaxed italic">"{creator.creatorMessage}"</p>
                                      <p className="text-[9px] text-[#1a1a2e]/40 mt-1 text-right">— {creator.channelName}</p>
                                    </div>
                                  </div>
                                </div>
                              )}

                              {creator.matchReason && (
                                <div className="px-4 py-2">
                                  <p className="text-[10px] text-purple-600/80 flex items-start gap-1.5 bg-purple-500/5 rounded-lg px-3 py-2">
                                    <Sparkles className="w-3 h-3 shrink-0 mt-0.5" /><span>{creator.matchReason}</span>
                                  </p>
                                </div>
                              )}

                              {creator.videoLinks && creator.videoLinks.length > 0 && (
                                <div className="px-4 pb-3 pt-1">
                                  <p className="text-[10px] font-semibold text-[#1a1a2e]/50 uppercase tracking-wider mb-1.5">Recommended Videos</p>
                                  <div className="space-y-1">
                                    {creator.videoLinks.map((v: any, vi: number) => (
                                      <a key={vi} href={v.url} target="_blank" rel="noopener noreferrer"
                                        className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/5 border border-red-200/30 hover:bg-red-500/10 transition-colors group" data-testid={`creator-video-${idx}-${vi}`}>
                                        <Play className="w-3.5 h-3.5 text-red-500 shrink-0" />
                                        <span className="text-[11px] text-[#1a1a2e]/70 group-hover:text-red-600 truncate">{v.label}</span>
                                        <ExternalLink className="w-3 h-3 text-[#1a1a2e]/30 ml-auto shrink-0" />
                                      </a>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {creatorMatchResults && (
                  <button onClick={() => setCreatorMatchResults(null)} className="mt-2 mb-4 text-[11px] text-purple-500 hover:text-purple-700 underline transition-colors" data-testid="creator-match-back">Back to Q&A</button>
                )}

                {!creatorMatchResults && !creatorMatchLoading && (
                  <>
                    <div className="border-t border-white/20 pt-5 mb-4">
                      <div className="flex items-center gap-2 mb-3">
                        <MessageCircle className="w-4 h-4 text-purple-500" />
                        <span className="text-sm font-semibold text-[#1a1a2e]">Ask Creator-Informed Questions</span>
                      </div>
                      <p className="text-[11px] text-[#1a1a2e]/60 mb-3">Ask any financial question — AI draws from 75+ top YouTube creators' frameworks.</p>
                    </div>
                    <div className="space-y-4 mb-4">
                      {creatorAiMessages.length === 0 && (
                        <div className="flex flex-col items-center justify-center py-8 text-center">
                          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-purple-500/15 to-blue-500/15 flex items-center justify-center mb-3 border border-purple-400/15">
                            <Sparkles className="w-6 h-6 text-purple-400/60" />
                          </div>
                          <p className="text-sm text-[#1a1a2e]/80 mb-1">Ask any financial question</p>
                          <p className="text-[11px] text-[#1a1a2e]/55 max-w-sm leading-relaxed">AI aggregates perspectives from Graham Stephan, Dave Ramsey, Alex Hormozi, Credit Shifu and 70+ more creators.</p>
                          <div className="flex flex-wrap justify-center gap-2 mt-3">
                            {["How should I improve my credit score?", "What's the best way to build business credit?", "How do I prepare for funding?", "What would top creators say about my report?"].map((q) => (
                              <button key={q} onClick={() => setCreatorAiInput(q)}
                                className="px-3 py-1.5 rounded-full bg-white/60 border border-white/30 text-[10px] text-[#1a1a2e]/70 hover:bg-purple-500/10 hover:border-purple-400/20 hover:text-purple-600 transition-all"
                                data-testid={`creator-ai-suggestion-${q.slice(0,20)}`}>{q}</button>
                            ))}
                          </div>
                        </div>
                      )}
                      {creatorAiMessages.map((msg, idx) => {
                        const renderWithLinks = (text: string) => {
                          const parts = text.split(/(\[[^\]]+\]\([^)]+\))/g);
                          return parts.map((part, i) => {
                            const linkMatch = part.match(/\[([^\]]+)\]\(([^)]+)\)/);
                            if (linkMatch) {
                              return (
                                <a key={i} href={linkMatch[2]} target="_blank" rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-red-500 hover:text-red-600 underline underline-offset-2 font-medium"
                                  data-testid={`link-video-${idx}-${i}`}>
                                  <Play className="w-3 h-3 inline shrink-0" />{linkMatch[1]}
                                </a>
                              );
                            }
                            return <span key={i}>{part}</span>;
                          });
                        };
                        return (
                          <div key={idx} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                            <div className={cn("max-w-[85%] rounded-xl px-4 py-3", msg.role === "user" ? "bg-purple-600/15 border border-purple-400/20 text-[#1a1a2e]" : "bg-white/60 border border-white/30 text-[#1a1a2e]")}>
                              {msg.role === "assistant" && <div className="flex items-center gap-1.5 mb-2 text-[10px] text-purple-500/60"><Sparkles className="w-3 h-3" />Creator-Informed Insight</div>}
                              <div className="text-[13px] leading-relaxed whitespace-pre-wrap" data-testid={`creator-ai-msg-${idx}`}>{msg.role === "assistant" ? renderWithLinks(msg.content) : msg.content}</div>
                            </div>
                          </div>
                        );
                      })}
                      {creatorAiLoading && (
                        <div className="flex justify-start">
                          <div className="bg-white/60 border border-white/30 rounded-xl px-4 py-3 flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin text-purple-500" />
                            <span className="text-xs text-[#1a1a2e]/70">Aggregating creator insights...</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </>
                )}
              </div>

              {!creatorMatchResults && (
                <div className="px-5 sm:px-8 py-4 border-t border-white/30 max-w-[900px] mx-auto w-full">
                  <div className="flex gap-2">
                    <input value={creatorAiInput} onChange={(e) => setCreatorAiInput(e.target.value)}
                      onKeyDown={async (e) => {
                        if (e.key === "Enter" && creatorAiInput.trim() && !creatorAiLoading) {
                          const question = creatorAiInput.trim();
                          setCreatorAiMessages(prev => [...prev, { role: "user", content: question }]);
                          setCreatorAiInput(""); setCreatorAiLoading(true);
                          try {
                            const resp = await fetch("/api/creator-insight", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ question }) });
                            const data = await resp.json();
                            if (!resp.ok) throw new Error(data.error || "Failed");
                            setCreatorAiMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
                          } catch (err: any) { setCreatorAiMessages(prev => [...prev, { role: "assistant", content: "Error: " + (err.message || "Could not get insight.") }]); }
                          finally { setCreatorAiLoading(false); }
                        }
                      }}
                      placeholder="Ask any financial question..."
                      className="flex-1 bg-white/60 border border-white/30 rounded-xl px-4 py-3 text-sm text-[#1a1a2e] placeholder:text-[#8a8aa5]/50 focus:outline-none focus:border-purple-400/40 transition-colors"
                      disabled={creatorAiLoading} data-testid="creator-ai-input"
                    />
                    <button
                      onClick={async () => {
                        if (!creatorAiInput.trim() || creatorAiLoading) return;
                        const question = creatorAiInput.trim();
                        setCreatorAiMessages(prev => [...prev, { role: "user", content: question }]);
                        setCreatorAiInput(""); setCreatorAiLoading(true);
                        try {
                          const resp = await fetch("/api/creator-insight", { method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include", body: JSON.stringify({ question }) });
                          const data = await resp.json();
                          if (!resp.ok) throw new Error(data.error || "Failed");
                          setCreatorAiMessages(prev => [...prev, { role: "assistant", content: data.answer }]);
                        } catch (err: any) { setCreatorAiMessages(prev => [...prev, { role: "assistant", content: "Error: " + (err.message || "Could not get insight.") }]); }
                        finally { setCreatorAiLoading(false); }
                      }}
                      disabled={!creatorAiInput.trim() || creatorAiLoading}
                      className="px-5 rounded-xl bg-gradient-to-r from-purple-600 to-blue-600 text-white text-sm font-medium disabled:opacity-30 hover:from-purple-500 hover:to-blue-500 transition-all flex items-center gap-1.5"
                      data-testid="creator-ai-send"
                    >
                      {creatorAiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "messages" && (
            <div className="w-full h-full flex flex-col" style={{ background: 'transparent' }}>
              {!dmFriendId ? (
                <div className="flex-1 overflow-y-auto px-5 sm:px-8 py-6 max-w-[600px] mx-auto w-full">
                  <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                        <Users className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <h2 className="text-lg font-bold text-[#1a1a2e]" data-testid="text-messages-title">Team Messages</h2>
                        <p className="text-[11px] text-[#1a1a2e]/75">{friendsList.length} team member{friendsList.length !== 1 ? "s" : ""}</p>
                      </div>
                    </div>
                    <button onClick={() => setShowAddFriend(true)} className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-[#3a3a5a] text-white text-[11px] font-medium hover:bg-[#2a2a4a] transition-colors" data-testid="button-add-team-member">
                      <UserPlus className="w-3.5 h-3.5" /> Add Member
                    </button>
                  </div>

                  {pendingRequests.length > 0 && (
                    <div className="rounded-xl bg-yellow-500/[0.06] border border-yellow-500/15 p-4 mb-4" data-testid="pending-requests">
                      <p className="text-[10px] text-yellow-700/70 uppercase tracking-wider mb-3 font-medium">Pending Requests · {pendingRequests.length}</p>
                      <div className="space-y-2">
                        {pendingRequests.map((req: any) => (
                          <div key={req.friendshipId} className="flex items-center gap-3 p-2.5 rounded-lg bg-white/60">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-yellow-400/30 to-orange-400/30 border border-yellow-500/20 flex items-center justify-center text-[10px] font-bold text-[#1a1a2e]/70">
                              {(req.displayName || req.email || "?").substring(0, 2).toUpperCase()}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-[12px] font-medium text-[#1a1a2e]/90 truncate">{req.displayName || req.email}</p>
                              <p className="text-[9px] text-[#1a1a2e]/50">Wants to join your team</p>
                            </div>
                            <div className="flex gap-1.5">
                              <button onClick={() => acceptFriend(req.friendshipId)} className="px-2.5 py-1.5 rounded-lg bg-green-500/15 text-green-600 text-[10px] font-medium hover:bg-green-500/25 transition-colors" data-testid={`button-accept-${req.friendshipId}`}>Accept</button>
                              <button onClick={() => rejectFriend(req.friendshipId)} className="px-2.5 py-1.5 rounded-lg bg-red-500/10 text-red-500/70 text-[10px] font-medium hover:bg-red-500/20 transition-colors" data-testid={`button-reject-${req.friendshipId}`}>Decline</button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {friendsList.length === 0 ? (
                    <div className="text-center py-16">
                      <Users className="w-12 h-12 text-[#1a1a2e]/15 mx-auto mb-4" />
                      <p className="text-sm font-medium text-[#1a1a2e]/70 mb-1">No team members yet</p>
                      <p className="text-[11px] text-[#1a1a2e]/50 mb-5 max-w-[260px] mx-auto leading-relaxed">Add team members to start direct messaging. Collaborate and share insights together.</p>
                      <button onClick={() => setShowAddFriend(true)} className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[#3a3a5a] text-white text-sm font-medium hover:bg-[#2a2a4a] transition-colors" data-testid="button-add-first-member">
                        <UserPlus className="w-4 h-4" /> Add Your First Team Member
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      {friendsList.map((f: any) => (
                        <button key={f.id} onClick={() => openDm(f.id, f.displayName || f.email)}
                          className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/50 border border-white/30 hover:bg-white/70 hover:shadow-sm transition-all text-left group" data-testid={`dm-friend-${f.id}`}>
                          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500/25 to-cyan-500/25 border border-blue-500/15 flex items-center justify-center text-sm font-bold text-[#1a1a2e]/75">
                            {(f.displayName || f.email || "?").substring(0, 2).toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-[#1a1a2e]/95 truncate">{f.displayName || f.email}</p>
                            <p className="text-[10px] text-[#1a1a2e]/45">Team Member</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-[#1a1a2e]/30 group-hover:text-[#1a1a2e]/60 transition-colors">Message</span>
                            <ChevronRight className="w-4 h-4 text-[#1a1a2e]/30 group-hover:text-[#1a1a2e]/60 transition-colors" />
                          </div>
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
                      <p className="text-[9px] text-[#1a1a2e]/55">Direct Message</p>
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
                        <p className="text-[10px] text-[#1a1a2e]/45">Send a direct message to {dmFriendName}</p>
                      </div>
                    )}
                    {dmMessages.map((msg: any) => {
                      const isMe = msg.senderId === user.id;
                      return (
                        <div key={msg.id} className={cn("flex gap-2.5", isMe ? "justify-end" : "justify-start")} data-testid={`dm-msg-${msg.id}`}>
                          {!isMe && (
                            <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mt-0.5 bg-white/60 border border-white/30">
                              <span className="text-[9px] font-bold text-[#1a1a2e]/65">{dmFriendName.substring(0, 2).toUpperCase()}</span>
                            </div>
                          )}
                          <div className={cn("max-w-[80%] rounded-2xl px-4 py-3",
                            isMe ? "bg-white/60 border border-white/30" :
                            "bg-white/50 border border-white/30"
                          )}>
                            {!isMe && <p className="text-[9px] text-[#1a1a2e]/60 font-medium mb-1">{dmFriendName}</p>}
                            <p className="text-[12px] text-[#1a1a2e]/90 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            <p className="text-[9px] text-[#1a1a2e]/45 mt-1.5">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                          </div>
                        </div>
                      );
                    })}
                    {dmLoading && (
                      <div className="flex gap-2.5 justify-end">
                        <div className="rounded-2xl px-4 py-3 bg-white/50 border border-white/30">
                          <div className="flex items-center gap-2">
                            <Loader2 className="w-3.5 h-3.5 animate-spin text-[#1a1a2e]/60" />
                            <span className="text-[11px] text-[#1a1a2e]/60">Sending...</span>
                          </div>
                        </div>
                      </div>
                    )}
                    <div ref={dmEndRef} />
                  </div>

                  <div className="shrink-0 px-4 pb-4 pt-2 border-t border-white/30 bg-white/90 backdrop-blur-md">
                    <div className="flex gap-2">
                      <textarea data-testid="input-dm" value={dmInput} onChange={(e) => setDmInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendDm(); } }}
                        placeholder={`Message ${dmFriendName}...`}
                        className="flex-1 bg-white/50 border border-white/30 rounded-xl px-3.5 py-2.5 text-sm text-[#1a1a2e]/95 placeholder:text-[#8a8aa5]/50 resize-none focus:outline-none focus:border-[#c0c0d0] transition-colors"
                        rows={1} />
                      <button data-testid="button-send-dm" onClick={sendDm} disabled={!dmInput.trim() || dmLoading}
                        className="w-10 h-10 rounded-xl bg-[#3a3a5a] text-white hover:bg-[#2a2a4a] disabled:opacity-30 flex items-center justify-center transition-colors shrink-0" title="Send message">
                        {dmLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}


        </div>
      </main>

      {buddyOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setBuddyOpen(false)} />}

      {buddyOpen && (
        <aside className={cn(
          "w-[280px] flex flex-col shrink-0 relative z-40",
          "fixed right-0 h-full lg:static lg:flex"
        )} style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)' }}>
          <div className="h-12 px-4 flex items-center justify-between border-b border-white/30 bg-white/50">
            <span className="text-[11px] font-bold text-[#1a1a2e]/70 uppercase tracking-widest">Team Members</span>
            <button onClick={() => setBuddyOpen(false)} className="lg:hidden text-[#1a1a2e]/60 hover:text-[#1a1a2e]">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="shrink-0 px-3 py-2.5 border-b border-white/30">
            <button onClick={() => { setShowAddFriend(true); setBuddyOpen(false); }}
              className="w-full h-8 flex items-center justify-center gap-2 rounded-lg bg-[#3a3a5a] text-white text-[11px] font-medium hover:bg-[#2a2a4a] transition-colors" data-testid="button-add-friend">
              <UserPlus className="w-3.5 h-3.5" />
              <span>Add Team Member</span>
            </button>
          </div>

          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            {pendingRequests.length > 0 && (
              <div className="border-b border-white/30">
                <div className="px-4 py-2">
                  <span className="text-[10px] text-amber-500/70 font-medium uppercase tracking-wider">{pendingRequests.length} Pending Invite{pendingRequests.length > 1 ? "s" : ""}</span>
                </div>
                {pendingRequests.map((req: any) => (
                  <div key={req.friendshipId} className="h-12 flex items-center gap-3 px-4 hover:bg-white/50 transition-colors">
                    <div className="w-8 h-8 rounded-lg bg-amber-500/15 border border-amber-500/20 flex items-center justify-center text-[9px] font-bold text-amber-500/70">
                      {(req.displayName || "?").substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-[#1a1a2e]/80 truncate font-medium">{req.displayName}</p>
                      <p className="text-[9px] text-[#1a1a2e]/45">Wants to join</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => acceptFriend(req.friendshipId)} className="w-7 h-7 rounded-md bg-green-500/15 hover:bg-green-500/25 flex items-center justify-center" data-testid={`accept-friend-${req.friendshipId}`}>
                        <Check className="w-3.5 h-3.5 text-green-500" />
                      </button>
                      <button onClick={() => rejectFriend(req.friendshipId)} className="w-7 h-7 rounded-md bg-red-500/10 hover:bg-red-500/20 flex items-center justify-center" data-testid={`reject-friend-${req.friendshipId}`}>
                        <X className="w-3.5 h-3.5 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            <div className="px-4 py-2 border-b border-white/30">
              <span className="text-[10px] text-[#1a1a2e]/45 font-medium uppercase tracking-wider">Members · {friendsList.length}</span>
            </div>

            {friendsList.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                <Users className="w-10 h-10 text-[#1a1a2e]/10 mb-3" />
                <p className="text-[11px] text-[#1a1a2e]/50 mb-1">No team members yet</p>
                <p className="text-[9px] text-[#1a1a2e]/35 leading-relaxed">Add team members to collaborate and message directly.</p>
              </div>
            ) : (
              friendsList.map((f: any) => (
                <div key={f.friendshipId} className="group h-12 flex items-center gap-3 px-4 hover:bg-white/50 transition-colors cursor-pointer"
                  onClick={() => { openDm(f.id, f.displayName || f.email); setBuddyOpen(false); }}>
                  <div className="relative shrink-0">
                    <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500/15 to-cyan-500/15 border border-blue-500/10 flex items-center justify-center text-[9px] font-bold text-[#1a1a2e]/75">
                      {(f.displayName || "?").substring(0, 2).toUpperCase()}
                    </div>
                    <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-white/40" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] text-[#1a1a2e]/85 truncate font-medium">{f.displayName}</p>
                    <p className="text-[9px] text-[#1a1a2e]/40">Team Member</p>
                  </div>
                  <MessageSquare className="w-3.5 h-3.5 text-[#1a1a2e]/15 group-hover:text-[#1a1a2e]/50 transition-colors shrink-0" />
                  <button onClick={(e) => { e.stopPropagation(); removeFriend(f.friendshipId); }} className="hidden group-hover:flex w-5 h-5 rounded-md bg-red-500/10 hover:bg-red-500/20 items-center justify-center" data-testid={`remove-friend-${f.id}`}>
                    <UserX className="w-3 h-3 text-red-400/60" />
                  </button>
                </div>
              ))
            )}
          </div>

          <div className="h-11 px-4 flex items-center gap-3 border-t border-white/30 bg-white/50">
            <div className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
            <span className="text-[10px] text-[#1a1a2e]/65 flex-1 truncate">{user.displayName || user.email}</span>
          </div>
        </aside>
      )}

      {showAddFriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-none" onClick={() => setShowAddFriend(false)}>
          <div className="w-[340px] bg-white/95 backdrop-blur-md border border-white/30 rounded-2xl p-5 shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <p className="text-sm font-semibold text-[#1a1a2e]/95">Add Team Member</p>
              <button onClick={() => setShowAddFriend(false)} className="text-[#1a1a2e]/60 hover:text-[#1a1a2e]/80">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#1a1a2e]/55" />
              <input data-testid="input-friend-search" type="text" value={friendSearch}
                onChange={e => { setFriendSearch(e.target.value); searchFriends(e.target.value); }}
                placeholder="Search by name..."
                className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/60 border border-white/30 text-sm text-[#1a1a2e]/95 placeholder-white/50 outline-none focus:border-[#c0c0d0]" />
            </div>
            {friendSearchLoading && <p className="text-[10px] text-[#1a1a2e]/60 text-center py-2">Searching...</p>}
            <div className="space-y-1 max-h-48 overflow-y-auto">
              {friendSearchResults.map((u: any) => (
                <div key={u.id} className="flex items-center gap-3 p-2 rounded-xl hover:bg-white/50 transition-colors">
                  <div className="w-8 h-8 rounded-lg bg-white/60 border border-white/30 flex items-center justify-center text-[10px] font-bold text-[#1a1a2e]/70">
                    {(u.displayName || u.email || "?").substring(0, 2).toUpperCase()}
                  </div>
                  <p className="text-sm text-[#1a1a2e]/80 flex-1 truncate">{u.displayName || u.email}</p>
                  <button onClick={() => sendFriendRequest(u.id)} className="h-7 px-3 rounded-lg bg-[#3a3a5a] hover:bg-[#2a2a4a] text-[10px] text-white font-medium transition-colors" data-testid={`add-friend-${u.id}`}>Invite</button>
                </div>
              ))}
              {friendSearch.length >= 2 && !friendSearchLoading && friendSearchResults.length === 0 && (
                <p className="text-[10px] text-[#1a1a2e]/55 text-center py-3">No users found</p>
              )}
            </div>
          </div>
        </div>
      )}
      {showWelcome && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100] flex items-center justify-center p-4" onClick={() => { setShowWelcome(false); localStorage.setItem("profundr_welcome_seen", "1"); }}>
          <div className="w-full max-w-lg rounded-2xl bg-white/95 backdrop-blur-xl border border-white/40 shadow-2xl overflow-hidden" onClick={e => e.stopPropagation()} data-testid="welcome-modal">
            <div className="relative px-8 pt-8 pb-4">
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-[#1a1a2e] via-[#4a4a6a] to-[#8a8aa5]" />
              <div className="flex items-center gap-3 mb-4">
                <ProfundrLogo size="lg" />
              </div>
              <p className="text-[11px] text-[#1a1a2e]/50 -mt-2 mb-2">Digital Underwriting Engine</p>
              <p className="text-[13px] text-[#1a1a2e]/70 leading-relaxed mb-2">
                Profundr helps you figure out how ready you are to get approved for funding — before you actually apply. Think of it like a practice test for getting a loan or credit card.
              </p>
              <p className="text-[13px] text-[#1a1a2e]/70 leading-relaxed mb-5">
                This matters because every time you apply and get denied, it hurts your chances next time. Profundr looks at 8 different parts of your credit — the same things real lenders check — so you know exactly what to fix first and when you're truly ready to apply with confidence.
              </p>
            </div>

            <div className="px-8 pb-4 space-y-3">
              <p className="text-[11px] font-semibold text-[#1a1a2e]/60 uppercase tracking-wider">How to get started</p>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#f8f8fc] border border-[#e8e8f0]">
                <div className="w-7 h-7 rounded-lg bg-[#1a1a2e]/5 flex items-center justify-center shrink-0 mt-0.5">
                  <Upload className="w-3.5 h-3.5 text-[#1a1a2e]/60" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-[#1a1a2e]/80">1. Upload Your Credit Reports</p>
                  <p className="text-[11px] text-[#1a1a2e]/50 leading-relaxed">Head to Mission Control and upload a credit report for each bureau — Experian, Equifax, and TransUnion. You can get free reports at annualcreditreport.com. PDF files work best.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#f8f8fc] border border-[#e8e8f0]">
                <div className="w-7 h-7 rounded-lg bg-[#1a1a2e]/5 flex items-center justify-center shrink-0 mt-0.5">
                  <BarChart3 className="w-3.5 h-3.5 text-[#1a1a2e]/60" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-[#1a1a2e]/80">2. See Where You Stand</p>
                  <p className="text-[11px] text-[#1a1a2e]/50 leading-relaxed">Once uploaded, each bureau gets its own results — your funding readiness level, how much funding you could expect, what could cause a denial, and what to work on next.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#f8f8fc] border border-[#e8e8f0]">
                <div className="w-7 h-7 rounded-lg bg-[#1a1a2e]/5 flex items-center justify-center shrink-0 mt-0.5">
                  <FileText className="w-3.5 h-3.5 text-[#1a1a2e]/60" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-[#1a1a2e]/80">3. Fix Any Issues</p>
                  <p className="text-[11px] text-[#1a1a2e]/50 leading-relaxed">If there are errors or negative items on your report, the Repair Engine creates dispute letters you can send to the bureaus.</p>
                </div>
              </div>

              <div className="flex items-start gap-3 p-3 rounded-xl bg-[#f8f8fc] border border-[#e8e8f0]">
                <div className="w-7 h-7 rounded-lg bg-[#1a1a2e]/5 flex items-center justify-center shrink-0 mt-0.5">
                  <Target className="w-3.5 h-3.5 text-[#1a1a2e]/60" />
                </div>
                <div>
                  <p className="text-[12px] font-semibold text-[#1a1a2e]/80">4. Apply When You're Ready</p>
                  <p className="text-[11px] text-[#1a1a2e]/50 leading-relaxed">Profundr tells you when your profile is strong enough to apply. No guessing — you'll know the right time to move forward so you don't waste applications or hurt your credit.</p>
                </div>
              </div>
            </div>

            <div className="px-8 pb-8 pt-4">
              <button
                onClick={() => { setShowWelcome(false); localStorage.setItem("profundr_welcome_seen", "1"); }}
                className="w-full h-11 rounded-xl bg-gradient-to-r from-[#1a1a2e] to-[#3a3a5a] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
                data-testid="button-dismiss-welcome"
              >
                Let's Go
              </button>
              <p className="text-[10px] text-[#1a1a2e]/30 text-center mt-3">Need help? Use the AI chat for personalized guidance</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
