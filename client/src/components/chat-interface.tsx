import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, Bot, Paperclip, Trash2, Download, FileText, Loader2, Users, X } from "lucide-react";
import { cn } from "@/lib/utils";
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

function cleanContent(text: string): string {
  return text
    .replace(/\*\*\*/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/^---+$/gm, "")
    .replace(/^-{2,}/gm, "");
}

function FormatReport({ content }: { content: string }) {
  const cleaned = cleanContent(content);
  const sections = cleaned.split(/\n{2,}/);

  return (
    <div className="chat-report">
      {sections.map((section, i) => {
        const trimmed = section.trim();
        if (!trimmed) return null;

        const isTitle = /^\d+\)\s/.test(trimmed) ||
          /^(FUNDABILITY|FUNDING|KEY FINDINGS|PHASE|TIMELINE|NEXT MOVE|CAPITAL|CLIENT|CERTIFICATION)/i.test(trimmed) ||
          (trimmed.length < 80 && trimmed === trimmed.toUpperCase() && !trimmed.includes("."));

        const lines = trimmed.split("\n");
        const hasBullets = lines.some(l => /^\s*[-•]\s/.test(l) || /^\s*\d+[.)]\s/.test(l));

        return (
          <div key={i}>
            {i > 0 && <div className="w-full h-px bg-[#E5E7EB] my-5" />}
            {isTitle ? (
              <p className="text-[15px] font-bold text-[#1A1A1A] tracking-wide uppercase mb-1">{trimmed}</p>
            ) : hasBullets ? (
              <div className="space-y-2">
                {lines.map((line, j) => {
                  const bulletMatch = line.match(/^\s*[-•]\s*(.*)/);
                  const numMatch = line.match(/^\s*\d+[.)]\s*(.*)/);
                  if (bulletMatch) {
                    return <p key={j} className="pl-4 leading-[1.65] text-[#333]">&#x2022; {bulletMatch[1]}</p>;
                  }
                  if (numMatch) {
                    const num = line.match(/^\s*(\d+)/)?.[1];
                    return <p key={j} className="pl-4 leading-[1.65] text-[#333]">{num}. {numMatch[1]}</p>;
                  }
                  return <p key={j} className="leading-[1.65] text-[#333]">{line}</p>;
                })}
              </div>
            ) : (
              <p className="leading-[1.65] text-[#333]">{trimmed}</p>
            )}
          </div>
        );
      })}
    </div>
  );
}

export function ChatInterface() {
  const { user, messages, sendMessage, clearChat } = useAuth();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [selectedMentor, setSelectedMentor] = useState<string | null>(null);
  const [showMentorPanel, setShowMentorPanel] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const [mentorCleared, setMentorCleared] = useState(false);
  const lastMentorMsg = [...messages].reverse().find(m => m.role === 'assistant' && m.mentor);
  const activeMentorKey = selectedMentor !== null ? selectedMentor : (mentorCleared ? null : (lastMentorMsg?.mentor || null));
  const activeMentor = activeMentorKey ? MENTOR_INFO[activeMentorKey] : null;

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSelectMentor = (key: string) => {
    setSelectedMentor(key);
    setMentorCleared(false);
    setShowMentorPanel(false);
  };

  const handleClearMentor = () => {
    setSelectedMentor(null);
    setMentorCleared(true);
    setShowMentorPanel(false);
  };

  const handleSend = async (attachment?: "credit_report" | "bank_statement") => {
    if (!user) return;
    if (!input.trim() && !attachment) return;

    setIsLoading(true);
    try {
      await sendMessage(input, attachment, undefined, activeMentorKey);
      setInput("");
    } catch (e) {
    } finally {
      setIsLoading(false);
    }
  };

  const downloadSummary = () => {
    const lastAssistantMessage = [...messages].reverse().find(m => m.role === 'assistant');
    if (!lastAssistantMessage) {
      toast({ title: "Nothing to download", description: "Run an analysis first." });
      return;
    }
    
    const blob = new Blob([lastAssistantMessage.content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'MentXr-Session.txt';
    a.click();
    toast({ title: "Summary Downloaded" });
  };

  return (
    <Card className="flex flex-col h-[600px] bg-white border border-[#E5E7EB] shadow-sm">
      <CardHeader className="flex flex-row items-center justify-between py-3 border-b border-[#E5E7EB]">
        <div className="flex items-center gap-2">
          {activeMentor ? (
            <button onClick={() => setShowMentorPanel(!showMentorPanel)} className="relative group" data-testid="button-mentor-avatar">
              <div className={cn("w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold border-2 border-[#E5E7EB] group-hover:border-[#2E7D32] transition-colors", activeMentorKey ? BOT_COLORS[activeMentorKey] : "")}>{activeMentor.initials}</div>
              <div className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center">
                <Users className="w-2 h-2 text-[#666]" />
              </div>
            </button>
          ) : (
            <button onClick={() => setShowMentorPanel(!showMentorPanel)} className="w-7 h-7 rounded-full bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center hover:border-[#2E7D32] transition-colors" data-testid="button-mentor-select">
              <Bot className="w-4 h-4 text-[#666]" />
            </button>
          )}
          <div>
            <CardTitle className="text-sm font-bold text-[#1A1A1A]">{activeMentor ? activeMentor.name : "MentXr® AI"}</CardTitle>
            <p className="text-[10px] text-[#666] uppercase tracking-widest">{activeMentor ? activeMentor.specialty : "Mentorship On Demand"}</p>
          </div>
        </div>
        <div className="flex gap-1">
          <Button variant="ghost" size="sm" onClick={() => setShowMentorPanel(!showMentorPanel)} className="h-8 text-xs text-[#666] hover:text-[#1A1A1A] hover:bg-[#F8F9FA]" data-testid="button-switch-mentor">
            <Users className="w-3.5 h-3.5 mr-1" /> Mentors
          </Button>
          <Button variant="ghost" size="sm" onClick={() => clearChat()} className="h-8 text-xs text-[#666] hover:text-[#1A1A1A] hover:bg-[#F8F9FA]" data-testid="button-new-chat">
            <Trash2 className="w-3.5 h-3.5 mr-1" /> New
          </Button>
          <Button variant="ghost" size="sm" onClick={downloadSummary} className="h-8 text-xs text-[#666] hover:text-[#1A1A1A] hover:bg-[#F8F9FA]" data-testid="button-export">
            <Download className="w-3.5 h-3.5 mr-1" /> Export
          </Button>
        </div>
      </CardHeader>

      {showMentorPanel && (
        <div className="border-b border-[#E5E7EB] bg-[#F8F9FA] p-4" data-testid="panel-mentor-selection">
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-xs font-bold text-[#1A1A1A] uppercase tracking-widest">Choose Your Mentor</p>
              <p className="text-[10px] text-[#666] mt-0.5">Select a mentor to guide your conversation</p>
            </div>
            <button onClick={() => setShowMentorPanel(false)} className="text-[#666] hover:text-[#1A1A1A] transition-colors" data-testid="button-close-mentors">
              <X className="w-4 h-4" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            <button
              onClick={handleClearMentor}
              className={cn(
                "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center",
                !activeMentorKey
                  ? "border-[#2E7D32] bg-[#E8F5E9]"
                  : "border-[#E5E7EB] hover:border-[#2E7D32] hover:bg-[#F8F9FA]"
              )}
              data-testid="button-mentor-default"
            >
              <div className="w-10 h-10 rounded-full bg-white border border-[#E5E7EB] flex items-center justify-center">
                <Bot className="w-5 h-5 text-[#666]" />
              </div>
              <p className="text-[11px] font-semibold text-[#1A1A1A] leading-tight">MentXr® AI</p>
              <p className="text-[9px] text-[#666] leading-tight">General Mentor</p>
            </button>
            {Object.entries(MENTOR_INFO).map(([key, mentor]) => (
              <button
                key={key}
                onClick={() => handleSelectMentor(key)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center",
                  activeMentorKey === key
                    ? "border-[#2E7D32] bg-[#E8F5E9]"
                    : "border-[#E5E7EB] hover:border-[#2E7D32] hover:bg-[#F8F9FA]"
                )}
                data-testid={`button-mentor-${key}`}
              >
                <div className={cn("w-full h-full rounded-full flex items-center justify-center text-white text-sm font-bold", BOT_COLORS[key])}>{mentor.initials}</div>
                <p className="text-[11px] font-semibold text-[#1A1A1A] leading-tight">{mentor.name}</p>
                <p className="text-[9px] text-[#666] leading-tight">{mentor.specialty}</p>
              </button>
            ))}
          </div>
        </div>
      )}

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && !showMentorPanel && (
            <div className="flex flex-col items-center justify-center h-[400px] text-center">
              {activeMentor ? (
                <>
                  <div className={cn("w-20 h-20 rounded-full flex items-center justify-center text-white text-2xl font-bold border-2 border-[#E5E7EB] mb-4 opacity-60", activeMentorKey ? BOT_COLORS[activeMentorKey] : "")}>{activeMentor.initials}</div>
                  <p className="text-sm font-medium text-[#666]">{activeMentor.name}</p>
                  <p className="text-xs text-[#666] mt-1">{activeMentor.tagline}</p>
                  <p className="text-[10px] text-[#666] mt-3 max-w-[250px]">Start typing to begin your mentorship session</p>
                </>
              ) : (
                <>
                  <Bot className="w-12 h-12 mb-4 text-[#999] opacity-30" />
                  <p className="text-sm font-medium text-[#666] opacity-50">Your Mentor is Ready</p>
                  <p className="text-xs text-[#666] opacity-50">Ask anything — or click "Mentors" to choose a specific mentor</p>
                </>
              )}
            </div>
          )}
          {messages.map((m) => {
            const mentorData = m.role === 'assistant' && m.mentor ? MENTOR_INFO[m.mentor] : null;
            return (
              <div key={m.id} className={cn("flex gap-3 max-w-[90%] items-start", m.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
                {m.role === 'user' ? (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border bg-[#F8F9FA] border-[#E5E7EB]">
                    <User className="w-4 h-4 text-[#666]" />
                  </div>
                ) : mentorData ? (
                  <div className={cn("w-10 h-10 min-w-[40px] min-h-[40px] rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0 border-2 border-[#E5E7EB] mt-0.5", m.mentor ? BOT_COLORS[m.mentor] : "")}>{mentorData.initials}</div>
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border bg-[#F8F9FA] border-[#E5E7EB]">
                    <Bot className="w-4 h-4 text-[#666]" />
                  </div>
                )}
                <div className="space-y-1 min-w-0 flex-1">
                  {mentorData && (
                    <p className="text-[11px] font-semibold text-[#333] tracking-wide">{mentorData.name}</p>
                  )}
                  <div className={cn(
                    "rounded-2xl text-sm",
                    m.role === 'user' 
                      ? "p-3 bg-[#E8F5E9] text-[#1A1A1A] font-medium leading-relaxed whitespace-pre-wrap" 
                      : "bg-[#F1F3F5] border border-[#E5E7EB]"
                  )}>
                    {m.attachment && (
                      <div className="flex items-center gap-2 mb-2 p-2 rounded bg-white/60 text-xs font-mono text-[#666] mx-3 mt-3">
                        <FileText className="w-3 h-3" />
                        Attached: {m.attachment.replace('_', ' ')}.pdf
                      </div>
                    )}
                    {m.role === 'assistant' ? (
                      <FormatReport content={m.content} />
                    ) : (
                      m.content
                    )}
                  </div>
                  <p className="text-[10px] text-[#666] font-mono text-right">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#F8F9FA] border border-[#E5E7EB] flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 text-[#666] animate-spin" />
              </div>
              <div className="p-3 rounded-2xl bg-[#F1F3F5] border border-[#E5E7EB] flex gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#999] rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-[#999] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-[#999] rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <div className="border-t border-[#E5E7EB] bg-white">
        {activeMentor && (
          <div className="px-4 pt-2 flex items-center gap-2">
            <div className={cn("w-4 h-4 rounded-full flex items-center justify-center text-white text-[6px] font-bold", activeMentorKey ? BOT_COLORS[activeMentorKey] : "")}>{activeMentor.initials}</div>
            <span className="text-[10px] text-[#666]">Chatting with <span className="text-[#333] font-medium">{activeMentor.name}</span></span>
            <button onClick={handleClearMentor} className="text-[#666] hover:text-[#1A1A1A] ml-auto" data-testid="button-clear-mentor">
              <X className="w-3 h-3" />
            </button>
          </div>
        )}
        <CardFooter className="p-4 gap-2">
          <div className="relative flex-1">
            <Input 
              placeholder={activeMentor ? `Ask ${activeMentor.name} anything...` : "Type your question..."}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
              className="pr-10 bg-white border-[#E5E7EB] h-11 text-[#1A1A1A] placeholder:text-[#999]"
              disabled={isLoading}
              data-testid="input-chat"
            />
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
              <Button 
                size="icon" 
                variant="ghost" 
                className="w-8 h-8 rounded-full hover:bg-[#F8F9FA] text-[#666]"
                onClick={() => handleSend("credit_report")}
                title="Attach Credit Report"
                disabled={isLoading || !user?.hasCreditReport}
                data-testid="button-attach"
              >
                <Paperclip className="w-4 h-4" />
              </Button>
            </div>
          </div>
          <Button 
            size="icon" 
            onClick={() => handleSend()}
            disabled={isLoading || (!input.trim())}
            className="h-11 w-11 shrink-0 bg-[#2E7D32] text-white hover:bg-[#256d29]"
            data-testid="button-send"
          >
            <Send className="w-4 h-4" />
          </Button>
        </CardFooter>
      </div>
    </Card>
  );
}
