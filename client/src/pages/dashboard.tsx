import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/store";
import { useLocation } from "wouter";
import { Send, Plus, Paperclip, Loader2, ArrowDown, FileText, X, Menu, MessageCircle, RefreshCw, TrendingUp, UserPlus, Check, UserX, Search, AlertTriangle, Shield, ChevronRight, Target, BarChart3, BookOpen, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
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
  alerts: { severity: "red" | "yellow" | "gray"; title: string; explanation: string; impact: string; fix: string }[];
  actionPlan: string[];
  progress: { current: number; target: number };
  hasProfile: boolean;
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
  const [activeTab, setActiveTab] = useState<"dashboard" | "chat">("dashboard");
  const [friendsList, setFriendsList] = useState<any[]>([]);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [showAddFriend, setShowAddFriend] = useState(false);
  const [friendSearch, setFriendSearch] = useState("");
  const [friendSearchResults, setFriendSearchResults] = useState<any[]>([]);
  const [friendSearchLoading, setFriendSearchLoading] = useState(false);
  const [fundingData, setFundingData] = useState<FundingReadiness | null>(null);
  const [fundingLoading, setFundingLoading] = useState(false);
  const [expandedAlerts, setExpandedAlerts] = useState<Set<number>>(new Set());

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

  useEffect(() => {
    if (user) {
      fetchFriends();
      fetchFundingReadiness();
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
    if (score >= 85) return "text-green-400";
    if (score >= 70) return "text-yellow-400";
    if (score >= 50) return "text-amber-500";
    return "text-red-400";
  };

  const getScoreRingColor = (score: number) => {
    if (score >= 85) return "#22c55e";
    if (score >= 70) return "#eab308";
    if (score >= 50) return "#f59e0b";
    return "#ef4444";
  };

  const getStatusBg = (status: string) => {
    if (status === "ready") return "bg-green-500/10 border-green-500/20 text-green-400";
    if (status === "almost") return "bg-yellow-500/10 border-yellow-500/20 text-yellow-400";
    if (status === "needs_improvement") return "bg-amber-500/10 border-amber-500/20 text-amber-500";
    return "bg-red-500/10 border-red-500/20 text-red-400";
  };

  const getSeverityIcon = (severity: string) => {
    if (severity === "red") return <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />;
    if (severity === "yellow") return <AlertTriangle className="w-4 h-4 text-yellow-400 shrink-0" />;
    return <Info className="w-4 h-4 text-white/30 shrink-0" />;
  };

  const getSeverityBorder = (severity: string) => {
    if (severity === "red") return "border-l-red-500";
    if (severity === "yellow") return "border-l-yellow-500";
    return "border-l-white/10";
  };

  return (
    <div className="h-[100dvh] flex bg-[#000000] text-white">

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        "w-[260px] flex flex-col shrink-0 relative z-40",
        "fixed h-full md:static md:flex transition-transform duration-200 ease-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        "md:flex",
        !sidebarOpen && "hidden md:flex"
      )} style={{ background: '#0D0D0D' }}>
        <div className="h-11 px-4 flex items-center justify-between border-b border-white/[0.08] bg-[#111]">
          <div className="flex items-center gap-2.5">
            <div className="w-6 h-6 rounded-lg bg-[#E0E0E0] flex items-center justify-center">
              <span className="text-[10px] font-black text-[#0D0D0D]">X</span>
            </div>
            <span className="text-[13px] font-bold text-white/90 tracking-tight">MentXr® Buddy List</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} className="md:hidden text-white/40 hover:text-white/70">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="h-14 px-4 flex items-center gap-3 border-b border-white/[0.08] bg-[#0D0D0D]">
          <div className="relative shrink-0">
            <div className="w-9 h-9 rounded-lg bg-[#1A1A1A] border border-white/[0.1] flex items-center justify-center text-[11px] font-bold text-white/60">
              {(user.displayName || user.email).substring(0, 2).toUpperCase()}
            </div>
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-[#0D0D0D]" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[12px] font-semibold text-white/80 truncate">{user.displayName || user.email.split("@")[0]}</p>
            <p className="text-[10px] text-white/30 italic truncate">Mentorship On Demand</p>
          </div>
        </div>

        <div className="h-10 px-4 flex items-center gap-2 border-b border-white/[0.08] bg-[#0D0D0D]">
          <button
            data-testid="button-new-chat"
            onClick={() => { clearChat(); setSelectedMentor(null); setMentorCleared(true); setSidebarOpen(false); setActiveTab("chat"); }}
            className="flex-1 h-7 text-[11px] rounded-lg bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] active:bg-white/[0.04] text-white/60 font-medium transition-colors"
          >
            + New Chat
          </button>
        </div>

        <div className="flex-1 overflow-y-auto bg-[#0a0a0a]" style={{ scrollbarWidth: 'thin' }}>
          <div className="border-b border-white/[0.06]">
            <button
              onClick={() => setBuddyGroups(prev => ({ ...prev, mentors: !prev.mentors }))}
              className="w-full h-9 flex items-center gap-2 px-4 hover:bg-white/[0.03] text-left transition-colors"
              data-testid="buddy-group-mentors"
            >
              <span className="text-[10px] text-white/20 font-mono w-3">{buddyGroups.mentors ? "▾" : "▸"}</span>
              <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Mentors</span>
              <span className="text-[10px] text-white/20 ml-auto">(7/7)</span>
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
                          ? "bg-white/[0.08] border-l-2 border-l-[#E0E0E0]"
                          : "hover:bg-white/[0.04] border-l-2 border-l-transparent"
                      )}
                    >
                      <div className="relative shrink-0">
                        <div className={cn("w-8 h-8 rounded-lg border border-white/[0.1] flex items-center justify-center text-white text-[10px] font-bold", BOT_COLORS[key])}>{mentor.initials}</div>
                        <div className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full bg-green-500 border-2 border-[#0a0a0a]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={cn(
                          "text-[12px] font-semibold truncate leading-tight",
                          isActive ? "text-white" : "text-white/70"
                        )}>
                          {mentor.name}
                        </p>
                        <p className={cn(
                          "text-[10px] truncate leading-tight",
                          isActive ? "text-white/40" : "text-white/25"
                        )}>
                          {statusMessages[key] || mentor.tagline}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>

          <div className="border-b border-white/[0.06]">
            <button
              onClick={() => setBuddyGroups(prev => ({ ...prev, friends: !prev.friends }))}
              className="w-full h-9 flex items-center gap-2 px-4 hover:bg-white/[0.03] text-left transition-colors"
              data-testid="buddy-group-friends"
            >
              <span className="text-[10px] text-white/20 font-mono w-3">{buddyGroups.friends ? "▾" : "▸"}</span>
              <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Friends</span>
              <span className="text-[10px] text-white/20 ml-auto">({friendsList.length})</span>
            </button>
            {buddyGroups.friends && (
              <div className="pb-1">
                <button
                  onClick={() => setShowAddFriend(true)}
                  className="w-full h-9 flex items-center gap-3 px-4 hover:bg-white/[0.04] text-left transition-colors"
                  data-testid="button-add-friend"
                >
                  <UserPlus className="w-3.5 h-3.5 text-green-400/60" />
                  <span className="text-[11px] text-green-400/60 font-medium">Add Friend</span>
                </button>
                {pendingRequests.length > 0 && (
                  <div className="px-4 py-1">
                    <span className="text-[10px] text-amber-400/60 font-medium">{pendingRequests.length} pending request{pendingRequests.length > 1 ? "s" : ""}</span>
                  </div>
                )}
                {pendingRequests.map((req: any) => (
                  <div key={req.friendshipId} className="h-11 flex items-center gap-3 px-4 hover:bg-white/[0.04] transition-colors">
                    <div className="w-7 h-7 rounded-lg bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-[9px] font-bold text-amber-400">
                      {(req.displayName || "?").substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[11px] text-white/60 truncate">{req.displayName}</p>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => acceptFriend(req.friendshipId)} className="w-6 h-6 rounded-md bg-green-500/20 hover:bg-green-500/30 flex items-center justify-center" data-testid={`accept-friend-${req.id}`}>
                        <Check className="w-3 h-3 text-green-400" />
                      </button>
                      <button onClick={() => rejectFriend(req.friendshipId)} className="w-6 h-6 rounded-md bg-red-500/20 hover:bg-red-500/30 flex items-center justify-center" data-testid={`reject-friend-${req.id}`}>
                        <X className="w-3 h-3 text-red-400" />
                      </button>
                    </div>
                  </div>
                ))}
                {friendsList.map((f: any) => (
                  <div key={f.friendshipId} className="group h-11 flex items-center gap-3 px-4 hover:bg-white/[0.04] transition-colors">
                    <div className="relative shrink-0">
                      <div className="w-7 h-7 rounded-lg bg-[#1A1A1A] border border-white/[0.1] flex items-center justify-center text-[9px] font-bold text-white/60">
                        {(f.displayName || "?").substring(0, 2).toUpperCase()}
                      </div>
                      <div className="absolute -bottom-0.5 -right-0.5 w-2 h-2 rounded-full bg-green-500 border-2 border-[#0a0a0a]" />
                    </div>
                    <p className="text-[11px] text-white/60 truncate flex-1">{f.displayName}</p>
                    <button onClick={() => removeFriend(f.friendshipId)} className="hidden group-hover:flex w-5 h-5 rounded-md bg-red-500/10 hover:bg-red-500/20 items-center justify-center" data-testid={`remove-friend-${f.id}`}>
                      <UserX className="w-3 h-3 text-red-400/60" />
                    </button>
                  </div>
                ))}
                {friendsList.length === 0 && pendingRequests.length === 0 && (
                  <div className="h-9 flex items-center px-4">
                    <span className="text-[10px] text-white/15 italic">No friends yet</span>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-b border-white/[0.06]">
            <button
              onClick={() => setBuddyGroups(prev => ({ ...prev, offline: !prev.offline }))}
              className="w-full h-9 flex items-center gap-2 px-4 hover:bg-white/[0.03] text-left transition-colors"
              data-testid="buddy-group-offline"
            >
              <span className="text-[10px] text-white/20 font-mono w-3">{buddyGroups.offline ? "▾" : "▸"}</span>
              <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Recent Chats</span>
            </button>
            {buddyGroups.offline && (
              <div className="pb-1">
                {messages.length > 0 ? (
                  <div className="h-9 flex items-center gap-3 px-4 hover:bg-white/[0.04] cursor-pointer transition-colors">
                    <div className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                    <span className="text-[11px] text-white/40 truncate flex-1">{messages[0]?.content.substring(0, 35)}...</span>
                  </div>
                ) : (
                  <div className="h-9 flex items-center px-4">
                    <span className="text-[10px] text-white/15 italic">No recent conversations</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        <div className="h-11 px-4 flex items-center gap-3 border-t border-white/[0.08] bg-[#111]">
          <div className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
          <span className="text-[10px] text-white/40 flex-1 truncate">{user.displayName || user.email}</span>
          <button
            data-testid="button-logout"
            onClick={logout}
            className="h-7 text-[10px] px-3 rounded-lg bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] text-white/40 transition-colors"
          >
            Sign Off
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative bg-[#000000]">

        <header className="shrink-0 relative z-10 backdrop-blur-xl bg-black/80 border-b border-white/[0.08]">
          <div className="h-14 flex items-center justify-between px-4">
            <div className="flex items-center gap-3">
              <button
                data-testid="button-menu"
                onClick={() => setSidebarOpen(true)}
                className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/[0.06] transition-colors md:hidden"
              >
                <Menu className="w-5 h-5 text-white/60" />
              </button>
              <span className="relative w-5 h-5 flex items-center justify-center md:hidden">
                <span className="absolute inset-0 rounded-full bg-[#E0E0E0]/15 animate-ping" />
                <span className="relative w-2.5 h-2.5 rounded-full bg-[#E0E0E0] shadow-[0_0_6px_rgba(224,224,224,0.4)]" />
              </span>
            </div>
            <button data-testid="button-new-chat-header" onClick={() => { clearChat(); setSelectedMentor(null); setMentorCleared(true); setActiveTab("chat"); }} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/[0.06] transition-colors">
              <Plus className="w-5 h-5 text-white/50" />
            </button>
          </div>
          <div className="flex px-4">
            <button
              data-testid="tab-dashboard"
              onClick={() => setActiveTab("dashboard")}
              className={cn(
                "flex-1 py-2.5 text-[13px] font-semibold text-center transition-colors relative",
                activeTab === "dashboard" ? "text-white" : "text-white/40 hover:text-white/60"
              )}
            >
              <div className="flex items-center justify-center gap-1.5">
                <BarChart3 className="w-3.5 h-3.5" />
                Dashboard
              </div>
              {activeTab === "dashboard" && <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-white rounded-full" />}
            </button>
            <button
              data-testid="tab-chat"
              onClick={() => setActiveTab("chat")}
              className={cn(
                "flex-1 py-2.5 text-[13px] font-semibold text-center transition-colors relative",
                activeTab === "chat" ? "text-white" : "text-white/40 hover:text-white/60"
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
            <div className="max-w-2xl mx-auto w-full px-4 py-6 space-y-6">

              {fundingLoading ? (
                <div className="flex items-center justify-center py-20">
                  <Loader2 className="w-8 h-8 animate-spin text-white/20" />
                </div>
              ) : fundingData ? (
                <>
                  <div className="rounded-2xl border border-white/[0.08] bg-[#0D0D0D] p-6 sm:p-8" data-testid="funding-score-card">
                    <div className="flex flex-col items-center text-center">
                      <p className="text-[11px] font-semibold tracking-[0.2em] text-white/40 uppercase mb-6">Funding Readiness Score</p>
                      <div className="relative w-40 h-40 mb-6">
                        <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                          <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="8" />
                          <circle
                            cx="60" cy="60" r="52" fill="none"
                            stroke={getScoreRingColor(fundingData.score)}
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={`${(fundingData.score / 100) * 327} 327`}
                          />
                        </svg>
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className={cn("text-4xl font-bold font-mono", getScoreColor(fundingData.score))} data-testid="text-score">
                            {fundingData.score}
                          </span>
                          <span className="text-[11px] text-white/30">/ 100</span>
                        </div>
                      </div>
                      <div className={cn("inline-flex items-center gap-2 px-4 py-1.5 rounded-full border text-[12px] font-semibold", getStatusBg(fundingData.status))} data-testid="text-status">
                        {fundingData.status === "ready" && <CheckCircle2 className="w-3.5 h-3.5" />}
                        {fundingData.status === "almost" && <Target className="w-3.5 h-3.5" />}
                        {fundingData.status === "needs_improvement" && <AlertTriangle className="w-3.5 h-3.5" />}
                        {(fundingData.status === "high_risk" || fundingData.status === "incomplete") && <AlertCircle className="w-3.5 h-3.5" />}
                        {fundingData.statusLabel}
                      </div>
                      <div className="flex items-center gap-4 mt-4 text-[10px] text-white/25">
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-green-500" /> 85+ Ready</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-yellow-500" /> 70-84 Almost</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-amber-500" /> 50-69 Needs Work</span>
                        <span className="flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-red-500" /> Below 50 High Risk</span>
                      </div>
                    </div>
                  </div>

                  {fundingData.estimatedRange && (
                    <div className="rounded-2xl border border-white/[0.08] bg-[#0D0D0D] p-6" data-testid="funding-range-card">
                      <p className="text-[11px] font-semibold tracking-[0.2em] text-white/40 uppercase mb-3">Estimated Funding Range</p>
                      <p className="text-2xl sm:text-3xl font-bold font-mono text-white/90" data-testid="text-range">
                        ${fundingData.estimatedRange.min.toLocaleString()} – ${fundingData.estimatedRange.max.toLocaleString()}
                      </p>
                      <p className="text-[11px] text-white/25 mt-2">Based on current credit and risk profile. No guarantees.</p>
                    </div>
                  )}

                  {fundingData.alerts.length > 0 && (
                    <div className="rounded-2xl border border-white/[0.08] bg-[#0D0D0D] p-6" data-testid="risk-alerts-card">
                      <div className="flex items-center gap-2 mb-4">
                        <Shield className="w-4 h-4 text-white/40" />
                        <p className="text-[11px] font-semibold tracking-[0.2em] text-white/40 uppercase">Risk Alerts</p>
                        <span className="text-[10px] text-white/20 ml-auto">{fundingData.alerts.length} alert{fundingData.alerts.length > 1 ? "s" : ""}</span>
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
                              getSeverityBorder(alert.severity)
                            )}
                            data-testid={`alert-${idx}`}
                          >
                            <div className="flex items-start gap-3">
                              {getSeverityIcon(alert.severity)}
                              <div className="flex-1 min-w-0">
                                <p className="text-[13px] font-medium text-white/80">{alert.title}</p>
                                {expandedAlerts.has(idx) && (
                                  <div className="mt-2 space-y-1.5 text-[12px]">
                                    <p className="text-white/50">{alert.explanation}</p>
                                    <p className="text-white/35"><span className="text-white/50 font-medium">Impact:</span> {alert.impact}</p>
                                    <p className="text-green-400/70"><span className="text-green-400/90 font-medium">Fix:</span> {alert.fix}</p>
                                  </div>
                                )}
                              </div>
                              <ChevronRight className={cn("w-3.5 h-3.5 text-white/20 shrink-0 transition-transform", expandedAlerts.has(idx) && "rotate-90")} />
                            </div>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {fundingData.actionPlan.length > 0 && (
                    <div className="rounded-2xl border border-white/[0.08] bg-[#0D0D0D] p-6" data-testid="action-plan-card">
                      <div className="flex items-center gap-2 mb-4">
                        <Target className="w-4 h-4 text-white/40" />
                        <p className="text-[11px] font-semibold tracking-[0.2em] text-white/40 uppercase">Action Plan</p>
                      </div>
                      <div className="space-y-2">
                        {fundingData.actionPlan.map((step, idx) => (
                          <div key={idx} className="flex items-start gap-3 p-3 rounded-xl bg-white/[0.02]" data-testid={`action-step-${idx}`}>
                            <div className="w-6 h-6 rounded-full bg-white/[0.06] border border-white/[0.1] flex items-center justify-center text-[11px] font-mono text-white/40 shrink-0">
                              {idx + 1}
                            </div>
                            <p className="text-[13px] text-white/70 leading-relaxed pt-0.5">{step}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  <div className="rounded-2xl border border-white/[0.08] bg-[#0D0D0D] p-6" data-testid="progress-tracker-card">
                    <div className="flex items-center gap-2 mb-4">
                      <TrendingUp className="w-4 h-4 text-white/40" />
                      <p className="text-[11px] font-semibold tracking-[0.2em] text-white/40 uppercase">Funding Strength Progress</p>
                    </div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-[12px] text-white/50">Current: <span className={cn("font-mono font-bold", getScoreColor(fundingData.score))}>{fundingData.score}</span></span>
                      <span className="text-[12px] text-white/50">Target: <span className="font-mono font-bold text-green-400">{fundingData.progress.target}+</span></span>
                    </div>
                    <div className="w-full h-3 rounded-full bg-white/[0.06] overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-1000 ease-out"
                        style={{
                          width: `${Math.min(100, (fundingData.score / fundingData.progress.target) * 100)}%`,
                          background: `linear-gradient(90deg, ${getScoreRingColor(fundingData.score)}, ${getScoreRingColor(fundingData.score)}88)`
                        }}
                      />
                    </div>
                    <p className="text-[10px] text-white/20 mt-2">
                      {fundingData.score >= 85
                        ? "Your profile meets funding readiness criteria."
                        : `${fundingData.progress.target - fundingData.score} points needed to reach target.`
                      }
                    </p>
                  </div>

                  <div className="rounded-2xl border border-white/[0.08] bg-[#0D0D0D] p-6" data-testid="insights-card">
                    <div className="flex items-center gap-2 mb-4">
                      <BookOpen className="w-4 h-4 text-white/40" />
                      <p className="text-[11px] font-semibold tracking-[0.2em] text-white/40 uppercase">Insights</p>
                    </div>
                    <div className="space-y-3">
                      {INSIGHTS.map((insight, idx) => (
                        <div key={idx} className="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.04]" data-testid={`insight-${idx}`}>
                          <p className="text-[13px] font-medium text-white/70 mb-1">{insight.title}</p>
                          <p className="text-[12px] text-white/35 leading-relaxed">{insight.summary}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-center pb-4">
                    <button
                      onClick={fetchFundingReadiness}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] hover:bg-white/[0.08] text-[12px] text-white/40 hover:text-white/60 transition-colors"
                      data-testid="button-refresh-score"
                    >
                      <RefreshCw className="w-3.5 h-3.5" />
                      Refresh Score
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center justify-center py-20">
                  <AlertCircle className="w-8 h-8 text-white/20 mb-3" />
                  <p className="text-[14px] text-white/40">Unable to load dashboard</p>
                  <button onClick={fetchFundingReadiness} className="mt-3 text-[12px] text-white/30 hover:text-white/50 underline">
                    Try again
                  </button>
                </div>
              )}
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
                      <p className="text-white/40 text-sm text-center max-w-xs">{activeMentor.specialty} · {activeMentor.tagline}</p>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-2xl mb-4 bg-[#1A1A1A] border border-[#333] flex items-center justify-center relative">
                        <span className="absolute w-10 h-10 rounded-full bg-[#E0E0E0]/12 animate-ping" />
                        <span className="relative w-5 h-5 rounded-full bg-[#E0E0E0] shadow-[0_0_12px_rgba(224,224,224,0.4)]" />
                      </div>
                      <h2 className="text-xl font-bold mb-0.5">MentXr®</h2>
                      <p className="text-white/40 text-sm text-center max-w-xs">Mentorship On Demand</p>
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
                        className="text-left px-4 py-3 rounded-2xl border border-white/[0.08] bg-white/[0.02] hover:bg-white/[0.06] transition-all text-sm text-white/50 hover:text-white/70 flex items-center gap-3"
                      >
                        <span className="text-lg">{prompt.icon}</span>
                        <span>{prompt.text}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="divide-y divide-white/[0.06]">
                {messages.map((m) => {
                  const mentorData = m.role === 'assistant' && m.mentor ? MENTOR_INFO[m.mentor] : null;
                  const isUser = m.role === "user";
                  const posterName = isUser ? "You" : (mentorData ? mentorData.name : "MentXr® AI");
                  const posterHandle = isUser ? `@${user.displayName || user.email.split("@")[0]}` : (mentorData ? `@${m.mentor}` : "@mentxr");
                  const posterInitials = isUser ? null : (mentorData ? mentorData.initials : null);
                  const posterMentorKey = isUser ? null : (m.mentor || null);
                  const posterSpecialty = !isUser && mentorData ? mentorData.specialty : (!isUser ? "AI Mentor" : null);

                  return (
                    <div key={m.id} className="px-4 py-4 hover:bg-white/[0.02] transition-colors" data-testid={`post-${m.id}`}>
                      <div className="flex gap-3">
                        <div className="shrink-0">
                          {isUser ? (
                            <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#333] flex items-center justify-center text-[12px] font-bold text-[#999]">
                              {(user.displayName || user.email).substring(0, 2).toUpperCase()}
                            </div>
                          ) : posterInitials && posterMentorKey ? (
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold border border-white/10", BOT_COLORS[posterMentorKey])}>{posterInitials}</div>
                          ) : (
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center relative bg-[#1A1A1A]">
                              <span className="absolute w-5 h-5 rounded-full bg-[#E0E0E0]/15 animate-ping" />
                              <span className="relative w-2.5 h-2.5 rounded-full bg-[#E0E0E0] shadow-[0_0_8px_rgba(224,224,224,0.4)]" />
                            </div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[14px] font-bold text-white/90 truncate">{posterName}</span>
                            {!isUser && (
                              <span className="shrink-0">
                                <svg className="w-[14px] h-[14px] text-[#E0E0E0]" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                              </span>
                            )}
                            <span className="text-[13px] text-white/30 truncate">{posterHandle}</span>
                            <span className="text-white/15 text-[13px]">·</span>
                            <span className="text-[13px] text-white/30 shrink-0">{m.timestamp ? timeAgo(m.timestamp) : "now"}</span>
                          </div>

                          {posterSpecialty && (
                            <p className="text-[11px] text-[#E0E0E0]/40 mb-2">{posterSpecialty}</p>
                          )}

                          {m.attachment && (
                            <div className="inline-flex items-center gap-2 mb-2.5 px-3 py-1.5 rounded-xl bg-white/[0.04] border border-white/[0.08] text-[12px] text-white/40">
                              <FileText className="w-3.5 h-3.5" />
                              {m.attachment.replace("_", " ")}.pdf
                            </div>
                          )}

                          <div className="text-[14px] sm:text-[15px] leading-[1.6] text-white/80 whitespace-pre-wrap break-words">
                            {m.content.length > TRUNCATE_LENGTH && !expandedMessages.has(m.id) ? (
                              <>
                                {m.content.substring(0, TRUNCATE_LENGTH).trimEnd()}...
                                <button
                                  onClick={() => toggleExpand(m.id)}
                                  className="text-[#E0E0E0]/60 hover:text-[#E0E0E0] ml-1 text-[13px] font-medium"
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
                                    className="block text-[#E0E0E0]/40 hover:text-[#E0E0E0]/60 mt-1 text-[13px] font-medium"
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
                          <div className="w-10 h-10 rounded-xl flex items-center justify-center relative bg-[#1A1A1A]">
                            <span className="absolute w-5 h-5 rounded-full bg-[#E0E0E0]/15 animate-ping" />
                            <span className="relative w-2.5 h-2.5 rounded-full bg-[#E0E0E0] shadow-[0_0_8px_rgba(224,224,224,0.4)]" />
                          </div>
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-1.5 mb-1">
                          <span className="text-[14px] font-bold text-white/90">{activeMentor ? activeMentor.name : "MentXr® AI"}</span>
                          <span className="shrink-0">
                            <svg className="w-[14px] h-[14px] text-[#E0E0E0]" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 py-2">
                          <span className="w-2 h-2 bg-[#555] rounded-full animate-bounce"></span>
                          <span className="w-2 h-2 bg-[#555] rounded-full animate-bounce [animation-delay:0.15s]"></span>
                          <span className="w-2 h-2 bg-[#555] rounded-full animate-bounce [animation-delay:0.3s]"></span>
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
              className="w-9 h-9 rounded-full bg-white/10 border border-white/[0.08] backdrop-blur-lg flex items-center justify-center hover:bg-white/20 transition-colors shadow-lg"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="shrink-0 border-t border-white/[0.06] bg-black/90 backdrop-blur-xl px-3 sm:px-4 pb-3 sm:pb-4 pt-2 safe-area-pb">
          <div className="max-w-xl mx-auto">
            {activeMentor && hasMessages && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className={cn("w-5 h-5 rounded-full flex items-center justify-center text-white text-[8px] font-bold border border-white/10", activeMentorKey ? BOT_COLORS[activeMentorKey] : "")}>{activeMentor.initials}</div>
                <span className="text-[11px] text-white/30">Replying to <span className="text-[#E0E0E0]/60 font-medium">{activeMentor.name}</span></span>
                <button onClick={() => { setSelectedMentor(null); setMentorCleared(true); }} className="text-white/20 hover:text-white/50 ml-auto" data-testid="button-clear-mentor">
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
            {attachedFile && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="flex items-center gap-2 bg-white/[0.04] border border-white/[0.08] rounded-xl px-3 py-1.5 text-[12px] text-white/50">
                  <FileText className="w-3.5 h-3.5 text-[#888] shrink-0" />
                  <span className="truncate max-w-[180px]">{attachedFile.name}</span>
                  <button
                    onClick={() => setAttachedFile(null)}
                    className="text-white/30 hover:text-white/60 ml-1"
                    data-testid="button-remove-file"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}
            <div className="flex items-end gap-2">
              <div className="shrink-0">
                <div className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-[#333] flex items-center justify-center text-[10px] font-bold text-[#999]">
                  {(user.displayName || user.email).substring(0, 2).toUpperCase()}
                </div>
              </div>
              <div className="flex-1 relative flex items-end bg-white/[0.04] border border-white/[0.08] rounded-2xl px-4 py-2.5 focus-within:border-white/15 focus-within:bg-white/[0.06] transition-all">
                <textarea
                  ref={textareaRef}
                  data-testid="input-chat"
                  placeholder={activeMentor ? `Ask ${activeMentor.name} something...` : "What's on your mind?"}
                  value={input}
                  onChange={handleTextareaInput}
                  onKeyDown={handleKeyDown}
                  rows={1}
                  disabled={isLoading}
                  className="flex-1 bg-transparent text-[14px] text-white placeholder:text-white/25 resize-none outline-none max-h-[200px] leading-6 py-0.5"
                />
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.doc,.docx,.txt,.csv"
                    className="hidden"
                    data-testid="input-file-upload"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        setAttachedFile(file);
                      }
                      e.target.value = "";
                    }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    className="w-8 h-8 rounded-full text-white/25 hover:text-white/50 hover:bg-white/[0.06]"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isLoading}
                    title="Attach document"
                    data-testid="button-attach"
                  >
                    <Paperclip className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <button
                data-testid="button-send"
                onClick={handleSend}
                disabled={isLoading || (!input.trim() && !attachedFile)}
                className={cn(
                  "w-9 h-9 rounded-full flex items-center justify-center transition-all shrink-0",
                  (input.trim() || attachedFile) && !isLoading
                    ? "bg-[#E0E0E0] text-[#0D0D0D] hover:bg-white hover:scale-105"
                    : "bg-white/[0.06] text-white/20 cursor-not-allowed"
                )}
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Send className="w-4 h-4" />
                )}
              </button>
            </div>
            <p className="text-center text-[10px] text-white/15 mt-2">
              MentXr® AI can make mistakes. Verify important information.
            </p>
          </div>
        </div>
      </main>

      {showAddFriend && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm" onClick={() => setShowAddFriend(false)}>
          <div className="w-[360px] max-h-[500px] bg-[#111] border border-white/10 rounded-2xl shadow-2xl flex flex-col" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.08]">
              <span className="text-sm font-semibold text-white/80">Add Friend</span>
              <button onClick={() => { setShowAddFriend(false); setFriendSearch(""); setFriendSearchResults([]); }} className="text-white/30 hover:text-white/60" data-testid="close-add-friend">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 py-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
                <input
                  type="text"
                  value={friendSearch}
                  onChange={e => { setFriendSearch(e.target.value); searchFriends(e.target.value); }}
                  placeholder="Search by name..."
                  className="w-full h-10 pl-10 pr-4 rounded-xl bg-white/[0.06] border border-white/[0.08] text-sm text-white/80 placeholder:text-white/20 focus:outline-none focus:border-white/20"
                  autoFocus
                  data-testid="input-friend-search"
                />
              </div>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-3 max-h-[350px]">
              {friendSearchLoading && (
                <div className="flex items-center justify-center py-4">
                  <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
                </div>
              )}
              {!friendSearchLoading && friendSearch.length >= 2 && friendSearchResults.length === 0 && (
                <p className="text-center text-[12px] text-white/20 py-4">No users found</p>
              )}
              {friendSearchResults.map((u: any) => {
                const alreadyFriend = friendsList.some((f: any) => f.id === u.id);
                const alreadyPending = pendingRequests.some((p: any) => p.id === u.id);
                const hasDuplicate = friendSearchResults.filter((r: any) => r.displayName === u.displayName).length > 1;
                return (
                  <div key={u.id} className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-white/[0.04] transition-colors">
                    <div className="w-9 h-9 rounded-lg bg-[#1A1A1A] border border-white/[0.1] flex items-center justify-center text-[10px] font-bold text-white/50">
                      {(u.displayName || "?").substring(0, 2).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className="text-[13px] text-white/70 block truncate">{u.displayName}</span>
                      {hasDuplicate && <span className="text-[10px] text-white/25 block truncate">#{u.id}</span>}
                    </div>
                    {alreadyFriend ? (
                      <span className="text-[10px] text-green-400/60 px-2 py-1 rounded-lg bg-green-500/10">Friends</span>
                    ) : alreadyPending ? (
                      <span className="text-[10px] text-amber-400/60 px-2 py-1 rounded-lg bg-amber-500/10">Pending</span>
                    ) : (
                      <button
                        onClick={() => sendFriendRequest(u.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/[0.08] hover:bg-white/[0.12] text-[11px] text-white/60 hover:text-white/80 transition-colors"
                        data-testid={`send-request-${u.id}`}
                      >
                        <UserPlus className="w-3 h-3" />
                        Add
                      </button>
                    )}
                  </div>
                );
              })}
              {friendSearch.length < 2 && (
                <p className="text-center text-[11px] text-white/15 py-4">Type at least 2 characters to search</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
