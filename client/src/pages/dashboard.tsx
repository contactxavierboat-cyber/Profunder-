import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/store";
import { useLocation } from "wouter";
import { Send, Plus, LogOut, Paperclip, Loader2, ArrowDown, FileText, X, Menu, Bot } from "lucide-react";
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

  return (
    <div className="h-[100dvh] flex bg-[#0A0A0A] text-white">

      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={cn(
        "w-[260px] bg-[#0F0F0F] flex flex-col border-r border-white/5 shrink-0 relative z-40",
        "fixed h-full md:static md:flex transition-transform duration-200 ease-out",
        sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
        "md:flex",
        !sidebarOpen && "hidden md:flex"
      )}>
        <div className="p-3">
          <button
            data-testid="button-new-chat"
            onClick={() => { clearChat(); setSidebarOpen(false); }}
            className="w-full flex items-center gap-3 px-3 py-3 rounded-lg border border-white/10 hover:bg-white/5 transition-colors text-sm font-medium"
          >
            <img src="/logo.png" alt="X+" className="w-7 h-7 rounded-lg" />
            <span className="flex-1 text-left">New chat</span>
            <Plus className="w-4 h-4 text-white/40" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-2">
          <p className="px-3 py-2 text-xs text-white/30 font-medium uppercase tracking-wider">Today</p>
          {messages.length > 0 && (
            <div className="px-3 py-2 rounded-lg bg-white/5 text-sm text-white/70 truncate">
              {messages[0]?.content.substring(0, 40)}...
            </div>
          )}
        </div>

        <div className="p-3 border-t border-white/5 space-y-1">
          <button
            data-testid="button-logout"
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-sm text-white/60"
          >
            <div className="w-6 h-6 rounded-full bg-[#1A1A1A] border border-[#333] flex items-center justify-center text-[10px] font-bold text-[#999]">
              {user.email.substring(0, 2).toUpperCase()}
            </div>
            <span className="flex-1 text-left truncate">{user.email}</span>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 relative">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#ffffff10_1px,transparent_1px),linear-gradient(to_bottom,#ffffff10_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>

        <header className="h-12 flex items-center justify-between px-3 sm:px-4 border-b border-white/5 shrink-0 md:hidden relative z-10">
          <button
            data-testid="button-menu"
            onClick={() => setSidebarOpen(true)}
            className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors"
          >
            <Menu className="w-5 h-5 text-white/60" />
          </button>
          <span className="text-sm font-semibold">MentXr®</span>
          <button onClick={() => clearChat()} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-white/5 transition-colors">
            <Plus className="w-5 h-5 text-white/40" />
          </button>
        </header>

        <div
          ref={scrollContainerRef}
          onScroll={handleScroll}
          className="flex-1 overflow-y-auto"
        >
          {!hasMessages ? (
            <div className="h-full flex flex-col items-center justify-center px-4">
              {activeMentor ? (
                <>
                  <img src={activeMentor.avatar} alt={activeMentor.name} className="w-14 h-14 sm:w-16 sm:h-16 rounded-full object-cover border-2 border-white/10 mb-4 sm:mb-5 opacity-80" />
                  <h2 className="text-xl sm:text-2xl font-semibold mb-1">{activeMentor.name}</h2>
                  <p className="text-white/40 text-xs sm:text-sm">{activeMentor.tagline}</p>
                  <p className="text-white/25 text-[10px] sm:text-xs mt-1">{activeMentor.specialty}</p>
                </>
              ) : (
                <>
                  <img src="/logo.png" alt="X+" className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl mb-4 sm:mb-6 opacity-80" />
                  <h2 className="text-xl sm:text-2xl font-semibold mb-2">MentXr®</h2>
                  <p className="text-white/40 text-xs sm:text-sm text-center max-w-sm px-2">
                    Mentorship On Demand — choose a mentor or ask anything.
                  </p>
                </>
              )}

              <p className="text-[10px] uppercase tracking-widest text-white/20 mt-6 mb-3">Choose Your Mentor</p>
              <div className="grid grid-cols-3 sm:grid-cols-6 gap-2 sm:gap-3 max-w-xl w-full px-2">
                <button
                  onClick={() => { setSelectedMentor(null); setMentorCleared(true); }}
                  className={cn(
                    "flex flex-col items-center gap-1.5 p-2.5 sm:p-3 rounded-xl border transition-all",
                    !activeMentorKey ? "border-white/20 bg-white/5" : "border-white/5 hover:border-white/15 hover:bg-white/5"
                  )}
                  data-testid="button-mentor-default"
                >
                  <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-full bg-[#1A1A1A] border border-white/10 flex items-center justify-center">
                    <Bot className="w-4 h-4 sm:w-5 sm:h-5 text-white/40" />
                  </div>
                  <p className="text-[10px] sm:text-[11px] text-white/50 font-medium leading-tight">MentXr®</p>
                </button>
                {Object.entries(MENTOR_INFO).map(([key, mentor]) => (
                  <button
                    key={key}
                    onClick={() => { setSelectedMentor(key); setMentorCleared(false); }}
                    className={cn(
                      "flex flex-col items-center gap-1.5 p-2.5 sm:p-3 rounded-xl border transition-all",
                      activeMentorKey === key ? "border-white/20 bg-white/5" : "border-white/5 hover:border-white/15 hover:bg-white/5"
                    )}
                    data-testid={`button-mentor-${key}`}
                  >
                    <img src={mentor.avatar} alt={mentor.name} className="w-9 h-9 sm:w-10 sm:h-10 rounded-full object-cover border border-white/10" />
                    <p className="text-[10px] sm:text-[11px] text-white/50 font-medium leading-tight truncate max-w-full">{mentor.name.split(" ")[0]}</p>
                  </button>
                ))}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-6 sm:mt-8 max-w-lg w-full px-2">
                {[
                  "Help me build my business strategy",
                  "How do I scale to 7 figures?",
                  "Guide me on personal branding",
                  "What should I invest in right now?",
                ].map((prompt, i) => (
                  <button
                    key={i}
                    data-testid={`button-suggestion-${i}`}
                    onClick={() => {
                      setInput(prompt);
                      textareaRef.current?.focus();
                    }}
                    className="text-left px-3 sm:px-4 py-2.5 sm:py-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/5 transition-colors text-[13px] sm:text-sm text-white/60 hover:text-white/80"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full px-3 sm:px-4 py-4 sm:py-6">
              {messages.map((m) => {
                const mentorData = m.role === 'assistant' && m.mentor ? MENTOR_INFO[m.mentor] : null;
                return (
                <div key={m.id} className="mb-6 sm:mb-8">
                  <div className="flex gap-2.5 sm:gap-4">
                    <div className="shrink-0 mt-0.5">
                      {m.role === "user" ? (
                        <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-[#1A1A1A] border border-[#333] flex items-center justify-center text-[10px] sm:text-[11px] font-bold text-[#999]">
                          {user.email.substring(0, 2).toUpperCase()}
                        </div>
                      ) : mentorData ? (
                        <img src={mentorData.avatar} alt={mentorData.name} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-white/20" />
                      ) : (
                        <img src="/logo.png" alt="X+" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] sm:text-sm font-semibold mb-1 text-white/90">
                        {m.role === "user" ? "You" : (mentorData ? mentorData.name : "MentXr®")}
                      </p>
                      {m.attachment && (
                        <div className="inline-flex items-center gap-2 mb-2 px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-lg bg-white/5 border border-white/10 text-[11px] sm:text-xs text-white/50">
                          <FileText className="w-3 h-3" />
                          {m.attachment.replace("_", " ")}.pdf
                        </div>
                      )}
                      <div className="text-[13px] sm:text-[15px] leading-6 sm:leading-7 text-white/80 whitespace-pre-wrap break-words">
                        {m.content}
                      </div>
                    </div>
                  </div>
                </div>
              );
              })}

              {isLoading && (
                <div className="mb-6 sm:mb-8">
                  <div className="flex gap-2.5 sm:gap-4">
                    {activeMentor ? (
                      <img src={activeMentor.avatar} alt={activeMentor.name} className="w-7 h-7 sm:w-8 sm:h-8 rounded-full object-cover border border-white/20 shrink-0 mt-0.5" />
                    ) : (
                      <img src="/logo.png" alt="X+" className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg shrink-0 mt-0.5" />
                    )}
                    <div className="flex-1">
                      <p className="text-[13px] sm:text-sm font-semibold mb-1 text-white/90">{activeMentor ? activeMentor.name : "MentXr®"}</p>
                      <div className="flex items-center gap-1.5 py-2">
                        <span className="w-2 h-2 bg-[#555] rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-[#555] rounded-full animate-bounce [animation-delay:0.15s]"></span>
                        <span className="w-2 h-2 bg-[#555] rounded-full animate-bounce [animation-delay:0.3s]"></span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {showScrollBtn && (
          <div className="absolute bottom-28 sm:bottom-32 left-1/2 -translate-x-1/2 z-10 md:left-[calc(50%+130px)]">
            <button
              onClick={scrollToBottom}
              className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="shrink-0 px-2 sm:px-4 pb-2 sm:pb-4 pt-2 safe-area-pb">
          <div className="max-w-3xl mx-auto">
            {activeMentor && hasMessages && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <img src={activeMentor.avatar} alt={activeMentor.name} className="w-4 h-4 rounded-full object-cover" />
                <span className="text-[10px] sm:text-[11px] text-white/30">Chatting with <span className="text-white/50 font-medium">{activeMentor.name}</span></span>
                <button onClick={() => { setSelectedMentor(null); setMentorCleared(true); }} className="text-white/20 hover:text-white/50 ml-auto" data-testid="button-clear-mentor">
                  <X className="w-3 h-3" />
                </button>
              </div>
            )}
            {attachedFile && (
              <div className="flex items-center gap-2 mb-2 px-1">
                <div className="flex items-center gap-2 bg-[#1A1A1A] border border-white/10 rounded-lg px-2.5 sm:px-3 py-1.5 text-[12px] sm:text-sm text-white/70">
                  <FileText className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-[#888] shrink-0" />
                  <span className="truncate max-w-[150px] sm:max-w-[200px]">{attachedFile.name}</span>
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
            <div className="relative flex items-end bg-[#1A1A1A] border border-white/10 rounded-2xl px-3 sm:px-4 py-2.5 sm:py-3 focus-within:border-white/20 transition-colors">
              <textarea
                ref={textareaRef}
                data-testid="input-chat"
                placeholder={activeMentor ? `Message ${activeMentor.name}...` : "Message MentXr..."}
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isLoading}
                className="flex-1 bg-transparent text-[14px] sm:text-[15px] text-white placeholder:text-white/30 resize-none outline-none max-h-[200px] leading-6 py-0.5"
              />
              <div className="flex items-center gap-1 ml-1.5 sm:ml-2 shrink-0">
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
                  className="w-8 h-8 rounded-full text-white/30 hover:text-white/60 hover:bg-white/5"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isLoading}
                  title="Attach document"
                  data-testid="button-attach"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <button
                  data-testid="button-send"
                  onClick={handleSend}
                  disabled={isLoading || (!input.trim() && !attachedFile)}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                    (input.trim() || attachedFile) && !isLoading
                      ? "bg-[#E0E0E0] text-[#0D0D0D] hover:bg-white"
                      : "bg-white/10 text-white/20 cursor-not-allowed"
                  )}
                >
                  {isLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowDown className="w-4 h-4 rotate-180" />
                  )}
                </button>
              </div>
            </div>
            <p className="text-center text-[10px] sm:text-[11px] text-white/20 mt-1.5 sm:mt-2">
              MentXr® AI can make mistakes. Verify important financial information.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
