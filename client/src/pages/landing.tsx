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

function parseMissionData(messages: GuestMessage[]): MissionData {
  const assistantMsgs = messages.filter((m) => m.role === "assistant");
  const allText = assistantMsgs.map((m) => m.content).join("\n\n");
  const cleanText = allText.replace(/\*+/g, "");

  let fundabilityIndex: number | null = null;
  let riskTier: string | null = null;

  const indexPatterns = [
    /FUNDABILITY\s*INDEX[:\s]*(\d+)\s*\/?\s*100/i,
    /(\d+)\s*\/\s*100\s*[-—]\s*(Prime|Near Prime|Subprime|High Risk)/i,
    /Index[:\s]*(\d+)\s*\/\s*100/i,
    /Index[:\s]*(\d+)\s*[-—]/i,
    /Score[:\s]*(\d+)\s*\/\s*100/i,
  ];
  for (const p of indexPatterns) {
    const m = cleanText.match(p);
    if (m) { fundabilityIndex = parseInt(m[1]); break; }
  }

  const tierPatterns = [
    /(?:Risk\s*)?Tier[:\s]*(Prime|Near Prime|Subprime|High Risk)/i,
    /(\d+)\s*\/\s*100\s*[-—]\s*(Prime|Near Prime|Subprime|High Risk)/i,
    /[-—]\s*(Prime|Near Prime|Subprime|High Risk)/i,
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
    /TOP\s*RISKS?[:\s]*([\s\S]*?)(?=\n\s*(?:NEXT|BORROWING|APPROVAL|SCENARIO)\b|\n\n\n)/i,
    /KEY\s*RISK\s*(?:DRIVERS?|FACTORS?)[:\s]*([\s\S]*?)(?=\n\s*(?:NEXT|BORROWING|OPTIMIZATION|SCENARIO)\b|\n\n\n)/i,
    /RISKS?[:\s]*([\s\S]*?)(?=\n\s*(?:NEXT|BORROWING|APPROVAL|SCENARIO)\b|\n\n\n)/i,
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
    /NEXT\s*MOVES?[^:\n]*[:\s]*([\s\S]*?)(?=\n\s*(?:TOP|BORROWING|APPROVAL|SCENARIO|KEY)\b|\n\n\n|$)/i,
    /OPTIMIZATION\s*(?:ROADMAP)?[:\s]*([\s\S]*?)(?=\n\s*(?:TOP|BORROWING|APPROVAL|SCENARIO)\b|\n\n\n|$)/i,
    /(?:ACTION|IMPROVEMENT)\s*(?:PLAN|ITEMS?|STEPS?)[:\s]*([\s\S]*?)(?=\n\s*(?:TOP|BORROWING|APPROVAL|SCENARIO)\b|\n\n\n|$)/i,
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

function getTierColor(tier: string | null): string {
  if (!tier) return "#999";
  const t = tier.toLowerCase();
  if (t === "prime") return "#22c55e";
  if (t === "near prime") return "#eab308";
  if (t === "subprime") return "#f97316";
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
        const isTitle =
          /^\d+\)\s/.test(trimmed) ||
          /^(FUNDABILITY|FUNDING|KEY FINDINGS|PHASE|TIMELINE|NEXT MOVE|CAPITAL|CLIENT|CERTIFICATION|APPROVAL|ESTIMATED|OPTIMIZATION|SCENARIO|RISK|BORROWING|TOP)/i.test(trimmed) ||
          (trimmed.length < 80 && trimmed === trimmed.toUpperCase() && !trimmed.includes("."));
        const lines = trimmed.split("\n");
        const hasBullets = lines.some((l) => /^\s*[-•]\s/.test(l) || /^\s*\d+[.)]\s/.test(l));

        if (isTitle) {
          return (
            <p key={i} className="text-[13px] font-semibold text-indigo-400 tracking-wide uppercase">
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
                if (bulletMatch) return <p key={j} className="pl-4 text-[14px] text-[#b0b0c0] leading-[1.65]">{"\u2022"} {bulletMatch[1]}</p>;
                if (numMatch) {
                  const num = line.match(/^\s*(\d+)/)?.[1];
                  return <p key={j} className="pl-4 text-[14px] text-[#b0b0c0] leading-[1.65]">{num}. {numMatch[1]}</p>;
                }
                return <p key={j} className="text-[14px] text-[#b0b0c0] leading-[1.65]">{line}</p>;
              })}
            </div>
          );
        }
        return <p key={i} className="text-[14px] text-[#b0b0c0] leading-[1.65]">{trimmed}</p>;
      })}
    </div>
  );
}

function MissionDashboard({ data, tierColor }: { data: MissionData; tierColor: string }) {
  return (
    <div className="w-full mt-4 space-y-3" data-testid="mission-dashboard-inline">
      <div className="flex items-center gap-3 mb-1">
        <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
        <p className="text-[9px] text-[#8a8a9a] uppercase tracking-[0.15em] font-medium">Capital Readiness Dashboard</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
        {data.fundabilityIndex !== null && (
          <div className="relative rounded-xl bg-gradient-to-br from-[#111118] to-[#0d0d14] border border-[#1e1e30] p-4 overflow-hidden" data-testid="card-fundability-index">
            <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-bl from-indigo-500/8 to-transparent rounded-bl-full" />
            <p className="text-[9px] text-[#666] uppercase tracking-[0.15em] font-medium mb-2">Fundability Index</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[32px] font-bold leading-none font-mono tracking-tight" style={{ color: tierColor }} data-testid="text-fundability-score">
                {data.fundabilityIndex}
              </span>
              <span className="text-[14px] text-[#555] font-mono">/100</span>
            </div>
            <div className="mt-3 w-full h-1.5 bg-[#1a1a28] rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-1000 ease-out"
                style={{
                  width: `${data.fundabilityIndex}%`,
                  background: `linear-gradient(90deg, ${tierColor}88, ${tierColor})`
                }}
              />
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
          </div>
        )}

        {data.riskTier && (
          <div className="relative rounded-xl bg-gradient-to-br from-[#111118] to-[#0d0d14] border border-[#1e1e30] p-4 overflow-hidden" data-testid="card-risk-tier">
            <div className="absolute top-0 right-0 w-20 h-20 rounded-bl-full" style={{ background: `linear-gradient(to bottom left, ${tierColor}10, transparent)` }} />
            <p className="text-[9px] text-[#666] uppercase tracking-[0.15em] font-medium mb-2">Risk Classification</p>
            <p className="text-[22px] font-bold tracking-[-0.02em]" style={{ color: tierColor }} data-testid="text-risk-tier">
              {data.riskTier}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: tierColor }} />
              <p className="text-[10px] text-[#666]">
                {data.riskTier === "Prime" ? "Strong approval probability" :
                 data.riskTier === "Near Prime" ? "Moderate approval probability" :
                 data.riskTier === "Subprime" ? "Limited product eligibility" : "Requires credit remediation"}
              </p>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />
          </div>
        )}

        {data.borrowingPower && (
          <div className="relative rounded-xl bg-gradient-to-br from-[#111118] to-[#0d0d14] border border-[#1e1e30] p-4 overflow-hidden" data-testid="card-borrowing-power">
            <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-emerald-500/8 to-transparent rounded-bl-full" />
            <p className="text-[9px] text-[#666] uppercase tracking-[0.15em] font-medium mb-2">Borrowing Power</p>
            <p className="text-[22px] font-bold text-white font-mono tracking-tight" data-testid="text-borrowing-moderate">
              {data.borrowingPower.moderate}
            </p>
            <div className="flex items-center gap-3 mt-1.5">
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-[#333]" />
                <span className="text-[9px] text-[#666] font-mono">{data.borrowingPower.conservative}</span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-600" />
                <span className="text-[9px] text-[#666] font-mono">{data.borrowingPower.aggressive}</span>
              </div>
            </div>
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-emerald-500/20 to-transparent" />
          </div>
        )}
      </div>

      {data.approvalOdds.length > 0 && (
        <div className="relative rounded-xl bg-gradient-to-br from-[#111118] to-[#0d0d14] border border-[#1e1e30] p-4 overflow-hidden" data-testid="card-approval-odds">
          <p className="text-[9px] text-[#666] uppercase tracking-[0.15em] font-medium mb-4">Approval Probability</p>
          <div className="grid grid-cols-5 gap-3">
            {data.approvalOdds.map((item) => {
              const pct = parseInt(item.value);
              const color = pct >= 70 ? "#22c55e" : pct >= 40 ? "#eab308" : "#ef4444";
              return (
                <div key={item.label} className="text-center">
                  <div className="relative w-12 h-12 mx-auto mb-1.5">
                    <svg className="w-12 h-12 -rotate-90" viewBox="0 0 48 48">
                      <circle cx="24" cy="24" r="20" fill="none" stroke="#1a1a28" strokeWidth="3" />
                      <circle cx="24" cy="24" r="20" fill="none" stroke={color} strokeWidth="3"
                        strokeDasharray={`${(pct / 100) * 125.7} 125.7`}
                        strokeLinecap="round"
                        className="transition-all duration-1000"
                      />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-bold font-mono" style={{ color }} data-testid={`text-odds-${item.label.toLowerCase().replace(/\s+/g, "-")}`}>
                        {pct}%
                      </span>
                    </div>
                  </div>
                  <p className="text-[8px] text-[#666] uppercase tracking-wider leading-tight">{item.label}</p>
                </div>
              );
            })}
          </div>
          <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/15 to-transparent" />
        </div>
      )}

      {(data.topRisks.length > 0 || data.nextMoves.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
          {data.topRisks.length > 0 && (
            <div className="relative rounded-xl bg-gradient-to-br from-[#111118] to-[#0d0d14] border border-[#1e1e30] p-4 overflow-hidden" data-testid="card-top-risks">
              <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-red-500/40 via-red-500/10 to-transparent" />
              <p className="text-[9px] text-[#666] uppercase tracking-[0.15em] font-medium mb-3">Risk Factors</p>
              <div className="space-y-2.5">
                {data.topRisks.map((risk, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-md bg-red-500/10 border border-red-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                        <path d="M6 3v3M6 8h.01" stroke="#ef4444" strokeWidth="1.5" strokeLinecap="round" />
                      </svg>
                    </div>
                    <p className="text-[11px] text-[#888] leading-[1.6]">{risk}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {data.nextMoves.length > 0 && (
            <div className="relative rounded-xl bg-gradient-to-br from-[#111118] to-[#0d0d14] border border-[#1e1e30] p-4 overflow-hidden" data-testid="card-next-moves">
              <div className="absolute top-0 left-0 w-0.5 h-full bg-gradient-to-b from-indigo-500/40 via-indigo-500/10 to-transparent" />
              <p className="text-[9px] text-[#666] uppercase tracking-[0.15em] font-medium mb-3">Optimization Queue</p>
              <div className="space-y-2.5">
                {data.nextMoves.map((move, i) => (
                  <div key={i} className="flex items-start gap-2.5">
                    <div className="w-5 h-5 rounded-md bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[9px] font-bold text-indigo-400 font-mono">{i + 1}</span>
                    </div>
                    <p className="text-[11px] text-[#888] leading-[1.6]">{move}</p>
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

function parseSingleMessageData(content: string): MissionData {
  const cleanText = content.replace(/\*+/g, "");

  let fundabilityIndex: number | null = null;
  let riskTier: string | null = null;

  const indexPatterns = [
    /FUNDABILITY\s*INDEX[:\s]*(\d+)\s*\/?\s*100/i,
    /(\d+)\s*\/\s*100\s*[-—]\s*(Prime|Near Prime|Subprime|High Risk)/i,
    /Index[:\s]*(\d+)\s*\/\s*100/i,
    /Index[:\s]*(\d+)\s*[-—]/i,
    /Score[:\s]*(\d+)\s*\/\s*100/i,
  ];
  for (const p of indexPatterns) {
    const m = cleanText.match(p);
    if (m) { fundabilityIndex = parseInt(m[1]); break; }
  }

  const tierPatterns = [
    /(?:Risk\s*)?Tier[:\s]*(Prime|Near Prime|Subprime|High Risk)/i,
    /(\d+)\s*\/\s*100\s*[-—]\s*(Prime|Near Prime|Subprime|High Risk)/i,
    /[-—]\s*(Prime|Near Prime|Subprime|High Risk)/i,
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
    /TOP\s*RISKS?[:\s]*([\s\S]*?)(?=\n\s*(?:NEXT|BORROWING|APPROVAL|SCENARIO)\b|\n\n\n)/i,
    /KEY\s*RISK\s*(?:DRIVERS?|FACTORS?)[:\s]*([\s\S]*?)(?=\n\s*(?:NEXT|BORROWING|OPTIMIZATION|SCENARIO)\b|\n\n\n)/i,
    /RISKS?[:\s]*([\s\S]*?)(?=\n\s*(?:NEXT|BORROWING|APPROVAL|SCENARIO)\b|\n\n\n)/i,
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
    /NEXT\s*MOVES?[^:\n]*[:\s]*([\s\S]*?)(?=\n\s*(?:TOP|BORROWING|APPROVAL|SCENARIO|KEY)\b|\n\n\n|$)/i,
    /OPTIMIZATION\s*(?:ROADMAP)?[:\s]*([\s\S]*?)(?=\n\s*(?:TOP|BORROWING|APPROVAL|SCENARIO)\b|\n\n\n|$)/i,
    /(?:ACTION|IMPROVEMENT)\s*(?:PLAN|ITEMS?|STEPS?)[:\s]*([\s\S]*?)(?=\n\s*(?:TOP|BORROWING|APPROVAL|SCENARIO)\b|\n\n\n|$)/i,
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

  const missionData = parseMissionData(guestMessages);
  const tierColor = getTierColor(missionData.riskTier);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [guestMessages]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) {
      setAutoSendFile(false);
      return;
    }

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setAutoSendFile(false);
      alert("File too large. Maximum size is 10MB.");
      return;
    }

    const shouldAutoSend = autoSendFile;
    setAutoSendFile(false);

    const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");

    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      let content: string;

      if (isPdf) {
        content = result.split(",")[1] || result;
      } else {
        content = result;
      }

      const fileData = { name: file.name, content, isPdf };

      if (shouldAutoSend) {
        doSend("Analyze my credit report and generate my Fundability Index.", fileData);
      } else {
        setAttachedFile(fileData);
      }
    };

    if (isPdf) {
      reader.readAsDataURL(file);
    } else {
      reader.readAsText(file);
    }

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

      if (!res.ok) {
        throw new Error("Failed to get response");
      }

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSend();
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const hasMessages = guestMessages.length > 0;

  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-[#0a0a0f]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.csv"
        className="hidden"
        onChange={handleFileSelect}
        data-testid="input-file-upload"
      />

      <nav className="flex items-center justify-between px-4 sm:px-6 py-3 shrink-0 border-b border-[#1a1a28]" data-testid="nav-top">
        <div className="flex items-center gap-2" data-testid="nav-logo">
          <ProfundrLogo size="md" />
        </div>

        {user ? (
          <div className="flex items-center gap-3">
            <span className="text-[12px] text-[#666] hidden sm:inline" data-testid="text-user-email">{user.email}</span>
            <button
              onClick={() => window.location.href = user.subscriptionStatus === 'active' ? '/dashboard' : '/subscription'}
              className="rounded-full px-4 py-1.5 text-[12px] font-medium bg-[#1e1e30] text-white hover:bg-[#2a2a40] border border-[#2a2a3e] transition-colors"
              data-testid="button-dashboard"
            >
              Dashboard
            </button>
          </div>
        ) : (
          <button
            onClick={() => window.location.href = '/auth'}
            className="rounded-full px-5 py-2 text-[13px] font-medium border border-[#2a2a3e] text-[#888] hover:border-[#444] hover:text-[#bbb] transition-colors"
            data-testid="button-login"
          >
            Log in
          </button>
        )}
      </nav>

      <main className="flex-1 flex flex-col items-center overflow-hidden">
        {!hasMessages && !isSending ? (
          <div className="flex-1 flex flex-col items-center justify-center px-4 gap-8">
            <div className="relative">
              <h1
                className="text-[32px] sm:text-[40px] font-semibold text-white tracking-[-0.03em] text-center leading-tight"
                data-testid="text-hero-headline"
              >
                How fundable are you?
              </h1>
              <div className="absolute -inset-x-10 -inset-y-6 bg-gradient-to-r from-indigo-500/5 via-cyan-500/5 to-indigo-500/5 blur-3xl -z-10 rounded-full" />
            </div>
            <button
              onClick={() => { setAutoSendFile(true); handleUploadClick(); }}
              className="flex items-center gap-2.5 px-7 py-3.5 bg-gradient-to-r from-indigo-600 to-indigo-500 text-white rounded-full text-[14px] font-medium hover:from-indigo-500 hover:to-indigo-400 transition-all shadow-lg shadow-indigo-500/25"
              data-testid="button-upload-report"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M9 3V12M9 3L5.5 6.5M9 3L12.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 12V14C3 14.5523 3.44772 15 4 15H14C14.5523 15 15 14.5523 15 14V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Upload credit report to get started
            </button>
            <p className="text-[12px] text-[#555]">PDF, TXT, or CSV — your data stays private</p>
          </div>
        ) : (
          <div className="flex-1 w-full max-w-[720px] mx-auto overflow-y-auto px-4 pt-4 pb-2" data-testid="chat-messages">
            <div className="space-y-6">
              {guestMessages.map((msg) => {
                const msgMission = msg.role === "assistant" ? parseSingleMessageData(msg.content) : null;
                const showDashboard = msgMission && hasAnalysisData(msgMission);
                const msgTierColor = msgMission ? getTierColor(msgMission.riskTier) : tierColor;

                return (
                  <div key={msg.id}>
                    <div className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                      {msg.role !== "user" && (
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-indigo-500/20">
                          <span className="text-[10px] font-bold text-white">P</span>
                        </div>
                      )}
                      <div
                        className={`max-w-[85%] ${
                          msg.role === "user"
                            ? "bg-[#1e1e30] border border-[#2a2a3e] rounded-[20px] rounded-br-[6px] px-4 py-2.5"
                            : "bg-transparent"
                        }`}
                        data-testid={`message-${msg.role}-${msg.id}`}
                      >
                        {msg.role === "user" ? (
                          <p className="text-[14px] text-[#d0d0e0] leading-[1.6] whitespace-pre-wrap">{msg.content}</p>
                        ) : (
                          <FormatResponse content={msg.content} />
                        )}
                      </div>
                    </div>
                    {showDashboard && (
                      <div className="ml-10">
                        <MissionDashboard data={msgMission} tierColor={msgTierColor} />
                      </div>
                    )}
                  </div>
                );
              })}
              {isSending && (
                <div className="flex gap-3 justify-start">
                  <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-600 to-indigo-500 flex items-center justify-center shrink-0 mt-0.5 shadow-sm shadow-indigo-500/20">
                    <span className="text-[10px] font-bold text-white">P</span>
                  </div>
                  <div className="flex items-center gap-1.5 py-2">
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-1.5 h-1.5 bg-indigo-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
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
                className="px-3.5 py-2 text-[12px] text-[#777] border border-[#1e1e30] rounded-full hover:bg-[#161620] hover:border-[#2a2a3e] hover:text-[#aaa] transition-colors"
                data-testid={`button-suggestion-${suggestion.toLowerCase().replace(/\s+/g, "-").replace(/[?]/g, "")}`}
              >
                {suggestion}
              </button>
            ))}
          </div>
        )}

        {attachedFile && (
          <div className="flex items-center gap-2 mb-2 px-1">
            <div className="flex items-center gap-2 bg-[#1e1e30] border border-[#2a2a3e] rounded-lg px-3 py-1.5 text-[12px] text-[#888]">
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1V10M3 6H11" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" />
                <rect x="2" y="2" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.2" fill="none" />
              </svg>
              <span className="max-w-[200px] truncate">{attachedFile.name}</span>
              <button
                onClick={() => setAttachedFile(null)}
                className="text-[#666] hover:text-[#aaa] ml-1"
                data-testid="button-remove-file"
              >
                &times;
              </button>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="w-full">
          <div className="flex items-center bg-[#111118] rounded-full h-[52px] pl-1.5 pr-1.5 border border-[#1e1e30] shadow-lg shadow-black/20 focus-within:border-[#2a2a3e] focus-within:shadow-indigo-500/5 transition-all">
            <button
              type="button"
              onClick={handleUploadClick}
              className="w-9 h-9 flex items-center justify-center rounded-full text-[#555] hover:text-[#999] hover:bg-[#1e1e30] transition-colors shrink-0"
              title="Upload credit report"
              data-testid="button-attach-file"
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M15.75 8.55L9.3075 14.9925C8.59083 15.7092 7.62164 16.1121 6.61125 16.1121C5.60086 16.1121 4.63167 15.7092 3.915 14.9925C3.19833 14.2758 2.79544 13.3067 2.79544 12.2963C2.79544 11.2859 3.19833 10.3167 3.915 9.6L10.3575 3.1575C10.8358 2.67917 11.4845 2.41121 12.16 2.41121C12.8355 2.41121 13.4842 2.67917 13.9625 3.1575C14.4408 3.63583 14.7088 4.28453 14.7088 4.96C14.7088 5.63547 14.4408 6.28417 13.9625 6.7625L7.5125 13.205C7.27333 13.4442 6.94898 13.5782 6.61125 13.5782C6.27352 13.5782 5.94917 13.4442 5.71 13.205C5.47083 12.9658 5.33685 12.6415 5.33685 12.3038C5.33685 11.966 5.47083 11.6417 5.71 11.4025L11.6025 5.5175" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
            <input
              ref={inputRef}
              data-testid="input-chat"
              type="text"
              placeholder={attachedFile ? "Add a message about your report..." : "Ask about your funding readiness..."}
              className="flex-1 bg-transparent text-[14px] text-[#d0d0e0] placeholder:text-[#555] outline-none px-2"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={isSending}
            />
            <button
              data-testid="button-send"
              type="submit"
              disabled={isSending || (!input.trim() && !attachedFile)}
              className="w-8 h-8 flex items-center justify-center rounded-full bg-gradient-to-r from-indigo-600 to-indigo-500 text-white hover:from-indigo-500 hover:to-indigo-400 transition-all shrink-0 disabled:from-[#222] disabled:to-[#222] disabled:text-[#555] disabled:cursor-not-allowed shadow-sm shadow-indigo-500/20"
            >
              {isSending ? (
                <span className="text-[12px]">...</span>
              ) : (
                <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <path d="M3 8H13M13 8L8.5 3.5M13 8L8.5 12.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
        </form>

        <p className="text-center text-[11px] text-[#444] mt-3 leading-[1.5]" data-testid="text-footer-legal">
          Profundr is a capital intelligence platform, not a lender.{" "}
          <span className="underline cursor-pointer hover:text-[#666] transition-colors">Terms</span> &middot;{" "}
          <span className="underline cursor-pointer hover:text-[#666] transition-colors">Privacy</span>
        </p>
      </div>

      {showWelcome && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm px-4" onClick={() => setShowWelcome(false)} data-testid="welcome-overlay">
          <div
            className="relative w-full max-w-sm rounded-xl bg-[#111118] border border-[#1e1e30] px-6 py-5 shadow-2xl shadow-black/50"
            onClick={(e) => e.stopPropagation()}
            data-testid="welcome-popup"
          >
            <button
              onClick={() => setShowWelcome(false)}
              className="absolute top-3 right-3 w-6 h-6 flex items-center justify-center rounded-full text-[#444] hover:text-[#888] transition-colors"
              data-testid="button-close-welcome"
            >
              <svg width="12" height="12" viewBox="0 0 14 14" fill="none">
                <path d="M3 3L11 11M11 3L3 11" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            <ProfundrLogo size="md" />

            <p className="text-[12px] text-[#888] leading-[1.7] mt-3 mb-5">
              Profundr is a digital underwriting engine that reviews your credit report like a bank would and shows your funding potential before you apply. No hard inquiry, no lending — just secure, clear analysis.
            </p>

            <button
              onClick={() => {
                setShowWelcome(false);
                setAutoSendFile(true);
                handleUploadClick();
              }}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-white text-[#0a0a0f] rounded-full text-[12px] font-medium hover:bg-[#e8e8e8] transition-colors"
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
