import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/store";
import { useLocation } from "wouter";
import { Send, Plus, LogOut, Paperclip, Loader2, ArrowDown, FileText, X, Menu, Bot, Heart, MessageCircle, Share2, Bookmark, Globe, RefreshCw, ExternalLink, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import grantCardoneAvatar from "@/assets/mentor-grant-cardone.png";
import warrenBuffettAvatar from "@/assets/mentor-warren.png";
import garyVeeAvatar from "@/assets/mentor-gary.png";
import oprahWinfreyAvatar from "@/assets/mentor-oprah.png";
import saraBlakelyAvatar from "@/assets/mentor-sara.png";
import nineteenKeysAvatar from "@/assets/mentor-19keys.png";
import charlestonWhiteAvatar from "@/assets/mentor-charleston-white.png";

const MENTOR_INFO: Record<string, { name: string; avatar: string; tagline: string; specialty: string }> = {
  grant_cardone: { name: "Grant Cardone", avatar: grantCardoneAvatar, tagline: "10X Everything", specialty: "Sales & Real Estate" },
  warren_buffett: { name: "Warren Buffett", avatar: warrenBuffettAvatar, tagline: "The Oracle of Omaha", specialty: "Investing & Value" },
  gary_vee: { name: "Gary Vaynerchuk", avatar: garyVeeAvatar, tagline: "Hustle & Heart", specialty: "Marketing & Social Media" },
  oprah_winfrey: { name: "Oprah Winfrey", avatar: oprahWinfreyAvatar, tagline: "Live Your Best Life", specialty: "Leadership & Growth" },
  sara_blakely: { name: "Sara Blakely", avatar: saraBlakelyAvatar, tagline: "Fearless Innovation", specialty: "Entrepreneurship & Product" },
  nineteen_keys: { name: "19Keys", avatar: nineteenKeysAvatar, tagline: "Unlock Your Potential", specialty: "Mindset & Financial Literacy" },
  charleston_white: { name: "Charleston White", avatar: charlestonWhiteAvatar, tagline: "Real Talk, Real Change", specialty: "Youth Advocacy & Transformation" },
};

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
    community: true,
    offline: false,
  });
  const [likedMessages, setLikedMessages] = useState<Set<number>>(new Set());
  const [savedMessages, setSavedMessages] = useState<Set<number>>(new Set());
  const [expandedMessages, setExpandedMessages] = useState<Set<number>>(new Set());
  const [openComments, setOpenComments] = useState<Set<number>>(new Set());
  const [commentsData, setCommentsData] = useState<Record<number, any[]>>({});
  const [commentInputs, setCommentInputs] = useState<Record<number, string>>({});
  const [commentLoading, setCommentLoading] = useState<Set<number>>(new Set());
  const [feedItems, setFeedItems] = useState<any[]>([]);
  const [feedLoading, setFeedLoading] = useState(false);
  const feedBufferRef = useRef<any[]>([]);
  const feedIndexRef = useRef(0);
  const [liveFeedItems, setLiveFeedItems] = useState<any[]>([]);
  const influencerBufferRef = useRef<any[]>([]);
  const influencerIndexRef = useRef(0);
  const [platformStats, setPlatformStats] = useState<{ totalUsers: number; activeNow: number }>({ totalUsers: 0, activeNow: 0 });
  const [communityPosts, setCommunityPosts] = useState<any[]>([]);
  const [postLikes, setPostLikes] = useState<Set<number>>(new Set());
  const [lastSeenPostId, setLastSeenPostId] = useState<number>(0);
  const [postCommentCounts] = useState<Map<number, number>>(new Map());
  const [activeTab, setActiveTab] = useState<"feed" | "chat">("feed");

  const TRUNCATE_LENGTH = 280;

  const toggleExpand = (id: number) => {
    setExpandedMessages(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleComments = async (messageId: number) => {
    const next = new Set(openComments);
    if (next.has(messageId)) {
      next.delete(messageId);
    } else {
      next.add(messageId);
      if (!commentsData[messageId]) {
        try {
          const res = await fetch(`/api/comments/${messageId}`, { credentials: "include" });
          if (res.ok) {
            const data = await res.json();
            setCommentsData(prev => ({ ...prev, [messageId]: data }));
          }
        } catch (err) {
          console.error("Failed to load comments", err);
        }
      }
    }
    setOpenComments(next);
  };

  const submitComment = async (messageId: number) => {
    const text = (commentInputs[messageId] || "").trim();
    if (!text) return;

    setCommentLoading(prev => { const next = new Set(prev); next.add(messageId); return next; });
    setCommentInputs(prev => ({ ...prev, [messageId]: "" }));

    try {
      const res = await fetch(`/api/comments/${messageId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ content: text }),
      });
      if (res.ok) {
        const { userComment, aiReply } = await res.json();
        setCommentsData(prev => {
          const existing = prev[messageId] || [];
          const updated = [...existing, userComment];
          if (aiReply) updated.push(aiReply);
          return { ...prev, [messageId]: updated };
        });
      }
    } catch (err) {
      console.error("Failed to post comment", err);
      toast({ title: "Error", description: "Failed to post comment", variant: "destructive" });
    } finally {
      setCommentLoading(prev => { const next = new Set(prev); next.delete(messageId); return next; });
    }
  };

  const fetchPosts = async () => {
    try {
      const res = await fetch("/api/posts", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const posts = data.posts || [];
        posts.forEach((p: any) => {
          if (!postCommentCounts.has(p.id)) {
            postCommentCounts.set(p.id, Math.floor(Math.random() * 15));
          }
        });
        if (posts.length > 0 && posts[0].id !== lastSeenPostId) {
          setLastSeenPostId(posts[0].id);
        }
        setCommunityPosts(posts);
      }
    } catch (err) {
      console.error("Failed to fetch posts", err);
    }
  };

  const fetchFeed = async (showLoading = true) => {
    if (showLoading) setFeedLoading(true);
    try {
      const res = await fetch("/api/feed?limit=200", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const items = data.items || [];
        setFeedItems(items);
        if (feedBufferRef.current.length === 0 && items.length > 0) {
          const shuffled = [...items].sort(() => Math.random() - 0.5);
          feedBufferRef.current = shuffled;
          feedIndexRef.current = 0;
          setLiveFeedItems(shuffled.slice(0, 3).map((item: any, i: number) => ({ ...item, _liveId: `live-${Date.now()}-${i}` })));
          feedIndexRef.current = 3;
        } else if (items.length > 0) {
          const shuffled = [...items].sort(() => Math.random() - 0.5);
          feedBufferRef.current = shuffled;
        }
      }
    } catch (err) {
      console.error("Failed to fetch feed", err);
    } finally {
      setFeedLoading(false);
    }
  };

  const fetchInfluencerPosts = async () => {
    try {
      const res = await fetch("/api/influencer-posts", { credentials: "include" });
      if (res.ok) {
        const data = await res.json();
        const posts = (data.posts || []).map((p: any) => ({
          id: p.id,
          _liveId: `inf-${p.id}`,
          title: p.content.substring(0, 80) + (p.content.length > 80 ? "..." : ""),
          description: p.content,
          link: "#",
          image: p.image,
          source: p.influencerName,
          category: p.category,
          contentType: p.contentType,
          publishedAt: p.timestamp,
          author: p.handle,
          mentor: null,
          isInfluencer: true,
          verified: p.verified,
          followers: p.followers,
          handle: p.handle,
        }));
        influencerBufferRef.current = posts;
      }
    } catch (err) {
      console.error("Failed to fetch influencer posts", err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchFeed();
      fetchPosts();
      fetchInfluencerPosts();
      fetch("/api/stats").then(r => r.json()).then(setPlatformStats).catch(() => {});
    }
  }, [user]);

  useEffect(() => {
    if (!user) return;
    let dripToggle = 0;
    const dripInterval = setInterval(() => {
      let nextItem: any = null;
      if (dripToggle % 2 === 0 && influencerBufferRef.current.length > 0) {
        const idx = influencerIndexRef.current % influencerBufferRef.current.length;
        nextItem = { ...influencerBufferRef.current[idx], _liveId: `inf-${Date.now()}-${idx}` };
        influencerIndexRef.current = idx + 1;
      } else if (feedBufferRef.current.length > 0) {
        const idx = feedIndexRef.current % feedBufferRef.current.length;
        nextItem = { ...feedBufferRef.current[idx], _liveId: `live-${Date.now()}-${idx}` };
        feedIndexRef.current = idx + 1;
      } else if (influencerBufferRef.current.length > 0) {
        const idx = influencerIndexRef.current % influencerBufferRef.current.length;
        nextItem = { ...influencerBufferRef.current[idx], _liveId: `inf-${Date.now()}-${idx}` };
        influencerIndexRef.current = idx + 1;
      }
      dripToggle++;
      if (nextItem) {
        setLiveFeedItems(prev => [nextItem, ...prev].slice(0, 50));
      }
    }, 2000);
    const feedRefresh = setInterval(() => fetchFeed(false), 60 * 1000);
    const influencerRefresh = setInterval(() => fetchInfluencerPosts(), 5 * 1000);
    const postsInterval = setInterval(() => fetchPosts(), 2 * 1000);
    const statsInterval = setInterval(() => {
      fetch("/api/stats").then(r => r.json()).then(setPlatformStats).catch(() => {});
    }, 10 * 1000);
    return () => { clearInterval(dripInterval); clearInterval(feedRefresh); clearInterval(influencerRefresh); clearInterval(postsInterval); clearInterval(statsInterval); };
  }, [user]);

  const lastMentorMsg = [...messages].reverse().find(m => m.role === 'assistant' && m.mentor);
  const activeMentorKey = selectedMentor !== null ? selectedMentor : (mentorCleared ? null : (lastMentorMsg?.mentor || null));
  const activeMentor = activeMentorKey ? MENTOR_INFO[activeMentorKey] : null;
  const fileInputRef = useRef<HTMLInputElement>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const storiesRef = useRef<HTMLDivElement>(null);
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

  const toggleLike = (id: number) => {
    setLikedMessages(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSave = (id: number) => {
    setSavedMessages(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  if (!user) return null;

  const hasMessages = messages.length > 0;

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
          <button
            onClick={() => { fetchInfluencerPosts(); fetchFeed(); }}
            className="h-7 w-7 flex items-center justify-center rounded-lg bg-white/[0.06] border border-white/[0.08] hover:bg-white/[0.1] active:bg-white/[0.04] text-white/40 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
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
                    grant_cardone: "10X or nothing! Let's close deals",
                    warren_buffett: "Reading annual reports...",
                    gary_vee: "Creating content rn",
                    oprah_winfrey: "Living my best life",
                    sara_blakely: "Building the next big thing",
                    nineteen_keys: "Knowledge is the key",
                    charleston_white: "Speaking truth to power",
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
                        <img
                          src={mentor.avatar}
                          alt={mentor.name}
                          className="w-8 h-8 rounded-lg border border-white/[0.1] object-cover"
                        />
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
              onClick={() => setBuddyGroups(prev => ({ ...prev, community: !prev.community }))}
              className="w-full h-9 flex items-center gap-2 px-4 hover:bg-white/[0.03] text-left transition-colors"
              data-testid="buddy-group-community"
            >
              <span className="text-[10px] text-white/20 font-mono w-3">{buddyGroups.community ? "▾" : "▸"}</span>
              <span className="text-[11px] font-bold text-white/50 uppercase tracking-widest">Community</span>
              <span className="text-[10px] text-white/20 ml-auto">({platformStats.activeNow})</span>
            </button>
            {buddyGroups.community && (
              <div className="pb-1">
                <div className="h-9 flex items-center gap-3 px-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500 shrink-0" />
                  <span className="text-[11px] text-white/50">{platformStats.activeNow} online</span>
                </div>
                <div className="h-9 flex items-center gap-3 px-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500 shrink-0" />
                  <span className="text-[11px] text-white/30">{Math.floor(platformStats.totalUsers * 0.3)} idle</span>
                </div>
                <div className="h-9 flex items-center gap-3 px-4">
                  <div className="w-2.5 h-2.5 rounded-full bg-white/20 shrink-0" />
                  <span className="text-[11px] text-white/20">{platformStats.totalUsers - platformStats.activeNow - Math.floor(platformStats.totalUsers * 0.3)} offline</span>
                </div>
                <div className="h-8 flex items-center px-4">
                  <span className="text-[10px] text-white/15 italic">{platformStats.totalUsers.toLocaleString()} total members</span>
                </div>
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
              <img src="/logo.png" alt="MentXr" className="w-5 h-5 rounded-md md:hidden" />
              {platformStats.activeNow > 0 && (
                <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 border border-green-500/20">
                  <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-[11px] text-green-400/80 font-medium">{platformStats.activeNow} active</span>
                </div>
              )}
            </div>
            <button data-testid="button-new-chat-header" onClick={() => { clearChat(); setSelectedMentor(null); setMentorCleared(true); setActiveTab("chat"); }} className="w-9 h-9 flex items-center justify-center rounded-xl hover:bg-white/[0.06] transition-colors">
              <Plus className="w-5 h-5 text-white/50" />
            </button>
          </div>
          <div className="flex px-4">
            <button
              data-testid="tab-feed"
              onClick={() => setActiveTab("feed")}
              className={cn(
                "flex-1 py-2.5 text-[13px] font-semibold text-center transition-colors relative",
                activeTab === "feed" ? "text-white" : "text-white/40 hover:text-white/60"
              )}
            >
              <div className="flex items-center justify-center gap-1.5">
                <Globe className="w-3.5 h-3.5" />
                Feed
              </div>
              {activeTab === "feed" && <div className="absolute bottom-0 left-1/4 right-1/4 h-[2px] bg-white rounded-full" />}
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
                Chat
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
          {activeTab === "feed" ? (
            <div className="max-w-xl mx-auto w-full">
              <div className="px-4 pt-5 pb-3">
                <div
                  ref={storiesRef}
                  className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <button
                    onClick={() => { setSelectedMentor(null); setMentorCleared(true); setActiveTab("chat"); }}
                    className="flex flex-col items-center gap-1.5 shrink-0"
                    data-testid="button-mentor-default"
                  >
                    <div className={cn(
                      "w-16 h-16 rounded-full p-[2px]",
                      !activeMentorKey ? "bg-[#E0E0E0]" : "bg-white/10"
                    )}>
                      <div className="w-full h-full rounded-full bg-[#0D0D0D] flex items-center justify-center">
                        <Bot className="w-6 h-6 text-[#E0E0E0]/60" />
                      </div>
                    </div>
                    <p className="text-[11px] text-white/50 font-medium w-16 text-center truncate">MentXr®</p>
                  </button>

                  {Object.entries(MENTOR_INFO).map(([key, mentor]) => (
                    <button
                      key={key}
                      onClick={() => { setSelectedMentor(key); setMentorCleared(false); setActiveTab("chat"); }}
                      className="flex flex-col items-center gap-1.5 shrink-0"
                      data-testid={`button-mentor-${key}`}
                    >
                      <div className={cn(
                        "w-16 h-16 rounded-full p-[2px]",
                        activeMentorKey === key ? "bg-[#E0E0E0]" : "bg-white/10"
                      )}>
                        <img src={mentor.avatar} alt={mentor.name} className="w-full h-full rounded-full object-cover" />
                      </div>
                      <p className="text-[11px] text-white/50 font-medium w-16 text-center truncate">{mentor.name.split(" ")[0]}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/[0.06]" />

              <div className="px-4 mt-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-3.5 h-3.5 text-[#E0E0E0]/50" />
                      <span className="text-[13px] font-semibold text-white/60">Live Feed</span>
                      <div className="flex items-center gap-1.5 ml-1">
                        <div className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse" />
                        <span className="text-[10px] text-red-400/60">LIVE</span>
                      </div>
                    </div>
                    <span className="text-[10px] text-white/20">{liveFeedItems.length} posts · refreshing every 2s</span>
                  </div>

                  {feedLoading && liveFeedItems.length === 0 ? (
                    <div className="flex items-center justify-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin text-white/15" />
                    </div>
                  ) : liveFeedItems.length > 0 ? (
                    <div className="space-y-2.5">
                      {liveFeedItems.map((item: any, idx: number) => (
                        <div
                          key={item._liveId || item.id || idx}
                          onClick={() => { if (item.link && item.link !== "#") window.open(item.link, "_blank"); }}
                          className={cn(
                            "block rounded-2xl border overflow-hidden group transition-all animate-[feedSlideIn_0.4s_ease-out]",
                            item.link && item.link !== "#" ? "cursor-pointer" : "cursor-default",
                            item.mentor
                              ? "border-amber-500/20 bg-amber-500/[0.03] hover:bg-amber-500/[0.06]"
                              : item.isInfluencer
                              ? "border-purple-500/10 bg-white/[0.02] hover:bg-white/[0.04]"
                              : "border-white/[0.06] bg-white/[0.02] hover:bg-white/[0.05]"
                          )}
                          data-testid={`feed-item-${idx}`}
                        >
                          {item.image && (
                            <div className="relative w-full h-36 bg-[#111] overflow-hidden">
                              <img
                                src={item.image}
                                alt={item.title}
                                className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-300"
                                onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                              />
                              {item.contentType === "video" && (
                                <div className="absolute inset-0 flex items-center justify-center bg-black/30 group-hover:bg-black/20 transition-colors">
                                  <div className="w-10 h-10 rounded-full bg-white/90 flex items-center justify-center">
                                    <div className="w-0 h-0 border-t-[6px] border-t-transparent border-l-[10px] border-l-black border-b-[6px] border-b-transparent ml-0.5" />
                                  </div>
                                </div>
                              )}
                            </div>
                          )}
                          <div className="p-3.5">
                            {item.isInfluencer && (
                              <div className="flex items-center gap-2 mb-2">
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                                  {item.source?.split(" ").map((w: string) => w[0]).join("").substring(0, 2)}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center gap-1">
                                    <span className="text-[13px] font-semibold text-white/90 truncate">{item.source}</span>
                                    {item.verified && <span className="text-blue-400 text-[11px]">✓</span>}
                                  </div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-[10px] text-white/30">{item.handle}</span>
                                    <span className="text-white/10 text-[8px]">·</span>
                                    <span className="text-[10px] text-white/25">{item.followers} followers</span>
                                  </div>
                                </div>
                                <span className="text-[9px] text-white/20">{timeAgo(item.publishedAt)}</span>
                              </div>
                            )}
                            <div className="flex items-center gap-2 mb-1.5">
                              {item.mentor && (
                                <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wide bg-gradient-to-r from-amber-500/25 to-orange-500/25 text-amber-400 border border-amber-500/20">
                                  ✦ Mentor
                                </span>
                              )}
                              <span className={cn(
                                "px-2 py-0.5 rounded-full text-[9px] font-medium uppercase tracking-wide",
                                item.contentType === "video" ? "bg-red-500/20 text-red-400" :
                                item.contentType === "photo" ? "bg-blue-500/20 text-blue-400" :
                                "bg-white/[0.06] text-white/35"
                              )}>
                                {item.contentType === "video" ? "▶ video" : item.contentType === "photo" ? "📷 photo" : "text"}
                              </span>
                              {!item.isInfluencer && (
                                <>
                                  <span className="text-[10px] text-white/20">{item.source}</span>
                                  <span className="text-white/10 text-[10px]">·</span>
                                  <span className="text-[10px] text-white/20">{timeAgo(item.publishedAt)}</span>
                                </>
                              )}
                              <span className="px-1.5 py-0.5 rounded text-[8px] text-white/20 bg-white/[0.03]">{item.category}</span>
                            </div>
                            {item.isInfluencer ? (
                              <p className="text-[13px] text-white/75 leading-relaxed">{item.description}</p>
                            ) : (
                              <>
                                <h3 className="text-[14px] font-semibold text-white/85 leading-snug mb-1 group-hover:text-white transition-colors">{item.title}</h3>
                                {item.description && (
                                  <p className="text-[12px] text-white/40 leading-relaxed line-clamp-2">{item.description}</p>
                                )}
                              </>
                            )}
                            {!item.isInfluencer && (
                              <div className="flex items-center gap-1.5 mt-2 text-[10px] text-white/20">
                                <ExternalLink className="w-2.5 h-2.5" />
                                <span>{item.contentType === "video" ? "Watch video" : "Read full article"}</span>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : null}

                {communityPosts.length > 0 && (
                  <div className="divide-y divide-white/[0.06] border-t border-white/[0.06] mt-4">
                    <div className="px-4 py-2.5 flex items-center justify-between bg-white/[0.02]">
                      <div className="flex items-center gap-2">
                        <Globe className="w-3.5 h-3.5 text-white/40" />
                        <span className="text-[12px] font-semibold text-white/50">Community Feed</span>
                        <span className="text-[10px] text-white/20">({communityPosts.length} posts)</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
                        <span className="text-[10px] text-green-400/60">Live · refreshing every 2s</span>
                      </div>
                    </div>
                    {communityPosts.map((p: any, idx: number) => {
                      const nameFromEmail = p.userEmail?.split("@")[0] || "user";
                      const displayName = nameFromEmail.split(".").map((s: string) => s.charAt(0).toUpperCase() + s.slice(1)).join(" ");
                      const handle = `@${nameFromEmail.replace(".", "")}`;
                      const initials = displayName.split(" ").map((s: string) => s[0]).join("").substring(0, 2).toUpperCase();
                      const isLikedPost = postLikes.has(p.id);
                      const likeCount = p.likes + (isLikedPost ? 1 : 0);
                      const commentCount = postCommentCounts.get(p.id) || 0;
                      const isNew = idx === 0 && p.id === lastSeenPostId;

                      return (
                        <div
                          key={`post-${p.id}`}
                          className={cn(
                            "px-4 py-4 hover:bg-white/[0.02] transition-all duration-500",
                            isNew && "bg-white/[0.04]"
                          )}
                          data-testid={`community-post-welcome-${p.id}`}
                          style={isNew ? { animation: "fadeIn 0.5s ease-out" } : undefined}
                        >
                          <div className="flex gap-3">
                            <div className="shrink-0">
                              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#2A2A2A] to-[#1A1A1A] border border-white/[0.08] flex items-center justify-center text-[11px] font-bold text-white/50">
                                {initials}
                              </div>
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 mb-0.5">
                                <span className="text-[14px] font-bold text-white/90 truncate">{displayName}</span>
                                <span className="text-[13px] text-white/30 truncate">{handle}</span>
                                <span className="text-white/15 text-[13px]">·</span>
                                <span className="text-[13px] text-white/30 shrink-0">{timeAgo(p.timestamp)}</span>
                                {isNew && <span className="px-1.5 py-0.5 rounded-full bg-green-500/20 text-[9px] text-green-400 font-medium animate-pulse">NEW</span>}
                              </div>
                              <p className="text-[14px] text-white/80 leading-relaxed whitespace-pre-wrap mb-3">{p.content}</p>
                              <div className="flex items-center gap-6 -ml-2">
                                <button
                                  onClick={() => setPostLikes(prev => { const next = new Set(prev); if (next.has(p.id)) next.delete(p.id); else next.add(p.id); return next; })}
                                  className={cn("flex items-center gap-1.5 px-2 py-1.5 rounded-full text-[13px] transition-colors", isLikedPost ? "text-red-400 hover:text-red-300" : "text-white/30 hover:text-red-400/70 hover:bg-red-500/5")}
                                >
                                  <Heart className={cn("w-4 h-4", isLikedPost && "fill-current")} />
                                  <span>{likeCount}</span>
                                </button>
                                <div className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-[13px] text-white/30">
                                  <MessageCircle className="w-4 h-4" />
                                  <span>{commentCount}</span>
                                </div>
                                <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-[13px] text-white/30 hover:text-blue-400/70 hover:bg-blue-500/5 transition-colors">
                                  <Share2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="max-w-xl mx-auto w-full">
              <div className="px-4 pt-4 pb-2">
                <div
                  className="flex gap-3 overflow-x-auto pb-3 scrollbar-hide"
                  style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                >
                  <button
                    onClick={() => { setSelectedMentor(null); setMentorCleared(true); }}
                    className="flex flex-col items-center gap-1.5 shrink-0"
                    data-testid="button-mentor-default-chat"
                  >
                    <div className={cn(
                      "w-14 h-14 rounded-full p-[2px]",
                      !activeMentorKey ? "bg-[#E0E0E0]" : "bg-white/10"
                    )}>
                      <div className="w-full h-full rounded-full bg-[#0D0D0D] flex items-center justify-center">
                        <Bot className="w-5 h-5 text-[#E0E0E0]/60" />
                      </div>
                    </div>
                    <p className="text-[10px] text-white/40 font-medium w-14 text-center truncate">MentXr®</p>
                  </button>

                  {Object.entries(MENTOR_INFO).map(([key, mentor]) => (
                    <button
                      key={key}
                      onClick={() => { setSelectedMentor(key); setMentorCleared(false); }}
                      className="flex flex-col items-center gap-1.5 shrink-0"
                      data-testid={`button-mentor-chat-${key}`}
                    >
                      <div className={cn(
                        "w-14 h-14 rounded-full p-[2px]",
                        activeMentorKey === key ? "bg-[#E0E0E0]" : "bg-white/10"
                      )}>
                        <img src={mentor.avatar} alt={mentor.name} className="w-full h-full rounded-full object-cover" />
                      </div>
                      <p className="text-[10px] text-white/40 font-medium w-14 text-center truncate">{mentor.name.split(" ")[0]}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div className="border-t border-white/[0.06]" />

              {!hasMessages && (
                <div className="px-4 py-8 flex flex-col items-center">
                  {activeMentor ? (
                    <>
                      <div className="w-20 h-20 rounded-full p-[2px] bg-[#E0E0E0] mb-4">
                        <img src={activeMentor.avatar} alt={activeMentor.name} className="w-full h-full rounded-full object-cover" />
                      </div>
                      <h2 className="text-xl font-bold mb-0.5">{activeMentor.name}</h2>
                      <p className="text-white/40 text-sm">{activeMentor.tagline}</p>
                      <span className="text-[11px] text-white/25 mt-1 px-3 py-1 rounded-full bg-white/[0.04] border border-white/[0.06]">{activeMentor.specialty}</span>
                    </>
                  ) : (
                    <>
                      <div className="w-20 h-20 rounded-2xl mb-4 overflow-hidden bg-[#1A1A1A] border border-[#333] flex items-center justify-center">
                        <img src="/logo.png" alt="MentXr" className="w-12 h-12 rounded-xl" />
                      </div>
                      <h2 className="text-xl font-bold mb-0.5">MentXr®</h2>
                      <p className="text-white/40 text-sm text-center max-w-xs">Mentorship On Demand</p>
                    </>
                  )}

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mt-8 max-w-md w-full">
                    {[
                      { text: "Help me build my business strategy", icon: "💡" },
                      { text: "How do I scale to 7 figures?", icon: "📈" },
                      { text: "Guide me on personal branding", icon: "🎯" },
                      { text: "What should I invest in right now?", icon: "💰" },
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
                  const posterAvatar = isUser ? null : (mentorData ? mentorData.avatar : null);
                  const posterSpecialty = !isUser && mentorData ? mentorData.specialty : (!isUser ? "AI Mentor" : null);
                  const isLiked = likedMessages.has(m.id);
                  const isSaved = savedMessages.has(m.id);

                  return (
                    <div key={m.id} className="px-4 py-4 hover:bg-white/[0.02] transition-colors" data-testid={`post-${m.id}`}>
                      <div className="flex gap-3">
                        <div className="shrink-0">
                          {isUser ? (
                            <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#333] flex items-center justify-center text-[12px] font-bold text-[#999]">
                              {(user.displayName || user.email).substring(0, 2).toUpperCase()}
                            </div>
                          ) : posterAvatar ? (
                            <img src={posterAvatar} alt={posterName} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                          ) : (
                            <div className="w-10 h-10 rounded-xl overflow-hidden">
                              <img src="/logo.png" alt="MentXr" className="w-full h-full" />
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

                          <div className="flex items-center gap-6 mt-3 -ml-2">
                            <button
                              onClick={() => toggleLike(m.id)}
                              className={cn(
                                "flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors group",
                                isLiked ? "text-[#E0E0E0]" : "text-white/25 hover:text-[#E0E0E0]/60"
                              )}
                              data-testid={`button-like-${m.id}`}
                            >
                              <Heart className={cn("w-[18px] h-[18px]", isLiked && "fill-current")} />
                              {isLiked && <span className="text-[12px]">1</span>}
                            </button>
                            <button
                              onClick={() => toggleComments(m.id)}
                              className={cn(
                                "flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors",
                                openComments.has(m.id) ? "text-[#E0E0E0]" : "text-white/25 hover:text-[#E0E0E0]/60"
                              )}
                              data-testid={`button-reply-${m.id}`}
                            >
                              <MessageCircle className={cn("w-[18px] h-[18px]", openComments.has(m.id) && "fill-current")} />
                              {(commentsData[m.id]?.length || 0) > 0 && <span className="text-[12px]">{commentsData[m.id].length}</span>}
                            </button>
                            <button className="flex items-center gap-1.5 px-2 py-1.5 rounded-full text-white/25 hover:text-[#E0E0E0]/60 transition-colors" data-testid={`button-share-${m.id}`}>
                              <Share2 className="w-[18px] h-[18px]" />
                            </button>
                            <button
                              onClick={() => toggleSave(m.id)}
                              className={cn(
                                "flex items-center gap-1.5 px-2 py-1.5 rounded-full transition-colors ml-auto",
                                isSaved ? "text-[#E0E0E0]" : "text-white/25 hover:text-[#E0E0E0]/60"
                              )}
                              data-testid={`button-save-${m.id}`}
                            >
                              <Bookmark className={cn("w-[18px] h-[18px]", isSaved && "fill-current")} />
                            </button>
                          </div>

                          {openComments.has(m.id) && (
                            <div className="mt-3 pt-3 border-t border-white/[0.06]" data-testid={`comments-section-${m.id}`}>
                              {(commentsData[m.id] || []).map((c: any) => {
                                const cMentor = c.role === "assistant" && c.mentor ? MENTOR_INFO[c.mentor] : null;
                                const cIsUser = c.role === "user";
                                return (
                                  <div key={c.id} className="flex gap-2.5 mb-3" data-testid={`comment-${c.id}`}>
                                    <div className="shrink-0">
                                      {cIsUser ? (
                                        <div className="w-7 h-7 rounded-full bg-[#1A1A1A] border border-[#333] flex items-center justify-center text-[9px] font-bold text-[#999]">
                                          {(user.displayName || user.email).substring(0, 2).toUpperCase()}
                                        </div>
                                      ) : cMentor ? (
                                        <img src={cMentor.avatar} alt={cMentor.name} className="w-7 h-7 rounded-full object-cover border border-white/10" />
                                      ) : (
                                        <div className="w-7 h-7 rounded-xl overflow-hidden">
                                          <img src="/logo.png" alt="MentXr" className="w-full h-full" />
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center gap-1.5">
                                        <span className="text-[12px] font-bold text-white/80">
                                          {cIsUser ? "You" : (cMentor ? cMentor.name : "MentXr® AI")}
                                        </span>
                                        {!cIsUser && (
                                          <svg className="w-3 h-3 text-[#E0E0E0]" viewBox="0 0 24 24" fill="currentColor"><path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41L9 16.17z"/></svg>
                                        )}
                                        <span className="text-[11px] text-white/25">{c.timestamp ? timeAgo(c.timestamp) : "now"}</span>
                                      </div>
                                      <p className="text-[13px] text-white/70 leading-[1.5] mt-0.5 whitespace-pre-wrap break-words">{c.content}</p>
                                    </div>
                                  </div>
                                );
                              })}

                              {commentLoading.has(m.id) && (
                                <div className="flex items-center gap-2 mb-3 pl-9">
                                  <Loader2 className="w-3.5 h-3.5 animate-spin text-white/30" />
                                  <span className="text-[12px] text-white/30">AI is replying...</span>
                                </div>
                              )}

                              <div className="flex gap-2 items-center">
                                <div className="w-7 h-7 rounded-full bg-[#1A1A1A] border border-[#333] flex items-center justify-center text-[9px] font-bold text-[#999] shrink-0">
                                  {(user.displayName || user.email).substring(0, 2).toUpperCase()}
                                </div>
                                <div className="flex-1 flex items-center bg-white/[0.04] border border-white/[0.08] rounded-2xl px-3 py-1.5">
                                  <input
                                    type="text"
                                    placeholder="Add a comment..."
                                    value={commentInputs[m.id] || ""}
                                    onChange={(e) => setCommentInputs(prev => ({ ...prev, [m.id]: e.target.value }))}
                                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); submitComment(m.id); } }}
                                    disabled={commentLoading.has(m.id)}
                                    className="flex-1 bg-transparent text-[13px] text-white placeholder:text-white/20 outline-none"
                                    data-testid={`input-comment-${m.id}`}
                                  />
                                  <button
                                    onClick={() => submitComment(m.id)}
                                    disabled={!(commentInputs[m.id] || "").trim() || commentLoading.has(m.id)}
                                    className={cn(
                                      "text-[12px] font-semibold ml-2 transition-colors",
                                      (commentInputs[m.id] || "").trim() ? "text-[#E0E0E0] hover:text-white" : "text-white/15"
                                    )}
                                    data-testid={`button-comment-submit-${m.id}`}
                                  >
                                    Post
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
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
                          <img src={activeMentor.avatar} alt={activeMentor.name} className="w-10 h-10 rounded-full object-cover border border-white/10" />
                        ) : (
                          <div className="w-10 h-10 rounded-xl overflow-hidden">
                            <img src="/logo.png" alt="MentXr" className="w-full h-full" />
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
                <img src={activeMentor.avatar} alt={activeMentor.name} className="w-5 h-5 rounded-full object-cover border border-white/10" />
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
    </div>
  );
}
