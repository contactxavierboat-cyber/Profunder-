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
