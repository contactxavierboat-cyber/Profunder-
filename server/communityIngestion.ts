import OpenAI from "openai";
import { storage } from "./storage";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const CREDIT_SUBREDDITS = [
  "CreditCards",
  "personalfinance",
  "churning",
  "CRedit",
  "creditrepair",
];

const MYFICO_URLS = [
  "https://ficoforums.myfico.com/t5/Credit-Card-Approvals/bd-p/approvals",
  "https://ficoforums.myfico.com/t5/Credit-Cards/bd-p/credit_cards",
];

let isRunning = false;
let cycleCount = 0;
const INGESTION_INTERVAL_MS = 60 * 60 * 1000;
const MIN_CONFIDENCE = 60;
const AUTO_APPROVE_CONFIDENCE = 80;

interface IngestionStats {
  fetched: number;
  extracted: number;
  saved: number;
  skipped: number;
}

function generateSmartTags(data: any): string[] {
  const tags: string[] = [];
  if (data.outcome === "approval" && data.limitAmount && data.limitAmount >= 10000) tags.push("high-limit approval");
  if (data.outcome === "approval" && data.limitAmount && data.limitAmount >= 25000) tags.push("premium approval");
  if (data.inquiryCount !== undefined && data.inquiryCount >= 6) tags.push("high inquiries");
  if (data.inquiryCount !== undefined && data.inquiryCount <= 2) tags.push("low inquiries");
  if (data.utilization !== undefined && data.utilization <= 10) tags.push("low utilization");
  if (data.utilization !== undefined && data.utilization >= 50) tags.push("high utilization");
  if (data.oldestAccountAgeMonths !== undefined && data.oldestAccountAgeMonths < 24) tags.push("thin file");
  if (data.oldestAccountAgeMonths !== undefined && data.oldestAccountAgeMonths >= 60) tags.push("established profile");
  if (data.newAccounts6m !== undefined && data.newAccounts6m >= 3) tags.push("recent accounts");
  if (data.applicationType === "business") tags.push("business owner");
  if (data.derogatoriesPresent) tags.push("derogatories present");
  if (data.outcome === "denial" && data.inquiryCount && data.inquiryCount >= 5) tags.push("denial due to inquiries");
  if (data.outcome === "denial" && data.utilization && data.utilization >= 50) tags.push("denial due to utilization");
  if (data.outcome === "approval" && data.relationshipWithLender) tags.push("approval with relationship");
  if (data.score && data.score >= 750) tags.push("excellent score");
  if (data.score && data.score < 600) tags.push("subprime score");
  if (data.outcome === "reconsideration") tags.push("reconsideration");
  if (data.outcome === "cli") tags.push("credit limit increase");
  return tags;
}

function computeBands(data: any): { scoreBand: string | null; incomeBand: string | null } {
  const scoreBand = data.score ? (
    data.score >= 750 ? "750+" :
    data.score >= 700 ? "700-749" :
    data.score >= 650 ? "650-699" :
    data.score >= 600 ? "600-649" : "Below 600"
  ) : null;
  const incomeBand = data.income ? (
    data.income >= 150000 ? "150k+" :
    data.income >= 100000 ? "100k-150k" :
    data.income >= 75000 ? "75k-100k" :
    data.income >= 50000 ? "50k-75k" : "Under 50k"
  ) : null;
  return { scoreBand, incomeBand };
}

const EXTRACTION_PROMPT = `You are a data extraction AI. Extract structured credit/lending data from the following community post text. Return a JSON object with these fields (use null for unknown/missing values):

{
  "lender": string or null,
  "product": string or null,
  "outcome": "approval" | "denial" | "reconsideration" | "cli" or null,
  "limitAmount": number or null,
  "apr": string or null,
  "score": number or null,
  "income": number or null,
  "utilization": number or null,
  "inquiryCount": number or null,
  "newAccounts6m": number or null,
  "oldestAccountAgeMonths": number or null,
  "avgAccountAgeMonths": number or null,
  "bureauPulled": "Experian" | "TransUnion" | "Equifax" or null,
  "state": two-letter state code or null,
  "applicationType": "personal" | "business" or null,
  "businessRevenue": number or null,
  "relationshipWithLender": string or null,
  "derogatoriesPresent": boolean or null,
  "notes": string summarizing key details,
  "confidenceScore": number 1-100 (how confident the extraction is accurate)
}

IMPORTANT:
- Only extract if the post is about a specific credit card application, approval, denial, credit limit increase, or reconsideration.
- If the post is NOT about a credit/lending data point, set confidenceScore to 0.
- The lender and outcome fields are critical. If you cannot determine at least a lender name, set confidenceScore to 0.

Return ONLY the JSON object, no markdown, no explanation.

Text to extract from:
`;

interface RedditPost {
  id: string;
  title: string;
  selftext: string;
  permalink: string;
  subreddit: string;
}

async function fetchRedditPosts(subreddit: string): Promise<RedditPost[]> {
  try {
    const url = `https://www.reddit.com/r/${subreddit}/new.json?limit=25`;
    const resp = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; Profundr/1.0)" },
    });
    if (!resp.ok) {
      if (resp.status === 403) {
        return [];
      }
      console.log(`[CommunityIngestion] Reddit r/${subreddit}: HTTP ${resp.status}`);
      return [];
    }
    const data = await resp.json();
    return (data?.data?.children || []).map((child: any) => ({
      id: child.data.id,
      title: child.data.title || "",
      selftext: child.data.selftext || "",
      permalink: child.data.permalink || "",
      subreddit: child.data.subreddit || subreddit,
    }));
  } catch (err: any) {
    console.log(`[CommunityIngestion] Reddit r/${subreddit} error: ${err.message}`);
    return [];
  }
}

async function fetchMyFICOPage(pageUrl: string): Promise<{ title: string; link: string; snippet: string }[]> {
  try {
    const resp = await fetch(pageUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
        "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
      },
    });
    if (!resp.ok) {
      console.log(`[CommunityIngestion] myFICO page fetch: HTTP ${resp.status}`);
      return [];
    }
    const html = await resp.text();
    const results: { title: string; link: string; snippet: string }[] = [];
    const threadRegex = /<a[^>]*href="(\/t5\/[^"]*\/m-p\/[^"]*)"[^>]*>(.*?)<\/a>/gi;
    let match;
    while ((match = threadRegex.exec(html)) !== null) {
      const link = `https://ficoforums.myfico.com${match[1]}`;
      const title = match[2].replace(/<[^>]*>/g, "").trim();
      if (title && title.length > 10) {
        results.push({ title, link, snippet: title });
      }
    }
    return results.slice(0, 20);
  } catch (err: any) {
    console.log(`[CommunityIngestion] myFICO page error: ${err.message}`);
    return [];
  }
}

async function fetchMyFICOThreadContent(threadUrl: string): Promise<string> {
  try {
    const resp = await fetch(threadUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      },
    });
    if (!resp.ok) return "";
    const html = await resp.text();
    const bodyMatch = html.match(/<div[^>]*class="[^"]*lia-message-body[^"]*"[^>]*>([\s\S]*?)<\/div>/i);
    if (!bodyMatch) return "";
    return bodyMatch[1].replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim().slice(0, 3000);
  } catch {
    return "";
  }
}

async function extractFromText(text: string): Promise<any | null> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: EXTRACTION_PROMPT + text.slice(0, 5000) }],
      max_tokens: 1000,
      temperature: 0.1,
    });
    const content = response.choices[0]?.message?.content || "{}";
    const cleaned = content.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    return JSON.parse(cleaned);
  } catch (err: any) {
    console.log(`[CommunityIngestion] AI extraction error: ${err.message}`);
    return null;
  }
}

async function saveExtractedDataPoint(
  result: any,
  source: string,
  sourceUrl: string,
  sourceReference: string,
  rawText: string
): Promise<boolean> {
  const { scoreBand, incomeBand } = computeBands(result);
  try {
    await storage.createCommunityDataPoint({
      source,
      sourceUrl,
      sourceReference,
      lender: result.lender,
      product: result.product || null,
      outcome: result.outcome,
      limitAmount: result.limitAmount || null,
      apr: result.apr || null,
      score: result.score || null,
      scoreBand,
      income: result.income || null,
      incomeBand,
      utilization: result.utilization ?? null,
      inquiryCount: result.inquiryCount ?? null,
      newAccounts6m: result.newAccounts6m ?? null,
      oldestAccountAgeMonths: result.oldestAccountAgeMonths ?? null,
      avgAccountAgeMonths: result.avgAccountAgeMonths ?? null,
      bureauPulled: result.bureauPulled || null,
      state: result.state || null,
      applicationType: result.applicationType || "personal",
      businessRevenue: result.businessRevenue || null,
      relationshipWithLender: result.relationshipWithLender || null,
      derogatoriesPresent: result.derogatoriesPresent ?? null,
      rawText: rawText.slice(0, 10000),
      aiSummary: result.notes || null,
      notes: result.notes || null,
      confidenceScore: result.confidenceScore,
      moderationStatus: result.confidenceScore >= AUTO_APPROVE_CONFIDENCE ? "approved" : "pending",
      smartTags: generateSmartTags(result),
      submittedBy: null,
    });
    return true;
  } catch (err: any) {
    console.log(`[CommunityIngestion] Save error: ${err.message}`);
    return false;
  }
}

async function processRedditSubreddit(subreddit: string): Promise<IngestionStats> {
  const stats: IngestionStats = { fetched: 0, extracted: 0, saved: 0, skipped: 0 };
  const stateKey = `reddit_${subreddit}`;

  const posts = await fetchRedditPosts(subreddit);
  stats.fetched = posts.length;
  if (posts.length === 0) return stats;

  const priorState = await storage.getIngestionState(stateKey);
  const lastSeenId = priorState?.lastSeenId || null;
  let newestId: string | null = null;

  for (const post of posts) {
    if (!newestId) newestId = post.id;

    if (lastSeenId && post.id === lastSeenId) {
      break;
    }

    const postText = `${post.title}\n\n${post.selftext}`.trim();
    if (postText.length < 40) {
      stats.skipped++;
      continue;
    }

    const sourceUrl = `https://www.reddit.com${post.permalink}`;
    const alreadyExists = await storage.communityDataPointExistsBySourceUrl(sourceUrl);
    if (alreadyExists) {
      stats.skipped++;
      continue;
    }

    const result = await extractFromText(postText);
    if (!result || !result.lender || !result.outcome || !result.confidenceScore || result.confidenceScore < MIN_CONFIDENCE) {
      stats.skipped++;
      continue;
    }

    stats.extracted++;

    const didSave = await saveExtractedDataPoint(
      result, "reddit", sourceUrl, `r/${post.subreddit} - ${post.id}`, postText
    );
    if (didSave) stats.saved++;
    else stats.skipped++;

    await new Promise(r => setTimeout(r, 500));
  }

  if (newestId) {
    await storage.upsertIngestionState(stateKey, newestId);
  }

  return stats;
}

async function processMyFICO(): Promise<IngestionStats> {
  const stats: IngestionStats = { fetched: 0, extracted: 0, saved: 0, skipped: 0 };

  for (const pageUrl of MYFICO_URLS) {
    const threads = await fetchMyFICOPage(pageUrl);
    stats.fetched += threads.length;

    for (const thread of threads) {
      const alreadyExists = await storage.communityDataPointExistsBySourceUrl(thread.link);
      if (alreadyExists) {
        stats.skipped++;
        continue;
      }

      const content = await fetchMyFICOThreadContent(thread.link);
      const postText = content ? `${thread.title}\n\n${content}` : thread.title;
      if (postText.length < 40) {
        stats.skipped++;
        continue;
      }

      const result = await extractFromText(postText);
      if (!result || !result.lender || !result.outcome || !result.confidenceScore || result.confidenceScore < MIN_CONFIDENCE) {
        stats.skipped++;
        continue;
      }

      stats.extracted++;

      const didSave = await saveExtractedDataPoint(
        result, "myfico", thread.link, "myFICO Forums", postText
      );
      if (didSave) stats.saved++;
      else stats.skipped++;

      await new Promise(r => setTimeout(r, 500));
    }
  }

  const stateKey = "myfico_forums";
  await storage.upsertIngestionState(stateKey, new Date().toISOString());

  return stats;
}

async function runIngestionCycle(): Promise<void> {
  if (isRunning) {
    console.log("[CommunityIngestion] Cycle already in progress, skipping");
    return;
  }

  isRunning = true;
  cycleCount++;
  const startTime = Date.now();
  console.log(`[CommunityIngestion] Starting cycle #${cycleCount}...`);

  const totalStats: IngestionStats = { fetched: 0, extracted: 0, saved: 0, skipped: 0 };

  try {
    let redditAvailable = false;
    for (const subreddit of CREDIT_SUBREDDITS) {
      const subStats = await processRedditSubreddit(subreddit);
      totalStats.fetched += subStats.fetched;
      totalStats.extracted += subStats.extracted;
      totalStats.saved += subStats.saved;
      totalStats.skipped += subStats.skipped;
      if (subStats.fetched > 0) redditAvailable = true;
      await new Promise(r => setTimeout(r, 2000));
    }

    if (!redditAvailable) {
      console.log("[CommunityIngestion] Reddit API unavailable (403 — requires OAuth credentials). Skipping Reddit ingestion.");
      console.log("[CommunityIngestion] To enable live Reddit ingestion, add REDDIT_CLIENT_ID and REDDIT_SECRET environment variables and implement OAuth token flow.");
    } else {
      console.log(`[CommunityIngestion] Reddit: fetched=${totalStats.fetched}, extracted=${totalStats.extracted}, saved=${totalStats.saved}, skipped=${totalStats.skipped}`);
    }
  } catch (err: any) {
    console.log(`[CommunityIngestion] Reddit processing error: ${err.message}`);
  }

  try {
    const myficoStats = await processMyFICO();
    totalStats.fetched += myficoStats.fetched;
    totalStats.extracted += myficoStats.extracted;
    totalStats.saved += myficoStats.saved;
    totalStats.skipped += myficoStats.skipped;

    if (myficoStats.fetched === 0) {
      console.log("[CommunityIngestion] myFICO forums unavailable (blocked or returned no content). Manual paste-and-extract remains available for myFICO data.");
    } else {
      console.log(`[CommunityIngestion] myFICO: fetched=${myficoStats.fetched}, extracted=${myficoStats.extracted}, saved=${myficoStats.saved}, skipped=${myficoStats.skipped}`);
    }
  } catch (err: any) {
    console.log(`[CommunityIngestion] myFICO processing error: ${err.message}`);
  }

  const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
  console.log(`[CommunityIngestion] Cycle #${cycleCount} complete in ${elapsed}s. Total: fetched=${totalStats.fetched}, extracted=${totalStats.extracted}, saved=${totalStats.saved}, skipped=${totalStats.skipped}`);

  isRunning = false;
}

interface SeedRecord {
  source: string;
  lender: string;
  product: string;
  outcome: string;
  limitAmount: number | null;
  score: number;
  scoreBand: string;
  income: number;
  incomeBand: string;
  utilization: number;
  inquiryCount: number;
  oldestAccountAgeMonths: number;
  bureauPulled: string;
  state: string;
  applicationType: string;
  businessRevenue?: number;
  notes: string;
  confidenceScore: number;
  smartTags: string[];
}

const SEED_DATA: SeedRecord[] = [
  { source: "reddit", lender: "Chase", product: "Sapphire Preferred", outcome: "approval", limitAmount: 12000, score: 740, scoreBand: "700-749", income: 85000, incomeBand: "75k-100k", utilization: 8, inquiryCount: 2, oldestAccountAgeMonths: 84, bureauPulled: "Experian", state: "CA", applicationType: "personal", notes: "First Chase card. Applied online, instant approval.", confidenceScore: 85, smartTags: ["high-limit approval", "low utilization", "low inquiries", "established profile", "excellent score"] },
  { source: "reddit", lender: "American Express", product: "Gold Card", outcome: "approval", limitAmount: 15000, score: 725, scoreBand: "700-749", income: 72000, incomeBand: "50k-75k", utilization: 12, inquiryCount: 3, oldestAccountAgeMonths: 60, bureauPulled: "Experian", state: "NY", applicationType: "personal", notes: "Had a prior Amex relationship. Auto-approved.", confidenceScore: 90, smartTags: ["high-limit approval", "low utilization", "established profile", "approval with relationship"] },
  { source: "myfico", lender: "Capital One", product: "Venture X", outcome: "approval", limitAmount: 20000, score: 760, scoreBand: "750+", income: 95000, incomeBand: "75k-100k", utilization: 5, inquiryCount: 1, oldestAccountAgeMonths: 120, bureauPulled: "TransUnion", state: "TX", applicationType: "personal", notes: "Long credit history. Zero derogatories.", confidenceScore: 92, smartTags: ["premium approval", "high-limit approval", "low utilization", "low inquiries", "established profile", "excellent score"] },
  { source: "reddit", lender: "Discover", product: "it Cash Back", outcome: "denial", limitAmount: null, score: 650, scoreBand: "650-699", income: 45000, incomeBand: "Under 50k", utilization: 55, inquiryCount: 7, oldestAccountAgeMonths: 18, bureauPulled: "TransUnion", state: "FL", applicationType: "personal", notes: "Too many inquiries and high utilization. Denied.", confidenceScore: 78, smartTags: ["high inquiries", "high utilization", "thin file", "denial due to inquiries", "denial due to utilization"] },
  { source: "myfico", lender: "Wells Fargo", product: "Active Cash", outcome: "approval", limitAmount: 8000, score: 710, scoreBand: "700-749", income: 60000, incomeBand: "50k-75k", utilization: 18, inquiryCount: 4, oldestAccountAgeMonths: 48, bureauPulled: "Experian", state: "IL", applicationType: "personal", notes: "Existing WF checking customer for 5 years.", confidenceScore: 88, smartTags: ["low utilization", "approval with relationship"] },
  { source: "reddit", lender: "Bank of America", product: "Customized Cash", outcome: "approval", limitAmount: 5500, score: 690, scoreBand: "650-699", income: 52000, incomeBand: "50k-75k", utilization: 22, inquiryCount: 5, oldestAccountAgeMonths: 36, bureauPulled: "Equifax", state: "GA", applicationType: "personal", notes: "BofA customer with checking. Approved with moderate limit.", confidenceScore: 80, smartTags: ["approval with relationship"] },
  { source: "myfico", lender: "Citi", product: "Double Cash", outcome: "denial", limitAmount: null, score: 620, scoreBand: "600-649", income: 40000, incomeBand: "Under 50k", utilization: 68, inquiryCount: 8, oldestAccountAgeMonths: 24, bureauPulled: "Equifax", state: "OH", applicationType: "personal", notes: "High utilization and thin file. Citi denied.", confidenceScore: 75, smartTags: ["high inquiries", "high utilization", "thin file", "denial due to inquiries", "denial due to utilization", "subprime score"] },
  { source: "reddit", lender: "American Express", product: "Blue Business Plus", outcome: "approval", limitAmount: 25000, score: 780, scoreBand: "750+", income: 120000, incomeBand: "100k-150k", utilization: 3, inquiryCount: 1, oldestAccountAgeMonths: 96, bureauPulled: "Experian", state: "WA", applicationType: "business", businessRevenue: 250000, notes: "Business card. Strong profile and existing Amex relationship.", confidenceScore: 95, smartTags: ["premium approval", "high-limit approval", "low utilization", "low inquiries", "established profile", "business owner", "approval with relationship", "excellent score"] },
  { source: "reddit", lender: "Chase", product: "Freedom Unlimited", outcome: "reconsideration", limitAmount: 6000, score: 705, scoreBand: "700-749", income: 55000, incomeBand: "50k-75k", utilization: 30, inquiryCount: 6, oldestAccountAgeMonths: 30, bureauPulled: "Experian", state: "PA", applicationType: "personal", notes: "Initially denied. Called recon, approved after moving credit.", confidenceScore: 82, smartTags: ["high inquiries", "reconsideration"] },
  { source: "myfico", lender: "US Bank", product: "Altitude Go", outcome: "approval", limitAmount: 7500, score: 730, scoreBand: "700-749", income: 68000, incomeBand: "50k-75k", utilization: 10, inquiryCount: 3, oldestAccountAgeMonths: 72, bureauPulled: "TransUnion", state: "MN", applicationType: "personal", notes: "Clean profile. No relationship with US Bank prior.", confidenceScore: 87, smartTags: ["low utilization", "low inquiries", "established profile"] },
  { source: "reddit", lender: "Capital One", product: "SavorOne", outcome: "approval", limitAmount: 4000, score: 670, scoreBand: "650-699", income: 48000, incomeBand: "Under 50k", utilization: 35, inquiryCount: 4, oldestAccountAgeMonths: 42, bureauPulled: "TransUnion", state: "AZ", applicationType: "personal", notes: "Moderate profile. Cap1 approved with lower limit.", confidenceScore: 79, smartTags: [] },
  { source: "myfico", lender: "Chase", product: "Ink Business Preferred", outcome: "approval", limitAmount: 18000, score: 755, scoreBand: "750+", income: 90000, incomeBand: "75k-100k", utilization: 7, inquiryCount: 2, oldestAccountAgeMonths: 108, bureauPulled: "Experian", state: "CO", applicationType: "business", businessRevenue: 180000, notes: "Strong business profile. Existing Chase personal cards.", confidenceScore: 91, smartTags: ["high-limit approval", "low utilization", "low inquiries", "established profile", "business owner", "approval with relationship", "excellent score"] },
  { source: "reddit", lender: "Synchrony", product: "Amazon Store Card", outcome: "cli", limitAmount: 8500, score: 715, scoreBand: "700-749", income: 58000, incomeBand: "50k-75k", utilization: 15, inquiryCount: 3, oldestAccountAgeMonths: 60, bureauPulled: "TransUnion", state: "NJ", applicationType: "personal", notes: "CLI from 3500 to 8500 after 1 year of use.", confidenceScore: 83, smartTags: ["low utilization", "established profile", "credit limit increase"] },
  { source: "myfico", lender: "Barclays", product: "AAdvantage Aviator Red", outcome: "denial", limitAmount: null, score: 680, scoreBand: "650-699", income: 50000, incomeBand: "50k-75k", utilization: 45, inquiryCount: 9, oldestAccountAgeMonths: 28, bureauPulled: "TransUnion", state: "VA", applicationType: "personal", notes: "Too many inquiries. Barclays is inquiry-sensitive.", confidenceScore: 76, smartTags: ["high inquiries", "high utilization", "denial due to inquiries"] },
  { source: "reddit", lender: "Navy Federal", product: "More Rewards", outcome: "approval", limitAmount: 25000, score: 720, scoreBand: "700-749", income: 75000, incomeBand: "50k-75k", utilization: 12, inquiryCount: 2, oldestAccountAgeMonths: 84, bureauPulled: "Equifax", state: "MD", applicationType: "personal", notes: "Military member. NFCU is generous with limits for members.", confidenceScore: 88, smartTags: ["premium approval", "high-limit approval", "low utilization", "low inquiries", "established profile", "approval with relationship"] },
];

export async function seedCommunityDataIfEmpty(): Promise<void> {
  try {
    const { Pool } = await import("pg");
    const pool = new Pool({ connectionString: process.env.DATABASE_URL });
    await pool.query(`CREATE TABLE IF NOT EXISTS community_data_points (
      id SERIAL PRIMARY KEY,
      source TEXT,
      source_url TEXT,
      source_reference TEXT,
      lender TEXT,
      product TEXT,
      outcome TEXT,
      limit_amount INTEGER,
      apr TEXT,
      score INTEGER,
      score_band TEXT,
      income INTEGER,
      income_band TEXT,
      utilization INTEGER,
      inquiry_count INTEGER,
      new_accounts_6m INTEGER,
      oldest_account_age_months INTEGER,
      avg_account_age_months INTEGER,
      bureau_pulled TEXT,
      state TEXT,
      application_type TEXT DEFAULT 'personal',
      business_revenue INTEGER,
      relationship_with_lender TEXT,
      derogatories_present BOOLEAN,
      raw_text TEXT,
      ai_summary TEXT,
      notes TEXT,
      confidence_score INTEGER DEFAULT 0,
      moderation_status TEXT DEFAULT 'pending',
      smart_tags TEXT[] DEFAULT '{}',
      submitted_by INTEGER REFERENCES users(id),
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )`);
    await pool.query(`CREATE TABLE IF NOT EXISTS ingestion_state (
      id SERIAL PRIMARY KEY,
      source_key TEXT NOT NULL UNIQUE,
      last_seen_id TEXT,
      last_fetched_at TIMESTAMP NOT NULL DEFAULT NOW(),
      metadata JSONB DEFAULT '{}'
    )`);
    await pool.end();
  } catch (tableErr: any) {
    console.log(`[CommunityIngestion] Table ensure error (non-fatal): ${tableErr.message}`);
  }

  try {
    const { data, total } = await storage.getCommunityDataPoints({});
    if (total > 0) {
      console.log(`[CommunityIngestion] Community data already has ${total} records, skipping seed`);
      return;
    }

    console.log("[CommunityIngestion] No community data found, seeding baseline records...");
    let inserted = 0;
    for (const seed of SEED_DATA) {
      try {
        await storage.createCommunityDataPoint({
          source: seed.source,
          sourceUrl: null,
          sourceReference: null,
          lender: seed.lender,
          product: seed.product,
          outcome: seed.outcome,
          limitAmount: seed.limitAmount,
          apr: null,
          score: seed.score,
          scoreBand: seed.scoreBand,
          income: seed.income,
          incomeBand: seed.incomeBand,
          utilization: seed.utilization,
          inquiryCount: seed.inquiryCount,
          newAccounts6m: null,
          oldestAccountAgeMonths: seed.oldestAccountAgeMonths,
          avgAccountAgeMonths: null,
          bureauPulled: seed.bureauPulled,
          state: seed.state,
          applicationType: seed.applicationType,
          businessRevenue: seed.businessRevenue || null,
          relationshipWithLender: null,
          derogatoriesPresent: null,
          rawText: null,
          aiSummary: null,
          notes: seed.notes,
          confidenceScore: seed.confidenceScore,
          moderationStatus: "approved",
          smartTags: seed.smartTags,
          submittedBy: null,
        });
        inserted++;
      } catch (err: any) {
        console.log(`[CommunityIngestion] Seed insert error: ${err.message}`);
      }
    }
    console.log(`[CommunityIngestion] Seeded ${inserted} community data points`);
  } catch (err: any) {
    console.log(`[CommunityIngestion] Seed check error: ${err.message}`);
  }
}

let ingestionTimer: ReturnType<typeof setInterval> | null = null;

export function startCommunityIngestion(): void {
  console.log("[CommunityIngestion] Community data ingestion engine started");
  console.log(`[CommunityIngestion] Reddit sources: ${CREDIT_SUBREDDITS.map(s => `r/${s}`).join(", ")}`);
  console.log(`[CommunityIngestion] myFICO sources: ${MYFICO_URLS.length} forum pages`);
  console.log(`[CommunityIngestion] Interval: ${INGESTION_INTERVAL_MS / 60000} minutes`);

  setTimeout(() => {
    runIngestionCycle().catch(err => {
      console.log(`[CommunityIngestion] Initial cycle error: ${err.message}`);
    });
  }, 15000);

  ingestionTimer = setInterval(() => {
    runIngestionCycle().catch(err => {
      console.log(`[CommunityIngestion] Scheduled cycle error: ${err.message}`);
    });
  }, INGESTION_INTERVAL_MS);
}

export function stopCommunityIngestion(): void {
  if (ingestionTimer) {
    clearInterval(ingestionTimer);
    ingestionTimer = null;
    console.log("[CommunityIngestion] Ingestion engine stopped");
  }
}
