import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/store";
import { useLocation } from "wouter";
import { Send, Plus, Paperclip, Loader2, ArrowDown, FileText, X, Menu, MessageCircle, RefreshCw, TrendingUp, UserPlus, Check, UserX, Search, AlertTriangle, Shield, ChevronRight, Target, BarChart3, BookOpen, CheckCircle2, AlertCircle, Info, Zap, Activity, Upload, Sparkles, Eye, Lock, Cpu, ChevronDown, Radio, Play, ExternalLink, Clock, Filter, ChevronUp, Volume2, VolumeX, Heart, MessageSquare, Share2, ThumbsUp, Users, DollarSign, Building2, Gauge, Calendar, ArrowRight, Copy, ChevronLeft } from "lucide-react";
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
    total: number;
    categories: { name: string; weight: number; score: number; maxScore: number; weightedScore: number; tooltip: string }[];
    grade: string;
    gradeColor: string;
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
    bureaus: { bureau: string; utilization: number; hardInquiries: number; derogatoryCount: number; oldestAccountAge: number; riskStatus: string; riskColor: string; priority: boolean; recommendation: string }[];
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

type TabKey = "mission_control" | "repair_engine" | "funding_strategy" | "creator_connect" | "messages" | "progress_tracker";

const NAV_ITEMS: { key: TabKey; label: string; icon: any }[] = [
  { key: "mission_control", label: "Mission Control", icon: Target },
  { key: "repair_engine", label: "Repair Engine", icon: Shield },
  { key: "funding_strategy", label: "Funding Strategy", icon: DollarSign },
  { key: "creator_connect", label: "Creator Connect", icon: Sparkles },
  { key: "messages", label: "Messages", icon: MessageSquare },
  { key: "progress_tracker", label: "Progress Tracker", icon: Activity },
];

export default function DashboardPage() {
  const { user, messages, sendMessage, clearChat, logout, isLoading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const [attachedFile, setAttachedFile] = useState<File | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [buddyOpen, setBuddyOpen] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  const [mentorCleared, setMentorCleared] = useState(false);
  const [buddyGroups, setBuddyGroups] = useState<Record<string, boolean>>({
    mentors: true,
    friends: true,
    offline: false,
  });
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  const [activeTab, setActiveTab] = useState<TabKey>("mission_control");
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
  const [expandedLetters, setExpandedLetters] = useState<Set<string>>(new Set());
  const [copiedLetter, setCopiedLetter] = useState<string | null>(null);
  const [expandedDenials, setExpandedDenials] = useState<Set<number>>(new Set());
  const [activeRepairRound, setActiveRepairRound] = useState(1);
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

  const [dmFriendId, setDmFriendId] = useState<number | null>(null);
  const [dmFriendName, setDmFriendName] = useState("");
  const [dmMessages, setDmMessages] = useState<any[]>([]);
  const [dmInput, setDmInput] = useState("");
  const [dmLoading, setDmLoading] = useState(false);
  const [dmAiLoading, setDmAiLoading] = useState(false);
  const dmEndRef = useRef<HTMLDivElement>(null);

  const [capitalOsData, setCapitalOsData] = useState<CapitalOsDashboard | null>(null);
  const [capitalOsLoading, setCapitalOsLoading] = useState(false);

  const [bankRatingForm, setBankRatingForm] = useState({ avgMonthlyDeposits: 10000, relationshipYears: 2, targetInstitution: "" });
  const [bankRatingResult, setBankRatingResult] = useState<any>(null);
  const [bankRatingLoading, setBankRatingLoading] = useState(false);
  const [pledgeLoanForm, setPledgeLoanForm] = useState({ loanAmount: 5000, paydownPercent: 50 });
  const [pledgeLoanResult, setPledgeLoanResult] = useState<any>(null);
  const [pledgeLoanLoading, setPledgeLoanLoading] = useState(false);
  const [capitalStackAmount, setCapitalStackAmount] = useState(50000);
  const [capitalStackResult, setCapitalStackResult] = useState<any>(null);
  const [capitalStackLoading, setCapitalStackLoading] = useState(false);

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
    setActiveTab("messages");
  };

  useEffect(() => {
    if (activeTab !== "messages" || !dmFriendId) return;
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
          } else { resolve(reader.result as string); }
        };
        reader.onerror = () => reject(new Error("Failed to read file"));
        if (isPdf) reader.readAsDataURL(file);
        else reader.readAsText(file);
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
        await fetchCapitalOsDashboard();
        if (data.repairResult) {
          setRepairData(data.repairResult);
          toast({ title: "Credit Repair Updated", description: `${data.repairResult.detectedIssues?.length || 0} issues detected. ${data.repairResult.letters?.length || 0} letters generated.` });
        } else { await fetchRepairData(); }
      } else {
        const data = await res.json();
        toast({ title: "Analysis Failed", description: data.error || "Could not analyze document.", variant: "destructive" });
      }
    } catch (err) {
      toast({ title: "Upload Error", description: "Failed to upload document. Please try again.", variant: "destructive" });
    } finally { setDocUploading(false); setDocUploadType(null); }
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

  const submitBankRating = async () => {
    setBankRatingLoading(true);
    try {
      const res = await fetch("/api/capital-os/bank-rating", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(bankRatingForm),
      });
      if (res.ok) setBankRatingResult(await res.json());
      else toast({ title: "Error", description: "Failed to simulate bank rating.", variant: "destructive" });
    } catch { toast({ title: "Error", description: "Failed to simulate bank rating.", variant: "destructive" }); }
    finally { setBankRatingLoading(false); }
  };

  const submitPledgeLoan = async () => {
    setPledgeLoanLoading(true);
    try {
      const res = await fetch("/api/capital-os/pledge-loan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(pledgeLoanForm),
      });
      if (res.ok) setPledgeLoanResult(await res.json());
      else toast({ title: "Error", description: "Failed to simulate pledge loan.", variant: "destructive" });
    } catch { toast({ title: "Error", description: "Failed to simulate pledge loan.", variant: "destructive" }); }
    finally { setPledgeLoanLoading(false); }
  };

  const submitCapitalStack = async () => {
    setCapitalStackLoading(true);
    try {
      const res = await fetch("/api/capital-os/capital-stack", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ targetAmount: capitalStackAmount }),
      });
      if (res.ok) setCapitalStackResult(await res.json());
      else toast({ title: "Error", description: "Failed to simulate capital stack.", variant: "destructive" });
    } catch { toast({ title: "Error", description: "Failed to simulate capital stack.", variant: "destructive" }); }
    finally { setCapitalStackLoading(false); }
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

  const lastMentorMsg = [...messages].reverse().find(m => m.role === 'assistant' && m.mentor);
  const activeMentorKey = selectedMentor !== null ? selectedMentor : (mentorCleared ? null : (lastMentorMsg?.mentor || null));
  const activeMentor = activeMentorKey ? MENTOR_INFO[activeMentorKey] : null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

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
    setActiveTab("messages");
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
            <div>
              <span className="text-[13px] font-bold text-[#1a1a2e] tracking-tight">Capital OS</span>
              <p className="text-[9px] text-[#1a1a2e]/50 tracking-wide">baalio Infrastructure</p>
            </div>
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
              data-testid="button-new-chat-header"
              onClick={() => { clearChat(); setSelectedMentor(null); setMentorCleared(true); setActiveTab("messages"); }}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/60 transition-colors"
              title="New Chat"
            >
              <Plus className="w-4 h-4 text-[#1a1a2e]/60" />
            </button>
            <button
              data-testid="button-toggle-buddy"
              onClick={() => setBuddyOpen(!buddyOpen)}
              className={cn("w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/60 transition-colors", buddyOpen && "bg-white/60")}
              title="Buddy List"
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
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-5" data-testid="card-readiness">
                      <p className="text-[10px] text-[#1a1a2e]/60 uppercase tracking-wider mb-3">Capital Readiness</p>
                      <div className="flex items-center gap-4">
                        <div className="relative">
                          <DonutChart value={capitalOsData.readiness.total} max={100} size={72} strokeWidth={7} color={capitalOsData.readiness.gradeColor} />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <span className="text-lg font-bold text-[#1a1a2e]" data-testid="text-readiness-score">{capitalOsData.readiness.total}</span>
                          </div>
                        </div>
                        <div>
                          <span className="text-2xl font-bold" style={{ color: capitalOsData.readiness.gradeColor }} data-testid="text-readiness-grade">{capitalOsData.readiness.grade}</span>
                          <p className="text-[10px] text-[#1a1a2e]/50 mt-0.5">of 100 points</p>
                        </div>
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-5" data-testid="card-phase">
                      <p className="text-[10px] text-[#1a1a2e]/60 uppercase tracking-wider mb-3">Funding Phase</p>
                      <p className="text-lg font-bold text-[#1a1a2e] mb-3" data-testid="text-phase-label">{capitalOsData.phase.phaseLabel}</p>
                      <div className="flex gap-1">
                        {capitalOsData.phase.phases.map((p, i) => (
                          <div key={p.key} className="flex-1 flex flex-col items-center gap-1">
                            <div className={cn(
                              "w-full h-1.5 rounded-full transition-all",
                              p.completed ? "bg-[#3a3a5a]" : p.active ? "bg-[#3a3a5a]/60" : "bg-[#e0e0ea]"
                            )} />
                            <span className={cn("text-[8px]", p.active ? "text-[#1a1a2e] font-medium" : "text-[#1a1a2e]/40")}>{p.label}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-5" data-testid="card-exposure">
                      <p className="text-[10px] text-[#1a1a2e]/60 uppercase tracking-wider mb-3">Safe Exposure</p>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-bold text-[#1a1a2e]" data-testid="text-exposure-pct">{capitalOsData.exposure.percentage}%</span>
                        <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: capitalOsData.exposure.zoneColor + '20', color: capitalOsData.exposure.zoneColor }}>{capitalOsData.exposure.zoneLabel}</span>
                      </div>
                      <div className="w-full h-2 rounded-full bg-[#e0e0ea] overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${capitalOsData.exposure.percentage}%`, backgroundColor: capitalOsData.exposure.zoneColor }} />
                      </div>
                      <p className="text-[9px] text-[#1a1a2e]/50 mt-2">${capitalOsData.exposure.safeAmount.toLocaleString()} safe capacity</p>
                    </div>

                    <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-5" data-testid="card-window">
                      <p className="text-[10px] text-[#1a1a2e]/60 uppercase tracking-wider mb-3">Application Window</p>
                      {capitalOsData.applicationWindow.currentStatus === "ready" ? (
                        <div>
                          <span className="text-lg font-bold text-green-600" data-testid="text-window-status">Ready</span>
                          <p className="text-[10px] text-[#1a1a2e]/60 mt-1">Optimal window is now</p>
                        </div>
                      ) : (
                        <div>
                          <span className="text-2xl font-bold text-[#1a1a2e] font-mono" data-testid="text-window-days">{capitalOsData.applicationWindow.daysUntilOptimal}</span>
                          <span className="text-sm text-[#1a1a2e]/60 ml-1">days</span>
                          <p className="text-[10px] text-[#1a1a2e]/50 mt-1">until {capitalOsData.applicationWindow.optimalDate}</p>
                        </div>
                      )}
                      <div className="flex gap-1 mt-2">
                        {capitalOsData.applicationWindow.factors.map((f, i) => (
                          <div key={i} className={cn("w-2 h-2 rounded-full", f.status === "good" ? "bg-green-500" : f.status === "warning" ? "bg-yellow-500" : "bg-red-500")} title={f.detail} />
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                    {capitalOsData.bureauHealth.bureaus.map(b => (
                      <div key={b.bureau} className={cn("rounded-2xl bg-white/70 backdrop-blur-md border p-5", b.priority ? "border-[#3a3a5a]/30" : "border-white/40")} data-testid={`bureau-${b.bureau.toLowerCase()}`}>
                        <div className="flex items-center justify-between mb-3">
                          <span className="text-sm font-semibold text-[#1a1a2e]">{b.bureau}</span>
                          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium" style={{ backgroundColor: b.riskColor + '18', color: b.riskColor }}>
                            {b.riskStatus}{b.priority ? " · Priority" : ""}
                          </span>
                        </div>
                        <div className="grid grid-cols-3 gap-3 text-center mb-3">
                          <div>
                            <p className="text-lg font-bold text-[#1a1a2e]">{b.utilization}%</p>
                            <p className="text-[9px] text-[#1a1a2e]/50">Utilization</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-[#1a1a2e]">{b.hardInquiries}</p>
                            <p className="text-[9px] text-[#1a1a2e]/50">Inquiries</p>
                          </div>
                          <div>
                            <p className="text-lg font-bold text-[#1a1a2e]">{b.derogatoryCount}</p>
                            <p className="text-[9px] text-[#1a1a2e]/50">Derogatory</p>
                          </div>
                        </div>
                        <p className="text-[10px] text-[#1a1a2e]/60 leading-relaxed">{b.recommendation}</p>
                      </div>
                    ))}
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                    <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-6" data-testid="doc-upload-section">
                      <p className="text-xs text-[#1a1a2e]/70 mb-4">Document Analysis</p>
                      <input ref={creditReportInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.csv" className="hidden" data-testid="input-credit-report-upload"
                        onChange={(e) => { const file = e.target.files?.[0]; if (file) handleDocumentUpload(file, "credit_report"); e.target.value = ""; }} />
                      <input ref={bankStatementInputRef} type="file" accept=".pdf,.doc,.docx,.txt,.csv" className="hidden" data-testid="input-bank-statement-upload"
                        onChange={(e) => { const file = e.target.files?.[0]; if (file) handleDocumentUpload(file, "bank_statement"); e.target.value = ""; }} />
                      <div className="space-y-2">
                        <button onClick={() => creditReportInputRef.current?.click()} disabled={docUploading}
                          className={cn("w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                            fundingData?.hasCreditReport ? "border-green-500/20 bg-green-500/[0.04]" : "border-white/30 bg-white/50 hover:bg-white/60",
                            docUploading && docUploadType === "credit_report" && "opacity-50"
                          )} data-testid="button-upload-credit-report">
                          {docUploading && docUploadType === "credit_report" ? <Loader2 className="w-5 h-5 text-[#1a1a2e]/75 animate-spin shrink-0" /> :
                            fundingData?.hasCreditReport ? <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" /> :
                            <Upload className="w-5 h-5 text-[#1a1a2e]/65 shrink-0" />}
                          <div>
                            <p className="text-xs font-medium text-[#1a1a2e]/90">{fundingData?.hasCreditReport ? "Credit Report Uploaded" : "Upload Credit Report"}</p>
                            <p className="text-[10px] text-[#1a1a2e]/55">PDF, DOC, TXT</p>
                          </div>
                        </button>
                        <button onClick={() => bankStatementInputRef.current?.click()} disabled={docUploading}
                          className={cn("w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left",
                            fundingData?.hasBankStatement ? "border-green-500/20 bg-green-500/[0.04]" : "border-white/30 bg-white/50 hover:bg-white/60",
                            docUploading && docUploadType === "bank_statement" && "opacity-50"
                          )} data-testid="button-upload-bank-statement">
                          {docUploading && docUploadType === "bank_statement" ? <Loader2 className="w-5 h-5 text-[#1a1a2e]/75 animate-spin shrink-0" /> :
                            fundingData?.hasBankStatement ? <CheckCircle2 className="w-5 h-5 text-green-400 shrink-0" /> :
                            <Upload className="w-5 h-5 text-[#1a1a2e]/65 shrink-0" />}
                          <div>
                            <p className="text-xs font-medium text-[#1a1a2e]/90">{fundingData?.hasBankStatement ? "Bank Statement Uploaded" : "Upload Bank Statement"}</p>
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
                      {fundingData?.analysisSummary && (
                        <div className="mt-3 p-3 rounded-xl bg-white/50 border border-white/30">
                          <p className="text-[10px] text-[#1a1a2e]/80 leading-relaxed">{fundingData.analysisSummary}</p>
                          {fundingData.lastAnalysisDate && <p className="text-[9px] text-[#1a1a2e]/55 mt-1.5">{timeAgo(fundingData.lastAnalysisDate)} ago</p>}
                        </div>
                      )}
                    </div>

                    <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-6" data-testid="action-plan-card">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-xs text-[#1a1a2e]/70">Quick Actions</p>
                        <button onClick={() => { fetchCapitalOsDashboard(); fetchFundingReadiness(); }} className="text-[10px] text-[#1a1a2e]/50 hover:text-[#1a1a2e]/80 flex items-center gap-1" data-testid="button-refresh-score">
                          <RefreshCw className="w-3 h-3" /> Refresh
                        </button>
                      </div>
                      <div className="space-y-2">
                        <button onClick={() => setActiveTab("messages")} className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-white/30 hover:bg-white/60 text-left transition-colors" data-testid="button-go-chat">
                          <MessageCircle className="w-4 h-4 text-[#1a1a2e]/60" />
                          <div>
                            <p className="text-xs font-medium text-[#1a1a2e]/90">Talk to a Mentor</p>
                            <p className="text-[10px] text-[#1a1a2e]/50">Get personalized guidance</p>
                          </div>
                        </button>
                        <button onClick={() => setActiveTab("repair_engine")} className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-white/30 hover:bg-white/60 text-left transition-colors">
                          <Shield className="w-4 h-4 text-[#1a1a2e]/60" />
                          <div>
                            <p className="text-xs font-medium text-[#1a1a2e]/90">Credit Repair</p>
                            <p className="text-[10px] text-[#1a1a2e]/50">Dispute & resolve issues</p>
                          </div>
                        </button>
                        <button onClick={() => setActiveTab("funding_strategy")} className="w-full flex items-center gap-3 p-3 rounded-xl bg-white/50 border border-white/30 hover:bg-white/60 text-left transition-colors">
                          <DollarSign className="w-4 h-4 text-[#1a1a2e]/60" />
                          <div>
                            <p className="text-xs font-medium text-[#1a1a2e]/90">Funding Strategy</p>
                            <p className="text-[10px] text-[#1a1a2e]/50">Application timing & capital stack</p>
                          </div>
                        </button>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <p className="text-xs text-[#1a1a2e]/70 mb-4">Build Strategy Simulators</p>
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                      <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-6" data-testid="bank-rating-simulator">
                        <p className="text-xs text-[#1a1a2e]/70 mb-4">Bank Rating Simulator</p>
                        <div className="space-y-3 mb-4">
                          <div>
                            <label className="text-[10px] text-[#1a1a2e]/60 mb-1 block">Avg Monthly Deposits ($)</label>
                            <input type="number" value={bankRatingForm.avgMonthlyDeposits} onChange={e => setBankRatingForm(p => ({ ...p, avgMonthlyDeposits: Number(e.target.value) }))}
                              className="w-full h-10 px-3 rounded-xl bg-white/60 border border-white/30 text-sm text-[#1a1a2e] outline-none focus:border-[#c0c0d0]" data-testid="input-monthly-deposits" />
                          </div>
                          <div>
                            <label className="text-[10px] text-[#1a1a2e]/60 mb-1 block">Relationship Years</label>
                            <input type="number" value={bankRatingForm.relationshipYears} onChange={e => setBankRatingForm(p => ({ ...p, relationshipYears: Number(e.target.value) }))}
                              className="w-full h-10 px-3 rounded-xl bg-white/60 border border-white/30 text-sm text-[#1a1a2e] outline-none focus:border-[#c0c0d0]" data-testid="input-relationship-years" />
                          </div>
                          <div>
                            <label className="text-[10px] text-[#1a1a2e]/60 mb-1 block">Target Institution</label>
                            <input type="text" value={bankRatingForm.targetInstitution} onChange={e => setBankRatingForm(p => ({ ...p, targetInstitution: e.target.value }))}
                              placeholder="e.g., Chase, Wells Fargo"
                              className="w-full h-10 px-3 rounded-xl bg-white/60 border border-white/30 text-sm text-[#1a1a2e] placeholder:text-[#1a1a2e]/30 outline-none focus:border-[#c0c0d0]" data-testid="input-target-institution" />
                          </div>
                        </div>
                        <button onClick={submitBankRating} disabled={bankRatingLoading}
                          className="w-full h-10 rounded-xl bg-[#3a3a5a] text-white text-xs font-medium hover:bg-[#2a2a4a] disabled:opacity-50 transition-colors flex items-center justify-center gap-2" data-testid="button-simulate-bank-rating">
                          {bankRatingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Gauge className="w-3.5 h-3.5" />}
                          Simulate Rating
                        </button>
                        {bankRatingResult && (
                          <div className="mt-4 p-4 rounded-xl bg-white/50 border border-white/30" data-testid="bank-rating-result">
                            <div className="flex items-center gap-3 mb-3">
                              <div className="flex gap-0.5">
                                {[1,2,3,4,5].map(n => (
                                  <div key={n} className={cn("w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-bold", n <= Math.round(bankRatingResult.rating) ? "bg-[#3a3a5a] text-white" : "bg-[#e0e0ea] text-[#1a1a2e]/40")}>{n}</div>
                                ))}
                              </div>
                              <span className="text-sm font-semibold text-[#1a1a2e]">{bankRatingResult.label}</span>
                            </div>
                            <div className="space-y-1.5">
                              {bankRatingResult.recommendations?.map((r: string, i: number) => (
                                <p key={i} className="text-[11px] text-[#1a1a2e]/70 flex items-start gap-2">
                                  <span className="text-[#1a1a2e]/30 mt-0.5">·</span>{r}
                                </p>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-6" data-testid="pledge-loan-simulator">
                        <p className="text-xs text-[#1a1a2e]/70 mb-4">Pledge Loan Simulator</p>
                        <div className="space-y-3 mb-4">
                          <div>
                            <label className="text-[10px] text-[#1a1a2e]/60 mb-1 block">Loan Amount ($)</label>
                            <input type="number" value={pledgeLoanForm.loanAmount} onChange={e => setPledgeLoanForm(p => ({ ...p, loanAmount: Number(e.target.value) }))}
                              className="w-full h-10 px-3 rounded-xl bg-white/60 border border-white/30 text-sm text-[#1a1a2e] outline-none focus:border-[#c0c0d0]" data-testid="input-loan-amount" />
                          </div>
                          <div>
                            <label className="text-[10px] text-[#1a1a2e]/60 mb-1 block">Paydown Percent (%)</label>
                            <input type="number" value={pledgeLoanForm.paydownPercent} onChange={e => setPledgeLoanForm(p => ({ ...p, paydownPercent: Number(e.target.value) }))}
                              className="w-full h-10 px-3 rounded-xl bg-white/60 border border-white/30 text-sm text-[#1a1a2e] outline-none focus:border-[#c0c0d0]" data-testid="input-paydown-percent" />
                          </div>
                        </div>
                        <button onClick={submitPledgeLoan} disabled={pledgeLoanLoading}
                          className="w-full h-10 rounded-xl bg-[#3a3a5a] text-white text-xs font-medium hover:bg-[#2a2a4a] disabled:opacity-50 transition-colors flex items-center justify-center gap-2" data-testid="button-simulate-pledge-loan">
                          {pledgeLoanLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <TrendingUp className="w-3.5 h-3.5" />}
                          Simulate Pledge Loan
                        </button>
                        {pledgeLoanResult && (
                          <div className="mt-4 p-4 rounded-xl bg-white/50 border border-white/30" data-testid="pledge-loan-result">
                            <div className="grid grid-cols-2 gap-4 mb-4">
                              <div className="text-center p-3 rounded-lg bg-white/60">
                                <p className="text-[9px] text-[#1a1a2e]/50 uppercase mb-1">Before</p>
                                <p className="text-xl font-bold text-[#1a1a2e]">{pledgeLoanResult.utilBefore}%</p>
                                <p className="text-[9px] text-[#1a1a2e]/40">utilization</p>
                              </div>
                              <div className="text-center p-3 rounded-lg bg-green-500/[0.06] border border-green-500/10">
                                <p className="text-[9px] text-green-600/60 uppercase mb-1">After</p>
                                <p className="text-xl font-bold text-green-600">{pledgeLoanResult.utilAfter}%</p>
                                <p className="text-[9px] text-green-600/40">utilization</p>
                              </div>
                            </div>
                            <div className="flex items-center justify-between text-xs mb-2">
                              <span className="text-[#1a1a2e]/60">Estimated Score Impact</span>
                              <span className="font-semibold text-green-600">+{pledgeLoanResult.scoreDelta} pts</span>
                            </div>
                            <div className="flex items-center justify-between text-xs mb-3">
                              <span className="text-[#1a1a2e]/60">Timeline</span>
                              <span className="font-medium text-[#1a1a2e]/80">{pledgeLoanResult.timelineMonths} months</span>
                            </div>
                            <p className="text-[11px] text-[#1a1a2e]/70 leading-relaxed">{pledgeLoanResult.recommendation}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {fundingData && fundingData.alerts.length > 0 && (
                    <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-6 mb-4" data-testid="risk-alerts-card">
                      <p className="text-xs text-[#1a1a2e]/70 mb-4">Risk Alerts</p>
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
            <div className="w-full px-5 sm:px-8 py-6 max-w-[1000px] mx-auto">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h2 className="text-lg font-semibold text-[#1a1a2e]" data-testid="text-repair-title">Repair Engine</h2>
                  <p className="text-[11px] text-[#1a1a2e]/60">3-round dispute system with FCRA-compliant letters for every derogatory item</p>
                </div>
                <button onClick={runRepairAnalysis} disabled={repairAnalyzing}
                  className="h-9 px-4 rounded-xl bg-white/70 border border-white/40 hover:bg-white/80 text-xs font-medium text-[#1a1a2e]/80 transition-colors flex items-center gap-2 disabled:opacity-50" data-testid="button-run-repair">
                  {repairAnalyzing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <RefreshCw className="w-3.5 h-3.5" />}
                  {repairAnalyzing ? "Generating Letters..." : "Generate Dispute Letters"}
                </button>
              </div>

              {repairLoading ? (
                <div className="flex items-center justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-[#1a1a2e]/50" /></div>
              ) : !repairData ? (
                <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-8 text-center">
                  <Shield className="w-10 h-10 text-[#1a1a2e]/30 mx-auto mb-3" />
                  <p className="text-sm text-[#1a1a2e]/70 mb-2">No repair data available</p>
                  <p className="text-[11px] text-[#1a1a2e]/50 mb-4">Upload a credit report from Mission Control, then generate dispute letters</p>
                  <button onClick={() => setActiveTab("mission_control")} className="text-xs text-[#1a1a2e]/60 hover:text-[#1a1a2e]/80 underline" data-testid="link-go-to-mission-control">Go to Mission Control</button>
                </div>
              ) : (
                <>
                  <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-5 mb-5" data-testid="user-address-form">
                    <div className="flex items-center justify-between mb-3">
                      <p className="text-xs font-medium text-[#1a1a2e]/70">Your Mailing Address</p>
                      <p className="text-[10px] text-[#1a1a2e]/40">Auto-populated on all letters</p>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-3">
                      <div className="sm:col-span-2">
                        <input type="text" placeholder="Full Name" value={userAddressForm.fullName} onChange={e => setUserAddressForm(p => ({ ...p, fullName: e.target.value }))}
                          className="w-full h-9 px-3 rounded-xl bg-white/60 border border-white/30 text-sm text-[#1a1a2e] placeholder:text-[#1a1a2e]/30 outline-none focus:border-[#c0c0d0]" data-testid="input-full-name" />
                      </div>
                      <div className="sm:col-span-2">
                        <input type="text" placeholder="Street Address" value={userAddressForm.streetAddress} onChange={e => setUserAddressForm(p => ({ ...p, streetAddress: e.target.value }))}
                          className="w-full h-9 px-3 rounded-xl bg-white/60 border border-white/30 text-sm text-[#1a1a2e] placeholder:text-[#1a1a2e]/30 outline-none focus:border-[#c0c0d0]" data-testid="input-street-address" />
                      </div>
                      <input type="text" placeholder="City" value={userAddressForm.city} onChange={e => setUserAddressForm(p => ({ ...p, city: e.target.value }))}
                        className="w-full h-9 px-3 rounded-xl bg-white/60 border border-white/30 text-sm text-[#1a1a2e] placeholder:text-[#1a1a2e]/30 outline-none focus:border-[#c0c0d0]" data-testid="input-city" />
                      <div className="flex gap-3">
                        <input type="text" placeholder="State" value={userAddressForm.state} onChange={e => setUserAddressForm(p => ({ ...p, state: e.target.value }))}
                          className="w-1/2 h-9 px-3 rounded-xl bg-white/60 border border-white/30 text-sm text-[#1a1a2e] placeholder:text-[#1a1a2e]/30 outline-none focus:border-[#c0c0d0]" data-testid="input-state" />
                        <input type="text" placeholder="ZIP Code" value={userAddressForm.zipCode} onChange={e => setUserAddressForm(p => ({ ...p, zipCode: e.target.value }))}
                          className="w-1/2 h-9 px-3 rounded-xl bg-white/60 border border-white/30 text-sm text-[#1a1a2e] placeholder:text-[#1a1a2e]/30 outline-none focus:border-[#c0c0d0]" data-testid="input-zip" />
                      </div>
                    </div>
                    <button onClick={saveUserAddress} disabled={addressSaving}
                      className="h-8 px-4 rounded-xl bg-[#3a3a5a] text-white text-[11px] font-medium hover:bg-[#2a2a4a] disabled:opacity-50 transition-colors flex items-center gap-2" data-testid="button-save-address">
                      {addressSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                      Save Address
                    </button>
                  </div>

                  <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-5 mb-5" data-testid="dispute-timeline">
                    <p className="text-xs font-medium text-[#1a1a2e]/70 mb-4">3-Round Dispute Timeline</p>
                    <div className="flex gap-2 mb-4">
                      {[1, 2, 3].map(round => (
                        <button key={round} onClick={() => setActiveRepairRound(round)}
                          className={cn("flex-1 h-10 rounded-xl text-xs font-medium transition-all flex items-center justify-center gap-2",
                            activeRepairRound === round
                              ? "bg-[#3a3a5a] text-white shadow-lg"
                              : "bg-white/50 border border-white/30 text-[#1a1a2e]/60 hover:bg-white/70"
                          )} data-testid={`button-round-${round}`}>
                          Round {round}
                        </button>
                      ))}
                    </div>
                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div className={cn("rounded-xl p-3 border", activeRepairRound === 1 ? "bg-blue-50/80 border-blue-200/50" : "bg-white/40 border-white/30")}>
                        <p className="text-[9px] font-bold text-[#1a1a2e]/50 uppercase mb-1">Round 1</p>
                        <p className="text-[10px] text-[#1a1a2e]/70 font-medium">Day 0</p>
                        <p className="text-[9px] text-[#1a1a2e]/40 mt-1">Inaccurate / Unverifiable</p>
                      </div>
                      <div className={cn("rounded-xl p-3 border", activeRepairRound === 2 ? "bg-purple-50/80 border-purple-200/50" : "bg-white/40 border-white/30")}>
                        <p className="text-[9px] font-bold text-[#1a1a2e]/50 uppercase mb-1">Round 2</p>
                        <p className="text-[10px] text-[#1a1a2e]/70 font-medium">Day 35-40</p>
                        <p className="text-[9px] text-[#1a1a2e]/40 mt-1">Verification Challenge</p>
                      </div>
                      <div className={cn("rounded-xl p-3 border", activeRepairRound === 3 ? "bg-red-50/80 border-red-200/50" : "bg-white/40 border-white/30")}>
                        <p className="text-[9px] font-bold text-[#1a1a2e]/50 uppercase mb-1">Round 3</p>
                        <p className="text-[10px] text-[#1a1a2e]/70 font-medium">Day 65-75</p>
                        <p className="text-[9px] text-[#1a1a2e]/40 mt-1">Fraud Escalation</p>
                      </div>
                    </div>
                  </div>

                  <div className={cn("rounded-2xl backdrop-blur-md border p-5 mb-5",
                    activeRepairRound === 3 ? "bg-red-50/60 border-red-200/30" : "bg-white/70 border-white/40"
                  )} data-testid="bureau-addresses">
                    <p className={cn("text-xs font-medium mb-3", activeRepairRound === 3 ? "text-red-800/70" : "text-[#1a1a2e]/70")}>
                      {activeRepairRound === 3 ? "Bureau Fraud Department Addresses" : "Bureau Dispute Addresses"}
                    </p>
                    <p className="text-[10px] text-[#1a1a2e]/50 mb-4">
                      {activeRepairRound === 1 ? "Round 1 letters are sent to bureau dispute centers via certified mail" :
                       activeRepairRound === 2 ? "Round 2 letters challenge verification methods at dispute centers" :
                       "Round 3 letters are sent to fraud departments, not regular dispute centers"}
                    </p>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      {activeRepairRound === 3 ? (
                        <>
                          <div className="rounded-xl bg-white/70 p-3 border border-red-200/20">
                            <p className="text-[10px] font-bold text-[#1a1a2e]/80 mb-1">Experian Fraud</p>
                            <p className="text-[10px] text-[#1a1a2e]/60 leading-relaxed">P.O. Box 9554<br/>Allen, TX 75013</p>
                            <p className="text-[9px] text-[#1a1a2e]/40 mt-1">1-888-397-3742</p>
                          </div>
                          <div className="rounded-xl bg-white/70 p-3 border border-red-200/20">
                            <p className="text-[10px] font-bold text-[#1a1a2e]/80 mb-1">Equifax Fraud</p>
                            <p className="text-[10px] text-[#1a1a2e]/60 leading-relaxed">P.O. Box 105069<br/>Atlanta, GA 30348</p>
                            <p className="text-[9px] text-[#1a1a2e]/40 mt-1">1-800-525-6285</p>
                          </div>
                          <div className="rounded-xl bg-white/70 p-3 border border-red-200/20">
                            <p className="text-[10px] font-bold text-[#1a1a2e]/80 mb-1">TransUnion Fraud</p>
                            <p className="text-[10px] text-[#1a1a2e]/60 leading-relaxed">P.O. Box 2000<br/>Chester, PA 19016</p>
                            <p className="text-[9px] text-[#1a1a2e]/40 mt-1">1-800-680-7289</p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="rounded-xl bg-white/50 p-3 border border-white/30">
                            <p className="text-[10px] font-bold text-[#1a1a2e]/80 mb-1">Experian</p>
                            <p className="text-[10px] text-[#1a1a2e]/60 leading-relaxed">P.O. Box 4500<br/>Allen, TX 75013</p>
                          </div>
                          <div className="rounded-xl bg-white/50 p-3 border border-white/30">
                            <p className="text-[10px] font-bold text-[#1a1a2e]/80 mb-1">Equifax</p>
                            <p className="text-[10px] text-[#1a1a2e]/60 leading-relaxed">P.O. Box 740256<br/>Atlanta, GA 30374-0256</p>
                          </div>
                          <div className="rounded-xl bg-white/50 p-3 border border-white/30">
                            <p className="text-[10px] font-bold text-[#1a1a2e]/80 mb-1">TransUnion</p>
                            <p className="text-[10px] text-[#1a1a2e]/60 leading-relaxed">P.O. Box 2000<br/>Chester, PA 19016-2000</p>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-5 mb-5" data-testid="mailing-services">
                    <p className="text-xs font-medium text-[#1a1a2e]/70 mb-3">Recommended Mailing Services</p>
                    <p className="text-[10px] text-[#1a1a2e]/40 mb-3">Always send dispute letters via certified mail with return receipt</p>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-white/50 border border-white/30">
                        <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center shrink-0"><Send className="w-4 h-4 text-blue-500/70" /></div>
                        <div>
                          <p className="text-[11px] font-medium text-[#1a1a2e]/80">USPS Certified Mail</p>
                          <p className="text-[10px] text-[#1a1a2e]/50">usps.com - Best for proof of delivery</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-white/50 border border-white/30">
                        <div className="w-8 h-8 rounded-lg bg-green-500/10 flex items-center justify-center shrink-0"><Send className="w-4 h-4 text-green-500/70" /></div>
                        <div>
                          <p className="text-[11px] font-medium text-[#1a1a2e]/80">LetterStream</p>
                          <p className="text-[10px] text-[#1a1a2e]/50">letterstream.com - Online certified mail service</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-white/50 border border-white/30">
                        <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center shrink-0"><Send className="w-4 h-4 text-purple-500/70" /></div>
                        <div>
                          <p className="text-[11px] font-medium text-[#1a1a2e]/80">Click2Mail</p>
                          <p className="text-[10px] text-[#1a1a2e]/50">click2mail.com - Print & mail from your browser</p>
                        </div>
                      </div>
                      <div className="flex items-start gap-3 p-3 rounded-xl bg-white/50 border border-white/30">
                        <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center shrink-0"><Send className="w-4 h-4 text-orange-500/70" /></div>
                        <div>
                          <p className="text-[11px] font-medium text-[#1a1a2e]/80">Lob</p>
                          <p className="text-[10px] text-[#1a1a2e]/50">lob.com - Automated mail with tracking</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {repairData.detectedIssues && repairData.detectedIssues.length > 0 && (
                    <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-5 mb-5" data-testid="detected-issues-card">
                      <p className="text-xs font-medium text-[#1a1a2e]/70 mb-3">Detected Derogatory Items ({repairData.detectedIssues.length})</p>
                      <div className="space-y-2">
                        {repairData.detectedIssues.map((issue: any, idx: number) => (
                          <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/50 border border-white/30" data-testid={`issue-${idx}`}>
                            <AlertTriangle className="w-4 h-4 text-orange-500/70 shrink-0 mt-0.5" />
                            <div className="flex-1 min-w-0">
                              <p className="text-sm text-[#1a1a2e]/90">
                                {typeof issue === "string" ? issue : (issue.issue || issue.description || issue.issueType || issue.creditor || `Item ${idx + 1}`)}
                              </p>
                              {issue.creditor && <p className="text-[10px] text-[#1a1a2e]/50 mt-0.5">Creditor: {issue.creditor}</p>}
                              {issue.accountLast4 && <p className="text-[10px] text-[#1a1a2e]/50">Account: ...{issue.accountLast4}</p>}
                              {issue.bureau && <p className="text-[10px] text-[#1a1a2e]/50 mt-0.5">Bureau: {issue.bureau}</p>}
                              {issue.severity && <p className="text-[10px] text-[#1a1a2e]/50">Severity: {issue.severity}</p>}
                              {issue.impact && <p className="text-[10px] text-[#1a1a2e]/50">Impact: {issue.impact}</p>}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {repairData.letters && repairData.letters.length > 0 && (
                    <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-5 mb-5" data-testid="dispute-letters-card">
                      <div className="flex items-center justify-between mb-4">
                        <p className="text-xs font-medium text-[#1a1a2e]/70">
                          Round {activeRepairRound} Dispute Letters
                        </p>
                        <span className="text-[10px] bg-[#3a3a5a]/10 text-[#3a3a5a] px-2 py-0.5 rounded-full font-medium">
                          {repairData.letters.filter((l: any) => {
                            const r = l.round || 1;
                            return r === activeRepairRound;
                          }).length} letters
                        </span>
                      </div>
                      <div className="space-y-3">
                        {repairData.letters
                          .map((letter: any, idx: number) => ({ ...letter, _idx: idx }))
                          .filter((letter: any) => {
                            const r = letter.round || 1;
                            return r === activeRepairRound;
                          })
                          .map((letter: any) => {
                            const key = `r${letter.round || 1}-${letter._idx}`;
                            const mailingAddr = letter.recipientAddress || "";
                            const fraudAddr = letter.fraudDeptAddress || "";
                            return (
                              <div key={key} className="rounded-xl bg-white/50 border border-white/30 overflow-hidden" data-testid={`letter-${key}`}>
                                <button
                                  onClick={() => setExpandedLetters(prev => { const next = new Set(prev); if (next.has(key)) next.delete(key); else next.add(key); return next; })}
                                  className="w-full flex items-center justify-between p-4 text-left hover:bg-white/60 transition-colors"
                                >
                                  <div className="flex items-center gap-3 flex-1 min-w-0">
                                    <FileText className="w-4 h-4 text-[#1a1a2e]/60 shrink-0" />
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-medium text-[#1a1a2e]/90 truncate">{letter.title || letter.bureau || `Letter ${letter._idx + 1}`}</p>
                                      <div className="flex flex-wrap items-center gap-2 mt-0.5">
                                        {letter.bureau && <span className="text-[10px] text-[#1a1a2e]/50">{letter.bureau}</span>}
                                        {letter.disputeType && <span className="text-[9px] bg-[#1a1a2e]/5 text-[#1a1a2e]/50 px-1.5 py-0.5 rounded">{letter.disputeType}</span>}
                                        {letter.fcraCitation && <span className="text-[9px] text-blue-500/60">{letter.fcraCitation}</span>}
                                      </div>
                                      {mailingAddr && (
                                        <p className="text-[9px] text-[#1a1a2e]/40 mt-1 flex items-center gap-1">
                                          <Send className="w-2.5 h-2.5" /> Mail to: {mailingAddr}
                                        </p>
                                      )}
                                    </div>
                                  </div>
                                  <ChevronRight className={cn("w-4 h-4 text-[#1a1a2e]/40 transition-transform shrink-0", expandedLetters.has(key) && "rotate-90")} />
                                </button>
                                {expandedLetters.has(key) && (
                                  <div className="px-4 pb-4 border-t border-white/30">
                                    {(mailingAddr || fraudAddr) && (
                                      <div className="mt-3 mb-3 p-3 rounded-lg bg-[#f0f0f8]/60 border border-[#e0e0ea]/40">
                                        {mailingAddr && (
                                          <div className="flex items-start gap-2 mb-1.5">
                                            <Send className="w-3 h-3 text-[#1a1a2e]/40 shrink-0 mt-0.5" />
                                            <div>
                                              <p className="text-[9px] font-bold text-[#1a1a2e]/50 uppercase">Send To</p>
                                              <p className="text-[10px] text-[#1a1a2e]/70">{mailingAddr}</p>
                                            </div>
                                          </div>
                                        )}
                                        {fraudAddr && (
                                          <div className="flex items-start gap-2">
                                            <AlertTriangle className="w-3 h-3 text-red-400/60 shrink-0 mt-0.5" />
                                            <div>
                                              <p className="text-[9px] font-bold text-red-500/50 uppercase">CC: Fraud Department</p>
                                              <p className="text-[10px] text-[#1a1a2e]/70">{fraudAddr}</p>
                                            </div>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                    <pre className="text-[11px] text-[#1a1a2e]/80 leading-relaxed whitespace-pre-wrap font-sans">{letter.content || letter.text || letter.body}</pre>
                                    <div className="flex items-center gap-2 mt-3">
                                      <button
                                        onClick={() => copyLetterToClipboard(letter.content || letter.text || letter.body, key)}
                                        className="flex items-center gap-2 h-8 px-3 rounded-lg bg-white/60 border border-white/30 text-[10px] text-[#1a1a2e]/70 hover:bg-white/80 transition-colors"
                                        data-testid={`copy-letter-${key}`}
                                      >
                                        {copiedLetter === key ? <><Check className="w-3 h-3" /> Copied</> : <><Copy className="w-3 h-3" /> Copy to Clipboard</>}
                                      </button>
                                    </div>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        {repairData.letters.filter((l: any) => (l.round || 1) === activeRepairRound).length === 0 && (
                          <div className="text-center py-6">
                            <p className="text-xs text-[#1a1a2e]/50">No Round {activeRepairRound} letters generated yet.</p>
                            <p className="text-[10px] text-[#1a1a2e]/30 mt-1">
                              {activeRepairRound === 1 ? "Click 'Generate Dispute Letters' above to start" :
                               activeRepairRound === 2 ? "Send after Day 35 if Round 1 disputes are not resolved" :
                               "Send to fraud departments after Day 65 for unresolved items"}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {repairData.actionPlan && (
                    <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-5 mb-5" data-testid="action-plan-card">
                      <p className="text-xs font-medium text-[#1a1a2e]/70 mb-4">Action Plan</p>
                      {Array.isArray(repairData.actionPlan) ? (
                        <div className="space-y-3">
                          {repairData.actionPlan.map((step: any, idx: number) => (
                            <div key={idx} className="flex gap-3 p-3 rounded-xl bg-white/50 border border-white/30" data-testid={`action-step-${idx}`}>
                              <div className="w-7 h-7 rounded-lg bg-[#3a3a5a]/10 flex items-center justify-center shrink-0">
                                <span className="text-[11px] font-bold text-[#3a3a5a]">{step.step || idx + 1}</span>
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium text-[#1a1a2e]/90">{step.action || step}</p>
                                {step.timing && <p className="text-[10px] text-[#1a1a2e]/50 mt-0.5 flex items-center gap-1"><Clock className="w-3 h-3" />{step.timing}</p>}
                                {step.details && <p className="text-[11px] text-[#1a1a2e]/60 mt-1.5 leading-relaxed">{step.details}</p>}
                              </div>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-[11px] text-[#1a1a2e]/70 leading-relaxed whitespace-pre-wrap">{repairData.actionPlan}</div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {activeTab === "funding_strategy" && (
            <div className="w-full px-5 sm:px-8 py-6 max-w-[1000px] mx-auto">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-[#1a1a2e]" data-testid="text-funding-title">Funding Strategy</h2>
                <p className="text-[11px] text-[#1a1a2e]/60">Application timing and capital stack planning</p>
              </div>

              {capitalOsData && (
                <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-6 mb-6" data-testid="application-window-detail">
                  <div className="flex items-center justify-between mb-4">
                    <p className="text-xs text-[#1a1a2e]/70">Application Window</p>
                    <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-medium",
                      capitalOsData.applicationWindow.currentStatus === "ready" ? "bg-green-500/15 text-green-600" :
                      capitalOsData.applicationWindow.currentStatus === "wait" ? "bg-yellow-500/15 text-yellow-600" :
                      "bg-red-500/15 text-red-600"
                    )}>{capitalOsData.applicationWindow.currentStatus === "ready" ? "Ready Now" : capitalOsData.applicationWindow.currentStatus === "wait" ? "Waiting" : "Repair First"}</span>
                  </div>
                  {capitalOsData.applicationWindow.daysUntilOptimal > 0 && (
                    <div className="flex items-baseline gap-2 mb-3">
                      <span className="text-4xl font-bold text-[#1a1a2e] font-mono">{capitalOsData.applicationWindow.daysUntilOptimal}</span>
                      <span className="text-sm text-[#1a1a2e]/50">days until optimal window</span>
                    </div>
                  )}
                  <p className="text-[11px] text-[#1a1a2e]/70 mb-4 leading-relaxed">{capitalOsData.applicationWindow.reasoning}</p>
                  <div className="space-y-2">
                    {capitalOsData.applicationWindow.factors.map((f, i) => (
                      <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/50">
                        <div className={cn("w-2 h-2 rounded-full shrink-0", f.status === "good" ? "bg-green-500" : f.status === "warning" ? "bg-yellow-500" : "bg-red-500")} />
                        <div className="flex-1 min-w-0">
                          <p className="text-xs font-medium text-[#1a1a2e]/85">{f.factor}</p>
                          <p className="text-[10px] text-[#1a1a2e]/55">{f.detail}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-6" data-testid="capital-stack-simulator">
                <p className="text-xs text-[#1a1a2e]/70 mb-4">Capital Stack Simulator</p>
                <div className="flex gap-3 mb-4">
                  <div className="flex-1">
                    <label className="text-[10px] text-[#1a1a2e]/60 mb-1 block">Target Amount ($)</label>
                    <input type="number" value={capitalStackAmount} onChange={e => setCapitalStackAmount(Number(e.target.value))}
                      className="w-full h-10 px-3 rounded-xl bg-white/60 border border-white/30 text-sm text-[#1a1a2e] outline-none focus:border-[#c0c0d0]" data-testid="input-target-amount" />
                  </div>
                  <button onClick={submitCapitalStack} disabled={capitalStackLoading}
                    className="self-end h-10 px-5 rounded-xl bg-[#3a3a5a] text-white text-xs font-medium hover:bg-[#2a2a4a] disabled:opacity-50 transition-colors flex items-center gap-2" data-testid="button-simulate-stack">
                    {capitalStackLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <BarChart3 className="w-3.5 h-3.5" />}
                    Simulate
                  </button>
                </div>

                {capitalStackResult && (
                  <div className="mt-2" data-testid="capital-stack-result">
                    <div className="flex items-center justify-between p-3 rounded-xl bg-white/50 border border-white/30 mb-4">
                      <div>
                        <p className="text-[10px] text-[#1a1a2e]/50">Total Estimated</p>
                        <p className="text-xl font-bold text-[#1a1a2e]">${capitalStackResult.totalEstimated?.toLocaleString()}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] text-[#1a1a2e]/50">Timeline</p>
                        <p className="text-sm font-medium text-[#1a1a2e]">{capitalStackResult.timeline}</p>
                      </div>
                    </div>
                    <div className="space-y-0">
                      {capitalStackResult.stages?.map((stage: any, i: number) => (
                        <div key={i} className="flex gap-4" data-testid={`stage-${i}`}>
                          <div className="flex flex-col items-center">
                            <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0",
                              i === 0 ? "bg-[#3a3a5a] text-white" : "bg-white/60 border border-white/30 text-[#1a1a2e]/60"
                            )}>{stage.stage}</div>
                            {i < (capitalStackResult.stages?.length || 0) - 1 && <div className="w-px flex-1 bg-[#e0e0ea] my-1" />}
                          </div>
                          <div className="flex-1 pb-5">
                            <p className="text-sm font-medium text-[#1a1a2e]/90">{stage.product}</p>
                            <p className="text-[10px] text-[#1a1a2e]/50">{stage.bureau} · {stage.timing}</p>
                            <p className="text-xs font-semibold text-[#1a1a2e]/80 mt-1">${stage.estimatedAmount?.toLocaleString()}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
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
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {creatorMatchResults.creators.map((creator: any, idx: number) => {
                          const categoryColors: Record<string, string> = { credit_repair: "from-orange-400 to-red-400", business_funding: "from-green-400 to-emerald-500", business_credit: "from-blue-400 to-indigo-500", financial_literacy: "from-purple-400 to-violet-500", entrepreneurship: "from-amber-400 to-orange-500", credit_building: "from-teal-400 to-cyan-500", investing: "from-pink-400 to-rose-500" };
                          const gradient = categoryColors[creator.category] || "from-purple-400 to-blue-400";
                          return (
                            <div key={idx} className="bg-white/70 backdrop-blur-sm border border-white/40 rounded-xl p-4 hover:shadow-md transition-all" data-testid={`creator-card-${idx}`}>
                              <div className="flex items-start gap-3">
                                <div className={`w-11 h-11 rounded-full bg-gradient-to-br ${gradient} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-sm`}>{(creator.channelName || "?")[0]}</div>
                                <div className="flex-1 min-w-0">
                                  <h4 className="text-[13px] font-bold text-[#1a1a2e] truncate">{creator.channelName}</h4>
                                  <div className="flex items-center gap-2 mt-0.5">
                                    {creator.handle && <span className="text-[10px] text-purple-500 font-medium">{creator.handle}</span>}
                                    {creator.subscriberEstimate && <span className="text-[10px] text-[#1a1a2e]/50">{creator.subscriberEstimate} subs</span>}
                                  </div>
                                </div>
                              </div>
                              <p className="text-[11px] text-[#1a1a2e]/70 mt-2 leading-relaxed">{creator.specialty}</p>
                              {creator.matchReason && (
                                <p className="text-[10px] text-purple-600/80 mt-1.5 flex items-start gap-1">
                                  <Sparkles className="w-3 h-3 shrink-0 mt-0.5" /><span className="line-clamp-2">{creator.matchReason}</span>
                                </p>
                              )}
                              <div className="flex items-center gap-2 mt-3">
                                <a href={creator.channelUrl} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-500/10 border border-red-300/30 text-red-600 text-[11px] font-medium hover:bg-red-500/20 transition-colors" data-testid={`creator-yt-link-${idx}`}>
                                  <Play className="w-3 h-3" /> YouTube
                                </a>
                                <a href={creator.searchUrl} target="_blank" rel="noopener noreferrer"
                                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-500/10 border border-blue-300/30 text-blue-600 text-[11px] font-medium hover:bg-blue-500/20 transition-colors" data-testid={`creator-search-link-${idx}`}>
                                  <Search className="w-3 h-3" /> Search
                                </a>
                              </div>
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
                      {creatorAiMessages.map((msg, idx) => (
                        <div key={idx} className={cn("flex", msg.role === "user" ? "justify-end" : "justify-start")}>
                          <div className={cn("max-w-[85%] rounded-xl px-4 py-3", msg.role === "user" ? "bg-purple-600/15 border border-purple-400/20 text-[#1a1a2e]" : "bg-white/60 border border-white/30 text-[#1a1a2e]")}>
                            {msg.role === "assistant" && <div className="flex items-center gap-1.5 mb-2 text-[10px] text-purple-500/60"><Sparkles className="w-3 h-3" />Creator-Informed Insight</div>}
                            <div className="text-[13px] leading-relaxed whitespace-pre-wrap" data-testid={`creator-ai-msg-${idx}`}>{msg.content}</div>
                          </div>
                        </div>
                      ))}
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
                  <div className="flex items-center gap-3 mb-6">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-cyan-600 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-[#1a1a2e]" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold text-[#1a1a2e]" data-testid="text-messages-title">Messages</h2>
                      <p className="text-[11px] text-[#1a1a2e]/75">Chat with friends & ask AI together as a team</p>
                    </div>
                  </div>

                  {activeMentor && (
                    <div className="rounded-xl bg-white/50 border border-white/30 p-4 mb-4">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-[10px] font-bold border border-white/30", activeMentorKey ? BOT_COLORS[activeMentorKey] : "")}>
                          {activeMentor.initials}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-[#1a1a2e]">{activeMentor.name}</p>
                          <p className="text-[10px] text-[#1a1a2e]/60">{activeMentor.specialty}</p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <textarea ref={textareaRef} value={input} onChange={handleTextareaInput} onKeyDown={handleKeyDown}
                          placeholder={`Ask ${activeMentor.name}...`}
                          className="flex-1 bg-white/60 border border-white/30 rounded-xl px-3 py-2.5 text-sm text-[#1a1a2e] placeholder:text-[#8a8aa5]/50 resize-none focus:outline-none focus:border-[#c0c0d0]"
                          rows={1} data-testid="input-mentor-chat" />
                        <button onClick={handleSend} disabled={isLoading || !input.trim()}
                          className="w-10 h-10 rounded-xl bg-[#3a3a5a] text-white hover:bg-[#2a2a4a] disabled:opacity-30 flex items-center justify-center transition-colors shrink-0" data-testid="button-send-mentor">
                          {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                        </button>
                      </div>
                    </div>
                  )}

                  {messages.length > 0 && (
                    <div className="rounded-xl bg-white/50 border border-white/30 p-4 mb-4">
                      <p className="text-[10px] text-[#1a1a2e]/50 uppercase tracking-wider mb-3">Mentor Chat History</p>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
                        {messages.slice(-10).map((m) => {
                          const mentorData = m.role === 'assistant' && m.mentor ? MENTOR_INFO[m.mentor] : null;
                          return (
                            <div key={m.id} className={cn("flex gap-2.5", m.role === 'user' ? "justify-end" : "justify-start")}>
                              {m.role !== 'user' && mentorData && (
                                <div className={cn("w-7 h-7 rounded-full flex items-center justify-center text-[9px] font-bold shrink-0 border border-white/30", m.mentor ? BOT_COLORS[m.mentor] : "")}>
                                  {mentorData.initials}
                                </div>
                              )}
                              <div className={cn("max-w-[80%] rounded-xl px-3 py-2", m.role === 'user' ? "bg-[#e0e0ea] text-[#1a1a2e]" : "bg-white/60 border border-white/30")}>
                                <p className="text-[12px] text-[#1a1a2e]/85 leading-relaxed whitespace-pre-wrap line-clamp-4">{m.content}</p>
                                <p className="text-[9px] text-[#1a1a2e]/40 mt-1">{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {friendsList.length === 0 ? (
                    <div className="text-center py-16">
                      <UserPlus className="w-10 h-10 text-[#1a1a2e]/40 mx-auto mb-3" />
                      <p className="text-sm text-[#1a1a2e]/70 mb-1">No friends yet</p>
                      <p className="text-[11px] text-[#1a1a2e]/55 mb-4">Add friends from the buddy list to start messaging</p>
                      <button onClick={() => setShowAddFriend(true)} className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white/50 border border-white/30 text-sm text-[#1a1a2e]/80 hover:bg-white/60 transition-colors" data-testid="button-add-friend-dm">
                        <UserPlus className="w-4 h-4" /> Add Friend
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {friendsList.map((f: any) => (
                        <button key={f.id} onClick={() => openDm(f.id, f.displayName || f.email)}
                          className="w-full flex items-center gap-3 p-3.5 rounded-xl bg-white/50 border border-white/30 hover:bg-white/60 transition-all text-left" data-testid={`dm-friend-${f.id}`}>
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
                          <div className={cn("max-w-[80%] rounded-2xl px-4 py-3",
                            isAi ? "bg-purple-500/[0.08] border border-purple-500/[0.12]" :
                            isMe ? "bg-white/60 border border-white/30" :
                            "bg-white/50 border border-white/30"
                          )}>
                            {isAi && <p className="text-[9px] text-purple-400/50 font-medium mb-1">baalio Team AI</p>}
                            {!isMe && !isAi && <p className="text-[9px] text-[#1a1a2e]/60 font-medium mb-1">{dmFriendName}</p>}
                            <p className="text-[12px] text-[#1a1a2e]/90 leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                            <p className="text-[9px] text-[#1a1a2e]/45 mt-1.5">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
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
                      <textarea data-testid="input-dm" value={dmInput} onChange={(e) => setDmInput(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendDm(); } }}
                        placeholder={`Message ${dmFriendName}...`}
                        className="flex-1 bg-white/50 border border-white/30 rounded-xl px-3.5 py-2.5 text-sm text-[#1a1a2e]/95 placeholder:text-[#8a8aa5]/50 resize-none focus:outline-none focus:border-[#c0c0d0] transition-colors"
                        rows={1} />
                      <button data-testid="button-send-dm" onClick={sendDm} disabled={!dmInput.trim() || dmLoading || dmAiLoading}
                        className="w-10 h-10 rounded-xl bg-white/50 border border-white/30 hover:bg-white/60 disabled:opacity-30 flex items-center justify-center transition-colors shrink-0" title="Send message">
                        <Send className="w-4 h-4 text-[#1a1a2e]/80" />
                      </button>
                      <button data-testid="button-team-ai" onClick={sendTeamAi} disabled={!dmInput.trim() || dmLoading || dmAiLoading}
                        className="h-10 px-3 rounded-xl bg-gradient-to-r from-purple-600/80 to-blue-600/80 border border-purple-500/20 hover:from-purple-500 hover:to-blue-500 disabled:opacity-30 flex items-center gap-1.5 transition-all shrink-0" title="Ask Team AI">
                        <Sparkles className="w-3.5 h-3.5 text-[#1a1a2e]" />
                        <span className="text-[11px] text-[#1a1a2e] font-medium">AI</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === "progress_tracker" && (
            <div className="w-full px-5 sm:px-8 py-6 max-w-[1000px] mx-auto">
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-[#1a1a2e]" data-testid="text-progress-title">Progress Tracker</h2>
                <p className="text-[11px] text-[#1a1a2e]/60">Phase progression, category scores, and action items</p>
              </div>

              {capitalOsData ? (
                <>
                  <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-6 mb-6" data-testid="phase-progress-card">
                    <p className="text-xs text-[#1a1a2e]/70 mb-4">Phase Progress</p>
                    <div className="flex items-center gap-2 mb-4">
                      {capitalOsData.phase.phases.map((p, i) => (
                        <div key={p.key} className="flex-1 flex flex-col items-center">
                          <div className={cn(
                            "w-10 h-10 rounded-full flex items-center justify-center text-[11px] font-bold mb-2 transition-all",
                            p.completed ? "bg-[#3a3a5a] text-white" :
                            p.active ? "bg-[#3a3a5a]/20 text-[#3a3a5a] ring-2 ring-[#3a3a5a]/30" :
                            "bg-[#e0e0ea] text-[#1a1a2e]/40"
                          )}>
                            {p.completed ? <Check className="w-4 h-4" /> : i + 1}
                          </div>
                          <span className={cn("text-[10px] text-center", p.active ? "text-[#1a1a2e] font-semibold" : "text-[#1a1a2e]/50")}>{p.label}</span>
                        </div>
                      ))}
                    </div>
                    <div className="w-full h-2 rounded-full bg-[#e0e0ea] overflow-hidden mb-3">
                      <div className="h-full rounded-full bg-[#3a3a5a] transition-all" style={{ width: `${capitalOsData.phase.progress}%` }} />
                    </div>
                    <p className="text-[11px] text-[#1a1a2e]/70 leading-relaxed">{capitalOsData.phase.reasoning}</p>
                  </div>

                  <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-6 mb-6" data-testid="category-breakdown-card">
                    <div className="flex items-center justify-between mb-4">
                      <p className="text-xs text-[#1a1a2e]/70">Category Breakdown</p>
                      <span className="text-lg font-bold" style={{ color: capitalOsData.readiness.gradeColor }}>{capitalOsData.readiness.grade}</span>
                    </div>
                    <div className="space-y-4">
                      {capitalOsData.readiness.categories.map((cat, idx) => (
                        <div key={idx} data-testid={`category-${idx}`}>
                          <div className="flex items-center justify-between mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="text-[12px] text-[#1a1a2e]/85">{cat.name}</span>
                              <span className="text-[9px] text-[#1a1a2e]/40">{cat.weight}% weight</span>
                            </div>
                            <span className="text-[12px] font-mono text-[#1a1a2e]/70">{cat.score}/{cat.maxScore}</span>
                          </div>
                          <div className="w-full h-2 rounded-full bg-[#e0e0ea] overflow-hidden mb-1">
                            <div className="h-full rounded-full transition-all duration-700" style={{ width: `${(cat.score / cat.maxScore) * 100}%`, backgroundColor: cat.score / cat.maxScore >= 0.7 ? '#10b981' : cat.score / cat.maxScore >= 0.4 ? '#f59e0b' : '#ef4444' }} />
                          </div>
                          <p className="text-[10px] text-[#1a1a2e]/50 leading-relaxed">{cat.tooltip}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-6" data-testid="action-items-card">
                    <p className="text-xs text-[#1a1a2e]/70 mb-4">Action Items</p>
                    <div className="space-y-2">
                      {capitalOsData.readiness.categories
                        .filter(c => c.score / c.maxScore < 0.7)
                        .map((cat, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/50 border border-white/30">
                            <div className="w-6 h-6 rounded-full bg-[#e0e0ea] flex items-center justify-center text-[10px] font-mono text-[#1a1a2e]/60 shrink-0">{idx + 1}</div>
                            <div>
                              <p className="text-xs font-medium text-[#1a1a2e]/85">{cat.name}</p>
                              <p className="text-[11px] text-[#1a1a2e]/60 leading-relaxed mt-0.5">{cat.tooltip}</p>
                            </div>
                          </div>
                        ))}
                      {capitalOsData.phase.reasoning && (
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/50 border border-white/30">
                          <Target className="w-4 h-4 text-[#1a1a2e]/50 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-[#1a1a2e]/70 leading-relaxed">{capitalOsData.phase.reasoning}</p>
                        </div>
                      )}
                      {capitalOsData.exposure.reasoning && (
                        <div className="flex items-start gap-3 p-3 rounded-xl bg-white/50 border border-white/30">
                          <Gauge className="w-4 h-4 text-[#1a1a2e]/50 shrink-0 mt-0.5" />
                          <p className="text-[11px] text-[#1a1a2e]/70 leading-relaxed">{capitalOsData.exposure.reasoning}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : capitalOsLoading ? (
                <div className="flex items-center justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-[#1a1a2e]/50" /></div>
              ) : (
                <div className="rounded-2xl bg-white/70 backdrop-blur-md border border-white/40 p-8 text-center">
                  <Activity className="w-10 h-10 text-[#1a1a2e]/30 mx-auto mb-3" />
                  <p className="text-sm text-[#1a1a2e]/70">No progress data available</p>
                  <button onClick={fetchCapitalOsDashboard} className="mt-3 text-xs text-[#1a1a2e]/60 hover:text-[#1a1a2e]/80 underline">Load Data</button>
                </div>
              )}
            </div>
          )}

        </div>
      </main>

      {buddyOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setBuddyOpen(false)} />}

      {buddyOpen && (
        <aside className={cn(
          "w-[260px] flex flex-col shrink-0 relative z-40",
          "fixed right-0 h-full lg:static lg:flex"
        )} style={{ background: 'rgba(255,255,255,0.75)', backdropFilter: 'blur(20px)' }}>
          <div className="h-12 px-4 flex items-center justify-between border-b border-white/30 bg-white/50">
            <span className="text-[11px] font-bold text-[#1a1a2e]/70 uppercase tracking-widest">Buddy List</span>
            <button onClick={() => setBuddyOpen(false)} className="lg:hidden text-[#1a1a2e]/60 hover:text-[#1a1a2e]">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="h-10 px-4 flex items-center gap-2 border-b border-white/30">
            <button data-testid="button-new-chat"
              onClick={() => { clearChat(); setSelectedMentor(null); setMentorCleared(true); setBuddyOpen(false); setActiveTab("messages"); }}
              className="flex-1 h-7 text-[11px] rounded-lg bg-white/60 border border-white/30 hover:bg-white/70 text-[#1a1a2e]/80 font-medium transition-colors">
              + New Chat
            </button>
          </div>

          <div className="flex-1 overflow-y-auto" style={{ scrollbarWidth: 'thin' }}>
            <div className="border-b border-white/30">
              <button onClick={() => setBuddyGroups(prev => ({ ...prev, mentors: !prev.mentors }))}
                className="w-full h-9 flex items-center gap-2 px-4 hover:bg-white/50 text-left transition-colors" data-testid="buddy-group-mentors">
                <span className="text-[10px] text-[#1a1a2e]/45 font-mono w-3">{buddyGroups.mentors ? "▾" : "▸"}</span>
                <span className="text-[11px] font-bold text-[#1a1a2e]/75 uppercase tracking-widest">Mentors</span>
                <span className="text-[10px] text-[#1a1a2e]/45 ml-auto">(7/7)</span>
              </button>
              {buddyGroups.mentors && (
                <div className="pb-1">
                  {Object.entries(MENTOR_INFO).map(([key, mentor]) => {
                    const isActive = activeMentorKey === key;
                    return (
                      <button key={key} data-testid={`buddy-${key}`}
                        onClick={() => { setSelectedMentor(key); setMentorCleared(false); setActiveTab("messages"); setBuddyOpen(false); }}
                        className={cn("w-full h-11 flex items-center gap-3 px-4 text-left transition-all",
                          isActive ? "bg-white/50 border-l-2 border-l-[#8a8aa5]" : "hover:bg-white/50 border-l-2 border-l-transparent"
                        )}>
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
              <button onClick={() => setBuddyGroups(prev => ({ ...prev, friends: !prev.friends }))}
                className="w-full h-9 flex items-center gap-2 px-4 hover:bg-white/50 text-left transition-colors" data-testid="buddy-group-friends">
                <span className="text-[10px] text-[#1a1a2e]/45 font-mono w-3">{buddyGroups.friends ? "▾" : "▸"}</span>
                <span className="text-[11px] font-bold text-[#1a1a2e]/75 uppercase tracking-widest">Friends</span>
                <span className="text-[10px] text-[#1a1a2e]/45 ml-auto">({friendsList.length})</span>
              </button>
              {buddyGroups.friends && (
                <div className="pb-1">
                  <button onClick={() => setShowAddFriend(true)}
                    className="w-full h-9 flex items-center gap-3 px-4 hover:bg-white/50 text-left transition-colors" data-testid="button-add-friend">
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
                    <div key={f.friendshipId} className="group h-11 flex items-center gap-3 px-4 hover:bg-white/50 transition-colors cursor-pointer"
                      onClick={() => { openDm(f.id, f.displayName || f.email); setBuddyOpen(false); }}>
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
              <button onClick={() => setBuddyGroups(prev => ({ ...prev, offline: !prev.offline }))}
                className="w-full h-9 flex items-center gap-2 px-4 hover:bg-white/50 text-left transition-colors" data-testid="buddy-group-offline">
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
          </div>
        </aside>
      )}

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
                  <button onClick={() => sendFriendRequest(u.id)} className="h-7 px-3 rounded-lg bg-white/50 hover:bg-white/60 text-[10px] text-[#1a1a2e]/80 font-medium transition-colors" data-testid={`add-friend-${u.id}`}>Add</button>
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
