import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/store";
import { ProfundrLogo } from "@/components/profundr-logo";

interface TeamMember {
  id: number;
  friendshipId: number;
  displayName: string;
  email: string;
  profilePhoto?: string | null;
}

interface TeamInvite {
  id: number;
  friendshipId: number;
  displayName: string;
  email: string;
  profilePhoto?: string | null;
}

interface TeamMessage {
  id: number;
  senderId: number;
  displayName: string;
  profilePhoto?: string | null;
  content: string;
  isAi: boolean;
  timestamp: string;
}

interface GuestMessage {
  id: number;
  role: "user" | "assistant" | "team";
  content: string;
  senderName?: string;
  senderPhoto?: string | null;
  senderId?: number;
}

interface PillarScore {
  label: string;
  value: number;
}

interface FinancialIdentityData {
  profileType: string | null;
  creditAge: string | null;
  exposureLevel: string | null;
  bureauFootprint: string | null;
  identityStrength: number | null;
  lenderPerception: string | null;
}

interface ProjectedFundingData {
  bureau: string | null;
  currentExposure: string | null;
  highestLimit: string | null;
  perBureauProjection: string | null;
  bestCasePerBureau: string | null;
  readinessLevel: string | null;
  inquirySlots: string | null;
  timeline: string | null;
  keyBlockers: string[];
}

interface TradeLine {
  creditor: string;
  type: string;
  ownership: string;
  accountStatus: string;
  limit: string;
  balance: string;
  age: string;
  paymentStatus: string;
}

interface MissionData {
  approvalIndex: number | null;
  band: string | null;
  phase: string | null;
  bureauSource: string | null;
  pillarScores: PillarScore[];
  suppressors: string[];
  helping: string[];
  hurting: string[];
  bestNextMove: string | null;
  financialIdentity: FinancialIdentityData | null;
  projectedFunding: ProjectedFundingData | null;
  openTradelines: TradeLine[];
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
    /AIS\s*(?:\(Approval\s*Index\s*Score\))?[:\s]*(\d+)\s*\/?\s*100/i,
    /Approval\s*Index\s*Score[:\s]*(\d+)\s*\/?\s*100/i,
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

  let bureauSource: string | null = null;
  const bureauSourcePatterns = [
    /Bureau\s*Source[:\s]*(Experian|Equifax|TransUnion|Unknown)/i,
    /Source\s*Bureau[:\s]*(Experian|Equifax|TransUnion)/i,
    /Report\s*(?:Source|Bureau)[:\s]*(Experian|Equifax|TransUnion)/i,
  ];
  for (const p of bureauSourcePatterns) {
    const m = cleanText.match(p);
    if (m && m[1].toLowerCase() !== "unknown") { bureauSource = m[1]; break; }
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

  let bestNextMove: string | null = null;
  const moveMatch = cleanText.match(/Best\s*Next\s*Move[:\s]*([\s\S]*?)(?=\n\s*(?:What|Top|Primary|DISPUTE|Pillar)\b|\n\n|$)/i);
  if (moveMatch) {
    const moveLine = moveMatch[1].split("\n").map(l => l.trim()).filter(l => l.length > 5).join(" ").trim();
    if (moveLine.length > 5) bestNextMove = moveLine;
  }

  let financialIdentity: FinancialIdentityData | null = null;
  const fiSection = cleanText.match(/Financial\s*Identity[:\s]*([\s\S]*?)(?=\n\s*(?:Approval\s*Index|Top\s*Approval|Best\s*Next|What['']?s\s*Helping|What['']?s\s*Hurting|DISPUTE)\b|\n\n\n|$)/i);
  if (fiSection) {
    const fiText = fiSection[1];
    const profileTypeMatch = fiText.match(/Profile\s*Type[:\s]*(.*?)(?:\n|$)/i);
    const creditAgeMatch = fiText.match(/Credit\s*Age[:\s]*(.*?)(?:\n|$)/i);
    const exposureMatch = fiText.match(/(?:Exposure\s*Level|Total\s*Exposure|Revolving\s*Exposure)[:\s]*(.*?)(?:\n|$)/i);
    const bureauMatch = fiText.match(/(?:Bureau\s*Footprint|Tradeline\s*Count|Bureau\s*Presence)[:\s]*(.*?)(?:\n|$)/i);
    const strengthMatch = fiText.match(/(?:Identity\s*Strength|Financial\s*Identity\s*Score)[:\s]*(\d+)/i);
    const perceptionMatch = fiText.match(/(?:Lender\s*Perception|How\s*Lenders\s*See\s*You)[:\s]*(.*?)(?:\n|$)/i);

    const pt = profileTypeMatch?.[1]?.trim() || null;
    const ca = creditAgeMatch?.[1]?.trim() || null;
    const el = exposureMatch?.[1]?.trim() || null;
    const bf = bureauMatch?.[1]?.trim() || null;
    const is_ = strengthMatch ? parseInt(strengthMatch[1]) : null;
    const lp = perceptionMatch?.[1]?.trim() || null;

    if (pt || ca || el || bf || is_ !== null || lp) {
      financialIdentity = { profileType: pt, creditAge: ca, exposureLevel: el, bureauFootprint: bf, identityStrength: is_, lenderPerception: lp };
    }
  }

  let projectedFunding: ProjectedFundingData | null = null;
  const pfSection = cleanText.match(/Projected\s*Funding[:\s]*(?:\(Per[\s-]*Bureau\))?[:\s]*([\s\S]*?)(?=\n\s*(?:Top\s*Approval|Best\s*Next|What['']?s\s*Helping|What['']?s\s*Hurting|DISPUTE|Verdict)\b|\n\n\n|$)/i);
  if (pfSection) {
    const pfText = pfSection[1];
    const bureauMatch = pfText.match(/(?:Bureau)[:\s]*(Experian|Equifax|TransUnion)/i);
    const currentExposureMatch = pfText.match(/(?:Current\s*Exposure|Current\s*Revolving)[:\s]*(.*?)(?:\n|$)/i);
    const highestLimitMatch = pfText.match(/(?:Highest\s*Limit|Highest\s*(?:Credit\s*)?Limit)[:\s]*(.*?)(?:\n|$)/i);
    const projectedMatch = pfText.match(/(?:Per[\s-]*Bureau\s*Projection|Projected\s*Amount|Projected\s*Funding\s*Amount)[:\s]*(.*?)(?:\n|$)/i);
    const bestCaseMatch = pfText.match(/(?:Best[\s-]*Case\s*Per[\s-]*Bureau|Best[\s-]*Case|Best[\s-]*Case\s*(?:Scenario|Amount|Funding))[:\s]*(.*?)(?:\n|$)/i);
    const readinessMatch = pfText.match(/(?:Readiness|Readiness\s*Level|Funding\s*Readiness)[:\s]*(.*?)(?:\n|$)/i);
    const inquirySlotsMatch = pfText.match(/(?:Inquiry\s*Slots?\s*(?:Available|Remaining)?)[:\s]*(.*?)(?:\n|$)/i);
    const timelineMatch = pfText.match(/(?:Timeline|Estimated\s*Timeline|Time\s*to\s*Ready)[:\s]*(.*?)(?:\n|$)/i);
    const blockersMatch = pfText.match(/(?:Key\s*Blockers?|Blockers?|What['']?s\s*Blocking)[:\s]*([\s\S]*?)(?=\n\s*(?:Readiness|Timeline|Best|Projected|Current|Inquiry)\b|\n\n|$)/i);

    const bur = bureauMatch?.[1]?.trim() || bureauSource;
    const ce = currentExposureMatch?.[1]?.trim() || null;
    const hl = highestLimitMatch?.[1]?.trim() || null;
    const pa = projectedMatch?.[1]?.trim() || null;
    const bc = bestCaseMatch?.[1]?.trim() || null;
    const rl = readinessMatch?.[1]?.trim() || null;
    const is_ = inquirySlotsMatch?.[1]?.trim() || null;
    const tl = timelineMatch?.[1]?.trim() || null;
    const keyBlockers: string[] = [];
    if (blockersMatch) {
      const lines = blockersMatch[1].split("\n").filter(l => l.trim().match(/^[-•\d]/));
      for (const line of lines.slice(0, 4)) {
        const cleaned = line.replace(/^\s*[-•]\s*/, "").replace(/^\s*\d+[.)]\s*/, "").trim();
        if (cleaned.length > 3) keyBlockers.push(cleaned);
      }
    }

    if (ce || hl || pa || bc || rl || tl || keyBlockers.length > 0) {
      projectedFunding = { bureau: bur, currentExposure: ce, highestLimit: hl, perBureauProjection: pa, bestCasePerBureau: bc, readinessLevel: rl, inquirySlots: is_, timeline: tl, keyBlockers };
    }
  }

  const openTradelines: TradeLine[] = [];
  const tradelineLines = cleanText.split("\n").filter(l => /^\s*(?:TRADELINE|Tradeline)[\s:|-]/i.test(l.trim()));
  for (const line of tradelineLines) {
    const cleaned = line.replace(/^\s*(?:TRADELINE|Tradeline)[\s:|-]+/i, "").trim();
    const parts = cleaned.split("|").map(p => p.trim()).filter(p => p.length > 0);
    if (parts.length >= 5) {
      let creditor: string, type: string, ownership: string, accountStatus: string, limit: string, balance: string, age: string, paymentStatus: string;
      if (parts.length >= 8) {
        [creditor, type, ownership, accountStatus, limit, balance, age, paymentStatus] = parts;
      } else if (parts.length === 7) {
        if (/open|closed/i.test(parts[3])) {
          [creditor, type, ownership, accountStatus, limit, balance, age] = parts;
          paymentStatus = "Current";
        } else {
          [creditor, type, ownership] = parts;
          accountStatus = "Open";
          [limit, balance, age, paymentStatus] = parts.slice(3);
        }
      } else {
        creditor = parts[0]; type = parts[1]; ownership = parts[2] || "Primary";
        accountStatus = "Open";
        limit = parts[3] || "N/A"; balance = parts[4] || "N/A";
        age = parts[5] || "N/A"; paymentStatus = parts[6] || "Current";
      }
      if (!/example|e\.g\.|chase sapphire.*\$12|capital one quicksilver.*\$8|toyota financial.*\$28|best buy.*\$2,000/i.test(creditor + limit)) {
        openTradelines.push({ creditor, type, ownership, accountStatus, limit, balance, age, paymentStatus });
      }
    }
  }

  return { approvalIndex, band, phase, bureauSource, pillarScores, suppressors, helping, hurting, bestNextMove, financialIdentity, projectedFunding, openTradelines };
}

function hasAnalysisData(data: MissionData): boolean {
  return data.approvalIndex !== null || data.band !== null || data.phase !== null || data.pillarScores.length > 0 || data.suppressors.length > 0 || data.helping.length > 0 || data.hurting.length > 0 || data.bestNextMove !== null || data.financialIdentity !== null || data.projectedFunding !== null || data.openTradelines.length > 0;
}

function getBandColor(band: string | null): string {
  if (!band) return "#999";
  const b = band.toLowerCase();
  if (b === "exceptional") return "#1a1a1a";
  if (b === "strong") return "#333333";
  if (b === "viable") return "#555555";
  if (b === "borderline") return "#777777";
  if (b === "weak") return "#999999";
  return "#999999";
}

function getPhaseColor(phase: string | null): string {
  if (!phase) return "#999";
  const p = phase.toLowerCase();
  if (p.includes("funding")) return "#1a1a1a";
  if (p.includes("build")) return "#444444";
  if (p.includes("wait")) return "#777777";
  return "#555555";
}

function getPillarColor(value: number): string {
  if (value >= 85) return "#1a1a1a";
  if (value >= 70) return "#444444";
  if (value >= 50) return "#777777";
  return "#aaaaaa";
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
    if (/Financial\s*Identity/i.test(t)) return true;
    if (/^(Profile\s*Type|Credit\s*Age|Exposure\s*Level|Total\s*Exposure|Revolving\s*Exposure|Bureau\s*Footprint|Tradeline\s*Count|Bureau\s*Presence|Identity\s*Strength|Financial\s*Identity\s*Score|Lender\s*Perception|How\s*Lenders\s*See\s*You)[:\s]/i.test(t)) return true;
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

function getApprovalSubtitle(index: number | null, band: string | null): string {
  if (index === null) return "";
  if (index >= 90) return "Optimized and approval-ready";
  if (index >= 80) return "Strong profile with minor gaps";
  if (index >= 70) return "Approval-ready, but not optimized";
  if (index >= 55) return "Workable profile with visible pressure";
  if (index >= 40) return "Significant blockers remain";
  return "Profile requires remediation first";
}

function getBandSubtitle(band: string | null): string {
  if (!band) return "";
  const b = band.toLowerCase();
  if (b === "exceptional") return "Premium approval readiness across products";
  if (b === "strong") return "Can support most approval categories";
  if (b === "viable") return "Can support selective approvals";
  if (b === "borderline") return "May qualify with conditions or compensating factors";
  if (b === "weak") return "Limited to secured or starter products";
  return "Requires credit remediation before applying";
}

function getPhaseSubtitle(phase: string | null): string {
  if (!phase) return "";
  const p = phase.toLowerCase();
  if (p.includes("funding")) return "Profile is ready — apply with precision";
  if (p.includes("build")) return "Structure is forming — keep building";
  if (p.includes("wait")) return "Not a no — just poor timing right now";
  return "Address negatives before anything else";
}

function getProfileTypeColor(type: string | null): string {
  if (!type) return "#999";
  const t = type.toLowerCase();
  if (t.includes("premium")) return "#1a1a1a";
  if (t.includes("seasoned")) return "#333333";
  if (t.includes("established")) return "#555555";
  if (t.includes("starter")) return "#777777";
  if (t.includes("thin")) return "#999999";
  return "#999";
}

function getProfileTypeSubtitle(type: string | null): string {
  if (!type) return "";
  const t = type.toLowerCase();
  if (t.includes("premium")) return "Deep history, strong limits, clean record";
  if (t.includes("seasoned")) return "Mature file with meaningful tradeline depth";
  if (t.includes("established")) return "Solid foundation — room to optimize";
  if (t.includes("starter")) return "Building blocks are in place — keep adding";
  if (t.includes("thin")) return "Lenders can barely see you — build visibility first";
  return "";
}

function getIdentityStrengthColor(value: number): string {
  if (value >= 85) return "#1a1a1a";
  if (value >= 70) return "#444444";
  if (value >= 50) return "#777777";
  return "#aaaaaa";
}

function FinancialIdentityCard({ data }: { data: FinancialIdentityData }) {
  const ptColor = getProfileTypeColor(data.profileType);
  return (
    <div className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm" data-testid="card-financial-identity">
      <div className="flex items-center gap-2 mb-3">
        <div className="w-5 h-5 rounded-md bg-[#f0f0f0] flex items-center justify-center">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
            <circle cx="12" cy="7" r="4" />
          </svg>
        </div>
        <p className="text-[10px] text-[#999] tracking-[0.01em] font-medium">Financial Identity</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.profileType && (
          <div data-testid="fi-profile-type">
            <p className="text-[9px] text-[#bbb] font-medium mb-0.5">Profile Type</p>
            <p className="text-[15px] font-bold tracking-[-0.02em]" style={{ color: ptColor }}>{data.profileType}</p>
            <p className="text-[9px] text-[#999] mt-0.5">{getProfileTypeSubtitle(data.profileType)}</p>
          </div>
        )}

        {data.identityStrength !== null && (
          <div data-testid="fi-identity-strength">
            <p className="text-[9px] text-[#bbb] font-medium mb-0.5">Identity Strength</p>
            <div className="flex items-baseline gap-1">
              <span className="text-[22px] font-bold leading-none" style={{ color: getIdentityStrengthColor(data.identityStrength) }}>{data.identityStrength}</span>
              <span className="text-[11px] text-[#ccc]">/100</span>
            </div>
            <div className="mt-1.5 w-full h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${data.identityStrength}%`, backgroundColor: getIdentityStrengthColor(data.identityStrength) }} />
            </div>
          </div>
        )}

        {data.creditAge && (
          <div data-testid="fi-credit-age">
            <p className="text-[9px] text-[#bbb] font-medium mb-0.5">Credit Age</p>
            <p className="text-[12px] text-[#333] font-medium leading-snug">{data.creditAge}</p>
          </div>
        )}

        {data.exposureLevel && (
          <div data-testid="fi-exposure-level">
            <p className="text-[9px] text-[#bbb] font-medium mb-0.5">Exposure Level</p>
            <p className="text-[12px] text-[#333] font-medium leading-snug">{data.exposureLevel}</p>
          </div>
        )}

        {data.bureauFootprint && (
          <div data-testid="fi-bureau-footprint">
            <p className="text-[9px] text-[#bbb] font-medium mb-0.5">Bureau Footprint</p>
            <p className="text-[12px] text-[#333] font-medium leading-snug">{data.bureauFootprint}</p>
          </div>
        )}
      </div>

      {data.lenderPerception && (
        <div className="mt-3 pt-3 border-t border-[#f0f0f0]" data-testid="fi-lender-perception">
          <p className="text-[9px] text-[#bbb] font-medium mb-1">Lender Perception</p>
          <p className="text-[12px] text-[#444] leading-[1.6] italic">{data.lenderPerception}</p>
        </div>
      )}
    </div>
  );
}

function getReadinessColor(level: string | null): string {
  if (!level) return "#999";
  const l = level.toLowerCase();
  if (l.includes("ready") || l.includes("strong") || l.includes("high")) return "#1a1a1a";
  if (l.includes("near") || l.includes("moderate") || l.includes("close")) return "#555555";
  if (l.includes("not") || l.includes("low") || l.includes("weak") || l.includes("early")) return "#999999";
  return "#666666";
}

function ProjectedFundingCard({ data, phase, compact }: { data: ProjectedFundingData; phase: string | null; compact?: boolean }) {
  const readinessColor = getReadinessColor(data.readinessLevel);
  const isFundingReady = phase?.toLowerCase().includes("funding");
  const [expanded, setExpanded] = useState(false);
  const bureauLabel = data.bureau || "Per-Bureau";

  return (
    <div className={compact ? "col-span-2" : ""}>
      <div
        className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm cursor-pointer hover:border-[#d0d0d0] transition-colors"
        data-testid="card-projected-funding"
        onClick={() => setExpanded(!expanded)}
      >
        <div className="flex items-center justify-between mb-2">
          <p className="text-[10px] text-[#999] tracking-[0.01em] font-medium">Projected Funding</p>
          {data.bureau && (
            <span className="text-[8px] font-bold uppercase tracking-widest px-1.5 py-0.5 rounded-full bg-[#f0f0f0] text-[#666]" data-testid="text-funding-bureau">{data.bureau}</span>
          )}
        </div>
        <p className="text-[18px] font-bold tracking-[-0.02em] text-[#1a1a1a] leading-tight" data-testid="text-best-case-amount">
          {data.bestCasePerBureau || data.perBureauProjection || "—"}
        </p>
        <div className="flex items-center gap-1.5 mt-1">
          {data.readinessLevel && (
            <>
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: readinessColor }} />
              <p className="text-[10px] text-[#777]">{data.readinessLevel}{data.timeline ? ` · ${data.timeline}` : ""}</p>
            </>
          )}
          {isFundingReady && !data.readinessLevel && (
            <>
              <div className="w-1.5 h-1.5 rounded-full bg-[#1a1a1a]" />
              <p className="text-[10px] text-[#1a1a1a] font-medium">Funding Ready</p>
            </>
          )}
        </div>
      </div>

      {expanded && (
        <div className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm mt-2" data-testid="card-projected-funding-expanded">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className="w-5 h-5 rounded-md bg-[#f0f0f0] flex items-center justify-center">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#333333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="12" y1="1" x2="12" y2="23" />
                  <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                </svg>
              </div>
              <p className="text-[10px] text-[#999] tracking-[0.01em] font-medium">{bureauLabel} Funding Breakdown</p>
            </div>
            <button onClick={(e) => { e.stopPropagation(); setExpanded(false); }} className="text-[#ccc] hover:text-[#666] transition-colors" data-testid="button-close-funding-detail">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3">
            {data.bestCasePerBureau && (
              <div className="min-w-0" data-testid="pf-best-case">
                <p className="text-[9px] text-[#bbb] font-medium mb-0.5">Best-Case {bureauLabel}</p>
                <p className="text-[18px] font-bold tracking-[-0.02em] text-[#1a1a1a] leading-tight truncate">{data.bestCasePerBureau}</p>
                <p className="text-[9px] text-[#aaa] mt-1">5 approvals at full limit match</p>
              </div>
            )}

            {data.perBureauProjection && (
              <div className="min-w-0" data-testid="pf-projected-amount">
                <p className="text-[9px] text-[#bbb] font-medium mb-0.5">{bureauLabel} Projection</p>
                <p className="text-[14px] font-bold tracking-[-0.02em] text-[#333] truncate">{data.perBureauProjection}</p>
                <p className="text-[9px] text-[#aaa] mt-1">3-5 approvals at 60-80% match rate</p>
              </div>
            )}

            {data.highestLimit && (
              <div className="min-w-0" data-testid="pf-highest-limit">
                <p className="text-[9px] text-[#bbb] font-medium mb-0.5">Highest Limit</p>
                <p className="text-[13px] text-[#333] font-bold truncate">{data.highestLimit}</p>
                {data.currentExposure && <p className="text-[9px] text-[#aaa] mt-0.5">{data.currentExposure} total</p>}
              </div>
            )}

            <div className="min-w-0">
              {data.readinessLevel && (
                <div data-testid="pf-readiness">
                  <p className="text-[9px] text-[#bbb] font-medium mb-0.5">Readiness Level</p>
                  <div className="flex items-center gap-1.5">
                    <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: readinessColor }} />
                    <p className="text-[12px] font-bold" style={{ color: readinessColor }}>{data.readinessLevel}</p>
                  </div>
                </div>
              )}
              {data.inquirySlots && (
                <div className="mt-1.5" data-testid="pf-inquiry-slots">
                  <p className="text-[9px] text-[#bbb] font-medium mb-0.5">Inquiry Slots</p>
                  <p className="text-[11px] text-[#333] font-medium leading-snug">{data.inquirySlots}</p>
                </div>
              )}
              {data.timeline && <p className="text-[9px] text-[#aaa] mt-1 leading-snug">{data.timeline}</p>}
            </div>
          </div>

          {data.keyBlockers.length > 0 && (
            <div className="mt-3 pt-3 border-t border-[#f0f0f0]" data-testid="pf-blockers">
              <p className="text-[9px] text-[#bbb] font-medium mb-1.5">Key Blockers on {bureauLabel}</p>
              <div className="space-y-1.5">
                {data.keyBlockers.map((b, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-4 h-4 rounded-sm bg-[#f0f0f0] flex items-center justify-center shrink-0 mt-0.5">
                      <span className="text-[8px] font-bold text-[#555555]">{i + 1}</span>
                    </div>
                    <p className="text-[11px] text-[#555] leading-[1.5]">{b}</p>
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

function MissionDashboard({ data, userName, compact }: { data: MissionData; userName?: string; compact?: boolean }) {
  const bandColor = getBandColor(data.band);
  const phaseColor = getPhaseColor(data.phase);
  const [downloadingReport, setDownloadingReport] = useState(false);

  const handleDownloadReport = async () => {
    setDownloadingReport(true);
    try {
      const res = await fetch("/api/analysis-report", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...data, userName }),
      });
      if (!res.ok) throw new Error("Server error");
      const result = await res.json();
      if (!result.downloadUrl) throw new Error("No download URL");
      const a = document.createElement("a");
      a.href = result.downloadUrl;
      a.download = "profundr-analysis-report.pdf";
      a.click();
    } catch (e) {
      console.error("Failed to download analysis report:", e);
      alert("Failed to generate report. Please try again.");
    } finally {
      setDownloadingReport(false);
    }
  };

  return (
    <div className={`w-full ${compact ? 'mt-0' : 'mt-4'} space-y-2.5`} data-testid="mission-dashboard-inline">
      <div className="flex items-center justify-end mb-1">
        <button
          onClick={handleDownloadReport}
          disabled={downloadingReport}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#333333] text-white text-[11px] font-medium hover:bg-[#444444] transition-colors disabled:opacity-50"
          data-testid="button-download-analysis-report"
        >
          {downloadingReport ? (
            <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" strokeDasharray="31.4" strokeLinecap="round" /></svg>
          ) : (
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4v12m0 0l-4-4m4 4l4-4M4 18h16" /></svg>
          )}
          {downloadingReport ? "Generating..." : "Download Report"}
        </button>
      </div>
      <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'} gap-2`}>
        {data.approvalIndex !== null && (
          <div className={`rounded-xl bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] p-5 shadow-lg ${compact ? 'col-span-2' : 'col-span-1 sm:col-span-3'}`} data-testid="card-approval-index">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-[0.15em] text-white/50 uppercase">AIS</span>
                <span className="text-[9px] text-white/30 tracking-wide">Approval Index Score</span>
              </div>
              {data.bureauSource && (
                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-white/10 text-white/60" data-testid="text-ais-bureau">{data.bureauSource}</span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[56px] font-bold leading-none tracking-tighter text-white" data-testid="text-approval-score">
                {data.approvalIndex}
              </span>
              <span className="text-[18px] text-white/30 font-light">/100</span>
            </div>
            <p className="text-[11px] text-white/50 mt-2 leading-snug">{getApprovalSubtitle(data.approvalIndex, data.band)}</p>
            <div className="mt-3 w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${data.approvalIndex}%`, backgroundColor: bandColor }} />
            </div>
          </div>
        )}

        {data.band && (
          <div className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm" data-testid="card-band">
            <p className="text-[10px] text-[#999] tracking-[0.01em] font-medium mb-2">Approval Strength</p>
            <p className="text-[20px] font-bold tracking-[-0.02em]" style={{ color: bandColor }} data-testid="text-band">
              {data.band}
            </p>
            <div className="flex items-center gap-1.5 mt-1">
              <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: bandColor }} />
              <p className="text-[10px] text-[#777]">{getBandSubtitle(data.band)}</p>
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
              <p className="text-[10px] text-[#777]">{getPhaseSubtitle(data.phase)}</p>
            </div>
          </div>
        )}

        {data.projectedFunding && (
          <ProjectedFundingCard data={data.projectedFunding} phase={data.phase} compact={compact} />
        )}
      </div>

      {data.pillarScores.length > 0 && (
        <div className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm" data-testid="card-pillar-scores">
          <p className="text-[10px] text-[#999] tracking-[0.01em] font-medium mb-0.5">Pillar Scores</p>
          <p className="text-[9px] text-[#bbb] mb-3">How your profile performs across core underwriting signals</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
            {data.pillarScores.map((pillar) => {
              const color = getPillarColor(pillar.value);
              return (
                <div key={pillar.label} data-testid={`pillar-${pillar.label.toLowerCase().replace(/\s+/g, "-")}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[#666] font-medium">{pillar.label}</span>
                    <span className="text-[11px] font-bold" style={{ color }}>{pillar.value}</span>
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

      {data.financialIdentity && (
        <FinancialIdentityCard data={data.financialIdentity} />
      )}

      {data.suppressors.length > 0 && (
        <div className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm" data-testid="card-suppressors">
          <p className="text-[10px] text-[#999] tracking-[0.01em] font-medium mb-2.5">Top Approval Suppressors</p>
          <div className="space-y-2">
            {data.suppressors.map((s, i) => (
              <div key={i} className="flex items-start gap-2.5">
                <div className="w-5 h-5 rounded-md bg-[#f0f0f0] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px] font-bold text-[#555555]">{i + 1}</span>
                </div>
                <p className="text-[12px] text-[#444] leading-[1.55] font-medium">{s}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.bestNextMove && (
        <div className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm" data-testid="card-best-next-move">
          <p className="text-[10px] text-[#999] tracking-[0.01em] font-medium mb-2">Best Next Move</p>
          <p className="text-[12px] text-[#333] leading-[1.6] font-medium">{data.bestNextMove}</p>
        </div>
      )}

      {data.helping.length > 0 && (
        <div className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm" data-testid="card-helping">
          <p className="text-[10px] text-[#999] tracking-[0.01em] font-medium mb-2">What's Helping</p>
          <div className="space-y-1.5">
            {data.helping.map((h, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-md bg-[#f0f0f0] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px] text-[#333333] font-bold">✓</span>
                </div>
                <p className="text-[11px] text-[#555] leading-[1.5]">{h}</p>
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
                <div className="w-4 h-4 rounded-md bg-[#f0f0f0] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px] text-[#777777] font-bold">−</span>
                </div>
                <p className="text-[11px] text-[#555] leading-[1.5]">{h}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function DisputeDownloadButton({ disputes, onSave }: { disputes: DisputeItem[]; onSave?: (disputes: DisputeItem[]) => void }) {
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
        onSave?.(disputes);
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
      className="mt-3 flex items-center gap-2 px-4 py-2 bg-[#333333] text-white rounded-lg text-[12px] font-medium hover:bg-[#444444] transition-colors disabled:opacity-50"
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
  try {
    localStorage.setItem("profundr_docs", JSON.stringify(docs));
  } catch {
    try {
      const trimmed = docs.slice(-20);
      localStorage.setItem("profundr_docs", JSON.stringify(trimmed));
    } catch {
      localStorage.removeItem("profundr_docs");
    }
  }
}

function ProfileAvatar({ photo, name, size = 28, className = "" }: { photo?: string | null; name?: string; size?: number; className?: string }) {
  if (photo) {
    return <img src={photo} alt={name || ""} className={`rounded-full object-cover shrink-0 ${className}`} style={{ width: size, height: size }} />;
  }
  const initial = name?.[0]?.toUpperCase() || "?";
  return (
    <div className={`rounded-full bg-[#1a1a2e] text-white flex items-center justify-center font-bold shrink-0 ${className}`} style={{ width: size, height: size, fontSize: size * 0.38 }}>
      {initial}
    </div>
  );
}

function FileAttachmentCard({ filename }: { filename: string }) {
  const ext = filename.split('.').pop()?.toUpperCase() || 'FILE';
  const isPdf = ext === 'PDF';
  return (
    <div className="inline-flex items-center gap-3 border border-[#d0d0d0] rounded-2xl px-4 py-3 bg-[#f9f9f9] max-w-[300px] mb-1.5">
      <div className={`w-10 h-10 rounded-xl ${isPdf ? 'bg-[#ef4444]' : 'bg-[#6366f1]'} flex items-center justify-center shrink-0`}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          <polyline points="14,2 14,8 20,8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-medium text-[#1a1a1a] truncate">{filename}</p>
        <p className="text-[11px] text-[#888] uppercase">{ext}</p>
      </div>
    </div>
  );
}

function ProfundrAvatar({ size = 28, className = "" }: { size?: number; className?: string }) {
  return (
    <div className={`rounded-lg bg-[#1a1a2e] flex items-center justify-center shrink-0 ${className}`} style={{ width: size, height: size }}>
      <svg width={size * 0.57} height={size * 0.57} viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2C9.5 2 7.5 4 7.5 6.5c0 .5-.4 1-1 1C4.5 7.5 3 9.5 3 11.5c0 1.5.8 2.8 2 3.5 0 0-.5 1.5-.5 2.5C4.5 20 6.5 22 9 22c1.5 0 2.5-.5 3-1.5.5 1 1.5 1.5 3 1.5 2.5 0 4.5-2 4.5-4.5 0-1-.5-2.5-.5-2.5 1.2-.7 2-2 2-3.5 0-2-1.5-4-3.5-4-.6 0-1-.5-1-1C16.5 4 14.5 2 12 2z" />
        <path d="M12 2v20" />
        <path d="M7.5 7.5C9 8.5 10 10 10.5 12" />
        <path d="M16.5 7.5C15 8.5 14 10 13.5 12" />
        <path d="M5 15c2-.5 3.5-1 5-3" />
        <path d="M19 15c-2-.5-3.5-1-5-3" />
      </svg>
    </div>
  );
}

function TeamSection({ user, onOpenTeamChat, activeTeamChatId }: { user: any; onOpenTeamChat?: (member: TeamMember) => void; activeTeamChatId?: number | null }) {
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ id: number; displayName: string; email: string }[]>([]);
  const [searching, setSearching] = useState(false);
  const [team, setTeam] = useState<{ members: TeamMember[]; pending: TeamInvite[]; sent: TeamInvite[] }>({ members: [], pending: [], sent: [] });
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

  useEffect(() => {
    if (!user) return;
    const interval = setInterval(fetchTeam, 5000);
    return () => clearInterval(interval);
  }, [user, fetchTeam]);

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
      if (res.ok) { fetchTeam(); setSearchResults(prev => prev.filter(r => r.id !== receiverId)); setSearchQuery(""); }
    } catch {}
    setInviting(null);
  };

  const existingIds = useMemo(() => {
    const ids = new Set<number>();
    team.members.forEach(m => ids.add(m.id));
    team.pending.forEach(p => ids.add(p.id));
    (team.sent || []).forEach(s => ids.add(s.id));
    return ids;
  }, [team]);

  const filteredSearchResults = useMemo(() => searchResults.filter(r => !existingIds.has(r.id)), [searchResults, existingIds]);

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
        {team.pending.length > 0 && (
          <span className="ml-1 w-4 h-4 rounded-full bg-[#e85d3a] text-white text-[8px] font-bold flex items-center justify-center animate-pulse" data-testid="badge-pending-invites">{team.pending.length}</span>
        )}
        <span className="text-[10px] text-[#aaa] ml-auto">{team.members.length}</span>
      </div>

      {team.pending.length > 0 && (
        <div className="pl-5 mb-2 space-y-1">
          <p className="text-[9px] text-[#999] uppercase tracking-wider font-medium mb-1">Incoming Requests</p>
          {team.pending.map(inv => (
            <div key={inv.friendshipId} className="flex items-center gap-1.5 py-1.5 rounded-lg bg-[#fff8f0] border border-[#f0e0c8] px-2" data-testid={`team-invite-${inv.id}`}>
              <ProfileAvatar photo={inv.profilePhoto} name={inv.displayName} size={20} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[#444] truncate font-medium">{inv.displayName}</p>
                <p className="text-[8px] text-[#999]">wants to be your teammate</p>
              </div>
              <button onClick={() => handleAccept(inv.friendshipId)} className="text-[9px] bg-[#333] text-white px-2 py-0.5 rounded font-medium hover:bg-[#444] transition-colors" data-testid={`button-accept-invite-${inv.id}`}>Accept</button>
              <button onClick={() => handleReject(inv.friendshipId)} className="text-[9px] text-[#999] font-medium hover:text-[#666] transition-colors" data-testid={`button-reject-invite-${inv.id}`}>Decline</button>
            </div>
          ))}
        </div>
      )}

      {team.sent && team.sent.length > 0 && (
        <div className="pl-5 mb-2 space-y-1">
          <p className="text-[9px] text-[#999] uppercase tracking-wider font-medium mb-1">Sent Requests</p>
          {team.sent.map(inv => (
            <div key={inv.friendshipId} className="flex items-center gap-1.5 py-1.5 rounded-lg bg-[#f5f5f5] px-2" data-testid={`team-sent-${inv.id}`}>
              <ProfileAvatar photo={inv.profilePhoto} name={inv.displayName} size={20} />
              <div className="flex-1 min-w-0">
                <p className="text-[10px] text-[#444] truncate">{inv.displayName}</p>
                <p className="text-[8px] text-[#b0a070] font-medium">Pending acceptance</p>
              </div>
              <button onClick={() => handleRemove(inv.friendshipId)} className="text-[9px] text-[#ccc] hover:text-[#999] font-medium transition-colors" data-testid={`button-cancel-invite-${inv.id}`}>Cancel</button>
            </div>
          ))}
        </div>
      )}

      {team.members.length === 0 ? (
        <p className="text-[11px] text-[#bbb] pl-5 italic mb-2">No team members yet</p>
      ) : (
        <div className="space-y-1 mb-2">
          {team.members.map(m => (
            <div
              key={m.friendshipId}
              className={`flex items-center gap-1.5 pl-5 py-1.5 rounded-lg hover:bg-[#f5f5f5] group transition-colors cursor-pointer ${activeTeamChatId === m.id ? 'bg-[#f0eeff]' : ''}`}
              onClick={() => onOpenTeamChat?.(m)}
              data-testid={`team-member-${m.id}`}
            >
              <ProfileAvatar photo={m.profilePhoto} name={m.displayName} size={20} className={activeTeamChatId === m.id ? '!bg-[#6366f1]' : ''} />
              <div className="flex-1 min-w-0">
                <p className="text-[11px] text-[#444] truncate">{m.displayName}</p>
              </div>
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="opacity-0 group-hover:opacity-100 text-[#6366f1] transition-all mr-1">
                <path d="M1 3.5C1 2.67 1.67 2 2.5 2h5C8.33 2 9 2.67 9 3.5v3C9 7.33 8.33 8 7.5 8h-3L2.5 9.5V8H2.5C1.67 8 1 7.33 1 6.5v-3z" stroke="currentColor" strokeWidth="1" fill="none" />
              </svg>
              <button onClick={(e) => { e.stopPropagation(); handleRemove(m.friendshipId); }} className="opacity-0 group-hover:opacity-100 text-[#ccc] hover:text-red-400 transition-all p-0.5" data-testid={`button-remove-member-${m.id}`}>
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
          {filteredSearchResults.map(r => (
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
                {inviting === r.id ? "..." : "Add"}
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

function PerfectProfileTab({ aisReport }: { aisReport: MissionData | null }) {
  const [expandedSection, setExpandedSection] = useState<string | null>("revolving");
  if (!aisReport || !hasAnalysisData(aisReport)) {
    return (
      <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
        <div className="w-[28px] h-[28px] rounded-md bg-[#f5f5f5] border border-[#e8e8e8] flex items-center justify-center">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#bbb" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12h14" />
          </svg>
        </div>
        <p className="text-[9px] text-[#999] mt-2.5 leading-[1.6]">Upload a credit report to generate your profile match.</p>
      </div>
    );
  }

  const tradelines = aisReport.openTradelines || [];

  const parseAge = (age: string): number => {
    const yrMatch = age.match(/(\d+)\s*yr/i);
    return yrMatch ? parseInt(yrMatch[1]) : 0;
  };

  const isCurrent = (status: string) => /current|pays?\s*as\s*agreed/i.test(status) && !/late|delinq|collection|charge/i.test(status);

  type AccountCard = {
    creditor: string;
    type: string;
    ownership: string;
    category: "revolving" | "installment" | "other";
    markers: { label: string; ideal: string; actual: string; met: boolean }[];
  };

  const buildAccountCard = (tl: TradeLine): AccountCard => {
    const isRevolving = /revolv|credit\s*card|loc\b|heloc/i.test(tl.type);
    const isInstallment = /install|auto|student|mortgage|personal\s*loan/i.test(tl.type);
    const isClosed_ = /closed/i.test(tl.accountStatus);
    const ageYears = parseAge(tl.age);
    const limitNum = parseInt(tl.limit.replace(/[^0-9]/g, ""));
    const balNum = parseInt(tl.balance.replace(/[^0-9]/g, ""));
    const utilizationForCard = !isNaN(limitNum) && limitNum > 0 && !isNaN(balNum) ? Math.round((balNum / limitNum) * 100) : null;
    const isPrimary = /primary/i.test(tl.ownership);
    const isAU = /\bau\b|authorized/i.test(tl.ownership);

    const markers: AccountCard["markers"] = isRevolving ? [
      { label: "Limit", ideal: "$10,000+", actual: tl.limit, met: !isNaN(limitNum) && limitNum >= 10000 },
      { label: "Balance", ideal: "< 5% of limit", actual: utilizationForCard !== null ? `${utilizationForCard}%` : tl.balance, met: utilizationForCard !== null ? utilizationForCard <= 5 : false },
      { label: "Age", ideal: "5+ years", actual: tl.age, met: ageYears >= 5 },
      { label: "Status", ideal: "Current", actual: isClosed_ ? "Closed" : tl.paymentStatus, met: isClosed_ ? !/late|delinq|collection|charge/i.test(tl.paymentStatus) : isCurrent(tl.paymentStatus) },
      { label: "Ownership", ideal: "Primary", actual: isAU ? "Authorized User" : isPrimary ? "Primary" : tl.ownership, met: isPrimary },
    ] : [
      { label: "Amount", ideal: "$5,000+", actual: tl.limit, met: !isNaN(limitNum) && limitNum >= 5000 },
      { label: "Balance", ideal: "$0", actual: tl.balance, met: !isNaN(balNum) && balNum === 0 },
      { label: "Age", ideal: "2+ years", actual: tl.age, met: ageYears >= 2 },
      { label: "Status", ideal: "Current", actual: isClosed_ ? "Closed" : tl.paymentStatus, met: isClosed_ ? !/late|delinq|collection|charge/i.test(tl.paymentStatus) : isCurrent(tl.paymentStatus) },
      { label: "Ownership", ideal: "Primary", actual: isAU ? "Authorized User" : isPrimary ? "Primary" : tl.ownership, met: isPrimary },
    ];

    return {
      creditor: tl.creditor,
      type: tl.type,
      ownership: tl.ownership,
      category: isRevolving ? "revolving" : isInstallment ? "installment" : "other",
      markers,
    };
  };

  const allCards = tradelines.map(buildAccountCard);
  const isAUOwnership = (o: string) => /\bau\b|authorized/i.test(o);
  const isPrimaryOwnership = (o: string) => /primary/i.test(o);
  const primaryRevCards = allCards.filter(c => c.category === "revolving" && isPrimaryOwnership(c.ownership));
  const auCards = allCards.filter(c => isAUOwnership(c.ownership));
  const primaryInstCards = allCards.filter(c => c.category === "installment" && isPrimaryOwnership(c.ownership));
  const nonPrimaryInstCards = allCards.filter(c => c.category === "installment" && !isPrimaryOwnership(c.ownership) && !isAUOwnership(c.ownership));
  const otherCards = allCards.filter(c => c.category === "other" && !isAUOwnership(c.ownership));

  const idealRevSlots = 5;
  const idealInstSlots = 2;
  const filledPrimaryRevSlots = primaryRevCards.length;
  const filledPrimaryInstSlots = primaryInstCards.length;
  const totalSlots = idealRevSlots + idealInstSlots;
  const filledSlots = Math.min(filledPrimaryRevSlots, idealRevSlots) + Math.min(filledPrimaryInstSlots, idealInstSlots);

  const countableCards = [...primaryRevCards.slice(0, idealRevSlots), ...primaryInstCards.slice(0, idealInstSlots)];
  const totalCriteria = totalSlots * 5;
  const metCriteria = countableCards.reduce((s, c) => s + c.markers.filter(m => m.met).length, 0);
  const pct = totalCriteria > 0 ? Math.round((metCriteria / totalCriteria) * 100) : 0;

  const accentColor = pct >= 80 ? "#2d6a4f" : pct >= 50 ? "#c9a227" : "#c0392b";

  const emptyRevSlotRows = [
    { label: "Limit", ideal: "$10,000+" },
    { label: "Balance", ideal: "< 5% of limit" },
    { label: "Age", ideal: "5+ years" },
    { label: "Status", ideal: "Current" },
    { label: "Ownership", ideal: "Primary" },
  ];
  const emptyInstSlotRows = [
    { label: "Amount", ideal: "$5,000+" },
    { label: "Balance", ideal: "$0" },
    { label: "Age", ideal: "2+ years" },
    { label: "Status", ideal: "Current" },
    { label: "Ownership", ideal: "Primary" },
  ];

  const renderCard = (card: AccountCard, ci: number) => {
    const cardMet = card.markers.filter(m => m.met).length;
    const cardTotal = card.markers.length;
    const isAU = /\bau\b|authorized/i.test(card.ownership);
    const headerLabel = `${card.creditor}${isAU ? " (AU)" : ""}`;
    return (
      <div key={ci} className="rounded-lg overflow-hidden border border-[#e5e5e5]" data-testid={`account-card-${ci}`}>
        <div className="flex items-center justify-between px-2.5 py-[5px] bg-[#1a1a2e]">
          <div className="flex items-center gap-1 min-w-0">
            <div className={`w-[12px] h-[12px] rounded-full flex items-center justify-center flex-shrink-0 ${cardMet === cardTotal ? "bg-[#2d6a4f]" : "border border-white/20"}`}>
              {cardMet === cardTotal && <svg width="7" height="7" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
            </div>
            <p className="text-[9px] font-bold text-white truncate">{headerLabel}</p>
          </div>
          <span className="text-[8px] text-white/40 flex-shrink-0 ml-1" style={{ fontVariantNumeric: "tabular-nums" }}>{cardMet}/{cardTotal}</span>
        </div>
        <div className="bg-white divide-y divide-[#f0f0f0]">
          {card.markers.map((m, mi) => (
            <div key={mi} className="grid grid-cols-[10px_52px_1fr] items-center gap-x-2 px-2.5 py-[5px]">
              <div className={`w-[10px] h-[10px] rounded-[2px] flex items-center justify-center flex-shrink-0 ${m.met ? "bg-[#2d6a4f]" : "border border-[#ddd] bg-white"}`}>
                {m.met && <svg width="6" height="6" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
              </div>
              <span className="text-[8px] text-[#555] font-medium">{m.label}</span>
              <div className="flex items-center justify-end gap-1.5">
                <span className="text-[8px] text-[#aaa]">{m.ideal}</span>
                <span className="w-[1px] h-[10px] bg-[#e5e5e5]" />
                <span className={`text-[8px] font-bold min-w-[40px] text-right ${m.met ? "text-[#2d6a4f]" : "text-[#c0392b]"}`} style={{ fontVariantNumeric: "tabular-nums" }}>{m.actual}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  };

  const renderEmptySlot = (label: string, idx: number, rows: { label: string; ideal: string }[]) => (
    <div key={`empty-${idx}`} className="rounded-lg overflow-hidden border border-dashed border-[#d5d5d5]">
      <div className="flex items-center justify-between px-2.5 py-[5px] bg-[#f7f7f7]">
        <div className="flex items-center gap-1 min-w-0">
          <div className="w-[12px] h-[12px] rounded-full border border-[#ccc] flex items-center justify-center flex-shrink-0">
            <svg width="7" height="7" viewBox="0 0 10 10" fill="none"><path d="M5 2v6M2 5h6" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" /></svg>
          </div>
          <p className="text-[9px] font-bold text-[#aaa]">{label}</p>
        </div>
        <span className="text-[8px] text-[#ccc]" style={{ fontVariantNumeric: "tabular-nums" }}>0/{rows.length}</span>
      </div>
      <div className="bg-[#fcfcfc] divide-y divide-[#f2f2f2]">
        {rows.map((r, ri) => (
          <div key={ri} className="grid grid-cols-[10px_52px_1fr] items-center gap-x-2 px-2.5 py-[5px]">
            <div className="w-[10px] h-[10px] rounded-[2px] border border-[#e8e8e8] bg-white flex-shrink-0" />
            <span className="text-[8px] text-[#ccc] font-medium">{r.label}</span>
            <div className="flex items-center justify-end gap-1.5">
              <span className="text-[8px] text-[#d5d5d5]">{r.ideal}</span>
              <span className="w-[1px] h-[10px] bg-[#eee]" />
              <span className="text-[8px] text-[#ccc] italic font-light min-w-[40px] text-right">Empty</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );

  const emptyRevCount = Math.max(0, idealRevSlots - filledPrimaryRevSlots);
  const emptyInstCount = Math.max(0, idealInstSlots - filledPrimaryInstSlots);

  return (
    <div className="space-y-3" data-testid="perfect-profile-tab">
      <div className="rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#252540] p-3">
        <div className="flex items-center gap-2.5">
          <div className="relative w-[40px] h-[40px] flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="2.5" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke={accentColor} strokeWidth="2.5" strokeDasharray={`${pct * 0.974} 100`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[12px] font-bold text-white leading-none" style={{ fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
            </div>
          </div>
          <div className="min-w-0">
            <p className="text-[7px] uppercase tracking-[0.12em] text-white/35 font-semibold mb-0.5">Profile Match</p>
            <p className="text-[12px] font-bold text-white leading-tight"><span style={{ fontVariantNumeric: "tabular-nums" }}>{filledSlots}</span> <span className="text-[10px] font-normal text-white/40">/ {totalSlots} slots</span></p>
            <p className="text-[9px] text-white/30 mt-0.5" style={{ fontVariantNumeric: "tabular-nums" }}>{metCriteria} of {totalCriteria} criteria met</p>
          </div>
        </div>
      </div>

      <div>
        <p className="text-[8px] uppercase tracking-[0.15em] text-[#999] font-semibold mb-1.5 px-0.5">Revolving Accounts</p>
        <div className="space-y-1.5">
          {primaryRevCards.map((card, i) => renderCard(card, i))}
          {emptyRevCount > 0 && Array.from({ length: emptyRevCount }).map((_, i) => renderEmptySlot("Revolving Card", filledPrimaryRevSlots + i, emptyRevSlotRows))}
        </div>
      </div>

      {auCards.length > 0 && (
        <div>
          <p className="text-[8px] uppercase tracking-[0.15em] text-[#999] font-semibold mb-1.5 px-0.5">Authorized User Accounts <span className="normal-case tracking-normal font-normal text-[7px] text-[#bbb]">(not counted toward slots)</span></p>
          <div className="space-y-1.5">
            {auCards.map((card, i) => renderCard(card, primaryRevCards.length + i))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[8px] uppercase tracking-[0.15em] text-[#999] font-semibold mb-1.5 px-0.5">Installment Accounts</p>
        <div className="space-y-1.5">
          {primaryInstCards.map((card, i) => renderCard(card, primaryRevCards.length + auCards.length + i))}
          {emptyInstCount > 0 && Array.from({ length: emptyInstCount }).map((_, i) => renderEmptySlot("Installment Loan", filledPrimaryInstSlots + i, emptyInstSlotRows))}
        </div>
      </div>

      {(otherCards.length > 0 || nonPrimaryInstCards.length > 0) && (
        <div>
          <p className="text-[8px] uppercase tracking-[0.15em] text-[#999] font-semibold mb-1.5 px-0.5">Other Accounts</p>
          <div className="space-y-1.5">
            {[...nonPrimaryInstCards, ...otherCards].map((card, i) => renderCard(card, primaryRevCards.length + auCards.length + primaryInstCards.length + i))}
          </div>
        </div>
      )}
    </div>
  );
}

function DocsPanel({ docs, onClose, onDelete, onSave, user, onOpenTeamChat, activeTeamChatId, aisReport, onOpenAis }: { docs: SavedDoc[]; onClose: () => void; onDelete: (id: string) => void; onSave: (doc: SavedDoc) => void; user: any; onOpenTeamChat?: (member: TeamMember) => void; activeTeamChatId?: number | null; aisReport: MissionData | null; onOpenAis: () => void }) {
  const docInputRef = useRef<HTMLInputElement>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [expandedBureau, setExpandedBureau] = useState<string | null>(null);
  const [panelTab, setPanelTab] = useState<"command" | "perfect">("command");

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
                    className={`${doc.disputes?.length ? 'opacity-100 text-[#6366f1]' : 'opacity-0 group-hover:opacity-100 text-[#aaa]'} hover:text-[#1a1a2e] transition-all p-0.5 disabled:opacity-50`}
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

  const aisScore = aisReport?.approvalIndex;
  const hasAis = aisReport && hasAnalysisData(aisReport);
  const suppressorCount = aisReport?.suppressors?.length || 0;
  const phase = aisReport?.phase || null;
  const pf = aisReport?.projectedFunding;
  const aisCalculatedAt = (() => {
    try { const d = localStorage.getItem("profundr_ais_calculated_at"); return d ? formatDate(d) : null; } catch { return null; }
  })();

  const getStatusLabel = () => {
    if (!aisScore) return null;
    if (aisScore >= 88) return "Prime Qualification Range";
    if (aisScore >= 78) return "Above Institutional Threshold";
    if (aisScore >= 65) return "Near Institutional Threshold";
    if (aisScore >= 50) return "Below Institutional Threshold";
    return "Sub-Threshold · Correction Required";
  };

  const getPhaseAction = () => {
    if (!phase) return null;
    const p = phase.toLowerCase();
    if (p.includes("repair")) return "Optimization & Correction";
    if (p.includes("build")) return "Positioning & Calibration";
    if (p.includes("wait")) return "Strategic Hold · Preserve File";
    if (p.includes("fund")) return "Qualification Window Open";
    return phase;
  };

  const getReadinessTier = () => {
    if (!pf?.readinessLevel) return null;
    const r = pf.readinessLevel.toLowerCase();
    if (r.includes("not ready") || r.includes("blocked")) return "Pre-Qualification Blocked";
    if (r.includes("early") || r.includes("marginal")) return "Calibration";
    if (r.includes("near") || r.includes("moderate") || r.includes("build")) return "Building";
    if (r.includes("ready") || r.includes("strong")) return "Qualification Ready";
    return pf.readinessLevel;
  };

  const thresholdBars = aisScore ? [
    { label: "Tier 2 Revolvers", threshold: 65 },
    { label: "Tier 1 Revolvers", threshold: 78 },
    { label: "Prime Bankcards", threshold: 82 },
    { label: "Premium Charge", threshold: 88 },
  ] : [];

  return (
    <div className="h-full flex flex-col bg-white border-r border-[#eee]" data-testid="docs-panel">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[#eee]">
        <div className="flex items-center gap-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#1a1a2e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 2C9.5 2 7.5 4 7.5 6.5c0 .5-.4 1-1 1C4.5 7.5 3 9.5 3 11.5c0 1.5.8 2.8 2 3.5 0 0-.5 1.5-.5 2.5C4.5 20 6.5 22 9 22c1.5 0 2.5-.5 3-1.5.5 1 1.5 1.5 3 1.5 2.5 0 4.5-2 4.5-4.5 0-1-.5-2.5-.5-2.5 1.2-.7 2-2 2-3.5 0-2-1.5-4-3.5-4-.6 0-1-.5-1-1C16.5 4 14.5 2 12 2z" />
            <path d="M12 2v20" />
            <path d="M7.5 7.5C9 8.5 10 10 10.5 12" />
            <path d="M16.5 7.5C15 8.5 14 10 13.5 12" />
          </svg>
        </div>
        <button onClick={onClose} className="text-[#999] hover:text-[#555] transition-colors p-1" data-testid="button-close-docs">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M11 3L3 11M3 3l8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" /></svg>
        </button>
      </div>

      <div className="flex items-center gap-1 px-4 py-2 border-b border-[#eee]">
        <button
          onClick={() => setPanelTab("command")}
          className={`px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all ${panelTab === "command" ? "bg-[#1a1a2e] text-white" : "text-[#999] hover:text-[#555] hover:bg-[#f0f0f0]"}`}
          data-testid="tab-command"
        >
          Command
        </button>
        <button
          onClick={() => setPanelTab("perfect")}
          className={`px-3 py-1.5 rounded-md text-[10px] font-semibold transition-all ${panelTab === "perfect" ? "bg-[#1a1a2e] text-white" : "text-[#999] hover:text-[#555] hover:bg-[#f0f0f0]"}`}
          data-testid="tab-perfect-profile"
        >
          Perfect Profile
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">

        {panelTab === "perfect" ? (
          <PerfectProfileTab aisReport={aisReport} />
        ) : (
        <>

        <div className="mb-4">
          {hasAis ? (
            <button
              onClick={onOpenAis}
              className="w-full text-left rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#2a2a40] p-4 hover:from-[#22223a] hover:to-[#333350] transition-all group"
              data-testid="button-open-ais"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[9px] font-medium text-white/50 uppercase tracking-widest">Capital Readiness</p>
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none" className="text-white/30 group-hover:text-white/60 transition-colors shrink-0">
                  <path d="M3 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div className="flex items-baseline gap-1.5 mb-1">
                <span className="text-[28px] font-bold text-white leading-none" data-testid="text-ais-score">{aisScore}</span>
                <span className="text-[13px] font-medium text-white/40">/ 100</span>
              </div>
              <p className="text-[10px] text-white/70 font-medium mb-0.5" data-testid="text-ais-status">{getStatusLabel()}</p>
              <p className="text-[9px] text-white/40">{getPhaseAction()}</p>

              <div className="mt-3 pt-2.5 border-t border-white/10 flex flex-col gap-1.5">
                {suppressorCount > 0 && (
                  <p className="text-[9px] text-white/50">
                    Active Approval Suppressors: <span className="text-white/80 font-medium">{suppressorCount}</span>
                  </p>
                )}
                {pf?.readinessLevel && (
                  <p className="text-[9px] text-white/50">
                    Qualification Tier: <span className="text-white/80 font-medium">{getReadinessTier()}</span>
                  </p>
                )}
                {pf?.inquirySlots && (
                  <p className="text-[9px] text-white/50">
                    Inquiry Capacity: <span className="text-white/80 font-medium">{pf.inquirySlots}</span>
                  </p>
                )}
              </div>

              {aisScore && aisScore < 88 && (
                <div className="mt-3 pt-2.5 border-t border-white/10 space-y-1.5">
                  {[
                    { label: "Tier 1 Revolver Threshold", value: 78 },
                    { label: "Prime Bankcard Threshold", value: 82 },
                  ].map(t => (
                    <div key={t.label} className="flex items-center justify-between">
                      <span className="text-[8px] text-white/35">{t.label}</span>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[7px] text-white/20">→</span>
                        <span className={`text-[8px] font-medium ${aisScore >= t.value ? "text-emerald-400/80" : "text-white/50"}`}>{t.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {aisScore && aisScore < 88 && (
                <p className="mt-2.5 text-[9px] text-white/50">
                  Next Milestone: <span className="text-white/70 font-medium">{aisScore < 78 ? "Tier 1 Revolver Eligibility (78)" : aisScore < 82 ? "Prime Bankcard Eligibility (82)" : "Premium Charge Eligibility (88)"}</span>
                </p>
              )}

              <p className="mt-2 text-[7px] text-white/20 leading-[1.4]">Modeled via multi-factor underwriting logic · inquiry velocity · utilization · depth · account age · profile symmetry</p>

              <div className="mt-2.5 flex items-center gap-1.5 text-[10px] text-white/60 group-hover:text-white/90 font-medium transition-colors">
                <span>View Advancement Protocol</span>
                <svg width="8" height="8" viewBox="0 0 8 8" fill="none"><path d="M2 4h4M4 2l2 2-2 2" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
            </button>
          ) : (
            <div className="rounded-xl border border-dashed border-[#ddd] p-4 text-center">
              <p className="text-[10px] text-[#999] leading-[1.5]">Upload a credit report to activate your Capital Readiness Index</p>
            </div>
          )}
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 3h8M2 6h6M2 9h4" stroke="#333" strokeWidth="1.2" strokeLinecap="round" /></svg>
            <span className="text-[10px] font-semibold text-[#555] uppercase tracking-wider">Correction Engine</span>
            {disputeLetters.length > 0 && <span className="text-[9px] text-white bg-[#1a1a2e] rounded-full px-1.5 py-0.5 font-medium ml-auto">{disputeLetters.length}</span>}
          </div>
          {disputeLetters.length > 0 ? (
            <div className="space-y-1.5">
              {disputeLetters.map((doc, i) => {
                const canDownload = !!(doc.disputes?.length || doc.fileDataUrl);
                const isDownloading = downloadingId === doc.id;
                const itemCount = doc.disputes?.length || 0;
                const categories = new Set<string>();
                doc.disputes?.forEach((d: any) => {
                  const text = `${d.issue || ""} ${d.reason || ""} ${d.creditor || ""}`.toLowerCase();
                  if (/inquir|hard\s*pull|credit\s*pull/i.test(text)) categories.add("Inquiries");
                  else if (/collection|collect|sold.*debt/i.test(text)) categories.add("Collections");
                  else if (/charge.?off/i.test(text)) categories.add("Charge-Offs");
                  else if (/late|delinquen|past.?due/i.test(text)) categories.add("Late Payments");
                  else if (/student.*loan|dept.*ed|education|mohela|navient/i.test(text)) categories.add("Student Loans");
                  else categories.add("Other");
                });
                const letterCount = categories.size;
                return (
                  <div key={doc.id} className="rounded-lg bg-[#fafafa] border border-[#eee] p-2.5 group hover:border-[#ddd] transition-colors" data-testid={`doc-item-${doc.id}`}>
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-[10px] text-[#333] font-semibold">Bureau Challenge — Cycle {i + 1}</p>
                      <div className="flex items-center gap-1">
                        {canDownload && (
                          <button onClick={() => handleDownload(doc)} disabled={isDownloading}
                            className="text-[#1a1a2e] opacity-70 hover:opacity-100 transition-all p-0.5 disabled:opacity-30"
                            title="Download" data-testid={`button-download-doc-${doc.id}`}>
                            {isDownloading ? <span className="text-[9px]">...</span> : (
                              <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><path d="M6 2v6M6 8L4 6M6 8l2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 9v1h8V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            )}
                          </button>
                        )}
                        <button onClick={() => onDelete(doc.id)}
                          className="opacity-0 group-hover:opacity-100 text-[#ccc] hover:text-red-400 transition-all p-0.5"
                          data-testid={`button-delete-doc-${doc.id}`}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-0.5 mt-0.5">
                      <div className="flex items-center gap-3">
                        <p className="text-[8px] text-[#999]">Dispute Items: <span className="text-[#555] font-medium">{itemCount}</span></p>
                        <p className="text-[8px] text-[#999]">Consolidated Letters: <span className="text-[#555] font-medium">{letterCount}</span></p>
                      </div>
                      {categories.size > 0 && (
                        <p className="text-[8px] text-[#999]">Categories: <span className="text-[#555] font-medium">{Array.from(categories).join(" · ")}</span></p>
                      )}
                      <div className="flex items-center gap-3 mt-0.5">
                        <p className="text-[8px] text-[#999]">Filed: <span className="text-[#555] font-medium">{formatDate(doc.savedAt)}</span></p>
                        <p className="text-[8px] text-[#999]">Data Integrity Review: <span className="text-emerald-600 font-medium">Active</span></p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-[10px] text-[#bbb] pl-1 leading-[1.5]">Bureau correction letters generate automatically after analysis</p>
          )}
        </div>

        <div className="mb-4">
          <div className="flex items-center gap-2 mb-2">
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="2" y="1" width="8" height="10" rx="1" stroke="#333" strokeWidth="1" fill="none" /><path d="M4 4h4M4 6h4" stroke="#333" strokeWidth="0.8" strokeLinecap="round" /></svg>
            <span className="text-[10px] font-semibold text-[#555] uppercase tracking-wider">Bureau Intelligence</span>
            {creditReports.length > 0 && <span className="text-[9px] text-[#666] bg-[#f0f0f0] rounded-full px-1.5 py-0.5 font-medium ml-auto">{creditReports.length}</span>}
          </div>
          {creditReports.length > 0 ? (
            <div className="space-y-1.5">
              {(() => {
                const seenBureaus = new Set<string>();
                return creditReports.map(doc => {
                  const n = doc.name.toLowerCase();
                  let bureau = n.includes("trans") ? "TransUnion" : n.includes("equi") ? "Equifax" : n.includes("exper") ? "Experian" : null;
                  if (!bureau) {
                    for (const b of ["Experian", "TransUnion", "Equifax"]) {
                      if (!seenBureaus.has(b)) { bureau = b; break; }
                    }
                    if (!bureau) bureau = "Bureau Report";
                  }
                  seenBureaus.add(bureau);
                  const riskCount = bureau === (aisReport?.bureauSource || "") ? suppressorCount : Math.max(0, suppressorCount - 1);
                  const isSource = bureau === (aisReport?.bureauSource || "");
                  const isExpanded = expandedBureau === bureau;
                  return (
                    <div key={doc.id} className={`rounded-lg border p-2.5 group transition-all ${isExpanded ? "bg-white border-[#ccc] shadow-sm" : "bg-[#fafafa] border-[#eee] hover:border-[#ddd]"}`} data-testid={`doc-item-${doc.id}`}>
                      <div className="flex items-center justify-between mb-1.5">
                        <button
                          onClick={() => hasAis ? setExpandedBureau(isExpanded ? null : bureau) : undefined}
                          className={`flex items-center gap-1.5 text-left ${hasAis ? "cursor-pointer" : "cursor-default"}`}
                          data-testid={`button-expand-bureau-${bureau?.toLowerCase()}`}
                        >
                          {hasAis && (
                            <svg width="8" height="8" viewBox="0 0 8 8" fill="none" className={`transition-transform ${isExpanded ? "rotate-90" : ""}`}>
                              <path d="M2 1l4 3-4 3" stroke="#999" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                          <p className="text-[10px] text-[#333] font-semibold">{bureau}</p>
                          {isSource && hasAis && <span className="text-[7px] text-white bg-[#1a1a2e] rounded px-1 py-[1px] font-medium">SOURCE</span>}
                        </button>
                        <button onClick={() => onDelete(doc.id)}
                          className="opacity-0 group-hover:opacity-100 text-[#ccc] hover:text-red-400 transition-all p-0.5"
                          data-testid={`button-delete-doc-${doc.id}`}>
                          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                        </button>
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <p className="text-[8px] text-[#999]">Data Modeled: <span className="text-[#555] font-medium">{formatDate(doc.savedAt)}</span></p>
                        {hasAis && (
                          <>
                            <p className="text-[8px] text-[#999]">Active Risk Flags: <span className="text-[#555] font-medium">{riskCount}</span></p>
                            <p className="text-[8px] text-[#999]">Inquiry Velocity: <span className="text-[#555] font-medium">{riskCount >= 2 ? "Elevated" : riskCount === 1 ? "Moderate" : "Stable"}</span></p>
                          </>
                        )}
                      </div>
                      {isExpanded && hasAis && aisReport && (
                        <div className="mt-2 pt-2 border-t border-[#e8e8e8] space-y-2.5">
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-[7px] text-[#aaa] uppercase tracking-wider">Approval Index</p>
                              <p className="text-[16px] font-bold text-[#1a1a2e] leading-none mt-0.5">{aisReport.approvalIndex ?? "—"}<span className="text-[9px] text-[#999] font-normal ml-0.5">/ 100</span></p>
                            </div>
                            <div className="text-right">
                              <p className="text-[7px] text-[#aaa] uppercase tracking-wider">Band</p>
                              <p className="text-[10px] font-semibold text-[#333] mt-0.5">{aisReport.band || "—"}</p>
                            </div>
                          </div>
                          {aisReport.phase && (
                            <div>
                              <p className="text-[7px] text-[#aaa] uppercase tracking-wider">Phase</p>
                              <p className="text-[10px] font-medium text-[#333] mt-0.5">{aisReport.phase}</p>
                            </div>
                          )}
                          {aisReport.pillarScores?.length > 0 && (
                            <div>
                              <p className="text-[7px] text-[#aaa] uppercase tracking-wider mb-1">Pillar Scores</p>
                              <div className="space-y-1">
                                {aisReport.pillarScores.map((p, pi) => (
                                  <div key={pi} className="flex items-center gap-2">
                                    <p className="text-[8px] text-[#666] w-[80px] truncate">{p.label}</p>
                                    <div className="flex-1 h-[4px] bg-[#eee] rounded-full overflow-hidden">
                                      <div
                                        className="h-full rounded-full transition-all"
                                        style={{
                                          width: `${p.value}%`,
                                          backgroundColor: p.value >= 80 ? "#1a1a2e" : p.value >= 60 ? "#555" : p.value >= 40 ? "#999" : "#ccc"
                                        }}
                                      />
                                    </div>
                                    <p className="text-[8px] text-[#555] font-semibold w-[20px] text-right">{p.value}</p>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          {aisReport.suppressors?.length > 0 && (
                            <div>
                              <p className="text-[7px] text-[#aaa] uppercase tracking-wider mb-0.5">Risk Drivers</p>
                              {aisReport.suppressors.slice(0, 3).map((s, si) => (
                                <p key={si} className="text-[8px] text-[#777] leading-[1.5]">· {s}</p>
                              ))}
                              {aisReport.suppressors.length > 3 && (
                                <p className="text-[7px] text-[#aaa] mt-0.5">+{aisReport.suppressors.length - 3} more</p>
                              )}
                            </div>
                          )}
                          {aisReport.financialIdentity && (
                            <div>
                              <p className="text-[7px] text-[#aaa] uppercase tracking-wider mb-0.5">Financial Identity</p>
                              {aisReport.financialIdentity.profileType && <p className="text-[8px] text-[#555]">Profile: <span className="font-medium text-[#333]">{aisReport.financialIdentity.profileType}</span></p>}
                              {aisReport.financialIdentity.creditAge && <p className="text-[8px] text-[#555]">Credit Age: <span className="font-medium text-[#333]">{aisReport.financialIdentity.creditAge}</span></p>}
                              {aisReport.financialIdentity.lenderPerception && <p className="text-[8px] text-[#555]">Lender View: <span className="font-medium text-[#333]">{aisReport.financialIdentity.lenderPerception}</span></p>}
                              {aisReport.financialIdentity.identityStrength !== null && (
                                <p className="text-[8px] text-[#555]">Strength: <span className="font-medium text-[#333]">{aisReport.financialIdentity.identityStrength}/100</span></p>
                              )}
                            </div>
                          )}
                          {!isSource && (
                            <p className="text-[7px] text-[#bbb] italic">Data modeled from {aisReport.bureauSource || "primary"} bureau source</p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                });
              })()}
            </div>
          ) : (
            <p className="text-[10px] text-[#bbb] pl-1 leading-[1.5]">No bureau data modeled yet</p>
          )}
        </div>

        {hasAis && pf && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#333" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="12" y1="1" x2="12" y2="23" />
                <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
              </svg>
              <span className="text-[10px] font-semibold text-[#555] uppercase tracking-wider">Funding Strategy Matrix</span>
            </div>
            <div className="rounded-lg bg-[#fafafa] border border-[#eee] p-3 space-y-2.5">
              {pf.readinessLevel && (
                <div>
                  <p className="text-[8px] text-[#aaa] uppercase tracking-wider mb-0.5">Qualification Tier</p>
                  <p className="text-[10px] font-medium text-[#333]">{getReadinessTier()}</p>
                </div>
              )}
              {pf.bestCasePerBureau && (
                <div>
                  <p className="text-[8px] text-[#aaa] uppercase tracking-wider mb-0.5">Maximum Modeled Exposure</p>
                  <p className="text-[10px] font-bold text-[#333]">{pf.bestCasePerBureau}</p>
                </div>
              )}
              {pf.timeline && (
                <div>
                  <p className="text-[8px] text-[#aaa] uppercase tracking-wider mb-0.5">Projected Capital Window</p>
                  <p className="text-[10px] font-medium text-[#333]">{pf.timeline}</p>
                </div>
              )}
              {pf.inquirySlots && (
                <div>
                  <p className="text-[8px] text-[#aaa] uppercase tracking-wider mb-0.5">Inquiry Capacity</p>
                  <p className="text-[10px] font-medium text-[#333]">{pf.inquirySlots}</p>
                </div>
              )}
              {aisCalculatedAt && (
                <div className="pt-2 border-t border-[#eee]">
                  <p className="text-[7px] text-[#bbb]">Last Calculated: {aisCalculatedAt}</p>
                </div>
              )}
            </div>

            {aisReport?.suppressors && aisReport.suppressors.length > 0 && (
              <div className="mt-2.5">
                <p className="text-[8px] text-[#aaa] uppercase tracking-wider font-semibold mb-1.5">Denial Risk Drivers</p>
                <div className="rounded-lg bg-[#fafafa] border border-[#eee] p-2.5 space-y-1.5">
                  {aisReport.suppressors.slice(0, 4).map((s, i) => {
                    const institutional = s
                      .replace(/high utilization/i, "Revolver Utilization Above Institutional Tolerance")
                      .replace(/limited tradelines?/i, "Thin Primary Trade Line Depth")
                      .replace(/(?:heavy|excess)\s*(?:reliance on\s*)?AU\s*accounts?/i, "Excess Authorized User Weighting")
                      .replace(/too many inquiries/i, "Inquiry Velocity Above Safe Threshold")
                      .replace(/thin (?:credit )?file/i, "Insufficient Account Depth")
                      .replace(/short credit (?:history|age)/i, "Insufficient File Seasoning");
                    return (
                      <div key={i} className="flex items-start gap-2">
                        <span className="text-[6px] text-red-400/70 mt-[3px]">●</span>
                        <p className="text-[9px] text-[#555] leading-[1.4]">{institutional}</p>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}

        {hasAis && aisScore && aisScore < 88 && aisReport?.suppressors && aisReport.suppressors.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="#333" strokeWidth="1.2" strokeLinecap="round" /><circle cx="6" cy="6" r="5" stroke="#333" strokeWidth="0.8" fill="none" /></svg>
              <span className="text-[10px] font-semibold text-[#555] uppercase tracking-wider">Capital Advancement Protocol</span>
            </div>

            <div className="rounded-lg bg-[#fafafa] border border-[#eee] p-3 mb-2">
              <p className="text-[8px] text-[#aaa] uppercase tracking-wider mb-1">Objective</p>
              <p className="text-[9px] text-[#333] font-medium">
                {aisScore < 78 ? "Advance from Building → Institutional Threshold (78+)" : aisScore < 82 ? "Advance from Threshold → Prime Qualification (82+)" : "Advance from Prime → Premium Charge Range (88+)"}
              </p>
            </div>

            <div className="space-y-2">
              {(() => {
                const priorities = ["High", "High", "Medium", "Low"];
                const colors = ["#ef4444", "#f97316", "#eab308", "#22c55e"];
                const dots = ["🔴", "🟠", "🟡", "🟢"];
                const moveTemplates: { pattern: RegExp; title: string; action: string; impact: string; delta: string; timeline: string }[] = [
                  { pattern: /utiliz/i, title: "Normalize Revolver Utilization", action: "Reduce revolving balances to ≤30% (ideal: 10–15%)", impact: "Removes primary approval suppressor · Improves underwriting symmetry", delta: "+4 to +7", timeline: "30–60 days" },
                  { pattern: /inquir/i, title: "Stabilize Inquiry Velocity", action: "No new applications for 90 days", impact: "Stabilizes risk modeling · Improves Tier 1 eligibility probability", delta: "+2 to +4", timeline: "90 days" },
                  { pattern: /tradeline|account.*depth|thin.*file|insufficient.*depth/i, title: "Strengthen Primary Trade Depth", action: "Add 2–4 primary revolvers, staggered 60–90 days apart", impact: "Improves limit matching potential · Strengthens file profile", delta: "+3 to +5", timeline: "6–12 months" },
                  { pattern: /authorized.*user|AU.*account|AU.*weight/i, title: "Reduce Authorized User Weighting", action: "Shift utilization weight to primary accounts", impact: "Improves institutional scoring confidence", delta: "+1 to +3", timeline: "Ongoing" },
                  { pattern: /payment|late|delinquen/i, title: "Calibrate Payment Integrity", action: "Maintain 100% on-time payment cadence across all accounts", impact: "Strengthens lender confidence signal", delta: "+2 to +4", timeline: "6+ months" },
                  { pattern: /age|season|young|new.*account/i, title: "Increase File Seasoning", action: "Allow existing accounts to age without new applications", impact: "Improves average age of accounts · Stabilizes file depth", delta: "+2 to +3", timeline: "6–12 months" },
                  { pattern: /collection|charge.?off|deroga/i, title: "Resolve Derogatory Entries", action: "Initiate bureau challenge on reportable negative items", impact: "Removes institutional scoring penalties", delta: "+3 to +6", timeline: "30–90 days" },
                ];

                const moves: { title: string; action: string; impact: string; delta: string; timeline: string; priority: string; color: string; dot: string }[] = [];
                const used = new Set<number>();

                for (const s of aisReport!.suppressors) {
                  if (moves.length >= 4) break;
                  const sl = s.toLowerCase();
                  for (let ti = 0; ti < moveTemplates.length; ti++) {
                    if (used.has(ti)) continue;
                    if (moveTemplates[ti].pattern.test(sl)) {
                      used.add(ti);
                      const idx = moves.length;
                      moves.push({ ...moveTemplates[ti], priority: priorities[idx], color: colors[idx], dot: dots[idx] });
                      break;
                    }
                  }
                }

                if (moves.length === 0) {
                  for (let ti = 0; ti < Math.min(3, moveTemplates.length); ti++) {
                    moves.push({ ...moveTemplates[ti], priority: priorities[ti], color: colors[ti], dot: dots[ti] });
                  }
                }

                const totalDeltaLow = moves.reduce((sum, m) => sum + parseInt(m.delta.match(/\+(\d+)/)?.[1] || "0"), 0);
                const totalDeltaHigh = moves.reduce((sum, m) => sum + parseInt(m.delta.match(/(\d+)$/)?.[1] || "0"), 0);

                return (
                  <>
                    {moves.map((move, i) => (
                      <div key={i} className="rounded-lg border border-[#eee] bg-white p-2.5" data-testid={`protocol-move-${i}`}>
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[9px]">{move.dot}</span>
                          <p className="text-[10px] text-[#333] font-semibold flex-1">Move {i + 1} — {move.title}</p>
                        </div>
                        <div className="pl-5 space-y-1">
                          <p className="text-[8px] text-[#999]">Action: <span className="text-[#555]">{move.action}</span></p>
                          <p className="text-[8px] text-[#999]">Impact: <span className="text-[#555]">{move.impact}</span></p>
                          <div className="flex items-center gap-3 mt-1">
                            <p className="text-[8px] text-[#999]">Readiness Delta: <span className="text-[#333] font-semibold">{move.delta}</span></p>
                            <p className="text-[8px] text-[#999]">Timeline: <span className="text-[#555] font-medium">{move.timeline}</span></p>
                          </div>
                        </div>
                      </div>
                    ))}

                    <div className="rounded-lg bg-[#1a1a2e] p-3 space-y-1.5">
                      <p className="text-[8px] text-white/40 uppercase tracking-wider font-semibold">Progression Estimate</p>
                      {moves.length >= 2 && (
                        <div className="flex items-center justify-between">
                          <span className="text-[8px] text-white/50">Moves 1–2 Completed</span>
                          <span className="text-[9px] text-white/80 font-medium">{Math.min(100, aisScore + totalDeltaLow)}–{Math.min(100, aisScore + Math.round(totalDeltaHigh * 0.6))}</span>
                        </div>
                      )}
                      <div className="flex items-center justify-between">
                        <span className="text-[8px] text-white/50">All Moves Completed</span>
                        <span className="text-[9px] text-white/80 font-bold">{Math.min(100, aisScore + totalDeltaLow)}–{Math.min(100, aisScore + totalDeltaHigh)}</span>
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>
        )}

        {otherDocs.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="2" y="1" width="8" height="10" rx="1" stroke="#999" strokeWidth="1" fill="none" /></svg>
              <span className="text-[10px] font-semibold text-[#555] uppercase tracking-wider">Other Documents</span>
              <span className="text-[9px] text-[#aaa] ml-auto">{otherDocs.length}</span>
            </div>
            <div className="space-y-1">
              {otherDocs.map(doc => (
                <div key={doc.id} className="flex items-center gap-2 pl-1 py-1.5 rounded-lg hover:bg-[#f5f5f5] group transition-colors" data-testid={`doc-item-${doc.id}`}>
                  <div className="flex-1 min-w-0 pl-1">
                    <p className="text-[10px] text-[#444] truncate">{doc.name}</p>
                    <p className="text-[8px] text-[#bbb]">{formatDate(doc.savedAt)}</p>
                  </div>
                  <button onClick={() => onDelete(doc.id)}
                    className="opacity-0 group-hover:opacity-100 text-[#ccc] hover:text-red-400 transition-all p-0.5"
                    data-testid={`button-delete-doc-${doc.id}`}>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="w-full h-px bg-[#eee] my-3"></div>
        <TeamSection user={user} onOpenTeamChat={onOpenTeamChat} activeTeamChatId={activeTeamChatId} />
        </>
        )}
      </div>

      <div className="px-4 py-3 border-t border-[#eee]">
        <input ref={docInputRef} type="file" className="hidden" onChange={handleUploadDoc} data-testid="input-doc-upload" />
        <button
          onClick={() => docInputRef.current?.click()}
          className="w-full flex items-center justify-center gap-2 py-2.5 text-[11px] font-semibold text-white bg-[#1a1a2e] rounded-lg hover:bg-[#2a2a40] transition-colors"
          data-testid="button-add-doc"
        >
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 2v8M2 6h8" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
          Upload New Bureau Data
        </button>
        <p className="text-[9px] text-[#bbb] text-center mt-2 leading-[1.5]">
          Recalculate Capital Readiness Index
        </p>
      </div>
    </div>
  );
}

function getGuestPreviewCount(): number {
  try { return parseInt(localStorage.getItem("profundr_previews") || "0", 10); } catch { return 0; }
}
function setGuestPreviewCount(n: number) {
  try { localStorage.setItem("profundr_previews", String(n)); } catch {}
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
  const [activeTeamChat, setActiveTeamChat] = useState<TeamMember | null>(null);
  const [teamChatMessages, setTeamChatMessages] = useState<GuestMessage[]>([]);
  const [mentionDropdown, setMentionDropdown] = useState<{ show: boolean; query: string; startIdx: number }>({ show: false, query: "", startIdx: 0 });
  const [showBrainHint, setShowBrainHint] = useState(() => {
    try { return !sessionStorage.getItem("profundr_brain_hint_dismissed"); } catch { return true; }
  });
  const [showInputHint, setShowInputHint] = useState(() => {
    try { return !sessionStorage.getItem("profundr_input_hint_dismissed"); } catch { return true; }
  });
  const [mentionSelected, setMentionSelected] = useState(0);
  const [previewCount, setPreviewCount] = useState(getGuestPreviewCount);
  const [showInitiationGate, setShowInitiationGate] = useState(false);
  const [aisReport, setAisReport] = useState<MissionData | null>(() => {
    try {
      const saved = localStorage.getItem("profundr_ais_report");
      return saved ? JSON.parse(saved) : null;
    } catch { return null; }
  });
  const [showAisOverlay, setShowAisOverlay] = useState(false);
  const teamConvoLoaded = useRef(false);
  const teamChatLoaded = useRef(false);
  const lastSeenMsgId = useRef(0);
  const isSendingRef = useRef(false);
  const { user, logout } = useAuth();
  const prevUserRef = useRef<typeof user>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user && !prevUserRef.current) {
      setShowBrainHint(true);
      setShowInputHint(true);
      try {
        sessionStorage.removeItem("profundr_brain_hint_dismissed");
        sessionStorage.removeItem("profundr_input_hint_dismissed");
      } catch {}
    }
    prevUserRef.current = user;
  }, [user]);

  const teamMsgToGuestMsg = useCallback((m: TeamMessage, userId: number): GuestMessage => {
    if (m.isAi) {
      return {
        id: m.id + 100000,
        role: "assistant" as const,
        content: m.content,
        senderName: m.senderId !== userId ? `${m.displayName}'s AI` : undefined,
        senderId: m.senderId,
      };
    }
    if (m.senderId === userId) {
      return {
        id: m.id + 100000,
        role: "user" as const,
        content: m.content,
        senderName: m.displayName,
        senderPhoto: m.profilePhoto,
        senderId: m.senderId,
      };
    }
    return {
      id: m.id + 100000,
      role: "team" as const,
      content: m.content,
      senderName: m.displayName,
      senderPhoto: m.profilePhoto,
      senderId: m.senderId,
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    const poll = async () => {
      if (isSendingRef.current) return;
      try {
        const res = await fetch("/api/team/messages");
        if (!res.ok) return;
        const msgs: TeamMessage[] = await res.json();
        if (msgs.length === 0) return;

        if (!teamConvoLoaded.current) {
          teamConvoLoaded.current = true;
          const allMsgs = msgs.map(m => teamMsgToGuestMsg(m, user.id));
          setGuestMessages(allMsgs);
          setNextId(Math.max(...msgs.map(m => m.id)) + 100002);
          lastSeenMsgId.current = Math.max(...msgs.map(m => m.id));
          return;
        }

        const newMsgs = msgs.filter(m => m.id > lastSeenMsgId.current);
        if (newMsgs.length > 0) {
          setGuestMessages(prev => {
            const existingIds = new Set(prev.map(p => p.id));
            const incoming = newMsgs
              .map(m => teamMsgToGuestMsg(m, user.id))
              .filter(m => !existingIds.has(m.id));
            return incoming.length > 0 ? [...prev, ...incoming] : prev;
          });
        }
        lastSeenMsgId.current = Math.max(...msgs.map(m => m.id));
      } catch {}
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => clearInterval(interval);
  }, [user, teamMsgToGuestMsg]);

  const playNotificationSound = useCallback(() => {
    try {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.setValueAtTime(800, ctx.currentTime);
      osc.frequency.setValueAtTime(600, ctx.currentTime + 0.1);
      gain.gain.setValueAtTime(0.3, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.2);
      osc.start(ctx.currentTime);
      osc.stop(ctx.currentTime + 0.2);
    } catch {}
  }, []);

  const handleOpenTeamChat = useCallback((member: TeamMember) => {
    if (activeTeamChat?.id === member.id) {
      setActiveTeamChat(null);
      setTeamChatMessages([]);
      teamChatLoaded.current = false;
      return;
    }
    setActiveTeamChat(member);
    setTeamChatMessages([]);
    teamChatLoaded.current = false;
  }, [activeTeamChat]);

  useEffect(() => {
    if (!user || !activeTeamChat) return;
    let cancelled = false;
    const targetId = activeTeamChat.id;
    let lastKnownCount = 0;

    const poll = async () => {
      if (cancelled) return;
      try {
        const res = await fetch(`/api/team/chat/messages?with=${targetId}`);
        if (!res.ok || cancelled) return;
        const msgs: TeamMessage[] = await res.json();
        if (cancelled) return;

        const allMsgs = msgs.map(m => teamMsgToGuestMsg(m, user.id));

        if (lastKnownCount > 0 && msgs.length > lastKnownCount) {
          const newFromOthers = msgs.slice(lastKnownCount).filter(m => m.senderId !== user.id);
          if (newFromOthers.length > 0) playNotificationSound();
        }

        lastKnownCount = msgs.length;
        setTeamChatMessages(allMsgs);
      } catch {}
    };

    poll();
    const interval = setInterval(poll, 3000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [user, activeTeamChat, teamMsgToGuestMsg, playNotificationSound]);

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
  }, [guestMessages, teamChatMessages]);

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
      if (!result || result.length < 10) {
        alert("Could not read this file. Please try again or use a different file.");
        return;
      }
      const content = isPdf ? (result.split(",")[1] || result) : result;
      if (!content || content.length < 10) {
        alert("File appears to be empty or unreadable. Please try a different file.");
        return;
      }
      const fileData = { name: file.name, content, isPdf };
      if (shouldAutoSend) {
        if (!user && previewCount >= 2) {
          setShowInitiationGate(true);
          return;
        }
        doSend("Analyze my credit report and generate my AIS.", fileData);
      } else {
        setAttachedFile(fileData);
      }
    };
    reader.onerror = () => {
      alert("Failed to read this file. Please try again.");
    };
    isPdf ? reader.readAsDataURL(file) : reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const doSend = async (text: string, file?: { name: string; content: string; isPdf?: boolean } | null) => {
    if (file && (!file.content || file.content.length < 10)) {
      file = null;
    }
    const displayText = file ? `${text}\n\n[Attached: ${file.name}]` : text;
    const userMsg: GuestMessage = { id: nextId, role: "user", content: displayText, senderName: user?.displayName || user?.email };

    if (file) {
      try {
        const existingDoc = savedDocs.find(d => d.name === file.name && d.type === "credit_report");
        if (!existingDoc) {
          handleSaveDoc({
            id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
            name: file.name,
            type: "credit_report",
            savedAt: Date.now(),
          });
        }
      } catch {}
    }

    if (activeTeamChat && user) {
      setTeamChatMessages((prev) => [...prev, userMsg]);
      setNextId((n) => n + 1);
      setIsSending(true);
      isSendingRef.current = true;
      playNotificationSound();

      try {
        const storePromise = fetch("/api/team/chat/message", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ content: displayText, withUserId: activeTeamChat.id }),
        }).then(r => r.ok ? r.json() : null).catch(() => null);

        const localHistory = [...teamChatMessages, userMsg].map(m => ({
          role: m.role === "assistant" ? "assistant" : "user",
          content: m.role !== "assistant" && m.senderName
            ? `[${m.senderName}]: ${m.content}`
            : m.content,
        }));

        const cleanTeamHistory = localHistory.slice(-10).map(h => ({
          role: (h.role === "user" || h.role === "assistant") ? h.role : "user" as const,
          content: h.content,
        }));
        const payload: Record<string, unknown> = {
          content: text,
          history: cleanTeamHistory,
          teamContext: {
            senderName: user.displayName || user.email,
            partnerName: activeTeamChat.displayName,
          },
        };
        if (file) {
          payload.fileContent = file.content;
          payload.attachment = "credit_report";
          payload.fileType = file.isPdf ? "pdf" : "text";
        }

        const [res, stored] = await Promise.all([
          fetch("/api/chat/guest", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          }),
          storePromise,
        ]);

        if (stored) {
          setTeamChatMessages(prev => prev.map(m => m.id === userMsg.id ? { ...m, id: stored.id + 100000 } : m));
        }

        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        const aiMsg: GuestMessage = { id: nextId + 1, role: "assistant", content: data.content };
        setTeamChatMessages((prev) => [...prev, aiMsg]);
        setNextId((n) => n + 1);

        try {
          const aiStoreRes2 = await fetch("/api/team/chat/message", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ content: data.content, withUserId: activeTeamChat.id, isAi: true }),
          });
          if (aiStoreRes2.ok) {
            const aiStored = await aiStoreRes2.json();
            if (aiStored) {
              setTeamChatMessages(prev => prev.map(m => m.id === aiMsg.id ? { ...m, id: aiStored.id + 100000 } : m));
            }
          }
        } catch {}
      } catch {
        const errMsg: GuestMessage = { id: nextId + 1, role: "assistant", content: "Sorry, something went wrong. Please try again." };
        setTeamChatMessages((prev) => [...prev, errMsg]);
        setNextId((n) => n + 1);
      } finally {
        setIsSending(false);
        isSendingRef.current = false;
        inputRef.current?.focus();
      }
      return;
    }

    setGuestMessages((prev) => [...prev, userMsg]);
    setNextId((n) => n + 1);
    setIsSending(true);
    isSendingRef.current = true;

    try {
      let history: { role: string; content: string }[];

      const storePromise = user
        ? fetch("/api/team/message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: displayText }) })
            .then(r => r.ok ? r.json() : null)
            .catch(() => null)
        : Promise.resolve(null);

      if (user) {
        const localHistory = [...guestMessages, userMsg].map(m => ({
          role: m.role === "team" ? "user" : m.role,
          content: m.role === "team" ? `[Team member ${m.senderName || "Unknown"}]: ${m.content}` : m.content,
        }));
        history = localHistory;
      } else {
        history = [...guestMessages, userMsg].map(m => ({
          role: m.role === "team" ? "user" : m.role,
          content: m.content,
        }));
      }

      const cleanHistory = history.slice(-10).map(h => ({
        role: (h.role === "user" || h.role === "assistant") ? h.role : "user" as const,
        content: h.content,
      }));
      const payload: Record<string, unknown> = { content: text, history: cleanHistory };
      if (file) {
        payload.fileContent = file.content;
        payload.attachment = "credit_report";
        payload.fileType = file.isPdf ? "pdf" : "text";
      }

      const [res, stored] = await Promise.all([
        fetch("/api/chat/guest", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        }),
        storePromise,
      ]);

      if (stored) {
        lastSeenMsgId.current = Math.max(lastSeenMsgId.current, stored.id);
        setGuestMessages(prev => prev.map(m => m.id === userMsg.id ? { ...m, id: stored.id + 100000 } : m));
      }

      if (!res.ok) throw new Error("Failed to get response");
      const data = await res.json();
      let responseContent = data.content;

      if (!user) {
        const newCount = previewCount + 1;
        setPreviewCount(newCount);
        setGuestPreviewCount(newCount);
        if (newCount === 1) {
          responseContent += "\n\n---\n\n*This is 1 of 2 complimentary previews. Subscribe to unlock the full system — AIS, dispute letters, funding projections, and unlimited analysis.*";
        } else if (newCount === 2) {
          responseContent += "\n\n---\n\n**Your final complimentary preview is complete.**\n\nSubscribe to access the full system — AIS scoring, dispute generation, funding projections, and unlimited analysis. $50/mo, cancel anytime.";
        }
      }

      const aiMsg: GuestMessage = { id: nextId + 1, role: "assistant", content: responseContent };
      setGuestMessages((prev) => [...prev, aiMsg]);
      setNextId((n) => n + 1);

      const parsedAis = parseSingleMessageData(responseContent);
      if (hasAnalysisData(parsedAis) && parsedAis.approvalIndex !== null) {
        setAisReport(parsedAis);
        try {
          localStorage.setItem("profundr_ais_report", JSON.stringify(parsedAis));
          localStorage.setItem("profundr_ais_calculated_at", new Date().toISOString());
        } catch {}
      }

      if (user) {
        try {
          const aiStoreRes = await fetch("/api/team/message", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ content: data.content, isAi: true }) });
          if (aiStoreRes.ok) {
            const aiStored = await aiStoreRes.json();
            if (aiStored) {
              lastSeenMsgId.current = Math.max(lastSeenMsgId.current, aiStored.id);
              setGuestMessages(prev => prev.map(m => m.id === aiMsg.id ? { ...m, id: aiStored.id + 100000 } : m));
            }
          }
        } catch {}
      }
    } catch {
      const errMsg: GuestMessage = { id: nextId + 1, role: "assistant", content: "Sorry, something went wrong. Please try again." };
      setGuestMessages((prev) => [...prev, errMsg]);
      setNextId((n) => n + 1);
    } finally {
      setIsSending(false);
      isSendingRef.current = false;
      inputRef.current?.focus();
    }
  };

  const handleSend = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (isSending) return;
    if (!text && !attachedFile) return;

    if (!user && previewCount >= 2) {
      setShowInitiationGate(true);
      return;
    }

    const file = attachedFile;
    const msg = text || "Analyze my credit report and generate my AIS.";
    setInput("");
    setAttachedFile(null);
    doSend(msg, file);
  };

  const handleSubmit = (e: React.FormEvent) => { e.preventDefault(); if (mentionDropdown.show) return; handleSend(); };
  const handleUploadClick = () => { fileInputRef.current?.click(); };

  const renderMentionText = useCallback((text: string) => {
    const parts = text.split(/(@\w+)/g);
    return parts.map((part, i) => {
      if (part.startsWith("@")) {
        const name = part.slice(1);
        const isProfundr = name.toLowerCase() === "profundr";
        return (
          <span key={i} className={`inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[13px] font-medium ${isProfundr ? 'bg-[#1a1a2e] text-white' : 'bg-[#ede9fe] text-[#6366f1]'}`}>
            @{name}
          </span>
        );
      }
      return part;
    });
  }, []);
  const displayMessages = activeTeamChat ? teamChatMessages : guestMessages;
  const hasMessages = displayMessages.length > 0;

  const mentionCandidates = useMemo(() => {
    if (!activeTeamChat) return [];
    const candidates = [
      { name: "Profundr", type: "ai" as const },
      { name: activeTeamChat.displayName, type: "member" as const },
    ];
    if (user?.displayName || user?.email) {
      candidates.push({ name: (user.displayName || user.email)!, type: "self" as const });
    }
    return candidates;
  }, [activeTeamChat, user]);

  const filteredMentions = useMemo(() => {
    if (!mentionDropdown.show) return [];
    const q = mentionDropdown.query.toLowerCase();
    return mentionCandidates.filter(c => c.name.toLowerCase().includes(q));
  }, [mentionDropdown, mentionCandidates]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setInput(val);

    if (!activeTeamChat) {
      setMentionDropdown({ show: false, query: "", startIdx: 0 });
      return;
    }

    const cursorPos = e.target.selectionStart || val.length;
    const textBefore = val.slice(0, cursorPos);
    const atMatch = textBefore.match(/@(\w*)$/);

    if (atMatch) {
      setMentionDropdown({ show: true, query: atMatch[1], startIdx: cursorPos - atMatch[0].length });
      setMentionSelected(0);
    } else {
      setMentionDropdown({ show: false, query: "", startIdx: 0 });
    }
  };

  const insertMention = (name: string) => {
    const before = input.slice(0, mentionDropdown.startIdx);
    const after = input.slice(mentionDropdown.startIdx + mentionDropdown.query.length + 1);
    const newVal = `${before}@${name} ${after}`;
    setInput(newVal);
    setMentionDropdown({ show: false, query: "", startIdx: 0 });
    inputRef.current?.focus();
  };

  const handleInputKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (!mentionDropdown.show || filteredMentions.length === 0) return;
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setMentionSelected(prev => (prev + 1) % filteredMentions.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setMentionSelected(prev => (prev - 1 + filteredMentions.length) % filteredMentions.length);
    } else if (e.key === "Enter" || e.key === "Tab") {
      e.preventDefault();
      insertMention(filteredMentions[mentionSelected].name);
    } else if (e.key === "Escape") {
      setMentionDropdown({ show: false, query: "", startIdx: 0 });
    }
  };

  return (
    <div className="relative h-[100dvh] flex bg-[#fafafa]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <input ref={fileInputRef} type="file" accept=".pdf,.txt,.csv" className="hidden" onChange={handleFileSelect} data-testid="input-file-upload" />

      {docsOpen && (
        <>
          <div className="sm:hidden fixed inset-0 bg-black/30 z-40" onClick={() => setDocsOpen(false)} />
          <div className="fixed sm:relative z-50 sm:z-auto w-[340px] h-full shrink-0 transition-all" data-testid="docs-sidebar">
            <DocsPanel docs={savedDocs} onClose={() => setDocsOpen(false)} onDelete={handleDeleteDoc} onSave={handleSaveDoc} user={user} onOpenTeamChat={handleOpenTeamChat} activeTeamChatId={activeTeamChat?.id} aisReport={aisReport} onOpenAis={() => setShowAisOverlay(true)} />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <div className="flex-1 overflow-y-auto" data-testid="main-scroll-area">
          <nav className="sticky top-0 z-30 bg-[#fafafa]/95 backdrop-blur-sm flex items-center justify-between px-4 sm:px-6 py-3 border-b border-[#eee]" data-testid="nav-top">
            <div className="flex items-center gap-2">
              {!docsOpen && (
                <div className="relative">
                  <button
                    onClick={() => {
                      setDocsOpen(true);
                      if (showBrainHint) {
                        setShowBrainHint(false);
                        try { sessionStorage.setItem("profundr_brain_hint_dismissed", "1"); } catch {}
                      }
                    }}
                    className="relative w-8 h-8 flex items-center justify-center rounded-lg text-[#888] hover:text-[#555] hover:bg-[#eee] transition-colors mr-1"
                    title="Workspace"
                    data-testid="button-toggle-docs"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M12 2C9.5 2 7.5 4 7.5 6.5c0 .5-.4 1-1 1C4.5 7.5 3 9.5 3 11.5c0 1.5.8 2.8 2 3.5 0 0-.5 1.5-.5 2.5C4.5 20 6.5 22 9 22c1.5 0 2.5-.5 3-1.5.5 1 1.5 1.5 3 1.5 2.5 0 4.5-2 4.5-4.5 0-1-.5-2.5-.5-2.5 1.2-.7 2-2 2-3.5 0-2-1.5-4-3.5-4-.6 0-1-.5-1-1C16.5 4 14.5 2 12 2z" />
                      <path d="M12 2v20" />
                      <path d="M7.5 7.5C9 8.5 10 10 10.5 12" />
                      <path d="M16.5 7.5C15 8.5 14 10 13.5 12" />
                    </svg>
                  </button>
                  {showBrainHint && (
                    <div
                      className="absolute top-full left-0 mt-2 z-50 animate-in fade-in slide-in-from-top-1 duration-300"
                      data-testid="popup-brain-hint"
                    >
                      <div className="relative bg-[#1a1a2e] text-white rounded-xl px-4 py-3 shadow-lg" style={{ width: "220px" }}>
                        <div className="absolute -top-[6px] left-4 w-3 h-3 bg-[#1a1a2e] rotate-45" />
                        <p className="text-[12px] leading-[1.5] font-medium">
                          Tap the brain for your dashboard, documents, team, and full capabilities.
                        </p>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            setShowBrainHint(false);
                            try { sessionStorage.setItem("profundr_brain_hint_dismissed", "1"); } catch {}
                          }}
                          className="mt-2 text-[10px] text-white/60 hover:text-white/90 transition-colors"
                          data-testid="button-dismiss-brain-hint"
                        >
                          Got it
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              <div data-testid="nav-logo">
                <ProfundrLogo size="md" variant="dark" />
              </div>
            </div>
            {user ? (
              <div className="flex items-center gap-3">
                <span className="text-[12px] text-[#999] hidden sm:inline" data-testid="text-user-email">{user.email}</span>
                <label className="cursor-pointer relative group" title="Change profile photo" data-testid="button-profile-photo">
                  <ProfileAvatar photo={user.profilePhoto} name={user.displayName || user.email} size={30} />
                  <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v10M1 6h10" stroke="white" strokeWidth="1.5" strokeLinecap="round" /></svg>
                  </div>
                  <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                    const file = e.target.files?.[0];
                    if (!file) return;
                    if (file.size > 1_500_000) { alert("Photo too large (max 1.5MB)"); return; }
                    const reader = new FileReader();
                    reader.onload = async () => {
                      const base64 = reader.result as string;
                      try {
                        const res = await fetch("/api/profile-photo", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ photo: base64 }) });
                        if (res.ok) { window.location.reload(); }
                      } catch {}
                    };
                    reader.readAsDataURL(file);
                  }} data-testid="input-profile-photo" />
                </label>
                <button
                  onClick={() => { logout(); window.location.href = '/'; }}
                  className="rounded-full px-4 py-1.5 text-[12px] font-medium bg-[#1a1a2e] text-white hover:bg-[#2a2a40] transition-colors"
                  data-testid="button-signout"
                >
                  Sign Out
                </button>
              </div>
            ) : (
              <button
                onClick={() => window.location.href = '/subscription'}
                className="rounded-full px-5 py-2 text-[13px] font-medium border border-[#ddd] text-[#555] hover:bg-[#f0f0f0] transition-colors"
                data-testid="button-signin"
              >
                Sign In
              </button>
            )}
          </nav>

          {activeTeamChat && (
            <div className="sticky top-[53px] z-20 bg-[#f0eeff] border-b border-[#d4d0f0] px-4 py-2 flex items-center justify-between" data-testid="team-chat-banner">
              <div className="flex items-center gap-2">
                <ProfileAvatar photo={activeTeamChat.profilePhoto} name={activeTeamChat.displayName} size={24} className="!bg-[#6366f1]" />
                <span className="text-[12px] font-medium text-[#333]">Team chat with {activeTeamChat.displayName}</span>
                <span className="text-[10px] text-[#888]">3-way: You + {activeTeamChat.displayName} + Profundr AI</span>
              </div>
              <button
                onClick={() => { setActiveTeamChat(null); setTeamChatMessages([]); teamChatLoaded.current = false; }}
                className="text-[11px] text-[#6366f1] font-medium hover:text-[#4f46e5] flex items-center gap-1"
                data-testid="button-close-team-chat"
              >
                <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 2l6 6M8 2l-6 6" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" /></svg>
                Back to personal
              </button>
            </div>
          )}

          {showAisOverlay && aisReport && hasAnalysisData(aisReport) ? (
            <div className="w-full max-w-[720px] mx-auto px-4 pt-4 pb-2">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setShowAisOverlay(false)}
                    className="w-7 h-7 flex items-center justify-center rounded-lg text-[#999] hover:text-[#555] hover:bg-[#eee] transition-colors"
                    data-testid="button-close-ais-overlay"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L4 7l5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <span className="text-[13px] font-semibold text-[#333]">Approval Index Score</span>
                </div>
              </div>
              <MissionDashboard data={aisReport} userName={user?.displayName || user?.email} />
            </div>
          ) : !hasMessages && !isSending ? (
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
                {displayMessages.map((msg) => {
                  const msgData = msg.role === "assistant" ? parseSingleMessageData(msg.content) : null;
                  const showDashboard = msgData && hasAnalysisData(msgData);
                  const disputes = msg.role === "assistant" ? parseDisputeItems(msg.content) : [];

                  return (
                    <div key={msg.id}>
                      {msg.role === "team" ? (
                        <div className="flex gap-3 justify-start">
                          <ProfileAvatar photo={msg.senderPhoto} name={msg.senderName} size={28} className="mt-0.5 !bg-[#6366f1]" />
                          <div className="max-w-[85%]" data-testid={`message-team-${msg.id}`}>
                            <p className="text-[10px] text-[#6366f1] font-medium mb-0.5">{msg.senderName}</p>
                            <div className="bg-[#f0eeff] rounded-[20px] rounded-bl-[6px] px-4 py-2.5">
                              {(() => {
                                const attachMatch = msg.content.match(/\[Attached: (.+?)\]/);
                                const textContent = msg.content.replace(/\n*\[Attached: .+?\]/, '').trim();
                                return (
                                  <>
                                    {attachMatch && <FileAttachmentCard filename={attachMatch[1]} />}
                                    {textContent && <p className="text-[14px] text-[#1a1a1a] leading-[1.6] whitespace-pre-wrap">{renderMentionText(textContent)}</p>}
                                  </>
                                );
                              })()}
                            </div>
                          </div>
                        </div>
                      ) : (
                      <div className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        {msg.role === "assistant" && (
                          <ProfundrAvatar size={28} className="mt-0.5" />
                        )}
                        <div
                          className={`max-w-[85%] ${msg.role === "user" ? "bg-[#f0f0f0] rounded-[20px] rounded-br-[6px] px-4 py-2.5" : "bg-transparent"}`}
                          data-testid={`message-${msg.role}-${msg.id}`}
                        >
                          {msg.role === "assistant" && msg.senderName && (
                            <p className="text-[10px] text-[#6366f1] font-medium mb-0.5">{msg.senderName}</p>
                          )}
                          {msg.role === "user" ? (() => {
                            const attachMatch = msg.content.match(/\[Attached: (.+?)\]/);
                            const textContent = msg.content.replace(/\n*\[Attached: .+?\]/, '').trim();
                            return (
                              <>
                                {attachMatch && <FileAttachmentCard filename={attachMatch[1]} />}
                                {textContent && <p className="text-[14px] text-[#1a1a1a] leading-[1.6] whitespace-pre-wrap">{renderMentionText(textContent)}</p>}
                              </>
                            );
                          })() : (
                            <FormatResponse content={msg.content} />
                          )}
                        </div>
                        {msg.role === "user" && (
                          <ProfileAvatar photo={msg.senderPhoto || user?.profilePhoto} name={msg.senderName || user?.displayName || user?.email} size={28} className="mt-0.5" />
                        )}
                      </div>
                      )}
                      {showDashboard && (
                        <div className="ml-10">
                          <MissionDashboard data={msgData} userName={user?.displayName || user?.email} />
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
                              <DisputeDownloadButton disputes={disputes} onSave={handleSaveDisputeLetters} />
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
                {isSending && (
                  <div className="flex gap-3 justify-start">
                    <ProfundrAvatar size={28} className="mt-0.5 animate-pulse" />
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
                "Find my approval blockers",
                "Run a denial simulation",
                "Show me what to fix first",
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
            <div className="mb-2 px-1" data-testid="attached-file-preview">
              <div className="inline-flex items-center gap-3 border border-[#d0d0d0] rounded-2xl px-4 py-3 bg-[#f9f9f9] relative max-w-[320px]">
                <div className="w-10 h-10 rounded-xl bg-[#ef4444] flex items-center justify-center shrink-0">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
                    <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                    <polyline points="14,2 14,8 20,8" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[13px] font-medium text-[#1a1a1a] truncate">{attachedFile.name}</p>
                  <p className="text-[11px] text-[#888] uppercase">{attachedFile.isPdf ? 'PDF' : attachedFile.name.split('.').pop()?.toUpperCase() || 'FILE'}</p>
                </div>
                <button
                  onClick={() => setAttachedFile(null)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-[#666] text-white flex items-center justify-center text-[14px] hover:bg-[#444] transition-colors shadow-sm"
                  data-testid="button-remove-file"
                >
                  &times;
                </button>
              </div>
            </div>
          )}

          {mentionDropdown.show && filteredMentions.length > 0 && (
            <div className="w-full mb-1.5" data-testid="mention-dropdown">
              <div className="bg-white border border-[#e0e0e0] rounded-xl shadow-lg overflow-hidden max-w-[280px]">
                <div className="px-3 py-1.5 border-b border-[#f0f0f0]">
                  <p className="text-[9px] text-[#999] font-medium uppercase tracking-wider">Mention</p>
                </div>
                {filteredMentions.map((c, i) => (
                  <button
                    key={c.name}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors ${i === mentionSelected ? 'bg-[#f0eeff]' : 'hover:bg-[#f8f8f8]'}`}
                    onClick={() => insertMention(c.name)}
                    data-testid={`mention-option-${c.name}`}
                  >
                    {c.type === 'ai' ? (
                      <ProfundrAvatar size={24} />
                    ) : (
                      <ProfileAvatar photo={c.type === 'self' ? user?.profilePhoto : activeTeamChat?.profilePhoto} name={c.name} size={24} className={c.type === 'self' ? '!bg-[#10b981]' : '!bg-[#6366f1]'} />
                    )}
                    <div>
                      <p className="text-[12px] font-medium text-[#333]">@{c.name}</p>
                      <p className="text-[9px] text-[#999]">{c.type === 'ai' ? 'AI Assistant' : c.type === 'self' ? 'You' : 'Team Member'}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {showInputHint && !activeTeamChat && (
            <div className="flex justify-center mb-2 animate-in fade-in slide-in-from-bottom-1 duration-300" data-testid="popup-input-hint">
              <div className="relative bg-[#1a1a2e] text-white rounded-xl px-4 py-3 shadow-lg" style={{ maxWidth: "300px" }}>
                <p className="text-[12px] leading-[1.5] font-medium text-center">
                  Ask credit repair or funding questions, or upload your report for a full analysis.
                </p>
                <button
                  onClick={() => {
                    setShowInputHint(false);
                    try { sessionStorage.setItem("profundr_input_hint_dismissed", "1"); } catch {}
                  }}
                  className="block mx-auto mt-2 text-[10px] text-white/60 hover:text-white/90 transition-colors"
                  data-testid="button-dismiss-input-hint"
                >
                  Got it
                </button>
                <div className="absolute -bottom-[6px] left-1/2 -translate-x-1/2 w-3 h-3 bg-[#1a1a2e] rotate-45" />
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
                placeholder={attachedFile ? "Add a message about your report..." : activeTeamChat ? `Message team chat with ${activeTeamChat.displayName}... (type @ to mention)` : "Ask about your funding readiness..."}
                className="flex-1 bg-transparent text-[14px] text-[#1a1a1a] placeholder:text-[#999] outline-none px-2"
                value={input} onChange={handleInputChange} onKeyDown={handleInputKeyDown} disabled={isSending}
                onFocus={() => { if (showInputHint) { setShowInputHint(false); try { sessionStorage.setItem("profundr_input_hint_dismissed", "1"); } catch {} } }}
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

          {!user && (
            <p className="text-center text-[10px] text-[#bbb] mt-1 tracking-wide" data-testid="text-preview-counter">
              {previewCount === 0 ? "2 complimentary previews available" : previewCount === 1 ? "1 complimentary preview remaining" : "Complimentary previews exhausted"}
            </p>
          )}

          <p className="text-center text-[11px] text-[#aaa] mt-3 leading-[1.5]" data-testid="text-footer-legal">
            Profundr is a capital intelligence platform, not a lender.{" "}
            <span className="underline cursor-pointer hover:text-[#888] transition-colors">Terms</span> &middot;{" "}
            <span className="underline cursor-pointer hover:text-[#888] transition-colors">Privacy</span>
          </p>
        </div>
      </div>

      {showInitiationGate && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" data-testid="modal-initiation-gate">
          <div className="bg-white rounded-2xl shadow-2xl max-w-[420px] w-[90%] p-8 text-center relative">
            <button
              onClick={() => setShowInitiationGate(false)}
              className="absolute top-4 right-4 text-[#ccc] hover:text-[#666] transition-colors"
              data-testid="button-close-initiation"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            <div className="mb-6">
              <ProfundrAvatar size={48} className="mx-auto mb-4" />
              <h2 className="text-[22px] font-bold text-[#1a1a2e] tracking-[-0.02em] mb-2" data-testid="text-initiation-headline">
                Unlock Profundr
              </h2>
              <p className="text-[13px] text-[#777] leading-[1.6] max-w-[320px] mx-auto">
                Your complimentary previews are complete. Subscribe to access full AIS scoring, dispute generation, funding projections, and unlimited analysis.
              </p>
            </div>

            <div className="space-y-2.5 mb-5">
              <button
                onClick={() => { setShowInitiationGate(false); window.location.href = '/subscription'; }}
                className="w-full py-3 bg-[#1a1a2e] text-white rounded-full text-[14px] font-medium hover:bg-[#2a2a40] transition-colors"
                data-testid="button-initiation-subscribe"
              >
                Subscribe — $50/mo
              </button>
            </div>

            <p className="text-[10px] text-[#bbb] tracking-wide">
              Secure payment via Stripe. Cancel anytime.
            </p>
          </div>
        </div>
      )}

    </div>
  );
}
