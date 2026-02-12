import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, Bot, Paperclip, Trash2, Download, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";
import grantCardoneAvatar from "@/assets/mentor-grant-cardone.png";

const MENTOR_INFO: Record<string, { name: string; avatar: string }> = {
  grant_cardone: {
    name: "Grant Cardone",
    avatar: grantCardoneAvatar,
  },
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
            {i > 0 && <div className="w-full h-px bg-white/10 my-5" />}
            {isTitle ? (
              <p className="text-[15px] font-bold text-[#E0E0E0] tracking-wide uppercase mb-1">{trimmed}</p>
            ) : hasBullets ? (
              <div className="space-y-2">
                {lines.map((line, j) => {
                  const bulletMatch = line.match(/^\s*[-•]\s*(.*)/);
                  const numMatch = line.match(/^\s*\d+[.)]\s*(.*)/);
                  if (bulletMatch) {
                    return <p key={j} className="pl-4 leading-[1.65] text-white/85">&#x2022; {bulletMatch[1]}</p>;
                  }
                  if (numMatch) {
                    const num = line.match(/^\s*(\d+)/)?.[1];
                    return <p key={j} className="pl-4 leading-[1.65] text-white/85">{num}. {numMatch[1]}</p>;
                  }
                  return <p key={j} className="leading-[1.65] text-white/85">{line}</p>;
                })}
              </div>
            ) : (
              <p className="leading-[1.65] text-white/85">{trimmed}</p>
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
  const scrollRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (scrollRef.current) {
      const scrollContainer = scrollRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [messages]);

  const handleSend = async (attachment?: "credit_report" | "bank_statement") => {
    if (!user) return;
    if (!input.trim() && !attachment) return;

    setIsLoading(true);
    try {
      await sendMessage(input, attachment);
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
    <Card className="flex flex-col h-[600px] bg-[#111111] border border-[#222]">
      <CardHeader className="flex flex-row items-center justify-between py-3 border-b border-[#222]">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[#1A1A1A] border border-[#333] flex items-center justify-center">
            <Bot className="w-4 h-4 text-[#999]" />
          </div>
          <div>
            <CardTitle className="text-sm font-bold text-[#E0E0E0]">MentXr® AI</CardTitle>
            <p className="text-[10px] text-[#555] uppercase tracking-widest">Mentorship On Demand</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => clearChat()} className="h-8 text-xs text-[#888] hover:text-white hover:bg-[#1A1A1A]">
            <Trash2 className="w-3.5 h-3.5 mr-1" /> New
          </Button>
          <Button variant="ghost" size="sm" onClick={downloadSummary} className="h-8 text-xs text-[#888] hover:text-white hover:bg-[#1A1A1A]">
            <Download className="w-3.5 h-3.5 mr-1" /> Export
          </Button>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[400px] text-center opacity-30">
              <Bot className="w-12 h-12 mb-4 text-[#555]" />
              <p className="text-sm font-medium text-[#777]">Your Mentor is Ready</p>
              <p className="text-xs text-[#555]">Ask anything — strategy, growth, leadership, funding, and more.</p>
            </div>
          )}
          {messages.map((m) => {
            const mentorData = m.role === 'assistant' && m.mentor ? MENTOR_INFO[m.mentor] : null;
            return (
              <div key={m.id} className={cn("flex gap-3 max-w-[90%] items-start", m.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
                {m.role === 'user' ? (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border bg-[#1A1A1A] border-[#333]">
                    <User className="w-4 h-4 text-[#999]" />
                  </div>
                ) : mentorData ? (
                  <img
                    src={mentorData.avatar}
                    alt={mentorData.name}
                    className="w-10 h-10 min-w-[40px] min-h-[40px] rounded-full object-cover shrink-0 border-2 border-[#555] mt-0.5"
                  />
                ) : (
                  <div className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 border bg-[#1A1A1A] border-[#333]">
                    <Bot className="w-4 h-4 text-[#999]" />
                  </div>
                )}
                <div className="space-y-1 min-w-0 flex-1">
                  {mentorData && (
                    <p className="text-[11px] font-semibold text-[#aaa] tracking-wide">{mentorData.name}</p>
                  )}
                  <div className={cn(
                    "rounded-2xl text-sm",
                    m.role === 'user' 
                      ? "p-3 bg-[#E0E0E0] text-[#0D0D0D] font-medium leading-relaxed whitespace-pre-wrap" 
                      : "bg-[#161616] border border-[#222]"
                  )}>
                    {m.attachment && (
                      <div className="flex items-center gap-2 mb-2 p-2 rounded bg-black/20 text-xs font-mono text-[#888] mx-3 mt-3">
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
                  <p className="text-[10px] text-[#444] font-mono text-right">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              </div>
            );
          })}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-[#333] flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 text-[#777] animate-spin" />
              </div>
              <div className="p-3 rounded-2xl bg-[#161616] border border-[#222] flex gap-1.5">
                <span className="w-1.5 h-1.5 bg-[#555] rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-[#555] rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-[#555] rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <CardFooter className="p-4 border-t border-[#222] bg-[#0D0D0D] gap-2">
        <div className="relative flex-1">
          <Input 
            placeholder="Type your question..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            className="pr-10 bg-[#1A1A1A] border-[#2A2A2A] h-11 text-white placeholder:text-[#555]"
            disabled={isLoading}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <Button 
              size="icon" 
              variant="ghost" 
              className="w-8 h-8 rounded-full hover:bg-[#1A1A1A] text-[#777]"
              onClick={() => handleSend("credit_report")}
              title="Attach Credit Report"
              disabled={isLoading || !user?.hasCreditReport}
            >
              <Paperclip className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <Button 
          size="icon" 
          onClick={() => handleSend()}
          disabled={isLoading || (!input.trim())}
          className="h-11 w-11 shrink-0 bg-[#E0E0E0] text-[#0D0D0D] hover:bg-white"
        >
          <Send className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
