import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import ReactMarkdown from "react-markdown";
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
  disputePackageUrl?: string;
  disputeCount?: number;
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

interface StrategyStep {
  step: number;
  action: string;
  impact: string;
  timeframe: string;
}

interface TimelineMilestone {
  months: number;
  label: string;
  approvalOdds: number;
  change: string;
}

interface FundingMatch {
  lender: string;
  likelihood: string;
  reason: string;
}

interface StrategyData {
  steps: StrategyStep[];
  currentOdds: number;
  projectedOdds: number;
  currentFunding: string;
  projectedFunding: string;
  timeline: TimelineMilestone[];
  fundingMatches: FundingMatch[];
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
  strategyData: StrategyData | null;
}

interface DisputeItem {
  creditor: string;
  accountNumber: string;
  issue: string;
  bureau: string;
  reason: string;
  disputeRound?: number;
  category?: string;
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

  let strategyData: StrategyData | null = null;
  const strategyBlockMatch = content.match(/STRATEGY_DATA_START\s*([\s\S]*?)\s*STRATEGY_DATA_END/);
  if (strategyBlockMatch) {
    try {
      const parsed = JSON.parse(strategyBlockMatch[1].trim());
      if (parsed && (parsed.steps || parsed.timeline || parsed.fundingMatches)) {
        strategyData = {
          steps: (parsed.steps || []).map((s: any, i: number) => ({
            step: s.step || i + 1,
            action: s.action || "",
            impact: s.impact || "",
            timeframe: s.timeframe || "",
          })),
          currentOdds: parsed.currentOdds || 0,
          projectedOdds: parsed.projectedOdds || 0,
          currentFunding: parsed.currentFunding || "",
          projectedFunding: parsed.projectedFunding || "",
          timeline: (parsed.timeline || []).map((m: any) => ({
            months: m.months || 0,
            label: m.label || "",
            approvalOdds: m.approvalOdds || 0,
            change: m.change || "",
          })),
          fundingMatches: (parsed.fundingMatches || []).map((f: any) => ({
            lender: f.lender || "",
            likelihood: f.likelihood || "",
            reason: f.reason || "",
          })),
        };
      }
    } catch {}
  }

  return { approvalIndex, band, phase, bureauSource, pillarScores, suppressors, helping, hurting, bestNextMove, financialIdentity, projectedFunding, openTradelines, strategyData };
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

function filterMarkdown(content: string): string {
  const cleaned = content
    .replace(/^---+$/gm, "")
    .replace(/^={3,}.*$/gm, "")
    .replace(/REPAIR_DATA_START[\s\S]*?REPAIR_DATA_END/g, "")
    .replace(/STRATEGY_DATA_START[\s\S]*?STRATEGY_DATA_END/g, "")
    .replace(/^\s*DISPUTE:\s*.+$/gm, "")
    .replace(/\[GENERATE_DISPUTE_PACKAGE\]/g, "");
  const lines = cleaned.split("\n");
  const filteredLines = lines.filter(l => {
    const t = l.trim();
    if (/^DISPUTE:/i.test(t)) return false;
    if (/^TRADELINE:/i.test(t)) return false;
    const stripped = t.replace(/^\d+[\.\)]\s*/, "").replace(/^[-•]\s*/, "");
    if (/^DISPUTE:/i.test(stripped)) return false;
    if (/^TRADELINE:/i.test(stripped)) return false;
    return true;
  });
  return filteredLines.join("\n").trim();
}

const chatMdComponents = {
  h1: ({ children }: any) => <p className="text-[15px] font-semibold text-[#1a1a2e] leading-snug mb-2 mt-1">{children}</p>,
  h2: ({ children }: any) => <p className="text-[14px] font-semibold text-[#1a1a2e] leading-snug mb-1.5 mt-2">{children}</p>,
  h3: ({ children }: any) => <p className="text-[14px] font-semibold text-[#1a1a2e] leading-snug mb-1 mt-1.5">{children}</p>,
  p: ({ children }: any) => <p className="text-[14px] text-[#333] leading-[1.7] mb-2">{children}</p>,
  strong: ({ children }: any) => <strong className="font-semibold text-[#1a1a2e]">{children}</strong>,
  em: ({ children }: any) => <em className="italic text-[#555]">{children}</em>,
  ul: ({ children }: any) => <ul className="list-disc pl-5 mb-2 space-y-1">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal pl-5 mb-2 space-y-1">{children}</ol>,
  li: ({ children }: any) => <li className="text-[14px] text-[#333] leading-[1.6] pl-0.5">{children}</li>,
  hr: () => <hr className="border-t border-[#e8e8e8] my-2" />,
  blockquote: ({ children }: any) => <blockquote className="border-l-2 border-[#1a1a2e] pl-3 my-2 text-[13px] text-[#555] italic">{children}</blockquote>,
};

const cardMdComponents = {
  h3: ({ children }: any) => <h3 className="text-[12px] font-semibold text-[#1a1a2e] leading-tight mb-1 mt-1.5">{children}</h3>,
  p: ({ children }: any) => <p className="text-[12px] text-[#444] leading-[1.6] mb-1">{children}</p>,
  strong: ({ children }: any) => <strong className="font-semibold text-[#1a1a2e]">{children}</strong>,
  em: ({ children }: any) => <em className="italic text-[#555]">{children}</em>,
  ul: ({ children }: any) => <ul className="list-disc list-outside pl-3.5 mb-1 space-y-0.5">{children}</ul>,
  ol: ({ children }: any) => <ol className="list-decimal list-outside pl-3.5 mb-1 space-y-0.5">{children}</ol>,
  li: ({ children }: any) => <li className="text-[12px] text-[#444] leading-[1.55]">{children}</li>,
  hr: () => <hr className="border-t border-[#e8e8e8] my-1.5" />,
  blockquote: ({ children }: any) => <blockquote className="border-l-2 border-[#1a1a2e] pl-2.5 my-1 text-[11px] text-[#555] italic">{children}</blockquote>,
};

function parseIntoCardSections(md: string): { title: string | null; intro: string; sections: { heading: string; body: string }[] } {
  const lines = md.split("\n");
  let title: string | null = null;
  let intro = "";
  const sections: { heading: string; body: string }[] = [];
  let currentHeading: string | null = null;
  let currentBody: string[] = [];

  for (const line of lines) {
    const h1Match = line.match(/^#\s+(.+)$/);
    const h2Match = line.match(/^##\s+(.+)$/);

    if (h1Match && !title && sections.length === 0) {
      title = h1Match[1].trim();
      continue;
    }

    if (h2Match) {
      if (currentHeading !== null) {
        sections.push({ heading: currentHeading, body: currentBody.join("\n").trim() });
      } else if (currentBody.length > 0) {
        intro = currentBody.join("\n").trim();
      }
      currentHeading = h2Match[1].trim();
      currentBody = [];
      continue;
    }

    currentBody.push(line);
  }

  if (currentHeading !== null) {
    sections.push({ heading: currentHeading, body: currentBody.join("\n").trim() });
  } else if (currentBody.length > 0) {
    if (!intro) {
      intro = currentBody.join("\n").trim();
    } else {
      intro += "\n" + currentBody.join("\n").trim();
    }
  }

  return { title, intro: intro.trim(), sections };
}

const sectionIcons: Record<string, React.ReactNode> = {
  default: <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><rect x="2" y="2" width="12" height="12" rx="2" stroke="#999" strokeWidth="1.2"/><path d="M5 6h6M5 8h4" stroke="#999" strokeWidth="1" strokeLinecap="round"/></svg>,
  score: <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="#999" strokeWidth="1.2"/><path d="M8 5v3l2 1.5" stroke="#999" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  recommendation: <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M8 3l1.5 3 3.5.5-2.5 2.5.5 3.5L8 11l-3 1.5.5-3.5L3 6.5l3.5-.5z" stroke="#999" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>,
  action: <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M4 8h8M8 4v8" stroke="#999" strokeWidth="1.2" strokeLinecap="round"/></svg>,
  risk: <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><path d="M8 3L2.5 13h11L8 3z" stroke="#999" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/><path d="M8 7v2.5" stroke="#999" strokeWidth="1.2" strokeLinecap="round"/><circle cx="8" cy="11" r="0.5" fill="#999"/></svg>,
  summary: <svg width="10" height="10" viewBox="0 0 16 16" fill="none"><rect x="3" y="2" width="10" height="12" rx="1.5" stroke="#999" strokeWidth="1.1"/><path d="M5.5 5h5M5.5 7.5h3.5M5.5 10h4.5" stroke="#999" strokeWidth="0.9" strokeLinecap="round"/></svg>,
};

function getSectionIcon(heading: string): React.ReactNode {
  const h = heading.toLowerCase();
  if (/score|index|ais|rating|grade/i.test(h)) return sectionIcons.score;
  if (/recommend|next|step|action|path|strategy|protocol/i.test(h)) return sectionIcons.recommendation;
  if (/add|open|build|improve|increase/i.test(h)) return sectionIcons.action;
  if (/risk|warn|alert|concern|negative|derog/i.test(h)) return sectionIcons.risk;
  if (/summary|overview|conclusion|result|finding/i.test(h)) return sectionIcons.summary;
  return sectionIcons.default;
}

function FormatResponse({ content }: { content: string }) {
  return (
    <div className="profundr-report" data-testid="format-response">
      <ReactMarkdown components={cardMdComponents}>{filterMarkdown(content)}</ReactMarkdown>
    </div>
  );
}

function StreamingText({ fullContent, onComplete, components }: { fullContent: string; onComplete: () => void; components: any }) {
  const [visibleText, setVisibleText] = useState("");
  const completedRef = useRef(false);

  useEffect(() => {
    completedRef.current = false;
    setVisibleText("");

    const tokens = fullContent.split(/(\s+)/);
    const totalTokens = tokens.length;
    if (totalTokens === 0) { onComplete(); return; }

    const baseDelay = totalTokens > 200 ? 10 : totalTokens > 100 ? 16 : 22;
    let idx = 0;
    let timeout: ReturnType<typeof setTimeout>;

    const revealNext = () => {
      if (idx >= totalTokens || completedRef.current) {
        completedRef.current = true;
        setVisibleText(fullContent);
        onComplete();
        return;
      }
      const chunk = Math.min(2 + Math.floor(Math.random() * 3), totalTokens - idx);
      idx += chunk;
      setVisibleText(tokens.slice(0, idx).join(""));

      const word = (tokens[idx - 1] || "").trim();
      const hasPunctuation = /[.!?—:;]$/.test(word);
      const isThinkPhrase = /^(let|hold|wait|actually|now|here's|alright|hmm|okay|give|before)/i.test(word);
      const hasNewline = /\n\n/.test(tokens.slice(Math.max(0, idx - 2), idx).join(""));

      let delay = baseDelay + Math.random() * 12;
      if (hasNewline) delay += 200 + Math.random() * 150;
      else if (isThinkPhrase) delay += 120 + Math.random() * 100;
      else if (hasPunctuation) delay += 60 + Math.random() * 80;

      timeout = setTimeout(revealNext, delay);
    };

    timeout = setTimeout(revealNext, 80);
    return () => { completedRef.current = true; clearTimeout(timeout); };
  }, [fullContent]);

  return (
    <>
      <ReactMarkdown components={components}>{filterMarkdown(visibleText)}</ReactMarkdown>
      {visibleText.length < fullContent.length && (
        <span className="inline-block w-[3px] h-[14px] bg-[#6366f1] rounded-sm ml-0.5 animate-pulse align-text-bottom" />
      )}
    </>
  );
}

function ChatPdfButton({ chatBubbleRef, msgId }: { chatBubbleRef: React.RefObject<HTMLDivElement | null>; msgId: number }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    const el = chatBubbleRef.current;
    if (!el) return;
    setDownloading(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const { jsPDF } = await import("jspdf");

      const clone = el.cloneNode(true) as HTMLElement;
      clone.style.cssText = `position:fixed;left:-9999px;top:0;width:${Math.min(el.offsetWidth, 600)}px;background:#ffffff;padding:16px;font-family:Inter,system-ui,-apple-system,sans-serif;`;
      document.body.appendChild(clone);

      const canvas = await html2canvas(clone, {
        scale: 2,
        backgroundColor: "#ffffff",
        useCORS: true,
        allowTaint: true,
        logging: false,
        width: clone.offsetWidth,
        height: clone.scrollHeight,
      });
      document.body.removeChild(clone);

      const imgData = canvas.toDataURL("image/png");
      const imgW = canvas.width;
      const imgH = canvas.height;

      const pdfW = 595.28;
      const margin = 24;
      const contentW = pdfW - margin * 2;
      const ratio = contentW / imgW;
      const contentH = imgH * ratio;
      const pdfH = Math.max(contentH + margin * 2 + 30, 300);

      const pdf = new jsPDF({ unit: "pt", format: [pdfW, pdfH] });
      pdf.addImage(imgData, "PNG", margin, margin, contentW, contentH);

      pdf.setFontSize(6);
      pdf.setTextColor(170, 170, 170);
      pdf.text("profundr.com", margin, pdfH - 10);
      const d = new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
      pdf.text(d, pdfW - margin - pdf.getTextWidth(d), pdfH - 10);

      const blob = pdf.output("blob");
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `profundr-response-${msgId}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      setTimeout(() => URL.revokeObjectURL(url), 500);
    } catch (err) {
      console.error("PDF generation error:", err);
    } finally {
      setDownloading(false);
    }
  };

  return (
    <div className="flex items-center justify-between mt-2 px-1">
      <div className="flex items-center gap-1.5">
        <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
          <path d="M12 2C9.5 2 7.5 4 7.5 6.5c0 .5-.4 1-1 1C4.5 7.5 3 9.5 3 11.5c0 1.5.8 2.8 2 3.5 0 0-.5 1.5-.5 2.5C4.5 20 6.5 22 9 22c1.5 0 2.5-.5 3-1.5.5 1 1.5 1.5 3 1.5 2.5 0 4.5-2 4.5-4.5 0-1-.5-2.5-.5-2.5 1.2-.7 2-2 2-3.5 0-2-1.5-4-3.5-4-.6 0-1-.5-1-1C16.5 4 14.5 2 12 2z" />
          <path d="M12 2v20" /><path d="M7.5 7.5C9 8.5 10 10 10.5 12" /><path d="M16.5 7.5C15 8.5 14 10 13.5 12" />
        </svg>
        <span className="text-[7px] text-[#ccc]">profundr.com</span>
      </div>
      <button
        onClick={handleDownload}
        disabled={downloading}
        className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-medium text-[#1a1a2e] hover:bg-[#f5f5f5] transition-colors disabled:opacity-40"
        data-testid={`button-download-chat-${msgId}`}
      >
        {downloading ? (
          <span className="text-[8px] text-[#999]">Generating...</span>
        ) : (
          <>
            <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M6 2v6M6 8L4 6M6 8l2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 9v1h8V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span>Save PDF</span>
          </>
        )}
      </button>
    </div>
  );
}

function deriveResponseTitle(question?: string): string | null {
  if (!question) return null;
  const q = question.replace(/\[Attached:.*?\]/g, "").trim();
  if (q.length < 8) return null;
  const actionPatterns = [
    { re: /(?:how|what|ways?|steps?|tips?|strategies?).*(?:improv|increas|rais|boost|fix|build|grow|get|start)/i, prefix: "" },
    { re: /(?:what|explain|tell|describe|break.*down|walk.*through)/i, prefix: "" },
    { re: /(?:how|can|should|do|does|is|are|will|when|where|why|which)/i, prefix: "" },
  ];
  const isQuestion = actionPatterns.some(p => p.re.test(q));
  if (!isQuestion && q.length < 20) return null;
  let title = q.replace(/[?.!]+$/, "").trim();
  if (title.length > 60) title = title.slice(0, 57) + "...";
  return title.charAt(0).toUpperCase() + title.slice(1);
}

function ChatBubbleWithPdf({ content, msgId, isCurrentlyStreaming, onStreamComplete, chatMdComponents, userQuestion }: {
  content: string; msgId: number; isCurrentlyStreaming: boolean; onStreamComplete: () => void; chatMdComponents: any; userQuestion?: string;
}) {
  const bubbleRef = useRef<HTMLDivElement>(null);

  return (
    <div className="overflow-hidden">
      <div ref={bubbleRef}>
        <div className="rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#252540] px-3.5 py-2 mb-2">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-60">
              <path d="M12 2C9.5 2 7.5 4 7.5 6.5c0 .5-.4 1-1 1C4.5 7.5 3 9.5 3 11.5c0 1.5.8 2.8 2 3.5 0 0-.5 1.5-.5 2.5C4.5 20 6.5 22 9 22c1.5 0 2.5-.5 3-1.5.5 1 1.5 1.5 3 1.5 2.5 0 4.5-2 4.5-4.5 0-1-.5-2.5-.5-2.5 1.2-.7 2-2 2-3.5 0-2-1.5-4-3.5-4-.6 0-1-.5-1-1C16.5 4 14.5 2 12 2z" />
              <path d="M12 2v20" /><path d="M7.5 7.5C9 8.5 10 10 10.5 12" /><path d="M16.5 7.5C15 8.5 14 10 13.5 12" />
            </svg>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] font-bold text-white leading-tight">Profundr</p>
              <p className="text-[8px] text-white/35 mt-0.5">Capital Intelligence</p>
            </div>
          </div>
        </div>
        <div className="text-[14px] text-[#1a1a1a] leading-[1.7]">
          {isCurrentlyStreaming ? (
            <StreamingText fullContent={content} onComplete={onStreamComplete} components={chatMdComponents} />
          ) : (
            <ReactMarkdown components={chatMdComponents}>{filterMarkdown(content)}</ReactMarkdown>
          )}
        </div>
      </div>
      {!isCurrentlyStreaming && <ChatPdfButton chatBubbleRef={bubbleRef} msgId={msgId} />}
    </div>
  );
}

function BrandedResponse({ content, userQuestion, msgId }: { content: string; userQuestion?: string; msgId: number }) {
  const reportRef = useRef<HTMLDivElement>(null);
  const [downloading, setDownloading] = useState(false);

  const handleDownloadPdf = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const cleaned = filterMarkdown(content);
      const res = await fetch("/api/report-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: cleaned, question: userQuestion || undefined }),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const data = await res.json();
      if (data.downloadUrl) {
        const pdfRes = await fetch(data.downloadUrl);
        if (!pdfRes.ok) throw new Error("Download failed");
        const blob = await pdfRes.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `profundr-report-${msgId}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    } catch (err) {
      console.error("PDF generation failed:", err);
    } finally {
      setDownloading(false);
    }
  };

  const markdown = filterMarkdown(content);
  const { title, intro, sections } = parseIntoCardSections(markdown);
  const hasCards = sections.length > 0;

  return (
    <div ref={reportRef} data-testid={`branded-response-${msgId}`} className="overflow-hidden">
      <div className="rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#252540] px-3.5 py-2.5 mb-2">
        <div className="flex items-center gap-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-60">
            <path d="M12 2C9.5 2 7.5 4 7.5 6.5c0 .5-.4 1-1 1C4.5 7.5 3 9.5 3 11.5c0 1.5.8 2.8 2 3.5 0 0-.5 1.5-.5 2.5C4.5 20 6.5 22 9 22c1.5 0 2.5-.5 3-1.5.5 1 1.5 1.5 3 1.5 2.5 0 4.5-2 4.5-4.5 0-1-.5-2.5-.5-2.5 1.2-.7 2-2 2-3.5 0-2-1.5-4-3.5-4-.6 0-1-.5-1-1C16.5 4 14.5 2 12 2z" />
            <path d="M12 2v20" /><path d="M7.5 7.5C9 8.5 10 10 10.5 12" /><path d="M16.5 7.5C15 8.5 14 10 13.5 12" />
          </svg>
          <div className="min-w-0 flex-1">
            {title ? (
              <>
                <p className="text-[13px] font-bold text-white leading-tight truncate">{title}</p>
                <p className="text-[8px] text-white/35 mt-0.5">Profundr Capital Intelligence</p>
              </>
            ) : (
              <>
                <p className="text-[11px] font-bold text-white leading-tight">Profundr</p>
                <p className="text-[8px] text-white/35 mt-0.5">Capital Intelligence</p>
              </>
            )}
          </div>
          {hasCards && <span className="text-[8px] text-white/25 flex-shrink-0" style={{ fontVariantNumeric: "tabular-nums" }}>{sections.length} sections</span>}
        </div>
      </div>

      {intro && (
        <div className="rounded-lg bg-[#fafafa] border border-[#eee] px-3 py-2.5 mb-1.5">
          <ReactMarkdown components={cardMdComponents}>{intro}</ReactMarkdown>
        </div>
      )}

      {hasCards ? (
        <div className="space-y-1.5">
          {sections.map((sec, si) => (
            <div key={si} className="rounded-lg border border-[#e8e8e8] overflow-hidden bg-white" data-testid={`response-card-${msgId}-${si}`}>
              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-[#fafafa] border-b border-[#f0f0f0]">
                <span className="flex-shrink-0 opacity-50">{getSectionIcon(sec.heading)}</span>
                <span className="text-[9px] font-bold text-[#1a1a2e] uppercase tracking-[0.08em] truncate">{sec.heading}</span>
                <span className="text-[7px] text-[#ccc] ml-auto flex-shrink-0" style={{ fontVariantNumeric: "tabular-nums" }}>{si + 1}/{sections.length}</span>
              </div>
              <div className="px-3 py-2">
                <ReactMarkdown components={cardMdComponents}>{sec.body}</ReactMarkdown>
              </div>
            </div>
          ))}
        </div>
      ) : !intro ? (
        <div className="rounded-lg bg-[#fafafa] border border-[#eee] px-3 py-2.5">
          <ReactMarkdown components={cardMdComponents}>{title ? markdown.replace(/^#\s+.+$/m, "").trim() : markdown}</ReactMarkdown>
        </div>
      ) : null}

      <div className="flex items-center justify-between mt-2 px-1">
        <div className="flex items-center gap-1.5">
          <svg width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="#ccc" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0">
            <path d="M12 2C9.5 2 7.5 4 7.5 6.5c0 .5-.4 1-1 1C4.5 7.5 3 9.5 3 11.5c0 1.5.8 2.8 2 3.5 0 0-.5 1.5-.5 2.5C4.5 20 6.5 22 9 22c1.5 0 2.5-.5 3-1.5.5 1 1.5 1.5 3 1.5 2.5 0 4.5-2 4.5-4.5 0-1-.5-2.5-.5-2.5 1.2-.7 2-2 2-3.5 0-2-1.5-4-3.5-4-.6 0-1-.5-1-1C16.5 4 14.5 2 12 2z" />
            <path d="M12 2v20" /><path d="M7.5 7.5C9 8.5 10 10 10.5 12" /><path d="M16.5 7.5C15 8.5 14 10 13.5 12" />
          </svg>
          <span className="text-[7px] text-[#ccc]">profundr.com</span>
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={downloading}
          className="flex items-center gap-1 px-2 py-0.5 rounded-md text-[9px] font-medium text-[#1a1a2e] hover:bg-[#f5f5f5] transition-colors disabled:opacity-40"
          data-testid={`button-download-report-${msgId}`}
        >
          {downloading ? (
            <span className="text-[8px] text-[#999]">Generating PDF...</span>
          ) : (
            <>
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M6 2v6M6 8L4 6M6 8l2-2" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /><path d="M2 9v1h8V9" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              <span>Save PDF</span>
            </>
          )}
        </button>
      </div>
    </div>
  );
}

function getApprovalSubtitle(index: number | null, band: string | null): string {
  if (index === null) return "";
  if (index >= 90) return "Your profile is optimized for institutional funding";
  if (index >= 80) return "Your profile is strong. A few tweaks can maximize approval odds";
  if (index >= 70) return "Almost ready for institutional funding. A few adjustments can help";
  if (index >= 55) return "Getting closer. Some key improvements will boost your chances";
  if (index >= 40) return "Your profile needs work before applying for funding";
  return "Focus on fixing negatives first — then build toward funding";
}

function getBandSubtitle(band: string | null): string {
  if (!band) return "";
  const b = band.toLowerCase();
  if (b === "exceptional") return "Lenders see your profile as premium. You qualify for top products";
  if (b === "strong") return "You can get approved for most credit products";
  if (b === "viable") return "You can qualify for select products with the right lender";
  if (b === "borderline") return "Some lenders may approve you with conditions";
  if (b === "weak") return "Start with secured cards or starter products to build up";
  return "Fix credit issues first, then work toward approvals";
}

function getPhaseSubtitle(phase: string | null): string {
  if (!phase) return "";
  const p = phase.toLowerCase();
  if (p.includes("funding")) return "You're ready — apply strategically for best results";
  if (p.includes("build")) return "Your foundation is forming — keep adding positive credit";
  if (p.includes("wait")) return "Timing is off right now — pause and let your profile stabilize";
  return "Clean up negatives before applying for anything new";
}

function getPillarTip(label: string, value: number): string | null {
  const l = label.toLowerCase();
  if (value >= 85) return null;
  if (l.includes("payment")) return value < 60 ? "Late payments are the biggest factor. Focus on keeping all accounts current" : "Keep paying on time every month to strengthen this";
  if (l.includes("utilization") || l.includes("usage")) return value < 60 ? "Your balances are too high relative to limits. Pay down to under 9% for best results" : "Try to keep balances between 1-9% of your credit limit";
  if (l.includes("age") || l.includes("history")) return "Account age improves with time. Avoid closing your oldest accounts";
  if (l.includes("mix") || l.includes("depth")) return "Lenders want to see a mix of credit types (revolving + installment)";
  if (l.includes("inquiry") || l.includes("velocity")) return "Too many recent applications hurt you. Avoid new credit checks for 90 days";
  if (l.includes("derog") || l.includes("negative")) return "Negative marks are pulling your score down. Dispute inaccurate items";
  return null;
}

function getSignalExplanation(label: string): string {
  const l = label.toLowerCase();
  if (l.includes("inquiry") || l.includes("velocity")) return "Lenders see many recent credit checks as a sign you may be seeking too much credit";
  if (l.includes("revolver") || l.includes("concentration")) return "Having too much balance on one card signals risk. Spread balances across accounts";
  if (l.includes("tradeline") || l.includes("depth")) return "Lenders prefer borrowers with a track record across multiple accounts";
  if (l.includes("limit") || l.includes("strength")) return "Higher credit limits show lenders trust you with more credit";
  if (l.includes("age") || l.includes("stability")) return "Longer credit history shows stability and experience managing credit";
  if (l.includes("clustering") || l.includes("new")) return "Opening several accounts at once can look risky to lenders";
  if (l.includes("symmetry") || l.includes("balance")) return "A mix of revolving and installment credit shows you can handle different types";
  return "";
}

function getSignalFix(label: string, level: "safe" | "caution" | "risk"): string | null {
  if (level === "safe") return null;
  const l = label.toLowerCase();
  if (l.includes("inquiry") || l.includes("velocity")) return "Avoid new applications for 90 days";
  if (l.includes("revolver") || l.includes("concentration")) return "Pay down highest-balance card first";
  if (l.includes("tradeline") || l.includes("depth")) return "Add 1 more credit account";
  if (l.includes("limit") || l.includes("strength")) return "Request credit limit increases";
  if (l.includes("age") || l.includes("stability")) return "Keep oldest accounts open";
  if (l.includes("clustering") || l.includes("new")) return "Wait before opening new accounts";
  if (l.includes("symmetry") || l.includes("balance")) return "Add 1 installment account";
  return null;
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
  if (t.includes("premium")) return "Extensive credit history with high limits and clean record";
  if (t.includes("seasoned")) return "Well-developed profile with years of credit experience";
  if (t.includes("established")) return "Solid foundation in place — optimize for top approvals";
  if (t.includes("starter")) return "Growing profile — keep adding positive accounts";
  if (t.includes("thin")) return "Limited credit history — focus on building more accounts";
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
        <p className="text-[10px] text-[#999] tracking-[0.01em] font-medium">Your Financial Profile</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {data.profileType && (
          <div data-testid="fi-profile-type">
            <p className="text-[9px] text-[#bbb] font-medium mb-0.5">Profile Classification</p>
            <p className="text-[15px] font-bold tracking-[-0.02em]" style={{ color: ptColor }}>{data.profileType}</p>
            <p className="text-[9px] text-[#999] mt-0.5">{getProfileTypeSubtitle(data.profileType)}</p>
          </div>
        )}

        {data.identityStrength !== null && (
          <div data-testid="fi-identity-strength">
            <p className="text-[9px] text-[#bbb] font-medium mb-0.5">How Strong Your Profile Looks</p>
            <div className="flex items-baseline gap-1">
              <span className="text-[22px] font-bold leading-none" style={{ color: getIdentityStrengthColor(data.identityStrength) }}>{data.identityStrength}</span>
              <span className="text-[11px] text-[#ccc]">/100</span>
            </div>
            <div className="mt-1.5 w-full h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${data.identityStrength}%`, backgroundColor: getIdentityStrengthColor(data.identityStrength) }} />
            </div>
            <p className="text-[8px] text-[#aaa] mt-1">{data.identityStrength >= 80 ? "Lenders view this profile favorably" : data.identityStrength >= 60 ? "Solid foundation with room to grow" : "Needs improvement before applying"}</p>
          </div>
        )}

        {data.creditAge && (
          <div data-testid="fi-credit-age">
            <p className="text-[9px] text-[#bbb] font-medium mb-0.5">How Long You've Had Credit</p>
            <p className="text-[12px] text-[#333] font-medium leading-snug">{data.creditAge}</p>
          </div>
        )}

        {data.exposureLevel && (
          <div data-testid="fi-exposure-level">
            <p className="text-[9px] text-[#bbb] font-medium mb-0.5">Total Debt Exposure</p>
            <p className="text-[12px] text-[#333] font-medium leading-snug">{data.exposureLevel}</p>
          </div>
        )}

        {data.bureauFootprint && (
          <div data-testid="fi-bureau-footprint">
            <p className="text-[9px] text-[#bbb] font-medium mb-0.5">Bureau Presence</p>
            <p className="text-[12px] text-[#333] font-medium leading-snug">{data.bureauFootprint}</p>
          </div>
        )}
      </div>

      {data.lenderPerception && (
        <div className="mt-3 pt-3 border-t border-[#f0f0f0]" data-testid="fi-lender-perception">
          <p className="text-[9px] text-[#bbb] font-medium mb-1">How Lenders View You</p>
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
          <p className="text-[10px] text-[#999] tracking-[0.01em] font-medium">Estimated Funding Range</p>
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
                <p className="text-[9px] text-[#aaa] mt-1">This is the maximum lenders may approve based on your profile</p>
              </div>
            )}

            {data.perBureauProjection && (
              <div className="min-w-0" data-testid="pf-projected-amount">
                <p className="text-[9px] text-[#bbb] font-medium mb-0.5">{bureauLabel} Projection</p>
                <p className="text-[14px] font-bold tracking-[-0.02em] text-[#333] truncate">{data.perBureauProjection}</p>
                <p className="text-[9px] text-[#aaa] mt-1">Average starting limits lenders may approve</p>
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
  const dashboardRef = useRef<HTMLDivElement>(null);

  const handleDownloadReport = async () => {
    if (!dashboardRef.current || downloadingReport) return;
    setDownloadingReport(true);
    try {
      const html2canvas = (await import("html2canvas")).default;
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });

      const wrapper = document.createElement("div");
      wrapper.style.cssText = "position:fixed;left:-9999px;top:0;width:816px;background:#fff;font-family:Inter,system-ui,sans-serif;padding:52px 60px 40px;";

      const header = document.createElement("div");
      header.innerHTML = `<div style="display:flex;align-items:flex-end;justify-content:space-between;padding-bottom:16px;margin-bottom:24px;border-bottom:2px solid #1a1a2e;">
        <div><div style="font-size:20px;font-weight:700;color:#1a1a2e;letter-spacing:-0.02em;">PROFUNDR</div>
        <div style="font-size:9px;color:#999;letter-spacing:0.1em;text-transform:uppercase;margin-top:3px;">Analysis Report</div></div>
        <div style="text-align:right;"><div style="font-size:10px;color:#555;font-weight:500;">${userName || "User"}</div>
        <div style="font-size:9px;color:#aaa;">${dateStr}</div></div></div>`;
      wrapper.appendChild(header);

      const clone = dashboardRef.current.cloneNode(true) as HTMLElement;
      clone.style.cssText = "width:100%;";
      wrapper.appendChild(clone);

      const footer = document.createElement("div");
      footer.innerHTML = `<div style="border-top:1px solid #e0e0e0;margin-top:28px;padding-top:14px;display:flex;align-items:center;justify-content:space-between;">
        <div style="font-size:8px;color:#bbb;letter-spacing:0.06em;text-transform:uppercase;">Profundr &middot; Confidential</div>
        <div style="font-size:8px;color:#bbb;">profundr.com &middot; ${dateStr}</div></div>`;
      wrapper.appendChild(footer);

      document.body.appendChild(wrapper);

      const canvas = await html2canvas(wrapper, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
      document.body.removeChild(wrapper);

      canvas.toBlob((blob) => {
        if (!blob) return;
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `profundr-analysis-${now.toISOString().slice(0, 10)}.jpg`;
        a.click();
        URL.revokeObjectURL(url);
      }, "image/jpeg", 0.95);
    } catch (e) {
      console.error("Failed to download analysis report:", e);
      alert("Failed to generate report. Please try again.");
    } finally {
      setDownloadingReport(false);
    }
  };

  return (
    <div ref={dashboardRef} className={`w-full ${compact ? 'mt-0' : 'mt-4'} space-y-2.5`} data-testid="mission-dashboard-inline">
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
          {downloadingReport ? "Generating..." : "Save Image"}
        </button>
      </div>
      <div className={`grid ${compact ? 'grid-cols-2' : 'grid-cols-1 sm:grid-cols-3'} gap-2`}>
        {data.approvalIndex !== null && (
          <div className={`rounded-xl bg-gradient-to-br from-[#1a1a1a] to-[#2a2a2a] p-5 shadow-lg ${compact ? 'col-span-2' : 'col-span-1 sm:col-span-3'}`} data-testid="card-approval-index">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <span className="text-[11px] font-bold tracking-[0.15em] text-white/50 uppercase">Capital Readiness</span>
              </div>
              {data.bureauSource && (
                <span className="text-[9px] font-bold uppercase tracking-widest px-2 py-1 rounded-full bg-white/10 text-white/60" data-testid="text-ais-bureau">{data.bureauSource}</span>
              )}
            </div>
            <div className="flex items-baseline gap-2">
              <span className="text-[56px] font-bold leading-none tracking-tighter text-white" data-testid="text-approval-score">
                {data.approvalIndex}
              </span>
              <span className="text-[18px] text-white/30 font-light">/ 100</span>
            </div>
            <p className="text-[12px] text-white/60 mt-2 leading-snug font-medium">{getApprovalSubtitle(data.approvalIndex, data.band)}</p>
            <div className="mt-3 w-full h-2 bg-white/10 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${data.approvalIndex}%`, backgroundColor: bandColor }} />
            </div>
            {data.approvalIndex < 88 && (
              <p className="text-[10px] text-white/40 mt-2">Next target: <span className="text-white/70 font-semibold">{data.approvalIndex < 70 ? "70+" : data.approvalIndex < 78 ? "78+" : data.approvalIndex < 82 ? "82+" : "88+"}</span></p>
            )}
          </div>
        )}

        {data.band && (
          <div className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm" data-testid="card-band">
            <p className="text-[10px] text-[#999] tracking-[0.01em] font-medium mb-1">Your Approval Tier</p>
            <p className="text-[20px] font-bold tracking-[-0.02em]" style={{ color: bandColor }} data-testid="text-band">
              {data.band}
            </p>
            <p className="text-[10px] text-[#666] mt-1.5 leading-[1.5]">{getBandSubtitle(data.band)}</p>
          </div>
        )}

        {data.phase && (
          <div className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm" data-testid="card-phase">
            <p className="text-[10px] text-[#999] tracking-[0.01em] font-medium mb-1">Where You Are Now</p>
            <p className="text-[18px] font-bold tracking-[-0.02em]" style={{ color: phaseColor }} data-testid="text-phase">
              {data.phase}
            </p>
            <p className="text-[10px] text-[#666] mt-1.5 leading-[1.5]">{getPhaseSubtitle(data.phase)}</p>
          </div>
        )}

        {data.projectedFunding && (
          <ProjectedFundingCard data={data.projectedFunding} phase={data.phase} compact={compact} />
        )}
      </div>

      {data.pillarScores.length > 0 && (
        <div className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm" data-testid="card-pillar-scores">
          <p className="text-[10px] text-[#999] tracking-[0.01em] font-medium mb-0.5">Profile Scores</p>
          <p className="text-[9px] text-[#bbb] mb-3">Each area impacts how lenders evaluate your application</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-4 gap-y-3">
            {data.pillarScores.map((pillar) => {
              const color = getPillarColor(pillar.value);
              const tip = getPillarTip(pillar.label, pillar.value);
              return (
                <div key={pillar.label} data-testid={`pillar-${pillar.label.toLowerCase().replace(/\s+/g, "-")}`}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] text-[#666] font-medium">{pillar.label}</span>
                    <span className="text-[11px] font-bold" style={{ color }}>{pillar.value}</span>
                  </div>
                  <div className="w-full h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden">
                    <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${pillar.value}%`, backgroundColor: color }} />
                  </div>
                  {tip && <p className="text-[8px] text-[#999] mt-1 leading-[1.4]">{tip}</p>}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {data.financialIdentity && (
        <FinancialIdentityCard data={data.financialIdentity} />
      )}

      {data.bestNextMove && (
        <div className="rounded-xl bg-gradient-to-r from-[#f8f9fb] to-[#f0f2f8] border border-[#e0e4ee] p-4 shadow-sm" data-testid="card-best-next-move">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-5 h-5 rounded-md bg-[#1a1a2e] flex items-center justify-center shrink-0">
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M5 1v8M1 5l4 4 4-4" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
            </div>
            <p className="text-[10px] text-[#1a1a2e] tracking-[0.01em] font-bold uppercase">Next Best Action</p>
          </div>
          <p className="text-[12px] text-[#333] leading-[1.6] font-medium">{data.bestNextMove}</p>
        </div>
      )}

      {data.suppressors.length > 0 && (
        <div className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm" data-testid="card-suppressors">
          <p className="text-[10px] text-[#999] tracking-[0.01em] font-medium mb-1">Issues Affecting Your Approval</p>
          <p className="text-[9px] text-[#bbb] mb-2.5">Fix these to increase your chances</p>
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

      {data.helping.length > 0 && (
        <div className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm" data-testid="card-helping">
          <p className="text-[10px] text-[#999] tracking-[0.01em] font-medium mb-1">Positive Signals</p>
          <p className="text-[9px] text-[#bbb] mb-2">These areas are helping your profile</p>
          <div className="space-y-1.5">
            {data.helping.map((h, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-md bg-[#e8f5e9] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px] text-[#2d6a4f] font-bold">✓</span>
                </div>
                <p className="text-[11px] text-[#555] leading-[1.5]">{h}</p>
              </div>
            ))}
          </div>
        </div>
      )}

      {data.hurting.length > 0 && (
        <div className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm" data-testid="card-hurting">
          <p className="text-[10px] text-[#999] tracking-[0.01em] font-medium mb-1">Risk Signals</p>
          <p className="text-[9px] text-[#bbb] mb-2">These patterns are things lenders watch closely</p>
          <div className="space-y-1.5">
            {data.hurting.map((h, i) => (
              <div key={i} className="flex items-start gap-2">
                <div className="w-4 h-4 rounded-md bg-[#fce4ec] flex items-center justify-center shrink-0 mt-0.5">
                  <span className="text-[9px] text-[#c0392b] font-bold">!</span>
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

function DisputeDownloadButton({ disputes, onSave, userProfile, savedDocs }: { disputes: DisputeItem[]; onSave?: (disputes: DisputeItem[]) => void; userProfile?: UserProfile; savedDocs?: SavedDoc[] }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    setDownloading(true);
    try {
      const attachmentPages: { type: string; dataUrl: string; name: string }[] = [];
      if (savedDocs) {
        for (const doc of savedDocs) {
          if ((doc.type === "id_document" || doc.type === "proof_of_residency" || doc.type === "bank_statement" || doc.type === "credit_report") && doc.fileDataUrl) {
            attachmentPages.push({ type: doc.type, dataUrl: doc.fileDataUrl, name: doc.name });
          }
        }
      }
      const payload: any = { disputes, attachmentPages };
      if (userProfile?.fullName) payload.userName = userProfile.fullName;
      if (userProfile?.address) payload.userAddress = userProfile.address;
      if (userProfile?.ssn4) payload.ssnLast4 = userProfile.ssn4;
      if (userProfile?.dob) payload.dob = userProfile.dob;

      const res = await fetch("/api/dispute-letters", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
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
        a.download = "profundr-dispute-package.pdf";
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
      {downloading ? "Generating Package..." : `Download Dispute Package (PDF)`}
    </button>
  );
}

interface SavedDoc {
  id: string;
  name: string;
  type: "dispute_letter" | "credit_report" | "id_document" | "bank_statement" | "proof_of_residency" | "other";
  savedAt: number;
  fileDataUrl?: string;
  disputes?: DisputeItem[];
  extractedSummary?: string;
  extractedText?: string;
}

interface UserProfile {
  fullName?: string;
  address?: string;
  ssn4?: string;
  dob?: string;
  phone?: string;
  email?: string;
}

interface TruthProfile {
  fullName: string;
  nameVariants: string[];
  dob: string;
  currentAddress: string;
  previousAddresses: string[];
  ssnLast4: string;
  phones: string[];
  emails: string[];
  sourcesUsed: Record<string, string[]>;
}

interface DiscrepancyItem {
  field: string;
  creditReportValue: string;
  documentValue: string | null;
  severity: "Low" | "Med" | "High";
  disputeBasis: string;
  recommendedAction: string;
}

interface NegativeItemEntry {
  itemId: string;
  bureau: string;
  category: "Personal Info" | "Account" | "Inquiry" | "Duplicate" | "Public Record";
  furnisherName: string;
  accountPartial: string | null;
  dates: { opened?: string | null; reported?: string | null; delinquency?: string | null; inquiryDate?: string | null };
  issue: string;
  disputeBasis: string;
  evidenceAvailable: string[];
  evidenceMissing: string[];
  letterType: string;
  attestationRequired: boolean;
  status: "New" | "Attested" | "Packaged" | "Sent" | "Resolved";
  standaloneInquiry: boolean;
  userAttestation?: "recognized" | "not_authorized" | null;
  disputeRound: number;
}

interface RepairData {
  truthProfile: TruthProfile | null;
  discrepancies: DiscrepancyItem[];
  negativeItems: NegativeItemEntry[];
  parsedAt: number;
}

function parseRepairData(content: string): RepairData | null {
  const startTag = "REPAIR_DATA_START";
  const endTag = "REPAIR_DATA_END";
  const startIdx = content.indexOf(startTag);
  if (startIdx === -1) return null;
  const endIdx = content.indexOf(endTag);
  let jsonStr: string;
  if (endIdx !== -1 && endIdx > startIdx) {
    jsonStr = content.substring(startIdx + startTag.length, endIdx).trim();
  } else {
    jsonStr = content.substring(startIdx + startTag.length).trim();
  }
  const tryParse = (s: string): any => {
    try { return JSON.parse(s); } catch { return null; }
  };
  let parsed = tryParse(jsonStr);
  if (!parsed) {
    let fixed = jsonStr;
    const openBraces = (fixed.match(/\{/g) || []).length;
    const closeBraces = (fixed.match(/\}/g) || []).length;
    const openBrackets = (fixed.match(/\[/g) || []).length;
    const closeBrackets = (fixed.match(/\]/g) || []).length;
    for (let i = 0; i < openBrackets - closeBrackets; i++) fixed += "]";
    for (let i = 0; i < openBraces - closeBraces; i++) fixed += "}";
    fixed = fixed.replace(/,\s*([\]}])/g, "$1");
    fixed = fixed.replace(/,\s*$/gm, "");
    parsed = tryParse(fixed);
    if (!parsed) {
      const lastComplete = fixed.lastIndexOf("},");
      if (lastComplete > 0) {
        const trimmed = fixed.substring(0, lastComplete + 1);
        let rFixed = trimmed;
        const ob2 = (rFixed.match(/\[/g) || []).length;
        const cb2 = (rFixed.match(/\]/g) || []).length;
        const ob3 = (rFixed.match(/\{/g) || []).length;
        const cb3 = (rFixed.match(/\}/g) || []).length;
        for (let i = 0; i < ob2 - cb2; i++) rFixed += "]";
        for (let i = 0; i < ob3 - cb3; i++) rFixed += "}";
        parsed = tryParse(rFixed);
      }
    }
    if (parsed) console.log("REPAIR_DATA recovered from truncated JSON");
  }
  if (!parsed) {
    console.warn("Failed to parse REPAIR_DATA — JSON could not be recovered");
    return null;
  }
  return {
    truthProfile: parsed.truthProfile || null,
    discrepancies: Array.isArray(parsed.discrepancies) ? parsed.discrepancies : [],
    negativeItems: Array.isArray(parsed.negativeItems) ? parsed.negativeItems.map((item: any) => ({
      ...item,
      itemId: item.itemId || `auto-${(item.furnisherName || "").replace(/\s+/g, "").slice(0, 10)}-${(item.bureau || "").slice(0, 3)}-${(item.dates?.inquiryDate || item.dates?.opened || "").replace(/\//g, "")}`,
      status: item.status || "New",
      userAttestation: null,
      disputeRound: item.disputeRound || 1,
      category: item.category || "Account",
      standaloneInquiry: item.standaloneInquiry || false,
      attestationRequired: item.attestationRequired !== false,
      evidenceAvailable: Array.isArray(item.evidenceAvailable) ? item.evidenceAvailable : [],
      evidenceMissing: Array.isArray(item.evidenceMissing) ? item.evidenceMissing : [],
    })).filter((item: any) => item.furnisherName) : [],
    parsedAt: Date.now(),
  };
}

function loadRepairData(): RepairData | null {
  try {
    const raw = localStorage.getItem("profundr_repair_data");
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function saveRepairData(data: RepairData) {
  try { localStorage.setItem("profundr_repair_data", JSON.stringify(data)); } catch {}
}

function filterRepairDataFromContent(content: string): string {
  let filtered = content.replace(/REPAIR_DATA_START[\s\S]*?REPAIR_DATA_END/g, "");
  if (filtered.includes("REPAIR_DATA_START")) {
    filtered = filtered.replace(/REPAIR_DATA_START[\s\S]*/g, "");
  }
  return filtered.replace(/STRATEGY_DATA_START[\s\S]*?STRATEGY_DATA_END/g, "").trim();
}

function loadUserProfile(): UserProfile {
  try {
    const raw = localStorage.getItem("profundr_user_profile");
    return raw ? JSON.parse(raw) : {};
  } catch { return {}; }
}

function saveUserProfile(profile: UserProfile) {
  try { localStorage.setItem("profundr_user_profile", JSON.stringify(profile)); } catch {}
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

function CapitalSimulator({ aisReport }: { aisReport: MissionData }) {
  const tradelines = aisReport.openTradelines || [];
  const revCards = tradelines.filter(t => /revolv|credit\s*card|loc\b|heloc/i.test(t.type) && /primary/i.test(t.ownership));
  const instCards = tradelines.filter(t => /install|auto|student|mortgage|personal\s*loan/i.test(t.type) && /primary/i.test(t.ownership));
  const limits = revCards.map(t => parseInt(t.limit.replace(/[^0-9]/g, ""))).filter(n => !isNaN(n) && n > 0);
  const balances = revCards.map(t => parseInt(t.balance.replace(/[^0-9]/g, ""))).filter(n => !isNaN(n));
  const totalLimit = limits.reduce((a, b) => a + b, 0);
  const totalBal = balances.reduce((a, b) => a + b, 0);
  const baseUtil = totalLimit > 0 ? Math.round((totalBal / totalLimit) * 100) : 30;
  const slotsAvail = aisReport.projectedFunding?.inquirySlots ? parseInt(aisReport.projectedFunding.inquirySlots.replace(/[^0-9]/g, "") || "0") : 2;
  const baseInq = Math.max(0, 5 - slotsAvail);
  const baseRev = revCards.length;
  const baseAge = (() => { const ages = tradelines.map(t => { const m = t.age.match(/(\d+)\s*yr/i); return m ? parseInt(m[1]) : 0; }); return ages.length > 0 ? Math.round(ages.reduce((a, b) => a + b, 0) / ages.length) : 2; })();
  const highestLim = limits.length > 0 ? Math.max(...limits) : 5000;

  const [simUtil, setSimUtil] = useState(baseUtil);
  const [simInqRemove, setSimInqRemove] = useState(0);
  const [simAddTradelines, setSimAddTradelines] = useState(0);
  const [simAgeBoost, setSimAgeBoost] = useState(0);

  const calcOdds = (util: number, inqRem: number, addTl: number, ageBst: number) => {
    let odds = aisReport.strategyData?.currentOdds || (aisReport.approvalIndex || 50) * 0.7;
    const utilDelta = baseUtil - util;
    if (utilDelta > 0) odds += utilDelta * 0.5;
    odds += inqRem * 4;
    odds += addTl * 3;
    odds += ageBst * 2;
    return Math.min(95, Math.max(5, Math.round(odds)));
  };

  const calcFunding = (util: number, inqRem: number, addTl: number, ageBst: number) => {
    let mult = 1.0;
    const utilDelta = baseUtil - util;
    if (utilDelta > 0) mult += utilDelta * 0.01;
    mult += inqRem * 0.05;
    mult += addTl * 0.08;
    mult += ageBst * 0.03;
    const low = Math.round(highestLim * 0.6 * mult);
    const high = Math.round(highestLim * 1.2 * mult);
    return `$${low.toLocaleString()} – $${high.toLocaleString()}`;
  };

  const currentOdds = calcOdds(baseUtil, 0, 0, 0);
  const newOdds = calcOdds(simUtil, simInqRemove, simAddTradelines, simAgeBoost);
  const currentFunding = calcFunding(baseUtil, 0, 0, 0);
  const newFunding = calcFunding(simUtil, simInqRemove, simAddTradelines, simAgeBoost);
  const hasChanges = simUtil !== baseUtil || simInqRemove > 0 || simAddTradelines > 0 || simAgeBoost > 0;

  return (
    <div className="rounded-xl border border-[#e8e8e8] bg-white p-3" data-testid="capital-simulator">
      <div className="flex items-center gap-2 mb-1.5">
        <div className="w-5 h-5 rounded-md bg-[#1a1a2e] flex items-center justify-center shrink-0">
          <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M2 8V5M5 8V3M8 8V1" stroke="white" strokeWidth="1.2" strokeLinecap="round"/></svg>
        </div>
        <p className="text-[9px] text-[#333] font-bold uppercase tracking-[0.08em]">Capital Simulator</p>
      </div>
      <p className="text-[8px] text-[#999] mb-3">Adjust the sliders to see how changes affect your approval chances</p>

      <div className="space-y-3 mb-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[8px] text-[#555] font-medium">Lower utilization to</span>
            <span className="text-[9px] font-bold text-[#333]" style={{ fontVariantNumeric: "tabular-nums" }}>{simUtil}%</span>
          </div>
          <input type="range" min="1" max={Math.max(baseUtil, 50)} value={simUtil} onChange={(e) => setSimUtil(parseInt(e.target.value))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #2d6a4f ${((simUtil - 1) / (Math.max(baseUtil, 50) - 1)) * 100}%, #eee ${((simUtil - 1) / (Math.max(baseUtil, 50) - 1)) * 100}%)` }} data-testid="slider-utilization" />
          <div className="flex justify-between text-[6px] text-[#bbb] mt-0.5">
            <span>1%</span>
            <span>Current: {baseUtil}%</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[8px] text-[#555] font-medium">Remove inquiries</span>
            <span className="text-[9px] font-bold text-[#333]" style={{ fontVariantNumeric: "tabular-nums" }}>{simInqRemove}</span>
          </div>
          <input type="range" min="0" max={Math.max(baseInq, 6)} value={simInqRemove} onChange={(e) => setSimInqRemove(parseInt(e.target.value))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #2d6a4f ${(simInqRemove / Math.max(baseInq, 6)) * 100}%, #eee ${(simInqRemove / Math.max(baseInq, 6)) * 100}%)` }} data-testid="slider-inquiries" />
          <div className="flex justify-between text-[6px] text-[#bbb] mt-0.5">
            <span>0</span>
            <span>Current: {baseInq} inquiries</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[8px] text-[#555] font-medium">Add new credit accounts</span>
            <span className="text-[9px] font-bold text-[#333]" style={{ fontVariantNumeric: "tabular-nums" }}>+{simAddTradelines}</span>
          </div>
          <input type="range" min="0" max="5" value={simAddTradelines} onChange={(e) => setSimAddTradelines(parseInt(e.target.value))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #2d6a4f ${(simAddTradelines / 5) * 100}%, #eee ${(simAddTradelines / 5) * 100}%)` }} data-testid="slider-tradelines" />
          <div className="flex justify-between text-[6px] text-[#bbb] mt-0.5">
            <span>0</span>
            <span>Current: {baseRev} revolving + {instCards.length} installment</span>
          </div>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[8px] text-[#555] font-medium">Add months of age</span>
            <span className="text-[9px] font-bold text-[#333]" style={{ fontVariantNumeric: "tabular-nums" }}>+{simAgeBoost * 6} months</span>
          </div>
          <input type="range" min="0" max="4" value={simAgeBoost} onChange={(e) => setSimAgeBoost(parseInt(e.target.value))} className="w-full h-1.5 rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #2d6a4f ${(simAgeBoost / 4) * 100}%, #eee ${(simAgeBoost / 4) * 100}%)` }} data-testid="slider-age" />
          <div className="flex justify-between text-[6px] text-[#bbb] mt-0.5">
            <span>0</span>
            <span>Current avg: {baseAge} years</span>
          </div>
        </div>
      </div>

      <div className={`rounded-lg border p-2.5 transition-all ${hasChanges ? "bg-gradient-to-r from-[#f0f2f8] to-[#e8f5e9] border-[#c8e6c9]" : "bg-[#fafafa] border-[#eee]"}`}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[7px] text-[#999] font-medium mb-0.5">Approval Odds</p>
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] font-bold" style={{ color: hasChanges && newOdds > currentOdds ? "#2d6a4f" : "#333", fontVariantNumeric: "tabular-nums" }}>{hasChanges ? newOdds : currentOdds}%</span>
              {hasChanges && newOdds !== currentOdds && (
                <span className="text-[8px] font-semibold text-[#2d6a4f]">+{newOdds - currentOdds}%</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-[7px] text-[#999] font-medium mb-0.5">Estimated Funding</p>
            <p className="text-[10px] font-bold" style={{ color: hasChanges ? "#2d6a4f" : "#333", fontVariantNumeric: "tabular-nums" }}>{hasChanges ? newFunding : currentFunding}</p>
          </div>
        </div>
      </div>

      {hasChanges && (
        <button onClick={() => { setSimUtil(baseUtil); setSimInqRemove(0); setSimAddTradelines(0); setSimAgeBoost(0); }} className="mt-2 text-[7px] text-[#999] hover:text-[#555] transition-colors" data-testid="button-reset-simulator">
          Reset to current profile
        </button>
      )}
    </div>
  );
}

function PerfectProfileTab({ aisReport }: { aisReport: MissionData | null }) {
  const [expandedSection, setExpandedSection] = useState<string | null>("revolving");
  if (!aisReport || !hasAnalysisData(aisReport)) {
    return null;
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
      { label: "Limit", ideal: "$5,000+", actual: tl.limit, met: !isNaN(limitNum) && limitNum >= 5000 },
      { label: "Balance", ideal: "< 10% of limit", actual: utilizationForCard !== null ? `${utilizationForCard}%` : tl.balance, met: utilizationForCard !== null ? utilizationForCard <= 9 : false },
      { label: "Age", ideal: "3+ years", actual: tl.age, met: ageYears >= 3 },
      { label: "Status", ideal: "Current", actual: isClosed_ ? "Closed" : tl.paymentStatus, met: isClosed_ ? !/late|delinq|collection|charge/i.test(tl.paymentStatus) : isCurrent(tl.paymentStatus) },
      { label: "Ownership", ideal: "Primary", actual: isAU ? "Authorized User" : isPrimary ? "Primary" : tl.ownership, met: isPrimary },
    ] : [
      { label: "Amount", ideal: "$5,000+", actual: tl.limit, met: !isNaN(limitNum) && limitNum >= 5000 },
      { label: "Balance", ideal: "$0", actual: tl.balance, met: !isNaN(balNum) && balNum === 0 },
      { label: "Age", ideal: "3+ years", actual: tl.age, met: ageYears >= 3 },
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

  const idealRevSlots = 4;
  const idealInstSlots = 1;
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
    { label: "Limit", ideal: "$5,000+" },
    { label: "Balance", ideal: "< 10% of limit" },
    { label: "Age", ideal: "3+ years" },
    { label: "Status", ideal: "Current" },
    { label: "Ownership", ideal: "Primary" },
  ];
  const emptyInstSlotRows = [
    { label: "Amount", ideal: "$5,000+" },
    { label: "Balance", ideal: "$0" },
    { label: "Age", ideal: "3+ years" },
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
    <div className="space-y-2 mt-2" data-testid="perfect-profile-tab">
      <div className="rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#252540] p-2">
        <div className="flex items-center gap-2">
          <div className="relative w-[32px] h-[32px] flex-shrink-0">
            <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
              <circle cx="18" cy="18" r="15.5" fill="none" stroke={accentColor} strokeWidth="3" strokeDasharray={`${pct * 0.974} 100`} strokeLinecap="round" />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-[10px] font-bold text-white leading-none" style={{ fontVariantNumeric: "tabular-nums" }}>{pct}%</span>
            </div>
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-[7px] uppercase tracking-[0.1em] text-white/35 font-semibold">Fundability Benchmarks</p>
            <div className="flex items-baseline gap-2">
              <p className="text-[11px] font-bold text-white leading-tight" style={{ fontVariantNumeric: "tabular-nums" }}>{metCriteria} <span className="text-[9px] font-normal text-white/40">/ {totalCriteria}</span></p>
              <p className="text-[7px] text-white/25" style={{ fontVariantNumeric: "tabular-nums" }}>{filledSlots}/{totalSlots} slots</p>
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-md bg-[#f8f8f8] border border-[#eee] px-2 py-1.5">
        <p className="text-[7px] font-semibold text-[#555] uppercase tracking-[0.1em] mb-1">What Lenders Want to See</p>
        <div className="grid grid-cols-3 gap-x-2 gap-y-[2px]">
          {["3–5 Credit Cards", "$5K–$15K Limits", "$25K+ Total Credit", "1–9% Balance Usage", "3+ Year History", "100% On-Time Payments", "Primary Accounts", "0–2 Recent Inquiries", "1–2 Loan Accounts"].map((b, i) => (
            <div key={i} className="flex items-center gap-1">
              <div className="w-[6px] h-[6px] rounded-[1px] bg-[#1a1a2e] flex items-center justify-center flex-shrink-0">
                <svg width="4" height="4" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <span className="text-[6.5px] text-[#666] leading-tight">{b}</span>
            </div>
          ))}
        </div>
      </div>

      <div>
        <p className="text-[8px] uppercase tracking-[0.12em] text-[#999] font-semibold mb-1 px-0.5">Your Credit Cards</p>
        <div className="space-y-1">
          {primaryRevCards.map((card, i) => renderCard(card, i))}
          {emptyRevCount > 0 && Array.from({ length: emptyRevCount }).map((_, i) => renderEmptySlot("Revolving Card", filledPrimaryRevSlots + i, emptyRevSlotRows))}
        </div>
      </div>

      {auCards.length > 0 && (
        <div>
          <p className="text-[8px] uppercase tracking-[0.12em] text-[#999] font-semibold mb-1 px-0.5">Authorized User Cards <span className="normal-case tracking-normal font-normal text-[7px] text-[#bbb]">(added to someone else's account — doesn't count toward your slots)</span></p>
          <div className="space-y-1">
            {auCards.map((card, i) => renderCard(card, primaryRevCards.length + i))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[8px] uppercase tracking-[0.12em] text-[#999] font-semibold mb-1 px-0.5">Your Loans</p>
        <div className="space-y-1">
          {primaryInstCards.map((card, i) => renderCard(card, primaryRevCards.length + auCards.length + i))}
          {emptyInstCount > 0 && Array.from({ length: emptyInstCount }).map((_, i) => renderEmptySlot("Installment Loan", filledPrimaryInstSlots + i, emptyInstSlotRows))}
        </div>
      </div>

      {(otherCards.length > 0 || nonPrimaryInstCards.length > 0) && (
        <div>
          <p className="text-[8px] uppercase tracking-[0.12em] text-[#999] font-semibold mb-1 px-0.5">Other Accounts</p>
          <div className="space-y-1">
            {[...nonPrimaryInstCards, ...otherCards].map((card, i) => renderCard(card, primaryRevCards.length + auCards.length + primaryInstCards.length + i))}
          </div>
        </div>
      )}
    </div>
  );
}

function DocsPanel({ docs, onClose, onDelete, onSave, user, onOpenTeamChat, activeTeamChatId, aisReport, onOpenAis, userProfile, onUpdateProfile, repairData, onUpdateRepairData, onSendChat }: { docs: SavedDoc[]; onClose: () => void; onDelete: (id: string) => void; onSave: (doc: SavedDoc) => void; user: any; onOpenTeamChat?: (member: TeamMember) => void; activeTeamChatId?: number | null; aisReport: MissionData | null; onOpenAis: () => void; userProfile: UserProfile; onUpdateProfile: (p: UserProfile) => void; repairData: RepairData | null; onUpdateRepairData: (data: RepairData) => void; onSendChat: (msg: string) => void }) {
  const docInputRef = useRef<HTMLInputElement>(null);
  const idInputRef = useRef<HTMLInputElement>(null);
  const bankInputRef = useRef<HTMLInputElement>(null);
  const commandUploadRef = useRef<HTMLInputElement>(null);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [expandedBureau, setExpandedBureau] = useState<string | null>(null);
  const [uploadTarget, setUploadTarget] = useState<"credit_report" | "id_document" | "bank_statement" | "proof_of_residency" | null>(null);
  const residencyInputRef = useRef<HTMLInputElement>(null);

  const triggerCommandUpload = () => {
    setUploadTarget("credit_report");
    commandUploadRef.current?.click();
  };

  const classifyDocType = (name: string, target?: string | null): SavedDoc["type"] => {
    if (target === "id_document") return "id_document";
    if (target === "bank_statement") return "bank_statement";
    if (target === "proof_of_residency") return "proof_of_residency";
    if (target === "credit_report") return "credit_report";
    const n = name.toLowerCase();
    if (/dispute/i.test(n)) return "dispute_letter";
    if (/credit|report|experian|equifax|transunion/i.test(n)) return "credit_report";
    if (/\bid\b|license|passport|identification/i.test(n)) return "id_document";
    if (/bank|statement|checking|savings/i.test(n)) return "bank_statement";
    if (/residen|utility|bill|lease|mortgage\s*statement/i.test(n)) return "proof_of_residency";
    return "other";
  };

  const handleUploadDoc = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const docType = classifyDocType(file.name, uploadTarget);
    const reader = new FileReader();
    reader.onload = () => {
      const doc: SavedDoc = {
        id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
        name: file.name,
        type: docType,
        savedAt: Date.now(),
        fileDataUrl: reader.result as string,
      };
      onSave(doc);
      setUploadTarget(null);

      if (docType === "credit_report") {
        const isPdf = file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
        if (isPdf) {
          const dataUrl = reader.result as string;
          const base64 = dataUrl.split(",")[1] || dataUrl;
          onSendChat(`__VAULT_REPORT_UPLOAD__${file.name}__BASE64__${base64}`);
        } else {
          const textReader = new FileReader();
          textReader.onload = () => {
            const text = textReader.result as string;
            if (text && text.length > 10) {
              onSendChat(`__VAULT_REPORT_UPLOAD__${file.name}__TEXT__${text}`);
            }
          };
          textReader.readAsText(file);
        }
      }
    };
    reader.readAsDataURL(file);
    if (docInputRef.current) docInputRef.current.value = "";
    if (idInputRef.current) idInputRef.current.value = "";
    if (bankInputRef.current) bankInputRef.current.value = "";
    if (residencyInputRef.current) residencyInputRef.current.value = "";
    if (commandUploadRef.current) commandUploadRef.current.value = "";
  };

  const handleDownload = async (doc: SavedDoc) => {
    setDownloadingId(doc.id);
    try {
      if (doc.disputes && doc.disputes.length > 0) {
        const attachmentPages: { type: string; dataUrl: string; name: string }[] = [];
        for (const d of docs) {
          if ((d.type === "id_document" || d.type === "proof_of_residency" || d.type === "bank_statement" || d.type === "credit_report") && d.fileDataUrl) {
            attachmentPages.push({ type: d.type, dataUrl: d.fileDataUrl, name: d.name });
          }
        }
        const payload: any = { disputes: doc.disputes, attachmentPages };
        if (userProfile.fullName) payload.userName = userProfile.fullName;
        if (userProfile.address) payload.userAddress = userProfile.address;
        if (userProfile.ssn4) payload.ssnLast4 = userProfile.ssn4;
        if (userProfile.dob) payload.dob = userProfile.dob;
        const res = await fetch("/api/dispute-letters", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload)
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
  const idDocs = docs.filter(d => d.type === "id_document");
  const bankDocs = docs.filter(d => d.type === "bank_statement");
  const residencyDocs = docs.filter(d => d.type === "proof_of_residency");
  const otherDocs = docs.filter(d => d.type === "other");
  const [profileSaved, setProfileSaved] = useState(false);

  const formatDate = (ts: number) => {
    const d = new Date(ts);
    return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
  };

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

  const [panelTab, setPanelTab] = useState<"command" | "documents">("command");
  const [repairFilter, setRepairFilter] = useState<{ bureau: string; category: string }>({ bureau: "All", category: "All" });

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

      <div className="flex border-b border-[#eee]">
        {(["command", "documents"] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setPanelTab(tab)}
            className={`flex-1 py-2 text-[10px] font-semibold uppercase tracking-wider transition-colors ${panelTab === tab ? "text-[#1a1a2e] border-b-2 border-[#1a1a2e]" : "text-[#aaa] hover:text-[#666]"}`}
            data-testid={`tab-${tab}`}
          >
            {tab === "command" ? "Command" : "Repair Center"}
          </button>
        ))}
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3">

        {panelTab === "command" && (<>

        {!hasAis && (
          <div className="mb-4">
            <button onClick={triggerCommandUpload} className="w-full rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#2a2a40] p-5 text-center hover:from-[#22223a] hover:to-[#333350] transition-all cursor-pointer group" data-testid="button-upload-command">
              <svg width="22" height="22" viewBox="0 0 18 18" fill="none" className="mx-auto mb-2 text-white/40 group-hover:text-white/60 transition-colors">
                <path d="M9 3V12M9 3L5.5 6.5M9 3L12.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 12V14C3 14.5523 3.44772 15 4 15H14C14.5523 15 15 14.5523 15 14V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-[11px] font-semibold text-white/70 group-hover:text-white/90 transition-colors">Upload Report</p>
              <p className="text-[8px] text-white/30 mt-1 leading-[1.5]">Activates AIS, Repair Center, dispute detection, and full analysis</p>
            </button>
          </div>
        )}

        <div className="space-y-2.5">
          {hasAis ? (
            <button
              onClick={onOpenAis}
              className="w-full text-left rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#2a2a40] p-3 hover:from-[#22223a] hover:to-[#333350] transition-all group"
              data-testid="button-open-ais"
            >
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-[8px] font-semibold text-white/40 uppercase tracking-[0.1em]">Capital Readiness Index</p>
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none" className="text-white/25 group-hover:text-white/50 transition-colors"><path d="M3 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-[22px] font-bold text-white leading-none" data-testid="text-ais-score" style={{ fontVariantNumeric: "tabular-nums" }}>{aisScore}</span>
                  <span className="text-[10px] font-medium text-white/30">/ 100</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] text-white/60 font-medium truncate" data-testid="text-ais-status">{getStatusLabel()}</p>
                  <p className="text-[7px] text-white/30 truncate">{getPhaseAction()}</p>
                </div>
              </div>
              {(suppressorCount > 0 || pf?.readinessLevel) && (
                <div className="mt-2 pt-2 border-t border-white/8 flex items-center gap-3 flex-wrap">
                  {pf?.readinessLevel && <span className="text-[7px] text-white/40">Tier: <span className="text-white/70 font-medium">{getReadinessTier()}</span></span>}
                  {suppressorCount > 0 && <span className="text-[7px] text-white/40">Suppressors: <span className="text-white/70 font-medium">{suppressorCount}</span></span>}
                  {aisScore && aisScore < 88 && <span className="text-[7px] text-white/40">Next: <span className="text-white/70 font-medium">{aisScore < 78 ? "78" : aisScore < 82 ? "82" : "88"}</span></span>}
                </div>
              )}
            </button>
          ) : null}

          {hasAis && aisReport && (() => {
            const tradelines = aisReport.openTradelines || [];
            const isPrimary = (o: string) => /primary/i.test(o);
            const isAU = (o: string) => /\bau\b|authorized/i.test(o);
            const isRev = (t: string) => /revolv|credit\s*card|loc\b|heloc/i.test(t);
            const isInst = (t: string) => /install|auto|student|mortgage|personal\s*loan/i.test(t);

            const primaryRev = tradelines.filter(tl => isRev(tl.type) && isPrimary(tl.ownership));
            const primaryInst = tradelines.filter(tl => isInst(tl.type) && isPrimary(tl.ownership));
            const primaryAll = tradelines.filter(tl => isPrimary(tl.ownership));

            const inqRaw = aisReport.projectedFunding?.inquirySlots ? String(aisReport.projectedFunding.inquirySlots) : "";
            const inqMatch = inqRaw.match(/(\d+)\s*(?:hard|inquir|total)/i);
            let inqCount = inqMatch ? parseInt(inqMatch[1]) : 0;
            if (inqCount === 0) {
              const suppInq = (aisReport.suppressors || []).find(s => /inquir|velocity/i.test(s));
              if (suppInq) { const sm = suppInq.match(/(\d+)\s*(?:inquir|hard)/i); inqCount = sm ? parseInt(sm[1]) : 3; }
            }

            const limits = primaryRev.map(tl => parseInt(tl.limit.replace(/[^0-9]/g, "")) || 0);
            const balances = primaryRev.map(tl => parseInt(tl.balance.replace(/[^0-9]/g, "")) || 0);
            const totalLimit = limits.reduce((s, l) => s + l, 0);
            const totalBal = balances.reduce((s, b) => s + b, 0);
            const aggUtil = totalLimit > 0 ? Math.round((totalBal / totalLimit) * 100) : 0;
            const avgLimit = limits.length > 0 ? Math.round(limits.reduce((s, l) => s + l, 0) / limits.length) : 0;
            const highestLimit = limits.length > 0 ? Math.max(...limits) : 0;
            const maxCardUtil = limits.length > 0 ? Math.max(...limits.map((l, i) => l > 0 ? Math.round((balances[i] / l) * 100) : 0)) : 0;
            const parseAgeYears = (age: string): number | null => {
              const yrM = age.match(/(\d+)\s*yr/i);
              if (yrM) return parseInt(yrM[1]);
              const moM = age.match(/(\d+)\s*mo/i);
              if (moM) return Math.round(parseInt(moM[1]) / 12 * 10) / 10;
              return null;
            };
            const parsedAges = tradelines.map(tl => parseAgeYears(tl.age)).filter((a): a is number => a !== null);
            const avgAge = parsedAges.length > 0 ? Math.round(parsedAges.reduce((s, a) => s + a, 0) / parsedAges.length) : 0;
            const newAccounts = parsedAges.filter(a => a < 1).length;
            const hasInstallment = primaryInst.length > 0;

            const velocityColor = inqCount >= 6 ? "#c0392b" : inqCount >= 3 ? "#c9a227" : "#2d6a4f";

            type RiskSignal = { label: string; status: string; level: "safe" | "caution" | "risk" };
            const signals: RiskSignal[] = [
              { label: "Inquiry Velocity", status: inqCount >= 6 ? "High" : inqCount >= 3 ? "Elevated" : "Clear", level: inqCount >= 6 ? "risk" : inqCount >= 3 ? "caution" : "safe" },
              { label: "Revolver Concentration", status: maxCardUtil >= 80 ? "Severe" : maxCardUtil >= 30 ? "Elevated" : "Normal", level: maxCardUtil >= 80 ? "risk" : maxCardUtil >= 30 ? "caution" : "safe" },
              { label: "Tradeline Depth", status: primaryAll.length >= 5 ? "Established" : primaryAll.length >= 3 ? "Developing" : "Thin", level: primaryAll.length >= 5 ? "safe" : primaryAll.length >= 3 ? "caution" : "risk" },
              { label: "Limit Strength", status: avgLimit >= 5000 ? "Strong" : avgLimit >= 3000 ? "Moderate" : "Weak", level: avgLimit >= 5000 ? "safe" : avgLimit >= 3000 ? "caution" : "risk" },
              { label: "Age Stability", status: avgAge >= 5 ? "Strong" : avgAge >= 3 ? "Stable" : "Weak", level: avgAge >= 5 ? "safe" : avgAge >= 3 ? "caution" : "risk" },
              { label: "New Clustering", status: newAccounts >= 3 ? "Risk" : newAccounts >= 2 ? "Caution" : "Clear", level: newAccounts >= 3 ? "risk" : newAccounts >= 2 ? "caution" : "safe" },
              { label: "Profile Symmetry", status: hasInstallment && primaryRev.length >= 1 ? "Balanced" : "Asymmetric", level: hasInstallment && primaryRev.length >= 1 ? "safe" : "caution" },
            ];

            const riskCount = signals.filter(s => s.level === "risk").length;
            const cautionCount = signals.filter(s => s.level === "caution").length;
            const overallColor = riskCount >= 2 ? "#c0392b" : riskCount >= 1 || cautionCount >= 3 ? "#c9a227" : "#2d6a4f";

            let approvalProb = 85;
            if (inqCount >= 6) approvalProb -= 25; else if (inqCount >= 3) approvalProb -= 12;
            if (maxCardUtil >= 80) approvalProb -= 20; else if (maxCardUtil >= 30) approvalProb -= 10;
            if (primaryAll.length < 3) approvalProb -= 15; else if (primaryAll.length < 5) approvalProb -= 5;
            if (avgLimit < 3000) approvalProb -= 15; else if (avgLimit < 5000) approvalProb -= 5;
            if (avgAge < 1) approvalProb -= 12; else if (avgAge < 3) approvalProb -= 5;
            if (newAccounts >= 3) approvalProb -= 10; else if (newAccounts >= 2) approvalProb -= 5;
            if (!hasInstallment || primaryRev.length < 1) approvalProb -= 5;
            if (aggUtil >= 30) approvalProb -= 10; else if (aggUtil > 9) approvalProb -= 3;
            approvalProb = Math.max(5, Math.min(95, approvalProb));
            const probColor = approvalProb >= 70 ? "#2d6a4f" : approvalProb >= 45 ? "#c9a227" : "#c0392b";

            const denialDrivers = signals.filter(s => s.level !== "safe").sort((a, b) => a.level === "risk" ? -1 : b.level === "risk" ? 1 : 0);

            const now = new Date();
            const cooldownMonths = inqCount > 4 ? 4 : inqCount > 2 ? 2 : 1;
            const windowStart = new Date(now.getFullYear(), now.getMonth() + cooldownMonths, 1);
            const windowEnd = new Date(windowStart.getFullYear(), windowStart.getMonth() + 2, 1);
            const mn = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

            return (<>
              <div className="rounded-xl border border-[#e8e8e8] bg-white p-3" data-testid="denial-simulation">
                <div className="flex items-center gap-2.5 mb-2">
                  <div className="relative w-[36px] h-[36px] flex-shrink-0">
                    <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke="#f0f0f0" strokeWidth="2.5" />
                      <circle cx="18" cy="18" r="15.5" fill="none" stroke={probColor} strokeWidth="2.5" strokeDasharray={`${approvalProb * 0.974} 100`} strokeLinecap="round" />
                    </svg>
                    <div className="absolute inset-0 flex items-center justify-center">
                      <span className="text-[10px] font-bold leading-none" style={{ color: probColor, fontVariantNumeric: "tabular-nums" }}>{approvalProb}%</span>
                    </div>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[9px] text-[#333] font-semibold leading-tight">If You Applied Today</p>
                    <p className="text-[7px] text-[#888] leading-[1.3] mt-0.5">
                      {approvalProb >= 70
                        ? "Good chance of approval"
                        : approvalProb >= 45
                          ? `~${Math.round(approvalProb / 10)} in 10 apps approved`
                          : "Most apps would be declined"}
                    </p>
                  </div>
                </div>
                {highestLimit > 0 && (
                  <div className="grid grid-cols-2 gap-1.5 mb-2">
                    <div className="rounded-md bg-[#fafafa] border border-[#eee] px-2 py-1.5">
                      <p className="text-[6px] text-[#aaa] font-medium uppercase tracking-wider">Typical Range</p>
                      <p className="text-[9px] text-[#333] font-bold mt-0.5" style={{ fontVariantNumeric: "tabular-nums" }}>${Math.round(highestLimit * 0.6).toLocaleString()} – ${Math.round(highestLimit * 1.2).toLocaleString()}</p>
                    </div>
                    <div className="rounded-md bg-[#fafafa] border border-[#eee] px-2 py-1.5">
                      <p className="text-[6px] text-[#aaa] font-medium uppercase tracking-wider">If Improved</p>
                      <p className="text-[9px] text-[#2d6a4f] font-bold mt-0.5" style={{ fontVariantNumeric: "tabular-nums" }}>${Math.round(highestLimit * 1.2).toLocaleString()} – ${Math.round(highestLimit * 1.8).toLocaleString()}</p>
                    </div>
                  </div>
                )}
                {denialDrivers.length > 0 && (
                  <div className="rounded-md bg-[#fafafa] border border-[#eee] overflow-hidden">
                    <div className="px-2 py-1 border-b border-[#eee] bg-[#f5f5f5]">
                      <p className="text-[6px] text-[#aaa] font-semibold uppercase tracking-wider">Issues Affecting Approval</p>
                    </div>
                    {denialDrivers.slice(0, 4).map((d, di) => (
                      <div key={di} className={`flex items-center gap-2 px-2 py-1.5 ${di < Math.min(denialDrivers.length, 4) - 1 ? "border-b border-[#f0f0f0]" : ""}`}>
                        <div className={`w-[4px] h-[4px] rounded-full shrink-0 ${d.level === "risk" ? "bg-[#c0392b]" : "bg-[#c9a227]"}`} />
                        <span className={`text-[8px] font-semibold flex-1 ${d.level === "risk" ? "text-[#c0392b]" : "text-[#c9a227]"}`}>{d.label}</span>
                        <span className="text-[7px] text-[#bbb]">{d.status}</span>
                      </div>
                    ))}
                  </div>
                )}
                <div className="mt-2 pt-1.5 border-t border-[#f0f0f0] flex items-center justify-between">
                  <p className="text-[7px] text-[#aaa]">Best window</p>
                  <p className="text-[8px] font-semibold text-[#333]" style={{ fontVariantNumeric: "tabular-nums" }}>{mn[windowStart.getMonth()]}–{mn[windowEnd.getMonth()]} {windowEnd.getFullYear()}</p>
                </div>
              </div>

              <div className="rounded-xl border border-[#e8e8e8] bg-white p-3" data-testid="underwriting-risk-signals">
                <div className="flex items-center justify-between mb-1.5">
                  <p className="text-[9px] text-[#333] font-semibold">Risk Signals</p>
                  <span className="text-[7px] font-bold px-1.5 py-[2px] rounded" style={{ color: overallColor, backgroundColor: overallColor + "10" }}>{riskCount >= 2 ? "High Risk" : riskCount >= 1 || cautionCount >= 3 ? "Moderate" : cautionCount >= 1 ? "Low" : "Clear"}</span>
                </div>
                <p className="text-[8px] text-[#aaa] mb-2.5">These are patterns lenders watch closely when reviewing applications</p>
                {(() => {
                  const riskSignals = signals.filter(s => s.level === "risk");
                  const cautionSignals = signals.filter(s => s.level === "caution");
                  const safeSignals = signals.filter(s => s.level === "safe");
                  return (<>
                    {riskSignals.length > 0 && (
                      <div className="mb-2">
                        <p className="text-[7px] text-[#c0392b] font-bold uppercase tracking-wider mb-1.5">High Risk</p>
                        <div className="space-y-1.5">
                          {riskSignals.map((s, si) => {
                            const fix = getSignalFix(s.label, s.level);
                            return (
                              <div key={si} className="rounded-lg bg-[#c0392b]/4 border border-[#c0392b]/10 px-2.5 py-2">
                                <div className="flex items-center justify-between mb-0.5">
                                  <span className="text-[8px] text-[#333] font-semibold">{s.label}</span>
                                  <span className="text-[7px] font-bold text-[#c0392b]">{s.status}</span>
                                </div>
                                <p className="text-[7px] text-[#888] leading-[1.4]">{getSignalExplanation(s.label)}</p>
                                {fix && (
                                  <div className="mt-1 flex items-center gap-1.5">
                                    <span className="text-[7px] text-[#c0392b] font-semibold">Fix:</span>
                                    <span className="text-[7px] text-[#666]">{fix}</span>
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {cautionSignals.length > 0 && (
                      <div className="mb-2">
                        <p className="text-[7px] text-[#c9a227] font-bold uppercase tracking-wider mb-1.5">Moderate Risk</p>
                        <div className="space-y-1.5">
                          {cautionSignals.map((s, si) => {
                            const fix = getSignalFix(s.label, s.level);
                            return (
                              <div key={si} className="flex items-center justify-between px-2.5 py-1.5 rounded-lg bg-[#c9a227]/4 border border-[#c9a227]/10">
                                <div className="min-w-0 flex-1">
                                  <span className="text-[8px] text-[#333] font-semibold">{s.label}</span>
                                  {fix && <span className="text-[7px] text-[#888] ml-1.5">· {fix}</span>}
                                </div>
                                <span className="text-[7px] font-bold text-[#c9a227] ml-2">{s.status}</span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                    {safeSignals.length > 0 && (
                      <div>
                        <p className="text-[7px] text-[#2d6a4f] font-bold uppercase tracking-wider mb-1.5">Positive Signals</p>
                        <div className="space-y-1">
                          {safeSignals.map((s, si) => (
                            <div key={si} className="flex items-center justify-between px-2.5 py-1.5">
                              <span className="text-[8px] text-[#555]">{s.label}</span>
                              <span className="text-[7px] font-bold text-[#2d6a4f]">{s.status}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </>);
                })()}
              </div>

              <div className="rounded-xl border border-[#e8e8e8] bg-white overflow-hidden" data-testid="lender-metrics">
                <div className="px-3 py-2 border-b border-[#eee]">
                  <p className="text-[9px] text-[#333] font-semibold">Profile Metrics</p>
                </div>
                <div className="divide-y divide-[#f0f0f0]">
                  {[
                    { label: "Inquiries", value: `${inqCount}`, color: velocityColor, optimal: "0–2", tip: inqCount >= 6 ? "Too many — wait 90 days" : inqCount >= 3 ? "Avoid new applications" : "" },
                    { label: "Credit Mix", value: `${primaryRev.length}R / ${primaryInst.length}I`, color: primaryRev.length >= 3 && hasInstallment ? "#2d6a4f" : "#c9a227", optimal: "3-5R + 1-2I", tip: !hasInstallment ? "Add installment loan" : primaryRev.length < 3 ? "Add revolving accounts" : "" },
                    { label: "Avg Limit", value: avgLimit > 0 ? `$${avgLimit.toLocaleString()}` : "—", color: avgLimit >= 5000 ? "#2d6a4f" : avgLimit >= 3000 ? "#c9a227" : "#c0392b", optimal: "$5K–$15K", tip: avgLimit < 5000 ? "Request limit increases" : "" },
                    { label: "Utilization", value: `${aggUtil}%`, color: aggUtil <= 9 ? "#2d6a4f" : aggUtil <= 29 ? "#c9a227" : "#c0392b", optimal: "1–9%", tip: aggUtil > 9 ? "Pay down balances" : "" },
                  ].map((m, mi) => (
                    <div key={mi} className="flex items-center gap-2 px-3 py-2">
                      <div className="w-[4px] h-[4px] rounded-full shrink-0" style={{ backgroundColor: m.color }} />
                      <span className="text-[8px] text-[#555] font-medium flex-1">{m.label}</span>
                      <span className="text-[9px] font-bold text-right min-w-[40px]" style={{ color: m.color, fontVariantNumeric: "tabular-nums" }}>{m.value}</span>
                      <span className="text-[7px] text-[#bbb] text-right min-w-[45px]" style={{ fontVariantNumeric: "tabular-nums" }}>{m.optimal}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>);
          })()}

          {aisReport?.strategyData && aisReport.strategyData.steps.length > 0 && (
            <div className="rounded-xl border border-[#e8e8e8] bg-white p-3" data-testid="capital-strategy">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-5 h-5 rounded-md bg-[#1a1a2e] flex items-center justify-center shrink-0">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M1 9l3-3 2 2 3-5" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/></svg>
                </div>
                <p className="text-[9px] text-[#333] font-bold uppercase tracking-[0.08em]">Your Action Plan</p>
              </div>
              <p className="text-[8px] text-[#999] mb-2.5">Follow these steps in order to improve your approval chances</p>
              <div className="space-y-2 mb-3">
                {aisReport.strategyData.steps.map((step) => (
                  <div key={step.step} className="rounded-lg bg-[#f8f9fb] border border-[#e8e8ee] p-2.5">
                    <div className="flex items-start gap-2">
                      <div className="w-5 h-5 rounded-full bg-[#1a1a2e] flex items-center justify-center shrink-0 mt-0.5">
                        <span className="text-[9px] font-bold text-white" style={{ fontVariantNumeric: "tabular-nums" }}>{step.step}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-[9px] text-[#333] font-semibold mb-0.5">{step.action}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[7px] text-[#2d6a4f] font-semibold">{step.impact}</span>
                          <span className="text-[7px] text-[#ddd]">|</span>
                          <span className="text-[7px] text-[#999]">{step.timeframe}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
              {(aisReport.strategyData.currentOdds > 0 || aisReport.strategyData.projectedOdds > 0) && (
                <div className="rounded-lg bg-gradient-to-r from-[#f0f2f8] to-[#e8f5e9] border border-[#ddd] p-2.5">
                  <p className="text-[7px] text-[#999] font-semibold uppercase tracking-wider mb-1.5">Expected Results</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-[7px] text-[#aaa] mb-0.5">Approval Odds</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[12px] font-bold text-[#c0392b]" style={{ fontVariantNumeric: "tabular-nums" }}>{aisReport.strategyData.currentOdds}%</span>
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4h8M6 1l3 3-3 3" stroke="#2d6a4f" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <span className="text-[12px] font-bold text-[#2d6a4f]" style={{ fontVariantNumeric: "tabular-nums" }}>{aisReport.strategyData.projectedOdds}%</span>
                      </div>
                    </div>
                    <div>
                      <p className="text-[7px] text-[#aaa] mb-0.5">Estimated Limits</p>
                      <div className="flex items-center gap-1.5">
                        <span className="text-[9px] font-bold text-[#c0392b]" style={{ fontVariantNumeric: "tabular-nums" }}>{aisReport.strategyData.currentFunding}</span>
                        <svg width="10" height="8" viewBox="0 0 10 8" fill="none"><path d="M1 4h8M6 1l3 3-3 3" stroke="#2d6a4f" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"/></svg>
                        <span className="text-[9px] font-bold text-[#2d6a4f]" style={{ fontVariantNumeric: "tabular-nums" }}>{aisReport.strategyData.projectedFunding}</span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {aisReport?.strategyData && aisReport.strategyData.timeline.length > 0 && (
            <div className="rounded-xl border border-[#e8e8e8] bg-white p-3" data-testid="funding-timeline">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-5 h-5 rounded-md bg-[#1a1a2e] flex items-center justify-center shrink-0">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><circle cx="5" cy="5" r="4" stroke="white" strokeWidth="1" fill="none"/><path d="M5 3v2.5l1.5 1" stroke="white" strokeWidth="1" strokeLinecap="round"/></svg>
                </div>
                <p className="text-[9px] text-[#333] font-bold uppercase tracking-[0.08em]">Funding Timeline</p>
              </div>
              <p className="text-[8px] text-[#999] mb-3">Projected profile improvement over time</p>
              <div className="relative pl-4">
                <div className="absolute left-[7px] top-1 bottom-1 w-[2px] bg-gradient-to-b from-[#c0392b] via-[#c9a227] to-[#2d6a4f] rounded-full" />
                <div className="space-y-3">
                  {aisReport.strategyData.timeline.map((m, i) => {
                    const isLast = i === aisReport.strategyData!.timeline.length - 1;
                    const dotColor = m.approvalOdds >= 70 ? "#2d6a4f" : m.approvalOdds >= 45 ? "#c9a227" : "#c0392b";
                    return (
                      <div key={i} className="relative">
                        <div className="absolute -left-4 top-1 w-[10px] h-[10px] rounded-full border-2 bg-white" style={{ borderColor: dotColor }} />
                      <div className={`rounded-lg ${isLast ? "bg-[#e8f5e9] border-[#c8e6c9]" : "bg-[#fafafa] border-[#eee]"} border p-2.5`}>
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[9px] font-bold text-[#333]">{m.label}</span>
                          <span className="text-[10px] font-bold" style={{ color: dotColor, fontVariantNumeric: "tabular-nums" }}>{m.approvalOdds}%</span>
                        </div>
                        <p className="text-[7px] text-[#888] leading-[1.4]">{m.change}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
            </div>
          )}

          {hasAis && aisReport && (
            <CapitalSimulator aisReport={aisReport} />
          )}

          {aisReport?.strategyData && aisReport.strategyData.fundingMatches.length > 0 && (
            <div className="rounded-xl border border-[#e8e8e8] bg-white p-3" data-testid="funding-matches">
              <div className="flex items-center gap-2 mb-1.5">
                <div className="w-5 h-5 rounded-md bg-[#1a1a2e] flex items-center justify-center shrink-0">
                  <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><rect x="1" y="2" width="8" height="6" rx="1" stroke="white" strokeWidth="1" fill="none"/><path d="M1 4h8" stroke="white" strokeWidth="0.8"/></svg>
                </div>
                <p className="text-[9px] text-[#333] font-bold uppercase tracking-[0.08em]">Lender Matches</p>
              </div>
              <p className="text-[8px] text-[#999] mb-2.5">Lenders that match your profile based on their approval criteria</p>
              <div className="space-y-1.5">
                {aisReport.strategyData.fundingMatches.map((match, i) => {
                  const likelihoodColor = match.likelihood.toLowerCase() === "high" ? "#2d6a4f" : match.likelihood.toLowerCase() === "medium" ? "#c9a227" : "#c0392b";
                  return (
                    <div key={i} className="rounded-lg bg-[#fafafa] border border-[#eee] p-2.5 flex items-center gap-2.5">
                      <div className="w-7 h-7 rounded-lg bg-[#1a1a2e] flex items-center justify-center shrink-0">
                        <span className="text-[9px] font-bold text-white">{match.lender.charAt(0)}</span>
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[9px] text-[#333] font-semibold">{match.lender}</span>
                          <span className="text-[7px] font-bold px-1.5 py-[2px] rounded-full" style={{ color: likelihoodColor, backgroundColor: likelihoodColor + "15" }}>{match.likelihood}</span>
                        </div>
                        <p className="text-[7px] text-[#888] leading-[1.4]">{match.reason}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <PerfectProfileTab aisReport={aisReport} />

        </div>
        </>)}

        {panelTab === "documents" && (<>


        {repairData && repairData.truthProfile && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="4" r="2.5" stroke="#333" strokeWidth="1" fill="none"/><path d="M2 10.5c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="#333" strokeWidth="1" strokeLinecap="round" fill="none"/></svg>
              <span className="text-[10px] font-semibold text-[#555] uppercase tracking-wider">Truth Profile</span>
            </div>
            <div className="space-y-0.5 px-2.5 py-2 rounded-md bg-[#fafafa] border border-[#eee]">
              <div className="text-[10px] text-[#333] font-medium">{repairData.truthProfile.fullName}</div>
              {repairData.truthProfile.currentAddress && <div className="text-[9px] text-[#888]">{repairData.truthProfile.currentAddress}</div>}
              {repairData.truthProfile.dob && <div className="text-[9px] text-[#888]">DOB: {repairData.truthProfile.dob}</div>}
              {repairData.truthProfile.ssnLast4 && <div className="text-[9px] text-[#888]">SSN: ***-**-{repairData.truthProfile.ssnLast4}</div>}
              {repairData.truthProfile.nameVariants.length > 1 && (
                <div className="text-[9px] text-[#b0860f] mt-1">Name variants detected: {repairData.truthProfile.nameVariants.join(", ")}</div>
              )}
            </div>
          </div>
        )}

        {repairData && repairData.discrepancies.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1l5 9H1l5-9z" stroke="#e07a5f" strokeWidth="1" fill="none"/><path d="M6 5v2M6 8.5v.5" stroke="#e07a5f" strokeWidth="1" strokeLinecap="round"/></svg>
              <span className="text-[10px] font-semibold text-[#555] uppercase tracking-wider">Discrepancies</span>
              <span className="text-[9px] text-[#e07a5f] ml-auto font-semibold">{repairData.discrepancies.length}</span>
            </div>
            <div className="space-y-1">
              {repairData.discrepancies.map((d, i) => (
                <div key={i} className="px-2.5 py-1.5 rounded-md bg-[#fef3f0] border border-[#f0d0c0]" data-testid={`discrepancy-${i}`}>
                  <div className="flex items-center gap-1.5">
                    <span className={`text-[7px] font-bold uppercase px-1 py-0.5 rounded ${d.severity === "High" ? "bg-[#e07a5f] text-white" : d.severity === "Med" ? "bg-[#f0ad4e] text-white" : "bg-[#ddd] text-[#555]"}`}>{d.severity}</span>
                    <span className="text-[10px] font-medium text-[#333] capitalize">{d.field}</span>
                  </div>
                  <div className="mt-0.5 text-[9px] text-[#888]">Report: {d.creditReportValue}</div>
                  {d.documentValue && <div className="text-[9px] text-[#2d6a4f]">Docs: {d.documentValue}</div>}
                  <div className="text-[8px] text-[#aaa] mt-0.5">Basis: {d.disputeBasis}</div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mb-3">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[12px] font-bold text-[#1a1a2e] tracking-tight">Dispute Items</span>
            {repairData && <span className="text-[10px] text-white bg-[#1a1a2e] rounded-full px-2 py-0.5 font-bold">{repairData.negativeItems.length}</span>}
          </div>

          {!repairData || repairData.negativeItems.length === 0 ? (
            <div className="w-full px-3 py-4 rounded-lg bg-[#fafafa] border border-[#eee] text-center">
              <div className="text-[11px] text-[#888] font-medium">No dispute-eligible items detected yet</div>
              <div className="text-[10px] text-[#aaa] mt-1">Upload a report in the Command tab to scan for disputable items</div>
            </div>
          ) : (<>
            <div className="flex gap-1.5 mb-3">
              <select value={repairFilter.bureau} onChange={e => setRepairFilter(f => ({ ...f, bureau: e.target.value }))} className="text-[10px] px-2 py-1.5 rounded-md border border-[#ddd] bg-white text-[#555] font-medium" data-testid="filter-bureau">
                <option value="All">All Bureaus</option>
                {[...new Set(repairData.negativeItems.map(n => n.bureau))].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <select value={repairFilter.category} onChange={e => setRepairFilter(f => ({ ...f, category: e.target.value }))} className="text-[10px] px-2 py-1.5 rounded-md border border-[#ddd] bg-white text-[#555] font-medium" data-testid="filter-category">
                <option value="All">All Types</option>
                {[...new Set(repairData.negativeItems.map(n => n.category))].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>

            {(() => {
              const inquiryItems = repairData.negativeItems.filter(n => n.category === "Inquiry" && (repairFilter.bureau === "All" || n.bureau === repairFilter.bureau) && (repairFilter.category === "All" || repairFilter.category === "Inquiry"));
              const nonInquiryItems = repairData.negativeItems.filter(n => n.category !== "Inquiry" && (repairFilter.bureau === "All" || n.bureau === repairFilter.bureau) && (repairFilter.category === "All" || n.category === repairFilter.category));
              const roundLabels: Record<number, { label: string; desc: string }> = {
                1: { label: "R1: Verification", desc: "Request documentation of permissible purpose" },
                2: { label: "R2: Method of Verification", desc: "Demand how verification was conducted" },
                3: { label: "R3: Escalation", desc: "Final notice — CFPB/FTC/AG escalation" }
              };

              return (<>
                {inquiryItems.length > 0 && (repairFilter.category === "All" || repairFilter.category === "Inquiry") && (
                  <div className="mb-4">
                    <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[#e8e8f4]">
                      <div className="w-5 h-5 rounded-full bg-[#6366f1]/10 flex items-center justify-center shrink-0">
                        <svg width="11" height="11" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="5.5" stroke="#6366f1" strokeWidth="1.3"/><path d="M8 5v3.5M8 10.5v.5" stroke="#6366f1" strokeWidth="1.3" strokeLinecap="round"/></svg>
                      </div>
                      <span className="text-[11px] font-semibold text-[#333] tracking-wide">Inquiry Disputes</span>
                      <span className="text-[10px] text-white bg-[#6366f1] rounded-full px-1.5 py-0.5 ml-auto font-bold min-w-[18px] text-center">{inquiryItems.length}</span>
                    </div>
                    <div className="space-y-2 max-h-[340px] overflow-y-auto pr-0.5">
                      {inquiryItems.map((item, i) => {
                        const rl = roundLabels[item.disputeRound] || roundLabels[1];
                        const sameDayCount = inquiryItems.filter(n => n.dates?.inquiryDate === item.dates?.inquiryDate && n.dates?.inquiryDate).length;
                        const isCluster = sameDayCount > 1;
                        const statusColor = item.userAttestation === "not_authorized" ? "bg-[#dc2626] text-white" : item.userAttestation === "recognized" ? "bg-[#16a34a] text-white" : "bg-[#6366f1]/10 text-[#6366f1]";
                        const statusLabel = item.userAttestation === "not_authorized" ? "Denied" : item.userAttestation === "recognized" ? "Recognized" : "Pending";
                        return (
                          <div key={item.itemId || i} className="rounded-lg bg-white border border-[#e4e4ed] hover:border-[#6366f1]/30 hover:shadow-sm transition-all" data-testid={`repair-item-${item.itemId}`}>
                            <div className="px-3 py-2.5">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className="text-[11px] font-bold text-[#1a1a2e] tracking-wide">{item.furnisherName}</span>
                                <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full ml-auto ${statusColor}`}>{statusLabel}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-[10px] text-[#666] mb-2">
                                <span>{item.bureau}</span>
                                <span className="text-[#ccc]">|</span>
                                {item.dates?.inquiryDate && <span>{item.dates.inquiryDate}</span>}
                                {item.standaloneInquiry && <><span className="text-[#ccc]">|</span><span className="text-[#dc2626] font-medium">No Account</span></>}
                                {isCluster && <><span className="text-[#ccc]">|</span><span className="text-[#d97706] font-medium">Cluster</span></>}
                              </div>
                              <div className="flex items-center gap-1.5 mb-2.5">
                                <span className={`text-[9px] font-bold px-2 py-0.5 rounded ${item.disputeRound === 1 ? "bg-[#6366f1]/8 text-[#6366f1] border border-[#6366f1]/15" : item.disputeRound === 2 ? "bg-[#f59e0b]/8 text-[#b45309] border border-[#f59e0b]/15" : "bg-[#ef4444]/8 text-[#dc2626] border border-[#ef4444]/15"}`}>
                                  {rl.label}
                                </span>
                                <span className="text-[9px] text-[#999]">{rl.desc}</span>
                              </div>
                              <div className="flex gap-1.5 flex-wrap">
                                {item.attestationRequired && !item.userAttestation && (
                                  <>
                                    <button
                                      onClick={() => {
                                        if (!repairData) return;
                                        const updated = { ...repairData, negativeItems: repairData.negativeItems.map(n => n.itemId === item.itemId ? { ...n, userAttestation: "not_authorized" as const, status: "Attested" as const } : n) };
                                        onUpdateRepairData(updated);
                                      }}
                                      className="text-[10px] px-3 py-1.5 rounded-md bg-[#dc2626] text-white font-semibold hover:bg-[#b91c1c] transition-colors"
                                      data-testid={`button-not-authorized-${item.itemId}`}
                                    >
                                      Not Authorized
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (!repairData) return;
                                        const updated = { ...repairData, negativeItems: repairData.negativeItems.map(n => n.itemId === item.itemId ? { ...n, userAttestation: "recognized" as const, status: "Attested" as const } : n) };
                                        onUpdateRepairData(updated);
                                      }}
                                      className="text-[10px] px-3 py-1.5 rounded-md bg-[#f3f4f6] text-[#555] font-semibold hover:bg-[#e5e7eb] transition-colors border border-[#e5e7eb]"
                                      data-testid={`button-recognized-${item.itemId}`}
                                    >
                                      I Recognize This
                                    </button>
                                  </>
                                )}
                                {(!item.attestationRequired || item.userAttestation) && item.userAttestation !== "recognized" && (
                                  <button
                                    onClick={() => {
                                      const dateInfo = item.dates?.inquiryDate ? `inquiry date: ${item.dates.inquiryDate}` : "";
                                      const sameDayItems = inquiryItems.filter(n => n.dates?.inquiryDate === item.dates?.inquiryDate && n.dates?.inquiryDate);
                                      const velocityInfo = sameDayItems.length > 1 ? `\nINQUIRY VELOCITY FLAG: ${sameDayItems.length} inquiries detected on the same date (${item.dates?.inquiryDate}). This cluster pattern suggests unauthorized batch pull or impermissible purpose. Include this velocity pattern in the dispute basis.` : "";
                                      const totalInquiries = inquiryItems.length;
                                      const velocitySummary = totalInquiries >= 3 ? `\nTotal inquiry velocity: ${totalInquiries} inquiries flagged across the report. High inquiry density strengthens the dispute basis under §604.` : "";
                                      const roundInstr = item.disputeRound === 1
                                        ? "Generate a ROUND 1 inquiry dispute letter: Request documentation of permissible purpose under FCRA §604. Do NOT accuse fraud. Use 'I do not recognize / do not recall authorizing' framing. Request the transaction initiated by the consumer, any application or authorization, and the date/nature of the transaction."
                                        : item.disputeRound === 2
                                        ? "Generate a ROUND 2 inquiry dispute letter: This is a follow-up. The inquiry was reported as verified. Demand method of verification under FCRA §611(a)(6)(B)(iii). Request name/address/phone of the party contacted. Again request documentation of permissible purpose under §604."
                                        : "Generate a ROUND 3 inquiry dispute letter: This is a final escalation. The bureau failed to provide documentation of permissible purpose. Mention intent to file complaints with CFPB, FTC, and state AG. Reserve rights under §616/§617. Professional but firm.";
                                      const disputeText = `${roundInstr}\n\nInquiry: ${item.furnisherName} (${item.bureau}${dateInfo ? `, ${dateInfo}` : ""}${item.userAttestation === "not_authorized" ? ", user attests NOT AUTHORIZED" : ""}).${velocityInfo}${velocitySummary} Use the ACTUAL creditor name and dates — do NOT use placeholder text.\n\nIMPORTANT: After the letter, output a DISPUTE: line in this exact format for EACH disputed item:\nDISPUTE: CreditorName | AccountNumber | Issue Description | Bureau | Reason/Basis\nThen output [GENERATE_DISPUTE_PACKAGE] at the very end.`;
                                      onSendChat(disputeText);
                                    }}
                                    className="text-[10px] px-3 py-1.5 rounded-md bg-[#6366f1] text-white font-semibold hover:bg-[#4f46e5] transition-colors"
                                    data-testid={`button-generate-dispute-${item.itemId}`}
                                  >
                                    Generate Round {item.disputeRound} Letter
                                  </button>
                                )}
                                {(!item.attestationRequired || item.userAttestation) && item.userAttestation !== "recognized" && item.disputeRound < 3 && (
                                  <button
                                    onClick={() => {
                                      if (!repairData) return;
                                      const nextRound = Math.min(item.disputeRound + 1, 3);
                                      const updated = { ...repairData, negativeItems: repairData.negativeItems.map(n => n.itemId === item.itemId ? { ...n, disputeRound: nextRound } : n) };
                                      onUpdateRepairData(updated);
                                    }}
                                    className="text-[10px] px-3 py-1.5 rounded-md bg-white text-[#555] font-semibold hover:bg-[#f3f4f6] transition-colors border border-[#ddd]"
                                    data-testid={`button-advance-round-${item.itemId}`}
                                  >
                                    Advance to R{Math.min(item.disputeRound + 1, 3)}
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                    {inquiryItems.filter(n => n.userAttestation !== "recognized").length > 0 && (
                      <button
                        onClick={() => {
                          const eligible = inquiryItems.filter(n => n.userAttestation !== "recognized");
                          const needsAttestation = eligible.filter(n => n.attestationRequired && !n.userAttestation);
                          if (needsAttestation.length > 0) {
                            alert(`${needsAttestation.length} inquiries need your attestation first. Mark them as "Not Authorized" or "I Recognize This" before generating.`);
                            return;
                          }
                          const byRound: Record<number, typeof eligible> = {};
                          eligible.forEach(n => { const r = n.disputeRound || 1; if (!byRound[r]) byRound[r] = []; byRound[r].push(n); });
                          const roundInstructions: Record<number, string> = {
                            1: "ROUND 1: Request documentation of permissible purpose under FCRA §604. Use 'I do not recognize / do not recall authorizing' framing. Do NOT accuse fraud.",
                            2: "ROUND 2: Follow-up. Demand method of verification under FCRA §611(a)(6)(B)(iii). Request name/address/phone of verifying party. Again request permissible purpose documentation.",
                            3: "ROUND 3: Final escalation. Bureau failed to provide documentation. Mention CFPB, FTC, state AG complaints. Reserve rights under §616/§617."
                          };
                          const dateGroups: Record<string, number> = {};
                          eligible.forEach(n => { if (n.dates?.inquiryDate) { dateGroups[n.dates.inquiryDate] = (dateGroups[n.dates.inquiryDate] || 0) + 1; } });
                          const clusterDates = Object.entries(dateGroups).filter(([, c]) => c > 1);
                          let prompt = `Generate inquiry dispute letters for the following items, grouped by dispute round. Use the ACTUAL creditor names and dates — do NOT use placeholder text.\n\nINQUIRY VELOCITY SUMMARY: ${eligible.length} total inquiry disputes.`;
                          if (clusterDates.length > 0) {
                            prompt += ` Cluster dates detected: ${clusterDates.map(([d, c]) => `${d} (${c} inquiries)`).join(", ")}. Flag these clusters as potential unauthorized batch pulls in the dispute letters.`;
                          }
                          prompt += "\n\n";
                          for (const [round, items] of Object.entries(byRound).sort((a, b) => Number(a[0]) - Number(b[0]))) {
                            prompt += `--- ${roundInstructions[Number(round)] || roundInstructions[1]} ---\n`;
                            items.forEach(n => {
                              const dateInfo = n.dates?.inquiryDate ? `, inquiry date: ${n.dates.inquiryDate}` : "";
                              const isCluster = n.dates?.inquiryDate && dateGroups[n.dates.inquiryDate] > 1;
                              prompt += `- ${n.furnisherName} (${n.bureau}${dateInfo}${n.userAttestation === "not_authorized" ? ", NOT AUTHORIZED per user" : ""}${isCluster ? ", CLUSTER — same-day inquiry" : ""})\n`;
                            });
                            prompt += "\n";
                          }
                          prompt += "IMPORTANT: After the letters, output a DISPUTE: line for EACH disputed item in this exact format:\nDISPUTE: CreditorName | AccountNumber | Issue Description | Bureau | Reason/Basis\nThen output [GENERATE_DISPUTE_PACKAGE] at the very end.";
                          onSendChat(prompt);
                        }}
                        className="mt-2.5 w-full py-2 rounded-lg bg-[#6366f1] text-white text-[11px] font-bold hover:bg-[#4f46e5] transition-colors shadow-sm"
                        data-testid="button-generate-all-inquiry-disputes"
                      >
                        Generate All Inquiry Disputes ({inquiryItems.filter(n => n.userAttestation !== "recognized").length})
                      </button>
                    )}
                  </div>
                )}

                {nonInquiryItems.length > 0 && (repairFilter.category === "All" || repairFilter.category !== "Inquiry") && (
                  <div className="mb-3">
                    {(repairFilter.category === "All" && inquiryItems.length > 0) && (
                      <div className="flex items-center gap-2 mb-2 pb-1.5 border-b border-[#e8e8e8]">
                        <div className="w-5 h-5 rounded-full bg-[#1a1a2e]/8 flex items-center justify-center shrink-0">
                          <svg width="11" height="11" viewBox="0 0 12 12" fill="none"><rect x="1" y="2" width="10" height="8" rx="1" stroke="#555" strokeWidth="1" fill="none"/><path d="M3 5h6M3 7h4" stroke="#555" strokeWidth="0.7" strokeLinecap="round"/></svg>
                        </div>
                        <span className="text-[11px] font-semibold text-[#333] tracking-wide">Account Disputes</span>
                        <span className="text-[10px] text-white bg-[#555] rounded-full px-1.5 py-0.5 ml-auto font-bold min-w-[18px] text-center">{nonInquiryItems.length}</span>
                      </div>
                    )}
                    <div className="space-y-2 max-h-[340px] overflow-y-auto pr-0.5">
                      {nonInquiryItems.map((item, i) => {
                        const catColor = item.category === "Account" ? "bg-[#e07a5f]" : item.category === "Personal Info" ? "bg-[#f0ad4e]" : item.category === "Public Record" ? "bg-[#6366f1]" : "bg-[#888]";
                        const catLabel = item.category === "Personal Info" ? "PI" : item.category === "Public Record" ? "PR" : item.category.slice(0, 3).toUpperCase();
                        const statusColor = item.userAttestation === "not_authorized" ? "bg-[#dc2626] text-white" : item.userAttestation === "recognized" ? "bg-[#16a34a] text-white" : item.status === "Packaged" ? "bg-[#ea580c] text-white" : "bg-[#f3f4f6] text-[#555]";
                        const statusLabel = item.userAttestation === "not_authorized" ? "Denied" : item.userAttestation === "recognized" ? "Recognized" : item.status === "Packaged" ? "Packaged" : "New";
                        return (
                          <div key={item.itemId || i} className="rounded-lg bg-white border border-[#e8e8e8] hover:border-[#999] hover:shadow-sm transition-all" data-testid={`repair-item-${item.itemId}`}>
                            <div className="px-3 py-2.5">
                              <div className="flex items-center gap-2 mb-1.5">
                                <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded text-white shrink-0 ${catColor}`}>{catLabel}</span>
                                <span className="text-[11px] font-bold text-[#1a1a2e] truncate">{item.furnisherName}</span>
                                <span className={`text-[8px] font-bold uppercase px-1.5 py-0.5 rounded-full ml-auto shrink-0 ${statusColor}`}>{statusLabel}</span>
                              </div>
                              <div className="text-[10px] text-[#666] mb-1.5 line-clamp-2">{item.issue}</div>
                              <div className="flex items-center gap-1.5 text-[10px] text-[#888] mb-2.5">
                                <span>{item.bureau}</span>
                                {item.accountPartial && <><span className="text-[#ccc]">|</span><span>...{item.accountPartial}</span></>}
                                {item.disputeBasis && <><span className="text-[#ccc]">|</span><span className="text-[#6366f1] font-medium">{item.disputeBasis}</span></>}
                              </div>
                              <div className="flex gap-1.5 flex-wrap">
                                {item.attestationRequired && !item.userAttestation && (
                                  <>
                                    <button
                                      onClick={() => {
                                        if (!repairData) return;
                                        const updated = { ...repairData, negativeItems: repairData.negativeItems.map(n => n.itemId === item.itemId ? { ...n, userAttestation: "not_authorized" as const, status: "Attested" as const } : n) };
                                        onUpdateRepairData(updated);
                                      }}
                                      className="text-[10px] px-3 py-1.5 rounded-md bg-[#dc2626] text-white font-semibold hover:bg-[#b91c1c] transition-colors"
                                      data-testid={`button-not-authorized-${item.itemId}`}
                                    >
                                      Not Authorized
                                    </button>
                                    <button
                                      onClick={() => {
                                        if (!repairData) return;
                                        const updated = { ...repairData, negativeItems: repairData.negativeItems.map(n => n.itemId === item.itemId ? { ...n, userAttestation: "recognized" as const, status: "Attested" as const } : n) };
                                        onUpdateRepairData(updated);
                                      }}
                                      className="text-[10px] px-3 py-1.5 rounded-md bg-[#f3f4f6] text-[#555] font-semibold hover:bg-[#e5e7eb] transition-colors border border-[#e5e7eb]"
                                      data-testid={`button-recognized-${item.itemId}`}
                                    >
                                      I Recognize This
                                    </button>
                                  </>
                                )}
                                {(!item.attestationRequired || item.userAttestation) && item.userAttestation !== "recognized" && (
                                  <button
                                    onClick={() => {
                                      const dateInfo = item.dates ? Object.entries(item.dates).filter(([,v]) => v).map(([k,v]) => `${k}: ${v}`).join(", ") : "";
                                      const acctInfo = item.accountPartial ? `, account: ${item.accountPartial}` : "";
                                      const disputeText = `Generate a dispute letter for this item: ${item.furnisherName} — ${item.issue} (${item.bureau}, basis: ${item.disputeBasis}${acctInfo}${dateInfo ? `, ${dateInfo}` : ""}${item.userAttestation === "not_authorized" ? ", user attests NOT AUTHORIZED" : ""}). Use the ACTUAL creditor name, dates, and account details provided — do NOT use placeholder text like [Insert Creditor Name]. Reference my credit report data directly.\n\nIMPORTANT: After the letter, output a DISPUTE: line in this exact format:\nDISPUTE: CreditorName | AccountNumber | Issue Description | Bureau | Reason/Basis\nThen output [GENERATE_DISPUTE_PACKAGE] at the very end.`;
                                      onSendChat(disputeText);
                                    }}
                                    className="text-[10px] px-3 py-1.5 rounded-md bg-[#1a1a2e] text-white font-semibold hover:bg-[#2a2a4e] transition-colors"
                                    data-testid={`button-generate-dispute-${item.itemId}`}
                                  >
                                    Generate Bureau Challenge
                                  </button>
                                )}
                              </div>
                              {(item.evidenceAvailable.length > 0 || item.evidenceMissing.length > 0) && (
                                <div className="flex gap-2 mt-2 pt-1.5 border-t border-[#f0f0f0]">
                                  {item.evidenceAvailable.length > 0 && (
                                    <span className="text-[9px] text-[#16a34a] font-medium">{item.evidenceAvailable.length} evidence on file</span>
                                  )}
                                  {item.evidenceMissing.length > 0 && (
                                    <span className="text-[9px] text-[#dc2626] font-medium">{item.evidenceMissing.length} evidence needed</span>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}

                {repairData.negativeItems.filter(n => n.userAttestation !== "recognized").length > 0 && (
                  <button
                    onClick={() => {
                      const eligible = repairData.negativeItems.filter(n => n.userAttestation !== "recognized");
                      const needsAttestation = eligible.filter(n => n.attestationRequired && !n.userAttestation);
                      if (needsAttestation.length > 0) {
                        alert(`${needsAttestation.length} items need your attestation first. Mark inquiries as "Not Authorized" or "I Recognize This" before generating.`);
                        return;
                      }
                      const inquiries = eligible.filter(n => n.category === "Inquiry");
                      const others = eligible.filter(n => n.category !== "Inquiry");
                      let prompt = "Generate dispute letters for ALL of the following items. Use the ACTUAL creditor names, dates, and account details — do NOT use placeholder text.\n\n";
                      if (inquiries.length > 0) {
                        const byRound: Record<number, typeof inquiries> = {};
                        inquiries.forEach(n => { const r = n.disputeRound || 1; if (!byRound[r]) byRound[r] = []; byRound[r].push(n); });
                        const inqDateGroups: Record<string, number> = {};
                        inquiries.forEach(n => { if (n.dates?.inquiryDate) { inqDateGroups[n.dates.inquiryDate] = (inqDateGroups[n.dates.inquiryDate] || 0) + 1; } });
                        const inqClusterDates = Object.entries(inqDateGroups).filter(([, c]) => c > 1);
                        prompt += `INQUIRY VELOCITY: ${inquiries.length} inquiry disputes.`;
                        if (inqClusterDates.length > 0) {
                          prompt += ` Cluster dates: ${inqClusterDates.map(([d, c]) => `${d} (${c} inquiries)`).join(", ")}. Flag these clusters as potential unauthorized batch pulls.`;
                        }
                        prompt += "\n\n";
                        const roundInstructions: Record<number, string> = {
                          1: "ROUND 1: Request documentation of permissible purpose under FCRA §604. Use 'I do not recognize / do not recall authorizing' framing.",
                          2: "ROUND 2: Follow-up. Demand method of verification under FCRA §611(a)(6)(B)(iii).",
                          3: "ROUND 3: Final escalation. Mention CFPB, FTC, state AG complaints. Reserve rights under §616/§617."
                        };
                        for (const [round, items] of Object.entries(byRound).sort((a, b) => Number(a[0]) - Number(b[0]))) {
                          prompt += `--- INQUIRY DISPUTES: ${roundInstructions[Number(round)] || roundInstructions[1]} ---\n`;
                          items.forEach(n => {
                            const dateInfo = n.dates?.inquiryDate ? `, inquiry date: ${n.dates.inquiryDate}` : "";
                            const isCluster = n.dates?.inquiryDate && inqDateGroups[n.dates.inquiryDate] > 1;
                            prompt += `- ${n.furnisherName} (${n.bureau}${dateInfo}${n.userAttestation === "not_authorized" ? ", NOT AUTHORIZED per user" : ""}${isCluster ? ", CLUSTER — same-day inquiry" : ""})\n`;
                          });
                          prompt += "\n";
                        }
                      }
                      if (others.length > 0) {
                        prompt += "--- OTHER DISPUTE ITEMS ---\n";
                        others.forEach(n => {
                          const dateInfo = n.dates ? Object.entries(n.dates).filter(([,v]) => v).map(([k,v]) => `${k}: ${v}`).join(", ") : "";
                          const acctInfo = n.accountPartial ? ` (acct: ${n.accountPartial})` : "";
                          prompt += `- ${n.furnisherName}${acctInfo}: ${n.issue} (${n.bureau}, basis: ${n.disputeBasis}${dateInfo ? `, ${dateInfo}` : ""}${n.userAttestation === "not_authorized" ? ", NOT AUTHORIZED per user" : ""})\n`;
                        });
                      }
                      prompt += "\nIMPORTANT: After the letters, output a DISPUTE: line for EACH disputed item in this exact format:\nDISPUTE: CreditorName | AccountNumber | Issue Description | Bureau | Reason/Basis\nThen output [GENERATE_DISPUTE_PACKAGE] at the very end.";
                      onSendChat(prompt);
                    }}
                    className="mt-3 w-full py-2 rounded-md bg-[#1a1a2e] text-white text-[10px] font-semibold hover:bg-[#2a2a4e] transition-colors"
                    data-testid="button-generate-all-disputes"
                  >
                    Generate All Bureau Challenges ({repairData.negativeItems.filter(n => n.userAttestation !== "recognized").length})
                  </button>
                )}
              </>);
            })()}
          </>)}
        </div>

        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><rect x="1" y="2" width="10" height="8" rx="1" stroke="#333" strokeWidth="1" fill="none"/><path d="M3 5h6M3 7h4" stroke="#333" strokeWidth="0.7" strokeLinecap="round"/></svg>
            <span className="text-[9px] font-semibold text-[#555] uppercase tracking-wider">Document Generator</span>
          </div>
          <div className="grid grid-cols-2 gap-1">
            {[
              { type: "cfpb_complaint" as const, label: "CFPB Complaint", desc: "Consumer Financial Protection Bureau" },
              { type: "goodwill_letter" as const, label: "Goodwill Letter", desc: "Request removal of negative mark" },
              { type: "identity_theft_affidavit" as const, label: "ID Theft Affidavit", desc: "Report fraudulent accounts" },
              { type: "bureau_escalation" as const, label: "Bureau Escalation", desc: "Escalate after failed dispute" },
            ].map(docType => {
              const firstNeg = repairData?.negativeItems?.[0];
              return (
                <button
                  key={docType.type}
                  onClick={async () => {
                    try {
                      const resp = await fetch("/api/generate-document", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                          documentType: docType.type,
                          creditor: firstNeg?.furnisher || undefined,
                          bureau: firstNeg?.bureau || undefined,
                          accountNumber: firstNeg?.accountNumber || undefined,
                          issue: firstNeg?.issue || undefined,
                          userInfo: {
                            fullName: userProfile.fullName,
                            address: userProfile.address,
                            dob: userProfile.dob,
                            ssn4: userProfile.ssn4,
                          },
                        }),
                      });
                      const data = await resp.json();
                      if (data.downloadUrl) {
                        const link = document.createElement("a");
                        link.href = data.downloadUrl;
                        link.download = `profundr-${docType.type.replace(/_/g, "-")}.pdf`;
                        link.click();
                      }
                    } catch {}
                  }}
                  className="rounded-md border border-dashed border-[#ddd] bg-[#fcfcfc] hover:bg-white hover:border-[#ccc] transition-all px-2 py-1.5 text-left"
                  data-testid={`button-generate-${docType.type}`}
                >
                  <p className="text-[8px] font-semibold text-[#333]">{docType.label}</p>
                  <p className="text-[7px] text-[#aaa] leading-[1.2]">{docType.desc}</p>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mb-3">
          <div className="flex items-center gap-1.5 mb-1.5">
            <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M3 1h6l2 3v6a1 1 0 01-1 1H2a1 1 0 01-1-1V4l2-3z" stroke="#333" strokeWidth="1" fill="none"/><path d="M4.5 6h3M4.5 8h2" stroke="#333" strokeWidth="0.8" strokeLinecap="round"/></svg>
            <span className="text-[9px] font-semibold text-[#555] uppercase tracking-wider">Evidence Vault</span>
            <span className="text-[8px] text-[#aaa] ml-auto" style={{ fontVariantNumeric: "tabular-nums" }}>{creditReports.length + idDocs.length + bankDocs.length + residencyDocs.length}</span>
          </div>

          <input ref={idInputRef} type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={handleUploadDoc} data-testid="input-id-upload" />
          <input ref={bankInputRef} type="file" accept=".pdf,.csv,.txt" className="hidden" onChange={handleUploadDoc} data-testid="input-bank-upload" />
          <input ref={residencyInputRef} type="file" accept=".jpg,.jpeg,.png" className="hidden" onChange={handleUploadDoc} data-testid="input-residency-upload" />

          <div className="rounded-lg border border-[#e8e8e8] bg-white overflow-hidden divide-y divide-[#f0f0f0]">
            {[
              { label: "Bureau Report", icon: <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><rect x="2" y="1" width="8" height="10" rx="1" stroke="currentColor" strokeWidth="1" fill="none"/><path d="M4 4h4M4 6h4M4 8h2" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round"/></svg>, docs: creditReports, type: "credit_report" as const, onUpload: () => { setUploadTarget("credit_report"); docInputRef.current?.click(); } },
              { label: "Government ID", icon: <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><rect x="1" y="3" width="10" height="7" rx="1" stroke="currentColor" strokeWidth="1" fill="none"/><circle cx="4" cy="6.5" r="1.2" stroke="currentColor" strokeWidth="0.7" fill="none"/><path d="M6.5 5.5h3M6.5 7.5h2" stroke="currentColor" strokeWidth="0.7" strokeLinecap="round"/></svg>, docs: idDocs, type: "id_document" as const, onUpload: () => { setUploadTarget("id_document"); idInputRef.current?.click(); } },
              { label: "Bank Statement", icon: <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M2 3l4-2 4 2v1H2V3z" stroke="currentColor" strokeWidth="0.8" fill="none"/><path d="M3 5v4M5 5v4M7 5v4M9 5v4" stroke="currentColor" strokeWidth="0.7"/><path d="M1.5 10h9" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round"/></svg>, docs: bankDocs, type: "bank_statement" as const, onUpload: () => { setUploadTarget("bank_statement"); bankInputRef.current?.click(); } },
              { label: "Proof of Residency", icon: <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><path d="M6 1L1 5.5V11h3.5V8h3v3H11V5.5L6 1z" stroke="currentColor" strokeWidth="0.9" fill="none" strokeLinejoin="round"/></svg>, docs: residencyDocs, type: "proof_of_residency" as const, onUpload: () => { setUploadTarget("proof_of_residency"); residencyInputRef.current?.click(); } },
            ].map(slot => {
              const hasDocs = slot.docs.length > 0;
              return (
                <div key={slot.type} className="px-2.5 py-2" data-testid={`vault-slot-${slot.type}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5">
                      <span className={hasDocs ? "text-[#1a1a2e]" : "text-[#bbb]"}>{slot.icon}</span>
                      <span className={`text-[8px] font-semibold ${hasDocs ? "text-[#333]" : "text-[#aaa]"}`}>{slot.label}</span>
                      {hasDocs && <span className="text-[6px] text-white bg-[#2d6a4f] rounded px-1 py-[1px] font-bold">{slot.docs.length}</span>}
                    </div>
                    <button
                      onClick={slot.onUpload}
                      className={`flex items-center gap-0.5 text-[7px] font-medium px-1 py-0.5 rounded transition-colors ${hasDocs ? "text-[#1a1a2e] hover:bg-[#f0f0f0]" : "text-[#999] hover:text-[#666]"}`}
                      data-testid={`button-upload-${slot.type}`}
                    >
                      <svg width="7" height="7" viewBox="0 0 8 8" fill="none"><path d="M4 6V2M4 2L2.5 3.5M4 2l1.5 1.5" stroke="currentColor" strokeWidth="0.8" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      {hasDocs ? "Replace" : "Upload"}
                    </button>
                  </div>
                  {hasDocs && (
                    <div className="mt-1 space-y-0.5 pl-[18px]">
                      {slot.docs.map(doc => (
                        <div key={doc.id} className="flex items-center gap-1.5 group">
                          <p className="text-[7px] text-[#666] truncate flex-1">{doc.name}</p>
                          <span className="text-[7px] text-[#ccc]" style={{ fontVariantNumeric: "tabular-nums" }}>{formatDate(doc.savedAt)}</span>
                          <button onClick={() => onDelete(doc.id)} className="opacity-0 group-hover:opacity-100 text-[#ccc] hover:text-red-400 transition-all" data-testid={`button-delete-vault-${doc.id}`}>
                            <svg width="7" height="7" viewBox="0 0 8 8" fill="none"><path d="M2 2l4 4M6 2l-4 4" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/></svg>
                          </button>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <div className="mt-2 rounded-lg border border-[#eee] bg-[#fafafa] px-2.5 py-2">
            <div className="flex items-center gap-1.5 mb-1.5">
              <svg width="9" height="9" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="4" r="2.5" stroke="#555" strokeWidth="0.9" fill="none"/><path d="M2 10.5c0-2.2 1.8-4 4-4s4 1.8 4 4" stroke="#555" strokeWidth="0.9" strokeLinecap="round"/></svg>
              <span className="text-[8px] font-semibold text-[#555]">Report Signature</span>
              {profileSaved && <span className="text-[6px] text-[#2d6a4f] font-medium ml-auto">Saved</span>}
            </div>
            <div className="grid grid-cols-2 gap-x-1.5 gap-y-1">
              {[
                { key: "fullName" as const, label: "Full Name", placeholder: "As shown on ID" },
                { key: "dob" as const, label: "Date of Birth", placeholder: "MM/DD/YYYY" },
                { key: "address" as const, label: "Address", placeholder: "Street, City, State ZIP" },
                { key: "ssn4" as const, label: "SSN (last 4)", placeholder: "••••" },
              ].map(f => (
                <div key={f.key} className={f.key === "address" ? "col-span-2" : ""}>
                  <label className="text-[6px] text-[#aaa] uppercase tracking-wider font-semibold block mb-[2px]">{f.label}</label>
                  <input
                    type={f.key === "ssn4" ? "password" : "text"}
                    maxLength={f.key === "ssn4" ? 4 : f.key === "dob" ? 10 : 120}
                    value={userProfile[f.key] || ""}
                    onChange={e => {
                      setProfileSaved(false);
                      const updated = { ...userProfile, [f.key]: e.target.value };
                      onUpdateProfile(updated);
                    }}
                    placeholder={f.placeholder}
                    className="w-full text-[8px] text-[#333] bg-white border border-[#e5e5e5] rounded px-1.5 py-[5px] outline-none focus:border-[#1a1a2e] transition-colors placeholder:text-[#ccc]"
                    data-testid={`input-profile-${f.key}`}
                  />
                </div>
              ))}
            </div>
            <button
              onClick={() => {
                onUpdateProfile(userProfile);
                setProfileSaved(true);
              }}
              disabled={!userProfile.fullName && !userProfile.address}
              className="mt-1.5 w-full py-1 rounded bg-[#1a1a2e] text-white text-[7px] font-semibold uppercase tracking-wider hover:bg-[#2a2a40] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              data-testid="button-save-signature"
            >
              {profileSaved ? "Saved" : "Save & Apply"}
            </button>
          </div>
        </div>
        </>)}

        {panelTab === "documents" && (<>
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

        {aisReport?.suppressors && aisReport.suppressors.length > 0 && (
          <div className="mb-4">
            <div className="flex items-center gap-2 mb-2">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1v2M6 9v2M1 6h2M9 6h2M2.5 2.5l1.4 1.4M8.1 8.1l1.4 1.4M9.5 2.5l-1.4 1.4M3.9 8.1l-1.4 1.4" stroke="#c0392b" strokeWidth="1" strokeLinecap="round" /></svg>
              <span className="text-[10px] font-semibold text-[#555] uppercase tracking-wider">Denial Risk Drivers</span>
            </div>
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
        </>)}

        {panelTab === "command" && (<>
        <div className="w-full h-px bg-[#eee] my-3"></div>
        {hasAis && aisReport && (
          <div className="mb-3" data-testid="next-moves-section">
            {(() => {
              const tradelines = aisReport.openTradelines || [];
              const parseAge = (age: string): number => { const m = age.match(/(\d+)\s*yr/i); return m ? parseInt(m[1]) : 0; };
              const isPrimary = (o: string) => /primary/i.test(o);
              const isAU = (o: string) => /\bau\b|authorized/i.test(o);
              const isRev = (t: string) => /revolv|credit\s*card|loc\b|heloc/i.test(t);
              const isInst = (t: string) => /install|auto|student|mortgage|personal\s*loan/i.test(t);

              const primaryRev = tradelines.filter(tl => isRev(tl.type) && isPrimary(tl.ownership));
              const primaryInst = tradelines.filter(tl => isInst(tl.type) && isPrimary(tl.ownership));
              const auCount = tradelines.filter(tl => isAU(tl.ownership)).length;

              const revLimits = primaryRev.map(tl => parseInt(tl.limit.replace(/[^0-9]/g, "")) || 0);
              const totalLimit = revLimits.reduce((s, l) => s + l, 0);
              const totalBal = primaryRev.reduce((s, tl) => s + (parseInt(tl.balance.replace(/[^0-9]/g, "")) || 0), 0);
              const avgUtil = totalLimit > 0 ? Math.round((totalBal / totalLimit) * 100) : 0;
              const avgAge = tradelines.length > 0 ? Math.round(tradelines.reduce((s, tl) => s + parseAge(tl.age), 0) / tradelines.length) : 0;
              const highestRevLimit = revLimits.length > 0 ? Math.max(...revLimits) : 0;
              const qualifyingLimitCount = primaryRev.filter(tl => (parseInt(tl.limit.replace(/[^0-9]/g, "")) || 0) >= 5000).length;

              type GoalRow = { label: string; current: string; target: string; met: boolean; priority: number; tip: string };
              const revNeeded = Math.max(0, 4 - primaryRev.length);
              const goals: GoalRow[] = [
                { label: "Revolvers", current: `${primaryRev.length}`, target: "3–5", met: primaryRev.length >= 3, priority: primaryRev.length >= 3 ? 0 : revNeeded, tip: primaryRev.length >= 3 ? "" : `Open ${revNeeded}, stagger 60–90d` },
                { label: "Installment", current: `${primaryInst.length}`, target: "1–2", met: primaryInst.length >= 1, priority: primaryInst.length >= 1 ? 0 : 2, tip: primaryInst.length >= 1 ? "" : "Add credit builder or personal loan" },
                { label: "Per-Card Limit", current: revLimits.length > 0 ? `${qualifyingLimitCount}/${primaryRev.length}` : "—", target: "$5K+", met: qualifyingLimitCount >= primaryRev.length && primaryRev.length > 0, priority: primaryRev.length > 0 ? primaryRev.length - qualifyingLimitCount : 3, tip: qualifyingLimitCount >= primaryRev.length && primaryRev.length > 0 ? "" : "Request CLI on sub-$5K cards" },
                { label: "Highest Card", current: highestRevLimit > 0 ? `$${(highestRevLimit/1000).toFixed(0)}K` : "—", target: "$10K+", met: highestRevLimit >= 10000, priority: highestRevLimit >= 10000 ? 0 : 3, tip: highestRevLimit >= 10000 ? "" : "CLI your top card — unlocks limit matching" },
                { label: "Total Limits", current: `$${(totalLimit/1000).toFixed(0)}K`, target: "$25K+", met: totalLimit >= 25000, priority: totalLimit >= 25000 ? 0 : 3, tip: totalLimit >= 25000 ? "" : "Grow via CLI + new approvals" },
                { label: "Utilization", current: `${avgUtil}%`, target: "1–9%", met: avgUtil >= 1 && avgUtil <= 9, priority: avgUtil <= 9 ? 0 : avgUtil > 30 ? 4 : 2, tip: avgUtil <= 9 ? "" : avgUtil > 30 ? "Pay down — no card above 30%" : "Reduce to 1–9% aggregate" },
                { label: "Avg Age", current: `${avgAge}yr`, target: "3+yr", met: avgAge >= 3, priority: avgAge >= 3 ? 0 : 2, tip: avgAge >= 3 ? "" : "Hold accounts open, avoid new apps" },
                { label: "AU Reliance", current: auCount > 0 ? `${auCount}` : "0", target: "≤1", met: auCount <= 1, priority: auCount <= 1 ? 0 : auCount >= 3 ? 3 : 1, tip: auCount <= 1 ? "" : "Shift to primary accounts" },
              ];

              const sortedGoals = [...goals].sort((a, b) => b.priority - a.priority);
              const metCount = goals.filter(g => g.met).length;

              return (
                <div>
                  <div className="rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#252540] p-2 mb-1.5">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <svg width="10" height="10" viewBox="0 0 12 12" fill="none"><path d="M2 2h8v8H2z" stroke="white" strokeWidth="1" fill="none" rx="1" opacity="0.5" /><path d="M4 5l1.5 1.5L8 4" stroke="white" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" /></svg>
                        <p className="text-[7px] uppercase tracking-[0.1em] text-white/40 font-semibold">Next Moves</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <p className="text-[10px] font-bold text-white" style={{ fontVariantNumeric: "tabular-nums" }}>{metCount}<span className="text-[8px] font-normal text-white/35">/{goals.length}</span></p>
                        <div className="flex gap-[2px]">
                          {goals.map((g, gi) => (
                            <div key={gi} className={`w-[4px] h-[12px] rounded-[1px] ${g.met ? "bg-[#2d6a4f]" : "bg-white/10"}`} />
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div className="rounded-lg border border-[#e8e8e8] bg-white overflow-hidden">
                    <div className="grid grid-cols-[auto_1fr_auto_auto] gap-x-2.5 px-2 py-[4px] bg-[#f8f8f8] border-b border-[#eee]">
                      <span className="text-[6px] text-[#aaa] uppercase tracking-wider w-3"></span>
                      <span className="text-[6px] text-[#aaa] uppercase tracking-wider">Metric</span>
                      <span className="text-[6px] text-[#aaa] uppercase tracking-wider text-right">Now</span>
                      <span className="text-[6px] text-[#aaa] uppercase tracking-wider text-right">Target</span>
                    </div>
                    {sortedGoals.map((g, gi) => (
                      <div key={gi} className={`grid grid-cols-[auto_1fr_auto_auto] gap-x-2.5 items-center px-2 py-[5px] ${gi < sortedGoals.length - 1 ? "border-b border-[#f5f5f5]" : ""} ${!g.met ? "bg-[#fffdf8]" : ""}`} data-testid={`goal-item-${gi}`}>
                        <div className={`w-[8px] h-[8px] rounded-[2px] flex items-center justify-center flex-shrink-0 ${g.met ? "bg-[#2d6a4f]" : "border border-[#ddd]"}`}>
                          {g.met && <svg width="5" height="5" viewBox="0 0 10 10" fill="none"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                        </div>
                        <span className={`text-[8px] font-medium ${g.met ? "text-[#888]" : "text-[#333]"}`}>{g.label}</span>
                        <span className={`text-[8px] font-bold text-right ${g.met ? "text-[#2d6a4f]" : "text-[#333]"}`} style={{ fontVariantNumeric: "tabular-nums" }}>{g.current}</span>
                        <span className="text-[7px] text-[#999] text-right" style={{ fontVariantNumeric: "tabular-nums" }}>{g.target}</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })()}
          </div>
        )}

        {!hasAis && null}

        <div className="w-full h-px bg-[#eee] my-3"></div>
        <TeamSection user={user} onOpenTeamChat={onOpenTeamChat} activeTeamChatId={activeTeamChatId} />
        </>)}

        {panelTab === "documents" && (<>
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
        </>)}
      </div>

      <input ref={docInputRef} type="file" className="hidden" onChange={handleUploadDoc} data-testid="input-doc-upload" />
      <input ref={commandUploadRef} type="file" accept=".pdf,.txt,.csv,.html" className="hidden" onChange={handleUploadDoc} data-testid="input-command-upload" />
      {panelTab === "documents" && (
      <div className="px-4 py-3 border-t border-[#eee]">
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
      )}
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
  const [streamingMsgId, setStreamingMsgId] = useState<number | null>(null);
  const [nextId, setNextId] = useState(1);
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string; isPdf?: boolean } | null>(null);
  const [autoSendFile, setAutoSendFile] = useState(false);
  const [docsOpen, setDocsOpen] = useState(false);
  const [savedDocs, setSavedDocs] = useState<SavedDoc[]>(loadSavedDocs);
  const [userProfile, setUserProfile] = useState<UserProfile>(loadUserProfile);
  const handleUpdateProfile = useCallback((p: UserProfile) => { setUserProfile(p); saveUserProfile(p); }, []);
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
  const [repairData, setRepairData] = useState<RepairData | null>(loadRepairData);
  const [showAisOverlay, setShowAisOverlay] = useState(false);
  const teamConvoLoaded = useRef(false);
  const teamChatLoaded = useRef(false);
  const lastSeenMsgId = useRef(0);
  const isSendingRef = useRef(false);
  const { user, logout } = useAuth();
  const prevUserRef = useRef<typeof user>(undefined);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const [showScrollBtn, setShowScrollBtn] = useState(false);
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

  useEffect(() => {
    const el = scrollAreaRef.current;
    if (!el) return;
    const onScroll = () => {
      const distFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight;
      setShowScrollBtn(distFromBottom > 200);
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (streamingMsgId === null) return;
    const interval = setInterval(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 400);
    return () => clearInterval(interval);
  }, [streamingMsgId]);

  const resetChat = () => {
    setGuestMessages([]);
    setShowScrollBtn(false);
    setStreamingMsgId(null);
  };

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
        if (!user && previewCount >= 5) {
          setShowInitiationGate(true);
          return;
        }
        setAisReport(null);
        try { localStorage.removeItem("profundr_ais_report"); } catch {}
        setRepairData(null);
        try { localStorage.removeItem("profundr_repair_data"); } catch {}
        doSend("Analyze my report and generate my AIS.", fileData);
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

  const buildDocContext = () => {
    const cr = savedDocs.filter(d => d.type === "credit_report");
    const id = savedDocs.filter(d => d.type === "id_document");
    const bs = savedDocs.filter(d => d.type === "bank_statement");
    const pr = savedDocs.filter(d => d.type === "proof_of_residency");
    if (cr.length === 0 && id.length === 0 && bs.length === 0 && pr.length === 0 && !repairData) return undefined;
    const creditReportTexts: string[] = [];
    for (const doc of cr) {
      if (doc.extractedText) creditReportTexts.push(doc.extractedText);
    }
    const ctx: Record<string, unknown> = {
      hasCreditReport: cr.length > 0,
      hasId: id.length > 0,
      hasBankStatement: bs.length > 0,
      hasProofOfResidency: pr.length > 0,
      creditReportNames: cr.map(d => d.name),
      bankStatementNames: bs.map(d => d.name),
      creditReportTexts: creditReportTexts.length > 0 ? creditReportTexts : undefined,
    };
    if (repairData) {
      ctx.repairData = repairData;
    }
    return ctx;
  };

  const buildProfilePayload = () => {
    const p = userProfile;
    if (!p.fullName && !p.address && !p.dob && !p.ssn4) return undefined;
    return { fullName: p.fullName, address: p.address, dob: p.dob, ssn4: p.ssn4 };
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
          userProfile: buildProfilePayload(),
          documentContext: buildDocContext(),
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

        if (data.extractedText && file) {
          setSavedDocs(prev => {
            const crDocs = prev.filter(d => d.type === "credit_report");
            const match = crDocs.find(d => d.name === file!.name) || crDocs[crDocs.length - 1];
            if (match && !match.extractedText) {
              const updated = prev.map(d => d === match ? { ...d, extractedText: data.extractedText } : d);
              try { localStorage.setItem("profundr_saved_docs", JSON.stringify(updated)); } catch {}
              return updated;
            }
            return prev;
          });
        }

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
      const payload: Record<string, unknown> = {
        content: text,
        history: cleanHistory,
        userProfile: buildProfilePayload(),
        documentContext: buildDocContext(),
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
        lastSeenMsgId.current = Math.max(lastSeenMsgId.current, stored.id);
        setGuestMessages(prev => prev.map(m => m.id === userMsg.id ? { ...m, id: stored.id + 100000 } : m));
      }

      if (!res.ok) throw new Error("Failed to get response");
      const data = await res.json();
      let responseContent = data.content;

      if (data.extractedText && file) {
        setSavedDocs(prev => {
          const crDocs = prev.filter(d => d.type === "credit_report");
          const match = crDocs.find(d => d.name === file.name) || crDocs[crDocs.length - 1];
          if (match && !match.extractedText) {
            const updated = prev.map(d => d === match ? { ...d, extractedText: data.extractedText } : d);
            try { localStorage.setItem("profundr_saved_docs", JSON.stringify(updated)); } catch {}
            return updated;
          }
          if (!match) {
            const newDoc: SavedDoc = {
              id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
              name: file.name,
              type: "credit_report",
              savedAt: Date.now(),
              extractedText: data.extractedText,
            };
            const updated = [newDoc, ...prev];
            try { localStorage.setItem("profundr_saved_docs", JSON.stringify(updated)); } catch {}
            return updated;
          }
          return prev;
        });
      }

      const hasRepairStart = responseContent.includes("REPAIR_DATA_START");
      const hasRepairEnd = responseContent.includes("REPAIR_DATA_END");
      console.log(`[doSend] responseLen=${responseContent.length}, hasRepairStart=${hasRepairStart}, hasRepairEnd=${hasRepairEnd}`);
      const parsedRepair = parseRepairData(responseContent);
      console.log(`[doSend] parsedRepair=${parsedRepair ? `found ${parsedRepair.negativeItems.length} items` : "null"}`);
      if (parsedRepair) {
        const merged = repairData ? {
          ...parsedRepair,
          negativeItems: parsedRepair.negativeItems.map(ni => {
            const existing = repairData.negativeItems.find(e => e.itemId === ni.itemId);
            return existing?.userAttestation ? { ...ni, userAttestation: existing.userAttestation, status: existing.status } : ni;
          }),
        } : parsedRepair;
        setRepairData(merged);
        saveRepairData(merged);
      }
      responseContent = filterRepairDataFromContent(responseContent);

      if (!user) {
        const newCount = previewCount + 1;
        setPreviewCount(newCount);
        setGuestPreviewCount(newCount);
        const remaining = 5 - newCount;
        if (remaining > 0) {
          responseContent += `\n\n---\n\n*${remaining} complimentary chat${remaining === 1 ? "" : "s"} remaining. Subscribe to unlock the full system — AIS, dispute letters, funding projections, and unlimited analysis.*`;
        } else if (remaining === 0) {
          responseContent += "\n\n---\n\n**Your complimentary chats are complete.**\n\nSubscribe to access the full system — AIS scoring, dispute generation, funding projections, and unlimited analysis. $50/mo, cancel anytime.";
        }
      }

      const hasDisputePackageTrigger = responseContent.includes("[GENERATE_DISPUTE_PACKAGE]");
      responseContent = responseContent.replace(/\[GENERATE_DISPUTE_PACKAGE\]/g, "").trim();

      const isDisputeGenRequest = /generate.*(?:dispute|round\s*[123]|bureau\s*challenge)|(?:dispute|round\s*[123]).*letter|build\s*dispute|create\s*(?:my\s*)?dispute|ROUND\s*[123].*inquiry\s*dispute/i.test(text);
      const shouldAutoGeneratePdf = hasDisputePackageTrigger || isDisputeGenRequest;

      const aiMsgId = nextId + 1;
      const aiMsg: GuestMessage = { id: aiMsgId, role: "assistant", content: responseContent };
      setGuestMessages((prev) => [...prev, aiMsg]);
      setNextId((n) => n + 1);
      const isStructured = /(?:STRATEGY_DATA_START|TRADELINE:|DISPUTE:.*\|.*\||Pillar\s*Scores:|Payment\s*Integrity:\s*\d|Utilization\s*Control:\s*\d|AIS.*(?:Approval\s*Index|Score).*:\s*\d)/i.test(responseContent);
      if (!isStructured) {
        setStreamingMsgId(aiMsgId);
      }

      if (shouldAutoGeneratePdf) {
        let autoDisputes: { creditor: string; accountNumber: string; issue: string; bureau: string; reason: string; disputeRound?: number; category?: string }[] = [];
        if (repairData && repairData.negativeItems.length > 0) {
          autoDisputes = repairData.negativeItems.filter(item => item.userAttestation !== "recognized").map(item => ({
            creditor: item.furnisherName || "Unknown",
            accountNumber: item.accountPartial || "N/A",
            issue: item.issue || "Inaccurate reporting",
            bureau: item.bureau || "All",
            reason: item.disputeBasis || "Information is inaccurate per FCRA §611",
            disputeRound: item.disputeRound || 1,
            category: item.category || "Account",
          }));
        }
        if (autoDisputes.length === 0) {
          const inlineDisputes = parseDisputeItems(responseContent);
          if (inlineDisputes.length > 0) {
            autoDisputes = inlineDisputes;
          }
        }
        if (autoDisputes.length > 0) {
          const attachmentPages: { type: string; dataUrl: string; name: string }[] = [];
          for (const d of savedDocs) {
            if ((d.type === "id_document" || d.type === "proof_of_residency" || d.type === "bank_statement" || d.type === "credit_report") && d.fileDataUrl) {
              attachmentPages.push({ type: d.type, dataUrl: d.fileDataUrl, name: d.name });
            }
          }
          try {
            const payload: any = { disputes: autoDisputes, attachmentPages, letterContent: filterMarkdown(responseContent) };
            if (userProfile.fullName) payload.userName = userProfile.fullName;
            if (userProfile.address) payload.userAddress = userProfile.address;
            if (userProfile.ssn4) payload.ssnLast4 = userProfile.ssn4;
            if (userProfile.dob) payload.dob = userProfile.dob;
            const pdfRes = await fetch("/api/dispute-letters", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
            if (pdfRes.ok) {
              const pdfData = await pdfRes.json();
              if (pdfData.downloadUrl) {
                const dlRes = await fetch(pdfData.downloadUrl);
                if (dlRes.ok) {
                  const blob = await dlRes.blob();
                  const blobUrl = URL.createObjectURL(blob);
                  setGuestMessages(prev => prev.map(m => m.id === aiMsg.id ? { ...m, disputePackageUrl: blobUrl, disputeCount: autoDisputes.length } : m));
                }
              }
            }
          } catch (err) { console.error("Auto dispute package generation failed:", err); }
        }
      }

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

    if (!user && previewCount >= 5) {
      setShowInitiationGate(true);
      return;
    }

    if (text.startsWith("__VAULT_REPORT_UPLOAD__")) {
      const parts = text.split("__");
      const fileName = parts[2] || "report.pdf";
      const dataType = parts[3];
      const content = parts.slice(4).join("__");
      setAisReport(null);
      try { localStorage.removeItem("profundr_ais_report"); } catch {}
      setRepairData(null);
      try { localStorage.removeItem("profundr_repair_data"); } catch {}
      const vaultFile = dataType === "BASE64"
        ? { name: fileName, content, isPdf: true }
        : { name: fileName, content };
      doSend("Analyze my report and generate my AIS.", vaultFile);
      return;
    }

    const file = attachedFile;
    const msg = text || "Analyze my report and generate my AIS.";
    setInput("");
    setAttachedFile(null);
    if (file) {
      setAisReport(null);
      try { localStorage.removeItem("profundr_ais_report"); } catch {}
      setRepairData(null);
      try { localStorage.removeItem("profundr_repair_data"); } catch {}
    }
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

  const [isExporting, setIsExporting] = useState(false);
  const downloadChatAsJpg = useCallback(async () => {
    if (!hasMessages || isExporting) return;
    setIsExporting(true);
    try {
      const now = new Date();
      const dateStr = now.toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" });
      const timeStr = now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
      const userName = user?.displayName || user?.email || "User";

      const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

      const cleanContent = (text: string) => {
        return text
          .replace(/```[\s\S]*?```/g, "")
          .replace(/\[REPAIR_DATA\][\s\S]*?\[\/REPAIR_DATA\]/g, "")
          .replace(/\[STRATEGY_DATA\][\s\S]*?\[\/STRATEGY_DATA\]/g, "")
          .replace(/\[AIS_REPORT\][\s\S]*?\[\/AIS_REPORT\]/g, "")
          .replace(/\[USER_PROFILE\][\s\S]*?\[\/USER_PROFILE\]/g, "")
          .replace(/\[DOC_\d+\][\s\S]*?\[\/DOC_\d+\]/g, "")
          .replace(/\[Attached: .+?\]/g, "")
          .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
          .replace(/^\|.*\|$/gm, "")
          .replace(/^[-|: ]+$/gm, "")
          .replace(/^#{1,6}\s+/gm, "")
          .replace(/(\*\*|__)(.*?)\1/g, "$2")
          .replace(/(\*|_)(.*?)\1/g, "$2")
          .replace(/~~(.*?)~~/g, "$1")
          .replace(/`([^`]+)`/g, "$1")
          .replace(/\n{3,}/g, "\n\n")
          .trim();
      };

      const cleaned: { label: string; color: string; text: string }[] = [];
      displayMessages.forEach((msg) => {
        const clean = cleanContent(msg.content);
        if (!clean) return;
        const isUser = msg.role === "user";
        cleaned.push({
          label: isUser ? userName : (msg.role === "team" ? (msg.senderName || "Team") : "Profundr"),
          color: isUser ? "#1a1a2e" : msg.role === "team" ? "#6366f1" : "#2d6a4f",
          text: clean,
        });
      });

      const PAGE_W = 816;
      const PAGE_H = 1056;
      const PAD_X = 60;
      const PAD_TOP = 52;
      const PAD_BOT = 48;
      const HEADER_H = 72;
      const FOOTER_H = 36;

      const headerHtml = (pg: number, total: number) => `
        <div style="height:${HEADER_H}px;border-bottom:2px solid #1a1a2e;padding:0 0 14px;margin-bottom:24px;display:flex;align-items:flex-end;justify-content:space-between;">
          <div>
            <div style="font-size:20px;font-weight:700;color:#1a1a2e;letter-spacing:-0.02em;font-family:Inter,system-ui,sans-serif;">PROFUNDR</div>
            <div style="font-size:9px;color:#999;letter-spacing:0.1em;text-transform:uppercase;margin-top:3px;font-family:Inter,system-ui,sans-serif;">Capital Intelligence Report</div>
          </div>
          <div style="text-align:right;">
            <div style="font-size:10px;color:#555;font-weight:500;font-family:Inter,system-ui,sans-serif;">${esc(userName)}</div>
            <div style="font-size:9px;color:#aaa;font-family:Inter,system-ui,sans-serif;">${dateStr} &middot; ${timeStr}</div>
          </div>
        </div>`;

      const footerHtml = (pg: number, total: number) => `
        <div style="height:${FOOTER_H}px;border-top:1px solid #e0e0e0;display:flex;align-items:center;justify-content:space-between;margin-top:auto;padding-top:12px;">
          <div style="font-size:8px;color:#bbb;letter-spacing:0.06em;text-transform:uppercase;font-family:Inter,system-ui,sans-serif;">Profundr &middot; Confidential</div>
          <div style="font-size:8px;color:#bbb;font-family:Inter,system-ui,sans-serif;">Page ${pg} of ${total} &middot; ${dateStr}</div>
        </div>`;

      const bodyAvail = PAGE_H - PAD_TOP - PAD_BOT - HEADER_H - FOOTER_H - 24;

      const measure = document.createElement("div");
      measure.style.cssText = `position:fixed;left:-9999px;top:0;width:${PAGE_W - PAD_X * 2}px;font-family:Inter,system-ui,sans-serif;visibility:hidden;`;
      document.body.appendChild(measure);

      const pages: string[][] = [[]];
      let usedH = 0;

      for (const entry of cleaned) {
        const tmp = document.createElement("div");
        tmp.style.cssText = "margin-bottom:20px;";
        tmp.innerHTML = `
          <div style="display:flex;align-items:center;gap:7px;margin-bottom:5px;">
            <div style="width:5px;height:5px;border-radius:50%;background:${entry.color};flex-shrink:0;"></div>
            <div style="font-size:10px;font-weight:600;color:${entry.color};text-transform:uppercase;letter-spacing:0.04em;">${esc(entry.label)}</div>
          </div>
          <div style="font-size:12.5px;color:#333;line-height:1.8;padding-left:12px;white-space:pre-wrap;word-break:break-word;">${esc(entry.text)}</div>`;
        measure.appendChild(tmp);
        const h = tmp.offsetHeight;
        measure.removeChild(tmp);

        if (usedH + h > bodyAvail && pages[pages.length - 1].length > 0) {
          pages.push([]);
          usedH = 0;
        }
        pages[pages.length - 1].push(tmp.outerHTML);
        usedH += h;
      }

      document.body.removeChild(measure);

      const totalPages = pages.length;
      const canvases: HTMLCanvasElement[] = [];

      for (let pi = 0; pi < totalPages; pi++) {
        const container = document.createElement("div");
        container.style.cssText = `position:fixed;left:-9999px;top:0;width:${PAGE_W}px;height:${PAGE_H}px;background:#fff;font-family:Inter,system-ui,sans-serif;`;
        container.innerHTML = `<div style="padding:${PAD_TOP}px ${PAD_X}px ${PAD_BOT}px;height:100%;display:flex;flex-direction:column;">
          ${headerHtml(pi + 1, totalPages)}
          <div style="flex:1;overflow:hidden;">${pages[pi].join("")}</div>
          ${footerHtml(pi + 1, totalPages)}
        </div>`;
        document.body.appendChild(container);

        const html2canvas = (await import("html2canvas")).default;
        const cvs = await html2canvas(container, { scale: 2, backgroundColor: "#ffffff", useCORS: true, logging: false });
        canvases.push(cvs);
        document.body.removeChild(container);
      }

      if (canvases.length === 1) {
        canvases[0].toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `Profundr-Report-${now.toISOString().slice(0, 10)}.jpg`;
          a.click();
          URL.revokeObjectURL(url);
        }, "image/jpeg", 0.95);
      } else {
        const merged = document.createElement("canvas");
        merged.width = canvases[0].width;
        merged.height = canvases.reduce((s, c) => s + c.height, 0);
        const ctx = merged.getContext("2d")!;
        let y = 0;
        for (const c of canvases) {
          ctx.drawImage(c, 0, y);
          y += c.height;
        }
        merged.toBlob((blob) => {
          if (!blob) return;
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `Profundr-Report-${now.toISOString().slice(0, 10)}.jpg`;
          a.click();
          URL.revokeObjectURL(url);
        }, "image/jpeg", 0.92);
      }
    } catch (err) {
      console.error("Export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }, [displayMessages, hasMessages, isExporting, user]);

  const downloadChatAsPdf = useCallback(async () => {
    if (!hasMessages || isExporting) return;
    setIsExporting(true);
    try {
      const transcript = displayMessages.map(m => ({
        role: m.role === "assistant" ? "assistant" as const : "user" as const,
        content: m.content,
        timestamp: new Date().toISOString(),
      }));
      const res = await fetch("/api/chat/export-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: transcript }),
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `profundr-chat-${new Date().toISOString().slice(0, 10)}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("PDF export failed:", err);
    } finally {
      setIsExporting(false);
    }
  }, [displayMessages, hasMessages, isExporting]);

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
            <DocsPanel docs={savedDocs} onClose={() => setDocsOpen(false)} onDelete={handleDeleteDoc} onSave={handleSaveDoc} user={user} onOpenTeamChat={handleOpenTeamChat} activeTeamChatId={activeTeamChat?.id} aisReport={aisReport} onOpenAis={() => setShowAisOverlay(true)} userProfile={userProfile} onUpdateProfile={handleUpdateProfile} repairData={repairData} onUpdateRepairData={(data) => { setRepairData(data); saveRepairData(data); }} onSendChat={(msg) => { if (!msg.startsWith("__VAULT_REPORT_UPLOAD__")) setDocsOpen(false); setTimeout(() => handleSend(msg), 100); }} />
          </div>
        </>
      )}

      <div className="flex-1 flex flex-col min-w-0 h-full">
        <div ref={scrollAreaRef} className="flex-1 overflow-y-auto relative" data-testid="main-scroll-area">
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
                  onClick={async () => { await logout(); window.location.href = '/'; }}
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
                Upload Report
              </button>
              <p className="text-[11px] text-[#999] text-center max-w-[240px] leading-[1.6]" data-testid="text-upload-description">
                Profundr reviews your report like a bank would and shows your funding potential before you apply. No hard inquiry, no lending — just secure, clear analysis.
              </p>
            </div>
          ) : (
            <div className="w-full max-w-[720px] mx-auto px-4 pt-4 pb-2" data-testid="chat-messages">
              {displayMessages.some(m => m.role === "assistant" && /(?:STRATEGY_DATA_START|TRADELINE:|DISPUTE:.*\|.*\||Pillar\s*Scores:|Payment\s*Integrity:\s*\d)/i.test(m.content)) && (
              <div className="flex justify-end gap-1.5 mb-2">
                <button
                  onClick={downloadChatAsPdf}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium text-[#777] border border-[#e0e0e0] hover:bg-[#f5f5f5] hover:border-[#ccc] transition-colors disabled:opacity-50 disabled:cursor-wait"
                  title="Download conversation as PDF"
                  data-testid="button-download-chat-pdf"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2v8.5M8 10.5l-3-3M8 10.5l3-3M3 13h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {isExporting ? "Exporting..." : "Save as PDF"}
                </button>
                <button
                  onClick={downloadChatAsJpg}
                  disabled={isExporting}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full text-[10px] font-medium text-[#777] border border-[#e0e0e0] hover:bg-[#f5f5f5] hover:border-[#ccc] transition-colors disabled:opacity-50 disabled:cursor-wait"
                  title="Download conversation as image"
                  data-testid="button-download-chat"
                >
                  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                    <path d="M8 2v8.5M8 10.5l-3-3M8 10.5l3-3M3 13h10" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  {isExporting ? "Exporting..." : "Save as Image"}
                </button>
              </div>
              )}
              <div className="space-y-6">
                {displayMessages.map((msg, msgIdx) => {
                  const msgData = msg.role === "assistant" ? parseSingleMessageData(msg.content) : null;
                  const showDashboard = msgData && hasAnalysisData(msgData);
                  const disputes = msg.role === "assistant" ? parseDisputeItems(msg.content) : [];
                  const prevUserMsg = msg.role === "assistant" ? displayMessages.slice(0, msgIdx).reverse().find(m => m.role === "user") : null;

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
                      <div className={`flex gap-3 min-w-0 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                        {msg.role === "assistant" && (
                          <ProfundrAvatar size={28} className="mt-0.5 shrink-0" />
                        )}
                        <div
                          className={`max-w-[85%] min-w-0 overflow-hidden ${msg.role === "user" ? "bg-[#f0f0f0] rounded-[20px] rounded-br-[6px] px-4 py-2.5" : "bg-transparent"}`}
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
                          })() : (() => {
                            const isStructuredReport = /(?:STRATEGY_DATA_START|TRADELINE:|DISPUTE:.*\|.*\||Pillar\s*Scores:|Payment\s*Integrity:\s*\d|Utilization\s*Control:\s*\d|AIS.*(?:Approval\s*Index|Score).*:\s*\d)/i.test(msg.content);
                            const isCurrentlyStreaming = streamingMsgId === msg.id;
                            return isStructuredReport ? (
                              <BrandedResponse content={msg.content} userQuestion={prevUserMsg?.content} msgId={msg.id} />
                            ) : (
                              <ChatBubbleWithPdf
                                content={msg.content}
                                msgId={msg.id}
                                isCurrentlyStreaming={isCurrentlyStreaming}
                                onStreamComplete={() => setStreamingMsgId(null)}
                                chatMdComponents={chatMdComponents}
                                userQuestion={prevUserMsg?.content}
                              />
                            );
                          })()}
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
                              <DisputeDownloadButton disputes={disputes} onSave={handleSaveDisputeLetters} userProfile={userProfile} savedDocs={savedDocs} />
                            </div>
                          </div>
                        </div>
                      )}
                      {msg.disputePackageUrl && (
                        <div className="ml-10 mt-3">
                          <div className="rounded-xl bg-white border border-[#e8e8e8] p-4 shadow-sm" data-testid="card-dispute-package">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-5 h-5 rounded bg-green-50 flex items-center justify-center">
                                <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><path d="M4 8l3 3 5-5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                              </div>
                              <p className="text-[11px] font-medium text-[#333]">Dispute Package Ready</p>
                            </div>
                            <p className="text-[9px] text-[#888] mb-3">{msg.disputeCount || 0} dispute letter{(msg.disputeCount || 0) !== 1 ? "s" : ""} with all vault documents included</p>
                            <a
                              href={msg.disputePackageUrl}
                              download="profundr-dispute-package.pdf"
                              className="inline-flex items-center gap-2 px-4 py-2 bg-[#1a1a2e] text-white rounded-lg text-[12px] font-medium hover:bg-[#2a2a40] transition-colors"
                              data-testid="button-download-dispute-package"
                            >
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
                                <path d="M8 2v8M8 10L5 7M8 10l3-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                <path d="M3 12v1.5a.5.5 0 00.5.5h9a.5.5 0 00.5-.5V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                              </svg>
                              Download Dispute Package (PDF)
                            </a>
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

        {showScrollBtn && hasMessages && (
          <div className="w-full flex justify-center pb-2 shrink-0">
            <button
              onClick={scrollToBottom}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white border border-[#ddd] shadow-sm text-[10px] font-medium text-[#666] hover:bg-[#f5f5f5] hover:border-[#ccc] transition-all"
              data-testid="button-scroll-bottom"
            >
              <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
                <path d="M8 3v10M8 13l-3.5-3.5M8 13l3.5-3.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Back to bottom
            </button>
          </div>
        )}

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
                  Ask repair or funding questions, or upload your report for a full analysis.
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
              {hasMessages && (
                <button
                  type="button" onClick={resetChat}
                  className="w-9 h-9 flex items-center justify-center rounded-full text-[#888] hover:text-[#555] hover:bg-[#e5e5e5] transition-colors shrink-0"
                  title="New Chat" data-testid="button-reset-chat"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M13.5 8.5a5.5 5.5 0 1 1-1.1-3.3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                    <path d="M14 2v4h-4" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </button>
              )}
              <button
                type="button" onClick={handleUploadClick}
                className="w-9 h-9 flex items-center justify-center rounded-full text-[#888] hover:text-[#555] hover:bg-[#e5e5e5] transition-colors shrink-0"
                title="Upload report" data-testid="button-attach-file"
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
              {previewCount >= 5 ? "Complimentary chats exhausted" : `${5 - previewCount} complimentary chat${5 - previewCount === 1 ? "" : "s"} remaining`}
            </p>
          )}

          <p className="text-center text-[10px] text-[#bbb] mt-3 leading-[1.6] tracking-wide" data-testid="text-footer-legal">
            Insights for education only — not financial advice.{" "}
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
                Your 5 complimentary chats are complete. Subscribe to access full AIS scoring, dispute generation, funding projections, and unlimited analysis.
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
