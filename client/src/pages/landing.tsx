import { useState, useRef, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/store";
import { ProfundrLogo } from "@/components/profundr-logo";

interface TeamMember {
  id: number;
  friendshipId: number;
  displayName: string;
  email: string;
}

interface TeamInvite {
  id: number;
  friendshipId: number;
  displayName: string;
  email: string;
}

interface TeamMessage {
  id: number;
  senderId: number;
  displayName: string;
  content: string;
  isAi: boolean;
  timestamp: string;
}

interface GuestMessage {
  id: number;
  role: "user" | "assistant" | "team";
  content: string;
  senderName?: string;
  senderId?: number;
}

interface PillarScore {
  label: string;
  value: number;
}

interface MissionData {
  approvalIndex: number | null;
  band: string | null;
  phase: string | null;
  pillarScores: PillarScore[];
  suppressors: string[];
  helping: string[];
  hurting: string[];
}

interface DisputeItem {
  creditor: string;
  accountNumber: string;
  issue: string;
  bureau: string;
  reason: string;
}

function parseDisputeItems(content: string): DisputeItem[] {
  const cleanText = content.replace(/\*+/g, "").replace(/[\u201C\u201D\u201E\u201F"+]/g, '"').replace(/[\u2018\u2019\u201A\u201B'+]/g, "'");
  const disputes: DisputeItem[] = [];
  const lines = cleanText.split("\n");
  for (const line of lines) {
    let trimmed = line.trim();
    trimmed = trimmed.replace(/^\d+[\.\)]\s*/, "");
    trimmed = trimmed.replace(/^[-•]\s*/, "");
    if (!/^DISPUTE:\s*/i.test(trimmed)) continue;
    const afterPrefix = trimmed.replace(/^DISPUTE:\s*/i, "");
    const parts = afterPrefix.split("|").map(p => p.trim());
    const cleanPart = (s: string) => s.replace(/^["'"]+|["'"]+$/g, "").trim();
    if (parts.length >= 5) {
      disputes.push({
        creditor: cleanPart(parts[0]),
        accountNumber: cleanPart(parts[1]),
        issue: cleanPart(parts[2]),
        bureau: cleanPart(parts[3]).replace(/^Bureau:\s*/i, ""),
        reason: cleanPart(parts.slice(4).join(" | "))
      });
    } else if (parts.length >= 3) {
      disputes.push({
        creditor: cleanPart(parts[0]),
        accountNumber: cleanPart(parts[1]) || "N/A",
        issue: cleanPart(parts[2]),
        bureau: cleanPart(parts[3] || "").replace(/^Bureau:\s*/i, "") || "All",
        reason: cleanPart(parts[4] || parts[2])
      });
    }
  }
  return disputes;
}

function parseSingleMessageData(content: string): MissionData {
  const cleanText = content.replace(/\*+/g, "");

  let approvalIndex: number | null = null;
  let band: string | null = null;
  let phase: string | null = null;

  const indexPatterns = [
    /Approval\s*Index[:\s]*(\d+)\s*\/?\s*100/i,
    /FUNDABILITY\s*INDEX[:\s]*(\d+)\s*\/?\s*100/i,
    /(\d+)\s*\/\s*100/i,
    /Index[:\s]*(\d+)\s*\/\s*100/i,
  ];
  for (const p of indexPatterns) {
    const m = cleanText.match(p);
    if (m) { approvalIndex = parseInt(m[1]); break; }
  }

  const bandPatterns = [
    /Band[:\s]*(Exceptional|Strong|Viable|Borderline|Weak|High Risk)/i,
    /[-—]\s*(Exceptional|Strong|Viable|Borderline|Weak|High Risk)/i,
  ];
  for (const p of bandPatterns) {
    const m = cleanText.match(p);
    if (m) { band = m[1]; break; }
  }

  const phasePatterns = [
    /Phase[:\s]*(Repair Phase|Build Phase|Wait Phase|Funding Phase|Repair|Build|Wait|Funding)/i,
  ];
  for (const p of phasePatterns) {
    const m = cleanText.match(p);
    if (m) { phase = m[1]; break; }
  }

  const pillarScores: PillarScore[] = [];
  const pillarPatterns = [
    { label: "Payment Integrity", pattern: /Payment\s*Integrity[:\s]*(\d+)/i },
    { label: "Utilization Control", pattern: /Utilization\s*Control[:\s]*(\d+)/i },
    { label: "File Stability", pattern: /File\s*Stability[:\s]*(\d+)/i },
    { label: "Credit Depth", pattern: /Credit\s*Depth[:\s]*(\d+)/i },
    { label: "Timing Risk", pattern: /Timing\s*Risk[:\s]*(\d+)/i },
    { label: "Lender Confidence", pattern: /Lender\s*Confidence[:\s]*(\d+)/i },
  ];
  for (const { label, pattern } of pillarPatterns) {
    const m = cleanText.match(pattern);
    if (m) pillarScores.push({ label, value: parseInt(m[1]) });
  }

  const suppressors: string[] = [];
  const suppressorMatch = cleanText.match(/Top\s*Approval\s*Suppressors?[:\s]*([\s\S]*?)(?=\n\s*(?:What|Primary|Best|Then|DISPUTE)\b|\n\n)/i);
  if (suppressorMatch) {
    const lines = suppressorMatch[1].split("\n").filter(l => l.trim().match(/^[-•\d]/));
    for (const line of lines.slice(0, 5)) {
      const cleaned = line.replace(/^\s*[-•]\s*/, "").replace(/^\s*\d+[.)]\s*/, "").trim();
      if (cleaned.length > 3) suppressors.push(cleaned);
    }
  }

  const helping: string[] = [];
  const helpingMatch = cleanText.match(/What['']?s\s*Helping[:\s]*([\s\S]*?)(?=\n\s*(?:What|Best|Primary|Top|DISPUTE)\b|\n\n)/i);
  if (helpingMatch) {
    const lines = helpingMatch[1].split("\n").filter(l => l.trim().match(/^[-•\d]/));
    for (const line of lines.slice(0, 4)) {
      const cleaned = line.replace(/^\s*[-•]\s*/, "").replace(/^\s*\d+[.)]\s*/, "").trim();
      if (cleaned.length > 3) helping.push(cleaned);
    }
  }

  const hurting: string[] = [];
  const hurtingMatch = cleanText.match(/What['']?s\s*Hurting[:\s]*([\s\S]*?)(?=\n\s*(?:Best|What|Primary|Top|DISPUTE)\b|\n\n)/i);
  if (hurtingMatch) {
    const lines = hurtingMatch[1].split("\n").filter(l => l.trim().match(/^[-•\d]/));
    for (const line of lines.slice(0, 4)) {
      const cleaned = line.replace(/^\s*[-•]\s*/, "").replace(/^\s*\d+[.)]\s*/, "").trim();
      if (cleaned.length > 3) hurting.push(cleaned);
    }
  }

  return { approvalIndex, band, phase, pillarScores, suppressors, helping, hurting };
}

function hasAnalysisData(data: MissionData): boolean {
  return data.approvalIndex !== null || data.band !== null || data.phase !== null || data.pillarScores.length > 0 || data.suppressors.length > 0 || data.helping.length > 0 || data.hurting.length > 0;
}

function getBandColor(band: string | null): string {
  if (!band) return "#999";
  const b = band.toLowerCase();
  if (b === "exceptional") return "#16a34a";
  if (b === "strong") return "#22c55e";
  if (b === "viable") return "#eab308";
  if (b === "borderline") return "#f97316";
  if (b === "weak") return "#ef4444";
  return "#dc2626";
}

function getPhaseColor(phase: string | null): string {
  if (!phase) return "#999";
  const p = phase.toLowerCase();
  if (p.includes("funding")) return "#22c55e";
  if (p.includes("build")) return "#3b82f6";
  if (p.includes("wait")) return "#eab308";
  return "#ef4444";
}

function getPillarColor(value: number): string {
  if (value >= 85) return "#22c55e";
  if (value >= 70) return "#eab308";
  if (value >= 50) return "#f97316";
  return "#ef4444";
}

function toTitleCase(text: string): string {
  const small = new Set(["a","an","the","and","but","or","for","nor","on","at","to","by","in","of","is","not"]);
  return text
    .toLowerCase()
    .split(/\s+/)
    .map((word, i) => {
      if (i === 0 || !small.has(word)) return word.charAt(0).toUpperCase() + word.slice(1);
      return word;
    })
    .join(" ");
}

function normalizeCase(text: string): string {
  if (text === text.toUpperCase() && text.length > 3) return toTitleCase(text);
  return text;
}

function FormatResponse({ content }: { content: string }) {
  const cleaned = content
    .replace(/\*\*\*/g, "")
    .replace(/\*\*/g, "")
    .replace(/\*/g, "")
    .replace(/^---+$/gm, "")
    .replace(/^-{2,}/gm, "");

  const isMetricLine = (line: string): boolean => {
    const t = line.trim().replace(/^[-•–—]\s*/, "");
    if (!t) return true;
    if (/Approval\s*Index/i.test(t)) return true;
    if (/FUNDABILITY\s*INDEX/i.test(t)) return true;
    if (/^Band[:\s]/i.test(t)) return true;
    if (/^Phase[:\s]/i.test(t)) return true;
    if (/Pillar\s*Scores?/i.test(t)) return true;
    if (/^(Payment\s*Integrity|Utilization\s*Control|File\s*Stability|Credit\s*Depth|Timing\s*Risk|Lender\s*Confidence)[:\s]*\d+/i.test(t)) return true;
    if (/Top\s*Approval\s*Suppressors?/i.test(t)) return true;
    if (/What['']?s\s*(Helping|Hurting)/i.test(t)) return true;
    if (/Best\s*Next\s*Move/i.test(t)) return true;
    if (/What\s*Not\s*[Tt]o\s*Do/i.test(t)) return true;
    if (/Primary\s*Diagnosis/i.test(t)) return true;
    if (/APPROVAL\s*ODDS/i.test(t)) return true;
    if (/BORROWING\s*POWER/i.test(t)) return true;
    if (/DISPUTE\s*ITEMS?\s*:?$/i.test(t)) return true;
    if (/^(Bank\s*Term\s*Loan|Online\s*Lender|Business\s*LOC|Credit\s*Card|MCA)\s*:/i.test(t)) return true;
    if (/Conservative\s*:/i.test(t)) return true;
    if (/^\d+\s*\/\s*100/i.test(t)) return true;
    if (/^(Exceptional|Strong|Viable|Borderline|Weak|High Risk)$/i.test(t)) return true;
    if (/^(Repair|Build|Wait|Funding)\s*Phase$/i.test(t)) return true;
    return false;
  };

  const allLines = cleaned.split("\n");
  const verdictLines = allLines.filter(l => {
    const t = l.trim();
    if (!t) return false;
    if (isMetricLine(t)) return false;
    if (/^DISPUTE:/i.test(t)) return false;
    const stripped = t.replace(/^\d+[\.\)]\s*/, "").replace(/^[-•]\s*/, "");
    if (/^DISPUTE:/i.test(stripped)) return false;
    if (/^(Key\s*Next\s*Steps|Dispute\s*Items|Dispute\s*Strategy|Legal\s*Basis|Required\s*Action|Round\s*\d)/i.test(stripped)) return false;
    if (/^(Focus on|Submit disputes|Lower your|Please provide additional)/i.test(stripped)) return false;
    if (/^Verdict:?\s*$/i.test(stripped)) return false;
    if (/^(Top\s*Approval\s*Suppressors?|What['']?s\s*Helping|What['']?s\s*Hurting|Best\s*Next\s*Move|What\s*Not\s*[Tt]o\s*Do|Primary\s*Diagnosis|Pillar\s*Scores?)/i.test(stripped)) return false;
    return true;
  });

  return (
    <div className="space-y-2">
      {verdictLines.map((line, i) => (
        <p key={i} className="text-[14px] text-[#444] leading-[1.65]">{normalizeCase(line.trim())}</p>
      ))}
    </div>
  );
}

function MissionDashboard({ data }: { data: MissionData }) {
  const bandColor = getBandColor(data.band);
  const phaseColor = getPhaseColor(data.phase);

  return (
    <div className="w-full mt-4 space-y-2.5" data-testid="mission-dashboard-inline">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        {data.approvalIndex !== null && (
          <div className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm" data-testid="card-approval-index">
            <p className="text-[10px] text-[#999] tracking-[0.01em] font-medium mb-2">Approval Index</p>
            <div className="flex items-baseline gap-1.5">
              <span className="text-[28px] font-bold leading-none font-mono tracking-tight" style={{ color: bandColor }} data-testid="text-approval-score">
                {data.approvalIndex}
              </span>
              <span className="text-[13px] text-[#ccc] font-mono">/100</span>
            </div>
            <div className="mt-2.5 w-full h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${data.approvalIndex}%`, backgroundColor: bandColor }} />
            </div>
          </div>
        )}

        {data.band && (
          <div className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm" data-testid="card-band">
            <p className="text-[10px] text-[#999] tracking-[0.01em] font-medium mb-2">Band</p>
            <p className="text-[20px] font-bold tracking-[-0.02em]" style={{ color: bandColor }} data-testid="text-band">
              {data.band}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: bandColor }} />
              <p className="text-[10px] text-[#999]">
                {data.band === "Exceptional" ? "Premium approval readiness" :
                 data.band === "Strong" ? "Strong approval probability" :
                 data.band === "Viable" ? "Moderate approval potential" :
                 data.band === "Borderline" ? "Conditional eligibility" :
                 data.band === "Weak" ? "Limited product eligibility" : "Requires credit remediation"}
              </p>
            </div>
          </div>
        )}

        {data.phase && (
          <div className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm" data-testid="card-phase">
            <p className="text-[10px] text-[#999] tracking-[0.01em] font-medium mb-2">Current Phase</p>
            <p className="text-[18px] font-bold tracking-[-0.02em]" style={{ color: phaseColor }} data-testid="text-phase">
              {data.phase}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: phaseColor }} />
              <p className="text-[10px] text-[#999]">
                {data.phase.toLowerCase().includes("funding") ? "Ready for controlled applications" :
                 data.phase.toLowerCase().includes("build") ? "Strengthen structure before applying" :
                 data.phase.toLowerCase().includes("wait") ? "Pause — timing pressure active" : "Address negatives before funding"}
              </p>
            </div>
          </div>
        )}
      </div>

      {data.pillarScores.length > 0 && (
        <div className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm" data-testid="card-pillar-scores">
          <p className="text-[10px] text-[#999] tracking-[0.01em] font-medium mb-3">Pillar Scores</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
            {data.pillarScores.map((pillar) => {
              const color = getPillarColor(pillar.value);
              return (
                <div key={pillar.label} data-testid={`pillar-${pillar.label.toLowerCase().replace(/\s+/g, "-")}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[#666]">{pillar.label}</span>
                    <span className="text-[11px] font-bold font-mono" style={{ color }}>{pillar.value}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${pillar.value}%`, backgroundColor: color }} />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {(data.suppressors.length > 0 || data.helping.length > 0 || data.hurting.length > 0) && (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {data.suppressors.length > 0 && (
            <div className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm" data-testid="card-suppressors">
              <p className="text-[10px] text-[#999] tracking-[0.01em] font-medium mb-2.5">Top Approval Suppressors</p>
              <div className="space-y-2">
                {data.suppressors.map((s, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[8px] font-bold text-red-500">{i + 1}</span>
                    </div>
                    <p className="text-[11px] text-[#555] leading-[1.5]">{s}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {(data.helping.length > 0 || data.hurting.length > 0) && (
            <div className="space-y-2">
              {data.helping.length > 0 && (
                <div className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm" data-testid="card-helping">
                  <p className="text-[10px] text-[#999] tracking-[0.01em] font-medium mb-2">What's Helping</p>
                  <div className="space-y-1.5">
                    {data.helping.map((h, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-3.5 h-3.5 rounded bg-green-50 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[8px] text-green-600">+</span>
                        </div>
                        <p className="text-[10px] text-[#555] leading-[1.5]">{h}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {data.hurting.length > 0 && (
                <div className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm" data-testid="card-hurting">
                  <p className="text-[10px] text-[#999] tracking-[0.01em] font-medium mb-2">What's Hurting</p>
                  <div className="space-y-1.5">
                    {data.hurting.map((h, i) => (
                      <div key={i} className="flex items-start gap-2">
                        <div className="w-3.5 h-3.5 rounded bg-red-50 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[8px] text-red-500">-</span>
                        </div>
                        <p className="text-[10px] text-[#555] leading-[1.5]">{h}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
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
      const data = await res.json();
      if (data.downloadUrl) {
        const pdfRes = await fetch(data.downloadUrl);
        if (!pdfRes.ok) throw new Error("Download failed");
        const blob = await pdfRes.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = "profundr-dispute-letters.pdf";
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
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

interface SavedDoc {
  id: string;
  name: string;
  type: "dispute_letter" | "credit_report" | "other";
  savedAt: number;
  fileDataUrl?: string;
  disputes?: DisputeItem[];
}

function loadSavedDocs(): SavedDoc[] {
  try {
    const raw = localStorage.getItem("profundr_docs");
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

function saveDocs(docs: SavedDoc[]) {
  localStorage.setItem("profundr_docs", JSON.stringify(docs));
}

function TeamSection({ user }: { user: any }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: number; displayName: string; email: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [team, setTeam] = useState<{ members: TeamMember[]; pending: TeamInvite[] }>({ members: [], pending: [] });
  const [showSearch, setShowSearch] = useState(false);
  const [inviting, setInviting] = useState<number | null>(null);

  const fetchTeam = useCallback(async () => {
    if (!user) return;
    try {
      const res = await fetch("/api/team");
      if (res.ok) setTeam(await res.json());
    } catch {}
  }, [user]);

  useEffect(() => { fetchTeam(); }, [fetchTeam]);

  const handleSearch = async (q: string) => {
    setSearchQuery(q);
    if (q.length < 2) { setSearchResults([]); setSearching(false); return; }
    setSearching(true);
    try {
      const res = await fetch(`/api/users/search?q=${encodeURIComponent(q)}`);
      if (res.ok) setSearchResults(await res.json());
    } catch {}
    setSearching(false);
  };

  const handleInvite = async (receiverId: number) => {
    setInviting(receiverId);
    try {
      const res = await fetch("/api/team/invite", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ receiverId }) });
      if (res.ok) { fetchTeam(); setSearchResults(prev => prev.filter(r => r.id !== receiverId)); }
    } catch {}
    setInviting(null);
  };

  const handleAccept = async (friendshipId: number) => {
    try {
      await fetch("/api/team/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ friendshipId }) });
      fetchTeam();
    } catch {}
  };

  const handleReject = async (friendshipId: number) => {
    try {
      await fetch("/api/team/reject", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ friendshipId }) });
      fetchTeam();
    } catch {}
  };

  const handleRemove = async (friendshipId: number) => {
    try {
      await fetch(`/api/team/${friendshipId}`, { method: "DELETE" });
      fetchTeam();
    } catch {}
  };

  if (!user) {
    return (
      <div className="mb-4">
        <div className="flex items-center gap-2 mb-2">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="4" cy="4" r="2" stroke="#6366f1" strokeWidth="1" fill="none" /><circle cx="8" cy="4" r="2" stroke="#6366f1" strokeWidth="1" fill="none" /><path d="M1 10c0-2 1.5-3 3-3s3 1 3 3" stroke="#6366f1" strokeWidth="0.8" fill="none" /></svg>
          <span className="text-[11px] font-medium text-[#666] uppercase tracking-wider">Team</span>
        </div>
        <p className="text-[11px] text-[#bbb] pl-5 italic">Sign in to add team members</p>
      </div>
    );
  }

  return (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="4" cy="4" r="2" stroke="#6366f1" strokeWidth="1" fill="none" /><circle cx="8" cy="4" r="2" stroke="#6366f1" strokeWidth="1" fill="none" /><path d="M1 10c0-2 1.5-3 3-3s3 1 3 3" stroke="#6366f1" strokeWidth="0.8" fill="none" /></svg>
        <span className="text-[11px] font-medium text-[#666] uppercase tracking-wider">Team</span>
        <span className="text-[10px] text-[#aaa] ml-auto">{team.members.length}</span>
      </div>

      {team.pending.length > 0 && (
        <div className="pl-5 mb-2 space-y-1">
          {team.pending.map(inv => (
            <div key={inv.friendshipId} className="flex items-center gap-1.5 py-1.5 rounded-lg bg-[#f8f7ff] px-2" data-testid={`team-invite-${inv.id}`}>
              <div className="w-5 h-5 rounded-full bg-[#6366f1] text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                {inv.displayName[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[#444] truncate">{inv.displayName}</p>
                <p className="text-[8px] text-[#999]">wants to join</p>
              </div>
              <button onClick={() => handleAccept(inv.friendshipId)} className="text-[9px] text-green-600 font-medium hover:underline" data-testid={`button-accept-invite-${inv.id}`}>Accept</button>
              <button onClick={() => handleReject(inv.friendshipId)} className="text-[9px] text-red-400 font-medium hover:underline" data-testid={`button-reject-invite-${inv.id}`}>Decline</button>
            </div>
          ))}
        </div>
      )}

      {team.members.length === 0 ? (
        <p className="text-[11px] text-[#bbb] pl-5 italic mb-2">No team members yet</p>
      ) : (
        <div className="space-y-1 mb-2">
          {team.members.map(m => (
            <div key={m.friendshipId} className="flex items-center gap-1.5 pl-5 py-1.5 rounded-lg hover:bg-[#f5f5f5] group transition-colors" data-testid={`team-member-${m.id}`}>
              <div className="w-5 h-5 rounded-full bg-[#1a1a2e] text-white flex items-center justify-center text-[9px] font-bold shrink-0">
                {m.displayName[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[#444] truncate">{m.displayName}</p>
              </div>
              <button onClick={() => handleRemove(m.friendshipId)} className="opacity-0 group-hover:opacity-100 text-[#ccc] hover:text-red-400 transition-all p-0.5" data-testid={`button-remove-member-${m.id}`}>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
              </button>
            </div>
          ))}
        </div>
      )}

      {showSearch ? (
        <div className="pl-5 space-y-2">
          <div className="relative">
            <input
              data-testid="input-team-search"
              type="text"
              placeholder="Search by email..."
              className="w-full bg-[#f5f5f5] border border-[#e5e5e5] rounded-lg h-[32px] pl-3 pr-8 text-[11px] text-[#333] placeholder:text-[#aaa] outline-none focus:border-[#999] transition-colors"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              autoFocus
            />
            <button onClick={() => { setShowSearch(false); setSearchQuery(""); setSearchResults([]); }} className="absolute right-2 top-1/2 -translate-y-1/2 text-[#aaa] hover:text-[#666]">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
            </button>
          </div>
          {searching && <p className="text-[10px] text-[#999]">Searching...</p>}
          {searchResults.map(r => (
            <div key={r.id} className="flex items-center gap-1.5 py-1 rounded-lg" data-testid={`search-result-${r.id}`}>
              <div className="w-5 h-5 rounded-full bg-[#e0e0e0] text-[#666] flex items-center justify-center text-[9px] font-bold shrink-0">
                {r.displayName[0]?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[#444] truncate">{r.displayName}</p>
                <p className="text-[8px] text-[#999] truncate">{r.email}</p>
              </div>
              <button
                onClick={() => handleInvite(r.id)}
                disabled={inviting === r.id}
                className="text-[9px] text-[#6366f1] font-medium hover:underline disabled:opacity-50"
                data-testid={`button-invite-${r.id}`}
              >
                {inviting === r.id ? "..." : "Invite"}
              </button>
            </div>
          ))}
        </div>
      ) : (
        <button
          onClick={() => setShowSearch(true)}
          className="ml-5 flex items-center gap-1.5 text-[11px] text-[#6366f1] hover:text-[#4f46e5] font-medium transition-colors"
          data-testid="button-add-team-member"
        >
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1v8M1 5h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
          Add Team Member
        </button>
      )}
    </div>
  );
}

function DocsPanel({ docs, onClose, onDelete, onSave, user }: { docs: SavedDoc[]; onClose: () => void; onDelete: (id: string) => void; onSave: (doc: SavedDoc) => void; user: any }) {
  const docInputRef = useRef<HTMLInputElement>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);

  const handleUploadDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const doc: SavedDoc = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: file.name,
        type: file.name.toLowerCase().includes("dispute") ? "dispute_letter" : file.name.toLowerCase().includes("credit") ? "credit_report" : "other",
        savedAt: Date.now(),
        fileDataUrl: reader.result as string,
      };
      onSave(doc);
    };
    reader.readAsDataURL(file);
    if (docInputRef.current) docInputRef.current.value = "";
  };

  const handleDownload = async (doc: SavedDoc) => {
    setDownloadingId(doc.id);
    try {
      if (doc.disputes && doc.disputes.length > 0) {
        const res = await fetch("/api/dispute-letters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ disputes: doc.disputes })
        });
        if (!res.ok) throw new Error("Failed to generate");
        const data = await res.json();
        if (data.downloadUrl) {
          const pdfRes = await fetch(data.downloadUrl);
          if (!pdfRes.ok) throw new Error("Download failed");
          const blob = await pdfRes.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = doc.name.endsWith(".pdf") ? doc.name : `${doc.name}.pdf`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
      } else if (doc.fileDataUrl) {
        const a = document.createElement("a");
        a.href = doc.fileDataUrl;
        a.download = doc.name;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
    } catch {
      alert("Failed to download. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const disputeLetters = docs.filter(d => d.type === "dispute_letter");
  const creditReports = docs.filter(d => d.type === "credit_report");
  const otherDocs = docs.filter(d => d.type === "other");

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  };

  const DocGroup = ({ title, items, icon }: { title: string; items: SavedDoc[]; icon: React.ReactNode }) => (
    <div className="mb-4">
      <div className="flex items-center gap-2 mb-2">
        {icon}
        <span className="text-[11px] font-medium text-[#666] uppercase tracking-wider">{title}</span>
        <span className="text-[10px] text-[#aaa] ml-auto">{items.length}</span>
      </div>
      {items.length === 0 ? (
        <p className="text-[11px] text-[#bbb] pl-5 italic">No documents yet</p>
      ) : (
        <div className="space-y-1">
          {items.map(doc => {
            const canDownload = !!(doc.disputes?.length || doc.fileDataUrl);
            const isDownloading = downloadingId === doc.id;
            return (
              <div key={doc.id} className="flex items-center gap-1.5 pl-5 py-1.5 rounded-lg hover:bg-[#f5f5f5] group transition-colors" data-testid={`doc-item-${doc.id}`}>
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" className="shrink-0">
                  <rect x="2" y="1" width="8" height="10" rx="1" stroke="#999" strokeWidth="1" fill="none" />
                  <path d="M4 4h4M4 6h4M4 8h2" stroke="#bbb" strokeWidth="0.8" strokeLinecap="round" />
                </svg>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-[#444] truncate">{doc.name}</p>
                  <p className="text-[9px] text-[#bbb]">{formatDate(doc.savedAt)}</p>
                </div>
                {canDownload && (
                  <button
                    onClick={() => handleDownload(doc)}
                    disabled={isDownloading}
                    className="opacity-0 group-hover:opacity-100 text-[#aaa] hover:text-[#1a1a2e] transition-all p-0.5 disabled:opacity-50"
                    title="Download"
                    data-testid={`button-download-doc-${doc.id}`}
                  >
                    {isDownloading ? (
                      <span className="text-[9px]">...</span>
                    ) : (
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v6M6 8L4 6M6 8l2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 9v1h8V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                    )}
                  </button>
                )}
                <button
                  onClick={() => onDelete(doc.id)}
                  className="opacity-0 group-hover:opacity-100 text-[#ccc] hover:text-red-400 transition-all p-0.5"
                  data-testid={`button-delete-doc-${doc.id}`}
                >
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white border-r border-[#eee]" data-testid="docs-panel">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#eee]">
        <div className="flex items-center gap-2">
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 4C2 3.44772 2.44772 3 3 3H6L7.5 5H13C13.5523 5 14 5.44772 14 6V12C14 12.5523 13.5523 13 13 13H3C2.44772 13 2 12.5523 2 12V4Z" stroke="#666" strokeWidth="1.2" fill="none" />
          </svg>
          <span className="text-[13px] font-semibold text-[#333]">My Documents</span>
        </div>
        <button onClick={onClose} className="text-[#999] hover:text-[#555] transition-colors p-1" data-testid="button-close-docs">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">
        <DocGroup
          title="Dispute Letters"
          items={disputeLetters}
          icon={<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M2 6h6M2 9h4" stroke="#f97316" strokeWidth="1.2" strokeLinecap="round" /></svg>}
        />
        <DocGroup
          title="Credit Reports"
          items={creditReports}
          icon={<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="2" y="1" width="8" height="10" rx="1" stroke="#3b82f6" strokeWidth="1" fill="none" /><path d="M4 4h4M4 6h4" stroke="#3b82f6" strokeWidth="0.8" strokeLinecap="round" /></svg>}
        />
        <DocGroup
          title="Other"
          items={otherDocs}
          icon={<svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="2" y="1" width="8" height="10" rx="1" stroke="#999" strokeWidth="1" fill="none" /></svg>}
        />
        <div className="w-full h-px bg-[#eee] my-3"></div>
        <TeamSection user={user} />
      </div>

      <div className="px-4 py-3 border-t border-[#eee]">
        <input ref={docInputRef} type="file" className="hidden" onChange={handleUploadDoc} data-testid="input-doc-upload" />
        <button
          onClick={() => docInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-2 text-[12px] font-medium text-[#666] border border-dashed border-[#ddd] rounded-lg hover:bg-[#f5f5f5] hover:border-[#ccc] transition-colors"
          data-testid="button-add-doc"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
          Add Document
        </button>
        <p className="text-[9px] text-[#bbb] text-center mt-2 leading-[1.5]">
          Save dispute letters and reports here for easy access
        </p>
      </div>
    </div>
  );
}

export default function LandingPage() {
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [guestMessages, setGuestMessages] = useState<GuestMessage[]>([]);
  const [nextId, setNextId] = useState(1);
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string; isPdf?: boolean } | null>(null);
  const [autoSendFile, setAutoSendFile] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [savedDocs, setSavedDocs] = useState<SavedDoc[]>(loadSavedDocs);
  const [teamTyping, setTeamTyping] = useState<string | null>(null);
  const lastTeamMsgId = useRef(0);
  const { user } = useAuth();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!user) return;
    const poll = async () => {
      try {
        const res = await fetch("/api/team/messages");
        if (!res.ok) return;
        const msgs: TeamMessage[] = await res.json();
        if (msgs.length > 0) {
          const otherMsgs = msgs.filter(m => m.senderId !== user.id);
          const newMsgs = otherMsgs.filter(m => m.id > lastTeamMsgId.current);
          if (newMsgs.length > 0) {
            setGuestMessages(prev => {
              const existingTeamIds = new Set(prev.filter(p => p.role === "team").map(p => p.id));
              const teamMsgs: GuestMessage[] = newMsgs
                .filter(m => !existingTeamIds.has(m.id + 100000))
                .map(m => ({
                  id: m.id + 100000,
                  role: "team" as const,
                  content: m.content,
                  senderName: m.displayName,
                  senderId: m.senderId,
                }));
              return teamMsgs.length > 0 ? [...prev, ...teamMsgs] : prev;
            });
          }
          lastTeamMsgId.current = Math.max(...msgs.map(m => m.id));
        }
      } catch {}
    };
    poll();
    const interval = setInterval(poll, 5000);
    return () => clearInterval(interval);
  }, [user]);

  const handleSaveDoc = (doc: SavedDoc) => {
    const updated = [doc, ...savedDocs];
    setSavedDocs(updated);
    saveDocs(updated);
  };

  const handleDeleteDoc = (id: string) => {
    const updated = savedDocs.filter(d => d.id !== id);
    setSavedDocs(updated);
    saveDocs(updated);
  };

  const handleSaveDisputeLetters = (disputes: DisputeItem[]) => {
    const doc: SavedDoc = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      name: `Dispute Letters — ${new Date().toLocaleDateString()}`,
      type: "dispute_letter",
      savedAt: Date.now(),
      disputes,
    };
    handleSaveDoc(doc);
    setDocsOpen(true);
  };

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
        doSend("Analyze my credit report and generate my Approval Index.", fileData);
      } else {
        setAttachedFile(fileData);
      }
    };
    isPdf ? reader.readAsDataURL(file) : reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const doSend = async (text: string, file?: { name: string; content: string; isPdf?: boolean } | null) => {
    const displayText = file ? `${text}\n\n[Attached: ${file.name}]` : text;
    const userMsg: GuestMessage = { id: nextId, role: "user", content: displayText, senderName: user?.displayName || user?.email };
    setGuestMessages((prev) => [...prev, userMsg]);
    setNextId((n) => n + 1);
    setIsSending(true);
    if (user) {
      try { await fetch("/api/team/message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: displayText }) }); } catch {}
    }
    try {
      const history = [...guestMessages, userMsg].map((m) => ({ role: m.role === "team" ? "user" : m.role, content: m.content }));
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
    const msg = text || "Analyze my credit report and generate my Approval Index.";
    setInput("");
    setAttachedFile(null);
    doSend(msg, file);
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); handleSend(); };
  const handleUploadClick = () => { fileInputRef.current?.click(); };
  const hasMessages = guestMessages.length > 0;

  return (
    <div className="relative h-[100dvh] flex bg-[#fafafa]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <input ref={fileInputRef} type="file" accept=".pdf,.txt,.csv" className="hidden" onChange={handleFileSelect} data-testid="input-file-upload" />

      {docsOpen && (
        <>
          <div className="sm:hidden fixed inset-0 bg-black/30 z-40" onClick={() => setDocsOpen(false)} />
          <div className="fixed sm:relative z-50 sm:z-auto w-[280px] h-full shrink-0 transition-all" data-testid="docs-sidebar">
            <DocsPanel docs={savedDocs} onClose={() => setDocsOpen(false)} onDelete={handleDeleteDoc} onSave={handleSaveDoc} user={user} />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <div className="flex-1 overflow-y-auto" data-testid="main-scroll-area">
          <nav className="sticky top-0 z-30 bg-[#fafafa]/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#eee]" data-testid="nav-top">
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDocsOpen(!docsOpen)}
                className="relative w-8 h-8 flex items-center justify-center rounded-lg text-[#888] hover:text-[#555] hover:bg-[#eee] transition-colors mr-1"
                title="My Documents"
                data-testid="button-toggle-docs"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2C9.5 2 7.5 4 7.5 6.5c0 .5-.4 1-1 1C4.5 7.5 3 9.5 3 11.5c0 1.5.8 2.8 2 3.5 0 0-.5 1.5-.5 2.5C4.5 20 6.5 22 9 22c1.5 0 2.5-.5 3-1.5.5 1 1.5 1.5 3 1.5 2.5 0 4.5-2 4.5-4.5 0-1-.5-2.5-.5-2.5 1.2-.7 2-2 2-3.5 0-2-1.5-4-3.5-4-.6 0-1-.5-1-1C16.5 4 14.5 2 12 2z" />
                  <path d="M12 2v20" />
                  <path d="M7.5 7.5C9 8.5 10 10 10.5 12" />
                  <path d="M16.5 7.5C15 8.5 14 10 13.5 12" />
                </svg>
                {savedDocs.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-3.5 h-3.5 bg-[#1a1a2e] text-white rounded-full text-[8px] flex items-center justify-center font-bold">{savedDocs.length}</span>
                )}
              </button>
              <div data-testid="nav-logo">
                <ProfundrLogo size="md" variant="dark" />
              </div>
            </div>
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-[#999] hidden sm:inline" data-testid="text-user-email">{user.email}</span>
                <button
                  onClick={() => window.location.href = '/subscription'}
                  className="rounded-full px-4 py-1.5 text-[12px] font-medium bg-[#1a1a2e] text-white hover:bg-[#2a2a40] transition-colors"
                  data-testid="button-subscription"
                >
                  Subscription
                </button>
              </div>
            ) : (
              <button
                onClick={() => window.location.href = '/subscription'}
                className="rounded-full px-5 py-2 text-[13px] font-medium border border-[#ddd] text-[#555] hover:bg-[#f0f0f0] transition-colors"
                data-testid="button-subscribe"
              >
                Subscribe
              </button>
            )}
          </nav>

          {!hasMessages && !isSending ? (
            <div className="flex-1 flex flex-col items-center justify-center px-4 gap-4 min-h-[calc(100dvh-180px)]">
              <h1 className="text-[28px] sm:text-[36px] font-semibold text-[#1a1a1a] tracking-[-0.03em] text-center leading-tight" data-testid="text-hero-headline">
                Are you fundable?
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
              <p className="text-[11px] text-[#999] text-center max-w-[240px] leading-[1.6]" data-testid="text-upload-description">
                Profundr reviews your credit report like a bank would and shows your funding potential before you apply. No hard inquiry, no lending — just secure, clear analysis.
              </p>
            </div>
          ) : (
            <div className="w-full max-w-[720px] mx-auto px-4 pt-4 pb-2" data-testid="chat-messages">
              <div className="space-y-6">
                {guestMessages.map((msg) => {
                  const msgData = msg.role === "assistant" ? parseSingleMessageData(msg.content) : null;
                  const showDashboard = msgData && hasAnalysisData(msgData);
                  const disputes = msg.role === "assistant" ? parseDisputeItems(msg.content) : [];

                  return (
                    <div key={msg.id}>
                      {msg.role === "team" ? (
                        <div className="flex gap-3 justify-start">
                          <div className="w-7 h-7 rounded-full bg-[#6366f1] text-white flex items-center justify-center text-[11px] font-bold shrink-0 mt-0.5" title={msg.senderName}>
                            {msg.senderName?.[0]?.toUpperCase() || "T"}
                          </div>
                          <div className="max-w-[85%]" data-testid={`message-team-${msg.id}`}>
                            <p className="text-[10px] text-[#6366f1] font-medium mb-0.5">{msg.senderName}</p>
                            <div className="bg-[#f0eeff] rounded-[20px] rounded-bl-[6px] px-4 py-2.5">
                              <p className="text-[14px] text-[#1a1a1a] leading-[1.6] whitespace-pre-wrap">{msg.content}</p>
                            </div>
                          </div>
                        </div>
                      ) : (
                      <div className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        {msg.role === "assistant" && (
                          <div className="w-7 h-7 rounded-lg bg-[#1a1a2e] flex items-center justify-center shrink-0 mt-0.5">
                            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                              <path d="M12 2C9.5 2 7.5 4 7.5 6.5c0 .5-.4 1-1 1C4.5 7.5 3 9.5 3 11.5c0 1.5.8 2.8 2 3.5 0 0-.5 1.5-.5 2.5C4.5 20 6.5 22 9 22c1.5 0 2.5-.5 3-1.5.5 1 1.5 1.5 3 1.5 2.5 0 4.5-2 4.5-4.5 0-1-.5-2.5-.5-2.5 1.2-.7 2-2 2-3.5 0-2-1.5-4-3.5-4-.6 0-1-.5-1-1C16.5 4 14.5 2 12 2z" />
                              <path d="M12 2v20" />
                              <path d="M7.5 7.5C9 8.5 10 10 10.5 12" />
                              <path d="M16.5 7.5C15 8.5 14 10 13.5 12" />
                              <path d="M5 15c2-.5 3.5-1 5-3" />
                              <path d="M19 15c-2-.5-3.5-1-5-3" />
                            </svg>
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
                      )}
                      {showDashboard && (
                        <div className="ml-10">
                          <MissionDashboard data={msgData} />
                        </div>
                      )}
                      {disputes.length > 0 && (
                        <div className="ml-10 mt-3">
                          <div className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm" data-testid="card-disputes">
                            <p className="text-[10px] text-[#999] tracking-[0.01em] font-medium mb-2.5">Dispute Letters Ready</p>
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
                            <div className="flex items-center gap-2 flex-wrap">
                              <DisputeDownloadButton disputes={disputes} />
                              <button
                                onClick={() => handleSaveDisputeLetters(disputes)}
                                className="mt-3 flex items-center gap-2 px-4 py-2 bg-white text-[#555] border border-[#ddd] rounded-lg text-[12px] font-medium hover:bg-[#f5f5f5] transition-colors"
                                data-testid="button-save-to-docs"
                              >
                                <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                  <path d="M2 4C2 3.44772 2.44772 3 3 3H6L7.5 5H13C13.5523 5 14 5.44772 14 6V12C14 12.5523 13.5523 13 13 13H3C2.44772 13 2 12.5523 2 12V4Z" stroke="currentColor" strokeWidth="1.2" fill="none" />
                                </svg>
                                Save to Docs
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {isSending && (
                  <div className="flex gap-3 justify-start">
                    <div className="w-7 h-7 rounded-lg bg-[#1a1a2e] flex items-center justify-center shrink-0 mt-0.5 animate-pulse">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M12 2C9.5 2 7.5 4 7.5 6.5c0 .5-.4 1-1 1C4.5 7.5 3 9.5 3 11.5c0 1.5.8 2.8 2 3.5 0 0-.5 1.5-.5 2.5C4.5 20 6.5 22 9 22c1.5 0 2.5-.5 3-1.5.5 1 1.5 1.5 3 1.5 2.5 0 4.5-2 4.5-4.5 0-1-.5-2.5-.5-2.5 1.2-.7 2-2 2-3.5 0-2-1.5-4-3.5-4-.6 0-1-.5-1-1C16.5 4 14.5 2 12 2z" />
                        <path d="M12 2v20" />
                        <path d="M7.5 7.5C9 8.5 10 10 10.5 12" />
                        <path d="M16.5 7.5C15 8.5 14 10 13.5 12" />
                        <path d="M5 15c2-.5 3.5-1 5-3" />
                        <path d="M19 15c-2-.5-3.5-1-5-3" />
                      </svg>
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
        </div>

        <div className="w-full max-w-[720px] mx-auto px-4 pb-4 shrink-0">
          {!hasMessages && !isSending && (
            <div className="flex flex-wrap justify-center gap-2 mb-3">
              {[
                "Analyze my credit profile",
                "What band am I in?",
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
      </div>

    </div>
  );
}
