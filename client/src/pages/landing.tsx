import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/lib/store";
import { ProfundrLogo } from "@/components/profundr-logo";

interface GuestMessage {
  id: number;
  role: "user" | "assistant";
  content: string;
}

interface MissionData {
  fundabilityIndex: number | null;
  riskTier: string | null;
  approvalOdds: { label: string; value: string }[];
  borrowingPower: { conservative: string; moderate: string; aggressive: string } | null;
  topRisks: string[];
  nextMoves: string[];
}

interface DisputeItem {
  creditor: string;
  accountNumber: string;
  issue: string;
  bureau: string;
  reason: string;
}

function parseDisputeItems(content: string): DisputeItem[] {
  const cleanText = content.replace(/\*+/g, "");
  const disputes: DisputeItem[] = [];
  const lines = cleanText.split("\n");
  for (const line of lines) {
    const trimmed = line.trim();
    if (!/^DISPUTE:\s*/i.test(trimmed)) continue;
    const afterPrefix = trimmed.replace(/^DISPUTE:\s*/i, "");
    const parts = afterPrefix.split("|").map(p => p.trim());
    if (parts.length >= 5) {
      disputes.push({
        creditor: parts[0],
        accountNumber: parts[1],
        issue: parts[2],
        bureau: parts[3].replace(/^Bureau:\s*/i, ""),
        reason: parts.slice(4).join(" | ")
      });
    } else if (parts.length >= 3) {
      disputes.push({
        creditor: parts[0],
        accountNumber: parts[1] || "N/A",
        issue: parts[2],
        bureau: parts[3]?.replace(/^Bureau:\s*/i, "") || "All",
        reason: parts[4] || parts[2]
      });
    }
  }
  return disputes;
}

function parseSingleMessageData(content: string): MissionData {
  const cleanText = content.replace(/\*+/g, "");

  let fundabilityIndex: number | null = null;
  let riskTier: string | null = null;

  const indexPatterns = [
    /FUNDABILITY\s*INDEX[:\s]*(\d+)\s*\/?\s*100/i,
    /(\d+)\s*\/\s*100\s*[-—]\s*(Strong|Moderate|Weak|High Risk|Prime|Near Prime|Subprime)/i,
    /Index[:\s]*(\d+)\s*\/\s*100/i,
    /Index[:\s]*(\d+)\s*[-—]/i,
    /Score[:\s]*(\d+)\s*\/\s*100/i,
  ];
  for (const p of indexPatterns) {
    const m = cleanText.match(p);
    if (m) { fundabilityIndex = parseInt(m[1]); break; }
  }

  const tierPatterns = [
    /(?:Risk\s*)?(?:Tier|Classification)[:\s]*(Strong|Moderate|Weak|High Risk|Prime|Near Prime|Subprime)/i,
    /(\d+)\s*\/\s*100\s*[-—]\s*(Strong|Moderate|Weak|High Risk|Prime|Near Prime|Subprime)/i,
    /[-—]\s*(Strong|Moderate|Weak|High Risk|Prime|Near Prime|Subprime)/i,
  ];
  for (const p of tierPatterns) {
    const m = cleanText.match(p);
    if (m) { riskTier = m[m.length === 3 ? 2 : 1]; break; }
  }

  const approvalOdds: { label: string; value: string }[] = [];
  const oddsPatterns = [
    { label: "Bank Term Loan", pattern: /Bank\s*Term\s*Loan[:\s]*(\d+)%/i },
    { label: "Online Lender", pattern: /Online\s*(?:Term\s*)?Lender[:\s]*(\d+)%/i },
    { label: "Business LOC", pattern: /(?:Business\s*)?(?:Line\s*of\s*Credit|LOC|Business\s*LOC)[:\s]*(\d+)%/i },
    { label: "Credit Card", pattern: /Credit\s*Card[:\s]*(\d+)%/i },
    { label: "MCA", pattern: /MCA[:\s]*(\d+)%/i },
  ];
  for (const { label, pattern } of oddsPatterns) {
    const m = cleanText.match(pattern);
    if (m) approvalOdds.push({ label, value: m[1] + "%" });
  }

  let borrowingPower: MissionData["borrowingPower"] = null;
  const bpCon = cleanText.match(/[Cc]onservative[:\s]*\$?([\d,]+)/);
  const bpMod = cleanText.match(/[Mm]oderate[:\s]*\$?([\d,]+)/);
  const bpAgg = cleanText.match(/[Aa]ggressive[:\s]*\$?([\d,]+)/);
  if (bpCon || bpMod || bpAgg) {
    borrowingPower = {
      conservative: bpCon ? "$" + bpCon[1] : "—",
      moderate: bpMod ? "$" + bpMod[1] : "—",
      aggressive: bpAgg ? "$" + bpAgg[1] : "—",
    };
  }

  const topRisks: string[] = [];
  const riskPatterns = [
    /TOP\s*RISKS?[:\s]*([\s\S]*?)(?=\n\s*(?:NEXT|BORROWING|APPROVAL|SCENARIO|REPAIR|DISPUTE|FUNDING)\b|\n\n\n)/i,
    /DENIAL\s*TRIGGERS?[:\s]*([\s\S]*?)(?=\n\s*(?:NEXT|BORROWING|APPROVAL|SCENARIO|REPAIR|DISPUTE|TOP)\b|\n\n\n)/i,
    /KEY\s*RISK\s*(?:DRIVERS?|FACTORS?)[:\s]*([\s\S]*?)(?=\n\s*(?:NEXT|BORROWING|OPTIMIZATION|SCENARIO)\b|\n\n\n)/i,
  ];
  for (const p of riskPatterns) {
    const m = cleanText.match(p);
    if (m) {
      const lines = m[1].split("\n").filter((l) => l.trim().match(/^[-•\d]/));
      for (const line of lines.slice(0, 4)) {
        const cleaned = line.replace(/^\s*[-•]\s*/, "").replace(/^\s*\d+[.)]\s*/, "").trim();
        if (cleaned.length > 5) topRisks.push(cleaned);
      }
      if (topRisks.length > 0) break;
    }
  }

  const nextMoves: string[] = [];
  const movePatterns = [
    /NEXT\s*MOVES?[^:\n]*[:\s]*([\s\S]*?)(?=\n\s*(?:TOP|BORROWING|APPROVAL|SCENARIO|KEY|FUNDING|DISPUTE)\b|\n\n\n|$)/i,
    /FUNDING\s*(?:ROADMAP|READINESS)[:\s]*([\s\S]*?)(?=\n\s*(?:TOP|BORROWING|APPROVAL|SCENARIO|DISPUTE)\b|\n\n\n|$)/i,
    /OPTIMIZATION\s*(?:ROADMAP)?[:\s]*([\s\S]*?)(?=\n\s*(?:TOP|BORROWING|APPROVAL|SCENARIO)\b|\n\n\n|$)/i,
  ];
  for (const p of movePatterns) {
    const m = cleanText.match(p);
    if (m) {
      const lines = m[1].split("\n").filter((l) => l.trim().match(/^[-•\d]/));
      for (const line of lines.slice(0, 5)) {
        const cleaned = line.replace(/^\s*[-•]\s*/, "").replace(/^\s*\d+[.)]\s*/, "").trim();
        if (cleaned.length > 5) nextMoves.push(cleaned);
      }
      if (nextMoves.length > 0) break;
    }
  }

  return { fundabilityIndex, riskTier, approvalOdds, borrowingPower, topRisks, nextMoves };
}

function hasAnalysisData(data: MissionData): boolean {
  return data.fundabilityIndex !== null || data.riskTier !== null || data.approvalOdds.length > 0 || data.borrowingPower !== null;
}

function getTierColor(tier: string | null): string {
  if (!tier) return "#999";
  const t = tier.toLowerCase();
  if (t === "strong" || t === "prime") return "#22c55e";
  if (t === "moderate" || t === "near prime") return "#eab308";
  if (t === "weak" || t === "subprime") return "#f97316";
  return "#ef4444";
}

function FormatResponse({ content }: { content: string }) {
  const cleaned = content
    .replace(/\*\*\*/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/^---+$/gm, "")
    .replace(/^-{2,}/gm, "");
  const sections = cleaned.split(/\n{2,}/);

  return (
    <div className="space-y-3">
      {sections.map((section, i) => {
        const trimmed = section.trim();
        if (!trimmed) return null;
        if (/^DISPUTE:/i.test(trimmed)) return null;
        const isTitle =
          /^\d+\)\s/.test(trimmed) ||
          /^(FUNDABILITY|FUNDING|KEY FINDINGS|PHASE|TIMELINE|NEXT MOVE|CAPITAL|CLIENT|CERTIFICATION|APPROVAL|ESTIMATED|OPTIMIZATION|SCENARIO|RISK|BORROWING|TOP|DENIAL|REPAIR|DISPUTE)/i.test(trimmed) ||
          (trimmed.length < 80 && trimmed === trimmed.toUpperCase() && !trimmed.includes("."));
        const lines = trimmed.split("\n").filter(l => !/^DISPUTE:/i.test(l.trim()));
        const hasBullets = lines.some((l) => /^\s*[-•]\s/.test(l) || /^\s*\d+[.)]\s/.test(l));

        if (isTitle) {
          return (
            <p key={i} className="text-[13px] font-semibold text-[#1a1a2e] tracking-wide uppercase">
              {trimmed}
            </p>
          );
        }
        if (hasBullets) {
          return (
            <div key={i} className="space-y-1">
              {lines.map((line, j) => {
                const bulletMatch = line.match(/^\s*[-•]\s*(.*)/);
                const numMatch = line.match(/^\s*\d+[.)]\s*(.*)/);
                if (bulletMatch) return <p key={j} className="pl-4 text-[14px] text-[#444] leading-[1.65]">{"\u2022"} {bulletMatch[1]}</p>;
                if (numMatch) {
                  const num = line.match(/^\s*(\d+)/)?.[1];
                  return <p key={j} className="pl-4 text-[14px] text-[#444] leading-[1.65]">{num}. {numMatch[1]}</p>;
                }
                return <p key={j} className="text-[14px] text-[#444] leading-[1.65]">{line}</p>;
              })}
            </div>
          );
        }
        return <p key={i} className="text-[14px] text-[#444] leading-[1.65]">{trimmed}</p>;
      })}
    </div>
  );
}

function MissionDashboard({ data, tierColor }: { data: MissionData; tierColor: string }) {
  return (
    <div className="w-full mt-4 space-y-2.5" data-testid="mission-dashboard-inline">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {data.fundabilityIndex !== null && (
          <div className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm" data-testid="card-fundability-index">
            <p className="text-[9px] text-[#999] uppercase tracking-[0.12em] font-medium mb-2">Fundability Index</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[28px] font-bold leading-none font-mono tracking-tight" style={{ color: tierColor }} data-testid="text-fundability-score">
                {data.fundabilityIndex}
              </span>
              <span className="text-[13px] text-[#ccc] font-mono">/100</span>
            </div>
            <div className="mt-2.5 w-full h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${data.fundabilityIndex}%`, backgroundColor: tierColor }} />
            </div>
          </div>
        )}

        {data.riskTier && (
          <div className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm" data-testid="card-risk-tier">
            <p className="text-[9px] text-[#999] uppercase tracking-[0.12em] font-medium mb-2">Risk Classification</p>
            <p className="text-[20px] font-bold tracking-[-0.02em]" style={{ color: tierColor }} data-testid="text-risk-tier">
              {data.riskTier}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tierColor }} />
              <p className="text-[10px] text-[#999]">
                {data.riskTier === "Strong" || data.riskTier === "Prime" ? "Strong approval probability" :
                 data.riskTier === "Moderate" || data.riskTier === "Near Prime" ? "Moderate approval probability" :
                 data.riskTier === "Weak" || data.riskTier === "Subprime" ? "Limited product eligibility" : "Requires credit remediation"}
              </p>
            </div>
          </div>
        )}

        {data.borrowingPower && (
          <div className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm" data-testid="card-borrowing-power">
            <p className="text-[9px] text-[#999] uppercase tracking-[0.12em] font-medium mb-2">Borrowing Power</p>
            <p className="text-[20px] font-bold text-[#1a1a1a] font-mono tracking-tight" data-testid="text-borrowing-moderate">
              {data.borrowingPower.moderate}
            </p>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[9px] text-[#999] font-mono">{data.borrowingPower.conservative}</span>
              <span className="text-[9px] text-[#999]">—</span>
              <span className="text-[9px] text-[#999] font-mono">{data.borrowingPower.aggressive}</span>
            </div>
          </div>
        )}
      </div>

      {data.approvalOdds.length > 0 && (
        <div className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm" data-testid="card-approval-odds">
          <p className="text-[9px] text-[#999] uppercase tracking-[0.12em] font-medium mb-3">Approval Probability</p>
          <div className="grid grid-cols-5 gap-2">
            {data.approvalOdds.map((item) => {
              const pct = parseInt(item.value);
              const color = pct >= 70 ? "#22c55e" : pct >= 40 ? "#eab308" : "#ef4444";
              return (
                <div key={item.label} className="text-center">
                  <div className="relative w-10 h-10 mx-auto mb-1">
                    <svg className="w-10 h-10 -rotate-90" viewBox="0 0 40 40">
                      <circle cx="20" cy="20" r="16" fill="none" stroke="#f0f0f0" strokeWidth="3" />
                      <circle cx="20" cy="20" r="16" fill="none" stroke={color} strokeWidth="3"
                        strokeDasharray={`${(pct / 100) * 100.5} 100.5`}
                        strokeLinecap="round" className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[9px] font-bold font-mono" style={{ color }} data-testid={`text-odds-${item.label.toLowerCase().replace(/\s+/g, "-")}`}>{pct}%</span>
                    </div>
                  </div>
                  <p className="text-[7px] text-[#999] uppercase tracking-wider leading-tight">{item.label}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(data.topRisks.length > 0 || data.nextMoves.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {data.topRisks.length > 0 && (
            <div className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm" data-testid="card-top-risks">
              <p className="text-[9px] text-[#999] uppercase tracking-[0.12em] font-medium mb-2.5">Risk Factors</p>
              <div className="space-y-2">
                {data.topRisks.map((risk, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[8px] font-bold text-red-500">!</span>
                    </div>
                    <p className="text-[11px] text-[#555] leading-[1.5]">{risk}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.nextMoves.length > 0 && (
            <div className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm" data-testid="card-next-moves">
              <p className="text-[9px] text-[#999] uppercase tracking-[0.12em] font-medium mb-2.5">Next Moves</p>
              <div className="space-y-2">
                {data.nextMoves.map((move, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded bg-[#f0f0f0] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[8px] font-bold text-[#666] font-mono">{i + 1}</span>
                    </div>
                    <p className="text-[11px] text-[#555] leading-[1.5]">{move}</p>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function DisputeDownloadButton({ disputes }: { disputes: DisputeItem[] }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const res = await fetch("/api/dispute-letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ disputes })
      });
      if (!res.ok) throw new Error("Failed to generate");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "profundr-dispute-letters.pdf";
      a.click();
      URL.revokeObjectURL(url);
    } catch {
      alert("Failed to generate dispute letters. Please try again.");
    } finally {
      setDownloading(false);
    }
  };

  return (
    <button
      onClick={handleDownload}
      disabled={downloading}
      className="mt-3 flex items-center gap-2 px-4 py-2 bg-[#1a1a2e] text-white rounded-lg text-[12px] font-medium hover:bg-[#2a2a40] transition-colors disabled:opacity-50"
      data-testid="button-download-disputes"
    >
      <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
        <path d="M8 2v8M8 10L5 7M8 10l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        <path d="M3 12v1.5a.5.5 0 00.5.5h9a.5.5 0 00.5-.5V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      {downloading ? "Generating..." : `Download ${disputes.length} Dispute Letter${disputes.length > 1 ? "s" : ""} (PDF)`}
    </button>
  );
}

export default function LandingPage() {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [guestMessages, setGuestMessages] = useState<GuestMessage[]>([]);
  const [nextId, setNextId] = useState(1);
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string; isPdf?: boolean } | null>(null);
  const [autoSendFile, setAutoSendFile] = useState(false);
  const [showWelcome, setShowWelcome] = useState(true);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [guestMessages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) { setAutoSendFile(false); return; }
    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) { setAutoSendFile(false); alert("File too large. Maximum size is 10MB."); return; }
    const shouldAutoSend = autoSendFile;
    setAutoSendFile(false);
    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      const content = isPdf ? (result.split(",")[1] || result) : result;
      const fileData = { name: file.name, content, isPdf };
      if (shouldAutoSend) {
        doSend("Analyze my credit report and generate my Fundability Index.", fileData);
      } else {
        setAttachedFile(fileData);
      }
    };
    isPdf ? reader.readAsDataURL(file) : reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const doSend = async (text: string, file?: { name: string; content: string; isPdf?: boolean } | null) => {
    const displayText = file ? `${text}\n\n[Attached: ${file.name}]` : text;
    const userMsg: GuestMessage = { id: nextId, role: "user", content: displayText };
    setGuestMessages((prev) => [...prev, userMsg]);
    setNextId((n) => n + 1);
    setIsSending(true);
    try {
      const history = [...guestMessages, userMsg].map((m) => ({ role: m.role, content: m.content }));
      const payload: Record<string, unknown> = { content: text, history };
      if (file) {
        payload.fileContent = file.content;
        payload.attachment = "credit_report";
        payload.fileType = file.isPdf ? "pdf" : "text";
      }
      const res = await fetch("/api/chat/guest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error("Failed to get response");
      const data = await res.json();
      const aiMsg: GuestMessage = { id: nextId + 1, role: "assistant", content: data.content };
      setGuestMessages((prev) => [...prev, aiMsg]);
      setNextId((n) => n + 1);
    } catch {
      const errMsg: GuestMessage = { id: nextId + 1, role: "assistant", content: "Sorry, something went wrong. Please try again." };
      setGuestMessages((prev) => [...prev, errMsg]);
      setNextId((n) => n + 1);
    } finally {
      setIsSending(false);
      inputRef.current?.focus();
    }
  };

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (isSending) return;
    if (!text && !attachedFile) return;
    const file = attachedFile;
    const msg = text || "Analyze my credit report and generate my Fundability Index.";
    setInput("");
    setAttachedFile(null);
    doSend(msg, file);
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); handleSend(); };
  const handleUploadClick = () => { fileInputRef.current?.click(); };
  const hasMessages = guestMessages.length > 0;

  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-[#fafafa]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <input ref={fileInputRef} type="file" accept=".pdf,.txt,.csv" className="hidden" onChange={handleFileSelect} data-testid="input-file-upload" />

      <nav className="flex items-center justify-between px-4 sm:px-6 py-3 shrink-0 border-b border-[#eee]" data-testid="nav-top">
        <div className="flex items-center gap-2" data-testid="nav-logo">
          <ProfundrLogo size="md" variant="dark" />
        </div>
        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-[#999] hidden sm:inline" data-testid="text-user-email">{user.email}</span>
            <button
              onClick={() => window.location.href = user.subscriptionStatus === 'active' ? '/dashboard' : '/subscription'}
              className="rounded-full px-4 py-1.5 text-[12px] font-medium bg-[#1a1a2e] text-white hover:bg-[#2a2a40] transition-colors"
              data-testid="button-dashboard"
            >
              Dashboard
            </button>
          </div>
        ) : (
          <button
            onClick={() => window.location.href = '/auth'}
            className="rounded-full px-5 py-2 text-[13px] font-medium border border-[#ddd] text-[#555] hover:bg-[#f0f0f0] transition-colors"
            data-testid="button-login"
          >
            Log in
          </button>
        )}
      </nav>

      <main className="flex-1 flex flex-col items-center overflow-hidden">
        {!hasMessages && !isSending ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4 gap-6">
            <h1 className="text-[28px] sm:text-[36px] font-semibold text-[#1a1a1a] tracking-[-0.03em] text-center leading-tight" data-testid="text-hero-headline">
              How fundable are you?
            </h1>
            <button
              onClick={() => { setAutoSendFile(true); handleUploadClick(); }}
              className="flex items-center gap-2.5 px-7 py-3 bg-[#1a1a2e] text-white rounded-full text-[14px] font-medium hover:bg-[#2a2a40] transition-colors shadow-sm"
              data-testid="button-upload-report"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 3V12M9 3L5.5 6.5M9 3L12.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 12V14C3 14.5523 3.44772 15 4 15H14C14.5523 15 15 14.5523 15 14V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Upload credit report to get started
            </button>
            <p className="text-[12px] text-[#999]">PDF, TXT, or CSV — your data stays private</p>
          </div>
        ) : (
          <div className="flex-1 w-full max-w-[720px] mx-auto overflow-y-auto px-4 pt-4 pb-2" data-testid="chat-messages">
            <div className="space-y-6">
              {guestMessages.map((msg) => {
                const msgData = msg.role === "assistant" ? parseSingleMessageData(msg.content) : null;
                const showDashboard = msgData && hasAnalysisData(msgData);
                const msgTierColor = msgData ? getTierColor(msgData.riskTier) : "#999";
                const disputes = msg.role === "assistant" ? parseDisputeItems(msg.content) : [];

                return (
                  <div key={msg.id}>
                    <div className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role !== "user" && (
                        <div className="w-7 h-7 rounded-lg bg-[#1a1a2e] flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[10px] font-bold text-white">P</span>
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] ${msg.role === "user" ? "bg-[#f0f0f0] rounded-[20px] rounded-br-[6px] px-4 py-2.5" : "bg-transparent"}`}
                        data-testid={`message-${msg.role}-${msg.id}`}
                      >
                        {msg.role === "user" ? (
                          <p className="text-[14px] text-[#1a1a1a] leading-[1.6] whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <FormatResponse content={msg.content} />
                        )}
                      </div>
                    </div>
                    {showDashboard && (
                      <div className="ml-10">
                        <MissionDashboard data={msgData} tierColor={msgTierColor} />
                      </div>
                    )}
                    {disputes.length > 0 && (
                      <div className="ml-10 mt-3">
                        <div className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm" data-testid="card-disputes">
                          <p className="text-[9px] text-[#999] uppercase tracking-[0.12em] font-medium mb-2.5">Dispute Letters Ready</p>
                          <div className="space-y-2 mb-1">
                            {disputes.map((d, i) => (
                              <div key={i} className="flex items-start gap-2">
                                <div className="w-4 h-4 rounded bg-orange-50 flex items-center justify-center shrink-0 mt-0.5">
                                  <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 6h8M6 2v8" stroke="#f97316" strokeWidth="1.5" strokeLinecap="round" /></svg>
                                </div>
                                <div>
                                  <p className="text-[11px] text-[#333] font-medium">{d.creditor}</p>
                                  <p className="text-[10px] text-[#888]">{d.issue} — {d.bureau}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                          <DisputeDownloadButton disputes={disputes} />
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
              {isSending && (
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 rounded-lg bg-[#1a1a2e] flex items-center justify-center shrink-0 mt-0.5">
                    <span className="text-[10px] font-bold text-white">P</span>
                  </div>
                  <div className="flex items-center gap-1.5 py-2">
                    <span className="w-1.5 h-1.5 bg-[#999] rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-[#999] rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-[#999] rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}
      </main>

      <div className="w-full max-w-[720px] mx-auto px-4 pb-4 shrink-0">
        {!hasMessages && !isSending && (
          <div className="flex flex-wrap justify-center gap-2 mb-3">
            {[
              "Analyze my credit profile",
              "What tier am I in?",
              "Run a denial simulation",
              "How do I improve my score?",
            ].map((suggestion) => (
              <button
                key={suggestion}
                onClick={() => handleSend(suggestion)}
                className="px-3.5 py-2 text-[12px] text-[#666] border border-[#e0e0e0] rounded-full hover:bg-[#f0f0f0] hover:border-[#ccc] transition-colors"
                data-testid={`button-suggestion-${suggestion.toLowerCase().replace(/\s+/g, "-").replace(/[?]/g, "")}`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {attachedFile && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="flex items-center gap-2 bg-[#e8e8e8] rounded-lg px-3 py-1.5 text-[12px] text-[#555]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1V10M3 6H11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <rect x="2" y="2" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
              </svg>
              <span className="max-w-[200px] truncate">{attachedFile.name}</span>
              <button onClick={() => setAttachedFile(null)} className="text-[#999] hover:text-[#666] ml-1" data-testid="button-remove-file">&times;</button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex items-center bg-[#f0f0f0] rounded-full h-[52px] pl-1.5 pr-1.5 border border-[#e5e5e5] shadow-sm focus-within:border-[#ccc] transition-colors">
            <button
              type="button" onClick={handleUploadClick}
              className="w-9 h-9 flex items-center justify-center rounded-full text-[#888] hover:text-[#555] hover:bg-[#e5e5e5] transition-colors shrink-0"
              title="Upload credit report" data-testid="button-attach-file"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M15.75 8.55L9.3075 14.9925C8.59083 15.7092 7.62164 16.1121 6.61125 16.1121C5.60086 16.1121 4.63167 15.7092 3.915 14.9925C3.19833 14.2758 2.79544 13.3067 2.79544 12.2963C2.79544 11.2859 3.19833 10.3167 3.915 9.6L10.3575 3.1575C10.8358 2.67917 11.4845 2.41121 12.16 2.41121C12.8355 2.41121 13.4842 2.67917 13.9625 3.1575C14.4408 3.63583 14.7088 4.28453 14.7088 4.96C14.7088 5.63547 14.4408 6.28417 13.9625 6.7625L7.5125 13.205C7.27333 13.4442 6.94898 13.5782 6.61125 13.5782C6.27352 13.5782 5.94917 13.4442 5.71 13.205C5.47083 12.9658 5.33685 12.6415 5.33685 12.3038C5.33685 11.966 5.47083 11.6417 5.71 11.4025L11.6025 5.5175" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <input
              ref={inputRef} data-testid="input-chat" type="text"
              placeholder={attachedFile ? "Add a message about your report..." : "Ask about your funding readiness..."}
              className="flex-1 bg-transparent text-[14px] text-[#1a1a1a] placeholder:text-[#999] outline-none px-2"
              value={input} onChange={(e) => setInput(e.target.value)} disabled={isSending}
            />
            <button
              data-testid="button-send" type="submit" disabled={isSending || (!input.trim() && !attachedFile)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-[#1a1a2e] text-white hover:bg-[#2a2a40] transition-colors shrink-0 disabled:bg-[#ccc] disabled:cursor-not-allowed"
            >
              {isSending ? <span className="text-[12px]">...</span> : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        </form>

        <p className="text-center text-[11px] text-[#aaa] mt-3 leading-[1.5]" data-testid="text-footer-legal">
          Profundr is a capital intelligence platform, not a lender.{" "}
          <span className="underline cursor-pointer hover:text-[#888] transition-colors">Terms</span> &middot;{" "}
          <span className="underline cursor-pointer hover:text-[#888] transition-colors">Privacy</span>
        </p>
      </div>

      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm px-4" onClick={() => setShowWelcome(false)} data-testid="welcome-overlay">
          <div
            className="relative w-full max-w-sm rounded-xl bg-white border border-[#e8e8e8] px-6 py-5 shadow-xl"
            onClick={(e) => e.stopPropagation()} data-testid="welcome-popup"
          >
            <button
              onClick={() => setShowWelcome(false)}
              className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-[#ccc] hover:text-[#888] transition-colors"
              data-testid="button-close-welcome"
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            <ProfundrLogo size="md" variant="dark" />

            <p className="text-[12px] text-[#888] leading-[1.7] mt-3 mb-5">
              Profundr is a digital underwriting engine that reviews your credit report like a bank would and shows your funding potential before you apply. No hard inquiry, no lending — just secure, clear analysis.
            </p>

            <button
              onClick={() => { setShowWelcome(false); setAutoSendFile(true); handleUploadClick(); }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-[#1a1a2e] text-white rounded-full text-[12px] font-medium hover:bg-[#2a2a40] transition-colors"
              data-testid="button-welcome-upload"
            >
              <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
                <path d="M9 3V12M9 3L5.5 6.5M9 3L12.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 12V14C3 14.5523 3.44772 15 4 15H14C14.5523 15 15 14.5523 15 14V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Upload credit report to get started
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
