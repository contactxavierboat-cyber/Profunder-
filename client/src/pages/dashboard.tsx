import { useEffect, useState, useRef } from "react";
import { useAuth } from "@/lib/store";
import { useLocation } from "wouter";
import { Send, Plus, LogOut, Paperclip, Loader2, ArrowDown, Settings, FileText } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

export default function DashboardPage() {
  const { user, messages, sendMessage, clearChat, logout } = useAuth();
  const [, setLocation] = useLocation();
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const { toast } = useToast();

  useEffect(() => {
    if (!user) {
      setLocation("/");
      return;
    }
    if (user.subscriptionStatus !== "active" && user.role !== "admin") {
      setLocation("/subscription");
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
    if (!user || !input.trim() || isLoading) return;
    const msg = input;
    setInput("");
    if (textareaRef.current) textareaRef.current.style.height = "auto";
    setIsLoading(true);
    try {
      await sendMessage(msg);
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
    <div className="h-screen flex bg-[#0A0A0A] text-white">

      <aside className="w-[260px] bg-[#0F0F0F] flex flex-col border-r border-white/5 shrink-0 hidden md:flex">
        <div className="p-3">
          <button
            data-testid="button-new-chat"
            onClick={() => clearChat()}
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
            onClick={() => setLocation("/subscription")}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-sm text-white/60"
          >
            <Settings className="w-4 h-4" />
            Subscription
          </button>
          <button
            data-testid="button-logout"
            onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 transition-colors text-sm text-white/60"
          >
            <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-[10px] font-bold text-primary">
              {user.email.substring(0, 2).toUpperCase()}
            </div>
            <span className="flex-1 text-left truncate">{user.email}</span>
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">

        <header className="h-12 flex items-center justify-between px-4 border-b border-white/5 shrink-0 md:hidden">
          <img src="/logo.png" alt="X+" className="w-7 h-7 rounded-lg" />
          <span className="text-sm font-semibold">Start-Up Studio®</span>
          <button onClick={() => clearChat()}>
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
              <img src="/logo.png" alt="X+" className="w-14 h-14 rounded-2xl mb-6 opacity-80" />
              <h2 className="text-2xl font-semibold mb-2">Start-Up Studio®</h2>
              <p className="text-white/40 text-sm text-center max-w-sm">
                Ask me anything about your fundability, credit profile, or financing strategy.
              </p>

              <div className="grid grid-cols-2 gap-3 mt-8 max-w-lg w-full">
                {[
                  "Analyze my fundability score",
                  "What phase am I in?",
                  "How do I improve my credit?",
                  "What funding am I eligible for?",
                ].map((prompt, i) => (
                  <button
                    key={i}
                    data-testid={`button-suggestion-${i}`}
                    onClick={() => {
                      setInput(prompt);
                      textareaRef.current?.focus();
                    }}
                    className="text-left px-4 py-3 rounded-xl border border-white/10 bg-white/[0.02] hover:bg-white/5 transition-colors text-sm text-white/60 hover:text-white/80"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto w-full px-4 py-6">
              {messages.map((m) => (
                <div key={m.id} className={cn("mb-8", m.role === "user" ? "" : "")}>
                  <div className="flex gap-4">
                    <div className="shrink-0 mt-0.5">
                      {m.role === "user" ? (
                        <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-[11px] font-bold text-primary">
                          {user.email.substring(0, 2).toUpperCase()}
                        </div>
                      ) : (
                        <img src="/logo.png" alt="X+" className="w-8 h-8 rounded-lg" />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold mb-1 text-white/90">
                        {m.role === "user" ? "You" : "Start-Up Studio®"}
                      </p>
                      {m.attachment && (
                        <div className="inline-flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-xs text-white/50">
                          <FileText className="w-3 h-3" />
                          {m.attachment.replace("_", " ")}.pdf
                        </div>
                      )}
                      <div className="text-[15px] leading-7 text-white/80 whitespace-pre-wrap break-words">
                        {m.content}
                      </div>
                    </div>
                  </div>
                </div>
              ))}

              {isLoading && (
                <div className="mb-8">
                  <div className="flex gap-4">
                    <img src="/logo.png" alt="X+" className="w-8 h-8 rounded-lg shrink-0 mt-0.5" />
                    <div className="flex-1">
                      <p className="text-sm font-semibold mb-1 text-white/90">Start-Up Studio®</p>
                      <div className="flex items-center gap-1.5 py-2">
                        <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce"></span>
                        <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:0.15s]"></span>
                        <span className="w-2 h-2 bg-primary/50 rounded-full animate-bounce [animation-delay:0.3s]"></span>
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
          <div className="absolute bottom-32 left-1/2 -translate-x-1/2 z-10 md:left-[calc(50%+130px)]">
            <button
              onClick={scrollToBottom}
              className="w-8 h-8 rounded-full bg-white/10 border border-white/10 flex items-center justify-center hover:bg-white/20 transition-colors"
            >
              <ArrowDown className="w-4 h-4" />
            </button>
          </div>
        )}

        <div className="shrink-0 px-4 pb-4 pt-2">
          <div className="max-w-3xl mx-auto">
            <div className="relative flex items-end bg-[#1A1A1A] border border-white/10 rounded-2xl px-4 py-3 focus-within:border-white/20 transition-colors">
              <textarea
                ref={textareaRef}
                data-testid="input-chat"
                placeholder="Message Start-Up Studio..."
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                rows={1}
                disabled={isLoading}
                className="flex-1 bg-transparent text-[15px] text-white placeholder:text-white/30 resize-none outline-none max-h-[200px] leading-6 py-0.5"
              />
              <div className="flex items-center gap-1 ml-2 shrink-0">
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-8 h-8 rounded-full text-white/30 hover:text-white/60 hover:bg-white/5"
                  onClick={async () => {
                    if (!input.trim()) {
                      setInput("Analyze my attached credit report");
                    }
                    setIsLoading(true);
                    try {
                      await sendMessage(input || "Analyze my attached credit report", "credit_report");
                      setInput("");
                    } catch {} finally { setIsLoading(false); }
                  }}
                  disabled={isLoading}
                  title="Attach document"
                >
                  <Paperclip className="w-4 h-4" />
                </Button>
                <button
                  data-testid="button-send"
                  onClick={handleSend}
                  disabled={isLoading || !input.trim()}
                  className={cn(
                    "w-8 h-8 rounded-full flex items-center justify-center transition-colors",
                    input.trim() && !isLoading
                      ? "bg-primary text-black hover:bg-primary/90"
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
            <p className="text-center text-[11px] text-white/20 mt-2">
              Start-Up Studio® AI can make mistakes. Verify important financial information.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
