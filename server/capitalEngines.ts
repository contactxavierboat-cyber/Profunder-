import type { User } from "@shared/schema";

export type FundingPhase = "repair" | "build" | "optimize" | "apply" | "scale";

export interface PhaseResult {
  phase: FundingPhase;
  phaseIndex: number;
  phaseLabel: string;
  progress: number;
  phases: { key: FundingPhase; label: string; active: boolean; completed: boolean }[];
  reasoning: string;
}

export function calculateFundingPhase(user: User): PhaseResult {
  const derogatories = user.derogatoryAccounts || 0;
  const latePayments = user.latePayments || 0;
  const collections = user.collections || 0;
  const publicRecords = user.publicRecords || 0;
  const utilization = user.utilizationPercent ?? (user.totalRevolvingLimit && user.totalRevolvingLimit > 0
    ? Math.round(((user.totalBalances || 0) / user.totalRevolvingLimit) * 100) : 100);
  const avgAge = user.avgAccountAgeYears || 0;
  const inquiries = user.inquiries || 0;
  const revolvingLimit = user.totalRevolvingLimit || 0;
  const creditScore = user.creditScoreExact || 0;
  const openAccounts = user.openAccounts || 0;

  const negativeItems = derogatories + collections + publicRecords;
  const hasNegatives = negativeItems > 0 || latePayments > 2;

  let phase: FundingPhase;
  let reasoning: string;

  if (hasNegatives || creditScore < 580 || utilization > 70) {
    phase = "repair";
    reasoning = negativeItems > 0
      ? `${negativeItems} negative item(s) detected. Focus on dispute resolution and removal before building.`
      : utilization > 70
        ? `Utilization at ${utilization}% is too high. Reduce balances before building credit capacity.`
        : `Credit score below 580. Repair needed before building new tradelines.`;
  } else if (creditScore < 650 || utilization > 40 || avgAge < 2 || openAccounts < 3) {
    phase = "build";
    reasoning = creditScore < 650
      ? `Score at ${creditScore}. Building tradeline depth and positive history to reach optimization threshold.`
      : utilization > 40
        ? `Utilization at ${utilization}%. Building lower balance habits and new credit capacity.`
        : `Account profile needs strengthening (${openAccounts} accounts, ${avgAge}yr avg age).`;
  } else if (creditScore < 700 || utilization > 25 || inquiries > 3) {
    phase = "optimize";
    reasoning = creditScore < 700
      ? `Score at ${creditScore}. Fine-tuning utilization, inquiry timing, and account mix for max approval odds.`
      : inquiries > 3
        ? `${inquiries} recent inquiries. Allow inquiry aging before next application cycle.`
        : `Optimizing utilization from ${utilization}% toward sub-10% for Tier 1 access.`;
  } else if (creditScore < 750 || revolvingLimit < 50000) {
    phase = "apply";
    reasoning = `Profile is strong (${creditScore} score, ${utilization}% util). Strategic application timing for maximum approval amounts.`;
  } else {
    phase = "scale";
    reasoning = `Elite profile: ${creditScore} score, $${revolvingLimit.toLocaleString()} exposure. Focus on scaling capital stack and leverage optimization.`;
  }

  const phaseOrder: FundingPhase[] = ["repair", "build", "optimize", "apply", "scale"];
  const phaseLabels: Record<FundingPhase, string> = {
    repair: "Repair", build: "Build", optimize: "Optimize", apply: "Apply", scale: "Scale"
  };
  const phaseIndex = phaseOrder.indexOf(phase);
  const progress = ((phaseIndex) / (phaseOrder.length - 1)) * 100;

  return {
    phase,
    phaseIndex,
    phaseLabel: phaseLabels[phase],
    progress,
    phases: phaseOrder.map((p, i) => ({
      key: p,
      label: phaseLabels[p],
      active: p === phase,
      completed: i < phaseIndex,
    })),
    reasoning,
  };
}

export interface ReadinessScore {
  total: number;
  categories: {
    name: string;
    weight: number;
    score: number;
    maxScore: number;
    weightedScore: number;
    tooltip: string;
  }[];
  grade: string;
  gradeColor: string;
}

export function calculateCapitalReadiness(user: User): ReadinessScore {
  const underwritingScore = user.underwritingScore;
  const riskTier = user.riskTier;

  if (underwritingScore !== null && underwritingScore !== undefined && riskTier) {
    const creditScore = user.creditScoreExact || 0;
    const utilization = user.utilizationPercent ?? 0;
    const inquiries = user.inquiries || 0;
    const avgAge = user.avgAccountAgeYears || 0;
    const revolvingLimit = user.totalRevolvingLimit || 0;
    const latePayments = user.latePayments || 0;
    const collections = user.collections || 0;
    const derogatories = user.derogatoryAccounts || 0;
    const openAccounts = user.openAccounts || 0;

    const cqScore = user.creditQualityScore ?? 0;
    const ueScore = user.utilizationExposureScore ?? 0;
    const dsScore = user.depthStabilityScore ?? 0;
    const vrScore = user.velocityRiskScore ?? 0;

    const total = underwritingScore;

    let grade: string;
    let gradeColor: string;
    if (total >= 80) { grade = "A+"; gradeColor = "#10b981"; }
    else if (total >= 70) { grade = "A"; gradeColor = "#22c55e"; }
    else if (total >= 65) { grade = "B+"; gradeColor = "#84cc16"; }
    else if (total >= 55) { grade = "B"; gradeColor = "#eab308"; }
    else if (total >= 45) { grade = "C"; gradeColor = "#f97316"; }
    else if (total >= 30) { grade = "D"; gradeColor = "#ef4444"; }
    else { grade = "F"; gradeColor = "#dc2626"; }

    const cqTooltip = creditScore > 0
      ? `FICO ${creditScore} — ${riskTier} tier. ${latePayments > 0 ? latePayments + ' late payment(s), ' : ''}${collections > 0 ? collections + ' collection(s), ' : ''}${derogatories > 0 ? derogatories + ' derogatory item(s).' : 'No negative marks.'}`
      : `Risk tier: ${riskTier}. Score reflects payment history and derogatory items.`;
    const ueTooltip = `Utilization at ${utilization}%. ${inquiries > 0 ? inquiries + ' hard inquiries.' : 'No recent inquiries.'}`;
    const dsTooltip = `Average account age: ${avgAge} years. ${openAccounts} open accounts. $${revolvingLimit.toLocaleString()} total limits.`;
    const vrTooltip = `Velocity & risk flags assessment. ${derogatories > 0 ? 'Active derogatories detected.' : 'No major risk flags.'}`;

    return {
      total,
      categories: [
        { name: "Credit Quality", weight: 50, score: cqScore, maxScore: 50, weightedScore: cqScore, tooltip: cqTooltip },
        { name: "Utilization & Exposure", weight: 25, score: ueScore, maxScore: 25, weightedScore: ueScore, tooltip: ueTooltip },
        { name: "Depth & Stability", weight: 15, score: dsScore, maxScore: 15, weightedScore: dsScore, tooltip: dsTooltip },
        { name: "Velocity & Risk", weight: 10, score: vrScore, maxScore: 10, weightedScore: vrScore, tooltip: vrTooltip },
      ],
      grade,
      gradeColor,
    };
  }

  const creditScore = user.creditScoreExact || 0;
  const latePayments = user.latePayments || 0;
  const collections = user.collections || 0;
  const derogatories = user.derogatoryAccounts || 0;
  const publicRecords = user.publicRecords || 0;
  const utilization = user.utilizationPercent ?? (user.totalRevolvingLimit && user.totalRevolvingLimit > 0
    ? Math.round(((user.totalBalances || 0) / user.totalRevolvingLimit) * 100) : 100);
  const revolvingLimit = user.totalRevolvingLimit || 0;
  const inquiries = user.inquiries || 0;
  const avgAge = user.avgAccountAgeYears || 0;
  const openAccounts = user.openAccounts || 0;
  const hasCR = user.hasCreditReport || false;
  const hasBS = user.hasBankStatement || false;

  let scoreRaw = 0;
  if (creditScore >= 760) scoreRaw = 50;
  else if (creditScore >= 720) scoreRaw = 44;
  else if (creditScore >= 680) scoreRaw = 36;
  else if (creditScore >= 640) scoreRaw = 26;
  else if (creditScore >= 600) scoreRaw = 16;
  else if (creditScore > 0) scoreRaw = 8;
  if (latePayments > 0) scoreRaw = Math.max(0, scoreRaw - Math.min(15, latePayments * 5));
  if (collections > 0) scoreRaw = Math.max(0, scoreRaw - Math.min(15, collections * 10));
  if (derogatories > 0) scoreRaw = Math.max(0, scoreRaw - Math.min(10, derogatories * 5));
  if (publicRecords > 0) scoreRaw = Math.max(0, scoreRaw - Math.min(10, publicRecords * 10));

  let utilRaw = 0;
  if (utilization <= 9) utilRaw = 25;
  else if (utilization <= 29) utilRaw = 20;
  else if (utilization <= 49) utilRaw = 15;
  else if (utilization <= 69) utilRaw = 8;
  else utilRaw = 3;
  if (inquiries > 5) utilRaw = Math.max(0, utilRaw - 5);
  else if (inquiries > 3) utilRaw = Math.max(0, utilRaw - 3);

  const oldestAge = user.oldestAccountYears || 0;
  let depthRaw = 0;
  if (oldestAge >= 10) depthRaw = 15;
  else if (oldestAge >= 5) depthRaw = 12;
  else if (oldestAge >= 2) depthRaw = 8;
  else depthRaw = 4;
  if (openAccounts < 3) depthRaw = Math.min(depthRaw, 6);

  let velocityRaw = 10;
  if (derogatories > 1) velocityRaw = Math.min(velocityRaw, 4);
  if (collections > 0) velocityRaw = Math.min(velocityRaw, 4);

  const total = Math.min(100, scoreRaw + utilRaw + depthRaw + velocityRaw);

  let grade: string;
  let gradeColor: string;
  if (total >= 80) { grade = "A+"; gradeColor = "#10b981"; }
  else if (total >= 70) { grade = "A"; gradeColor = "#22c55e"; }
  else if (total >= 65) { grade = "B+"; gradeColor = "#84cc16"; }
  else if (total >= 55) { grade = "B"; gradeColor = "#eab308"; }
  else if (total >= 45) { grade = "C"; gradeColor = "#f97316"; }
  else if (total >= 30) { grade = "D"; gradeColor = "#ef4444"; }
  else { grade = "F"; gradeColor = "#dc2626"; }

  const cqTooltip = creditScore > 0
    ? `FICO ${creditScore}. ${latePayments > 0 ? latePayments + ' late payment(s). ' : ''}${collections > 0 ? collections + ' collection(s). ' : ''}${derogatories === 0 ? 'No derogatory marks.' : derogatories + ' derogatory item(s).'}`
    : "No credit score data available.";

  return {
    total,
    categories: [
      { name: "Credit Quality", weight: 50, score: scoreRaw, maxScore: 50, weightedScore: scoreRaw, tooltip: cqTooltip },
      { name: "Utilization & Exposure", weight: 25, score: utilRaw, maxScore: 25, weightedScore: utilRaw, tooltip: `Utilization at ${utilization}%. ${inquiries} inquiries.` },
      { name: "Depth & Stability", weight: 15, score: depthRaw, maxScore: 15, weightedScore: depthRaw, tooltip: `Oldest account: ${oldestAge} years. ${openAccounts} open accounts.` },
      { name: "Velocity & Risk", weight: 10, score: velocityRaw, maxScore: 10, weightedScore: velocityRaw, tooltip: `${derogatories > 0 ? 'Active derogatories detected.' : 'No major risk flags.'}` },
    ],
    grade,
    gradeColor,
  };
}

export interface SafeExposure {
  safeAmount: number;
  currentExposure: number;
  maxSafeExposure: number;
  zone: "safe" | "caution" | "denial";
  zoneLabel: string;
  zoneColor: string;
  percentage: number;
  reasoning: string;
  limits: { safe: number; caution: number; denial: number };
}

export function calculateSafeExposure(user: User): SafeExposure {
  const revolvingLimit = user.totalRevolvingLimit || 0;
  const balances = user.totalBalances || 0;
  const utilization = user.utilizationPercent ?? (revolvingLimit > 0 ? Math.round((balances / revolvingLimit) * 100) : 100);
  const inquiries = user.inquiries || 0;
  const openAccounts = user.openAccounts || 0;
  const creditScore = user.creditScoreExact || 650;
  const largestLimit = user.largestRevolvingLimit || revolvingLimit;

  let maxSafe = 0;

  if (user.exposureCeiling && user.exposureCeiling > 0) {
    maxSafe = user.exposureCeiling;
  } else {
    const riskTier = user.riskTier;
    if (riskTier === "PRIME") maxSafe = largestLimit * 2.5;
    else if (riskTier === "STANDARD") maxSafe = largestLimit * 2.0;
    else if (riskTier === "SUBPRIME") maxSafe = largestLimit * 1.5;
    else if (creditScore >= 750) maxSafe = largestLimit * 2.5;
    else if (creditScore >= 700) maxSafe = largestLimit * 2.0;
    else if (creditScore >= 650) maxSafe = largestLimit * 1.5;
    else if (creditScore >= 600) maxSafe = largestLimit * 1.0;
    else maxSafe = largestLimit * 0.5;
  }

  maxSafe = Math.round(maxSafe);
  const safeAmount = user.remainingSafeCapacity !== null && user.remainingSafeCapacity !== undefined
    ? Math.max(0, user.remainingSafeCapacity)
    : Math.max(0, maxSafe - revolvingLimit);
  const cautionThreshold = maxSafe * 0.7;
  const denialThreshold = maxSafe * 0.9;

  let zone: "safe" | "caution" | "denial";
  let zoneLabel: string;
  let zoneColor: string;
  if (revolvingLimit <= cautionThreshold) {
    zone = "safe"; zoneLabel = "Safe Zone"; zoneColor = "#10b981";
  } else if (revolvingLimit <= denialThreshold) {
    zone = "caution"; zoneLabel = "Caution Zone"; zoneColor = "#f59e0b";
  } else {
    zone = "denial"; zoneLabel = "Denial Zone"; zoneColor = "#ef4444";
  }

  const percentage = maxSafe > 0 ? Math.min(100, Math.round((revolvingLimit / maxSafe) * 100)) : 100;

  let reasoning: string;
  if (zone === "safe") {
    reasoning = `You can safely add approximately $${safeAmount.toLocaleString()} in new credit without increasing denial probability.`;
  } else if (zone === "caution") {
    reasoning = `Approaching exposure limits. Additional credit may trigger higher scrutiny. Consider optimizing existing utilization first.`;
  } else {
    reasoning = `At or near maximum safe exposure. New applications have elevated denial risk. Focus on paying down existing balances.`;
  }

  return {
    safeAmount, currentExposure: revolvingLimit, maxSafeExposure: maxSafe,
    zone, zoneLabel, zoneColor, percentage, reasoning,
    limits: { safe: Math.round(cautionThreshold), caution: Math.round(denialThreshold), denial: maxSafe },
  };
}

export interface BureauHealth {
  bureau: string;
  utilization: number;
  hardInquiries: number;
  derogatoryCount: number;
  oldestAccountAge: number;
  riskStatus: "Strong" | "Moderate" | "Weak";
  riskColor: string;
  priority: boolean;
  recommendation: string;
}

export function calculateBureauHealth(user: User): { bureaus: BureauHealth[]; priorityBureau: string } {
  const utilization = user.utilizationPercent ?? 50;
  const inquiries = user.inquiries || 0;
  const derogatories = user.derogatoryAccounts || 0;
  const collections = user.collections || 0;
  const oldestAge = user.oldestAccountYears || 0;
  const latePayments = user.latePayments || 0;

  const totalNeg = derogatories + collections;

  const bureauVariance = (base: number, seed: number) => {
    const variance = Math.round((seed % 7) - 3);
    return Math.max(0, base + variance);
  };

  const makeBureau = (name: string, seed: number): BureauHealth => {
    const util = bureauVariance(utilization, seed);
    const inq = bureauVariance(inquiries, seed + 3);
    const derog = bureauVariance(totalNeg, seed + 5);
    const age = Math.max(0, oldestAge + (seed % 3) - 1);

    let status: "Strong" | "Moderate" | "Weak";
    let riskColor: string;
    if (derog === 0 && util <= 20 && inq <= 2) {
      status = "Strong"; riskColor = "#10b981";
    } else if (derog <= 1 && util <= 45 && inq <= 4) {
      status = "Moderate"; riskColor = "#f59e0b";
    } else {
      status = "Weak"; riskColor = "#ef4444";
    }

    let recommendation = "";
    if (status === "Strong") recommendation = `${name} profile is strong. Prioritize this bureau for funding applications.`;
    else if (status === "Moderate") recommendation = `${name} needs optimization. Address ${derog > 0 ? "derogatory items" : util > 30 ? "utilization" : "inquiry density"} first.`;
    else recommendation = `${name} requires repair. Focus dispute efforts here before applying.`;

    return { bureau: name, utilization: util, hardInquiries: inq, derogatoryCount: derog, oldestAccountAge: age, riskStatus: status, riskColor, priority: false, recommendation };
  };

  const bureaus = [
    makeBureau("Experian", 2),
    makeBureau("Equifax", 5),
    makeBureau("TransUnion", 8),
  ];

  const strongest = bureaus.reduce((best, b) => {
    const score = (b.riskStatus === "Strong" ? 3 : b.riskStatus === "Moderate" ? 2 : 1) * 10
      - b.derogatoryCount * 5 - b.utilization * 0.1 - b.hardInquiries * 2;
    const bestScore = (best.riskStatus === "Strong" ? 3 : best.riskStatus === "Moderate" ? 2 : 1) * 10
      - best.derogatoryCount * 5 - best.utilization * 0.1 - best.hardInquiries * 2;
    return score > bestScore ? b : best;
  });
  strongest.priority = true;

  return { bureaus, priorityBureau: strongest.bureau };
}

export interface ApplicationWindow {
  daysUntilOptimal: number;
  optimalDate: string;
  currentStatus: "ready" | "wait" | "repair_first";
  reasoning: string;
  factors: { factor: string; status: "good" | "warning" | "bad"; detail: string }[];
}

export function calculateApplicationWindow(user: User): ApplicationWindow {
  const inquiries = user.inquiries || 0;
  const utilization = user.utilizationPercent ?? 50;
  const derogatories = user.derogatoryAccounts || 0;
  const collections = user.collections || 0;
  const latePayments = user.latePayments || 0;
  const creditScore = user.creditScoreExact || 0;

  const factors: { factor: string; status: "good" | "warning" | "bad"; detail: string }[] = [];
  let waitDays = 0;

  if (inquiries > 4) {
    factors.push({ factor: "Inquiry Density", status: "bad", detail: `${inquiries} recent inquiries. Wait for aging.` });
    waitDays = Math.max(waitDays, (inquiries - 2) * 30);
  } else if (inquiries > 2) {
    factors.push({ factor: "Inquiry Density", status: "warning", detail: `${inquiries} inquiries. Moderate risk.` });
    waitDays = Math.max(waitDays, 30);
  } else {
    factors.push({ factor: "Inquiry Density", status: "good", detail: `${inquiries} inquiries. Safe to apply.` });
  }

  if (utilization > 50) {
    factors.push({ factor: "Utilization", status: "bad", detail: `${utilization}% utilization. Pay down before applying.` });
    waitDays = Math.max(waitDays, 45);
  } else if (utilization > 30) {
    factors.push({ factor: "Utilization", status: "warning", detail: `${utilization}% utilization. Would benefit from reduction.` });
    waitDays = Math.max(waitDays, 15);
  } else {
    factors.push({ factor: "Utilization", status: "good", detail: `${utilization}% utilization. Optimal for applications.` });
  }

  if (derogatories + collections > 0) {
    factors.push({ factor: "Negative Items", status: "bad", detail: `${derogatories + collections} negative items need resolution.` });
    waitDays = Math.max(waitDays, 90);
  } else {
    factors.push({ factor: "Negative Items", status: "good", detail: "No derogatory items detected." });
  }

  if (creditScore > 0 && creditScore < 650) {
    factors.push({ factor: "Credit Score", status: "bad", detail: `Score at ${creditScore}. Target 650+ for better terms.` });
    waitDays = Math.max(waitDays, 60);
  } else if (creditScore >= 650 && creditScore < 700) {
    factors.push({ factor: "Credit Score", status: "warning", detail: `Score at ${creditScore}. Good, but 700+ unlocks Tier 1.` });
  } else if (creditScore >= 700) {
    factors.push({ factor: "Credit Score", status: "good", detail: `Score at ${creditScore}. Strong application position.` });
  }

  const optimalDate = new Date();
  optimalDate.setDate(optimalDate.getDate() + waitDays);

  let currentStatus: "ready" | "wait" | "repair_first";
  let reasoning: string;
  if (waitDays === 0) {
    currentStatus = "ready";
    reasoning = "All factors aligned. You are in an optimal application window now.";
  } else if (derogatories + collections > 0) {
    currentStatus = "repair_first";
    reasoning = `Repair negative items before applying. Estimated window in ${waitDays} days.`;
  } else {
    currentStatus = "wait";
    reasoning = `Optimal funding window in ${waitDays} days. Address flagged factors to accelerate.`;
  }

  return {
    daysUntilOptimal: waitDays,
    optimalDate: optimalDate.toISOString().split("T")[0],
    currentStatus,
    reasoning,
    factors,
  };
}

export interface BankRatingResult {
  rating: number;
  label: string;
  recommendations: string[];
}

export function simulateBankRating(avgMonthlyDeposits: number, relationshipYears: number, targetInstitution: string): BankRatingResult {
  let rating = 1;

  if (avgMonthlyDeposits >= 50000) rating += 2;
  else if (avgMonthlyDeposits >= 20000) rating += 1.5;
  else if (avgMonthlyDeposits >= 10000) rating += 1;
  else if (avgMonthlyDeposits >= 5000) rating += 0.5;

  if (relationshipYears >= 5) rating += 1.5;
  else if (relationshipYears >= 3) rating += 1;
  else if (relationshipYears >= 1) rating += 0.5;

  rating = Math.min(5, Math.round(rating * 10) / 10);

  const labels: Record<number, string> = { 1: "New/Unrated", 2: "Developing", 3: "Established", 4: "Strong", 5: "Premium" };
  const label = labels[Math.round(rating)] || "Developing";

  const recommendations: string[] = [];
  if (avgMonthlyDeposits < 10000) recommendations.push("Increase average monthly deposits to $10,000+ to improve internal rating.");
  if (relationshipYears < 2) recommendations.push("Maintain account for 2+ years to build relationship strength.");
  if (avgMonthlyDeposits >= 10000 && relationshipYears >= 2) recommendations.push("Consider requesting a relationship review with your banker.");
  recommendations.push("Set up automatic deposits to show consistent cash flow patterns.");
  if (rating < 4) recommendations.push(`Target institution: ${targetInstitution || "your bank"}. Ask about business credit products after reaching rating 4+.`);

  return { rating, label, recommendations };
}

export interface PledgeLoanResult {
  utilBefore: number;
  utilAfter: number;
  scoreDelta: number;
  timelineMonths: number;
  recommendation: string;
}

export function simulatePledgeLoan(user: User, loanAmount: number, paydownPercent: number): PledgeLoanResult {
  const revolvingLimit = user.totalRevolvingLimit || 0;
  const balances = user.totalBalances || 0;
  const utilBefore = revolvingLimit > 0 ? Math.round((balances / revolvingLimit) * 100) : 100;

  const paydownAmount = loanAmount * (paydownPercent / 100);
  const newBalances = Math.max(0, balances - paydownAmount);
  const newLimit = revolvingLimit + loanAmount;
  const utilAfter = newLimit > 0 ? Math.round((newBalances / newLimit) * 100) : 0;

  const utilDrop = utilBefore - utilAfter;
  let scoreDelta = 0;
  if (utilDrop > 30) scoreDelta = 40;
  else if (utilDrop > 20) scoreDelta = 30;
  else if (utilDrop > 10) scoreDelta = 20;
  else if (utilDrop > 5) scoreDelta = 10;
  else scoreDelta = 5;

  const timelineMonths = Math.max(1, Math.ceil(loanAmount / 5000) * 2);

  const recommendation = utilAfter <= 10
    ? "Excellent strategy. This would place utilization in optimal range for Tier 1 funding."
    : utilAfter <= 30
      ? "Good improvement. Consider a larger paydown percentage for maximum score impact."
      : "Moderate impact. May need additional strategies to reach optimal utilization.";

  return { utilBefore, utilAfter, scoreDelta, timelineMonths, recommendation };
}

export interface CapitalStackPlan {
  targetAmount: number;
  stages: { stage: number; bureau: string; product: string; estimatedAmount: number; timing: string }[];
  totalEstimated: number;
  timeline: string;
}

export function simulateCapitalStack(user: User, targetAmount: number): CapitalStackPlan {
  const creditScore = user.creditScoreExact || 650;
  const bureaus = calculateBureauHealth(user);

  const stages: { stage: number; bureau: string; product: string; estimatedAmount: number; timing: string }[] = [];
  let running = 0;
  let stageNum = 1;

  const sorted = [...bureaus.bureaus].sort((a, b) => {
    const sa = a.riskStatus === "Strong" ? 3 : a.riskStatus === "Moderate" ? 2 : 1;
    const sb = b.riskStatus === "Strong" ? 3 : b.riskStatus === "Moderate" ? 2 : 1;
    return sb - sa;
  });

  for (const b of sorted) {
    if (running >= targetAmount) break;
    const maxPerBureau = creditScore >= 700 ? targetAmount * 0.5 : creditScore >= 650 ? targetAmount * 0.35 : targetAmount * 0.2;

    if (b.riskStatus !== "Weak") {
      const creditLine = Math.min(maxPerBureau * 0.4, targetAmount - running);
      if (creditLine > 0) {
        stages.push({ stage: stageNum++, bureau: b.bureau, product: "Business Line of Credit", estimatedAmount: Math.round(creditLine), timing: "Week 1-2" });
        running += creditLine;
      }
    }

    if (running < targetAmount && b.riskStatus !== "Weak") {
      const card = Math.min(maxPerBureau * 0.3, targetAmount - running);
      if (card > 0) {
        stages.push({ stage: stageNum++, bureau: b.bureau, product: "Business Credit Card", estimatedAmount: Math.round(card), timing: `Week ${stageNum}` });
        running += card;
      }
    }

    if (running < targetAmount) {
      const term = Math.min(maxPerBureau * 0.3, targetAmount - running);
      if (term > 0) {
        stages.push({ stage: stageNum++, bureau: b.bureau, product: creditScore >= 700 ? "Term Loan" : "Secured Credit", estimatedAmount: Math.round(term), timing: `Week ${stageNum + 1}-${stageNum + 2}` });
        running += term;
      }
    }
  }

  return {
    targetAmount,
    stages,
    totalEstimated: Math.round(running),
    timeline: stages.length > 0 ? `${stages[stages.length - 1].timing}` : "N/A",
  };
}
