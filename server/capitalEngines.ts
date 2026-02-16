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
  const oldestAge = user.oldestAccountYears || 0;
  const openAccounts = user.openAccounts || 0;
  const hasCR = user.hasCreditReport || false;
  const hasBS = user.hasBankStatement || false;

  // Payment History (30%)
  let paymentRaw = 100;
  if (latePayments > 0) paymentRaw -= Math.min(40, latePayments * 10);
  if (collections > 0) paymentRaw -= Math.min(30, collections * 15);
  if (derogatories > 0) paymentRaw -= Math.min(20, derogatories * 10);
  if (publicRecords > 0) paymentRaw -= Math.min(20, publicRecords * 10);
  paymentRaw = Math.max(0, paymentRaw);
  const paymentWeighted = (paymentRaw / 100) * 30;
  const paymentTooltip = latePayments === 0 && collections === 0 && derogatories === 0
    ? "Clean payment history. No derogatory items detected."
    : `${latePayments} late payment(s), ${collections} collection(s), ${derogatories} derogatory item(s) reducing score.`;

  // Utilization (25%)
  let utilRaw = 0;
  if (utilization <= 5) utilRaw = 100;
  else if (utilization <= 10) utilRaw = 95;
  else if (utilization <= 20) utilRaw = 85;
  else if (utilization <= 30) utilRaw = 70;
  else if (utilization <= 45) utilRaw = 50;
  else if (utilization <= 60) utilRaw = 30;
  else if (utilization <= 80) utilRaw = 15;
  else utilRaw = 5;
  const utilWeighted = (utilRaw / 100) * 25;
  const utilTooltip = utilization <= 10
    ? `Excellent utilization at ${utilization}%. Optimal for approvals.`
    : utilization <= 30
      ? `Utilization at ${utilization}%. Target under 10% for maximum impact.`
      : `Utilization at ${utilization}% is elevated. Pay down balances to improve.`;

  // Exposure Depth (15%)
  let exposureRaw = 0;
  if (revolvingLimit >= 100000) exposureRaw = 100;
  else if (revolvingLimit >= 50000) exposureRaw = 85;
  else if (revolvingLimit >= 25000) exposureRaw = 70;
  else if (revolvingLimit >= 10000) exposureRaw = 50;
  else if (revolvingLimit >= 5000) exposureRaw = 30;
  else if (revolvingLimit > 0) exposureRaw = 15;
  const exposureWeighted = (exposureRaw / 100) * 15;
  const exposureTooltip = revolvingLimit >= 50000
    ? `Strong exposure at $${revolvingLimit.toLocaleString()}. Demonstrates capacity.`
    : `Total limits at $${revolvingLimit.toLocaleString()}. Higher limits signal lender confidence.`;

  // Inquiry Sensitivity (10%)
  let inquiryRaw = 100;
  if (inquiries > 6) inquiryRaw = 10;
  else if (inquiries > 4) inquiryRaw = 30;
  else if (inquiries > 2) inquiryRaw = 60;
  else if (inquiries > 0) inquiryRaw = 80;
  const inquiryWeighted = (inquiryRaw / 100) * 10;
  const inquiryTooltip = inquiries === 0
    ? "No recent hard inquiries. Clean application signal."
    : inquiries <= 2
      ? `${inquiries} inquiry(ies). Minimal impact but monitor timing.`
      : `${inquiries} inquiries detected. High density may signal desperation to lenders.`;

  // Account Age (10%)
  let ageRaw = 0;
  if (avgAge >= 7) ageRaw = 100;
  else if (avgAge >= 5) ageRaw = 80;
  else if (avgAge >= 3) ageRaw = 60;
  else if (avgAge >= 2) ageRaw = 40;
  else if (avgAge >= 1) ageRaw = 25;
  else ageRaw = 10;
  const ageWeighted = (ageRaw / 100) * 10;
  const ageTooltip = avgAge >= 5
    ? `Strong account age at ${avgAge} years average. Mature credit profile.`
    : `Average account age ${avgAge} years. Time and seasoning will improve this.`;

  // Bureau Strength Distribution (10%)
  let bureauRaw = 0;
  const profileScore = (hasCR ? 30 : 0) + (hasBS ? 20 : 0)
    + (openAccounts >= 5 ? 25 : openAccounts >= 3 ? 15 : 5)
    + (creditScore >= 700 ? 25 : creditScore >= 650 ? 15 : 5);
  bureauRaw = Math.min(100, profileScore);
  const bureauWeighted = (bureauRaw / 100) * 10;
  const bureauTooltip = hasCR && hasBS
    ? "Full documentation submitted. Strong bureau verification."
    : "Submit both credit report and bank statement for maximum bureau strength.";

  const total = Math.round(paymentWeighted + utilWeighted + exposureWeighted + inquiryWeighted + ageWeighted + bureauWeighted);

  let grade: string;
  let gradeColor: string;
  if (total >= 85) { grade = "A+"; gradeColor = "#10b981"; }
  else if (total >= 75) { grade = "A"; gradeColor = "#22c55e"; }
  else if (total >= 65) { grade = "B+"; gradeColor = "#84cc16"; }
  else if (total >= 55) { grade = "B"; gradeColor = "#eab308"; }
  else if (total >= 45) { grade = "C"; gradeColor = "#f97316"; }
  else if (total >= 30) { grade = "D"; gradeColor = "#ef4444"; }
  else { grade = "F"; gradeColor = "#dc2626"; }

  return {
    total,
    categories: [
      { name: "Payment History", weight: 30, score: paymentRaw, maxScore: 100, weightedScore: Math.round(paymentWeighted * 10) / 10, tooltip: paymentTooltip },
      { name: "Utilization", weight: 25, score: utilRaw, maxScore: 100, weightedScore: Math.round(utilWeighted * 10) / 10, tooltip: utilTooltip },
      { name: "Exposure Depth", weight: 15, score: exposureRaw, maxScore: 100, weightedScore: Math.round(exposureWeighted * 10) / 10, tooltip: exposureTooltip },
      { name: "Inquiry Sensitivity", weight: 10, score: inquiryRaw, maxScore: 100, weightedScore: Math.round(inquiryWeighted * 10) / 10, tooltip: inquiryTooltip },
      { name: "Account Age", weight: 10, score: ageRaw, maxScore: 100, weightedScore: Math.round(ageWeighted * 10) / 10, tooltip: ageTooltip },
      { name: "Bureau Strength", weight: 10, score: bureauRaw, maxScore: 100, weightedScore: Math.round(bureauWeighted * 10) / 10, tooltip: bureauTooltip },
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
  const avgLimitPerTradeline = openAccounts > 0 ? revolvingLimit / openAccounts : 0;
  const creditScore = user.creditScoreExact || 650;

  let maxSafe = 0;
  if (creditScore >= 750) maxSafe = revolvingLimit * 2.5;
  else if (creditScore >= 700) maxSafe = revolvingLimit * 2.0;
  else if (creditScore >= 650) maxSafe = revolvingLimit * 1.5;
  else if (creditScore >= 600) maxSafe = revolvingLimit * 1.0;
  else maxSafe = revolvingLimit * 0.5;

  if (inquiries > 4) maxSafe *= 0.7;
  else if (inquiries > 2) maxSafe *= 0.85;

  if (utilization > 50) maxSafe *= 0.6;
  else if (utilization > 30) maxSafe *= 0.8;

  if (openAccounts < 3) maxSafe *= 0.75;

  maxSafe = Math.round(maxSafe);
  const safeAmount = Math.max(0, maxSafe - revolvingLimit);
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

// ====================================================
// UNDERWRITING INTELLIGENCE ENGINE
// ====================================================

export type UnderwritingMode = "REPAIR" | "OPTIMIZATION" | "FUNDING_READY" | "WAIT_AND_OPTIMIZE";
export type CreditTier = "EXCELLENT" | "STRONG" | "BORDERLINE" | "WEAK";

export interface UnderwritingResult {
  finalMode: UnderwritingMode;
  creditTier: CreditTier;
  fundingEligible: boolean;
  denialReasons: string[];
  explanation: string;
  nextSteps: string[];
  fundingRange: { minimum: number; maximum: number } | null;
  flags: {
    utilizationFlag: boolean;
    velocityFlag: boolean;
    ageFlag: boolean;
    thinFileFlag: boolean;
    hardStopTriggered: boolean;
  };
  inputs: {
    creditScore: number;
    totalUtilization: number;
    highestCardUtilization: number;
    latePayments24mo: number;
    collectionsCount: number;
    chargeoffsCount: number;
    publicRecordsPresent: boolean;
    bankruptcyPresent: boolean;
    oldestAccountYears: number;
    averageAccountAgeYears: number;
    hardInquiries6mo: number;
    hardInquiries12mo: number;
    openRevolvingAccounts: number;
    recentAccounts12mo: number;
    totalRevolvingLimit: number;
    derogatoryPresent: boolean;
    identityFlagsPresent: boolean;
    issuerRelationshipNegative: boolean;
  };
}

export function calculateUnderwriting(user: User): UnderwritingResult {
  const creditScore = user.creditScoreExact || 0;
  const totalUtilization = user.utilizationPercent ?? (user.totalRevolvingLimit && user.totalRevolvingLimit > 0
    ? Math.round(((user.totalBalances || 0) / user.totalRevolvingLimit) * 100) : 100);
  const highestCardUtilization = user.highestCardUtilizationPercent ?? totalUtilization;
  const latePayments24mo = user.latePayments || 0;
  const collectionsCount = user.collections || 0;
  const chargeoffsCount = user.chargeoffs || 0;
  const publicRecordsPresent = (user.publicRecords || 0) > 0;
  const bankruptcyPresent = user.bankruptcyPresent || false;
  const oldestAccountYears = user.oldestAccountYears || 0;
  const averageAccountAgeYears = user.avgAccountAgeYears || 0;
  const hardInquiries6mo = user.hardInquiries6mo ?? Math.ceil((user.inquiries || 0) / 2);
  const hardInquiries12mo = user.hardInquiries12mo ?? (user.inquiries || 0);
  const openRevolvingAccounts = user.openAccounts || 0;
  const recentAccounts12mo = user.recentAccounts12mo || 0;
  const totalRevolvingLimit = user.totalRevolvingLimit || 0;
  const derogatoryPresent = (user.derogatoryAccounts || 0) > 0;
  const identityFlagsPresent = user.identityFlagsPresent || false;
  const issuerRelationshipNegative = user.issuerRelationshipNegative || false;

  const inputs = {
    creditScore, totalUtilization, highestCardUtilization, latePayments24mo,
    collectionsCount, chargeoffsCount, publicRecordsPresent, bankruptcyPresent,
    oldestAccountYears, averageAccountAgeYears, hardInquiries6mo, hardInquiries12mo,
    openRevolvingAccounts, recentAccounts12mo, totalRevolvingLimit, derogatoryPresent,
    identityFlagsPresent, issuerRelationshipNegative,
  };

  let outputMode: "REPAIR_MODE" | null = null;
  let fundingEligible = true;
  let utilizationFlag = false;
  let velocityFlag = false;
  let ageFlag = false;
  let thinFileFlag = false;
  const denialReasons: string[] = [];

  // === HARD STOP — AUTO REPAIR MODE ===
  if (bankruptcyPresent || chargeoffsCount > 0 || collectionsCount > 0 ||
      publicRecordsPresent || latePayments24mo >= 2 || identityFlagsPresent) {
    outputMode = "REPAIR_MODE";
    fundingEligible = false;
  }

  // === UTILIZATION RULES ===
  if (totalUtilization >= 30 || highestCardUtilization >= 50) {
    utilizationFlag = true;
  }
  if (totalUtilization >= 70 || highestCardUtilization >= 90) {
    outputMode = "REPAIR_MODE";
    fundingEligible = false;
  }

  // === INQUIRY / VELOCITY RULES ===
  if (hardInquiries6mo >= 6 || hardInquiries12mo >= 10) {
    velocityFlag = true;
  }
  if (hardInquiries6mo >= 8) {
    outputMode = "REPAIR_MODE";
    fundingEligible = false;
  }

  // === CREDIT SCORE TIERS ===
  let creditTier: CreditTier;
  if (creditScore >= 740) creditTier = "EXCELLENT";
  else if (creditScore >= 700) creditTier = "STRONG";
  else if (creditScore >= 680) creditTier = "BORDERLINE";
  else creditTier = "WEAK";

  if (creditScore < 680) fundingEligible = false;

  // === CREDIT AGE & FILE DEPTH ===
  if (oldestAccountYears < 2 || averageAccountAgeYears < 1.5) {
    ageFlag = true;
  }
  if (oldestAccountYears < 1) {
    outputMode = "REPAIR_MODE";
  }
  if (openRevolvingAccounts < 3) {
    thinFileFlag = true;
  }

  // === ISSUER RELATIONSHIP CHECK ===
  if (issuerRelationshipNegative) {
    denialReasons.push("Negative issuer relationship history");
  }

  // === DENIAL REASON MAPPING ===
  if (bankruptcyPresent) denialReasons.push("Bankruptcy on file");
  if (chargeoffsCount > 0) denialReasons.push(`${chargeoffsCount} charge-off(s) present`);
  if (collectionsCount > 0) denialReasons.push(`${collectionsCount} collection(s) present`);
  if (publicRecordsPresent) denialReasons.push("Public records present");
  if (latePayments24mo >= 2) denialReasons.push(`${latePayments24mo} late payment(s) in 24 months`);
  if (identityFlagsPresent) denialReasons.push("Identity flags detected");
  if (utilizationFlag) denialReasons.push("High credit utilization");
  if (velocityFlag) denialReasons.push("Too many recent inquiries");
  if (ageFlag) denialReasons.push("Insufficient credit history");
  if (thinFileFlag) denialReasons.push("Thin credit file");
  if (derogatoryPresent && chargeoffsCount === 0 && collectionsCount === 0) denialReasons.push("Derogatory accounts present");

  // === FINAL MODE DECISION ===
  let finalMode: UnderwritingMode;
  if (outputMode === "REPAIR_MODE") {
    finalMode = "REPAIR";
  } else if (utilizationFlag || velocityFlag || ageFlag) {
    finalMode = "OPTIMIZATION";
  } else if (creditScore >= 700 && totalUtilization < 10 && hardInquiries6mo <= 2 && !derogatoryPresent) {
    finalMode = "FUNDING_READY";
  } else {
    finalMode = "WAIT_AND_OPTIMIZE";
  }

  // === CONDITIONAL FUNDING CALCULATOR ===
  let fundingRange: { minimum: number; maximum: number } | null = null;
  if (finalMode === "FUNDING_READY") {
    fundingRange = {
      minimum: Math.round(totalRevolvingLimit * 1.5),
      maximum: Math.round(totalRevolvingLimit * 2.5),
    };
  }

  // === EXPLANATION ===
  let explanation: string;
  const nextSteps: string[] = [];

  if (finalMode === "REPAIR") {
    const triggers: string[] = [];
    if (bankruptcyPresent) triggers.push("bankruptcy on file");
    if (chargeoffsCount > 0) triggers.push(`${chargeoffsCount} charge-off(s)`);
    if (collectionsCount > 0) triggers.push(`${collectionsCount} collection(s)`);
    if (publicRecordsPresent) triggers.push("public records present");
    if (latePayments24mo >= 2) triggers.push(`${latePayments24mo} late payments in 24 months`);
    if (identityFlagsPresent) triggers.push("identity flags detected");
    if (totalUtilization >= 70) triggers.push(`${totalUtilization}% total utilization`);
    if (highestCardUtilization >= 90) triggers.push(`${highestCardUtilization}% highest card utilization`);
    if (hardInquiries6mo >= 8) triggers.push(`${hardInquiries6mo} hard inquiries in 6 months`);
    if (oldestAccountYears < 1) triggers.push("no accounts older than 1 year");
    explanation = `Profile is in Repair Mode. Hard stop triggered by: ${triggers.join(", ")}. Funding applications are not recommended until these items are resolved.`;
    
    if (collectionsCount > 0 || chargeoffsCount > 0) nextSteps.push("Dispute or negotiate pay-for-delete on all collections and charge-offs.");
    if (latePayments24mo >= 2) nextSteps.push("Establish 12+ months of consecutive on-time payments.");
    if (totalUtilization >= 70) nextSteps.push(`Reduce total utilization from ${totalUtilization}% to below 30%.`);
    if (bankruptcyPresent) nextSteps.push("Allow bankruptcy to age and rebuild with secured credit products.");
    if (identityFlagsPresent) nextSteps.push("Resolve identity theft or fraud alerts with all three bureaus.");
    if (hardInquiries6mo >= 8) nextSteps.push("Stop all new credit applications for at least 6 months.");
    if (oldestAccountYears < 1) nextSteps.push("Keep existing accounts open and active for at least 12 months.");
    nextSteps.push("Monitor credit reports monthly for changes and accuracy.");
  } else if (finalMode === "OPTIMIZATION") {
    const issues: string[] = [];
    if (utilizationFlag) issues.push(`utilization (${totalUtilization}% total, ${highestCardUtilization}% highest card)`);
    if (velocityFlag) issues.push(`inquiry density (${hardInquiries6mo} in 6mo, ${hardInquiries12mo} in 12mo)`);
    if (ageFlag) issues.push(`credit age (${averageAccountAgeYears}yr avg, ${oldestAccountYears}yr oldest)`);
    explanation = `Profile is in Optimization Mode. Not yet funding-ready due to: ${issues.join("; ")}. Address these factors before applying.`;
    
    if (utilizationFlag) nextSteps.push(`Pay down balances to get total utilization under 10% (currently ${totalUtilization}%).`);
    if (velocityFlag) nextSteps.push("Pause all new credit applications for 6+ months to let inquiries age.");
    if (ageFlag) nextSteps.push("Allow accounts to season. Avoid closing older accounts.");
    if (thinFileFlag) nextSteps.push(`Open additional revolving accounts to reach 3+ (currently ${openRevolvingAccounts}).`);
    nextSteps.push("Re-evaluate profile in 60-90 days after optimizations.");
  } else if (finalMode === "FUNDING_READY") {
    explanation = `Profile is Funding Ready. Score: ${creditScore} (${creditTier}). Utilization: ${totalUtilization}%. Estimated funding range: $${fundingRange!.minimum.toLocaleString()} – $${fundingRange!.maximum.toLocaleString()}. This is an estimate based on credit capacity, not a guarantee of approval.`;
    nextSteps.push("Apply strategically — space applications 14+ days apart.");
    nextSteps.push("Target lenders that pull from your strongest bureau first.");
    nextSteps.push("Maintain current utilization and payment habits through the application cycle.");
    nextSteps.push("Do not open any new accounts until your funding cycle is complete.");
    nextSteps.push("Keep documentation ready: bank statements, business verification, ID.");
  } else {
    explanation = `Profile is in Wait & Optimize mode. Score: ${creditScore} (${creditTier}). Profile metrics are not in hard-stop territory, but conditions for Funding Ready are not yet met. Continue building toward optimal positioning.`;
    if (creditScore < 700) nextSteps.push(`Improve credit score from ${creditScore} to 700+ through on-time payments and balance reduction.`);
    if (totalUtilization >= 10) nextSteps.push(`Reduce utilization from ${totalUtilization}% to under 10%.`);
    if (hardInquiries6mo > 2) nextSteps.push(`Let inquiries age — ${hardInquiries6mo} in last 6 months. Target ≤2.`);
    if (derogatoryPresent) nextSteps.push("Address any remaining derogatory items through disputes or settlements.");
    nextSteps.push("Re-evaluate in 30-60 days.");
  }

  return {
    finalMode,
    creditTier,
    fundingEligible,
    denialReasons,
    explanation,
    nextSteps,
    fundingRange,
    flags: {
      utilizationFlag, velocityFlag, ageFlag, thinFileFlag,
      hardStopTriggered: outputMode === "REPAIR_MODE",
    },
    inputs,
  };
}
