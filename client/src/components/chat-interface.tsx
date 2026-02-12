import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/store";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, User, Bot, Paperclip, Trash2, Download, FileText, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

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
      // Error handled in store
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
    a.download = 'Startup-Studio-Analysis.txt';
    a.click();
    toast({ title: "Summary Downloaded" });
  };

  return (
    <Card className="glass-panel flex flex-col h-[600px] border-white/5">
      <CardHeader className="flex flex-row items-center justify-between py-3 border-b border-white/5">
        <div className="flex items-center gap-2">
          <Bot className="w-5 h-5 text-primary" />
          <div>
            <CardTitle className="text-sm font-bold">Studio AI Analysis</CardTitle>
            <p className="text-[10px] text-muted-foreground uppercase tracking-widest">Active Analysis Engine</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="ghost" size="sm" onClick={() => clearChat()} className="h-8 text-xs hover:bg-white/5">
            <Trash2 className="w-3.5 h-3.5 mr-1" /> New
          </Button>
          <Button variant="ghost" size="sm" onClick={downloadSummary} className="h-8 text-xs hover:bg-white/5">
            <Download className="w-3.5 h-3.5 mr-1" /> Export
          </Button>
        </div>
      </CardHeader>

      <ScrollArea className="flex-1 p-4" ref={scrollRef}>
        <div className="space-y-4">
          {messages.length === 0 && (
            <div className="flex flex-col items-center justify-center h-[400px] text-center opacity-30">
              <Bot className="w-12 h-12 mb-4" />
              <p className="text-sm font-medium">Ready for Fundability Analysis</p>
              <p className="text-xs">Ask a question or attach a document to begin.</p>
            </div>
          )}
          {messages.map((m) => (
            <div key={m.id} className={cn("flex gap-3 max-w-[85%]", m.role === 'user' ? "ml-auto flex-row-reverse" : "")}>
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center shrink-0",
                m.role === 'user' ? "bg-white/10" : "bg-primary/20"
              )}>
                {m.role === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4 text-primary" />}
              </div>
              <div className="space-y-1">
                <div className={cn(
                  "p-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap",
                  m.role === 'user' ? "bg-primary text-black font-medium" : "bg-white/5 border border-white/10"
                )}>
                  {m.attachment && (
                    <div className="flex items-center gap-2 mb-2 p-2 rounded bg-black/20 text-xs font-mono">
                      <FileText className="w-3 h-3" />
                      Attached: {m.attachment.replace('_', ' ')}.pdf
                    </div>
                  )}
                  {m.content}
                </div>
                <p className="text-[10px] text-muted-foreground font-mono text-right">
                  {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </div>
          ))}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                <Loader2 className="w-4 h-4 text-primary animate-spin" />
              </div>
              <div className="p-3 rounded-2xl bg-white/5 border border-white/10 flex gap-1">
                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce"></span>
                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.2s]"></span>
                <span className="w-1.5 h-1.5 bg-primary/40 rounded-full animate-bounce [animation-delay:0.4s]"></span>
              </div>
            </div>
          )}
        </div>
      </ScrollArea>

      <CardFooter className="p-4 border-t border-white/5 bg-black/20 gap-2">
        <div className="relative flex-1">
          <Input 
            placeholder="Type your question..." 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            className="pr-10 bg-white/5 border-white/10 h-11"
            disabled={isLoading}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex gap-1">
            <Button 
              size="icon" 
              variant="ghost" 
              className="w-8 h-8 rounded-full hover:bg-white/10"
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
          className="h-11 w-11 shrink-0 bg-primary text-black hover:bg-primary/90"
        >
          <Send className="w-4 h-4" />
        </Button>
      </CardFooter>
    </Card>
  );
}
