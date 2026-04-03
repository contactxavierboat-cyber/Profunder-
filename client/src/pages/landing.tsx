import { useState, useRef, useEffect, useCallback, useMemo, createContext, useContext } from "react";
import { createPortal } from "react-dom";
import ReactMarkdown from "react-markdown";
import { useAuth } from "@/lib/store";
import { ProfundrLogo } from "@/components/profundr-logo";
import CommunityUnlocks from "@/components/community-unlocks";

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

interface CapitalUnlockScenario {
  condition: string;
  currentRange: string;
  projectedRange: string;
  projectedOdds: number;
}

interface StrategyData {
  steps: StrategyStep[];
  currentOdds: number;
  projectedOdds: number;
  currentFunding: string;
  projectedFunding: string;
  timeline: TimelineMilestone[];
  fundingMatches: FundingMatch[];
  capitalUnlock: CapitalUnlockScenario[];
}

interface BureauPullProbability {
  experian: number;
  transunion: number;
  equifax: number;
}

interface CapitalPotentialEntry {
  lender: string;
  product: string;
  lowEstimate: number;
  highEstimate: number;
  bureau: string;
  confidence: string;
  bureauProbability: BureauPullProbability;
  denialRisk: string;
}

interface FundingSequenceEntry {
  position: number;
  lender: string;
  product: string;
  approvalProbability: number;
  bureau: string;
  reasoning: string;
  exposureUnlock: string;
}

interface FundingTrend {
  lender: string;
  product: string;
  medianApproval: number;
  trend: string;
  bureau: string;
}

interface BureauHealth {
  bureau: string;
  score: number;
  inquiries: number;
  utilization: number;
  strength: string;
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
  capitalPotential: CapitalPotentialEntry[];
  fundingSequence: FundingSequenceEntry[];
  fundingTrends: FundingTrend[];
  bureauHealth: BureauHealth[];
  stackTiming: string;
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
          capitalUnlock: (parsed.capitalUnlock || []).map((u: any) => ({
            condition: u.condition || "",
            currentRange: u.currentRange || "",
            projectedRange: u.projectedRange || "",
            projectedOdds: Number(u.projectedOdds) || 0,
          })),
        };
      }
    } catch {}
  }

  const capitalPotential: CapitalPotentialEntry[] = [];
  let bureauHealth: BureauHealth[] = [];
  let stackTiming = "";
  const fundingTrends: FundingTrend[] = [];
  const cpBlockMatch = content.match(/CAPITAL_POTENTIAL_DATA_START\s*([\s\S]*?)\s*CAPITAL_POTENTIAL_DATA_END/);
  if (cpBlockMatch) {
    try {
      const parsed = JSON.parse(cpBlockMatch[1].trim());
      if (parsed && parsed.lenders) {
        for (const l of parsed.lenders) {
          const bp = l.bureauProbability || {};
          capitalPotential.push({
            lender: l.lender || "",
            product: l.product || "",
            lowEstimate: Number(l.lowEstimate) || 0,
            highEstimate: Number(l.highEstimate) || 0,
            bureau: l.bureau || "",
            confidence: l.confidence || "Medium",
            bureauProbability: { experian: Number(bp.experian) || 0, transunion: Number(bp.transunion) || 0, equifax: Number(bp.equifax) || 0 },
            denialRisk: l.denialRisk || "Moderate",
          });
        }
      }
      if (parsed && parsed.bureauHealth) {
        bureauHealth = parsed.bureauHealth.map((b: any) => ({
          bureau: b.bureau || "",
          score: Number(b.score) || 0,
          inquiries: Number(b.inquiries) || 0,
          utilization: Number(b.utilization) || 0,
          strength: b.strength || "Moderate",
        }));
      }
      if (parsed && parsed.stackTiming) {
        stackTiming = parsed.stackTiming;
      }
      if (parsed && parsed.fundingTrends) {
        for (const t of parsed.fundingTrends) {
          fundingTrends.push({
            lender: t.lender || "",
            product: t.product || "",
            medianApproval: Number(t.medianApproval) || 0,
            trend: t.trend || "Stable",
            bureau: t.bureau || "",
          });
        }
      }
    } catch {}
  }

  const fundingSequence: FundingSequenceEntry[] = [];
  const fsBlockMatch = content.match(/FUNDING_SEQUENCE_DATA_START\s*([\s\S]*?)\s*FUNDING_SEQUENCE_DATA_END/);
  if (fsBlockMatch) {
    try {
      const parsed = JSON.parse(fsBlockMatch[1].trim());
      if (parsed && parsed.sequence) {
        for (const s of parsed.sequence) {
          fundingSequence.push({
            position: Number(s.position) || 0,
            lender: s.lender || "",
            product: s.product || "",
            approvalProbability: Number(s.approvalProbability) || 0,
            bureau: s.bureau || "",
            reasoning: s.reasoning || "",
            exposureUnlock: s.exposureUnlock || "",
          });
        }
      }
    } catch {}
  }

  return { approvalIndex, band, phase, bureauSource, pillarScores, suppressors, helping, hurting, bestNextMove, financialIdentity, projectedFunding, openTradelines, strategyData, capitalPotential, fundingSequence, fundingTrends, bureauHealth, stackTiming };
}

function hasAnalysisData(data: MissionData): boolean {
  return data.approvalIndex !== null || data.band !== null || data.phase !== null || (data.pillarScores || []).length > 0 || (data.suppressors || []).length > 0 || (data.helping || []).length > 0 || (data.hurting || []).length > 0 || data.bestNextMove !== null || data.financialIdentity !== null || data.projectedFunding !== null || (data.openTradelines || []).length > 0 || (data.capitalPotential || []).length > 0 || (data.fundingSequence || []).length > 0;
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
    .replace(/CAPITAL_POTENTIAL_DATA_START[\s\S]*?CAPITAL_POTENTIAL_DATA_END/g, "")
    .replace(/FUNDING_SEQUENCE_DATA_START[\s\S]*?FUNDING_SEQUENCE_DATA_END/g, "")
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

function ChatPdfButton({ content, msgId, question, userName }: { content: string; msgId: number; question?: string; userName?: string }) {
  const [downloading, setDownloading] = useState(false);

  const handleDownload = async () => {
    if (downloading) return;
    setDownloading(true);
    try {
      const cleaned = filterMarkdown(content);
      const res = await fetch("/api/chat-pdf", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: cleaned, question: question || undefined, userName: userName || undefined }),
      });
      if (!res.ok) throw new Error("PDF generation failed");
      const { token } = await res.json();
      if (!token) throw new Error("No token");
      window.location.href = `/api/chat-pdf/${token}`;
    } catch (err) {
      console.error("PDF download failed:", err);
    } finally {
      setTimeout(() => setDownloading(false), 2000);
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

function ChatBubbleWithPdf({ content, msgId, isCurrentlyStreaming, onStreamComplete, chatMdComponents, userQuestion, userName }: {
  content: string; msgId: number; isCurrentlyStreaming: boolean; onStreamComplete: () => void; chatMdComponents: any; userQuestion?: string; userName?: string;
}) {
  return (
    <div className="overflow-hidden">
      <div>
        <div className="rounded-xl bg-gradient-to-br from-[#1a1a2e] to-[#252540] px-3.5 py-2 mb-2">
          <div className="flex items-center gap-2">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 opacity-60">
              <path d="M12 2C9.5 2 7.5 4 7.5 6.5c0 .5-.4 1-1 1C4.5 7.5 3 9.5 3 11.5c0 1.5.8 2.8 2 3.5 0 0-.5 1.5-.5 2.5C4.5 20 6.5 22 9 22c1.5 0 2.5-.5 3-1.5.5 1 1.5 1.5 3 1.5 2.5 0 4.5-2 4.5-4.5 0-1-.5-2.5-.5-2.5 1.2-.7 2-2 2-3.5 0-2-1.5-4-3.5-4-.6 0-1-.5-1-1C16.5 4 14.5 2 12 2z" />
              <path d="M12 2v20" /><path d="M7.5 7.5C9 8.5 10 10 10.5 12" /><path d="M16.5 7.5C15 8.5 14 10 13.5 12" />
            </svg>
            <div className="min-w-0 flex-1">
              <p className="text-[10px] text-white/50 leading-tight tracking-wide">Insights for education only — not financial advice.</p>
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
      {!isCurrentlyStreaming && <ChatPdfButton content={content} msgId={msgId} question={userQuestion} userName={userName} />}
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
  return filtered.replace(/STRATEGY_DATA_START[\s\S]*?STRATEGY_DATA_END/g, "").replace(/CAPITAL_POTENTIAL_DATA_START[\s\S]*?CAPITAL_POTENTIAL_DATA_END/g, "").replace(/FUNDING_SEQUENCE_DATA_START[\s\S]*?FUNDING_SEQUENCE_DATA_END/g, "").trim();
}

function parseAisBeforeStrip(content: string): MissionData | null {
  const parsed = parseSingleMessageData(content);
  if (hasAnalysisData(parsed)) return parsed;
  return null;
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
    <div className="pb-3 mb-3 border-b border-[#f0f0f0]" data-testid="capital-simulator">
      <p className="text-[10px] text-[#111] font-medium tracking-wide mb-3">Capital Simulator</p>

      <div className="space-y-3 mb-3">
        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-[#555]">Utilization</span>
            <span className="text-[9px] font-semibold text-[#111]" style={{ fontVariantNumeric: "tabular-nums" }}>{simUtil}%</span>
          </div>
          <input type="range" min="1" max={Math.max(baseUtil, 50)} value={simUtil} onChange={(e) => setSimUtil(parseInt(e.target.value))} className="w-full h-[3px] rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #111 ${((simUtil - 1) / (Math.max(baseUtil, 50) - 1)) * 100}%, #e5e5e5 ${((simUtil - 1) / (Math.max(baseUtil, 50) - 1)) * 100}%)` }} data-testid="slider-utilization" />
          <p className="text-[8px] text-[#bbb] mt-0.5 text-right">Current: {baseUtil}%</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-[#555]">Remove Inquiries</span>
            <span className="text-[9px] font-semibold text-[#111]" style={{ fontVariantNumeric: "tabular-nums" }}>{simInqRemove}</span>
          </div>
          <input type="range" min="0" max={Math.max(baseInq, 6)} value={simInqRemove} onChange={(e) => setSimInqRemove(parseInt(e.target.value))} className="w-full h-[3px] rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #111 ${(simInqRemove / Math.max(baseInq, 6)) * 100}%, #e5e5e5 ${(simInqRemove / Math.max(baseInq, 6)) * 100}%)` }} data-testid="slider-inquiries" />
          <p className="text-[8px] text-[#bbb] mt-0.5 text-right">{baseInq} on file</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-[#555]">Add Accounts</span>
            <span className="text-[9px] font-semibold text-[#111]" style={{ fontVariantNumeric: "tabular-nums" }}>+{simAddTradelines}</span>
          </div>
          <input type="range" min="0" max="5" value={simAddTradelines} onChange={(e) => setSimAddTradelines(parseInt(e.target.value))} className="w-full h-[3px] rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #111 ${(simAddTradelines / 5) * 100}%, #e5e5e5 ${(simAddTradelines / 5) * 100}%)` }} data-testid="slider-tradelines" />
          <p className="text-[8px] text-[#bbb] mt-0.5 text-right">{baseRev}R + {instCards.length}I</p>
        </div>

        <div>
          <div className="flex items-center justify-between mb-1">
            <span className="text-[9px] text-[#555]">Age Boost</span>
            <span className="text-[9px] font-semibold text-[#111]" style={{ fontVariantNumeric: "tabular-nums" }}>+{simAgeBoost * 6}mo</span>
          </div>
          <input type="range" min="0" max="4" value={simAgeBoost} onChange={(e) => setSimAgeBoost(parseInt(e.target.value))} className="w-full h-[3px] rounded-full appearance-none cursor-pointer" style={{ background: `linear-gradient(to right, #111 ${(simAgeBoost / 4) * 100}%, #e5e5e5 ${(simAgeBoost / 4) * 100}%)` }} data-testid="slider-age" />
          <p className="text-[8px] text-[#bbb] mt-0.5 text-right">Avg: {baseAge}yr</p>
        </div>
      </div>

      <div className={`rounded-md border p-2.5 transition-all ${hasChanges ? "bg-[#f7f7f7] border-[#ddd]" : "bg-[#fafafa] border-[#eee]"}`}>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <p className="text-[8px] text-[#999] mb-0.5">Approval Odds</p>
            <div className="flex items-center gap-1.5">
              <span className="text-[14px] font-semibold text-[#111]" style={{ fontVariantNumeric: "tabular-nums" }}>{hasChanges ? newOdds : currentOdds}%</span>
              {hasChanges && newOdds !== currentOdds && (
                <span className="text-[9px] font-medium text-[#2d6a4f]">+{newOdds - currentOdds}</span>
              )}
            </div>
          </div>
          <div>
            <p className="text-[8px] text-[#999] mb-0.5">Est. Funding</p>
            <p className="text-[10px] font-semibold text-[#111]" style={{ fontVariantNumeric: "tabular-nums" }}>{hasChanges ? newFunding : currentFunding}</p>
          </div>
        </div>
      </div>

      {hasChanges && (
        <button onClick={() => { setSimUtil(baseUtil); setSimInqRemove(0); setSimAddTradelines(0); setSimAgeBoost(0); }} className="mt-2 text-[8px] text-[#bbb] hover:text-[#666] transition-colors" data-testid="button-reset-simulator">
          Reset
        </button>
      )}
    </div>
  );
}

function PerfectProfileTab({ aisReport }: { aisReport: MissionData | null }) {
  const [expandedSection, setExpandedSection] = useState<string | null>("revolving");
  if (!aisReport) {
    return null;
  }

  const tradelines = aisReport.openTradelines || [];
  if (tradelines.length === 0 && !hasAnalysisData(aisReport)) {
    return null;
  }

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
      <div>
        <p className="text-[9px] text-[#999] font-medium mb-1 px-0.5">Your Credit Cards</p>
        <div className="space-y-1">
          {primaryRevCards.map((card, i) => renderCard(card, i))}
          {emptyRevCount > 0 && Array.from({ length: emptyRevCount }).map((_, i) => renderEmptySlot("Revolving Card", filledPrimaryRevSlots + i, emptyRevSlotRows))}
        </div>
      </div>

      {auCards.length > 0 && (
        <div>
          <p className="text-[9px] text-[#999] font-medium mb-1 px-0.5">Authorized User <span className="font-normal text-[8px] text-[#bbb]">(doesn't count toward slots)</span></p>
          <div className="space-y-1">
            {auCards.map((card, i) => renderCard(card, primaryRevCards.length + i))}
          </div>
        </div>
      )}

      <div>
        <p className="text-[9px] text-[#999] font-medium mb-1 px-0.5">Your Loans</p>
        <div className="space-y-1">
          {primaryInstCards.map((card, i) => renderCard(card, primaryRevCards.length + auCards.length + i))}
          {emptyInstCount > 0 && Array.from({ length: emptyInstCount }).map((_, i) => renderEmptySlot("Installment Loan", filledPrimaryInstSlots + i, emptyInstSlotRows))}
        </div>
      </div>

      {(otherCards.length > 0 || nonPrimaryInstCards.length > 0) && (
        <div>
          <p className="text-[9px] text-[#999] font-medium mb-1 px-0.5">Other Accounts</p>
          <div className="space-y-1">
            {[...nonPrimaryInstCards, ...otherCards].map((card, i) => renderCard(card, primaryRevCards.length + auCards.length + primaryInstCards.length + i))}
          </div>
        </div>
      )}
    </div>
  );
}

function DocsPanel({ docs, onClose, onDelete, onSave, user, onOpenTeamChat, activeTeamChatId, aisReport, onOpenAis, userProfile, onUpdateProfile, repairData, onUpdateRepairData, onSendChat, onSelectTab, activeView, simulatingLender, setSimulatingLender, repairFilter, setRepairFilter, inqCarouselIdx, setInqCarouselIdx, acctCarouselIdx, setAcctCarouselIdx, portalTarget, portalOnly }: { docs: SavedDoc[]; onClose: () => void; onDelete: (id: string) => void; onSave: (doc: SavedDoc) => void; user: any; onOpenTeamChat?: (member: TeamMember) => void; activeTeamChatId?: number | null; aisReport: MissionData | null; onOpenAis: () => void; userProfile: UserProfile; onUpdateProfile: (p: UserProfile) => void; repairData: RepairData | null; onUpdateRepairData: (data: RepairData) => void; onSendChat: (msg: string) => void; onSelectTab: (tab: "command" | "stack" | "documents" | "unlocks") => void; activeView: "command" | "stack" | "documents" | "unlocks" | null; simulatingLender: number | null; setSimulatingLender: (v: number | null) => void; repairFilter: { bureau: string; category: string }; setRepairFilter: (fn: any) => void; inqCarouselIdx: number; setInqCarouselIdx: (v: number) => void; acctCarouselIdx: number; setAcctCarouselIdx: (v: number) => void; portalTarget: React.RefObject<HTMLDivElement | null>; portalOnly?: boolean }) {
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

  const panelTab = activeView || "command";
  const isSubscriptionActive = user?.subscriptionStatus === "active";
  const activeTier = isSubscriptionActive ? (user?.subscriptionTier as string | null) : null;
  const hasCapitalAccess = activeTier === "capital";
  const hasRepairAccess = activeTier === "repair" || activeTier === "capital";

  return (
    <div className={portalOnly ? "hidden" : "h-full flex flex-col bg-white"} data-testid="docs-panel">
      <div className="px-3 pt-3 pb-0">
        <div className="flex items-center gap-2 mb-4">
          <div className="flex-1 flex items-center gap-2 px-3 py-2.5 bg-[#f5f5f5] rounded-full">
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="7" cy="7" r="5" stroke="#999" strokeWidth="1.3"/><path d="M11 11l3 3" stroke="#999" strokeWidth="1.3" strokeLinecap="round"/></svg>
            <span className="text-[13px] text-[#999]">Search</span>
          </div>
          <button onClick={onClose} className="w-9 h-9 flex items-center justify-center rounded-full hover:bg-[#f5f5f5] transition-colors" data-testid="button-close-docs">
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 4h8M4 8h8M4 12h8" stroke="#555" strokeWidth="1.4" strokeLinecap="round" /></svg>
          </button>
        </div>
        <div className="space-y-0.5">
          {([
            { key: "command" as const, label: "Command", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><rect x="3" y="3" width="12" height="12" rx="2.5" stroke="currentColor" strokeWidth="1.3"/><path d="M7 7l2.5 2-2.5 2" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
            { key: "stack" as const, label: "Stack", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3 11.5l6 3.5 6-3.5M3 8l6 3.5 6-3.5M3 4.5l6 3.5 6-3.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg> },
            { key: "documents" as const, label: "Repair", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M5.5 3h7a2 2 0 012 2v8a2 2 0 01-2 2h-7a2 2 0 01-2-2V5a2 2 0 012-2z" stroke="currentColor" strokeWidth="1.3"/><path d="M7 8h4M7 10.5h2.5" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round"/></svg> },
            { key: "unlocks" as const, label: "Unlocks", icon: <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M9 2v4l2-1.5M9 6L7 4.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/><circle cx="9" cy="11" r="4.5" stroke="currentColor" strokeWidth="1.3"/><path d="M9 9.5v2l1.2.8" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/></svg> },
          ]).map(nav => (
            <button
              key={nav.key}
              onClick={() => onSelectTab(nav.key)}
              className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition-colors ${activeView === nav.key ? "bg-[#111] text-white" : "text-[#333] hover:bg-[#f5f5f5]"}`}
              data-testid={`tab-${nav.key}`}
            >
              <span className={activeView === nav.key ? "text-white" : "text-[#888]"}>{nav.icon}</span>
              <span className="text-[14px] font-medium">{nav.label}</span>
            </button>
          ))}
        </div>

        <div className="w-full h-px bg-[#ebebeb] mt-3 mb-2"></div>

        <button
          onClick={triggerCommandUpload}
          className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left text-[#333] hover:bg-[#f5f5f5] transition-colors"
          data-testid="button-data-upload-nav"
        >
          <span className="text-[#888]">
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none"><path d="M3.5 7.5V5a1.5 1.5 0 011.5-1.5h3l1.5 2h4A1.5 1.5 0 0115 7v6.5a1.5 1.5 0 01-1.5 1.5H5A1.5 1.5 0 013.5 13.5v-6z" stroke="currentColor" strokeWidth="1.3" strokeLinejoin="round"/></svg>
          </span>
          <span className="text-[14px] font-medium">Data Upload</span>
        </button>

        {docs.length > 0 && (
          <>
            <p className="text-[11px] text-[#bbb] font-medium px-3 mt-4 mb-1.5">Your uploads</p>
            <div className="space-y-0">
              {docs.slice(0, 5).map(doc => (
                <button
                  key={doc.id}
                  onClick={() => onSelectTab("documents")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[#555] hover:bg-[#f5f5f5] transition-colors"
                  data-testid={`doc-history-${doc.id}`}
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="shrink-0 text-[#ccc]"><path d="M4 2h5.5L13 5.5V13a1 1 0 01-1 1H4a1 1 0 01-1-1V3a1 1 0 011-1z" stroke="currentColor" strokeWidth="1.2"/><path d="M9.5 2v4h4" stroke="currentColor" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                  <span className="text-[13px] truncate">{doc.name}</span>
                </button>
              ))}
              {docs.length > 5 && (
                <button
                  onClick={() => onSelectTab("documents")}
                  className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left text-[#bbb] hover:bg-[#f5f5f5] transition-colors"
                  data-testid="button-see-more-docs"
                >
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-[#ccc]"><circle cx="4" cy="8" r="1" fill="currentColor"/><circle cx="8" cy="8" r="1" fill="currentColor"/><circle cx="12" cy="8" r="1" fill="currentColor"/></svg>
                  <span className="text-[13px]">See more</span>
                </button>
              )}
            </div>
          </>
        )}
      </div>

      <div className="flex-1" />

      {portalTarget.current && activeView && createPortal(
      <div className="w-full min-h-[calc(100dvh-60px)] overflow-y-auto px-4 py-3 bg-white">
        <div className="w-full max-w-[720px] mx-auto">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <button
                onClick={() => onSelectTab(activeView as any)}
                className="w-7 h-7 flex items-center justify-center rounded-lg text-[#999] hover:text-[#555] hover:bg-[#eee] transition-colors"
                data-testid="button-close-tab-view"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M9 3L4 7l5 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </button>
              <span className="text-[13px] font-semibold text-[#333]">{panelTab === "command" ? "Command" : panelTab === "stack" ? "Stack" : panelTab === "unlocks" ? "Unlocks" : "Repair"}</span>
            </div>
          </div>

        {panelTab === "command" && (<>

        {hasAis && (aisReport?.capitalPotential || []).length > 0 && (() => {
          const cpTotal = (aisReport!.capitalPotential || []);
          const totalLow = cpTotal.reduce((s, e) => s + (e.lowEstimate || 0), 0);
          const totalHigh = cpTotal.reduce((s, e) => s + (e.highEstimate || 0), 0);
          const lenderCount = cpTotal.length;
          const bureauSet = [...new Set(cpTotal.map(e => e.bureau).filter(Boolean))];
          const bureauLabel = bureauSet.length > 0 ? bureauSet.join(", ") : "All Bureaus";
          return (
            <div className="mb-3 pb-3 border-b border-[#e5e5e5]" data-testid="potential-funding-card">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[8px] text-[#999] font-medium tracking-wider uppercase mb-1.5">Potential Funding</p>
                  <p className="text-[28px] font-semibold text-[#111] leading-none tracking-tight" style={{ fontVariantNumeric: "tabular-nums" }}>${totalHigh.toLocaleString()}</p>
                  <div className="flex items-center gap-2 mt-1.5">
                    <span className="text-[9px] text-[#888]" style={{ fontVariantNumeric: "tabular-nums" }}>${totalLow.toLocaleString()} – ${totalHigh.toLocaleString()}</span>
                    <span className="text-[7px] text-[#bbb]">{lenderCount} lender{lenderCount !== 1 ? "s" : ""}</span>
                  </div>
                </div>
                <div className="text-right shrink-0 mt-0.5">
                  <p className="text-[7px] text-[#bbb] leading-snug">Per-bureau basis</p>
                  <p className="text-[7px] text-[#999] leading-snug mt-0.5">Expected funding from</p>
                  <p className="text-[8px] text-[#111] font-medium mt-0.5">{bureauLabel}</p>
                </div>
              </div>
            </div>
          );
        })()}

        {!hasAis && (
          <div className="mb-3">
            <button onClick={triggerCommandUpload} className="w-full rounded-lg bg-[#111] p-4 text-center hover:bg-[#222] transition-colors cursor-pointer group" data-testid="button-upload-command">
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none" className="mx-auto mb-2 text-white/30 group-hover:text-white/50 transition-colors">
                <path d="M9 3V12M9 3L5.5 6.5M9 3L12.5 6.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M3 12V14C3 14.5523 3.44772 15 4 15H14C14.5523 15 15 14.5523 15 14V12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <p className="text-[10px] font-medium text-white/60 group-hover:text-white/80 transition-colors">Upload Bureau Report</p>
              <p className="text-[8px] text-white/25 mt-1">Activates full analysis</p>
            </button>
          </div>
        )}

        <div className="space-y-2.5">
          {hasAis ? (
            <button
              onClick={onOpenAis}
              className="w-full text-left rounded-lg bg-[#111] p-3 hover:bg-[#1a1a1a] transition-colors group"
              data-testid="button-open-ais"
            >
              <div className="flex items-center justify-between mb-2">
                <p className="text-[8px] text-white/35 font-medium tracking-wider uppercase">Capital Readiness</p>
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none" className="text-white/20 group-hover:text-white/40 transition-colors"><path d="M3 1l4 4-4 4" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
              </div>
              <div className="flex items-center gap-3">
                <div className="flex items-baseline gap-1">
                  <span className="text-[22px] font-semibold text-white leading-none" data-testid="text-ais-score" style={{ fontVariantNumeric: "tabular-nums" }}>{aisScore}</span>
                  <span className="text-[10px] text-white/20">/ 100</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-[9px] text-white/50 font-medium truncate" data-testid="text-ais-status">{getStatusLabel()}</p>
                  <p className="text-[8px] text-white/25 truncate">{getPhaseAction()}</p>
                </div>
              </div>
              {(suppressorCount > 0 || pf?.readinessLevel) && (
                <div className="mt-2 pt-2 border-t border-white/5 flex items-center gap-3 flex-wrap">
                  {pf?.readinessLevel && <span className="text-[7px] text-white/30">{getReadinessTier()}</span>}
                  {suppressorCount > 0 && <span className="text-[7px] text-white/30">{suppressorCount} suppressors</span>}
                  {aisScore && aisScore < 88 && <span className="text-[7px] text-white/30">Next: {aisScore < 78 ? "78" : aisScore < 82 ? "82" : "88"}</span>}
                </div>
              )}
            </button>
          ) : null}

          {aisReport?.strategyData && aisReport.strategyData.steps.length > 0 && (
            <div className="pb-3 mb-3 border-b border-[#f0f0f0]" data-testid="capital-strategy">
              <p className="text-[10px] text-[#111] font-medium tracking-wide mb-2.5">Action Plan</p>
              <div className="space-y-0 mb-3">
                {aisReport.strategyData.steps.map((step, si) => (
                  <div key={step.step} className={`flex items-start gap-2.5 py-2 ${si < aisReport.strategyData!.steps.length - 1 ? "border-b border-[#f0f0f0]" : ""}`}>
                    <span className="text-[9px] font-semibold text-[#bbb] mt-px w-3 shrink-0" style={{ fontVariantNumeric: "tabular-nums" }}>{step.step}</span>
                    <div className="min-w-0 flex-1">
                      <p className="text-[9px] text-[#111] font-medium mb-0.5">{step.action}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-[8px] text-[#2d6a4f] font-medium">{step.impact}</span>
                        <span className="text-[8px] text-[#ccc]">{step.timeframe}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {aisReport.strategyData.capitalUnlock && aisReport.strategyData.capitalUnlock.length > 0 && (
                <div className="mt-3">
                  <p className="text-[9px] text-[#999] font-medium mb-2">Unlock Scenarios</p>
                  <div className="space-y-0">
                    {aisReport.strategyData.capitalUnlock.map((scenario, i) => (
                      <div key={i} className={`py-2 ${i < aisReport.strategyData!.capitalUnlock!.length - 1 ? "border-b border-[#f0f0f0]" : ""}`} data-testid={`capital-unlock-${i}`}>
                        <p className="text-[9px] text-[#555] font-medium mb-1">{scenario.condition}</p>
                        <div className="flex items-center gap-2">
                          <span className="text-[8px] text-[#999]" style={{ fontVariantNumeric: "tabular-nums" }}>{scenario.currentRange}</span>
                          <span className="text-[8px] text-[#ccc]">&rarr;</span>
                          <span className="text-[8px] font-medium text-[#111]" style={{ fontVariantNumeric: "tabular-nums" }}>{scenario.projectedRange}</span>
                          <span className="text-[8px] font-medium ml-auto" style={{ color: scenario.projectedOdds >= 70 ? "#2d6a4f" : scenario.projectedOdds >= 45 ? "#c9a227" : "#c0392b", fontVariantNumeric: "tabular-nums" }}>{scenario.projectedOdds}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {aisReport?.strategyData && aisReport.strategyData.timeline.length > 0 && (
            <div className="pb-3 mb-3 border-b border-[#f0f0f0]" data-testid="funding-timeline">
              <p className="text-[10px] text-[#111] font-medium tracking-wide mb-2.5">Timeline</p>
              <div className="space-y-0">
                {aisReport.strategyData.timeline.map((m, i) => {
                  const dotColor = m.approvalOdds >= 70 ? "#2d6a4f" : m.approvalOdds >= 45 ? "#c9a227" : "#c0392b";
                  return (
                    <div key={i} className={`flex items-start gap-2.5 py-2 ${i < aisReport.strategyData!.timeline.length - 1 ? "border-b border-[#f0f0f0]" : ""}`}>
                      <div className="w-[6px] h-[6px] rounded-full mt-1 shrink-0" style={{ backgroundColor: dotColor }} />
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between mb-0.5">
                          <span className="text-[9px] font-medium text-[#111]">{m.label}</span>
                          <span className="text-[9px] font-semibold" style={{ color: dotColor, fontVariantNumeric: "tabular-nums" }}>{m.approvalOdds}%</span>
                        </div>
                        <p className="text-[8px] text-[#888] leading-[1.4]">{m.change}</p>
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

        {panelTab === "stack" && !hasCapitalAccess && (
          <div className="py-12 text-center space-y-4" data-testid="upgrade-prompt-stack">
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[#1a1a1a]">Capital Tier Required</p>
              <p className="text-[12px] text-[#888] mt-1 max-w-[280px] mx-auto">Funding Sequence, lender targeting, and capital stacking are available on the Capital plan.</p>
            </div>
            <a href="/subscription" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1a1a2e] text-white text-[13px] font-medium hover:bg-[#2a2a40] transition-colors" data-testid="button-upgrade-stack">
              Upgrade to Capital
            </a>
          </div>
        )}
        {panelTab === "stack" && hasCapitalAccess && (<>
        <div className="space-y-2.5">

          {!hasAis && (
            <div className="py-4 text-center">
              <p className="text-[9px] text-[#999]">Upload a bureau report to see your funding stack</p>
            </div>
          )}

          {aisReport && (aisReport.bureauHealth || []).length > 0 && (
            <div className="pb-3 mb-3 border-b border-[#f0f0f0]" data-testid="bureau-heatmap">
              <p className="text-[10px] text-[#111] font-medium tracking-wide mb-2.5">Bureau Heatmap</p>
              <div className="grid grid-cols-3 gap-2">
                {(aisReport.bureauHealth || []).map((bh, i) => {
                  const str = (bh.strength || "Moderate").toLowerCase();
                  const strengthColor = str === "strong" ? "#2d6a4f" : str === "moderate" ? "#c9a227" : "#c0392b";
                  const strengthBg = str === "strong" ? "#f0f7f4" : str === "moderate" ? "#fdf8e8" : "#fdf0ef";
                  return (
                    <div key={i} className="rounded-md p-2" style={{ backgroundColor: strengthBg }} data-testid={`bureau-health-${(bh.bureau || "").toLowerCase()}`}>
                      <p className="text-[8px] text-[#888] mb-1">{bh.bureau || "Unknown"}</p>
                      <p className="text-[10px] font-semibold text-[#111] mb-1" style={{ fontVariantNumeric: "tabular-nums" }}>{bh.score > 0 ? bh.score : "—"}</p>
                      <p className="text-[7px] font-medium mb-0.5" style={{ color: strengthColor }}>{bh.strength || "Moderate"}</p>
                      <div className="flex items-center justify-between">
                        <span className="text-[7px] text-[#999]">{bh.inquiries} inq</span>
                        <span className="text-[7px] text-[#999]">{bh.utilization}%</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {aisReport && (aisReport.capitalPotential || []).length > 0 && (
            <div className="pb-3 mb-3 border-b border-[#f0f0f0]" data-testid="capital-potential">
              <p className="text-[10px] text-[#111] font-medium tracking-wide mb-2.5">Capital Potential</p>
              {(() => {
                const totalLow = aisReport.capitalPotential.reduce((s, e) => s + e.lowEstimate, 0);
                const totalHigh = aisReport.capitalPotential.reduce((s, e) => s + e.highEstimate, 0);
                const maxHigh = Math.max(...aisReport.capitalPotential.map(e => e.highEstimate), 1);
                return (
                  <>
                    <div className="rounded-md bg-[#f7f7f7] p-2.5 mb-3">
                      <p className="text-[8px] text-[#999] mb-0.5">Total Accessible</p>
                      <p className="text-[13px] font-semibold text-[#111]" style={{ fontVariantNumeric: "tabular-nums" }}>${totalLow.toLocaleString()} – ${totalHigh.toLocaleString()}</p>
                    </div>
                    <div className="space-y-0">
                      {aisReport.capitalPotential.map((entry, i) => {
                        const conf = (entry.confidence || "Medium").toLowerCase();
                        const confColor = conf === "high" ? "#2d6a4f" : conf === "medium" ? "#c9a227" : "#c0392b";
                        const denialRisk = entry.denialRisk || "Moderate";
                        const riskColor = denialRisk.toLowerCase() === "low" ? "#2d6a4f" : denialRisk.toLowerCase() === "moderate" ? "#c9a227" : "#c0392b";
                        const barWidth = Math.round((entry.highEstimate / maxHigh) * 100);
                        const barFillWidth = Math.round((entry.lowEstimate / maxHigh) * 100);
                        const bp = entry.bureauProbability || { experian: 0, transunion: 0, equifax: 0 };
                        const showSim = simulatingLender === i;
                        return (
                          <div key={i} className={`py-2.5 ${i < aisReport.capitalPotential.length - 1 ? "border-b border-[#f0f0f0]" : ""}`} data-testid={`capital-potential-${i}`}>
                            <div className="flex items-center justify-between mb-1">
                              <div className="flex items-center gap-1.5 min-w-0">
                                <span className="text-[9px] text-[#111] font-medium">{entry.lender}</span>
                                <span className="text-[8px] text-[#bbb]">{entry.product}</span>
                              </div>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-[7px] text-[#999] px-1 py-[1px] rounded bg-[#f0f0f0]">{entry.bureau}</span>
                                <span className="text-[7px] font-medium" style={{ color: confColor }}>{entry.confidence || "Medium"}</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-semibold text-[#111]" style={{ fontVariantNumeric: "tabular-nums" }}>${entry.lowEstimate.toLocaleString()} – ${entry.highEstimate.toLocaleString()}</span>
                              <span className="text-[7px] font-medium" style={{ color: riskColor }}>Risk: {denialRisk}</span>
                            </div>
                            <div className="w-full h-[3px] bg-[#eee] rounded-full overflow-hidden mb-1.5">
                              <div className="h-full rounded-full relative" style={{ width: `${barWidth}%` }}>
                                <div className="absolute inset-0 bg-[#ddd] rounded-full" />
                                <div className="absolute inset-y-0 left-0 bg-[#111] rounded-full" style={{ width: `${barFillWidth > 0 ? Math.round((barFillWidth / barWidth) * 100) : 0}%` }} />
                              </div>
                            </div>
                            {(bp.experian > 0 || bp.transunion > 0 || bp.equifax > 0) && (
                              <div className="flex items-center gap-1 mb-1.5">
                                <span className="text-[7px] text-[#999]">Pull:</span>
                                {bp.experian > 0 && <span className="text-[7px] text-[#888] px-1 py-[1px] rounded bg-[#f5f5f5]" style={{ fontVariantNumeric: "tabular-nums" }}>EX {bp.experian}%</span>}
                                {bp.transunion > 0 && <span className="text-[7px] text-[#888] px-1 py-[1px] rounded bg-[#f5f5f5]" style={{ fontVariantNumeric: "tabular-nums" }}>TU {bp.transunion}%</span>}
                                {bp.equifax > 0 && <span className="text-[7px] text-[#888] px-1 py-[1px] rounded bg-[#f5f5f5]" style={{ fontVariantNumeric: "tabular-nums" }}>EQ {bp.equifax}%</span>}
                              </div>
                            )}
                            <button
                              onClick={() => setSimulatingLender(showSim ? null : i)}
                              className="text-[7px] text-[#111] bg-white border border-[#e5e5e5] px-2 py-1 rounded hover:bg-[#f5f5f5] transition-colors"
                              data-testid={`simulate-btn-${i}`}
                            >
                              {showSim ? "Close" : "Simulate Application"}
                            </button>
                            {showSim && (
                              <div className="mt-2 rounded-md bg-[#f7f7f7] p-2.5">
                                <p className="text-[8px] text-[#111] font-medium mb-1.5">Application Simulation</p>
                                <div className="space-y-1">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[7px] text-[#888]">Approval Probability</span>
                                    <span className="text-[8px] font-semibold" style={{ color: confColor, fontVariantNumeric: "tabular-nums" }}>
                                      {conf === "high" ? "72–88%" : conf === "medium" ? "45–65%" : "15–35%"}
                                    </span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[7px] text-[#888]">Expected Limit</span>
                                    <span className="text-[8px] font-semibold text-[#111]" style={{ fontVariantNumeric: "tabular-nums" }}>${entry.lowEstimate.toLocaleString()} – ${entry.highEstimate.toLocaleString()}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[7px] text-[#888]">Denial Risk</span>
                                    <span className="text-[8px] font-medium" style={{ color: riskColor }}>{denialRisk}</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[7px] text-[#888]">Bureau Pulled</span>
                                    <span className="text-[8px] text-[#111]">{entry.bureau} ({Math.max(bp.experian, bp.transunion, bp.equifax)}% likely)</span>
                                  </div>
                                  <div className="flex items-center justify-between">
                                    <span className="text-[7px] text-[#888]">Hard Inquiry Impact</span>
                                    <span className="text-[8px] text-[#c9a227]">−3 to −5 pts on {entry.bureau}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  </>
                );
              })()}
            </div>
          )}

          {aisReport && (aisReport.fundingSequence || []).length > 0 && (
            <div className="pb-3 mb-3 border-b border-[#f0f0f0]" data-testid="funding-sequence">
              <p className="text-[10px] text-[#111] font-medium tracking-wide mb-2.5">Funding Sequence</p>
              <div className="space-y-0">
                {(aisReport.fundingSequence || []).map((entry, i) => {
                  const probColor = (entry.approvalProbability || 0) >= 70 ? "#2d6a4f" : (entry.approvalProbability || 0) >= 45 ? "#c9a227" : "#c0392b";
                  return (
                    <div key={i} className={`py-2.5 ${i < (aisReport.fundingSequence || []).length - 1 ? "border-b border-[#f0f0f0]" : ""}`} data-testid={`funding-sequence-${i}`}>
                      <div className="flex items-start gap-2.5">
                        <div className="flex flex-col items-center shrink-0 mt-0.5">
                          <span className="text-[9px] font-semibold text-[#bbb] w-3 text-center" style={{ fontVariantNumeric: "tabular-nums" }}>{entry.position}</span>
                          {i < (aisReport.fundingSequence || []).length - 1 && (
                            <div className="w-px h-8 bg-[#e5e5e5] mt-1" />
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center justify-between mb-0.5">
                            <div className="flex items-center gap-1.5 min-w-0">
                              <span className="text-[9px] text-[#111] font-medium">{entry.lender}</span>
                              <span className="text-[8px] text-[#bbb]">{entry.product}</span>
                            </div>
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-[7px] text-[#999] px-1 py-[1px] rounded bg-[#f0f0f0]">{entry.bureau}</span>
                              <span className="text-[9px] font-semibold" style={{ color: probColor, fontVariantNumeric: "tabular-nums" }}>{entry.approvalProbability}%</span>
                            </div>
                          </div>
                          <p className="text-[8px] text-[#888] leading-[1.4] mb-1">{entry.reasoning}</p>
                          {entry.exposureUnlock && (
                            <div className="flex items-start gap-1">
                              <span className="text-[7px] text-[#2d6a4f] shrink-0 mt-px">↗</span>
                              <p className="text-[7px] text-[#2d6a4f] leading-[1.4]">{entry.exposureUnlock}</p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {aisReport && aisReport.stackTiming && aisReport.stackTiming.length > 0 && (
            <div className="pb-3 mb-3 border-b border-[#f0f0f0]" data-testid="stack-timing">
              <p className="text-[10px] text-[#111] font-medium tracking-wide mb-2">Timing</p>
              <div className="rounded-md bg-[#f7f7f7] p-2.5">
                <div className="flex items-start gap-2">
                  <span className="text-[10px] shrink-0 mt-px">⏱</span>
                  <p className="text-[8px] text-[#555] leading-[1.5]">{aisReport.stackTiming}</p>
                </div>
              </div>
            </div>
          )}

          {hasAis && aisReport && (
            <CapitalSimulator aisReport={aisReport} />
          )}

          {aisReport?.strategyData && aisReport.strategyData.fundingMatches.length > 0 && (
            <div className="pb-3 mb-3 border-b border-[#f0f0f0]" data-testid="funding-matches">
              <p className="text-[10px] text-[#111] font-medium tracking-wide mb-2.5">Lender Matches</p>
              <div className="space-y-0">
                {aisReport.strategyData.fundingMatches.map((match, i) => {
                  const likelihoodColor = (match.likelihood || "Medium").toLowerCase() === "high" ? "#2d6a4f" : (match.likelihood || "Medium").toLowerCase() === "medium" ? "#c9a227" : "#c0392b";
                  return (
                    <div key={i} className={`py-2 ${i < aisReport.strategyData!.fundingMatches.length - 1 ? "border-b border-[#f0f0f0]" : ""}`}>
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[9px] text-[#111] font-medium">{match.lender}</span>
                        <span className="text-[8px] font-medium" style={{ color: likelihoodColor }}>{match.likelihood}</span>
                      </div>
                      <p className="text-[8px] text-[#888] leading-[1.4]">{match.reason}</p>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {aisReport && aisReport.fundingTrends && aisReport.fundingTrends.length > 0 && (
            <div className="pb-3 mb-3 border-b border-[#f0f0f0]" data-testid="funding-trends">
              <p className="text-[10px] text-[#111] font-medium tracking-wide mb-2.5">Funding Trends</p>
              <div className="space-y-0">
                {(aisReport.fundingTrends || []).map((trend, i) => {
                  const td = (trend.trend || "Stable").toLowerCase();
                  const trendColor = td === "rising" ? "#2d6a4f" : td === "stable" ? "#c9a227" : "#c0392b";
                  const trendArrow = td === "rising" ? "↑" : td === "stable" ? "→" : "↓";
                  return (
                    <div key={i} className={`py-2 ${i < (aisReport.fundingTrends || []).length - 1 ? "border-b border-[#f0f0f0]" : ""}`} data-testid={`funding-trend-${i}`}>
                      <div className="flex items-center justify-between mb-0.5">
                        <div className="flex items-center gap-1.5 min-w-0">
                          <span className="text-[9px] text-[#111] font-medium">{trend.lender}</span>
                          <span className="text-[8px] text-[#bbb]">{trend.product}</span>
                        </div>
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-[7px] text-[#999] px-1 py-[1px] rounded bg-[#f0f0f0]">{trend.bureau}</span>
                          <span className="text-[8px] font-medium" style={{ color: trendColor }}>{trendArrow} {trend.trend || "Stable"}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <span className="text-[7px] text-[#888]">Median Approval:</span>
                        <span className="text-[8px] font-semibold text-[#111]" style={{ fontVariantNumeric: "tabular-nums" }}>${trend.medianApproval.toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

        </div>
        </>)}

        {panelTab === "documents" && !hasRepairAccess && (
              <div className="py-12 text-center space-y-4" data-testid="upgrade-prompt-repair">
                <div className="w-14 h-14 rounded-full bg-purple-50 flex items-center justify-center mx-auto">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#8b5cf6" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                </div>
                <div>
                  <p className="text-[15px] font-semibold text-[#1a1a1a]">Repair Tier Required</p>
                  <p className="text-[12px] text-[#888] mt-1 max-w-[280px] mx-auto">AI dispute letters, the Repair Center, and credit report error detection are available on the Repair or Capital plan.</p>
                </div>
                <a href="/subscription" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#8b5cf6] text-white text-[13px] font-medium hover:bg-[#7c3aed] transition-colors" data-testid="button-upgrade-repair">
                  Upgrade to Repair
                </a>
              </div>
        )}
        {panelTab === "documents" && hasRepairAccess && (<>


        {repairData && repairData.truthProfile && (
          <div className="pb-3 mb-3 border-b border-[#f0f0f0]">
            <p className="text-[10px] text-[#111] font-medium tracking-wide mb-2">Identity</p>
            <div className="space-y-1">
              <p className="text-[10px] text-[#111] font-medium">{repairData.truthProfile.fullName}</p>
              {repairData.truthProfile.currentAddress && <p className="text-[9px] text-[#888]">{repairData.truthProfile.currentAddress}</p>}
              <div className="flex items-center gap-3">
                {repairData.truthProfile.dob && <span className="text-[8px] text-[#999]">DOB: {repairData.truthProfile.dob}</span>}
                {repairData.truthProfile.ssnLast4 && <span className="text-[8px] text-[#999]">SSN: ***-**-{repairData.truthProfile.ssnLast4}</span>}
              </div>
              {repairData.truthProfile.nameVariants.length > 1 && (
                <p className="text-[8px] text-[#c9a227] mt-1">Variants: {repairData.truthProfile.nameVariants.join(", ")}</p>
              )}
            </div>
          </div>
        )}

        {repairData && repairData.discrepancies.length > 0 && (
          <div className="pb-3 mb-3 border-b border-[#f0f0f0]">
            <div className="flex items-center justify-between mb-2">
              <p className="text-[10px] text-[#111] font-medium tracking-wide">Discrepancies</p>
              <span className="text-[9px] text-[#c0392b] font-medium">{repairData.discrepancies.length}</span>
            </div>
            <div className="space-y-0">
              {repairData.discrepancies.map((d, i) => (
                <div key={i} className={`py-2 ${i < repairData.discrepancies.length - 1 ? "border-b border-[#f0f0f0]" : ""}`} data-testid={`discrepancy-${i}`}>
                  <div className="flex items-center gap-2 mb-0.5">
                    <span className="text-[9px] text-[#111] font-medium capitalize">{d.field}</span>
                    <span className={`text-[7px] font-medium ${d.severity === "High" ? "text-[#c0392b]" : d.severity === "Med" ? "text-[#c9a227]" : "text-[#999]"}`}>{d.severity}</span>
                  </div>
                  <p className="text-[8px] text-[#888]">{d.creditReportValue}</p>
                  {d.documentValue && <p className="text-[8px] text-[#2d6a4f]">{d.documentValue}</p>}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="pb-3 mb-3 border-b border-[#f0f0f0]">
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] text-[#111] font-medium tracking-wide">Disputes</p>
            {repairData && <span className="text-[9px] text-[#111] font-medium">{repairData.negativeItems.length}</span>}
          </div>

          {!repairData || repairData.negativeItems.length === 0 ? (
            <div className="py-4 text-center">
              <p className="text-[9px] text-[#999]">No dispute-eligible items detected</p>
              <p className="text-[8px] text-[#bbb] mt-1">Upload a report to scan</p>
            </div>
          ) : (<>
            <div className="flex gap-1.5 mb-3">
              <select value={repairFilter.bureau} onChange={e => setRepairFilter(f => ({ ...f, bureau: e.target.value }))} className="text-[9px] px-2 py-1.5 rounded-md border border-[#e5e5e5] bg-[#fafafa] text-[#555]" data-testid="filter-bureau">
                <option value="All">All Bureaus</option>
                {[...new Set(repairData.negativeItems.map(n => n.bureau))].map(b => <option key={b} value={b}>{b}</option>)}
              </select>
              <select value={repairFilter.category} onChange={e => setRepairFilter(f => ({ ...f, category: e.target.value }))} className="text-[9px] px-2 py-1.5 rounded-md border border-[#e5e5e5] bg-[#fafafa] text-[#555]" data-testid="filter-category">
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
                  <div className="mb-3">
                    <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#f0f0f0]">
                      <span className="text-[9px] text-[#555] font-medium">Inquiries</span>
                      <span className="text-[8px] text-[#999]">{inquiryItems.length}</span>
                    </div>
                    {(() => {
                      const clampedIdx = Math.min(inqCarouselIdx, inquiryItems.length - 1);
                      const item = inquiryItems[clampedIdx];
                      if (!item) return null;
                      const rl = roundLabels[item.disputeRound] || roundLabels[1];
                      const sameDayCount = inquiryItems.filter(n => n.dates?.inquiryDate === item.dates?.inquiryDate && n.dates?.inquiryDate).length;
                      const isCluster = sameDayCount > 1;
                      const statusColor = item.userAttestation === "not_authorized" ? "text-[#c0392b]" : item.userAttestation === "recognized" ? "text-[#2d6a4f]" : "text-[#999]";
                      const statusLabel = item.userAttestation === "not_authorized" ? "Denied" : item.userAttestation === "recognized" ? "Recognized" : "Pending";
                      return (
                        <div className="relative">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setInqCarouselIdx(Math.max(0, clampedIdx - 1))} disabled={clampedIdx === 0} className="shrink-0 w-5 h-5 flex items-center justify-center text-[#bbb] hover:text-[#666] disabled:opacity-20 transition-colors" data-testid="button-inquiry-prev">
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M6 2L3 5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="rounded-md bg-[#fafafa] border border-[#eee] transition-all" data-testid={`repair-item-${item.itemId}`}>
                                <div className="px-2.5 py-2">
                                  <div className="flex items-center gap-1.5 mb-1">
                                    <span className="text-[9px] font-medium text-[#111] truncate">{item.furnisherName}</span>
                                    <span className={`text-[7px] font-medium ml-auto shrink-0 ${statusColor}`}>{statusLabel}</span>
                                  </div>
                                  <div className="flex items-center gap-1 text-[9px] text-[#888] mb-1.5 flex-wrap">
                                    <span>{item.bureau}</span>
                                    {item.dates?.inquiryDate && <><span className="text-[#ddd]">|</span><span>{item.dates.inquiryDate}</span></>}
                                    {item.standaloneInquiry && <><span className="text-[#ddd]">|</span><span className="text-[#dc2626] font-medium">No Account</span></>}
                                    {isCluster && <><span className="text-[#ddd]">|</span><span className="text-[#d97706] font-medium">Cluster</span></>}
                                  </div>
                                  <div className="flex items-center gap-1.5 mb-1.5">
                                    <span className="text-[8px] text-[#111] font-medium">{rl.label}</span>
                                    <span className="text-[7px] text-[#bbb] truncate">{rl.desc}</span>
                                  </div>
                                  <div className="flex gap-1 flex-wrap">
                                    {item.attestationRequired && !item.userAttestation && (
                                      <>
                                        <button
                                          onClick={() => {
                                            if (!repairData) return;
                                            const updated = { ...repairData, negativeItems: repairData.negativeItems.map(n => n.itemId === item.itemId ? { ...n, userAttestation: "not_authorized" as const, status: "Attested" as const } : n) };
                                            onUpdateRepairData(updated);
                                          }}
                                          className="text-[8px] px-2 py-1 rounded-md bg-[#111] text-white font-medium hover:bg-[#333] transition-colors"
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
                                          className="text-[8px] px-2 py-1 rounded-md bg-white text-[#555] font-medium hover:bg-[#f5f5f5] transition-colors border border-[#e5e5e5]"
                                          data-testid={`button-recognized-${item.itemId}`}
                                        >
                                          Recognized
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
                                        className="text-[8px] px-2 py-1 rounded-md bg-[#111] text-white font-medium hover:bg-[#333] transition-colors"
                                        data-testid={`button-generate-dispute-${item.itemId}`}
                                      >
                                        Round {item.disputeRound} Letter
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
                                        className="text-[8px] px-2 py-1 rounded-md bg-white text-[#555] font-medium hover:bg-[#f5f5f5] transition-colors border border-[#e5e5e5]"
                                        data-testid={`button-advance-round-${item.itemId}`}
                                      >
                                        R{Math.min(item.disputeRound + 1, 3)}
                                      </button>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </div>
                            <button onClick={() => setInqCarouselIdx(Math.min(inquiryItems.length - 1, clampedIdx + 1))} disabled={clampedIdx >= inquiryItems.length - 1} className="shrink-0 w-5 h-5 flex items-center justify-center text-[#bbb] hover:text-[#666] disabled:opacity-20 transition-colors" data-testid="button-inquiry-next">
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M4 2l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                          </div>
                          <div className="flex justify-center gap-0.5 mt-1.5">
                            {inquiryItems.map((_, di) => (
                              <button key={di} onClick={() => setInqCarouselIdx(di)} className={`w-1.5 h-1.5 rounded-full transition-colors ${di === clampedIdx ? "bg-[#6366f1]" : "bg-[#ddd]"}`} />
                            ))}
                          </div>
                        </div>
                      );
                    })()}
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
                        className="mt-2 w-full py-1.5 rounded-md bg-[#111] text-white text-[8px] font-medium hover:bg-[#333] transition-colors"
                        data-testid="button-generate-all-inquiry-disputes"
                      >
                        Generate All ({inquiryItems.filter(n => n.userAttestation !== "recognized").length})
                      </button>
                    )}
                  </div>
                )}

                {nonInquiryItems.length > 0 && (repairFilter.category === "All" || repairFilter.category !== "Inquiry") && (
                  <div className="mb-2">
                    {(repairFilter.category === "All" && inquiryItems.length > 0) && (
                      <div className="flex items-center justify-between mb-2 pb-1.5 border-b border-[#f0f0f0]">
                        <span className="text-[9px] text-[#555] font-medium">Accounts</span>
                        <span className="text-[8px] text-[#999]">{nonInquiryItems.length}</span>
                      </div>
                    )}
                    {(() => {
                      const clampedIdx = Math.min(acctCarouselIdx, nonInquiryItems.length - 1);
                      const item = nonInquiryItems[clampedIdx];
                      if (!item) return null;
                      const catLabel = item.category === "Personal Info" ? "PI" : item.category === "Public Record" ? "PR" : item.category.slice(0, 3).toUpperCase();
                      const statusColor = item.userAttestation === "not_authorized" ? "text-[#c0392b]" : item.userAttestation === "recognized" ? "text-[#2d6a4f]" : item.status === "Packaged" ? "text-[#c9a227]" : "text-[#999]";
                      const statusLabel = item.userAttestation === "not_authorized" ? "Denied" : item.userAttestation === "recognized" ? "Recognized" : item.status === "Packaged" ? "Packaged" : "New";
                      return (
                        <div className="relative">
                          <div className="flex items-center gap-1">
                            <button onClick={() => setAcctCarouselIdx(Math.max(0, clampedIdx - 1))} disabled={clampedIdx === 0} className="shrink-0 w-5 h-5 flex items-center justify-center text-[#bbb] hover:text-[#666] disabled:opacity-20 transition-colors" data-testid="button-account-prev">
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M6 2L3 5l3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                            <div className="flex-1 min-w-0">
                              <div className="rounded-md bg-[#fafafa] border border-[#eee] transition-all" data-testid={`repair-item-${item.itemId}`}>
                                <div className="px-2.5 py-2">
                                  <div className="flex items-center gap-1.5 mb-0.5">
                                    <span className="text-[7px] text-[#999] font-medium shrink-0">{catLabel}</span>
                                    <span className="text-[9px] font-medium text-[#111] truncate">{item.furnisherName}</span>
                                    <span className={`text-[7px] font-medium ml-auto shrink-0 ${statusColor}`}>{statusLabel}</span>
                                  </div>
                                  <div className="text-[8px] text-[#888] mb-1 line-clamp-1">{item.issue}</div>
                                  <div className="flex items-center gap-1 text-[9px] text-[#888] mb-1.5 flex-wrap">
                                    <span>{item.bureau}</span>
                                    {item.accountPartial && <><span className="text-[#ddd]">|</span><span className="truncate max-w-[80px]">...{item.accountPartial}</span></>}
                                    {item.disputeBasis && <><span className="text-[#ddd]">|</span><span className="text-[#6366f1] font-medium truncate max-w-[100px]">{item.disputeBasis}</span></>}
                                  </div>
                                  <div className="flex gap-1 flex-wrap">
                                    {item.attestationRequired && !item.userAttestation && (
                                      <>
                                        <button
                                          onClick={() => {
                                            if (!repairData) return;
                                            const updated = { ...repairData, negativeItems: repairData.negativeItems.map(n => n.itemId === item.itemId ? { ...n, userAttestation: "not_authorized" as const, status: "Attested" as const } : n) };
                                            onUpdateRepairData(updated);
                                          }}
                                          className="text-[8px] px-2 py-1 rounded-md bg-[#111] text-white font-medium hover:bg-[#333] transition-colors"
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
                                          className="text-[8px] px-2 py-1 rounded-md bg-white text-[#555] font-medium hover:bg-[#f5f5f5] transition-colors border border-[#e5e5e5]"
                                          data-testid={`button-recognized-${item.itemId}`}
                                        >
                                          Recognized
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
                                        className="text-[8px] px-2 py-1 rounded-md bg-[#111] text-white font-medium hover:bg-[#333] transition-colors"
                                        data-testid={`button-generate-dispute-${item.itemId}`}
                                      >
                                        Challenge
                                      </button>
                                    )}
                                  </div>
                                  {(item.evidenceAvailable.length > 0 || item.evidenceMissing.length > 0) && (
                                    <div className="flex gap-1.5 mt-1.5 pt-1 border-t border-[#f0f0f0]">
                                      {item.evidenceAvailable.length > 0 && (
                                        <span className="text-[8px] text-[#16a34a] font-medium">{item.evidenceAvailable.length} evidence on file</span>
                                      )}
                                      {item.evidenceMissing.length > 0 && (
                                        <span className="text-[8px] text-[#dc2626] font-medium">{item.evidenceMissing.length} evidence needed</span>
                                      )}
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                            <button onClick={() => setAcctCarouselIdx(Math.min(nonInquiryItems.length - 1, clampedIdx + 1))} disabled={clampedIdx >= nonInquiryItems.length - 1} className="shrink-0 w-6 h-6 flex items-center justify-center rounded-full bg-white border border-[#e0e0e0] text-[#999] hover:bg-[#f5f5f5] disabled:opacity-30 transition-colors" data-testid="button-account-next">
                              <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M4 2l3 3-3 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/></svg>
                            </button>
                          </div>
                          <div className="flex justify-center gap-0.5 mt-1.5">
                            {nonInquiryItems.map((_, di) => (
                              <button key={di} onClick={() => setAcctCarouselIdx(di)} className={`w-1.5 h-1.5 rounded-full transition-colors ${di === clampedIdx ? "bg-[#1a1a2e]" : "bg-[#ddd]"}`} />
                            ))}
                          </div>
                        </div>
                      );
                    })()}
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
                    className="mt-2 w-full py-1.5 rounded-md bg-[#1a1a2e] text-white text-[9px] font-semibold hover:bg-[#2a2a4e] transition-colors"
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

        {panelTab === "documents" && hasRepairAccess && (<>
        {false && <div className="mb-4">
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
        </div>}

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
        {hasAis && aisReport && false && (
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

        {panelTab === "documents" && hasRepairAccess && (<>
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

        {panelTab === "documents" && hasRepairAccess && (
        <div className="mt-4 pt-3 border-t border-[#eee]">
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

        {panelTab === "unlocks" && !hasCapitalAccess && (
          <div className="py-12 text-center space-y-4" data-testid="upgrade-prompt-unlocks">
            <div className="w-14 h-14 rounded-full bg-amber-50 flex items-center justify-center mx-auto">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
            </div>
            <div>
              <p className="text-[15px] font-semibold text-[#1a1a1a]">Capital Tier Required</p>
              <p className="text-[12px] text-[#888] mt-1 max-w-[280px] mx-auto">Credit Unlocks and community data insights are available on the Capital plan.</p>
            </div>
            <a href="/subscription" className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full bg-[#1a1a2e] text-white text-[13px] font-medium hover:bg-[#2a2a40] transition-colors" data-testid="button-upgrade-unlocks">
              Upgrade to Capital
            </a>
          </div>
        )}
        {panelTab === "unlocks" && hasCapitalAccess && (
          <CommunityUnlocks userProfile={userProfile} />
        )}

        </div>
      </div>, portalTarget.current
      )}

      <input ref={docInputRef} type="file" className="hidden" onChange={handleUploadDoc} data-testid="input-doc-upload" />
      <input ref={commandUploadRef} type="file" accept=".pdf,.txt,.csv,.html" className="hidden" onChange={handleUploadDoc} data-testid="input-command-upload" />
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
  const [msgFeedback, setMsgFeedback] = useState<Record<number, "up" | "down">>({});
  const [copiedMsgId, setCopiedMsgId] = useState<number | null>(null);
  const [sharedMsgId, setSharedMsgId] = useState<number | null>(null);
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
      if (!saved) return null;
      const parsed = JSON.parse(saved);
      const normalizedCP = (parsed.capitalPotential || []).map((e: any) => ({
        ...e,
        bureauProbability: e.bureauProbability || { experian: 0, transunion: 0, equifax: 0 },
        denialRisk: e.denialRisk || "Moderate",
      }));
      const normalizedFS = (parsed.fundingSequence || []).map((e: any) => ({
        ...e,
        exposureUnlock: e.exposureUnlock || "",
      }));
      return { ...parsed, capitalPotential: normalizedCP, fundingSequence: normalizedFS, fundingTrends: parsed.fundingTrends || [], bureauHealth: parsed.bureauHealth || [], stackTiming: parsed.stackTiming || "", strategyData: parsed.strategyData ? { ...parsed.strategyData, capitalUnlock: parsed.strategyData.capitalUnlock || [] } : parsed.strategyData };
    } catch { return null; }
  });
  const [repairData, setRepairData] = useState<RepairData | null>(loadRepairData);
  const [showAisOverlay, setShowAisOverlay] = useState(false);
  const [activeView, setActiveView] = useState<"command" | "stack" | "documents" | "unlocks" | null>(null);
  const [simulatingLender, setSimulatingLender] = useState<number | null>(null);
  const [repairFilter, setRepairFilter] = useState<{ bureau: string; category: string }>({ bureau: "All", category: "All" });
  const [inqCarouselIdx, setInqCarouselIdx] = useState(0);
  const [acctCarouselIdx, setAcctCarouselIdx] = useState(0);
  const panelContentRef = useRef<HTMLDivElement>(null);
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
  const [fundingStep, setFundingStep] = useState<"closed" | "terms" | "form">("closed");
  const [termsAccepted, setTermsAccepted] = useState(false);
  const emptyFundingForm = {
    firstName: "", lastName: "", email: "", phone: "", dob: "", ssn: "",
    address: "", city: "", state: "", zip: "", yearsAtAddress: "", homeOwnership: "",
    businessName: "", dba: "", businessAddress: "", businessCity: "", businessState: "", businessZip: "",
    businessPhone: "", businessEmail: "", ein: "", entityType: "", industry: "", dateEstablished: "",
    numEmployees: "", website: "",
    ownershipPct: "", titlePosition: "",
    employerName: "", annualIncome: "", monthlyHousing: "",
    annualBusinessRevenue: "", monthlyBusinessRevenue: "", desiredLoanAmount: "", purposeOfFunds: "",
    existingDebts: "", businessBankName: "",
  };
  const emptyFundingFiles = {
    bizBankStatements: [] as File[], personalBankStatements: [] as File[],
    bizTaxReturns: [] as File[], personalTaxReturns: [] as File[],
    bizLicense: [] as File[], driversLicense: null as File | null,
    proofOfResidency: null as File | null, creditReport: null as File | null,
  };
  const [fundingForm, setFundingForm] = useState(emptyFundingForm);
  const [fundingFiles, setFundingFiles] = useState(emptyFundingFiles);
  const [signatureDataUrl, setSignatureDataUrl] = useState<string | null>(null);
  const [isSubmittingFunding, setIsSubmittingFunding] = useState(false);
  const sigCanvasRef = useRef<HTMLCanvasElement>(null);
  const sigDrawingRef = useRef(false);
  const fundingBizBankRef = useRef<HTMLInputElement>(null);
  const fundingPersBankRef = useRef<HTMLInputElement>(null);
  const fundingBizTaxRef = useRef<HTMLInputElement>(null);
  const fundingPersTaxRef = useRef<HTMLInputElement>(null);
  const fundingBizLicRef = useRef<HTMLInputElement>(null);
  const fundingDLRef = useRef<HTMLInputElement>(null);
  const fundingResidencyRef = useRef<HTMLInputElement>(null);
  const fundingCreditRef = useRef<HTMLInputElement>(null);

  const initSigCanvas = useCallback((canvas: HTMLCanvasElement | null) => {
    if (!canvas) return;
    (sigCanvasRef as any).current = canvas;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = "#1a1a2e";
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect();
      const scaleX = canvas.width / rect.width;
      const scaleY = canvas.height / rect.height;
      if ("touches" in e) {
        return { x: (e.touches[0].clientX - rect.left) * scaleX, y: (e.touches[0].clientY - rect.top) * scaleY };
      }
      return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY };
    };

    const start = (e: MouseEvent | TouchEvent) => { e.preventDefault(); sigDrawingRef.current = true; const p = getPos(e); ctx.beginPath(); ctx.moveTo(p.x, p.y); };
    const move = (e: MouseEvent | TouchEvent) => { if (!sigDrawingRef.current) return; e.preventDefault(); const p = getPos(e); ctx.lineTo(p.x, p.y); ctx.stroke(); };
    const end = () => { sigDrawingRef.current = false; setSignatureDataUrl(canvas.toDataURL("image/png")); };

    canvas.addEventListener("mousedown", start);
    canvas.addEventListener("mousemove", move);
    canvas.addEventListener("mouseup", end);
    canvas.addEventListener("mouseleave", end);
    canvas.addEventListener("touchstart", start, { passive: false });
    canvas.addEventListener("touchmove", move, { passive: false });
    canvas.addEventListener("touchend", end);
  }, []);

  const clearSignature = useCallback(() => {
    const canvas = sigCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.fillStyle = "#fff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    setSignatureDataUrl(null);
  }, []);

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
        doSend("Analyze my report and generate my AIS.", fileData, true);
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

  const doSend = async (text: string, file?: { name: string; content: string; isPdf?: boolean } | null, isFreshUpload?: boolean) => {
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
            if (match) {
              const updated = prev.map(d => d === match ? { ...d, extractedText: data.extractedText, savedAt: Date.now() } : d);
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
          if (match) {
            const updated = prev.map(d => d === match ? { ...d, extractedText: data.extractedText, savedAt: Date.now() } : d);
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
        const merged = (!isFreshUpload && repairData) ? {
          ...parsedRepair,
          negativeItems: parsedRepair.negativeItems.map(ni => {
            const existing = repairData.negativeItems.find(e => e.itemId === ni.itemId);
            return existing?.userAttestation ? { ...ni, userAttestation: existing.userAttestation, status: existing.status } : ni;
          }),
        } : parsedRepair;
        setRepairData(merged);
        saveRepairData(merged);
      }
      const parsedAisEarly = parseAisBeforeStrip(responseContent);
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
      const isStructured = /(?:STRATEGY_DATA_START|CAPITAL_POTENTIAL_DATA_START|FUNDING_SEQUENCE_DATA_START|TRADELINE:|DISPUTE:.*\|.*\||Pillar\s*Scores:|Payment\s*Integrity:\s*\d|Utilization\s*Control:\s*\d|AIS.*(?:Approval\s*Index|Score).*:\s*\d)/i.test(responseContent);
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

      if (parsedAisEarly) {
        setAisReport(parsedAisEarly);
        try {
          localStorage.setItem("profundr_ais_report", JSON.stringify(parsedAisEarly));
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
      doSend("Analyze my report and generate my AIS.", vaultFile, true);
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
    doSend(msg, file, !!file);
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

  const [showFrontPage, setShowFrontPage] = useState(!user && !hasMessages);
  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterSubmitted, setNewsletterSubmitted] = useState(false);
  const [newsletterLoading, setNewsletterLoading] = useState(false);
  const [showcaseTab, setShowcaseTab] = useState(0);
  const [testIdx, setTestIdx] = useState(0);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setShowcaseTab((prev) => (prev + 1) % 4);
    }, 4000);
    return () => clearInterval(interval);
  }, []);
  const [faqOpen, setFaqOpen] = useState<number | null>(null);

  useEffect(() => {
    if (user || hasMessages) setShowFrontPage(false);
  }, [user, hasMessages]);

  if (showFrontPage && !user) {
    const features = [
      { title: "AIS Score Engine", desc: "Your Approval Index Score analyzes 23 data points banks check before saying yes. Know where you stand before you apply.", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg> },
      { title: "Credit Repair Center", desc: "FCRA-compliant dispute letters generated instantly. Target negative items bureau-by-bureau with legal precision.", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/><path d="M14 2v6h6"/><path d="M9 15l2 2 4-4"/></svg> },
      { title: "Capital Simulator", desc: "Model different credit scenarios and see how each change impacts your fundability. Test before you commit.", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M3 3v18h18"/><path d="M7 16l4-8 4 4 4-8"/></svg> },
      { title: "Lender Match Engine", desc: "Get matched with lenders based on your actual profile — not ads. See real approval odds for each product.", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg> },
      { title: "Funding Timeline", desc: "A step-by-step roadmap showing exactly what to do and when. Hit each milestone to unlock higher limits.", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg> },
      { title: "Community Intelligence", desc: "Real approval data from thousands of applicants. See what's actually getting funded and by whom.", icon: <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg> },
    ];

    const faqs = [
      { q: "What is Profundr?", a: "Profundr is a system that shows you how banks evaluate your profile before you apply — so you know where you stand and how to get funded." },
      { q: "How is this different from a credit score?", a: "Your score is just one number. Profundr analyzes your full profile — balances, timing, accounts, and activity — the same way lenders do." },
      { q: "Will this help me get approved?", a: "Yes. You'll see what's helping, what's hurting, and exactly what to fix before applying." },
      { q: "How much funding can I get?", a: "Profundr estimates your qualification range based on your current profile and structure." },
      { q: "What if I'm not ready yet?", a: "You'll get a clear action plan showing what to improve and when to apply — so you don't waste opportunities." },
      { q: "Does this affect my credit?", a: "No. Profundr does not run hard inquiries or submit applications." },
      { q: "Is Profundr a lender?", a: "No. We don't lend money — we prepare your profile so you can get approved." },
      { q: "Who is this for?", a: "Founders, creators, and anyone serious about accessing capital the right way." },
    ];

    return (
      <div className="min-h-screen bg-white" style={{ fontFamily: "'Inter', sans-serif" }} data-testid="front-page">
        <input ref={fileInputRef} type="file" accept=".pdf,.txt,.csv" className="hidden" onChange={handleFileSelect} data-testid="input-file-upload" />

        <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-[#f0f0f0]" data-testid="front-nav">
          <div className="max-w-[1200px] mx-auto px-4 sm:px-6 h-[56px] sm:h-[64px] flex items-center justify-between">
            <span className="inline-flex items-center select-none gap-1.5 sm:gap-2" aria-label="profundr.">
              <img src="/profundr-brain-logo.png" alt="" className="w-7 h-7 sm:w-8 sm:h-8" style={{ display: "block", borderRadius: "6px" }} />
              <span style={{ fontFamily: "'Inter', sans-serif", fontWeight: 800, letterSpacing: "-0.05em", color: "#111" }} className="text-[16px] sm:text-[20px]">profundr<span style={{ marginLeft: "-0.15em" }}>.</span></span>
            </span>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-[14px] text-[#555] hover:text-[#111] transition-colors">Features</a>
              <a href="#how-it-works" className="text-[14px] text-[#555] hover:text-[#111] transition-colors">How It Works</a>
              <a href="#pricing" className="text-[14px] text-[#555] hover:text-[#111] transition-colors">Pricing</a>
              <a href="#faq" className="text-[14px] text-[#555] hover:text-[#111] transition-colors">FAQ</a>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => window.location.href = '/login'}
                className="hidden sm:inline-block text-[13px] text-[#555] hover:text-[#111] font-medium transition-colors"
                data-testid="front-btn-login"
              >
                Log In
              </button>
              <button
                onClick={() => window.location.href = '/subscription'}
                className="hidden sm:inline-block px-5 py-2.5 bg-[#111] text-white text-[13px] font-medium hover:bg-[#333] transition-colors"
                data-testid="front-btn-get-started"
              >
                Get Started
              </button>
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="sm:hidden w-10 h-10 flex items-center justify-center"
                data-testid="front-btn-hamburger"
              >
                {mobileMenuOpen ? (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round"><line x1="6" y1="6" x2="18" y2="18"/><line x1="6" y1="18" x2="18" y2="6"/></svg>
                ) : (
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#111" strokeWidth="2" strokeLinecap="round"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>
                )}
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="sm:hidden border-t border-[#f0f0f0] bg-white px-4 py-4 space-y-4">
              <a href="#features" onClick={() => setMobileMenuOpen(false)} className="block text-[15px] text-[#555]">Features</a>
              <a href="#how-it-works" onClick={() => setMobileMenuOpen(false)} className="block text-[15px] text-[#555]">How It Works</a>
              <a href="#pricing" onClick={() => setMobileMenuOpen(false)} className="block text-[15px] text-[#555]">Pricing</a>
              <a href="#faq" onClick={() => setMobileMenuOpen(false)} className="block text-[15px] text-[#555]">FAQ</a>
              <div className="pt-2 border-t border-[#f0f0f0] flex flex-col gap-3">
                <button onClick={() => { setMobileMenuOpen(false); window.location.href = '/login'; }} className="text-[15px] text-[#555] text-left" data-testid="front-mobile-login">Log In</button>
                <button onClick={() => { setMobileMenuOpen(false); window.location.href = '/subscription'; }} className="w-full py-3 bg-[#111] text-white text-[14px] font-semibold" data-testid="front-mobile-get-started">Get Started</button>
              </div>
            </div>
          )}
        </nav>

        <section className="pt-[115px] sm:pt-[120px] pb-[40px] sm:pb-[50px] px-5 sm:px-6" data-testid="front-hero">
          <div className="max-w-[900px] mx-auto text-center">
            <h1 className="text-[36px] sm:text-[50px] md:text-[60px] text-[#000] leading-[1.08] sm:leading-[0.95] mb-4 sm:mb-8 max-w-[300px] sm:max-w-none mx-auto" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 800, letterSpacing: "-0.025em" }} data-testid="text-front-hero-headline">
              Know if you're fundable<br className="hidden sm:inline" /> before you apply
            </h1>
            <p className="text-[15px] sm:text-[18px] text-[#555] leading-[1.7] sm:leading-[1.6] max-w-[340px] sm:max-w-[480px] mx-auto mb-8 sm:mb-10" style={{ fontFamily: "'Inter', system-ui, sans-serif" }} data-testid="text-front-hero-sub">
              See your profile like a bank — plus a <span className="underline underline-offset-[3px] decoration-[1px] decoration-[#999]">Credit Operating System</span> to help you get funded.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-4 mb-5 sm:mb-6 w-full sm:max-w-none mx-auto">
              <button
                onClick={() => window.location.href = '/login'}
                className="px-8 py-3 sm:py-3.5 bg-[#111] border border-[#111] text-white text-[14px] font-semibold hover:bg-[#333] transition-colors"
                data-testid="front-btn-upload-hero"
              >
                Upload Report
              </button>
              <button
                onClick={() => window.location.href = '/login'}
                className="px-8 py-2.5 sm:py-3.5 text-[#555] text-[14px] font-medium sm:border sm:border-[#ddd] sm:hover:bg-[#f8f8f8] transition-colors"
                data-testid="front-btn-try-chat"
              >
                Try CreditOS
              </button>
            </div>
            <p className="text-[12px] text-[#bbb]">No hard inquiry. No credit card required to start.</p>
          </div>
        </section>

        <section className="overflow-hidden" data-testid="front-founders-strip">
          <style>{`
            @keyframes scrollFounders {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>
          <div className="flex gap-[6px]" style={{ animation: "scrollFounders 60s linear infinite", width: "max-content", WebkitAnimation: "scrollFounders 60s linear infinite" }}>
            {[...Array(2)].map((_, setIdx) => (
              <div key={setIdx} className="flex gap-[6px]">
                {[
                  { img: "/founders/founder1.jpg", name: "Maya R.", title: "E-commerce founder" },
                  { img: "/founders/founder2.jpg", name: "Sofia L.", title: "Marketing agency" },
                  { img: "/founders/founder3.jpg", name: "Kwame A.", title: "Tech startup CEO" },
                  { img: "/founders/founder4.jpg", name: "Darius J.", title: "Real estate investor" },
                  { img: "/founders/founder5.jpg", name: "Arjun P.", title: "SaaS founder" },
                  { img: "/founders/founder6.jpg", name: "Ravi M.", title: "Import/export business" },
                  { img: "/founders/founder7.jpg", name: "Suresh K.", title: "Consulting firm owner" },
                  { img: "/founders/founder8.jpg", name: "Amara N.", title: "Restaurant owner" },
                  { img: "/founders/founder9.jpg", name: "Keisha T.", title: "Agency founder" },
                  { img: "/founders/founder10.jpg", name: "Carmen D.", title: "Boutique owner" },
                  { img: "/founders/founder11.jpg", name: "Jasmine W.", title: "Freelance creative" },
                ].map((founder) => (
                  <div key={founder.name} className="w-[220px] h-[300px] sm:w-[320px] sm:h-[440px] shrink-0 relative overflow-hidden" data-testid={`founder-card-${founder.name.replace(/\s+/g, "-").toLowerCase()}`}>
                    <img src={founder.img} alt={founder.name} className="w-full h-full object-cover object-top" loading="lazy" />
                    <div className="absolute bottom-0 left-0 right-0 px-4 pb-4 pt-3" style={{ backdropFilter: "blur(12px)", WebkitBackdropFilter: "blur(12px)", background: "rgba(0,0,0,0.25)" }}>
                      <p className="text-[15px] font-semibold text-white leading-snug">{founder.name}</p>
                      <p className="text-[13px] text-white/85 leading-snug">{founder.title}</p>
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        </section>

        <section className="py-12 sm:py-16 px-5 sm:px-6 bg-white" data-testid="front-stats">
          <div className="max-w-[1000px] mx-auto flex flex-col sm:flex-row sm:flex-wrap items-center sm:justify-center gap-y-7 sm:gap-x-20 sm:gap-y-8">
            {[
              { value: "12K+", label: "Credit deletions generated" },
              { value: "$38M+", label: "Funding matched to founders" },
              { value: "94%", label: "Dispute success rate" },
            ].map((stat) => (
              <div key={stat.label} className="text-center" data-testid={`stat-${stat.label.replace(/\s+/g, "-").toLowerCase()}`}>
                <p className="text-[52px] sm:text-[48px] text-[#000] leading-none" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 800, letterSpacing: "-0.025em" }}>{stat.value}</p>
                <p className="text-[14px] sm:text-[14px] text-[#888] mt-2 sm:mt-2" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 400 }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </section>

        <section id="how-it-works" className="py-12 sm:py-16 px-5 sm:px-6 scroll-mt-16" style={{ backgroundColor: "#e8e5e0" }} data-testid="front-newsletter">
          <div className="max-w-[1000px] mx-auto flex flex-col md:flex-row items-center md:items-center justify-between gap-6 sm:gap-8">
            <div className="max-w-[420px] text-center md:text-left">
              <h3 className="text-[20px] sm:text-[24px] text-[#000] leading-[1.15] mb-3" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 800, letterSpacing: "-0.025em" }}>You're closer to funding than you think.</h3>
              <p className="text-[14px] sm:text-[15px] text-[#555] leading-[1.7] sm:leading-[1.6]">We show you how real profiles turn into capital — step by step.</p>
            </div>
            <div className="flex flex-col sm:flex-row w-full md:w-auto gap-2 sm:gap-0">
              {newsletterSubmitted ? (
                <div className="flex items-center gap-2 px-4 py-3 text-[14px] text-[#2d7a3a] font-medium" data-testid="text-newsletter-success">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M4 8l3 3 5-5" stroke="#2d7a3a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  You're in! Check your inbox.
                </div>
              ) : (
                <>
                  <input
                    type="email"
                    placeholder="Enter email..."
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && newsletterEmail.trim()) {
                        setNewsletterLoading(true);
                        fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: newsletterEmail.trim() }) })
                          .then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); })
                          .then(() => { setNewsletterSubmitted(true); setNewsletterEmail(""); })
                          .catch(() => alert("Something went wrong. Please try again."))
                          .finally(() => setNewsletterLoading(false));
                      }
                    }}
                    className="flex-1 md:w-[260px] px-4 py-3 bg-white border border-[#ccc] text-[14px] text-[#111] outline-none placeholder-[#999]"
                    data-testid="input-newsletter-email"
                  />
                  <button
                    disabled={newsletterLoading || !newsletterEmail.trim()}
                    onClick={() => {
                      if (!newsletterEmail.trim()) return;
                      setNewsletterLoading(true);
                      fetch("/api/newsletter", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: newsletterEmail.trim() }) })
                        .then(r => { if (!r.ok) throw new Error("Failed"); return r.json(); })
                        .then(() => { setNewsletterSubmitted(true); setNewsletterEmail(""); })
                        .catch(() => alert("Something went wrong. Please try again."))
                        .finally(() => setNewsletterLoading(false));
                    }}
                    className="px-6 py-3 bg-[#111] text-white text-[14px] font-semibold hover:bg-[#333] transition-colors whitespace-nowrap disabled:opacity-50"
                    data-testid="button-newsletter-submit"
                  >
                    {newsletterLoading ? "Submitting..." : "Get Weekly Insights"}
                  </button>
                </>
              )}
            </div>
          </div>
        </section>

        {(() => {
          const showcaseTabs = [
            {
              label: "AIS Score",
              bg: "linear-gradient(135deg, #5a7a50 0%, #3d5c3a 25%, #2a4a35 50%, #1a3a2e 75%, #0f2b22 100%)",
              gradientBase: "#1a3a2e",
              title: "AIS Score",
              desc: "Your Approval Intelligence Score — 23 data points analyzed to predict real lender decisions.",
              photo: "/pexels-gustavo-fring-7447388_1775149015902.jpg",
              cards: [
                <div key="ais1" className="bg-white rounded-xl p-5 shadow-2xl w-[210px] shrink-0">
                  <p className="text-[11px] text-[#888] font-medium uppercase tracking-wider mb-1">AIS</p>
                  <p className="text-[40px] font-black text-[#111] leading-none mb-1">72</p>
                  <p className="text-[12px] text-[#2d6a4f] font-semibold mb-3">Strong — Approval Likely</p>
                  <div className="w-full h-1.5 bg-[#f0f0f0] rounded-full overflow-hidden"><div className="h-full bg-[#2d6a4f] rounded-full" style={{ width: "72%" }} /></div>
                </div>,
                <div key="ais2" className="bg-white rounded-xl p-4 shadow-2xl w-[220px] shrink-0">
                  <p className="text-[11px] text-[#888] font-medium uppercase tracking-wider mb-2">Pillars</p>
                  {[{ n: "Payment", v: 98 }, { n: "Utilization", v: 88 }, { n: "Age", v: 65 }].map((p) => (
                    <div key={p.n} className="mb-2 last:mb-0"><div className="flex justify-between text-[10px] mb-0.5"><span className="text-[#666]">{p.n}</span><span className="font-semibold text-[#111]">{p.v}%</span></div><div className="w-full h-1 bg-[#f0f0f0] rounded-full"><div className="h-full bg-[#111] rounded-full" style={{ width: `${p.v}%` }} /></div></div>
                  ))}
                </div>,
                <div key="ais3" className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg w-[150px] shrink-0">
                  <p className="text-[10px] text-[#888] mb-1">Approval Odds</p>
                  <p className="text-[28px] font-black text-[#111] leading-none">89%</p>
                  <p className="text-[10px] text-[#2d6a4f] font-semibold">High confidence</p>
                </div>,
              ],
            },
            {
              label: "Credit Repair",
              bg: "linear-gradient(135deg, #6b8f71 0%, #4a7a5a 25%, #2d5a40 50%, #1a4030 75%, #0f2a1e 100%)",
              gradientBase: "#1a4030",
              title: "Credit Repair",
              desc: "Generate FCRA-compliant dispute letters and track deletions across all three bureaus.",
              photo: "/pexels-jay-brand-1763356224-34147233_1775149015900.jpg",
              cards: [
                <div key="cr1" className="bg-white rounded-xl p-5 shadow-2xl w-[210px] shrink-0">
                  <p className="text-[11px] text-[#888] font-medium uppercase tracking-wider mb-1">Dispute</p>
                  <p className="text-[14px] font-bold text-[#111] mb-1">Late Payment — Equifax</p>
                  <div className="flex items-center gap-1.5 mb-3">{["EQ", "TU", "EX"].map((b) => (<span key={b} className="text-[9px] px-2 py-0.5 bg-[#f5f5f5] text-[#666] font-medium rounded">{b}</span>))}</div>
                  <div className="bg-[#e8f5e9] rounded-lg px-3 py-2"><p className="text-[12px] font-semibold text-[#2d6a4f]">Ready to Send</p></div>
                </div>,
                <div key="cr2" className="bg-white rounded-xl p-4 shadow-2xl w-[220px] shrink-0">
                  <p className="text-[11px] text-[#888] font-medium uppercase tracking-wider mb-2">Deletions</p>
                  {[{ item: "Chase Late", s: "Deleted" }, { item: "Midland Coll.", s: "Pending" }, { item: "Amex Inquiry", s: "Disputed" }].map((d) => (
                    <div key={d.item} className="flex items-center justify-between py-1.5 border-b border-[#f0f0f0] last:border-0">
                      <span className="text-[10px] text-[#555]">{d.item}</span>
                      <span className={`text-[9px] font-semibold px-1.5 py-0.5 rounded ${d.s === "Deleted" ? "bg-[#e8f5e9] text-[#2d6a4f]" : d.s === "Pending" ? "bg-[#fff8e1] text-[#f57f17]" : "bg-[#e3f2fd] text-[#1565c0]"}`}>{d.s}</span>
                    </div>
                  ))}
                </div>,
                <div key="cr3" className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg w-[150px] shrink-0">
                  <p className="text-[10px] text-[#888] mb-1">Deletions</p>
                  <p className="text-[28px] font-black text-[#111] leading-none">14</p>
                  <p className="text-[10px] text-[#2d6a4f] font-semibold">Last 30 days</p>
                </div>,
              ],
            },
            {
              label: "Capital Matching",
              bg: "linear-gradient(135deg, #5a7a8a 0%, #3d5c6e 25%, #2a4555 50%, #1a3040 75%, #0f1e2e 100%)",
              gradientBase: "#1a3040",
              title: "Capital Matching",
              desc: "Get matched with real lenders based on your AIS score, bureau data, and funding profile.",
              photo: "/pexels-kevinbidwell-3934707_1775149015901.jpg",
              cards: [
                <div key="cm1" className="bg-white rounded-xl p-5 shadow-2xl w-[210px] shrink-0">
                  <p className="text-[11px] text-[#888] font-medium uppercase tracking-wider mb-1">Top Match</p>
                  <div className="flex items-center gap-2.5 mb-2"><div className="w-8 h-8 rounded-full bg-[#e8f0fe] flex items-center justify-center text-[10px] font-bold text-[#1a73e8]">BV</div><div><p className="text-[13px] font-semibold text-[#111]">Bluevine</p><p className="text-[10px] text-[#888]">87% match</p></div></div>
                  <p className="text-[20px] font-black text-[#111]">$50,000</p>
                  <p className="text-[11px] text-[#888]">Business Line of Credit</p>
                </div>,
                <div key="cm2" className="bg-white rounded-xl p-4 shadow-2xl w-[220px] shrink-0">
                  <p className="text-[11px] text-[#888] font-medium uppercase tracking-wider mb-2">More Matches</p>
                  {[{ name: "Fundbox", m: "82%" }, { name: "OnDeck", m: "76%" }, { name: "Kabbage", m: "71%" }].map((l) => (
                    <div key={l.name} className="flex items-center justify-between py-1.5 border-b border-[#f0f0f0] last:border-0">
                      <span className="text-[11px] font-semibold text-[#111]">{l.name}</span>
                      <span className="text-[10px] font-semibold text-[#2d6a4f]">{l.m}</span>
                    </div>
                  ))}
                </div>,
                <div key="cm3" className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg w-[150px] shrink-0">
                  <p className="text-[10px] text-[#888] mb-1">Total Available</p>
                  <p className="text-[28px] font-black text-[#111] leading-none">$160K</p>
                  <p className="text-[10px] text-[#2d6a4f] font-semibold">Across 4 lenders</p>
                </div>,
              ],
            },
            {
              label: "Simulator",
              bg: "linear-gradient(135deg, #8a6a7a 0%, #6e4d60 25%, #553a4a 50%, #3e2835 75%, #2a1a22 100%)",
              gradientBase: "#3e2835",
              title: "Capital Simulator",
              desc: "See how changes to utilization, inquiries, and tradelines affect your approval odds in real time.",
              photo: "/pexels-hasibullah-zhowandai-248954-1582920_1775149015902.jpg",
              cards: [
                <div key="sim1" className="bg-white rounded-xl p-5 shadow-2xl w-[210px] shrink-0">
                  <p className="text-[11px] text-[#888] font-medium uppercase tracking-wider mb-1">Projected</p>
                  <div className="flex items-end gap-2 mb-1"><span className="text-[32px] font-black text-[#111] leading-none">72</span><span className="text-[18px] font-bold text-[#2d6a4f] leading-none mb-0.5">→ 81</span></div>
                  <p className="text-[12px] text-[#2d6a4f] font-semibold">+9 points projected</p>
                </div>,
                <div key="sim2" className="bg-white rounded-xl p-4 shadow-2xl w-[220px] shrink-0">
                  <p className="text-[11px] text-[#888] font-medium uppercase tracking-wider mb-2">Variables</p>
                  {[{ label: "Utilization", val: "8%" }, { label: "Inquiries", val: "-3" }, { label: "Tradelines", val: "+2" }].map((s) => (
                    <div key={s.label} className="flex justify-between py-1 text-[10px]"><span className="text-[#666]">{s.label}</span><span className="font-semibold text-[#111]">{s.val}</span></div>
                  ))}
                </div>,
                <div key="sim3" className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg w-[150px] shrink-0">
                  <p className="text-[10px] text-[#888] mb-1">New Tier</p>
                  <p className="text-[24px] font-black text-[#111] leading-none mb-0.5">Excellent</p>
                  <p className="text-[10px] text-[#2d6a4f] font-semibold">Up from Strong</p>
                </div>,
              ],
            },
            {
              label: "Funding Timeline",
              bg: "linear-gradient(135deg, #6a8a8e 0%, #4d6e72 25%, #3a5558 50%, #283e42 75%, #1a2a2e 100%)",
              gradientBase: "#283e42",
              title: "Funding Timeline",
              desc: "Track your journey from report upload to funded — every milestone mapped out.",
              photo: "/pexels-sanketgraphy-34037221_1775149015902.jpg",
              cards: [
                <div key="ft1" className="bg-white rounded-xl p-5 shadow-2xl w-[210px] shrink-0">
                  <p className="text-[11px] text-[#888] font-medium uppercase tracking-wider mb-3">Timeline</p>
                  {[{ step: "Report Uploaded", done: true }, { step: "AIS Generated", done: true }, { step: "Disputes Filed", done: true }, { step: "First Deletion", done: false }].map((t, i) => (
                    <div key={t.step} className="flex items-center gap-2 mb-2 last:mb-0">
                      <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] ${t.done ? "bg-[#111] text-white" : "border-2 border-[#ddd] text-[#ccc]"}`}>{t.done ? "✓" : ""}</div>
                      <p className={`text-[12px] font-medium ${t.done ? "text-[#111]" : "text-[#999]"}`}>{t.step}</p>
                    </div>
                  ))}
                </div>,
                <div key="ft2" className="bg-white rounded-xl p-4 shadow-2xl w-[220px] shrink-0">
                  <p className="text-[11px] text-[#888] font-medium uppercase tracking-wider mb-2">Next Steps</p>
                  {[{ label: "Wait for bureau response", t: "~14 days" }, { label: "Submit lender app", t: "Day 30" }].map((s) => (
                    <div key={s.label} className="flex justify-between py-1.5 border-b border-[#f0f0f0] last:border-0 text-[10px]"><span className="text-[#555]">{s.label}</span><span className="font-semibold text-[#111]">{s.t}</span></div>
                  ))}
                </div>,
                <div key="ft3" className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg w-[150px] shrink-0">
                  <p className="text-[10px] text-[#888] mb-1">Progress</p>
                  <p className="text-[28px] font-black text-[#111] leading-none">60%</p>
                  <p className="text-[10px] text-[#888]">3 of 5 complete</p>
                </div>,
              ],
            },
            {
              label: "Community",
              bg: "linear-gradient(135deg, #8a8a5a 0%, #6e6e3d 25%, #55552a 50%, #3e3e1a 75%, #2a2a0f 100%)",
              gradientBase: "#3e3e1a",
              title: "Community Intelligence",
              desc: "Real data points from Reddit, myFICO, and founder communities — extracted and scored by AI.",
              photo: "/pexels-gustavo-fring-7447388_1775149015902.jpg",
              cards: [
                <div key="co1" className="bg-white rounded-xl p-5 shadow-2xl w-[210px] shrink-0">
                  <p className="text-[11px] text-[#888] font-medium uppercase tracking-wider mb-2">Trending</p>
                  {[{ text: "Chase Ink at AIS 62", src: "r/CreditCards" }, { text: "Navy Fed auto recon", src: "myFICO" }, { text: "Amex CLI trick", src: "r/churning" }].map((p) => (
                    <div key={p.text} className="py-1.5 border-b border-[#f0f0f0] last:border-0">
                      <p className="text-[11px] text-[#111] font-medium">{p.text}</p>
                      <p className="text-[9px] text-[#888]">{p.src}</p>
                    </div>
                  ))}
                </div>,
                <div key="co2" className="bg-white rounded-xl p-4 shadow-2xl w-[220px] shrink-0">
                  <p className="text-[11px] text-[#888] font-medium uppercase tracking-wider mb-2">Stats</p>
                  {[{ l: "Data Points", v: "2.4K+" }, { l: "Sources", v: "12" }, { l: "Updated", v: "1hr" }].map((s) => (
                    <div key={s.l} className="flex justify-between py-1 text-[10px]"><span className="text-[#666]">{s.l}</span><span className="font-semibold text-[#111]">{s.v}</span></div>
                  ))}
                </div>,
                <div key="co3" className="bg-white/90 backdrop-blur-sm rounded-xl p-4 shadow-lg w-[150px] shrink-0">
                  <p className="text-[10px] text-[#888] mb-1">Members</p>
                  <p className="text-[28px] font-black text-[#111] leading-none">1.2K</p>
                  <p className="text-[10px] text-[#2d6a4f] font-semibold">Active community</p>
                </div>,
              ],
            },
          ];
          return (
            <section className="py-[50px] sm:py-[80px] px-5 sm:px-6 bg-[#111]" data-testid="front-product-showcase">
              <div className="max-w-[1100px] mx-auto">
                <h2 className="text-[28px] sm:text-[36px] md:text-[46px] text-white leading-[1.1] sm:leading-[1.05] mb-8 sm:mb-10 text-center max-w-[280px] sm:max-w-none mx-auto" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 800, letterSpacing: "-0.025em" }}>Choose how you turn your credit profile into bank funding.</h2>
                <div className="hidden sm:flex overflow-x-auto no-scrollbar items-center justify-center gap-2 sm:gap-3 mb-8 sm:mb-10">
                  {showcaseTabs.map((tab, i) => (
                    <span key={tab.label} onClick={() => setShowcaseTab(i)} className={`px-4 sm:px-5 py-2 text-[12px] sm:text-[13px] font-medium border cursor-pointer transition-colors whitespace-nowrap shrink-0 ${showcaseTab === i ? "bg-white text-[#111] border-white" : "bg-transparent text-white/70 border-white/20 hover:border-white/40"}`} data-testid={`showcase-tab-${tab.label.replace(/\s+/g, "-").toLowerCase()}`}>{tab.label}</span>
                  ))}
                </div>
                <div className="relative" style={{ minHeight: "400px" }}>
                  {showcaseTabs.map((tab, i) => (
                    <div
                      key={tab.label}
                      className="absolute inset-0 transition-all duration-700 ease-in-out"
                      style={{
                        opacity: showcaseTab === i ? 1 : 0,
                        transform: showcaseTab === i ? "translateX(0)" : showcaseTab > i ? "translateX(-30px)" : "translateX(30px)",
                        pointerEvents: showcaseTab === i ? "auto" : "none",
                        zIndex: showcaseTab === i ? 2 : 1,
                      }}
                    >
                      <div className="hidden md:block rounded-2xl overflow-hidden relative h-full" style={{ background: tab.bg, minHeight: "400px" }}>
                        <div className="absolute top-8 left-10 z-30 max-w-[280px]">
                          <p className="text-[26px] font-bold text-white mb-2 leading-[1.15]">{tab.title}</p>
                          <p className="text-[13px] text-white/60 leading-[1.5]">{tab.desc}</p>
                        </div>
                        <div className="absolute right-0 top-0 bottom-0 w-[58%]" style={{ padding: "16px" }}>
                          <div style={{ width: "100%", height: "100%", borderRadius: "14px", border: "2px solid rgba(255,255,255,0.12)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)", overflow: "hidden" }}>
                            <img src={tab.photo} alt="" className="w-full h-full object-cover" style={{ objectPosition: "center 40%" }} />
                          </div>
                        </div>
                        <div className="absolute z-20" style={{ left: "28%", top: "130px" }}>
                          <div className="relative">
                            <div className="relative z-10">{tab.cards[0]}</div>
                            {tab.cards[1] && <div className="relative z-[5] -mt-3 ml-4">{tab.cards[1]}</div>}
                          </div>
                        </div>
                        {tab.cards[2] && <div className="absolute z-20" style={{ bottom: "28px", right: "40px" }}>{tab.cards[2]}</div>}
                        <div className="absolute left-0 top-0 bottom-0 w-[48%] z-10" style={{ background: `linear-gradient(to right, ${tab.gradientBase} 50%, transparent 100%)` }} />
                      </div>

                      <div className="md:hidden rounded-2xl overflow-hidden" style={{ background: tab.bg }}>
                        <div className="px-5 pt-6 pb-4">
                          <p className="text-[22px] font-bold text-white mb-2 leading-[1.15]">{tab.title}</p>
                          <p className="text-[13px] text-white/60 leading-[1.5]">{tab.desc}</p>
                        </div>
                        <div className="px-4 pb-6 flex items-end gap-3">
                          <div className="flex-1 min-w-0 shrink-0" style={{ maxWidth: "55%" }}>
                            <div className="relative">
                              <div className="relative z-10">{tab.cards[0]}</div>
                              {tab.cards[2] && (
                                <div className="absolute z-[5] -top-2 left-2 right-[-8px] opacity-50 scale-[0.95]">{tab.cards[2]}</div>
                              )}
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="rounded-xl overflow-hidden" style={{ border: "2px solid rgba(255,255,255,0.12)", boxShadow: "0 4px 24px rgba(0,0,0,0.3)" }}><img src={tab.photo} alt="" className="w-full h-[200px] object-cover" style={{ objectPosition: "center 40%" }} /></div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="flex sm:hidden items-center justify-center gap-2 mt-6">
                  {showcaseTabs.map((_, i) => (
                    <div key={i} className={`h-[3px] rounded-full transition-all ${showcaseTab === i ? "w-6 bg-white" : "w-3 bg-white/25"}`} />
                  ))}
                </div>
              </div>
            </section>
          );
        })()}

        <section className="py-4 sm:py-6 border-y border-[#f0f0f0] bg-[#fafafa] overflow-hidden" data-testid="front-social-proof">
          <style>{`
            @keyframes scrollProof {
              0% { transform: translateX(0); }
              100% { transform: translateX(-50%); }
            }
          `}</style>
          <div className="sm:max-w-[900px] sm:mx-auto sm:px-6 sm:flex sm:justify-center sm:gap-x-10">
            <div className="flex sm:hidden gap-x-8" style={{ animation: "scrollProof 25s linear infinite", width: "max-content", WebkitAnimation: "scrollProof 25s linear infinite" }}>
              {[...Array(2)].map((_, setIdx) => (
                <div key={setIdx} className="flex gap-x-8">
                  {["23 Data Points Analyzed", "FCRA-Compliant Letters", "Real Lender Matching", "AES-256 Encryption", "No Hard Inquiries"].map((item) => (
                    <span key={item} className="text-[11px] text-[#999] font-medium tracking-wide uppercase flex items-center gap-2 shrink-0 whitespace-nowrap">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0"><path d="M4 8l3 3 5-5" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                      {item}
                    </span>
                  ))}
                </div>
              ))}
            </div>
            <div className="hidden sm:contents">
              {["23 Data Points Analyzed", "FCRA-Compliant Letters", "Real Lender Matching", "AES-256 Encryption", "No Hard Inquiries"].map((item) => (
                <span key={item} className="text-[12px] text-[#999] font-medium tracking-wide uppercase flex items-center gap-2 shrink-0 whitespace-nowrap">
                  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="shrink-0"><path d="M4 8l3 3 5-5" stroke="#999" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {item}
                </span>
              ))}
            </div>
          </div>
        </section>

        <section id="features" className="py-[50px] sm:py-[80px] px-5 sm:px-6 bg-white scroll-mt-16" data-testid="front-operating-system">
          <div className="max-w-[900px] mx-auto text-center">
            <h2 className="text-[28px] sm:text-[36px] md:text-[48px] text-[#000] leading-[1.1] sm:leading-[1.05] mb-4" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 800, letterSpacing: "-0.025em" }}>Your credit profile. One system.</h2>
            <p className="text-[14px] sm:text-[16px] text-[#888] max-w-[320px] sm:max-w-[520px] mx-auto leading-[1.7] sm:leading-[1.6]">Your credit, capital, and funding in one system — so you can see how banks evaluate you before you apply. Fix what matters. Move with precision. Get funded.</p>
          </div>
        </section>

        <section className="py-[50px] sm:py-[80px] px-2 sm:px-6 bg-white border-t border-[#f0f0f0]" data-testid="front-all-in-one">
          <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row items-center gap-10 sm:gap-12">
            <div className="flex-1 w-full">
              <div className="rounded-xl sm:rounded-2xl" style={{ background: "#f0ede8", padding: "20px 16px" }}>
                <div className="bg-white rounded-xl p-4 shadow-sm">
                  <div className="flex items-center gap-3 mb-4 pb-3 border-b border-[#f0f0f0]">
                    <img src="/profundr-brain-logo.png" alt="" className="w-7 h-7" />
                    <span className="text-[13px] font-semibold text-[#111]">profundr</span>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-[110px] shrink-0">
                      <div className="flex items-center gap-2 mb-3">
                        <img src="/founders/founder6.jpg" alt="" className="w-5 h-5 rounded-full object-cover" />
                        <span className="text-[10px] text-[#888]">Marcus J.</span>
                      </div>
                      {["Dashboard", "Bureau Reports", "Disputes", "Capital Match", "Simulator", "Community", "More"].map((item, i) => (
                        <div key={item} className={`text-[11px] py-1.5 px-2 rounded ${i === 0 ? "bg-[#f5f5f5] font-semibold text-[#111]" : "text-[#888]"}`}>{item}</div>
                      ))}
                    </div>
                    <div className="flex-1 bg-[#fafafa] rounded-lg p-3 border border-[#f0f0f0]">
                      <p className="text-[9px] text-[#888] mb-0.5">Dashboard</p>
                      <p className="text-[13px] font-semibold text-[#111] mb-3">Welcome back, Marcus</p>
                      <p className="text-[9px] text-[#888] mb-0.5">AIS Score</p>
                      <p className="text-[20px] font-black text-[#111] mb-1">72 → 84</p>
                      <p className="text-[9px] text-[#2d6a4f] font-semibold mb-2">+12 pts in 60 days</p>
                      <div className="h-[45px]">
                        <svg viewBox="0 0 200 50" className="w-full h-full"><path d="M0 45 Q30 42 60 38 T100 28 T140 18 T180 8 L200 5" stroke="#2d6a4f" strokeWidth="2" fill="none"/><path d="M0 45 Q30 42 60 38 T100 28 T140 18 T180 8 L200 5 V50 H0 Z" fill="#2d6a4f" opacity="0.08"/></svg>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-[24px] sm:text-[32px] font-bold text-[#111] leading-[1.15] mb-3 text-center md:text-left" style={{ letterSpacing: "-0.02em" }}>All-in-one that actually works</h3>
              <p className="text-[14px] sm:text-[15px] text-[#555] leading-[1.7] sm:leading-[1.6] mb-7 sm:mb-6 text-center md:text-left">Profundr gives you one connected system to analyze credit, generate disputes, match with lenders, and track your AIS score — all in real time.</p>
              <ul className="space-y-5 sm:space-y-3 mb-8 sm:mb-6">
                {["AIS scoring, disputes, and capital matching fully connected", "Centralized view of your financial identity across 3 bureaus", "Tools built specifically for founder and business funding", "Less complexity — one upload, full analysis"].map((item) => (
                  <li key={item} className="flex items-start gap-3"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0"><path d="M4 8l3 3 5-5" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg><span className="text-[14px] text-[#555] leading-[1.6]">{item}</span></li>
                ))}
              </ul>
              <p className="text-[11px] text-[#888] uppercase tracking-wider mb-4">Replaces</p>
              <div className="flex flex-wrap items-center gap-2 mb-8 sm:mb-6">
                {["Credit Karma", "Nav.com", "Spreadsheets"].map((r) => (
                  <span key={r} className="text-[12px] px-3 py-1.5 bg-[#f5f5f5] text-[#666] font-medium rounded-full flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-[#ddd] shrink-0" />{r}</span>
                ))}
              </div>
              <div className="text-center sm:text-left"><button onClick={() => window.location.href = '/subscription'} className="px-5 py-2.5 bg-[#111] text-white text-[13px] font-semibold hover:bg-[#333] transition-colors" data-testid="btn-watch-demo-1">Get Started</button></div>
            </div>
          </div>
        </section>

        <section className="py-[50px] sm:py-[80px] px-2 sm:px-6 bg-white border-t border-[#f0f0f0]" data-testid="front-sell-confidence">
          <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row items-center gap-10 sm:gap-12">
            <div className="flex-1 order-2 md:order-1">
              <h3 className="text-[24px] sm:text-[32px] font-bold text-[#111] leading-[1.15] mb-3 text-center md:text-left" style={{ letterSpacing: "-0.02em" }}>Dispute and delete with precision</h3>
              <p className="text-[14px] sm:text-[15px] text-[#555] leading-[1.7] sm:leading-[1.6] mb-7 sm:mb-6 text-center md:text-left">FCRA-compliant dispute letters generated in seconds. Track every deletion across Equifax, TransUnion, and Experian in real time.</p>
              <ul className="space-y-5 sm:space-y-3 mb-8 sm:mb-6">
                {["AI-generated dispute letters with legal compliance", "Track deletions across all three bureaus in one view", "Automated follow-ups and escalation paths", "Bureau response tracking with timeline", "Success rate analytics per dispute type"].map((item) => (
                  <li key={item} className="flex items-start gap-3"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0"><path d="M4 8l3 3 5-5" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg><span className="text-[14px] text-[#555] leading-[1.6]">{item}</span></li>
                ))}
              </ul>
              <p className="text-[11px] text-[#888] uppercase tracking-wider mb-4">Replaces</p>
              <div className="flex flex-wrap items-center gap-2 mb-8 sm:mb-6">
                {["DisputeBee", "Credit Saint", "Manual Letters"].map((r) => (
                  <span key={r} className="text-[12px] px-3 py-1.5 bg-[#f5f5f5] text-[#666] font-medium rounded-full flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-[#ddd] shrink-0" />{r}</span>
                ))}
              </div>
              <div className="text-center sm:text-left"><button onClick={() => window.location.href = '/login'} className="px-5 py-2.5 bg-[#111] text-white text-[13px] font-semibold hover:bg-[#333] transition-colors" data-testid="btn-watch-demo-2">Upload Report</button></div>
            </div>
            <div className="flex-1 order-1 md:order-2 w-full">
              <div className="rounded-xl sm:rounded-2xl" style={{ background: "#f0ede8", padding: "28px 20px" }}>
                <div className="flex gap-4 items-start">
                  <div className="shrink-0" style={{ width: "42%" }}>
                    <div className="bg-white rounded-xl px-3 py-2.5 shadow-md inline-flex items-center gap-2 mb-3">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="3" stroke="#111" strokeWidth="1.5"/><path d="M8 12h8" stroke="#111" strokeWidth="1.5" strokeLinecap="round"/></svg>
                      <span className="text-[12px] font-semibold text-[#111]">Disputes</span>
                    </div>

                    {[
                      { color: "bg-[#2d6a4f]", icon: <svg width="8" height="8" viewBox="0 0 16 16" fill="none"><path d="M4 8l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg>, name: "Late Payment — Chase", badge: "Deleted", bc: "bg-[#e8f5e9] text-[#2d6a4f]" },
                      { color: "bg-[#f59e0b]", icon: <span className="text-[7px] text-white font-bold">!</span>, name: "Collection — Midland", badge: "Pending", bc: "bg-[#fff8e1] text-[#f57f17]" },
                      { color: "bg-[#1565c0]", icon: <span className="text-[7px] text-white font-bold">→</span>, name: "Hard Inquiry — Amex", badge: "Filed", bc: "bg-[#e3f2fd] text-[#1565c0]" },
                    ].map((d, i) => (
                      <div key={d.name}>
                        {i > 0 && <svg className="ml-4" width="2" height="16"><line x1="1" y1="0" x2="1" y2="16" stroke="#ccc" strokeWidth="1.5" strokeDasharray="4 3"/></svg>}
                        <div className="flex items-center gap-1.5 my-1.5">
                          <div className={`w-4 h-4 rounded-full ${d.color} flex items-center justify-center shrink-0`}>{d.icon}</div>
                          <span className="text-[10px] text-[#333] leading-tight">{d.name}</span>
                          <span className={`text-[8px] font-semibold px-1 py-0.5 rounded shrink-0 ${d.bc}`}>{d.badge}</span>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="flex-1 pt-4">
                    <div className="bg-white rounded-xl shadow-lg border border-[#f0f0f0] overflow-hidden">
                      <img src="/founders/founder5.jpg" alt="" className="w-full h-auto object-cover object-top" />
                      <div className="p-3">
                        <p className="text-[13px] font-bold text-[#111]">FCRA Dispute Letter</p>
                        <p className="text-[10px] text-[#888] mt-1">Auto-generated · Equifax</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-[#888]">Deletion Rate</span>
                          <span className="text-[14px] font-black text-[#2d6a4f]">73%</span>
                        </div>
                        <div className="mt-2 bg-[#e8f5e9] text-[#2d6a4f] text-[11px] font-semibold rounded-lg px-3 py-1.5 text-center">Ready to Send</div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="py-[50px] sm:py-[80px] px-2 sm:px-6 bg-[#fafafa] border-t border-[#f0f0f0]" data-testid="front-funnels">
          <div className="max-w-[1100px] mx-auto flex flex-col md:flex-row items-center gap-10 sm:gap-12">
            <div className="flex-1 w-full">
              <div className="rounded-xl sm:rounded-2xl" style={{ background: "#f0ede8", padding: "28px 20px" }}>
                <div className="flex gap-4 items-start">
                  <div className="shrink-0" style={{ width: "42%" }}>
                    <div className="bg-white rounded-xl px-3 py-2.5 shadow-md inline-flex items-center gap-2 mb-3">
                      <svg width="14" height="14" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="#111" strokeWidth="1.5" strokeLinejoin="round"/></svg>
                      <span className="text-[12px] font-semibold text-[#111]">Capital Match</span>
                    </div>

                    {[{ icon: "B", name: "Bluevine", detail: "LOC · $75K" }, { icon: "O", name: "OnDeck", detail: "Term · $50K" }, { icon: "F", name: "Fundbox", detail: "LOC · $35K" }].map((l, i) => (
                      <div key={l.name}>
                        {i > 0 && <svg className="ml-4" width="2" height="16"><line x1="1" y1="0" x2="1" y2="16" stroke="#ccc" strokeWidth="1.5" strokeDasharray="4 3"/></svg>}
                        <div className="flex items-center gap-1.5 my-1.5">
                          <div className="w-4 h-4 rounded-full bg-[#111] flex items-center justify-center shrink-0"><span className="text-[7px] text-white font-bold">{l.icon}</span></div>
                          <span className="text-[10px] text-[#333]">{l.name}</span>
                          <span className="text-[8px] text-[#888]">{l.detail}</span>
                        </div>
                      </div>
                    ))}

                    <svg className="ml-4" width="2" height="16"><line x1="1" y1="0" x2="1" y2="16" stroke="#ccc" strokeWidth="1.5" strokeDasharray="4 3"/></svg>

                    <div className="flex items-center gap-1.5 mt-1">
                      <div className="w-4 h-4 rounded-full bg-[#2d6a4f] flex items-center justify-center shrink-0"><svg width="8" height="8" viewBox="0 0 16 16" fill="none"><path d="M4 8l3 3 5-5" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/></svg></div>
                      <span className="text-[10px] font-medium text-[#2d6a4f]">3 matches ready</span>
                    </div>
                  </div>

                  <div className="flex-1 pt-4">
                    <div className="bg-white rounded-xl shadow-lg border border-[#f0f0f0] overflow-hidden">
                      <img src="/founders/founder10.jpg" alt="" className="w-full h-auto object-cover object-top" />
                      <div className="p-3">
                        <p className="text-[13px] font-bold text-[#111]">Funded: $120K LOC</p>
                        <p className="text-[10px] text-[#888] mt-1">AIS 58 → funded in 47 days</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-[10px] text-[#888]">Match Rate</span>
                          <span className="text-[14px] font-black text-[#2d6a4f]">92%</span>
                        </div>
                        <div className="mt-2 flex items-center gap-1">
                          {[1,2,3,4,5].map((s) => (<svg key={s} width="11" height="11" viewBox="0 0 16 16"><polygon points="8,1 10,6 16,6 11,9.5 13,15 8,11.5 3,15 5,9.5 0,6 6,6" fill="#f59e0b"/></svg>))}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="flex-1">
              <h3 className="text-[24px] sm:text-[32px] font-bold text-[#111] leading-[1.15] mb-3 text-center md:text-left" style={{ letterSpacing: "-0.02em" }}>Capital matching that works</h3>
              <p className="text-[14px] sm:text-[15px] text-[#555] leading-[1.7] sm:leading-[1.6] mb-7 sm:mb-6 text-center md:text-left">Get matched with real lenders based on your AIS score, bureau profile, and business data. No guessing — just funded founders.</p>
              <ul className="space-y-5 sm:space-y-3 mb-8 sm:mb-6">
                {["AI-powered lender matching across 50+ products", "Real approval odds based on your AIS profile", "Track applications from match to funded", "Success stories from real Profundr users"].map((item) => (
                  <li key={item} className="flex items-start gap-3"><svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0"><path d="M4 8l3 3 5-5" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg><span className="text-[14px] text-[#555] leading-[1.6]">{item}</span></li>
                ))}
              </ul>
              <p className="text-[11px] text-[#888] uppercase tracking-wider mb-4">Replaces</p>
              <div className="flex flex-wrap items-center gap-2 mb-8 sm:mb-6">
                {["Lendio", "Fundera", "Cold Applications"].map((r) => (
                  <span key={r} className="text-[12px] px-3 py-1.5 bg-[#f5f5f5] text-[#666] font-medium rounded-full flex items-center gap-1.5"><span className="w-4 h-4 rounded-full bg-[#ddd] shrink-0" />{r}</span>
                ))}
              </div>
              <div className="text-center sm:text-left"><button onClick={() => window.location.href = '/subscription'} className="px-5 py-2.5 bg-[#111] text-white text-[13px] font-semibold hover:bg-[#333] transition-colors" data-testid="btn-watch-demo-3">See Your Matches</button></div>
            </div>
          </div>
        </section>

        <section className="py-[50px] sm:py-[60px] px-5 sm:px-6 bg-white border-t border-[#f0f0f0]" data-testid="front-value-props">
          <div className="max-w-[1100px] mx-auto grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
            {[
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><path d="M12 2L3 7v10l9 5 9-5V7l-9-5z" stroke="#111" strokeWidth="1.5" strokeLinejoin="round"/><path d="M12 12v10M12 12L3 7M12 12l9-5" stroke="#111" strokeWidth="1.5"/></svg>, title: "AES-256 encrypted", desc: "Your bureau data is encrypted end-to-end with bank-level security. We never share or sell your information." },
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><circle cx="12" cy="8" r="4" stroke="#111" strokeWidth="1.5"/><path d="M4 20c0-4 4-7 8-7s8 3 8 7" stroke="#111" strokeWidth="1.5" strokeLinecap="round"/></svg>, title: "Human support 24/7", desc: "Get help from real credit and funding specialists who understand founder finance. Support is available at any hour." },
              { icon: <svg width="20" height="20" viewBox="0 0 24 24" fill="none"><rect x="3" y="3" width="18" height="18" rx="2" stroke="#111" strokeWidth="1.5"/><path d="M7 12h2v5H7zM11 8h2v9h-2zM15 10h2v7h-2z" fill="#111"/></svg>, title: "Built to last", desc: "Profundr powers millions in funded capital with a stable, secure platform you can rely on as you grow." },
            ].map((item) => (
              <div key={item.title} className="border border-[#e8e8e8] rounded-2xl p-6 sm:p-8 bg-white text-center sm:text-left">
                <div className="w-12 h-12 rounded-xl border border-[#e8e8e8] flex items-center justify-center mb-6 sm:mb-16 mx-auto sm:mx-0">{item.icon}</div>
                <h4 className="text-[18px] font-bold text-[#111] mb-2">{item.title}</h4>
                <p className="text-[14px] text-[#888] leading-[1.6]">{item.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {(() => {
          const testimonials = [
            { name: "Ravi M.", role: "Import/Export Business", amount: "$120K+", label: "Funded on Profundr", quote: "I uploaded my bureau report and within a day I realized how much easier everything was for me. It wasn't until I joined Profundr and got my AIS score that I actually started getting approved.", photo: "/founders/founder6.jpg" },
            { name: "Maya R.", role: "E-commerce Founder", amount: "$85K+", label: "Funded on Profundr", quote: "The dispute letters worked instantly. Three negative items removed across two bureaus in 30 days. My AIS went from 41 to 73 and I got matched with four lenders.", photo: "/founders/founder1.jpg" },
            { name: "Kwame A.", role: "Tech Startup CEO", amount: "$200K+", label: "Funded on Profundr", quote: "I'd been applying blindly for months. Profundr showed me which lenders actually approve my profile. Got funded on the second try — the capital matching is unreal.", photo: "/founders/founder3.jpg" },
          ];
          const t = testimonials[testIdx];
          const prevIdx = testIdx === 0 ? testimonials.length - 1 : testIdx - 1;
          const nextIdx = testIdx === testimonials.length - 1 ? 0 : testIdx + 1;
          return (
            <section className="py-[50px] sm:py-[80px] bg-[#111]" data-testid="front-testimonials-kajabi">
              <h2 className="text-[30px] sm:text-[32px] md:text-[42px] text-white leading-[1.1] sm:leading-[1.05] mb-8 sm:mb-12 px-5 sm:px-6 text-center" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 800, letterSpacing: "-0.025em" }}>Why founders choose Profundr</h2>

              <div className="md:hidden px-5">
                <div className="rounded-2xl overflow-hidden mb-6">
                  <img src={t.photo} alt={t.name} className="w-full h-[380px] object-cover object-top" style={{ background: "#222" }} />
                </div>
                <div className="mb-2">
                  <svg width="36" height="28" viewBox="0 0 36 28" fill="none"><path d="M0 28V16.8C0 7.47 5.4 1.87 16.2 0l1.8 3.74C11.7 5.6 9 9.33 8.1 14H15.75V28H0zm19.8 0V16.8C19.8 7.47 25.2 1.87 36 0l-1.8 3.74C28.5 5.6 25.8 9.33 24.9 14H32.55v14H19.8z" fill="#444"/></svg>
                </div>
                <p className="text-[18px] text-white/80 leading-[1.6] mb-6" style={{ fontFamily: "'Inter', system-ui, sans-serif" }}>{t.quote}</p>
                <div className="flex items-center gap-3 mb-2">
                  <div>
                    <p className="text-[15px] font-bold text-white">{t.name}</p>
                    <p className="text-[13px] text-white/50">{t.role}</p>
                  </div>
                </div>
                <div className="mt-4 pt-4 border-t border-white/10">
                  <p className="text-[32px] font-black text-white leading-none">{t.amount}</p>
                  <p className="text-[13px] text-white/50 mt-1">{t.label}</p>
                </div>
                <div className="flex items-center justify-between mt-8">
                  <div className="flex items-center gap-2">
                    {testimonials.map((_, i) => (
                      <div key={i} onClick={() => setTestIdx(i)} className={`h-[3px] cursor-pointer transition-all ${testIdx === i ? "w-8 bg-white" : "w-5 bg-white/20"}`} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setTestIdx(prevIdx)} className="w-10 h-10 border border-white/20 flex items-center justify-center" data-testid="btn-test-prev-m"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 4l-4 4 4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    <button onClick={() => setTestIdx(nextIdx)} className="w-10 h-10 border border-white/20 flex items-center justify-center" data-testid="btn-test-next-m"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                  </div>
                </div>
              </div>

              <div className="hidden md:block px-12 lg:px-24">
                <div className="bg-[#1a1a1a] overflow-hidden">
                  <div className="flex flex-row">
                    <div className="w-[42%] shrink-0">
                      <img src={t.photo} alt={t.name} className="w-full h-full object-cover object-top" />
                    </div>
                    <div className="flex-1 p-12 flex flex-col justify-center">
                      <svg width="28" height="20" viewBox="0 0 32 24" fill="none" className="mb-6"><path d="M0 24V14.4C0 6.4 4.8 1.6 14.4 0l1.6 3.2C10.4 4.8 8 8 7.2 12H14V24H0zm18 0V14.4C18 6.4 22.8 1.6 32 0l-1.6 3.2C24.8 4.8 22.4 8 21.6 12H28v12H18z" fill="#444"/></svg>
                      <p className="text-[15px] text-white/80 leading-[1.7] mb-6">"{t.quote}"</p>
                      <p className="text-[16px] font-bold text-white mb-0.5">{t.name}</p>
                      <p className="text-[13px] text-white/50 mb-8">{t.role}</p>
                      <div>
                        <p className="text-[36px] font-black text-white leading-none">{t.amount}</p>
                        <p className="text-[13px] text-white/50 mt-1">{t.label}</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between mt-10" data-testid="testimonial-nav">
                  <div className="flex items-center gap-2">
                    {testimonials.map((_, i) => (
                      <div key={i} onClick={() => setTestIdx(i)} className={`h-[3px] cursor-pointer transition-all ${testIdx === i ? "w-8 bg-white" : "w-5 bg-white/20"}`} />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => setTestIdx(prevIdx)} className="w-10 h-10 border border-white/20 flex items-center justify-center hover:border-white/50 transition-colors" data-testid="btn-test-prev"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M10 4l-4 4 4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                    <button onClick={() => setTestIdx(nextIdx)} className="w-10 h-10 border border-white/20 flex items-center justify-center hover:border-white/50 transition-colors" data-testid="btn-test-next"><svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M6 4l4 4-4 4" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg></button>
                  </div>
                </div>
              </div>
            </section>
          );
        })()}

        <section id="pricing" className="py-[50px] sm:py-[80px] px-5 sm:px-6 bg-white border-t border-[#f0f0f0] scroll-mt-16" data-testid="front-pricing">
          <div className="max-w-[1100px] mx-auto">
            <h2 className="text-[28px] sm:text-[36px] md:text-[46px] text-[#000] leading-[1.1] sm:leading-[1.05] mb-3 text-center" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 800, letterSpacing: "-0.025em" }}>Simple, transparent pricing</h2>
            <p className="text-[14px] sm:text-[16px] text-[#888] text-center mb-10 sm:mb-14 max-w-[400px] mx-auto leading-[1.6]">Choose the plan that matches where you are in your funding journey.</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5">
              {[
                { name: "Basic", price: "$25", period: "/mo", desc: "Get your AIS score and AI chat.", features: ["AI capital chat", "AIS score analysis", "23-point credit breakdown", "Bureau report upload"], cta: "Start Basic" },
                { name: "Repair", price: "$50", period: "/mo", desc: "Fix your credit with precision.", features: ["Everything in Basic", "FCRA dispute letter generator", "Bureau deletion tracking", "Automated follow-ups", "Success rate analytics"], popular: true, cta: "Start Repair" },
                { name: "Capital", price: "$150", period: "/mo", desc: "Full capital operating system.", features: ["Everything in Repair", "Capital Simulator", "Lender Match Engine", "Funding Timeline", "Community Intelligence", "Priority support"], cta: "Start Capital" },
              ].map((plan) => (
                <div key={plan.name} className={`border rounded-2xl p-6 sm:p-8 relative ${plan.popular ? "border-[#111] bg-[#fafafa]" : "border-[#e8e8e8] bg-white"}`} data-testid={`pricing-${plan.name.toLowerCase()}`}>
                  {plan.popular && <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-[#111] text-white text-[10px] font-semibold uppercase tracking-wider">Most Popular</div>}
                  <p className="text-[13px] font-semibold text-[#888] uppercase tracking-wider mb-2">{plan.name}</p>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className="text-[40px] sm:text-[48px] font-black text-[#111] leading-none">{plan.price}</span>
                    <span className="text-[14px] text-[#888]">{plan.period}</span>
                  </div>
                  <p className="text-[14px] text-[#555] mb-6">{plan.desc}</p>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2.5 text-[13px] text-[#555]">
                        <svg width="14" height="14" viewBox="0 0 16 16" fill="none" className="mt-0.5 shrink-0"><path d="M4 8l3 3 5-5" stroke="#111" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        {f}
                      </li>
                    ))}
                  </ul>
                  <button onClick={() => window.location.href = '/subscription'} className={`w-full py-3 text-[13px] font-semibold transition-colors ${plan.popular ? "bg-[#111] text-white hover:bg-[#333]" : "border border-[#ddd] text-[#111] hover:bg-[#f5f5f5]"}`} data-testid={`btn-pricing-${plan.name.toLowerCase()}`}>{plan.cta}</button>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="faq" className="py-[50px] sm:py-[80px] px-5 sm:px-6 bg-[#fafafa] border-t border-[#f0f0f0] scroll-mt-16" data-testid="front-faq">
          <div className="max-w-[700px] mx-auto">
            <h2 className="text-[28px] sm:text-[36px] md:text-[46px] text-[#000] leading-[1.1] sm:leading-[1.05] mb-10 sm:mb-14 text-center" style={{ fontFamily: "'Inter', system-ui, sans-serif", fontWeight: 800, letterSpacing: "-0.025em" }}>Frequently asked questions</h2>
            <div className="space-y-0">
              {faqs.map((faq, i) => (
                <div key={i} className="border-b border-[#e8e8e8]" data-testid={`faq-item-${i}`}>
                  <button onClick={() => setFaqOpen(faqOpen === i ? null : i)} className="w-full flex items-center justify-between py-5 text-left" data-testid={`btn-faq-${i}`}>
                    <span className="text-[15px] sm:text-[16px] font-semibold text-[#111] pr-4">{faq.q}</span>
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className={`shrink-0 transition-transform ${faqOpen === i ? "rotate-45" : ""}`}><path d="M8 3v10M3 8h10" stroke="#111" strokeWidth="1.5" strokeLinecap="round"/></svg>
                  </button>
                  {faqOpen === i && (
                    <div className="pb-5 -mt-1">
                      <p className="text-[14px] text-[#666] leading-[1.7]">{faq.a}</p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="py-10 sm:py-6 px-5 sm:px-6 bg-[#111] border-t border-white/10" data-testid="front-cta-bar">
          <div className="max-w-[1100px] mx-auto flex flex-col sm:flex-row items-center justify-between gap-6 sm:gap-4">
            <h3 className="text-[22px] sm:text-[22px] md:text-[28px] font-bold text-white text-center sm:text-left leading-[1.2]" style={{ letterSpacing: "-0.02em" }}>Build your financial identity on Profundr</h3>
            <button onClick={() => window.location.href = '/subscription'} className="px-5 py-2.5 bg-white text-[#111] text-[13px] font-semibold hover:bg-white/90 transition-colors shrink-0" data-testid="front-btn-final-cta">Get Started</button>
          </div>
        </section>

        <footer className="py-10 sm:py-14 px-5 sm:px-6 bg-[#111] border-t border-white/10" data-testid="front-footer">
          <div className="max-w-[1100px] mx-auto">
            <div className="flex flex-col md:flex-row items-start justify-between gap-8 sm:gap-10 mb-10 sm:mb-12">
              <div style={{ opacity: 0.4 }}>
                <ProfundrLogo size="md" variant="light" />
              </div>
              <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-x-12 sm:gap-x-16 gap-y-6">
                <div>
                  <p className="text-[11px] font-semibold text-white uppercase tracking-wider mb-3">Product</p>
                  <div className="space-y-2">
                    <a href="#features" className="block text-[13px] text-white/50 hover:text-white transition-colors">Overview</a>
                    <a href="#pricing" className="block text-[13px] text-white/50 hover:text-white transition-colors">Pricing</a>
                    <a href="#faq" className="block text-[13px] text-white/50 hover:text-white transition-colors">FAQ</a>
                  </div>
                </div>
                <div>
                  <p className="text-[11px] font-semibold text-white uppercase tracking-wider mb-3">Legal</p>
                  <div className="space-y-2">
                    <a href="/privacy" className="block text-[13px] text-white/50 hover:text-white transition-colors">Privacy Notice</a>
                    <a href="/terms" className="block text-[13px] text-white/50 hover:text-white transition-colors">Terms</a>
                  </div>
                </div>
              </div>
            </div>
            <div className="border-t border-white/10 pt-6 flex flex-col items-center sm:flex-row sm:justify-between gap-4">
              <div className="flex items-center gap-4 order-1 sm:order-none">
                {[
                  { href: "https://linkedin.com/company/profundr", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M16 8a6 6 0 016 6v7h-4v-7a2 2 0 00-4 0v7h-4v-7a6 6 0 016-6zM2 9h4v12H2zM4 6a2 2 0 100-4 2 2 0 000 4z" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" opacity="0.4"/></svg>, label: "LinkedIn" },
                  { href: "https://instagram.com/profundr", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><rect x="2" y="2" width="20" height="20" rx="5" stroke="white" strokeWidth="1.5" opacity="0.4"/><circle cx="12" cy="12" r="5" stroke="white" strokeWidth="1.5" opacity="0.4"/><circle cx="17.5" cy="6.5" r="1" fill="white" opacity="0.4"/></svg>, label: "Instagram" },
                  { href: "https://youtube.com/@profundr", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M22.54 6.42a2.78 2.78 0 00-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 00-1.94 2A29 29 0 001 12a29 29 0 00.46 5.58 2.78 2.78 0 001.94 2c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 001.94-2A29 29 0 0023 12a29 29 0 00-.46-5.58z" stroke="white" strokeWidth="1.5" opacity="0.4"/><path d="M9.75 15.02l5.75-3.27-5.75-3.27v6.54z" fill="white" opacity="0.4"/></svg>, label: "YouTube" },
                  { href: "https://x.com/profundr", icon: <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M4 4l6.5 8L4 20h2l5.5-6.8L16 20h4l-6.8-8.5L20 4h-2l-5.2 6.3L8 4H4z" stroke="white" strokeWidth="1.5" opacity="0.4"/></svg>, label: "X" },
                ].map((social) => (
                  <a key={social.label} href={social.href} target="_blank" rel="noopener noreferrer" className="cursor-pointer hover:opacity-100 transition-opacity" aria-label={social.label} data-testid={`link-social-${social.label.toLowerCase()}`}>{social.icon}</a>
                ))}
              </div>
              <p className="text-[12px] text-white/30 order-2 sm:order-none">© 2026 Profundr. All rights reserved.</p>
            </div>
          </div>
        </footer>
      </div>
    );
  }

  return (
    <div className="relative h-[100dvh] flex bg-[#fafafa]" style={{ fontFamily: "'Inter', sans-serif" }}>
      <input ref={fileInputRef} type="file" accept=".pdf,.txt,.csv" className="hidden" onChange={handleFileSelect} data-testid="input-file-upload" />

      {docsOpen && (
        <>
          <div className="sm:hidden fixed inset-0 bg-black/30 z-40" onClick={() => setDocsOpen(false)} />
          <div className="fixed sm:relative z-50 sm:z-auto w-[340px] h-full shrink-0 transition-all" data-testid="docs-sidebar">
            <DocsPanel docs={savedDocs} onClose={() => setDocsOpen(false)} onDelete={handleDeleteDoc} onSave={handleSaveDoc} user={user} onOpenTeamChat={handleOpenTeamChat} activeTeamChatId={activeTeamChat?.id} aisReport={aisReport} onOpenAis={() => setShowAisOverlay(true)} userProfile={userProfile} onUpdateProfile={handleUpdateProfile} repairData={repairData} onUpdateRepairData={(data) => { setRepairData(data); saveRepairData(data); }} onSendChat={(msg) => { if (!msg.startsWith("__VAULT_REPORT_UPLOAD__")) setDocsOpen(false); setTimeout(() => handleSend(msg), 100); }} onSelectTab={(tab) => { setActiveView(prev => prev === tab ? null : tab); setDocsOpen(false); }} activeView={activeView} simulatingLender={simulatingLender} setSimulatingLender={setSimulatingLender} repairFilter={repairFilter} setRepairFilter={setRepairFilter} inqCarouselIdx={inqCarouselIdx} setInqCarouselIdx={setInqCarouselIdx} acctCarouselIdx={acctCarouselIdx} setAcctCarouselIdx={setAcctCarouselIdx} portalTarget={panelContentRef} />
          </div>
        </>
      )}
      {!docsOpen && activeView && (
        <DocsPanel docs={savedDocs} onClose={() => {}} onDelete={handleDeleteDoc} onSave={handleSaveDoc} user={user} onOpenTeamChat={handleOpenTeamChat} activeTeamChatId={activeTeamChat?.id} aisReport={aisReport} onOpenAis={() => setShowAisOverlay(true)} userProfile={userProfile} onUpdateProfile={handleUpdateProfile} repairData={repairData} onUpdateRepairData={(data) => { setRepairData(data); saveRepairData(data); }} onSendChat={(msg) => { setTimeout(() => handleSend(msg), 100); }} onSelectTab={(tab) => { setActiveView(prev => prev === tab ? null : tab); }} activeView={activeView} simulatingLender={simulatingLender} setSimulatingLender={setSimulatingLender} repairFilter={repairFilter} setRepairFilter={setRepairFilter} inqCarouselIdx={inqCarouselIdx} setInqCarouselIdx={setInqCarouselIdx} acctCarouselIdx={acctCarouselIdx} setAcctCarouselIdx={setAcctCarouselIdx} portalTarget={panelContentRef} portalOnly />
      )}

      <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full">
        <div ref={scrollAreaRef} className="flex-1 min-h-0 overflow-y-auto relative" data-testid="main-scroll-area">
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
                <span className="select-none" style={{ fontFamily: "'Inter', sans-serif", fontSize: "20px", fontWeight: 800, letterSpacing: "-0.05em", color: "#111", lineHeight: 1 }}>profundr<span style={{ marginLeft: "-0.15em" }}>.</span></span>
              </div>
            </div>
            {user ? (
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setFundingStep("terms")}
                  className="group relative flex items-center justify-center w-8 h-8 rounded-lg text-[#6366f1] hover:bg-[#f0eeff] transition-colors"
                  title="Ready for funding?"
                  data-testid="button-funding-card"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                    <path d="M6 15h4M14 15h4" />
                  </svg>
                </button>
                {!user.subscriptionTier && (
                  <button
                    onClick={() => window.location.href = '/subscription'}
                    className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#f0eeff] text-[#6366f1] text-[11px] font-medium hover:bg-[#e5e0ff] transition-colors"
                    data-testid="badge-free-usage"
                  >
                    <span>{Math.max(0, (user.maxUsage || 15) - (user.monthlyUsage || 0))}/{user.maxUsage || 15} free</span>
                    <svg width="10" height="10" viewBox="0 0 10 10" fill="none"><path d="M3 2l4 3-4 3" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                )}
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
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setFundingStep("terms")}
                  className="flex items-center justify-center w-8 h-8 rounded-lg text-[#6366f1] hover:bg-[#f0eeff] transition-colors"
                  title="Ready for funding?"
                  data-testid="button-funding-card-guest"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                    <rect x="2" y="5" width="20" height="14" rx="2" />
                    <line x1="2" y1="10" x2="22" y2="10" />
                    <path d="M6 15h4M14 15h4" />
                  </svg>
                </button>
                <button
                  onClick={() => window.location.href = '/login'}
                  className="rounded-full px-5 py-2 text-[13px] font-medium border border-[#ddd] text-[#555] hover:bg-[#f0f0f0] transition-colors"
                  data-testid="button-signin"
                >
                  Sign In
                </button>
              </div>
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

          <div ref={panelContentRef} className="w-full" />

          {activeView ? null : showAisOverlay && aisReport && hasAnalysisData(aisReport) ? (
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
              {displayMessages.some(m => m.role === "assistant" && /(?:STRATEGY_DATA_START|CAPITAL_POTENTIAL_DATA_START|FUNDING_SEQUENCE_DATA_START|TRADELINE:|DISPUTE:.*\|.*\||Pillar\s*Scores:|Payment\s*Integrity:\s*\d)/i.test(m.content)) && (
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
                        {msg.role === "assistant" && !(/(?:STRATEGY_DATA_START|CAPITAL_POTENTIAL_DATA_START|FUNDING_SEQUENCE_DATA_START|TRADELINE:|DISPUTE:.*\|.*\||Pillar\s*Scores:|Payment\s*Integrity:\s*\d|Utilization\s*Control:\s*\d|AIS.*(?:Approval\s*Index|Score).*:\s*\d)/i.test(msg.content)) && (
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
                            const isStructuredReport = /(?:STRATEGY_DATA_START|CAPITAL_POTENTIAL_DATA_START|FUNDING_SEQUENCE_DATA_START|TRADELINE:|DISPUTE:.*\|.*\||Pillar\s*Scores:|Payment\s*Integrity:\s*\d|Utilization\s*Control:\s*\d|AIS.*(?:Approval\s*Index|Score).*:\s*\d)/i.test(msg.content);
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
                                userName={user?.displayName || user?.email}
                              />
                            );
                          })()}
                        </div>
                        {msg.role === "user" && (
                          <ProfileAvatar photo={msg.senderPhoto || user?.profilePhoto} name={msg.senderName || user?.displayName || user?.email} size={28} className="mt-0.5" />
                        )}
                      </div>
                      )}
                      {msg.role === "assistant" && !isSending && streamingMsgId !== msg.id && (
                        <div className="flex items-center gap-0.5 ml-10 mt-1" data-testid={`actions-msg-${msg.id}`}>
                          <button
                            data-testid={`btn-copy-${msg.id}`}
                            aria-label="Copy response"
                            onClick={() => {
                              const clean = msg.content
                                .replace(/STRATEGY_DATA_START[\s\S]*?STRATEGY_DATA_END/g, "")
                                .replace(/CAPITAL_POTENTIAL_DATA_START[\s\S]*?CAPITAL_POTENTIAL_DATA_END/g, "")
                                .replace(/FUNDING_SEQUENCE_DATA_START[\s\S]*?FUNDING_SEQUENCE_DATA_END/g, "")
                                .replace(/REPAIR_DATA_START[\s\S]*?REPAIR_DATA_END/g, "")
                                .replace(/TRADELINE:[^\n]*/g, "")
                                .replace(/DISPUTE:[^\n]*/g, "")
                                .replace(/\n{3,}/g, "\n\n")
                                .trim();
                              navigator.clipboard.writeText(clean).then(() => {
                                setCopiedMsgId(msg.id);
                                setTimeout(() => setCopiedMsgId(prev => prev === msg.id ? null : prev), 2000);
                              }).catch(() => {});
                            }}
                            className="p-1.5 rounded-md hover:bg-[#f0f0f0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#555] transition-colors"
                          >
                            {copiedMsgId === msg.id ? (
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 8.5l2.5 2.5L12 5" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><rect x="5.5" y="5.5" width="7" height="7" rx="1.5" stroke="#999" strokeWidth="1.3" /><path d="M3.5 10.5v-7a1.5 1.5 0 011.5-1.5h7" stroke="#999" strokeWidth="1.3" strokeLinecap="round" /></svg>
                            )}
                          </button>
                          <button
                            data-testid={`btn-thumbsup-${msg.id}`}
                            aria-label="Good response"
                            aria-pressed={msgFeedback[msg.id] === "up"}
                            onClick={() => setMsgFeedback(prev => {
                              const next = { ...prev };
                              if (next[msg.id] === "up") delete next[msg.id]; else next[msg.id] = "up";
                              return next;
                            })}
                            className={`p-1.5 rounded-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#555] ${msgFeedback[msg.id] === "up" ? "bg-[#f0f0f0]" : "hover:bg-[#f0f0f0]"}`}
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill={msgFeedback[msg.id] === "up" ? "#555" : "none"}><path d="M5 14V7.5m0 0H3a1 1 0 01-1-1V5a1 1 0 011-1l2.3-2.3a1 1 0 01.7-.3h3.5a1 1 0 011 .8l.7 3.5a1 1 0 01-1 1.2H8l.5 2.5a.5.5 0 01-.85.4L5 7.5zM13.5 2.5H12a.5.5 0 00-.5.5v4a.5.5 0 00.5.5h1.5a.5.5 0 00.5-.5V3a.5.5 0 00-.5-.5z" stroke={msgFeedback[msg.id] === "up" ? "#555" : "#999"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </button>
                          <button
                            data-testid={`btn-thumbsdown-${msg.id}`}
                            aria-label="Bad response"
                            aria-pressed={msgFeedback[msg.id] === "down"}
                            onClick={() => setMsgFeedback(prev => {
                              const next = { ...prev };
                              if (next[msg.id] === "down") delete next[msg.id]; else next[msg.id] = "down";
                              return next;
                            })}
                            className={`p-1.5 rounded-md transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#555] ${msgFeedback[msg.id] === "down" ? "bg-[#f0f0f0]" : "hover:bg-[#f0f0f0]"}`}
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill={msgFeedback[msg.id] === "down" ? "#555" : "none"} style={{ transform: "rotate(180deg)" }}><path d="M5 14V7.5m0 0H3a1 1 0 01-1-1V5a1 1 0 011-1l2.3-2.3a1 1 0 01.7-.3h3.5a1 1 0 011 .8l.7 3.5a1 1 0 01-1 1.2H8l.5 2.5a.5.5 0 01-.85.4L5 7.5zM13.5 2.5H12a.5.5 0 00-.5.5v4a.5.5 0 00.5.5h1.5a.5.5 0 00.5-.5V3a.5.5 0 00-.5-.5z" stroke={msgFeedback[msg.id] === "down" ? "#555" : "#999"} strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </button>
                          <button
                            data-testid={`btn-share-${msg.id}`}
                            aria-label="Share response"
                            onClick={() => {
                              const clean = msg.content
                                .replace(/STRATEGY_DATA_START[\s\S]*?STRATEGY_DATA_END/g, "")
                                .replace(/CAPITAL_POTENTIAL_DATA_START[\s\S]*?CAPITAL_POTENTIAL_DATA_END/g, "")
                                .replace(/FUNDING_SEQUENCE_DATA_START[\s\S]*?FUNDING_SEQUENCE_DATA_END/g, "")
                                .replace(/REPAIR_DATA_START[\s\S]*?REPAIR_DATA_END/g, "")
                                .replace(/TRADELINE:[^\n]*/g, "")
                                .replace(/DISPUTE:[^\n]*/g, "")
                                .replace(/\n{3,}/g, "\n\n")
                                .trim();
                              if (navigator.share) {
                                navigator.share({ title: "Profundr Analysis", text: clean }).then(() => {
                                  setSharedMsgId(msg.id);
                                  setTimeout(() => setSharedMsgId(prev => prev === msg.id ? null : prev), 2000);
                                }).catch(() => {});
                              } else {
                                navigator.clipboard.writeText(clean).then(() => {
                                  setSharedMsgId(msg.id);
                                  setTimeout(() => setSharedMsgId(prev => prev === msg.id ? null : prev), 2000);
                                }).catch(() => {});
                              }
                            }}
                            className="p-1.5 rounded-md hover:bg-[#f0f0f0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#555] transition-colors"
                          >
                            {sharedMsgId === msg.id ? (
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M4 8.5l2.5 2.5L12 5" stroke="#555" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            ) : (
                              <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2v7M8 2L5 5M8 2l3 3" stroke="#999" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /><path d="M3 10v3a1 1 0 001 1h8a1 1 0 001-1v-3" stroke="#999" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                            )}
                          </button>
                          <button
                            data-testid={`btn-regenerate-${msg.id}`}
                            aria-label="Regenerate response"
                            onClick={async () => {
                              const idx = displayMessages.findIndex(m => m.id === msg.id);
                              const prevUser = displayMessages.slice(0, idx).reverse().find(m => m.role === "user");
                              if (!prevUser || isSending) return;
                              const msgsBeforeThis = guestMessages.filter(m => m.id !== msg.id);
                              setGuestMessages(msgsBeforeThis);
                              setIsSending(true);
                              isSendingRef.current = true;
                              try {
                                const history = msgsBeforeThis.slice(-10).map(m => ({
                                  role: (m.role === "user" || m.role === "assistant") ? m.role : "user" as const,
                                  content: m.content,
                                }));
                                const res = await fetch("/api/chat/guest", {
                                  method: "POST",
                                  headers: { "Content-Type": "application/json" },
                                  body: JSON.stringify({
                                    content: prevUser.content.replace(/\n*\[Attached: .+?\]/, "").trim(),
                                    history,
                                    userProfile: buildProfilePayload(),
                                    documentContext: buildDocContext(),
                                  }),
                                });
                                if (!res.ok) throw new Error("Failed");
                                const data = await res.json();
                                const newMsg: GuestMessage = { id: msg.id, role: "assistant", content: data.content };
                                setGuestMessages(prev => [...prev, newMsg]);
                              } catch {
                                const errMsg: GuestMessage = { id: msg.id, role: "assistant", content: "Sorry, something went wrong. Please try again." };
                                setGuestMessages(prev => [...prev, errMsg]);
                              } finally {
                                setIsSending(false);
                                isSendingRef.current = false;
                              }
                            }}
                            className="p-1.5 rounded-md hover:bg-[#f0f0f0] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#555] transition-colors"
                          >
                            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2.5 8a5.5 5.5 0 019.7-3.5M13.5 8a5.5 5.5 0 01-9.7 3.5" stroke="#999" strokeWidth="1.3" strokeLinecap="round" /><path d="M12.2 2v2.5h-2.5M3.8 14v-2.5h2.5" stroke="#999" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" /></svg>
                          </button>
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

          <p className="text-center text-[11px] text-[#aaa] mt-3 leading-[1.5]" data-testid="text-footer-legal">
            Profundr is a capital intelligence platform, not a lender.{" "}
            <a href="/terms" className="underline hover:text-[#888] transition-colors">Terms</a> &middot;{" "}
            <a href="/privacy" className="underline hover:text-[#888] transition-colors">Privacy</a>
          </p>
        </div>
      </div>

      {fundingStep !== "closed" && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" data-testid="modal-funding-flow">
          <div className="bg-white rounded-2xl shadow-2xl max-w-[520px] w-[92%] max-h-[90dvh] overflow-y-auto relative">
            <button
              onClick={() => { setFundingStep("closed"); setTermsAccepted(false); }}
              className="absolute top-4 right-4 z-10 text-[#ccc] hover:text-[#666] transition-colors"
              data-testid="button-close-funding"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M4 4l8 8M12 4l-8 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>

            {fundingStep === "terms" && (
              <div className="p-6 sm:p-8">
                <div className="text-center mb-5">
                  <div className="w-14 h-14 mx-auto mb-4 rounded-full bg-gradient-to-br from-[#6366f1] to-[#4f46e5] flex items-center justify-center shadow-lg">
                    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z" />
                      <polyline points="14 2 14 8 20 8" />
                      <line x1="16" y1="13" x2="8" y2="13" />
                      <line x1="16" y1="17" x2="8" y2="17" />
                    </svg>
                  </div>
                  <h2 className="text-[22px] font-bold text-[#1a1a2e] tracking-[-0.02em] mb-1" data-testid="text-funding-headline">
                    Broker Funding Agreement
                  </h2>
                  <p className="text-[12px] text-[#777] leading-[1.5] max-w-[360px] mx-auto">
                    Review and sign the agreement to authorize Profundr to broker funding on your behalf.
                  </p>
                </div>

                <div className="bg-[#f8f8fc] rounded-xl p-5 text-left mb-5 max-h-[260px] overflow-y-auto border border-[#e8e8f0]">
                  <h3 className="text-[11px] font-bold text-[#1a1a2e] uppercase tracking-wider mb-3">Exclusive Broker Funding Authorization, Power of Attorney & Terms of Service</h3>
                  <div className="space-y-2.5 text-[10.5px] text-[#555] leading-[1.7]">
                    <p><strong>1. Exclusive Broker Authorization & Power of Attorney:</strong> By signing below, you ("Client") hereby grant Profundr LLC ("Broker") an exclusive and irrevocable Power of Attorney to act as your sole authorized representative and broker for the purpose of identifying, negotiating, applying for, and securing funding opportunities on your behalf and on behalf of your business. This Power of Attorney grants Broker the exclusive right to seek, apply for, and negotiate all forms of business funding including, but not limited to, business lines of credit, term loans, SBA loans, revenue-based financing, equipment financing, merchant cash advances, and other capital products. Client agrees not to engage any other broker or intermediary for funding services during the term of this agreement.</p>
                    <p><strong>2. Scope of Services:</strong> The Broker will: (a) review and analyze your credit profile, financial documentation, and business information; (b) identify suitable lending partners and funding programs; (c) submit applications to lenders on your behalf using the Power of Attorney granted herein; (d) negotiate terms, rates, and conditions; (e) execute necessary documents on Client's behalf as authorized; and (f) facilitate the funding process through to disbursement.</p>
                    <p><strong>3. Broker Compensation — 4% Fee:</strong> Client agrees to pay Broker a fee equal to four percent (4%) of the total funding amount secured in each funding round. This fee is due and payable upon successful disbursement of funds to the Client. The 4% fee applies to each separate funding round or tranche secured by the Broker. For example, if Broker secures $100,000 in funding, the Broker fee shall be $4,000. This fee is in addition to any fees charged by the lending institution.</p>
                    <p><strong>4. Client Obligations:</strong> The Client agrees to: (a) provide accurate, complete, and truthful information; (b) promptly supply any additional documentation requested; (c) notify Broker of any material changes to financial circumstances; (d) not apply directly to lenders or engage other brokers for funding during the term of this agreement; (e) pay the 4% Broker fee upon successful funding disbursement.</p>
                    <p><strong>5. Data Collection & Use:</strong> By signing, you authorize Profundr to collect and securely store personal and financial information including: name, contact details, Social Security Number, date of birth, employment details, income, bank statements, tax returns, driver's license, proof of residency, and credit reports. All data is encrypted using AES-256 at rest and TLS 1.3 in transit.</p>
                    <p><strong>6. Third-Party Disclosure:</strong> Client authorizes Broker to share submitted information exclusively with lending partners and financial institutions for the sole purpose of evaluating and processing funding applications. Client data will never be sold to third parties.</p>
                    <p><strong>7. Credit Inquiries:</strong> Client acknowledges that while the initial assessment does NOT result in a hard inquiry, lender applications submitted on Client's behalf may result in hard credit inquiries. Broker will notify Client before any hard inquiry is initiated.</p>
                    <p><strong>8. No Guarantee:</strong> Broker does not guarantee approval or specific terms. All funding decisions are made solely by the lending institutions. Broker will use best efforts to secure favorable terms.</p>
                    <p><strong>9. Term & Termination:</strong> This agreement is effective upon signing and remains in force for 12 months unless terminated in writing by either party with 30 days' notice. Termination does not affect applications already in progress or the obligation to pay Broker fees on funding already secured.</p>
                    <p><strong>10. Data Retention & Deletion:</strong> Client may request deletion of all stored data at any time by contacting support@profundr.com. Data will be retained for a maximum of 24 months from last activity unless earlier deletion is requested.</p>
                    <p><strong>11. Governing Law:</strong> This agreement shall be governed by and construed in accordance with applicable federal and state laws. Any disputes shall be resolved through binding arbitration.</p>
                    <p><strong>12. Consent:</strong> By signing below, Client confirms that all information provided is accurate and complete, grants Profundr exclusive Power of Attorney to seek funding on their behalf, agrees to the 4% Broker fee per funding round, and consents to all terms described herein.</p>
                  </div>
                </div>

                <div className="mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="text-[11px] font-bold text-[#1a1a2e] uppercase tracking-wider flex items-center gap-1.5">
                      <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1 11C3 9 5 4 7 3c1-.5 2.5.5 3.5-1" stroke="#6366f1" strokeWidth="1.2" strokeLinecap="round"/></svg>
                      Your Signature
                    </h4>
                    <button onClick={clearSignature} className="text-[10px] text-[#999] hover:text-[#6366f1] transition-colors" data-testid="button-clear-signature">Clear</button>
                  </div>
                  <div className="border-2 border-[#e8e8f0] rounded-xl overflow-hidden bg-white" style={{ touchAction: "none" }}>
                    <canvas
                      ref={initSigCanvas}
                      width={560}
                      height={140}
                      className="w-full cursor-crosshair"
                      style={{ height: "100px" }}
                      data-testid="canvas-signature"
                    />
                  </div>
                  <p className="text-[9px] text-[#bbb] mt-1 text-center">Draw your signature above using your mouse or finger</p>
                </div>

                <label className="flex items-start gap-2.5 mb-4 cursor-pointer text-left" data-testid="label-accept-terms">
                  <input
                    type="checkbox"
                    checked={termsAccepted}
                    onChange={(e) => setTermsAccepted(e.target.checked)}
                    className="mt-0.5 w-4 h-4 rounded border-[#ccc] text-[#6366f1] focus:ring-[#6366f1] cursor-pointer"
                    data-testid="checkbox-accept-terms"
                  />
                  <span className="text-[11px] text-[#555] leading-[1.5]">
                    I have read and agree to the <strong>Exclusive Broker Funding Agreement</strong>, <strong>Power of Attorney</strong>, and <strong>Terms of Service</strong>. I grant Profundr exclusive authorization to seek funding on my behalf and agree to the 4% broker fee per funding round.
                  </span>
                </label>

                <button
                  onClick={() => { if (termsAccepted && signatureDataUrl) setFundingStep("form"); }}
                  disabled={!termsAccepted || !signatureDataUrl}
                  className="w-full py-3 bg-[#1a1a2e] text-white rounded-full text-[14px] font-medium hover:bg-[#2a2a40] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                  data-testid="button-accept-terms"
                >
                  Sign & Continue
                </button>
              </div>
            )}

            {fundingStep === "form" && (
              <div className="p-6 sm:p-8">
                <div className="flex items-center gap-2 mb-1">
                  <button onClick={() => setFundingStep("terms")} className="text-[#999] hover:text-[#555] transition-colors" data-testid="button-funding-back">
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none"><path d="M10 4L6 8l4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  </button>
                  <h2 className="text-[20px] font-bold text-[#1a1a2e] tracking-[-0.02em]" data-testid="text-form-headline">Funding Application</h2>
                </div>
                <p className="text-[11px] text-[#999] mb-5 ml-6">Complete your profile and upload documents</p>

                <div className="space-y-5 max-h-[60vh] overflow-y-auto pr-1">
                  {(() => {
                    const inp = "px-3 py-2.5 rounded-lg border border-[#ddd] text-[12px] focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/20 transition-colors";
                    const sel = "px-3 py-2.5 rounded-lg border border-[#ddd] text-[12px] focus:outline-none focus:border-[#6366f1] focus:ring-1 focus:ring-[#6366f1]/20 transition-colors bg-white";
                    const secH = "text-[11px] font-bold text-[#1a1a2e] uppercase tracking-wider mb-2.5 flex items-center gap-1.5";
                    const fileZone = "border-2 border-dashed border-[#d4d0f0] rounded-xl p-3 cursor-pointer hover:border-[#6366f1] hover:bg-[#f8f7ff] transition-colors text-center";
                    const filePill = "inline-flex items-center gap-1 text-[9px] bg-[#e8e6ff] text-[#6366f1] rounded-full px-2 py-0.5 font-medium";
                    const renderFiles = (files: File[], key: string, setter: (fn: (prev: any) => any) => void) => files.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1 justify-center">
                        {files.map((f, i) => (
                          <span key={i} className={filePill}>
                            {f.name.length > 18 ? f.name.slice(0, 15) + "..." : f.name}
                            <button onClick={(e) => { e.stopPropagation(); setter((ff: any) => ({ ...ff, [key]: ff[key].filter((_: any, j: number) => j !== i) })); }} className="hover:text-red-500">&times;</button>
                          </span>
                        ))}
                      </div>
                    );
                    const renderSingle = (file: File | null, key: string) => file && (
                      <div className="mt-2 flex justify-center">
                        <span className={filePill}>
                          {file.name.length > 22 ? file.name.slice(0, 19) + "..." : file.name}
                          <button onClick={(e) => { e.stopPropagation(); setFundingFiles(f => ({ ...f, [key]: null })); }} className="hover:text-red-500">&times;</button>
                        </span>
                      </div>
                    );
                    const ssnFormat = (v: string) => {
                      const d = v.replace(/\D/g, "").slice(0, 9);
                      if (d.length <= 3) return d;
                      if (d.length <= 5) return d.slice(0, 3) + "-" + d.slice(3);
                      return d.slice(0, 3) + "-" + d.slice(3, 5) + "-" + d.slice(5);
                    };
                    return (<>
                      <div>
                        <h3 className={secH}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><circle cx="6" cy="4" r="2.5" stroke="#6366f1" strokeWidth="1.2"/><path d="M1.5 11c0-2.5 2-4 4.5-4s4.5 1.5 4.5 4" stroke="#6366f1" strokeWidth="1.2" strokeLinecap="round"/></svg>
                          Personal Information
                        </h3>
                        <div className="grid grid-cols-6 gap-2.5">
                          <input value={fundingForm.firstName} onChange={e => setFundingForm(f => ({ ...f, firstName: e.target.value }))} placeholder="First Name *" className={`col-span-3 ${inp}`} data-testid="input-funding-firstname" />
                          <input value={fundingForm.lastName} onChange={e => setFundingForm(f => ({ ...f, lastName: e.target.value }))} placeholder="Last Name *" className={`col-span-3 ${inp}`} data-testid="input-funding-lastname" />
                          <input value={fundingForm.email} onChange={e => setFundingForm(f => ({ ...f, email: e.target.value }))} placeholder="Email Address *" type="email" className={`col-span-6 ${inp}`} data-testid="input-funding-email" />
                          <input value={fundingForm.phone} onChange={e => setFundingForm(f => ({ ...f, phone: e.target.value }))} placeholder="Phone Number *" type="tel" className={`col-span-3 ${inp}`} data-testid="input-funding-phone" />
                          <input value={fundingForm.dob} onChange={e => setFundingForm(f => ({ ...f, dob: e.target.value }))} placeholder="Date of Birth" type="date" className={`col-span-3 ${inp}`} data-testid="input-funding-dob" />
                          <input value={fundingForm.ssn} onChange={e => setFundingForm(f => ({ ...f, ssn: ssnFormat(e.target.value) }))} placeholder="Social Security # (XXX-XX-XXXX)" maxLength={11} className={`col-span-6 ${inp}`} data-testid="input-funding-ssn" />
                        </div>
                      </div>

                      <div>
                        <h3 className={secH}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M1.5 10.5V3.5l5-2 5 2v7l-5-2-5 2z" stroke="#6366f1" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                          Home Address
                        </h3>
                        <div className="grid grid-cols-6 gap-2.5">
                          <input value={fundingForm.address} onChange={e => setFundingForm(f => ({ ...f, address: e.target.value }))} placeholder="Street Address" className={`col-span-6 ${inp}`} data-testid="input-funding-address" />
                          <input value={fundingForm.city} onChange={e => setFundingForm(f => ({ ...f, city: e.target.value }))} placeholder="City" className={`col-span-3 ${inp}`} data-testid="input-funding-city" />
                          <input value={fundingForm.state} onChange={e => setFundingForm(f => ({ ...f, state: e.target.value }))} placeholder="State" className={`col-span-1 ${inp}`} data-testid="input-funding-state" />
                          <input value={fundingForm.zip} onChange={e => setFundingForm(f => ({ ...f, zip: e.target.value }))} placeholder="ZIP" className={`col-span-2 ${inp}`} data-testid="input-funding-zip" />
                          <input value={fundingForm.yearsAtAddress} onChange={e => setFundingForm(f => ({ ...f, yearsAtAddress: e.target.value }))} placeholder="Years at Address" type="number" className={`col-span-3 ${inp}`} data-testid="input-funding-years-address" />
                          <select value={fundingForm.homeOwnership} onChange={e => setFundingForm(f => ({ ...f, homeOwnership: e.target.value }))} className={`col-span-3 ${sel}`} data-testid="select-funding-home-ownership">
                            <option value="">Home Ownership</option>
                            <option value="Own">Own</option>
                            <option value="Rent">Rent</option>
                            <option value="Other">Other</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <h3 className={secH}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1" y="2" width="10" height="8" rx="1.5" stroke="#6366f1" strokeWidth="1.2"/><path d="M4 2V1M8 2V1M1 4.5h10" stroke="#6366f1" strokeWidth="1" strokeLinecap="round"/></svg>
                          Business Information
                        </h3>
                        <div className="grid grid-cols-6 gap-2.5">
                          <input value={fundingForm.businessName} onChange={e => setFundingForm(f => ({ ...f, businessName: e.target.value }))} placeholder="Legal Business Name *" className={`col-span-3 ${inp}`} data-testid="input-funding-bizname" />
                          <input value={fundingForm.dba} onChange={e => setFundingForm(f => ({ ...f, dba: e.target.value }))} placeholder="DBA (if different)" className={`col-span-3 ${inp}`} data-testid="input-funding-dba" />
                          <input value={fundingForm.businessAddress} onChange={e => setFundingForm(f => ({ ...f, businessAddress: e.target.value }))} placeholder="Business Street Address" className={`col-span-6 ${inp}`} data-testid="input-funding-bizaddress" />
                          <input value={fundingForm.businessCity} onChange={e => setFundingForm(f => ({ ...f, businessCity: e.target.value }))} placeholder="City" className={`col-span-3 ${inp}`} data-testid="input-funding-bizcity" />
                          <input value={fundingForm.businessState} onChange={e => setFundingForm(f => ({ ...f, businessState: e.target.value }))} placeholder="State" className={`col-span-1 ${inp}`} data-testid="input-funding-bizstate" />
                          <input value={fundingForm.businessZip} onChange={e => setFundingForm(f => ({ ...f, businessZip: e.target.value }))} placeholder="ZIP" className={`col-span-2 ${inp}`} data-testid="input-funding-bizzip" />
                          <input value={fundingForm.businessPhone} onChange={e => setFundingForm(f => ({ ...f, businessPhone: e.target.value }))} placeholder="Business Phone" type="tel" className={`col-span-3 ${inp}`} data-testid="input-funding-bizphone" />
                          <input value={fundingForm.businessEmail} onChange={e => setFundingForm(f => ({ ...f, businessEmail: e.target.value }))} placeholder="Business Email" type="email" className={`col-span-3 ${inp}`} data-testid="input-funding-bizemail" />
                          <input value={fundingForm.ein} onChange={e => setFundingForm(f => ({ ...f, ein: e.target.value }))} placeholder="EIN / Tax ID" className={`col-span-3 ${inp}`} data-testid="input-funding-ein" />
                          <select value={fundingForm.entityType} onChange={e => setFundingForm(f => ({ ...f, entityType: e.target.value }))} className={`col-span-3 ${sel}`} data-testid="select-funding-entity">
                            <option value="">Entity Type</option>
                            <option value="Sole Proprietorship">Sole Proprietorship</option>
                            <option value="LLC">LLC</option>
                            <option value="Corporation">Corporation</option>
                            <option value="S-Corporation">S-Corporation</option>
                            <option value="Partnership">Partnership</option>
                            <option value="Non-Profit">Non-Profit</option>
                          </select>
                          <input value={fundingForm.industry} onChange={e => setFundingForm(f => ({ ...f, industry: e.target.value }))} placeholder="Industry / SIC Code" className={`col-span-3 ${inp}`} data-testid="input-funding-industry" />
                          <input value={fundingForm.dateEstablished} onChange={e => setFundingForm(f => ({ ...f, dateEstablished: e.target.value }))} placeholder="Date Established" type="date" className={`col-span-3 ${inp}`} data-testid="input-funding-established" />
                          <input value={fundingForm.numEmployees} onChange={e => setFundingForm(f => ({ ...f, numEmployees: e.target.value }))} placeholder="# of Employees" type="number" className={`col-span-3 ${inp}`} data-testid="input-funding-employees" />
                          <input value={fundingForm.website} onChange={e => setFundingForm(f => ({ ...f, website: e.target.value }))} placeholder="Website URL" className={`col-span-3 ${inp}`} data-testid="input-funding-website" />
                        </div>
                      </div>

                      <div>
                        <h3 className={secH}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M6 1l2 3h3l-2.5 2.5L9.5 10 6 8 2.5 10l1-3.5L1 4h3z" stroke="#6366f1" strokeWidth="1.2" strokeLinejoin="round"/></svg>
                          Ownership Details
                        </h3>
                        <div className="grid grid-cols-2 gap-2.5">
                          <input value={fundingForm.ownershipPct} onChange={e => setFundingForm(f => ({ ...f, ownershipPct: e.target.value }))} placeholder="Ownership %" type="number" className={`col-span-1 ${inp}`} data-testid="input-funding-ownership" />
                          <input value={fundingForm.titlePosition} onChange={e => setFundingForm(f => ({ ...f, titlePosition: e.target.value }))} placeholder="Title / Position" className={`col-span-1 ${inp}`} data-testid="input-funding-title" />
                        </div>
                      </div>

                      <div>
                        <h3 className={secH}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><rect x="1.5" y="3" width="9" height="6.5" rx="1" stroke="#6366f1" strokeWidth="1.2"/><path d="M1.5 5h9" stroke="#6366f1" strokeWidth="1.2"/></svg>
                          Financial Details
                        </h3>
                        <div className="grid grid-cols-6 gap-2.5">
                          <input value={fundingForm.employerName} onChange={e => setFundingForm(f => ({ ...f, employerName: e.target.value }))} placeholder="Employer Name" className={`col-span-6 ${inp}`} data-testid="input-funding-employer" />
                          <input value={fundingForm.annualIncome} onChange={e => setFundingForm(f => ({ ...f, annualIncome: e.target.value }))} placeholder="Personal Annual Income" type="number" className={`col-span-3 ${inp}`} data-testid="input-funding-income" />
                          <input value={fundingForm.monthlyHousing} onChange={e => setFundingForm(f => ({ ...f, monthlyHousing: e.target.value }))} placeholder="Monthly Housing Cost" type="number" className={`col-span-3 ${inp}`} data-testid="input-funding-housing" />
                          <input value={fundingForm.annualBusinessRevenue} onChange={e => setFundingForm(f => ({ ...f, annualBusinessRevenue: e.target.value }))} placeholder="Annual Business Revenue" type="number" className={`col-span-3 ${inp}`} data-testid="input-funding-biz-revenue" />
                          <input value={fundingForm.monthlyBusinessRevenue} onChange={e => setFundingForm(f => ({ ...f, monthlyBusinessRevenue: e.target.value }))} placeholder="Monthly Business Revenue" type="number" className={`col-span-3 ${inp}`} data-testid="input-funding-monthly-biz-revenue" />
                          <input value={fundingForm.desiredLoanAmount} onChange={e => setFundingForm(f => ({ ...f, desiredLoanAmount: e.target.value }))} placeholder="Desired Loan Amount ($)" type="number" className={`col-span-3 ${inp}`} data-testid="input-funding-loan-amount" />
                          <select value={fundingForm.purposeOfFunds} onChange={e => setFundingForm(f => ({ ...f, purposeOfFunds: e.target.value }))} className={`col-span-3 ${sel}`} data-testid="select-funding-purpose">
                            <option value="">Purpose of Funds</option>
                            <option value="Working Capital">Working Capital</option>
                            <option value="Equipment">Equipment</option>
                            <option value="Expansion">Expansion</option>
                            <option value="Inventory">Inventory</option>
                            <option value="Debt Refinancing">Debt Refinancing</option>
                            <option value="Real Estate">Real Estate</option>
                            <option value="Other">Other</option>
                          </select>
                          <input value={fundingForm.existingDebts} onChange={e => setFundingForm(f => ({ ...f, existingDebts: e.target.value }))} placeholder="Existing Business Debts ($)" type="number" className={`col-span-3 ${inp}`} data-testid="input-funding-debts" />
                          <input value={fundingForm.businessBankName} onChange={e => setFundingForm(f => ({ ...f, businessBankName: e.target.value }))} placeholder="Business Bank Name" className={`col-span-3 ${inp}`} data-testid="input-funding-bank-name" />
                        </div>
                      </div>

                      <div>
                        <h3 className={secH}>
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2 2h8v8H2z" stroke="#6366f1" strokeWidth="1.2" strokeLinejoin="round"/><path d="M5 2v8M2 5h8" stroke="#6366f1" strokeWidth="0.8"/></svg>
                          Document Upload Center
                        </h3>
                        <div className="space-y-2">
                          <input ref={fundingBizBankRef} type="file" accept=".pdf,.jpg,.jpeg,.png" multiple className="hidden" onChange={(e) => { if (e.target.files) setFundingFiles(f => ({ ...f, bizBankStatements: [...f.bizBankStatements, ...Array.from(e.target.files!)] })); }} data-testid="input-funding-bizbankfiles" />
                          <div onClick={() => fundingBizBankRef.current?.click()} className={fileZone} data-testid="upload-zone-bizbank">
                            <span className="text-[11px] font-semibold text-[#6366f1]">Business Bank Statements</span>
                            <p className="text-[9px] text-[#999]">Last 3 months — PDF, JPG, PNG</p>
                            {renderFiles(fundingFiles.bizBankStatements, "bizBankStatements", setFundingFiles)}
                          </div>

                          <input ref={fundingPersBankRef} type="file" accept=".pdf,.jpg,.jpeg,.png" multiple className="hidden" onChange={(e) => { if (e.target.files) setFundingFiles(f => ({ ...f, personalBankStatements: [...f.personalBankStatements, ...Array.from(e.target.files!)] })); }} data-testid="input-funding-persbankfiles" />
                          <div onClick={() => fundingPersBankRef.current?.click()} className={fileZone} data-testid="upload-zone-persbank">
                            <span className="text-[11px] font-semibold text-[#6366f1]">Personal Bank Statements</span>
                            <p className="text-[9px] text-[#999]">Last 3 months — PDF, JPG, PNG</p>
                            {renderFiles(fundingFiles.personalBankStatements, "personalBankStatements", setFundingFiles)}
                          </div>

                          <input ref={fundingBizTaxRef} type="file" accept=".pdf,.jpg,.jpeg,.png" multiple className="hidden" onChange={(e) => { if (e.target.files) setFundingFiles(f => ({ ...f, bizTaxReturns: [...f.bizTaxReturns, ...Array.from(e.target.files!)] })); }} data-testid="input-funding-biztaxfiles" />
                          <div onClick={() => fundingBizTaxRef.current?.click()} className={fileZone} data-testid="upload-zone-biztax">
                            <span className="text-[11px] font-semibold text-[#6366f1]">Business Tax Returns</span>
                            <p className="text-[9px] text-[#999]">Most recent filing — PDF or image</p>
                            {renderFiles(fundingFiles.bizTaxReturns, "bizTaxReturns", setFundingFiles)}
                          </div>

                          <input ref={fundingPersTaxRef} type="file" accept=".pdf,.jpg,.jpeg,.png" multiple className="hidden" onChange={(e) => { if (e.target.files) setFundingFiles(f => ({ ...f, personalTaxReturns: [...f.personalTaxReturns, ...Array.from(e.target.files!)] })); }} data-testid="input-funding-perstaxfiles" />
                          <div onClick={() => fundingPersTaxRef.current?.click()} className={fileZone} data-testid="upload-zone-perstax">
                            <span className="text-[11px] font-semibold text-[#6366f1]">Personal Tax Returns</span>
                            <p className="text-[9px] text-[#999]">Most recent filing — PDF or image</p>
                            {renderFiles(fundingFiles.personalTaxReturns, "personalTaxReturns", setFundingFiles)}
                          </div>

                          <input ref={fundingBizLicRef} type="file" accept=".pdf,.jpg,.jpeg,.png" multiple className="hidden" onChange={(e) => { if (e.target.files) setFundingFiles(f => ({ ...f, bizLicense: [...f.bizLicense, ...Array.from(e.target.files!)] })); }} data-testid="input-funding-bizlicfiles" />
                          <div onClick={() => fundingBizLicRef.current?.click()} className={fileZone} data-testid="upload-zone-bizlic">
                            <span className="text-[11px] font-semibold text-[#6366f1]">Business License / Articles of Incorporation</span>
                            <p className="text-[9px] text-[#999]">PDF or image</p>
                            {renderFiles(fundingFiles.bizLicense, "bizLicense", setFundingFiles)}
                          </div>

                          <input ref={fundingDLRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setFundingFiles(f => ({ ...f, driversLicense: e.target.files![0] })); }} data-testid="input-funding-dlfile" />
                          <div onClick={() => fundingDLRef.current?.click()} className={fileZone} data-testid="upload-zone-dl">
                            <span className="text-[11px] font-semibold text-[#6366f1]">Copy of Driver's License</span>
                            <p className="text-[9px] text-[#999]">Front & back — PDF, JPG, PNG</p>
                            {renderSingle(fundingFiles.driversLicense, "driversLicense")}
                          </div>

                          <input ref={fundingResidencyRef} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setFundingFiles(f => ({ ...f, proofOfResidency: e.target.files![0] })); }} data-testid="input-funding-residencyfile" />
                          <div onClick={() => fundingResidencyRef.current?.click()} className={fileZone} data-testid="upload-zone-residency">
                            <span className="text-[11px] font-semibold text-[#6366f1]">Proof of Residency (Business Utility / Lease)</span>
                            <p className="text-[9px] text-[#999]">Utility bill or lease agreement — PDF or image</p>
                            {renderSingle(fundingFiles.proofOfResidency, "proofOfResidency")}
                          </div>

                          <input ref={fundingCreditRef} type="file" accept=".pdf,.txt,.csv" className="hidden" onChange={(e) => { if (e.target.files?.[0]) setFundingFiles(f => ({ ...f, creditReport: e.target.files![0] })); }} data-testid="input-funding-credit-file" />
                          <div onClick={() => fundingCreditRef.current?.click()} className={fileZone} data-testid="upload-zone-credit">
                            <span className="text-[11px] font-semibold text-[#6366f1]">Credit Report</span>
                            <p className="text-[9px] text-[#999]">PDF, TXT, or CSV from any bureau</p>
                            {renderSingle(fundingFiles.creditReport, "creditReport")}
                          </div>
                        </div>
                      </div>
                    </>);
                  })()}

                  <button
                    onClick={async () => {
                      const missing: string[] = [];
                      if (!fundingForm.firstName) missing.push("First Name");
                      if (!fundingForm.lastName) missing.push("Last Name");
                      if (!fundingForm.email) missing.push("Email");
                      if (!fundingForm.phone) missing.push("Phone");
                      if (!fundingForm.businessName) missing.push("Business Name");
                      if (missing.length > 0) {
                        alert(`Please fill in: ${missing.join(", ")}`);
                        return;
                      }
                      setIsSubmittingFunding(true);
                      try {
                        const fileNames: string[] = [];
                        fundingFiles.bizBankStatements.forEach(f => fileNames.push(`[Biz Bank] ${f.name}`));
                        fundingFiles.personalBankStatements.forEach(f => fileNames.push(`[Pers Bank] ${f.name}`));
                        fundingFiles.bizTaxReturns.forEach(f => fileNames.push(`[Biz Tax] ${f.name}`));
                        fundingFiles.personalTaxReturns.forEach(f => fileNames.push(`[Pers Tax] ${f.name}`));
                        fundingFiles.bizLicense.forEach(f => fileNames.push(`[Biz License] ${f.name}`));
                        if (fundingFiles.driversLicense) fileNames.push(`[Driver's License] ${fundingFiles.driversLicense.name}`);
                        if (fundingFiles.proofOfResidency) fileNames.push(`[Proof of Residency] ${fundingFiles.proofOfResidency.name}`);
                        if (fundingFiles.creditReport) fileNames.push(`[Credit Report] ${fundingFiles.creditReport.name}`);

                        const res = await fetch("/api/funding-application", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({
                            form: fundingForm,
                            signatureDataUrl: signatureDataUrl,
                            termsAcceptedAt: new Date().toISOString(),
                            fileNames,
                          }),
                        });
                        const data = await res.json();
                        if (data.success) {
                          alert("Application submitted successfully! Your signed broker agreement and application have been sent. Our team will review and reach out within 24-48 hours.");
                        } else {
                          alert("Application saved. Our team will follow up shortly.");
                        }
                        setFundingStep("closed");
                        setTermsAccepted(false);
                        setSignatureDataUrl(null);
                        setFundingForm(emptyFundingForm);
                        setFundingFiles(emptyFundingFiles);
                      } catch (err) {
                        alert("Application saved. Our team will follow up shortly.");
                        setFundingStep("closed");
                      } finally {
                        setIsSubmittingFunding(false);
                      }
                    }}
                    disabled={isSubmittingFunding}
                    className="w-full py-3 bg-gradient-to-r from-[#6366f1] to-[#4f46e5] text-white rounded-full text-[14px] font-semibold hover:opacity-90 transition-opacity shadow-md disabled:opacity-50"
                    data-testid="button-submit-funding"
                  >
                    {isSubmittingFunding ? "Submitting..." : "Submit Application"}
                  </button>

                  <p className="text-center text-[9px] text-[#bbb] leading-[1.5]">
                    Your signed agreement and application will be sent securely. No hard inquiry will be performed.
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

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
