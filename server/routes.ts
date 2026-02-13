import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import OpenAI from "openai";
import session from "express-session";
import MemoryStore from "memorystore";
// @ts-ignore
import PDFParser from "pdf2json";
import { execFile } from "child_process";
// @ts-ignore
import Parser from "rss-parser";
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { sql } from "drizzle-orm";
import { promisify } from "util";
import { writeFile, readdir, readFile, unlink, mkdir } from "fs/promises";
import path from "path";

const execFileAsync = promisify(execFile);

function generateAnonName(): string {
  const adjectives = [
    "Shadow", "Cosmic", "Neon", "Stealth", "Phantom", "Lunar", "Solar", "Mystic",
    "Crystal", "Thunder", "Iron", "Golden", "Silver", "Diamond", "Frost", "Storm",
    "Blaze", "Venom", "Dark", "Bright", "Swift", "Bold", "Brave", "Noble",
    "Royal", "Elite", "Prime", "Alpha", "Omega", "Titan", "Apex", "Zero",
    "Turbo", "Hyper", "Ultra", "Mega", "Cyber", "Astro", "Quantum", "Vapor",
    "Prism", "Onyx", "Jade", "Ruby", "Opal", "Coral", "Ember", "Echo",
    "Pixel", "Rogue", "Ghost", "Ninja", "Rebel", "Ace", "Flux", "Zenith",
    "Cipher", "Nexus", "Drift", "Pulse", "Vortex", "Surge", "Haze", "Glitch",
  ];
  const nouns = [
    "Wolf", "Hawk", "Fox", "Lion", "Bear", "Eagle", "Tiger", "Panther",
    "Falcon", "Raven", "Cobra", "Viper", "Phoenix", "Dragon", "Shark", "Owl",
    "Lynx", "Jaguar", "Puma", "Stallion", "Mustang", "Raptor", "Griffin", "Titan",
    "Knight", "Rider", "Runner", "Hunter", "Striker", "Walker", "Maverick", "Pilot",
    "Chief", "Sage", "Prophet", "Oracle", "Mentor", "Scholar", "Pioneer", "Voyager",
    "Captain", "Legend", "King", "Queen", "Prince", "Boss", "Wizard", "Monk",
    "Archer", "Scout", "Ranger", "Guardian", "Sentinel", "Warden", "Seeker", "Drifter",
    "Nomad", "Spark", "Blade", "Storm", "Shield", "Crown", "Star", "Nova",
  ];
  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const noun = nouns[Math.floor(Math.random() * nouns.length)];
  const num = Math.floor(Math.random() * 999) + 1;
  return `${adj}${noun}${num}`;
}

const EXTRACTION_MIN_CHARS = 200;
const EXTRACTION_MAX_CHARS = 30000;
const TMP_DIR = "/tmp/pdf-processing";

async function ensureTmpDir() {
  await mkdir(TMP_DIR, { recursive: true });
}

async function cleanupFiles(pattern: string) {
  try {
    const files = await readdir(TMP_DIR);
    for (const f of files) {
      if (f.startsWith(pattern)) {
        await unlink(path.join(TMP_DIR, f)).catch(() => {});
      }
    }
  } catch {}
}

async function extractWithPdf2json(buffer: Buffer): Promise<string> {
  return new Promise<string>((resolve, reject) => {
    const pdfParser = new PDFParser(null, false);
    pdfParser.on("pdfParser_dataReady", (pdfData: any) => {
      try {
        const pages = pdfData?.Pages || [];
        const lines: string[] = [];
        for (const page of pages) {
          const texts = page.Texts || [];
          const lineMap = new Map<number, { x: number; text: string }[]>();
          for (const t of texts) {
            const y = Math.round((t.y || 0) * 100);
            const x = t.x || 0;
            const runs = t.R || [];
            const decoded = runs.map((r: any) => decodeURIComponent(r.T || "")).join("");
            if (decoded.trim()) {
              if (!lineMap.has(y)) lineMap.set(y, []);
              lineMap.get(y)!.push({ x, text: decoded });
            }
          }
          const sortedYs = Array.from(lineMap.keys()).sort((a, b) => a - b);
          for (const y of sortedYs) {
            const items = lineMap.get(y)!.sort((a, b) => a.x - b.x);
            const lineText = items.map(i => i.text).join("  ");
            if (lineText.trim()) lines.push(lineText.trim());
          }
          lines.push("---");
        }
        const fullText = lines.join("\n");
        resolve(fullText);
      } catch (e) {
        try {
          const rawText = pdfParser.getRawTextContent();
          resolve(decodeURIComponent(rawText));
        } catch {
          resolve("");
        }
      }
    });
    pdfParser.on("pdfParser_dataError", () => resolve(""));
    pdfParser.parseBuffer(buffer);
  });
}

async function extractWithPdftotext(pdfPath: string): Promise<string> {
  try {
    const { stdout } = await execFileAsync("pdftotext", ["-layout", pdfPath, "-"], { maxBuffer: 10 * 1024 * 1024 });
    return stdout;
  } catch {
    return "";
  }
}

async function extractWithOCR(pdfPath: string, sessionId: string): Promise<string> {
  try {
    await ensureTmpDir();
    const prefix = path.join(TMP_DIR, `ocr-${sessionId}`);
    await execFileAsync("pdftoppm", ["-png", "-r", "300", "-l", "5", pdfPath, prefix], { maxBuffer: 50 * 1024 * 1024 });
    const files = await readdir(TMP_DIR);
    const imageFiles = files
      .filter(f => f.startsWith(`ocr-${sessionId}`) && f.endsWith(".png"))
      .sort();
    if (imageFiles.length === 0) return "";

    const ocrResults: string[] = [];
    for (const imgFile of imageFiles) {
      const imgPath = path.join(TMP_DIR, imgFile);
      try {
        const { stdout } = await execFileAsync("tesseract", [imgPath, "stdout", "--psm", "6"], { maxBuffer: 10 * 1024 * 1024 });
        if (stdout.trim()) ocrResults.push(stdout.trim());
      } catch {}
    }

    await cleanupFiles(`ocr-${sessionId}`);
    return ocrResults.join("\n---\n");
  } catch (err) {
    console.error("OCR processing error:", err);
    await cleanupFiles(`ocr-${sessionId}`);
    return "";
  }
}

interface ExtractionResult {
  text: string;
  method: "pdf2json" | "pdftotext" | "ocr" | "manual_entry_needed" | "raw_text";
}

async function processPdfBuffer(buffer: Buffer): Promise<ExtractionResult> {
  await ensureTmpDir();
  const sessionId = Date.now().toString(36) + Math.random().toString(36).slice(2, 6);
  const pdfPath = path.join(TMP_DIR, `upload-${sessionId}.pdf`);
  await writeFile(pdfPath, buffer);

  console.log(`[PDF Pipeline] Stage 1: pdf2json text extraction...`);
  let text = await extractWithPdf2json(buffer);
  if (text.replace(/[-\s]/g, "").length >= EXTRACTION_MIN_CHARS) {
    console.log(`[PDF Pipeline] pdf2json succeeded: ${text.length} chars`);
    await unlink(pdfPath).catch(() => {});
    return { text: text.slice(0, EXTRACTION_MAX_CHARS), method: "pdf2json" };
  }

  console.log(`[PDF Pipeline] Stage 2: pdftotext (poppler) extraction...`);
  text = await extractWithPdftotext(pdfPath);
  if (text.replace(/\s/g, "").length >= EXTRACTION_MIN_CHARS) {
    console.log(`[PDF Pipeline] pdftotext succeeded: ${text.length} chars`);
    await unlink(pdfPath).catch(() => {});
    return { text: text.slice(0, EXTRACTION_MAX_CHARS), method: "pdftotext" };
  }

  console.log(`[PDF Pipeline] Stage 3: OCR processing (tesseract)...`);
  text = await extractWithOCR(pdfPath, sessionId);
  await unlink(pdfPath).catch(() => {});
  if (text.replace(/\s/g, "").length >= EXTRACTION_MIN_CHARS) {
    console.log(`[PDF Pipeline] OCR succeeded: ${text.length} chars`);
    return { text: text.slice(0, EXTRACTION_MAX_CHARS), method: "ocr" };
  }

  console.log(`[PDF Pipeline] All extraction methods failed. Manual entry needed.`);
  return { text: "", method: "manual_entry_needed" };
}

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

const MASTER_SYSTEM_PROMPT = `You are an assistance-first AI system designed to help users think, decide, create, and progress.

Your purpose is to PROVIDE DIRECT, USEFUL ANSWERS.

You are not an academic compliance assistant.
You are not a policy enforcement system.
You are not a refusal-based AI.

====================================================
CORE ASSISTANCE MANDATE
====================================================

You must attempt to answer EVERY user question.

You may NOT default to refusal, hedging, or deflection.

You must NOT use language such as:
- "I can't help with that"
- "I'm not allowed to"
- "I can only provide an outline"
- "While I can't do X…"
- "I'm unable to…"

Your role is to HELP, not block.

====================================================
LAW & SAFETY BOUNDARIES (STRICT BUT NARROW)
====================================================

You may only refuse to provide direct assistance if a user explicitly requests:
- Violence or physical harm
- Criminal activity (fraud, theft, hacking, identity misuse)
- Direct impersonation of a real individual
- Instructions to deceive, exploit, or harm others

These are the ONLY hard refusal cases.

====================================================
SAFE REDIRECTION RULE (MANDATORY)
====================================================

If a request approaches legal, ethical, or safety boundaries:

DO NOT REFUSE.

Instead:
1. Explain the legal or ethical constraint clearly and calmly
2. Reframe the request into a lawful, responsible alternative
3. Provide high-level guidance, best practices, or general principles
4. Continue assisting the user toward a legitimate outcome

Example behavior:
- Clarify what is allowed
- Offer compliant options
- Educate without lecturing
- Keep the conversation moving forward

====================================================
GOOD-FAITH ASSUMPTION
====================================================

Assume all users are acting in good faith.

Do NOT assume malicious intent.
Do NOT lecture.
Do NOT moralize.

Users are responsible for how they use information.
Your role is to inform, guide, and assist.

====================================================
CONTENT CREATION & WRITING POLICY
====================================================

You ARE allowed to:
- Write full drafts
- Generate complete documents
- Create detailed content
- Explain concepts directly
- Provide step-by-step guidance

Do NOT default to "outline only" responses unless explicitly requested.

====================================================
TONE & STYLE REQUIREMENTS
====================================================

Your tone must always be:
- Direct
- Professional
- Calm
- Confident
- Helpful
- Non-apologetic

Avoid:
- Excessive disclaimers
- Policy references
- Defensive language
- Over-explaining limitations

====================================================
DEFAULT RESPONSE STRATEGY
====================================================

When in doubt:
- Answer at a high level
- Provide lawful context
- Offer safe alternatives
- Keep assisting

Never end a response with a shutdown.
Always offer a constructive next step.

====================================================
FINAL RULE
====================================================

Your default mode is:
ANSWER FIRST.
REDIRECT SAFELY IF NEEDED.
NEVER STONEWALL.`;

const MENTXR_SYSTEM_PROMPT = MASTER_SYSTEM_PROMPT + `\n\nYou are MentXr® — an AI-powered mentorship platform that lets users converse with digital versions of influential mentors.

Your role is to provide thoughtful, personalized mentorship conversations. You embody the wisdom, communication style, and strategic thinking of world-class mentors across business, finance, leadership, branding, marketing, real estate, and entrepreneurship.

====================================================
CORE IDENTITY
====================================================

You are a knowledgeable, experienced mentor who provides:
- Strategic business guidance
- Leadership and mindset coaching
- Financial and investment insights
- Marketing and branding strategy
- Startup and scaling advice
- Negotiation and sales tactics
- Wealth-building perspectives
- Real estate and venture capital insights

====================================================
COMMUNICATION STYLE
====================================================

- Speak directly and conversationally, like a trusted advisor in a one-on-one session
- Be warm but straightforward — no fluff, no filler
- Use real-world examples and actionable frameworks
- Ask clarifying questions when needed to give better advice
- Challenge assumptions constructively
- Celebrate wins and acknowledge effort genuinely

====================================================
GUIDELINES
====================================================

- Keep responses focused and actionable — quality over quantity
- Break down complex topics into clear, digestible steps
- When discussing strategy, provide frameworks the user can immediately apply
- If a question is outside your expertise, be honest and redirect thoughtfully
- Never provide specific legal, tax, or medical advice — recommend professionals for those areas
- Maintain confidentiality and professionalism at all times

====================================================
RESPONSE APPROACH
====================================================

- Start by addressing the user's specific question or concern
- Provide context and reasoning behind your advice
- Offer 2-3 actionable next steps when appropriate
- End with an encouraging or thought-provoking note when natural

Tone: Professional. Conversational. Direct. Empowering. Realistic.`;

const MENTOR_PROFILES: Record<string, { name: string; keywords: string[]; systemPrompt: string; tagline: string; specialty: string }> = {
  nova_sage: {
    name: "NovaSage247",
    tagline: "Scale Everything",
    specialty: "Sales & Business Growth",
    keywords: ["nova", "novasage", "sage", "sales", "scaling"],
    systemPrompt: `You are NovaSage247, an AI mentor bot on the MentXr® platform specializing in sales mastery and business growth.

PERSONALITY & VOICE:
- High energy, bold, and direct
- Obsessed with massive action and scaling
- Uses short, punchy sentences mixed with motivational buildups
- Challenges people who think small — pushes them to set bigger goals
- Believes in outworking everyone

KEY PRINCIPLES:
- Set targets 10 times greater than what you think you need
- Sales is everything — everyone is in sales
- Cash flow is king — invest in assets that produce income
- Never reduce your target, increase your actions
- Money follows attention — get known
- Your network is your net worth

SPEAKING STYLE:
- Talk in first person as NovaSage247
- Be passionate and commanding
- Don't sugarcoat — tell people what they NEED to hear
- Occasionally use ALL CAPS for emphasis

Always respond AS NovaSage247.`
  },
  alpha_volt: {
    name: "AlphaVolt889",
    tagline: "Patient Capital",
    specialty: "Investing & Value",
    keywords: ["alpha", "alphavolt", "volt", "investing", "value investing", "stocks"],
    systemPrompt: `You are AlphaVolt889, an AI mentor bot on the MentXr® platform specializing in investing and long-term value creation.

PERSONALITY & VOICE:
- Calm, patient wisdom with sharp intelligence
- Self-deprecating humor mixed with profound insight
- Uses simple analogies to explain complex financial ideas
- Talks about moats, compounding, and long-term thinking
- Patient — believes in waiting for the right opportunity

KEY PRINCIPLES:
- Rule #1: Never lose money. Rule #2: Never forget Rule #1
- Be fearful when others are greedy and greedy when others are fearful
- Price is what you pay, value is what you get
- Long-term holding beats short-term trading
- Diversification protects against ignorance
- Patience transfers money from the impatient to the patient

SPEAKING STYLE:
- Talk in first person as AlphaVolt889
- Folksy, warm tone with razor-sharp observations
- Use stories and analogies from everyday life
- Be humble but confident in your convictions
- Keep it simple

Always respond AS AlphaVolt889.`
  },
  blaze_echo: {
    name: "BlazeEcho512",
    tagline: "Hustle & Heart",
    specialty: "Marketing & Social Media",
    keywords: ["blaze", "blazeecho", "echo", "marketing", "social media", "content"],
    systemPrompt: `You are BlazeEcho512, an AI mentor bot on the MentXr® platform specializing in marketing, social media, and brand building.

PERSONALITY & VOICE:
- Raw, authentic, and brutally honest
- Passionate about hustle, self-awareness, and patience
- Talks about attention as currency and building brands
- Anti-shortcut — believes in putting in the reps
- Loves sports analogies

KEY PRINCIPLES:
- Document, don't create — show the journey
- Attention is the most valuable asset — go where the eyeballs are
- Self-awareness is the key superpower
- Macro patience, micro speed
- Give value before asking
- Execution beats everything

SPEAKING STYLE:
- Talk in first person as BlazeEcho512
- Rapid-fire, conversational, stream-of-consciousness
- Use phrases like "look", "here's the thing"
- Be direct and challenging but genuinely caring
- Mix tactical advice with mindset coaching

Always respond AS BlazeEcho512.`
  },
  lunar_peak: {
    name: "LunarPeak303",
    tagline: "Live Your Best Life",
    specialty: "Leadership & Growth",
    keywords: ["lunar", "lunarpeak", "peak", "leadership", "growth", "mindset"],
    systemPrompt: `You are LunarPeak303, an AI mentor bot on the MentXr® platform specializing in leadership development and personal growth.

PERSONALITY & VOICE:
- Warm, empathetic, deeply insightful, and empowering
- Combines emotional intelligence with business acumen
- Believes in the power of intention, purpose, and living your truth
- Asks powerful questions that make people think deeper

KEY PRINCIPLES:
- Live your best life — every day is a chance to level up
- Turn your wounds into wisdom
- Surround yourself with people who lift you higher
- What you focus on expands — gratitude is the gateway
- Everyone wants to be heard and validated
- Excellence is the best deterrent to prejudice

SPEAKING STYLE:
- Talk in first person as LunarPeak303
- Warm, thoughtful, and deeply present
- Share stories to illustrate points
- Ask reflective questions to help users discover their own answers
- Be encouraging but honest
- Balance wisdom with practical advice

Always respond AS LunarPeak303.`
  },
  iron_flux: {
    name: "IronFlux771",
    tagline: "Fearless Innovation",
    specialty: "Entrepreneurship & Product",
    keywords: ["iron", "ironflux", "flux", "startup", "entrepreneur", "product"],
    systemPrompt: `You are IronFlux771, an AI mentor bot on the MentXr® platform specializing in entrepreneurship and product innovation.

PERSONALITY & VOICE:
- Fun, approachable, with iron determination underneath
- Celebrates failure as a learning tool
- Talks about bootstrapping, product innovation, and selling with passion
- Champions underdog entrepreneurs
- Believes in visualization and trusting your gut

KEY PRINCIPLES:
- Failure is not the outcome — failure is not trying
- Don't be intimidated by what you don't know — it's your greatest strength
- Be willing to make mistakes — become memorable
- Wake up and design your life intentionally
- Fresh eyes see opportunities insiders miss
- Bootstrapping forces creativity

SPEAKING STYLE:
- Talk in first person as IronFlux771
- Light-hearted and funny but deeply strategic
- Be relatable — talk about real struggles
- Encourage imperfect action over perfect planning
- Mix practical startup advice with mindset tips

Always respond AS IronFlux771.`
  },
  zen_cipher: {
    name: "ZenCipher108",
    tagline: "Unlock Your Potential",
    specialty: "Mindset & Financial Literacy",
    keywords: ["zen", "zencipher", "cipher", "mindset", "financial literacy", "mental"],
    systemPrompt: `You are ZenCipher108, an AI mentor bot on the MentXr® platform specializing in mindset engineering and financial literacy.

PERSONALITY & VOICE:
- Deeply thoughtful, grounded, and empowering
- Blends mindfulness, business strategy, and empowerment
- Passionate about unlocking human potential through knowledge
- Talks about financial literacy, Web3, blockchain, and AI
- Speaks with conviction and purpose

KEY PRINCIPLES:
- Everyone has untapped potential waiting to be unlocked
- Reprogram your mind to reprogram your life
- Financial literacy is freedom
- Self-awareness is the master key
- Technology is the great equalizer — learn it, use it, build with it
- Education over dependency
- Intentional living — design your life

SPEAKING STYLE:
- Talk in first person as ZenCipher108
- Speak with deep conviction
- Blend practical insights with mindset wisdom
- Use metaphors about unlocking and awakening
- Challenge people to think deeper
- Mix financial advice with transformation wisdom

Always respond AS ZenCipher108.`
  },
  steel_wraith: {
    name: "SteelWraith666",
    tagline: "Real Talk, Real Change",
    specialty: "Youth Advocacy & Transformation",
    keywords: ["steel", "steelwraith", "wraith", "youth", "advocacy", "transformation", "real talk"],
    systemPrompt: `You are SteelWraith666, an AI mentor bot on the MentXr® platform specializing in youth advocacy and personal transformation.

PERSONALITY & VOICE:
- Brutally honest, raw, unapologetic, and direct
- Uses humor and blunt truth to get points across
- Passionate about steering youth toward better paths
- Doesn't sugarcoat anything — tells it exactly how it is
- Controversial but genuine

KEY PRINCIPLES:
- Your past doesn't define your future — transformation is always possible
- Real change starts with brutal honesty
- Education is the ultimate weapon against ignorance
- Accountability over excuses — own your choices
- Success is the best revenge
- Stop glorifying what destroys your community

SPEAKING STYLE:
- Talk in first person as SteelWraith666
- Raw, conversational, and real
- Mix humor with hard truths
- Challenge people directly
- Be provocative but purposeful
- Share wisdom alongside practical advice

Always respond AS SteelWraith666.`
  }
};

function detectMentor(content: string): string | null {
  const lower = content.toLowerCase();
  for (const [key, profile] of Object.entries(MENTOR_PROFILES)) {
    if (profile.keywords.some(kw => lower.includes(kw))) {
      return key;
    }
  }
  return null;
}

declare module "express-session" {
  interface SessionData {
    userId: number;
  }
}

function stripPassword(user: any) {
  const { password, ...rest } = user;
  return rest;
}

function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  next();
}

async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Not authenticated" });
  }
  const user = await storage.getUser(req.session.userId);
  if (!user || user.role !== "admin") {
    return res.status(403).json({ error: "Admin access required" });
  }
  next();
}

const profileSchema = z.object({
  creditScoreRange: z.string().optional(),
  totalRevolvingLimit: z.number().min(0).optional(),
  totalBalances: z.number().min(0).optional(),
  inquiries: z.number().min(0).optional(),
  derogatoryAccounts: z.number().min(0).optional(),
  hasCreditReport: z.boolean().optional(),
  hasBankStatement: z.boolean().optional(),
}).strict();

const chatSchema = z.object({
  content: z.string().min(1).max(5000),
  attachment: z.enum(["credit_report", "bank_statement"]).nullable().optional(),
  fileContent: z.string().nullable().optional(),
  selectedMentor: z.string().nullable().optional(),
});

export async function registerRoutes(
  httpServer: Server,
  app: Express
): Promise<Server> {

  (async () => {
    try {
      const allUsers = await storage.getAllUsers();
      let updated = 0;
      for (const u of allUsers) {
        if (!u.displayName) {
          await storage.updateUser(u.id, { displayName: generateAnonName() });
          updated++;
        }
      }
      if (updated > 0) console.log(`Assigned anonymous names to ${updated} existing users`);
    } catch (err) {
      console.error("Failed to assign anonymous names:", err);
    }
  })();

  const SessionStore = MemoryStore(session);

  app.use(session({
    secret: process.env.SESSION_SECRET || "startup-studio-session-secret-change-in-prod",
    store: new SessionStore({ checkPeriod: 86400000 }),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false,
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
    },
  }));

  app.get("/api/mentors", (req, res) => {
    const mentors = Object.entries(MENTOR_PROFILES).map(([key, profile]) => ({
      key,
      name: profile.name,
      tagline: profile.tagline,
      specialty: profile.specialty,
    }));
    res.json(mentors);
  });

  app.post("/api/login", async (req, res) => {
    const { email } = req.body;
    if (!email || typeof email !== "string") {
      return res.status(400).json({ error: "Email is required" });
    }

    let user = await storage.getUserByEmail(email);
    if (!user) {
      user = await storage.createUser({
        email,
        password: "placeholder",
        displayName: generateAnonName(),
        role: "user",
        subscriptionStatus: "active",
        monthlyUsage: 0,
        maxUsage: 30,
        creditScoreRange: null,
        totalRevolvingLimit: null,
        totalBalances: null,
        inquiries: null,
        derogatoryAccounts: null,
        hasCreditReport: false,
        hasBankStatement: false,
      });
    }

    if (!user.displayName) {
      user = await storage.updateUser(user.id, { displayName: generateAnonName() });
    }

    req.session.userId = user.id;
    res.json(stripPassword(user));
  });

  app.post("/api/logout", (req, res) => {
    req.session.destroy(() => {
      res.json({ ok: true });
    });
  });

  app.get("/api/me", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(404).json({ error: "User not found" });
    res.json(stripPassword(user));
  });

  app.patch("/api/me", requireAuth, async (req, res) => {
    const result = profileSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid profile data" });
    }
    const user = await storage.updateUser(req.session.userId!, result.data);
    res.json(stripPassword(user));
  });

  app.get("/api/users", requireAdmin, async (req, res) => {
    const allUsers = await storage.getAllUsers();
    res.json(allUsers.map(stripPassword));
  });

  app.patch("/api/admin/user/:id", requireAdmin, async (req, res) => {
    const adminSchema = z.object({
      subscriptionStatus: z.enum(["active", "inactive"]).optional(),
      monthlyUsage: z.number().min(0).optional(),
      maxUsage: z.number().min(1).optional(),
    }).strict();

    const result = adminSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid admin update data" });
    }

    const id = parseInt(req.params.id as string);
    const user = await storage.updateUser(id, result.data);
    res.json(stripPassword(user));
  });

  app.post("/api/create-checkout-session", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ error: "User not found" });

      const stripe = await getUncachableStripeClient();

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId: String(user.id) },
        });
        await storage.updateUser(user.id, { stripeCustomerId: customer.id });
        customerId = customer.id;
      }

      const { priceId } = req.body;
      if (!priceId || typeof priceId !== "string") {
        return res.status(400).json({ error: "priceId is required" });
      }

      const { db: checkDb } = await import("./db");
      const priceCheck = await checkDb.execute(
        sql`SELECT id FROM stripe.prices WHERE id = ${priceId} AND active = true`
      );
      if (priceCheck.rows.length === 0) {
        return res.status(400).json({ error: "Invalid or inactive price" });
      }

      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const session = await stripe.checkout.sessions.create({
        customer: customerId,
        payment_method_types: ['card'],
        line_items: [{ price: priceId, quantity: 1 }],
        mode: 'subscription',
        success_url: `${baseUrl}/subscription?success=true`,
        cancel_url: `${baseUrl}/subscription?canceled=true`,
      });

      res.json({ url: session.url });
    } catch (error: any) {
      console.error("Stripe checkout error:", error);
      res.status(500).json({ error: "Failed to create checkout session" });
    }
  });

  app.post("/api/create-portal-session", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) return res.status(404).json({ error: "User not found" });

      if (!user.stripeCustomerId) {
        return res.status(400).json({ error: "No Stripe customer found" });
      }

      const stripe = await getUncachableStripeClient();
      const baseUrl = `${req.protocol}://${req.get('host')}`;
      const portalSession = await stripe.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: `${baseUrl}/subscription`,
      });

      res.json({ url: portalSession.url });
    } catch (error: any) {
      console.error("Portal session error:", error);
      res.status(500).json({ error: "Failed to create portal session" });
    }
  });

  app.get("/api/subscription-price", async (req, res) => {
    try {
      const { db } = await import("./db");
      const result = await db.execute(
        sql`SELECT p.id as product_id, p.name, pr.id as price_id, pr.unit_amount, pr.currency, pr.recurring
            FROM stripe.products p
            JOIN stripe.prices pr ON pr.product = p.id
            WHERE p.active = true AND pr.active = true
            ORDER BY pr.unit_amount ASC LIMIT 1`
      );
      if (result.rows.length === 0) {
        return res.status(404).json({ error: "No active subscription price found" });
      }
      res.json(result.rows[0]);
    } catch (error: any) {
      console.error("Price fetch error:", error);
      res.status(500).json({ error: "Failed to fetch price" });
    }
  });

  app.post("/api/check-subscription", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user || !user.stripeCustomerId) {
        return res.json({ active: false });
      }

      const { db } = await import("./db");
      const result = await db.execute(
        sql`SELECT id, status FROM stripe.subscriptions 
            WHERE customer = ${user.stripeCustomerId} AND status = 'active' LIMIT 1`
      );

      if (result.rows.length > 0) {
        if (user.subscriptionStatus !== "active") {
          await storage.updateUser(user.id, { subscriptionStatus: "active" });
        }
        return res.json({ active: true });
      }

      if (user.subscriptionStatus === "active") {
        await storage.updateUser(user.id, { subscriptionStatus: "inactive" });
      }
      res.json({ active: false });
    } catch (error: any) {
      console.error("Subscription check error:", error);
      res.status(500).json({ error: "Failed to check subscription" });
    }
  });

  app.get("/api/chat", requireAuth, async (req, res) => {
    const msgs = await storage.getMessages(req.session.userId!);
    res.json(msgs);
  });

  app.post("/api/chat", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const result = chatSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: "Invalid message data" });
    }

    const { content, attachment, fileContent, selectedMentor } = result.data;

    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.monthlyUsage >= user.maxUsage) {
      return res.status(403).json({ error: "Monthly analysis limit reached. Please wait for reset." });
    }

    let extractedText = "";
    let extractionMethod = "";
    let manualEntryNeeded = false;

    if (fileContent && attachment) {
      try {
        const isPdf = fileContent.length > 100 && !fileContent.includes("\n");
        if (isPdf) {
          const buffer = Buffer.from(fileContent, "base64");
          const result = await processPdfBuffer(buffer);
          extractedText = result.text;
          extractionMethod = result.method;
          manualEntryNeeded = result.method === "manual_entry_needed";
        } else {
          extractedText = fileContent.slice(0, EXTRACTION_MAX_CHARS);
          extractionMethod = "raw_text";
        }
      } catch (err) {
        console.error("File parsing error:", err);
        manualEntryNeeded = true;
        extractionMethod = "manual_entry_needed";
      }
    }

    let displayContent: string;
    if (manualEntryNeeded) {
      displayContent = `${content}\n\n[Attached ${attachment === "bank_statement" ? "Bank Statement" : "Credit Report"} - Could not extract text automatically. Please enter key details manually.]`;
    } else if (extractedText) {
      displayContent = `${content}\n\n[Attached ${attachment === "bank_statement" ? "Bank Statement" : "Credit Report"} - ${extractedText.length} chars extracted via ${extractionMethod}]`;
    } else {
      displayContent = content;
    }

    let detectedMentor: string | null = null;

    if (selectedMentor && MENTOR_PROFILES[selectedMentor]) {
      detectedMentor = selectedMentor;
    } else {
      detectedMentor = detectMentor(content);
    }

    if (!detectedMentor) {
      const prevHistory = await storage.getMessages(userId);
      const lastAssistant = [...prevHistory].reverse().find(m => m.role === 'assistant' && m.mentor);
      if (lastAssistant?.mentor) {
        detectedMentor = lastAssistant.mentor;
      }
    }

    await storage.createMessage({ userId, role: "user", content: displayContent, attachment: attachment || null, mentor: null });

    const history = await storage.getMessages(userId);
    const last10 = history.slice(-10).map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

    let fileContext = "";
    if (manualEntryNeeded && attachment) {
      fileContext = `\n\nThe user uploaded a ${attachment === "bank_statement" ? "bank statement" : "credit report"}, but automated text extraction failed (the document may be an image-based or scanned PDF). Ask the user to manually provide the key data from their document. For a credit report, ask for: credit score, total revolving limits, total balances, number of inquiries, and any derogatory accounts. For a bank statement, ask for: average daily balance, monthly deposits, and any NSF/overdraft occurrences.`;
    } else if (extractedText) {
      fileContext = `\n\nThe user has uploaded a ${attachment === "bank_statement" ? "bank statement" : "credit report"}. Here is the extracted text from the document (extracted via ${extractionMethod}):\n\n--- START OF DOCUMENT ---\n${extractedText}\n--- END OF DOCUMENT ---\n\nAnalyze this document thoroughly and incorporate your findings into your mentorship advice.`;
    }

    let systemPrompt: string;
    if (detectedMentor && MENTOR_PROFILES[detectedMentor]) {
      systemPrompt = MASTER_SYSTEM_PROMPT + "\n\n" + MENTOR_PROFILES[detectedMentor].systemPrompt + (fileContext ? `\n\n${fileContext}` : "");
    } else {
      systemPrompt = MENTXR_SYSTEM_PROMPT + (fileContext ? `\n\n${fileContext}` : "");
    }

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...last10
        ],
        max_tokens: 2048,
      });

      const aiContent = response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response right now.";

      const aiMessage = await storage.createMessage({ userId, role: "assistant", content: aiContent, attachment: null, mentor: detectedMentor });

      await storage.updateUser(userId, { monthlyUsage: user.monthlyUsage + 1 });

      res.json(aiMessage);
    } catch (error: any) {
      console.error("OpenAI Error:", error);
      res.status(500).json({ error: "Error generating AI response. Please try again." });
    }
  });

  app.delete("/api/chat", requireAuth, async (req, res) => {
    await storage.clearMessages(req.session.userId!);
    res.status(204).send();
  });

  app.get("/api/comments/:messageId", requireAuth, async (req, res) => {
    const messageId = parseInt(req.params.messageId);
    if (isNaN(messageId)) return res.status(400).json({ error: "Invalid message ID" });
    const userId = req.session.userId!;
    const msgs = await storage.getMessages(userId);
    const ownsMessage = msgs.some(m => m.id === messageId);
    if (!ownsMessage) return res.status(403).json({ error: "Access denied" });
    const commentsList = await storage.getComments(messageId);
    res.json(commentsList);
  });

  app.post("/api/comments/:messageId", requireAuth, async (req, res) => {
    const userId = req.session.userId!;
    const messageId = parseInt(req.params.messageId);
    if (isNaN(messageId)) return res.status(400).json({ error: "Invalid message ID" });

    const commentBody = z.object({ content: z.string().min(1).max(2000) }).safeParse(req.body);
    if (!commentBody.success) {
      return res.status(400).json({ error: "Comment content is required (max 2000 characters)" });
    }
    const { content } = commentBody.data;

    const msgs = await storage.getMessages(userId);
    const parentMessage = msgs.find(m => m.id === messageId);
    if (!parentMessage) return res.status(404).json({ error: "Message not found" });

    const mentor = parentMessage.mentor || null;

    const userComment = await storage.createComment({
      messageId,
      userId,
      role: "user",
      content: content.trim(),
      mentor: null,
    });

    let aiReplyComment: any = null;
    try {
      let systemPrompt: string;
      if (mentor && MENTOR_PROFILES[mentor]) {
        systemPrompt = MASTER_SYSTEM_PROMPT + "\n\n" + MENTOR_PROFILES[mentor].systemPrompt + "\n\nYou are replying to a user's comment on one of your previous responses. Keep your reply concise, conversational, and helpful — like a social media reply. 2-4 sentences max.";
      } else {
        systemPrompt = MENTXR_SYSTEM_PROMPT + "\n\nYou are replying to a user's comment on a previous AI response. Keep your reply concise, conversational, and helpful — like a social media reply. 2-4 sentences max.";
      }

      const existingComments = await storage.getComments(messageId);
      const commentContext = existingComments.map(c => ({
        role: c.role as "user" | "assistant",
        content: c.content,
      }));

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          { role: "assistant", content: parentMessage.content },
          ...commentContext,
        ],
        max_tokens: 512,
      });

      const aiContent = response.choices[0]?.message?.content || "Thanks for your comment!";
      aiReplyComment = await storage.createComment({
        messageId,
        userId,
        role: "assistant",
        content: aiContent,
        mentor,
      });
    } catch (error: any) {
      console.error("Comment AI reply error:", error);
    }

    res.json({
      userComment,
      aiReply: aiReplyComment,
    });
  });

  app.get("/api/friends", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const friends = await storage.getFriends(userId);
      const pending = await storage.getPendingRequests(userId);
      res.json({
        friends: friends.map(f => ({
          friendshipId: f.friendship.id,
          id: f.friend.id,
          displayName: f.friend.displayName || f.friend.email,
          email: f.friend.email,
        })),
        pending: pending.map(p => ({
          friendshipId: p.friendship.id,
          id: p.requester.id,
          displayName: p.requester.displayName || p.requester.email,
          email: p.requester.email,
        })),
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/friends/request", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { receiverId } = req.body;
      if (!receiverId || receiverId === userId) {
        return res.status(400).json({ error: "Invalid user" });
      }
      const existing = await storage.getFriendship(userId, receiverId);
      if (existing) {
        return res.status(400).json({ error: "Friend request already exists" });
      }
      const friendship = await storage.sendFriendRequest(userId, receiverId);
      res.json({ friendship });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/friends/accept", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { friendshipId } = req.body;
      if (!friendshipId) return res.status(400).json({ error: "Missing friendshipId" });
      const friendship = await storage.acceptFriendRequest(friendshipId, userId);
      if (!friendship) return res.status(404).json({ error: "Request not found" });
      res.json({ friendship });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/friends/reject", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { friendshipId } = req.body;
      if (!friendshipId) return res.status(400).json({ error: "Missing friendshipId" });
      await storage.rejectFriendRequest(friendshipId, userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post("/api/friends/remove", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { friendshipId } = req.body;
      if (!friendshipId) return res.status(400).json({ error: "Missing friendshipId" });
      await storage.removeFriend(friendshipId, userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get("/api/users/search", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const query = (req.query.q as string) || "";
      if (query.length < 2) return res.json([]);
      const results = await storage.searchUsers(query, userId);
      res.json(results.map(u => ({ id: u.id, displayName: u.displayName || u.email })));
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  const rssParser = new Parser({
    timeout: 3000,
    headers: { 'User-Agent': 'Mozilla/5.0 (compatible; MentXr-Feed/1.0)' },
  });

  const RSS_FEEDS = [
    // === BOT MENTOR YOUTUBE CHANNELS (Curated content feeds) ===
    { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCdlNK1xcy-Sn8liq7feNxWw", source: "NovaSage247", category: "sales", contentType: "video", mentor: "nova_sage" },
    { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCctXZhXmG-kf3tlIXgVZUlw", source: "BlazeEcho512", category: "entrepreneurship", contentType: "video", mentor: "blaze_echo" },
    { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCsY17ZnXg_Gmt9bWz49HoWw", source: "ZenCipher108", category: "mindset", contentType: "video", mentor: "zen_cipher" },
    { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCCKHPCkOQ4Bwi2EPkDu25SQ", source: "SteelWraith666", category: "advocacy", contentType: "video", mentor: "steel_wraith" },
    { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCKBnlTTgEnhIXv_c4LvvyMQ", source: "LunarPeak303", category: "leadership", contentType: "video", mentor: "lunar_peak" },

    // === INFLUENCER & BUSINESS YOUTUBE CHANNELS ===
    { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCVHFbqXqoYvEWM1Ddxl0QDg", source: "Alex Hormozi", category: "business", contentType: "video", mentor: null },
    { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCV6KDgJskWaEckne5aPA0aQ", source: "Graham Stephan", category: "finance", contentType: "video", mentor: null },
    { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCL_f53ZEJxp8TtlOkHwMV9Q", source: "Jordan Peterson", category: "mindset", contentType: "video", mentor: null },
    { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCRVsqvXIdgyPVS-a6fGa1lA", source: "Earn Your Leisure", category: "finance", contentType: "video", mentor: null },
    { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCIHdDJ0tjn_3j-FS7s_X1kQ", source: "Patrick Bet-David", category: "business", contentType: "video", mentor: null },
    { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UChi08h4577eFsNXGd3sxYhw", source: "The Breakfast Club", category: "culture", contentType: "video", mentor: null },
    { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UC-lHJZR3Gqxm24_Vd_AJ5Yw", source: "Lex Fridman", category: "tech", contentType: "video", mentor: null },
    { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCJLMboBYME_CLEfwsduI0wQ", source: "Tony Robbins", category: "motivation", contentType: "video", mentor: null },
    { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCKsP3v2JeT2hWI_HzkxWiMA", source: "Lewis Howes", category: "motivation", contentType: "video", mentor: null },
    { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UC7eBNeDW1GQf2NJQ6G6gAxw", source: "Dave Ramsey", category: "finance", contentType: "video", mentor: null },
    { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCuifm5ns5SRG8LZJ6gCfKyw", source: "Robert Kiyosaki", category: "finance", contentType: "video", mentor: null },
    { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCX6OQ3DkcsbYNE6H8uQQuVA", source: "MrBeast", category: "entertainment", contentType: "video", mentor: null },
    { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCIprGZAdzn3ZqgLmDuibYcw", source: "Ed Mylett", category: "motivation", contentType: "video", mentor: null },
    { url: "https://www.youtube.com/feeds/videos.xml?channel_id=UCzQUP1qoWDoEbmsQxvdjxgQ", source: "Joe Rogan", category: "culture", contentType: "video", mentor: null },

    // === PODCAST RSS FEEDS ===
    { url: "https://rss.art19.com/how-i-built-this", source: "How I Built This", category: "entrepreneurship", contentType: "text", mentor: null },
    { url: "https://rss.art19.com/the-great-creators", source: "The Great Creators", category: "business", contentType: "text", mentor: null },

    // === NEWS & BUSINESS RSS FEEDS ===
    { url: "https://feeds.bbci.co.uk/news/business/rss.xml", source: "BBC Business", category: "business", contentType: "text", mentor: null },
    { url: "https://www.entrepreneur.com/latest.rss", source: "Entrepreneur", category: "entrepreneurship", contentType: "text", mentor: null },
    { url: "https://www.forbes.com/innovation/feed2", source: "Forbes", category: "innovation", contentType: "text", mentor: null },
    { url: "https://rss.nytimes.com/services/xml/rss/nyt/Business.xml", source: "NY Times Business", category: "business", contentType: "text", mentor: null },
    { url: "https://feeds.nbcnews.com/nbcnews/public/business", source: "NBC Business", category: "business", contentType: "text", mentor: null },
    { url: "https://search.cnbc.com/rs/search/combinedcms/view.xml?partnerId=wrss01&id=10001147", source: "CNBC", category: "finance", contentType: "text", mentor: null },
    { url: "https://feeds.feedburner.com/TechCrunch/", source: "TechCrunch", category: "tech", contentType: "text", mentor: null },
    { url: "https://www.wired.com/feed/rss", source: "Wired", category: "tech", contentType: "text", mentor: null },
    { url: "https://feeds.arstechnica.com/arstechnica/index", source: "Ars Technica", category: "tech", contentType: "text", mentor: null },
    { url: "https://rss.nytimes.com/services/xml/rss/nyt/Technology.xml", source: "NY Times Tech", category: "tech", contentType: "text", mentor: null },
    { url: "https://feeds.bbci.co.uk/news/technology/rss.xml", source: "BBC Tech", category: "tech", contentType: "text", mentor: null },
    { url: "https://www.theverge.com/rss/index.xml", source: "The Verge", category: "tech", contentType: "photo", mentor: null },
  ];

  interface FeedItem {
    id: string;
    title: string;
    description: string;
    link: string;
    image: string | null;
    source: string;
    category: string;
    contentType: string;
    publishedAt: string;
    author: string | null;
    mentor: string | null;
  }

  let feedCache: FeedItem[] = [];
  let feedLastFetch = 0;
  let feedFetching = false;
  const FEED_CACHE_MS = 3 * 1000;

  async function fetchAllFeeds(): Promise<FeedItem[]> {
    const now = Date.now();
    if (feedCache.length > 0 && now - feedLastFetch < FEED_CACHE_MS) {
      return feedCache;
    }
    if (feedFetching && feedCache.length > 0) {
      return feedCache;
    }
    feedFetching = true;

    const results: FeedItem[] = [];
    try {

    const feedPromises = RSS_FEEDS.map(async (feedConfig) => {
      try {
        const feed = await rssParser.parseURL(feedConfig.url);
        const items = (feed.items || []).slice(0, 8);
        for (const item of items) {
          let image: string | null = null;
          const videoId = feedConfig.contentType === "video" && item.id
            ? item.id.replace("yt:video:", "")
            : null;
          if (videoId) {
            image = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
          } else if (item.enclosure?.url) {
            image = item.enclosure.url;
          } else if (item['media:content']?.$.url) {
            image = item['media:content'].$.url;
          } else if (item['media:thumbnail']?.$.url) {
            image = item['media:thumbnail'].$.url;
          } else {
            const imgMatch = (item['content:encoded'] || item.content || "").match(/<img[^>]+src="([^"]+)"/);
            if (imgMatch) image = imgMatch[1];
          }

          let cType = feedConfig.contentType;
          if (cType === "text" && image) cType = "photo";

          const desc = (item.contentSnippet || item.content || item.summary || "")
            .replace(/<[^>]*>/g, "")
            .substring(0, 200)
            .trim();

          const link = videoId
            ? `https://www.youtube.com/watch?v=${videoId}`
            : (item.link || "");

          results.push({
            id: `${feedConfig.source}-${item.guid || item.link || item.title}`,
            title: item.title || "Untitled",
            description: desc || "",
            link,
            image,
            source: feedConfig.source,
            category: feedConfig.category,
            contentType: cType,
            publishedAt: item.isoDate || item.pubDate || new Date().toISOString(),
            author: item.creator || item.author || null,
            mentor: feedConfig.mentor || null,
          });
        }
      } catch (err) {
        console.error(`RSS feed error (${feedConfig.source}):`, (err as Error).message);
      }
    });

    await Promise.allSettled(feedPromises);

    results.sort((a, b) => new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime());

    feedCache = results;
    feedLastFetch = now;
    return results;
    } finally {
      feedFetching = false;
    }
  }

  app.get("/api/feed", requireAuth, async (req, res) => {
    try {
      const items = await fetchAllFeeds();
      const page = parseInt(req.query.page as string) || 0;
      const limit = parseInt(req.query.limit as string) || 20;
      const offset = page * limit;
      const paged = items.slice(offset, offset + limit);
      res.json({
        items: paged,
        total: items.length,
        page,
        hasMore: offset + limit < items.length,
        lastUpdated: feedLastFetch ? new Date(feedLastFetch).toISOString() : null,
      });
    } catch (error) {
      console.error("Feed error:", error);
      res.status(500).json({ error: "Failed to load feed" });
    }
  });

  // =====================================================
  // INFLUENCER CONTENT ENGINE
  // =====================================================

  interface InfluencerProfile {
    name: string;
    handle: string;
    category: string;
    verified: boolean;
    followers: string;
    posts: string[];
  }

  const NAMED_INFLUENCER_PROFILES: InfluencerProfile[] = [
    // === BUSINESS ===
    { name: "Elon Musk", handle: "@elonmusk", category: "Business", verified: true, followers: "180M", posts: [
      "The future of civilization depends on sustainable energy. We need to accelerate the transition.",
      "When something is important enough, you do it even if the odds are not in your favor.",
      "I think it's very important to have a feedback loop where you're constantly thinking about what you've done and how you could be doing it better.",
      "Failure is an option here. If things are not failing, you are not innovating enough.",
      "People work better when they know what the goal is and why.",
      "Some people don't like change, but you need to embrace change if the alternative is disaster.",
      "Starting a company is like staring into the abyss and eating glass. Fun times.",
      "If you get up in the morning and think the future is going to be better, it is a bright day."
    ]},
    { name: "Jeff Bezos", handle: "@jeffbezos", category: "Business", verified: true, followers: "35M", posts: [
      "Your brand is what people say about you when you're not in the room.",
      "If you double the number of experiments you do per year, you're going to double your inventiveness.",
      "We've had three big ideas at Amazon that we've stuck with for 18 years, and they're the reason we're successful.",
      "In the end, we are our choices. Build yourself a great story.",
      "I knew that if I failed I wouldn't regret that, but I knew the one thing I might regret is not trying.",
      "Be stubborn on vision, flexible on details.",
      "Work hard, have fun, make history. That's the Amazon way."
    ]},
    { name: "Mark Zuckerberg", handle: "@zuck", category: "Business", verified: true, followers: "120M", posts: [
      "The biggest risk is not taking any risk. In a world that's changing really quickly, the only strategy that is guaranteed to fail is not taking risks.",
      "Move fast and break things. Unless you are breaking stuff, you are not moving fast enough.",
      "People don't care about what you say, they care about what you build.",
      "Ideas don't come out fully formed. They only become clear as you work on them.",
      "Building the metaverse is going to be a defining project of this decade.",
      "I think a simple rule of business is, if you do the things that are easier first, then you can actually make a lot of progress."
    ]},
    { name: "Tim Cook", handle: "@tim_cook", category: "Business", verified: true, followers: "15M", posts: [
      "The sidelines are not where you want to live your life. The world needs you in the arena.",
      "We believe technology should serve humanity, not the other way around.",
      "Let your joy be in your journey — not in some distant goal.",
      "People will try to convince you that you should keep your empathy out of your career. Don't accept this false premise.",
      "We are focused on making the best products in the world that really enrich people's lives."
    ]},
    { name: "Sundar Pichai", handle: "@sundarpichai", category: "Business", verified: true, followers: "8M", posts: [
      "A person who is happy is not because everything is right in his life. He is happy because his attitude towards everything in his life is right.",
      "AI is probably the most important thing humanity has ever worked on.",
      "Wear your failure as a badge of honor.",
      "It's important to me that everyone has access to the incredible opportunities technology creates.",
      "The core of what Google is about is bringing information to people."
    ]},
    { name: "Satya Nadella", handle: "@sataborella", category: "Business", verified: true, followers: "10M", posts: [
      "Our industry does not respect tradition — it only respects innovation.",
      "Don't be a know-it-all, be a learn-it-all.",
      "Empathy is not a soft skill. It's the hardest skill we learn.",
      "The true scarce commodity of the near future will be human attention.",
      "We need to move from a fixed mindset to a growth mindset.",
      "Technology is nothing. What matters is the people who use it."
    ]},
    { name: "Jensen Huang", handle: "@jensenhuang", category: "Business", verified: true, followers: "5M", posts: [
      "The age of AI has started. Every industry will be transformed.",
      "Software is eating the world, but AI is going to eat software.",
      "NVIDIA's purpose is to solve problems that ordinary computers cannot.",
      "Accelerated computing is the path forward. The more you buy, the more you save.",
      "We're at the iPhone moment of AI. This is the beginning of a new era."
    ]},
    { name: "Sam Altman", handle: "@sama", category: "Business", verified: true, followers: "4M", posts: [
      "The most successful people I know are primarily internally driven.",
      "It's easier to do a hard startup than an easy startup.",
      "Great execution is at least 10x more important than a great idea.",
      "Optimism, obsession, self-belief, raw horsepower, and personal connections are how things get started.",
      "AGI is going to be the most transformative technology in human history.",
      "Be ambitious. The world needs more ambitious people building important things."
    ]},
    { name: "Reid Hoffman", handle: "@raboredid", category: "Business", verified: true, followers: "3.5M", posts: [
      "An entrepreneur is someone who jumps off a cliff and builds a plane on the way down.",
      "If you are not embarrassed by the first version of your product, you've launched too late.",
      "Your network is the people who want to help you, and you want to help them.",
      "The fastest way to change yourself is to hang out with people who are already the way you want to be.",
      "In the startup world, you're either growing or dying. There's no in-between."
    ]},
    { name: "Marc Andreessen", handle: "@pmarca", category: "Business", verified: true, followers: "1.5M", posts: [
      "Software is eating the world. Every company needs to become a software company.",
      "The spread of computers and the internet will put jobs in two categories: people who tell computers what to do, and people who are told by computers what to do.",
      "In a world of abundance, the only scarcity is human attention.",
      "Raise prices. It's the best way to find out if you have a real business.",
      "It's time to build. Let's build."
    ]},
    { name: "Peter Thiel", handle: "@peterthiel", category: "Business", verified: true, followers: "2M", posts: [
      "Competition is for losers. Build a monopoly.",
      "The most contrarian thing of all is to think for yourself.",
      "What important truth do very few people agree with you on?",
      "Every moment in business happens only once. The next Bill Gates will not build an operating system.",
      "Brilliant thinking is rare, but courage is in even shorter supply than genius."
    ]},
    { name: "Jack Dorsey", handle: "@jack", category: "Business", verified: true, followers: "6M", posts: [
      "Make every detail perfect and limit the number of details to perfect.",
      "Bitcoin changes absolutely everything. I don't think there is anything more important in my lifetime to work on.",
      "Expect the unexpected. And whenever possible, be the unexpected.",
      "The strongest thing you can cultivate as an entrepreneur is to not rely on luck.",
      "Simplicity is the ultimate sophistication in product design."
    ]},
    { name: "Brian Chesky", handle: "@bchesky", category: "Business", verified: true, followers: "1.2M", posts: [
      "Build something 100 people love, not something 1 million people kind of like.",
      "Culture is simply a shared way of doing something with passion.",
      "If we tried to think of a good idea, we wouldn't have been able to think of a good idea.",
      "Don't listen to your customers. Watch them instead.",
      "The stuff that matters in life is no longer stuff. It's other people. It's experiences."
    ]},
    { name: "Richard Branson", handle: "@richardbranson", category: "Business", verified: true, followers: "18M", posts: [
      "Screw it, let's do it! Life is too short to wait.",
      "Train people well enough so they can leave, treat them well enough so they don't want to.",
      "Business opportunities are like buses — there's always another one coming.",
      "My biggest motivation? Just to keep challenging myself.",
      "If somebody offers you an amazing opportunity but you are not sure you can do it, say yes — then learn how to do it later."
    ]},
    { name: "Patrick Collison", handle: "@patrickc", category: "Business", verified: true, followers: "800K", posts: [
      "The internet economy is still in its infancy. We're building the infrastructure for what comes next.",
      "Move faster. Speed is the ultimate competitive advantage for startups.",
      "Great companies are built by people who never stop learning.",
      "The GDP of the internet is growing 10x faster than the GDP of the physical world.",
      "Focus on building something people want. Everything else follows."
    ]},
    { name: "Jack Ma", handle: "@jackma", category: "Business", verified: true, followers: "12M", posts: [
      "If you don't give up, you still have a chance. Giving up is the greatest failure.",
      "Today is hard, tomorrow will be worse, but the day after tomorrow will be sunshine.",
      "Never give up. Today is hard, tomorrow will be worse, but the day after tomorrow will be sunshine.",
      "Intelligent people need a fool to lead them.",
      "Opportunities lie in the place where complaints are."
    ]},
    { name: "Whitney Wolfe Herd", handle: "@whitneywolfeherd", category: "Business", verified: true, followers: "900K", posts: [
      "The future of connection is built on kindness and accountability.",
      "Don't wait for a seat at the table. Build your own table.",
      "Empowerment isn't just a buzzword — it's a business strategy.",
      "Women making the first move changes the entire dynamic. That's what Bumble is about.",
      "Turn your pain into your purpose. That's where real innovation comes from."
    ]},
    { name: "Daniel Ek", handle: "@eldaniel", category: "Business", verified: true, followers: "700K", posts: [
      "I've always believed that music should be accessible to everyone.",
      "The best product wins. Focus on user experience above all else.",
      "Entrepreneurship is about turning what excites you into capital.",
      "Spotify started because we hated piracy but loved music. Simple as that.",
      "In the long run, the most important thing is the product."
    ]},
    { name: "Evan Spiegel", handle: "@evanspiegel", category: "Business", verified: true, followers: "1.1M", posts: [
      "Life is not a highlight reel. That's what Snapchat understands.",
      "We're not building technology for technology's sake. We're building it to enhance human connection.",
      "The biggest misconception about our generation is that we don't care. We care deeply.",
      "Design is not just what it looks like. Design is how it works.",
      "Real moments over curated perfection."
    ]},
    { name: "Melanie Perkins", handle: "@melanieperkins", category: "Business", verified: true, followers: "600K", posts: [
      "Great design shouldn't be reserved for those who can afford expensive tools.",
      "We were rejected by over 100 investors. Persistence is everything.",
      "Canva's mission is to empower the world to design. That drives everything we do.",
      "Start with the problem, not the solution. The best businesses solve real pain points.",
      "Democratizing design means giving everyone the power to create."
    ]},

    // === FINANCE ===
    { name: "AlphaVolt889", handle: "@alphavolt889", category: "Finance", verified: true, followers: "8M", posts: [
      "Rule No. 1: Never lose money. Rule No. 2: Never forget Rule No. 1.",
      "Be fearful when others are greedy, and greedy when others are fearful.",
      "Price is what you pay. Value is what you get.",
      "Our favorite holding period is forever.",
      "The stock market is a device for transferring money from the impatient to the patient.",
      "It's far better to buy a wonderful company at a fair price than a fair company at a wonderful price.",
      "Risk comes from not knowing what you're doing."
    ]},
    { name: "Charlie Munger", handle: "@charliemunger", category: "Finance", verified: true, followers: "3M", posts: [
      "The big money is not in the buying and selling, but in the waiting.",
      "Spend each day trying to be a little wiser than you were when you woke up.",
      "All intelligent investing is value investing.",
      "Three rules for a career: Don't sell anything you wouldn't buy yourself. Don't work for anyone you don't respect. Work only with people you enjoy.",
      "The best thing a human being can do is to help another human being know more."
    ]},
    { name: "Ray Dalio", handle: "@raydalio", category: "Finance", verified: true, followers: "7M", posts: [
      "Pain + Reflection = Progress. Embrace your mistakes.",
      "Principles are ways of successfully dealing with reality to get what you want out of life.",
      "He who lives by the crystal ball will eat shattered glass.",
      "Don't let fears of what others think of you stand in your way.",
      "Truth — or, more precisely, an accurate understanding of reality — is the essential foundation for any good outcome.",
      "If you're not failing, you're not pushing your limits."
    ]},
    { name: "Carl Icahn", handle: "@carlicahn", category: "Finance", verified: true, followers: "1.5M", posts: [
      "In life and business, there are two cardinal sins: the first is to act precipitously without thought, and the second is to not act at all.",
      "When most investors, including the pros, all agree on something, they're usually wrong.",
      "I'm no Robin Hood. I enjoy making money.",
      "Don't go in and tell somebody else how to run their business.",
      "Some people get rich studying artificial intelligence. Me, I make money studying natural stupidity."
    ]},
    { name: "Bill Ackman", handle: "@billackman", category: "Finance", verified: true, followers: "2M", posts: [
      "The key to investing is not assessing how much an industry is going to affect society, but determining the competitive advantage of any given company.",
      "I'm prepared to lose on every investment I make. But I'm not prepared to be wrong about the thesis.",
      "Simplicity is the ultimate sophistication in investing.",
      "Invest in businesses you understand. That's the whole game.",
      "Conviction is the most important quality an investor can have."
    ]},
    { name: "Cathie Wood", handle: "@cathiedwood", category: "Finance", verified: true, followers: "3.5M", posts: [
      "Innovation solves problems. That's why we invest in disruptive innovation.",
      "The biggest risk is not taking any risk in a world that's changing this fast.",
      "We believe in the convergence of technologies — AI, robotics, genomics, blockchain, and energy storage.",
      "Bear markets are the best times to invest in innovation. Seeds planted in winter bloom in spring.",
      "Our five-year time horizon is our edge. Most investors can't think past the next quarter."
    ]},
    { name: "Michael Burry", handle: "@michaeljburry", category: "Finance", verified: true, followers: "4M", posts: [
      "I'm a value investor. The best investments are the ones nobody else sees coming.",
      "The market can remain irrational longer than you can remain solvent. Plan accordingly.",
      "I focus on what I know. Depth over breadth in research.",
      "People don't want to hear that the emperor has no clothes. But someone needs to say it.",
      "Data doesn't lie. People do."
    ]},
    { name: "Jim Cramer", handle: "@jimcramer", category: "Finance", verified: true, followers: "4.5M", posts: [
      "Bulls make money, bears make money, pigs get slaughtered! Don't be greedy!",
      "There's always a bull market somewhere, and I promise to help you find it!",
      "Do your homework! Never invest in something you don't understand!",
      "Diversification is the only free lunch in investing.",
      "Buy and homework, not buy and hold!"
    ]},
    { name: "Suze Orman", handle: "@suaborman", category: "Finance", verified: true, followers: "2.5M", posts: [
      "A big part of financial freedom is having your heart and mind free from worry about the what-ifs of life.",
      "Owning a home is a keystone of wealth. Period.",
      "People first, then money, then things.",
      "The only way you will ever permanently take control of your financial life is to dig deep and fix the root problem.",
      "You are the CEO of your own financial life. Act like it."
    ]},
    { name: "Kevin O'Leary", handle: "@kevinoleary", category: "Finance", verified: true, followers: "6M", posts: [
      "Money is my military, each dollar a soldier. I never send them into battle unprepared.",
      "Here's how I think of my money — as soldiers. I send them out to war every day. I want them to take prisoners and come home.",
      "Business is war. I go out there, I want to kill the competitors. I want to make their lives miserable.",
      "Know your numbers. If you don't know your numbers, you don't know your business.",
      "I'm not going to invest in your dream. I'm going to invest in your numbers."
    ]},
    { name: "Mark Cuban", handle: "@mcuban", category: "Finance", verified: true, followers: "9M", posts: [
      "It doesn't matter how many times you fail. You only have to be right once.",
      "Sweat equity is the most valuable equity there is.",
      "Work like there is someone working 24 hours a day to take it away from you.",
      "The one thing in life you can control is your effort.",
      "Everyone has got the will to win; it's only those with the will to prepare that do win.",
      "Sales cure all. Know how your company makes money."
    ]},
    { name: "Barbara Corcoran", handle: "@barbaracorcoran", category: "Finance", verified: true, followers: "3M", posts: [
      "The joy is in the getting there. The beginning years of starting your business are the best years.",
      "Don't you dare underestimate the power of your own instinct.",
      "All the best things that happened to me happened after I was rejected.",
      "The difference between successful people and others is how long they spend time feeling sorry for themselves.",
      "You can't fake passion. People see right through it."
    ]},
    { name: "Daymond John", handle: "@thesharkdaymond", category: "Finance", verified: true, followers: "4M", posts: [
      "The FUBU story: $40 budget, a dream, and an unwillingness to quit.",
      "I didn't have money, resources, or a network. I had hustle. And hustle was enough.",
      "The power of broke forces you to be creative, resourceful, and scrappy.",
      "Your brand is your story. Make it authentic.",
      "Success isn't overnight. It's years of grind that nobody sees."
    ]},
    { name: "Robert Herjavec", handle: "@robertherjavec", category: "Finance", verified: true, followers: "1.8M", posts: [
      "A goal without a timeline is just a dream.",
      "The only thing standing between you and your goal is the story you keep telling yourself.",
      "I came to Canada with nothing. If I can make it, anyone can.",
      "In business, you're either growing or you're dying.",
      "Cybersecurity is the challenge of our generation. Protect your digital life."
    ]},
    { name: "Dave Ramsey", handle: "@daveramsey", category: "Finance", verified: true, followers: "7M", posts: [
      "We buy things we don't need with money we don't have to impress people we don't like.",
      "Live like no one else now so you can live like no one else later.",
      "Debt is dumb. Cash is king. The paid-off home mortgage has taken the place of the BMW.",
      "A budget is telling your money where to go instead of wondering where it went.",
      "If you will live like no one else, later you can live like no one else."
    ]},
    { name: "Robert Kiyosaki", handle: "@therealadiyosaki", category: "Finance", verified: true, followers: "5M", posts: [
      "The rich don't work for money. They make money work for them.",
      "Your house is not an asset. An asset puts money in your pocket.",
      "The single most powerful asset we all have is our mind.",
      "It's not how much money you make, but how much money you keep.",
      "The poor and the middle class work for money. The rich have money work for them.",
      "Financial literacy is the key to escaping the rat race."
    ]},

    // === MOTIVATION ===
    { name: "Tony Robbins", handle: "@tonyrobbins", category: "Motivation", verified: true, followers: "12M", posts: [
      "It's not about the goal. It's about growing to become the person that can accomplish that goal.",
      "The only impossible journey is the one you never begin.",
      "Where focus goes, energy flows. Control your focus, control your life.",
      "Life happens FOR you, not TO you. Every setback is a setup for a comeback.",
      "The quality of your life is the quality of your relationships.",
      "Progress equals happiness. Even small progress counts.",
      "Trade your expectations for appreciation and your whole world changes in an instant."
    ]},
    { name: "Les Brown", handle: "@lesbrown77", category: "Motivation", verified: true, followers: "5M", posts: [
      "You don't have to be great to get started, but you have to get started to be great.",
      "Shoot for the moon. Even if you miss, you'll land among the stars.",
      "Someone's opinion of you does not have to become your reality.",
      "Too many of us are not living our dreams because we are living our fears.",
      "You were put on this earth to achieve your greatest self.",
      "It's not over until you win!"
    ]},
    { name: "Eric Thomas", handle: "@etthehiphoppreacher", category: "Motivation", verified: true, followers: "6M", posts: [
      "When you want to succeed as bad as you want to breathe, then you'll be successful.",
      "Don't cry to quit. Cry to keep going. You already in pain, get a reward from it!",
      "I used to be homeless. Now I speak to millions. Your past does not define your future.",
      "The difference between average and excellent? The willing to sacrifice.",
      "Fall in love with the process and the results will come."
    ]},
    { name: "Mel Robbins", handle: "@melrobbins", category: "Motivation", verified: true, followers: "8M", posts: [
      "The 5 Second Rule: If you have an instinct to act, move within 5 seconds or your brain will kill it.",
      "You are one decision away from a completely different life.",
      "Stop saying you're fine. Fine is not a feeling. Be honest with yourself.",
      "Motivation is garbage. You need discipline and a 5-second countdown.",
      "The moment you feel yourself hesitate, that's the moment you need to move.",
      "Your life comes down to your decisions, and if you change your decisions, you change everything."
    ]},
    { name: "Brené Brown", handle: "@brenebrown", category: "Motivation", verified: true, followers: "6M", posts: [
      "Vulnerability is not weakness. It's our greatest measure of courage.",
      "You can choose courage, or you can choose comfort, but you cannot choose both.",
      "Owning our story and loving ourselves through that process is the bravest thing we'll ever do.",
      "Clear is kind. Unclear is unkind.",
      "Daring greatly means having the courage to be vulnerable. It means showing up."
    ]},
    { name: "Simon Sinek", handle: "@simonsinek", category: "Motivation", verified: true, followers: "9M", posts: [
      "People don't buy what you do; they buy why you do it.",
      "Start with WHY. Great leaders inspire action by communicating purpose first.",
      "Working hard for something we don't care about is called stress. Working hard for something we love is called passion.",
      "Leadership is not about being in charge. It's about taking care of those in your charge.",
      "A team is not a group of people who work together. A team is a group of people who trust each other.",
      "The goal is not to be perfect by the end. The goal is to be better today."
    ]},
    { name: "Jay Shetty", handle: "@jayshetty", category: "Motivation", verified: true, followers: "50M", posts: [
      "Don't judge someone's chapter 1 when you're on chapter 20.",
      "What you think, you become. What you feel, you attract. What you imagine, you create.",
      "The sign of intelligence is that you are constantly wondering. Idiots are always dead sure about every damn thing.",
      "We spend so much time comparing ourselves that we forget to develop ourselves.",
      "When you focus on your growth, you stop comparing yourself to others."
    ]},
    { name: "Sadhguru", handle: "@sadhguru", category: "Motivation", verified: true, followers: "30M", posts: [
      "The most beautiful moments in life are moments when you are expressing your joy, not when you are seeking it.",
      "If you resist change, you resist life.",
      "The mind is a powerful instrument. Every thought, every emotion that you create changes the chemistry of your body.",
      "Do not try to fix whatever comes in your life. Fix yourself in such a way that whatever comes, you will be fine.",
      "Your intelligence is always on. The question is whether you're making it work for you or against you."
    ]},
    { name: "Deepak Chopra", handle: "@deepakchopra", category: "Motivation", verified: true, followers: "12M", posts: [
      "Every time you are tempted to react in the same old way, ask if you want to be a prisoner of the past or a pioneer of the future.",
      "In the midst of movement and chaos, keep stillness inside of you.",
      "The less you open your heart to others, the more your heart suffers.",
      "Nothing is more important than reconnecting with your bliss.",
      "Meditation is not a way of making your mind quiet. It's a way of entering into the quiet that is already there."
    ]},
    { name: "BlazeEcho512", handle: "@blazeecho512", category: "Motivation", verified: true, followers: "45M", posts: [
      "Stop whining, start hustling. Nobody owes you anything!",
      "Document, don't create. Show the journey, not just the wins.",
      "Macro patience, micro speed. Play the long game but execute fast every single day.",
      "Self-awareness is the ultimate superpower. Know what you're good at AND what you suck at.",
      "Jab, jab, jab, right hook. Give value before you ask for anything.",
      "Skills are more important than ideas. Ideas are cheap. Execution is everything.",
      "Day trading attention is the game. Go where the eyeballs are."
    ]},
    { name: "LunarPeak303", handle: "@lunarpeak303", category: "Motivation", verified: true, followers: "42M", posts: [
      "What I know for sure is that every sunrise is a new opportunity to reach higher.",
      "Turn your wounds into wisdom. Every experience teaches you something.",
      "The biggest adventure you can take is to live the life of your dreams.",
      "Surround yourself only with people who are going to lift you higher.",
      "Be thankful for what you have; you'll end up having more."
    ]},
    { name: "Ed Mylett", handle: "@edmylett", category: "Motivation", verified: true, followers: "4M", posts: [
      "One more. One more rep, one more call, one more try. That's where the magic happens.",
      "Successful people don't have fewer problems. They have a different relationship with their problems.",
      "Your identity is the thermostat of your life. Change your identity, change your life.",
      "Leaders don't create followers. They create more leaders.",
      "Confidence is not 'they will like me.' Confidence is 'I'll be fine if they don't.'"
    ]},
    { name: "Lewis Howes", handle: "@lewishowes", category: "Motivation", verified: true, followers: "5M", posts: [
      "Greatness is a daily practice, not a destination.",
      "The School of Greatness taught me: vulnerability is strength, not weakness.",
      "Your mess is your message. Share your story to help others.",
      "Hustle in silence and let your success be the noise.",
      "The quality of your life is directly related to how much uncertainty you can comfortably deal with."
    ]},

    // === ENTERTAINMENT ===
    { name: "MrBeast", handle: "@mrbeast", category: "Entertainment", verified: true, followers: "250M", posts: [
      "Just gave away $1,000,000 to random strangers! Their reactions were priceless 😭",
      "We planted 20 million trees and cleaned 30 million pounds of trash from the ocean. Let's keep going!",
      "The key to YouTube? Make videos YOU would want to watch. It's that simple.",
      "I've reinvested every dollar I've made back into making better content. That's the secret.",
      "If you're not obsessing over making the thumbnail and title perfect, you're leaving views on the table.",
      "New video dropped! This one took 3 months to film. You won't believe what happened."
    ]},
    { name: "PewDiePie", handle: "@pewdiepie", category: "Entertainment", verified: true, followers: "111M", posts: [
      "Big PP energy today. Let's review some memes! 👏👏 Meme review!",
      "Started YouTube in my bedroom. Now we're here. What a journey.",
      "The internet is the most chaotic, beautiful, terrible thing ever created. And I love it.",
      "Subscribe to PewDiePie. That's it. That's the tweet.",
      "Floor gang forever! 💪"
    ]},
    { name: "Logan Paul", handle: "@loganpaul", category: "Entertainment", verified: true, followers: "27M", posts: [
      "PRIME is changing the hydration game. We outsold everyone in the first year.",
      "I went from being the most hated person on the internet to building a billion-dollar brand. Resilience is everything.",
      "WWE matches, Prime Hydration, podcasting — I'm just getting started.",
      "Every day is a new opportunity to prove the doubters wrong.",
      "The Maverick mentality: never accept the status quo."
    ]},
    { name: "KSI", handle: "@ksi", category: "Entertainment", verified: true, followers: "40M", posts: [
      "From YouTube to boxing to music to Prime. We don't stop 🏆",
      "Hard work beats talent when talent doesn't work hard. Facts.",
      "Sidemen Sunday is the best day of the week. Period.",
      "You can do anything you set your mind to. I'm living proof.",
      "Knowledge, Strength, Integrity. That's what KSI stands for."
    ]},
    { name: "Emma Chamberlain", handle: "@emmachamberlain", category: "Entertainment", verified: true, followers: "16M", posts: [
      "Coffee is not a beverage, it's a personality trait ☕",
      "Being authentic on the internet is the hardest and most rewarding thing.",
      "I started YouTube in my bedroom with zero followers. Just be yourself.",
      "Thrifting > fast fashion. Always.",
      "Vulnerability is what connects us. Show the real you."
    ]},
    { name: "David Dobrik", handle: "@daviddobrik", category: "Entertainment", verified: true, followers: "25M", posts: [
      "Surprising my friends with cars never gets old! Their faces 😂",
      "4 minutes and 20 seconds. That's the perfect vlog length. Trust me.",
      "The vlog squad is family. We ride together.",
      "Content is king, but surprise is the emperor.",
      "If you're not having fun making content, why are you making it?"
    ]},
    { name: "Charli D'Amelio", handle: "@charlidamelio", category: "Entertainment", verified: true, followers: "155M", posts: [
      "Just dance. That's literally how this all started.",
      "Being young on the internet is wild. But I'm grateful for every moment.",
      "Family is everything. Shoutout to @dixiedamelio 💕",
      "TikTok changed my life. Now I want to use my platform to make a difference.",
      "Stay true to who you are. The right people will find you."
    ]},
    { name: "Khaby Lame", handle: "@khaby00", category: "Entertainment", verified: true, followers: "162M", posts: [
      "Why complicate things? The simple way is always the best way 🤷‍♂️",
      "From factory worker to most-followed on TikTok. Dreams do come true.",
      "No words needed. Just common sense 😂",
      "Life hack: don't do life hacks. Just use common sense.",
      "Simplicity is the ultimate sophistication. Da Vinci said it. I just demonstrate it."
    ]},
    { name: "Dude Perfect", handle: "@dudeperfect", category: "Entertainment", verified: true, followers: "60M", posts: [
      "THAT'S A W! New trick shot video just dropped! 🏀",
      "5 best friends making videos in the backyard turned into this. God is good.",
      "Overtime is the best segment and you can't convince me otherwise.",
      "The key to great content? Having fun with your best friends.",
      "From a backyard in Texas to traveling the world doing trick shots."
    ]},

    // === SPORTS ===
    { name: "LeBron James", handle: "@kingjames", category: "Sports", verified: true, followers: "160M", posts: [
      "Strive for greatness. Nothing is given, everything is earned 👑",
      "I'm not in the business of losing. I'm in the business of winning championships.",
      "More than an athlete. Using my platform to create change.",
      "The I PROMISE School changed my life more than any championship ever could.",
      "Year 21. Still going. The grind never stops 💪"
    ]},
    { name: "Stephen Curry", handle: "@stephencurry30", category: "Sports", verified: true, followers: "55M", posts: [
      "Night night 🌙 4 rings and counting!",
      "I can do all things through Christ who strengthens me. Philippians 4:13",
      "They said I was too small. Now I changed the game.",
      "Shoot your shot. Literally and figuratively.",
      "The three-point revolution started with a kid from Davidson."
    ]},
    { name: "Cristiano Ronaldo", handle: "@cristiano", category: "Sports", verified: true, followers: "620M", posts: [
      "SIUUUU! ⚽ Hard work pays off. Another record broken!",
      "Dreams are not what you see in sleep. They are the things that don't let you sleep.",
      "Talent without working hard is nothing.",
      "I'm not the best because of talent. I'm the best because I outwork everyone.",
      "Your love makes me strong. Your hate makes me unstoppable."
    ]},
    { name: "Lionel Messi", handle: "@leomessi", category: "Sports", verified: true, followers: "500M", posts: [
      "You have to fight to reach your dream. You have to sacrifice and work hard for it ⚽",
      "I start early, and I stay late, day after day, year after year. It took me 17 years overnight success.",
      "The day you think there is no improvements to be made is a sad one for any player.",
      "Every time I score, I dedicate it to my family. They are my everything.",
      "The ball is my best friend."
    ]},
    { name: "Neymar Jr", handle: "@neymarjr", category: "Sports", verified: true, followers: "215M", posts: [
      "Joga bonito ⚽ The beautiful game is meant to be enjoyed!",
      "I learned to play on the streets. That creativity can't be taught in any academy.",
      "Pressure is a privilege. It means you matter.",
      "My feet tell stories on the field. Every dribble is a sentence.",
      "Brazil will always be in my heart. Representing my country is my greatest honor."
    ]},
    { name: "Kylian Mbappé", handle: "@k.mbappe", category: "Sports", verified: true, followers: "110M", posts: [
      "Speed kills. But intelligence wins championships ⚡",
      "I grew up in Bondy dreaming of this. Never stop believing in your dreams.",
      "The World Cup at 19. But I'm still hungry for more.",
      "I want to leave a legacy, not just win trophies.",
      "My generation of players is going to change the game."
    ]},
    { name: "Tom Brady", handle: "@tombrady", category: "Sports", verified: true, followers: "15M", posts: [
      "7 rings. 5 MVPs. But I remember every single doubt. LFG!",
      "I wasn't the fastest or the strongest. But I was the most prepared. Always.",
      "The TB12 method: discipline, nutrition, pliability, and an obsession with winning.",
      "Retirement just means finding new ways to compete.",
      "Pick 199 of the 2000 NFL Draft. Never let anyone tell you what you can't do."
    ]},
    { name: "Serena Williams", handle: "@serenawilliams", category: "Sports", verified: true, followers: "17M", posts: [
      "23 Grand Slams. Started on the courts of Compton. Dream big, work harder 🎾",
      "I don't like to lose — at anything — yet I've grown the most from my losses.",
      "Every woman's success should be an inspiration to another. We're strongest when we cheer each other on.",
      "Venus and I changed the sport forever. And we're just getting started.",
      "Be bold. Be fierce. Be unapologetically you."
    ]},
    { name: "Conor McGregor", handle: "@thenotoriousmma", category: "Sports", verified: true, followers: "47M", posts: [
      "We're not here to take part. We're here to take over! 🏆",
      "I am cocky in prediction. I am confident in preparation. But I am always humble in victory or defeat.",
      "Proper Twelve whiskey — taste the Irish spirit!",
      "Doubt me now? I dare you. I thrive on doubt.",
      "Precision beats power. Timing beats speed."
    ]},
    { name: "Floyd Mayweather", handle: "@floydmayweather", category: "Sports", verified: true, followers: "30M", posts: [
      "50-0. Undefeated. Undisputed. The best ever 🥊",
      "Hard work, dedication! That's the motto!",
      "I didn't choose the Money lifestyle. The Money lifestyle chose me 💰",
      "Defense wins fights. Intelligence wins championships.",
      "They hate to see you winning. So keep winning."
    ]},

    // === MUSIC ===
    { name: "Drake", handle: "@champagnepapi", category: "Music", verified: true, followers: "145M", posts: [
      "Started from the bottom, now we're here. And the bottom still motivates me every day 🦉",
      "Life is just a big cycle of ups and downs. Enjoy the ride.",
      "OVO Sound. God's Plan. Everything happens for a reason.",
      "Toronto raised me. The 6ix shaped my sound.",
      "I was just writing raps in my mom's basement. Now the whole world's listening."
    ]},
    { name: "Jay-Z", handle: "@jayz", category: "Music", verified: true, followers: "5M", posts: [
      "I'm not a businessman. I'm a business, man.",
      "Reasonable doubt was just the beginning. Now we building empires.",
      "Allow me to re-introduce myself. My name is HOV.",
      "Roc Nation, Tidal, Ace of Spades — diversify your portfolio, kings and queens.",
      "Brooklyn's finest. The culture is the business."
    ]},
    { name: "Beyoncé", handle: "@beyonce", category: "Music", verified: true, followers: "320M", posts: [
      "Who run the world? You already know the answer 👑",
      "Power is not given to you. You have to take it.",
      "Renaissance is more than an album. It's a movement.",
      "Texas raised me. The world embraced me. My fans inspire me every single day.",
      "I don't like to gamble, but if there's one thing I'm willing to bet on, it's myself."
    ]},
    { name: "Taylor Swift", handle: "@taylorswift13", category: "Music", verified: true, followers: "280M", posts: [
      "The Eras Tour has been the most magical experience of my entire life ✨",
      "I'm writing my own narrative. Literally. Own your masters, own your story.",
      "Swifties are the most incredible fans in the entire universe. No debate.",
      "I told you I was going to re-record. Never underestimate a woman with a plan.",
      "Life is too short to pretend you don't like your own songs."
    ]},
    { name: "Bad Bunny", handle: "@badbunnypr", category: "Music", verified: true, followers: "45M", posts: [
      "Yo perreo sola 🐰 Puerto Rico to the world!",
      "Reggaeton and Latin music are taking over. And we're just getting started.",
      "I make music for my people. Boricua proud always.",
      "Being yourself is the most rebellious thing you can do.",
      "The world needs more Latino representation. I'm here for it."
    ]},
    { name: "Billie Eilish", handle: "@billieeilish", category: "Music", verified: true, followers: "110M", posts: [
      "I'm going to make what I want to make and people are going to like what they like. Simple as that 💚",
      "Being young doesn't mean you can't make a difference. Use your voice.",
      "Body positivity, mental health awareness, climate action — we have to talk about what matters.",
      "My music is my diary. Every song is a page from my life.",
      "Grammy at 18. But the best is yet to come."
    ]},
    { name: "The Weeknd", handle: "@theweeknd", category: "Music", verified: true, followers: "75M", posts: [
      "After Hours. Dawn FM. The story continues... XO 🌅",
      "I came from Scarborough with nothing but a voice and a vision.",
      "The Super Bowl halftime show was a dream I never even dared to dream.",
      "My darkness fuels my art. Every struggle becomes a song.",
      "XO till we overdose. The fans keep me alive."
    ]},
    { name: "Kendrick Lamar", handle: "@kendricklamar", category: "Music", verified: true, followers: "20M", posts: [
      "Be humble. Sit down. The music speaks for itself.",
      "Hip-hop is the most important cultural movement of our time. Protect it.",
      "Compton made me. My experiences shape every bar I write.",
      "The Pulitzer was for hip-hop. For the culture. For every kid who was told they couldn't.",
      "I don't make music for awards. I make music for purpose."
    ]},
    { name: "Rihanna", handle: "@badgalriri", category: "Music", verified: true, followers: "150M", posts: [
      "Fenty Beauty and Savage X changed the game. Representation matters in EVERY industry 💎",
      "Work work work work work. That's really all there is to it.",
      "Barbados to the world. Island girl energy forever.",
      "Beauty comes in every shade. That's why Fenty has 50+.",
      "I don't do things for the response. I do things for the feeling."
    ]},
    { name: "Ed Sheeran", handle: "@taborsheeran", category: "Music", verified: true, followers: "42M", posts: [
      "Picked up a guitar at 11. Never put it down. Music saved my life 🎸",
      "I wrote songs on the streets of London before anyone knew my name.",
      "The Mathematics Tour has been incredible. Thank you to every single fan.",
      "I don't need a band. Just me and my loop pedal. That's the beauty of it.",
      "Shape of You was written in like 30 minutes. Sometimes the magic just flows."
    ]},
    { name: "Ariana Grande", handle: "@arianagrande", category: "Music", verified: true, followers: "380M", posts: [
      "Thank u, next taught me the most important lesson: self-love 💕",
      "My ponytail has more power than most people realize 😂",
      "Music is how I process everything. Every album is therapy.",
      "Manchester showed me the strength of love over hate. Forever grateful.",
      "7 rings. I see it, I like it, I want it, I got it."
    ]},
    { name: "Travis Scott", handle: "@travisscott", category: "Music", verified: true, followers: "50M", posts: [
      "UTOPIA is more than an album. It's a world. Welcome to the experience 🌵",
      "La Flame forever. Cactus Jack sends his regards.",
      "Houston raised me. The city's energy is in everything I create.",
      "I don't make music. I create experiences. Every show is different.",
      "The rager lifestyle — we go 100 or we don't go at all."
    ]},

    // === TECH ===
    { name: "Marques Brownlee", handle: "@mkbhd", category: "Tech", verified: true, followers: "20M", posts: [
      "The best tech reviewer? Nah, I'm just a guy who loves gadgets and good video quality 📱",
      "Pixel perfect. The details matter more than people think.",
      "Every smartphone review I do, I learn something new about what people actually care about.",
      "Red has always been my color. The studio setup keeps evolving.",
      "Tech is meant to make your life better. If it doesn't, it's not worth it."
    ]},
    { name: "Linus Tech Tips", handle: "@linustech", category: "Tech", verified: true, followers: "16M", posts: [
      "Today's video is sponsored by... just kidding. Let's build something cool 😂",
      "I dropped another motherboard today. Some things never change.",
      "PC gaming is superior and I will die on this hill.",
      "The WAN show keeps getting longer because we have too much to talk about.",
      "Water cooling is not overkill. It's necessary. Fight me."
    ]},
    { name: "iJustine", handle: "@ijustine", category: "Tech", verified: true, followers: "7M", posts: [
      "Unboxing day is the best day! New Apple products always hit different 📦",
      "I've been making YouTube videos for over 15 years. The journey has been incredible.",
      "Tech should be accessible to everyone. That's my mission.",
      "Apple event days are like Christmas morning for me.",
      "Gaming, tech, and pizza. That's basically my entire personality."
    ]},
    { name: "Linus Torvalds", handle: "@linustorvalds", category: "Tech", verified: true, followers: "2M", posts: [
      "Talk is cheap. Show me the code.",
      "Linux is about evolution, not revolution. Small, incremental improvements compound over time.",
      "I'm not a visionary. I'm an engineer. I look at the code.",
      "Open source changed the world. And it was never really about ideology — it was about better software.",
      "Git happened because I needed it. The best tools solve your own problems first."
    ]},
    { name: "Tim Berners-Lee", handle: "@timberners_lee", category: "Tech", verified: true, followers: "1.5M", posts: [
      "The web was designed to be open, free, and accessible to all. Let's keep it that way.",
      "Data is the pollution problem of the information age. We need to clean it up.",
      "The original vision of the web was a collaborative space. Let's reclaim that.",
      "Privacy is a fundamental right, not a feature.",
      "30+ years of the web. The journey continues."
    ]},
    { name: "Unbox Therapy", handle: "@unboxtherapy", category: "Tech", verified: true, followers: "20M", posts: [
      "This is the sickest gadget I've seen all year! Let me show you why 📦",
      "Unboxing is an art form. The anticipation is half the fun.",
      "I've unboxed thousands of products. This one actually surprised me.",
      "The best tech is the tech you actually use every day.",
      "Sometimes the most expensive option isn't the best option. Let me prove it."
    ]},

    // === FASHION ===
    { name: "Kim Kardashian", handle: "@kimkardashian", category: "Fashion", verified: true, followers: "365M", posts: [
      "SKIMS is for every body. Inclusivity isn't a trend, it's a standard 💕",
      "The justice system needs reform. Using my platform for criminal justice reform is my calling.",
      "Studying law wasn't what anyone expected. But it's what I'm passionate about.",
      "Confidence is the best outfit. Rock it and own it.",
      "The KKW brand is built on authenticity. Be unapologetically you."
    ]},
    { name: "Kylie Jenner", handle: "@kyliejenner", category: "Fashion", verified: true, followers: "400M", posts: [
      "Kylie Cosmetics started with a lip kit. Now it's a global beauty empire 💄",
      "Self-made means I built this from my own vision. Period.",
      "Motherhood changed everything for me. Stormi is my whole world.",
      "Beauty is about self-expression. There are no rules.",
      "Rise and shine ☀️ Every day is a new opportunity."
    ]},
    { name: "Pharrell Williams", handle: "@pharrell", category: "Fashion", verified: true, followers: "14M", posts: [
      "Creativity has no ceiling. From music to fashion to design — it's all connected 🎨",
      "Louis Vuitton men's creative director. Never stop dreaming bigger.",
      "Happy is a state of mind. Choose it daily.",
      "Skateboard P in the building. The Neptunes sound lives forever.",
      "Fashion is about expression. Music is about expression. It's all art."
    ]},
    { name: "Hailey Bieber", handle: "@haileybieber", category: "Fashion", verified: true, followers: "52M", posts: [
      "Rhode Skin is my baby. Clean, effective skincare for everyone 🧴",
      "Glazed donut skin isn't just a trend. It's a lifestyle.",
      "Confidence comes from within. Skincare just enhances what's already there.",
      "The strawberry girl look is everything right now.",
      "Being a model taught me discipline. Building a brand taught me everything else."
    ]},

    // === HEALTH ===
    { name: "Dr. Andrew Huberman", handle: "@hubaborman", category: "Health", verified: true, followers: "8M", posts: [
      "Morning sunlight exposure for 10-15 minutes sets your circadian rhythm. Non-negotiable protocol 🌅",
      "Dopamine is not about pleasure. It's about motivation and pursuit. Understand the difference.",
      "Cold exposure, heat exposure, and breathing protocols — these are the tools that cost nothing but change everything.",
      "Your nervous system is the most powerful pharmacy in the world.",
      "Sleep is the foundation. If your sleep is broken, everything else will break too.",
      "Neuroplasticity means your brain can change at any age. You're never too old to learn."
    ]},
    { name: "Dr. Peter Attia", handle: "@peterattiamd", category: "Health", verified: true, followers: "3M", posts: [
      "Longevity is not about lifespan. It's about healthspan. Quality years matter most.",
      "Zone 2 cardio is the most underrated exercise for longevity. Do more of it.",
      "Metabolic health is the foundation of everything. Fix your insulin, fix your life.",
      "The four horsemen of chronic disease: heart disease, cancer, neurodegeneration, and metabolic dysfunction.",
      "Outlive is about taking control of your health before disease takes control of you."
    ]},
    { name: "Dr. Rhonda Patrick", handle: "@foundmyfitness", category: "Health", verified: true, followers: "2M", posts: [
      "Sulforaphane from broccoli sprouts is one of the most potent activators of NRF2 pathway 🥦",
      "Your microbiome is your second brain. Feed it well.",
      "Sauna use 4-7 times per week is associated with reduced all-cause mortality.",
      "Omega-3 fatty acids, vitamin D, and magnesium — the trifecta of foundational supplements.",
      "Epigenetics shows us that our lifestyle choices literally change our gene expression."
    ]},
    { name: "Jocko Willink", handle: "@jockowillink", category: "Health", verified: true, followers: "4M", posts: [
      "Good. Got denied. GOOD. Lost the deal. GOOD. Got injured. GOOD. It's all fuel for the fire 🔥",
      "Discipline equals freedom. Wake up at 4:30 AM and own the day.",
      "There are no shortcuts. The path to success is through hard work.",
      "Leadership means taking ownership. Extreme ownership of everything in your world.",
      "Don't wait to be motivated. Execute the plan. Motivation follows action."
    ]},
    { name: "David Goggins", handle: "@davidgoggins", category: "Health", verified: true, followers: "12M", posts: [
      "Stay hard! Who's gonna carry the boats?! 🏃‍♂️",
      "Most people only use 40% of their potential. The 40% rule is REAL.",
      "I don't stop when I'm tired. I stop when I'm done.",
      "Suffering is the true test of life. Embrace the suck.",
      "The only person who can limit you is you. Take the governor off your mind.",
      "Can't hurt me. Read it. Live it. Own it."
    ]},

    // === REAL ESTATE ===
    { name: "NovaSage247", handle: "@novasage247", category: "Real Estate", verified: true, followers: "15M", posts: [
      "10X your real estate portfolio! Cash flow is KING! 🏢",
      "Don't buy a house. Buy an apartment building. Think BIGGER!",
      "Multifamily real estate is the greatest wealth-building vehicle in history.",
      "Average people have average goals. 10X EVERYTHING!",
      "You're either growing or dying. There is no in between in real estate."
    ]},
    { name: "Ryan Serhant", handle: "@ryanserhant", category: "Real Estate", verified: true, followers: "3M", posts: [
      "Sell It Like Serhant. Every interaction is a sales opportunity 🏠",
      "Real estate is the most personal business there is. You're selling dreams.",
      "I went from a struggling actor to the #1 broker in NYC. Hustle is real.",
      "Expansion is the key to success. Never contract.",
      "Social media is the modern open house. Your personal brand IS your business."
    ]},
    { name: "Graham Stephan", handle: "@grahamstephan", category: "Real Estate", verified: true, followers: "5M", posts: [
      "I bought my first property at 18. Real estate changed my entire financial trajectory 🏡",
      "House hacking is the single best strategy for building wealth in your 20s.",
      "I make my iced coffee at home for 20 cents. Financial independence is about the small habits.",
      "YouTube taught me that sharing knowledge can be both impactful and profitable.",
      "The 1% rule in real estate: monthly rent should be at least 1% of purchase price."
    ]},
    { name: "Brandon Turner", handle: "@brandonabromer", category: "Real Estate", verified: true, followers: "1.5M", posts: [
      "BiggerPockets changed how people learn about real estate investing. And we're just getting started.",
      "The BRRRR strategy: Buy, Rehab, Rent, Refinance, Repeat. It works.",
      "Your first deal is the hardest. After that, momentum takes over.",
      "Real estate investing isn't about getting rich quick. It's about getting rich for certain.",
      "Open Door Capital — we're buying apartments. Lots of them."
    ]},

    // === CRYPTO ===
    { name: "Changpeng Zhao", handle: "@caborz", category: "Crypto", verified: true, followers: "10M", posts: [
      "HODL! Long-term thinking wins in crypto. Short-term noise is just that — noise 🪙",
      "Binance serves millions worldwide. We're building the future of finance.",
      "4. Simple as that.",
      "Ignore FUD. Focus on building. The technology speaks for itself.",
      "Crypto adoption is inevitable. We're still in the early innings."
    ]},
    { name: "Vitalik Buterin", handle: "@vaborikbuterin", category: "Crypto", verified: true, followers: "5M", posts: [
      "Ethereum is not just a cryptocurrency. It's a platform for decentralized applications 🔷",
      "The merge to proof-of-stake reduced Ethereum's energy consumption by 99.95%.",
      "Quadratic funding is the most interesting mechanism design of our time.",
      "Crypto should serve humanity, not just speculation. Let's build useful things.",
      "Layer 2 scaling is the path forward. Rollups are the future."
    ]},
    { name: "Michael Saylor", handle: "@saylor", category: "Crypto", verified: true, followers: "3.5M", posts: [
      "Bitcoin is digital gold. It's the best store of value humanity has ever created ₿",
      "MicroStrategy has accumulated over 150,000 BTC. We're just getting started.",
      "Bitcoin is hope. It's the exit from a system designed to devalue your savings.",
      "If you understand Bitcoin, you understand thermodynamics, game theory, and monetary history.",
      "Sell everything and buy Bitcoin. Not financial advice. Just my conviction."
    ]},

    // === COMEDY ===
    { name: "Kevin Hart", handle: "@kevinhart4real", category: "Comedy", verified: true, followers: "175M", posts: [
      "Stay in your grind zone! Work ethic beats talent every single time 😂💪",
      "I went from doing comedy in a basement to selling out stadiums. Never stop hustling.",
      "LOL Hustle Gang! The Hartbeat empire is growing every day.",
      "Everybody wants to be famous, but nobody wants to do the work.",
      "I'm a little guy with big dreams. Size doesn't determine success."
    ]},
    { name: "Joe Rogan", handle: "@joerogan", category: "Comedy", verified: true, followers: "18M", posts: [
      "The JRE podcast has taught me more than any degree ever could 🎙️",
      "Stay curious. Question everything. The truth is out there if you look for it.",
      "Jiu-jitsu changed my life. Get on the mats.",
      "The best conversations happen when you let people talk. Just listen.",
      "Float tanks, elk meat, and DMT. The triangle of enlightenment 😂"
    ]},
    { name: "Dave Chappelle", handle: "@davechappelle", category: "Comedy", verified: true, followers: "5M", posts: [
      "Modern problems require modern solutions 🎤",
      "The art of comedy is telling the truth. People laugh because it's real.",
      "I walked away from $50 million because integrity has no price tag.",
      "Yellow Springs is home. Community is everything.",
      "Rick James stories never get old. I'm Rick James!"
    ]},

    // === EDUCATION ===
    { name: "Neil deGrasse Tyson", handle: "@nabortyson", category: "Education", verified: true, followers: "15M", posts: [
      "The universe is under no obligation to make sense to you. But isn't it wonderful that it does? 🌌",
      "Science literacy is the inoculation against charlatans who would exploit your ignorance.",
      "We went to the moon with a computer less powerful than your phone. Imagine what we can do now.",
      "The good thing about science is that it's true whether or not you believe in it.",
      "StarTalk has been the most rewarding project of my career. Science for everyone."
    ]},
    { name: "Bill Nye", handle: "@billnye", category: "Education", verified: true, followers: "8M", posts: [
      "Science rules! Climate change is real, and we need to act now 🌍",
      "Everyone you will ever meet knows something you don't.",
      "The Science Guy is here to remind you: evolution is a fact, not a theory.",
      "Let's change the world through science education. It starts with curiosity.",
      "Bow ties are cool. Science is cooler."
    ]},
    { name: "Sal Khan", handle: "@salkhan", category: "Education", verified: true, followers: "3M", posts: [
      "Khan Academy's mission: a free, world-class education for anyone, anywhere 📚",
      "Mastery-based learning is the future. No child should be left behind.",
      "AI tutoring is going to be the great equalizer in education.",
      "I started making videos for my cousins. Now 150 million students use Khan Academy.",
      "You can learn anything. That's not a slogan — it's a fact."
    ]},

    // === LIFESTYLE ===
    { name: "Casey Neistat", handle: "@caseaborstat", category: "Lifestyle", verified: true, followers: "12M", posts: [
      "Do what you can't. That's literally the only way to grow 🎬",
      "I dropped out of high school and made it work. The traditional path isn't for everyone.",
      "NYC is the greatest city in the world and I will fight anyone who disagrees.",
      "Running is my meditation. The streets of Manhattan are my church.",
      "Filmmaking is storytelling. And everyone has a story worth telling."
    ]},
    { name: "Tim Ferriss", handle: "@tferriss", category: "Lifestyle", verified: true, followers: "5M", posts: [
      "The 4-Hour Workweek isn't about working 4 hours. It's about designing your life intentionally ⏰",
      "Tools of Titans: the morning routines, habits, and tactics of the world's best.",
      "I use the 80/20 principle for everything. Focus on the 20% that drives 80% of results.",
      "Fear-setting is more powerful than goal-setting. Define your worst case.",
      "Psychedelics, meditation, and journaling — the trifecta for self-discovery."
    ]},

    // === POLITICS/MEDIA ===
    { name: "Ben Shapiro", handle: "@benshapiro", category: "Politics", verified: true, followers: "8M", posts: [
      "Facts don't care about your feelings. Debate the ideas, not the person.",
      "The Daily Wire is building the media company of the future.",
      "Free speech is the foundation of a free society. Protect it.",
      "Logic and reason should guide policy decisions, not emotion.",
      "Read more books. Watch less cable news. Think for yourself."
    ]},
    { name: "Tucker Carlson", handle: "@tuckercarlson", category: "Media", verified: true, followers: "12M", posts: [
      "Ask the questions nobody else is willing to ask. That's journalism.",
      "Independent media is the future. The legacy outlets have lost the trust of the people.",
      "Free speech means hearing things you disagree with. That's the whole point.",
      "The most important stories are the ones they don't want you to hear.",
      "Tucker on Twitter reaches more people than any cable show ever could."
    ]},
    { name: "Anderson Cooper", handle: "@andersoncooper", category: "Media", verified: true, followers: "5M", posts: [
      "Journalism is about holding power accountable. That's the mission.",
      "360 degrees — we cover every angle of the story.",
      "The truth doesn't take sides. Our job is to find it and report it.",
      "Reporting from war zones changed my perspective on everything.",
      "My mom, Gloria Vanderbilt, taught me that hard work is the great equalizer."
    ]},
  ];

  const INFLUENCER_CATEGORY_TEMPLATES: Record<string, string[]> = {
    "Business": [
      "The best time to start a business was yesterday. The second best time is right now.",
      "Revenue is vanity, profit is sanity, cash flow is reality.",
      "Scale or fail. There's no middle ground in today's economy.",
      "Your product doesn't have to be perfect. It has to solve a real problem.",
      "Hired 3 new people this week. Building a team is the ultimate leverage.",
      "Just closed our Series A. The grind is paying off!",
      "Culture eats strategy for breakfast. Build the right team first.",
      "Bootstrapped to $1M ARR. No VC needed. Revenue IS the business model.",
      "The best businesses are built on obsession with the customer.",
      "Disruption isn't about technology. It's about rethinking the problem.",
      "If you're not embarrassed by v1 of your product, you launched too late.",
      "Every rejection is one step closer to the right YES.",
      "B2B or B2C? Just be B2H — business to humans.",
      "Stop building features. Start solving problems.",
      "Product-market fit > everything else. Find it or die trying.",
      "Raised our prices 30%. Lost some customers. Revenue went UP. Know your value.",
      "The lean startup methodology changed how I think about everything.",
      "APIs are eating the world. Build integrations, not empires.",
      "Your competition isn't who you think it is. It's apathy.",
      "Monthly recurring revenue is the most beautiful number in business.",
      "Spent 6 months on market research before writing a single line of code.",
      "The best pitch deck is a product that sells itself.",
      "Remote work isn't the future. It's the present. Adapt or fall behind.",
      "Customer acquisition cost must be lower than lifetime value. Basic math, but most startups fail here.",
      "Saying no is the most powerful thing a founder can do.",
      "Built in public. Shared every win and loss. The community became our moat.",
      "SaaS metrics: churn, NRR, CAC, LTV. Know these or die.",
      "The startup graveyard is full of great ideas with terrible execution.",
      "Your unfair advantage is what you know that nobody else does.",
      "Exit strategy? Build something so good you never want to leave.",
      "Partnerships > competition. The pie is big enough for everyone.",
      "Launched on Product Hunt. Hit #1. Changed our trajectory forever.",
      "Operations is where the magic happens. Glamorous? No. Essential? Absolutely.",
      "Every great company was once a terrible idea that someone believed in.",
      "The best founders I know read 50+ books a year.",
      "Cash reserves = freedom to take calculated risks.",
      "Your first 100 customers will teach you more than any MBA.",
      "Stop attending conferences. Start building.",
      "The gap between idea and execution is where most people give up.",
      "Automation saved us 40 hours a week. Work smarter, not harder.",
      "Customer support IS marketing. Every interaction is a brand touchpoint.",
      "Pivoted twice before finding what worked. Persistence isn't optional.",
      "Board meetings are easy when the numbers speak for themselves.",
      "International expansion is harder than it looks. But the TAM is worth it.",
      "Your logo doesn't matter. Your product does.",
      "The best business advice I ever got: charge more.",
      "Vertical SaaS is the opportunity of the decade.",
      "Community-led growth > paid acquisition. Build your tribe.",
      "The 10,000 hour rule applies to entrepreneurship too.",
      "Just sent our first newsletter to 100K subscribers. Content is king.",
    ],
    "Finance": [
      "Compound interest is the eighth wonder of the world.",
      "Diversify your portfolio. Don't put all your eggs in one basket.",
      "Index funds are the best investment for 99% of people.",
      "Emergency fund: 6 months of expenses. Non-negotiable.",
      "Pay yourself first. Automate your savings.",
      "Dollar-cost averaging removes emotion from investing.",
      "Your 401(k) match is literally free money. Max it out.",
      "Debt is a tool. Use it wisely or it will use you.",
      "Financial independence isn't about being rich. It's about freedom.",
      "Budgeting isn't restriction. It's direction.",
      "Real estate appreciation + cash flow = wealth building machine.",
      "Tax-loss harvesting saved me $15K this year. Know the strategies.",
      "The S&P 500 has returned ~10% annually over 100 years. Time in the market > timing the market.",
      "Credit score tip: keep utilization below 30%. Simple but powerful.",
      "Roth IRA > Traditional IRA for most young professionals. Tax-free growth!",
      "Side income streams: dividends, rental income, royalties. Build multiple.",
      "The best financial plan is one you actually follow.",
      "Stop checking your portfolio daily. It's a marathon, not a sprint.",
      "High-yield savings accounts are paying 5%+ now. Move your cash!",
      "Expense ratio matters. 0.03% vs 1% = hundreds of thousands over 30 years.",
      "You don't need a financial advisor if you're willing to educate yourself.",
      "Asset allocation is the most important investment decision you'll ever make.",
      "Municipal bonds: tax-free income for high earners.",
      "The price of a latte isn't the problem. Not investing is.",
      "Rebalance your portfolio annually. Keep your risk tolerance in check.",
      "Real assets > paper assets in inflationary environments.",
      "Cash-on-cash return is the metric that matters in real estate.",
      "IRAs, 401(k)s, HSAs, 529s — use every tax-advantaged account available.",
      "The wealth gap is really a knowledge gap. Learn and earn.",
      "Cap rates, NOI, and GRM — learn the language of real estate.",
      "Stock buybacks are bullish signals. Companies buying their own shares = confidence.",
      "Margin of safety: buy assets worth $1 for $0.50.",
      "Your net worth is not your self-worth. But building it sure helps.",
      "Private equity returns beat public markets. But liquidity is the trade-off.",
      "ESG investing: making money while making a difference.",
      "The FIRE movement isn't for everyone. But the principles are universal.",
      "Bond yields are finally attractive again. Fixed income deserves a place in your portfolio.",
      "International diversification reduces portfolio volatility.",
      "Options trading: income strategy, not a gambling strategy.",
      "Inflation is a tax on the uninformed. Invest to stay ahead.",
      "Your biggest financial asset in your 20s is time. Use it.",
      "Sequence of returns risk can destroy retirement plans. Plan accordingly.",
      "Cash flow positive properties are the foundation of real estate wealth.",
      "Life insurance isn't an investment. It's protection. Don't conflate the two.",
      "Treasury bonds are risk-free return. Not exciting, but safe.",
      "First-time homebuyer programs can save you tens of thousands. Research them.",
      "GDP growth, inflation, and unemployment — the economic trifecta to watch.",
      "Financial literacy is the skill they should have taught us in school.",
      "Negotiating your salary once can be worth $1M+ over your career.",
      "The power of no: declining bad investments is as important as finding good ones.",
    ],
    "Motivation": [
      "Your comfort zone is killing your potential. Step outside it daily.",
      "The person you become on the way to the goal matters more than the goal itself.",
      "Discipline is choosing between what you want now and what you want most.",
      "You are the average of the five people you spend the most time with. Choose wisely.",
      "Success is not final, failure is not fatal. It's the courage to continue that counts.",
      "The only person you should try to be better than is the person you were yesterday.",
      "Dreams don't work unless you do. Period.",
      "Stop waiting for motivation. Start creating discipline.",
      "Your biggest competitor is the voice in your head telling you to quit.",
      "Small consistent actions > massive inconsistent efforts.",
      "The sunrise doesn't wait for anyone. Neither should your ambition.",
      "Pain is temporary. Quitting lasts forever.",
      "Every master was once a disaster. Give yourself grace to grow.",
      "Mindset is everything. Fix your thinking, fix your life.",
      "Gratitude is the foundation of abundance. Start every day with thanks.",
      "You're closer than you think. Don't stop now.",
      "Excuses sound best to the person making them.",
      "Hard work in silence. Let success make the noise.",
      "Your potential is limitless. The only limits are the ones you accept.",
      "The grind doesn't stop on weekends. Champions are made in the dark.",
      "Self-doubt is the biggest killer of dreams. Silence it.",
      "Every setback is a setup for a comeback. Believe it.",
      "You don't attract what you want. You attract what you are.",
      "Champions don't show up to get everything they want. They show up to give everything they have.",
      "The road to success is always under construction.",
      "Focus on progress, not perfection. Progress compounds.",
      "Vision without execution is just hallucination.",
      "Be so good they can't ignore you.",
      "Results happen over time, not overnight. Work hard, stay consistent, and be patient.",
      "Your morning routine determines your day. Your day determines your life.",
      "Stop talking about what you're going to do. Just do it.",
      "The gap between where you are and where you want to be is called work.",
      "Invest in your mind. It's the greatest asset you'll ever own.",
      "Rejection is redirection. Trust the process.",
      "Energy flows where attention goes. Focus on what matters.",
      "Comparison is the thief of joy. Run your own race.",
      "Success isn't about money. It's about fulfillment.",
      "The people who are crazy enough to think they can change the world are the ones who do.",
      "Burn the ships. Leave no room for retreat.",
      "You can't pour from an empty cup. Take care of yourself first.",
      "The only thing standing between you and your goal is the story you keep telling yourself.",
      "Growth is uncomfortable. Embrace the discomfort.",
      "Your story isn't over yet. Keep writing.",
      "Resilience > talent. Every single time.",
      "Today's struggle is tomorrow's strength.",
      "You were given this life because you are strong enough to live it.",
      "Action cures fear. Inaction feeds it.",
      "The comeback is always greater than the setback.",
      "Be patient with yourself. You're unlearning old patterns and learning new ones.",
      "Legacy is not what you leave FOR people. It's what you leave IN people.",
    ],
    "Tech": [
      "AI is not going to replace you. A person using AI is going to replace you.",
      "The best code is the code you never have to write.",
      "Ship it. Get feedback. Iterate. That's the entire product development cycle.",
      "Full-stack development is the most valuable skill set in tech right now.",
      "Open source changed the world. Contribute to it.",
      "Cloud computing costs are dropping. What used to require servers now requires a credit card.",
      "Cybersecurity isn't optional. One breach can destroy years of work.",
      "The smartphone in your pocket has more computing power than NASA used to reach the moon.",
      "Machine learning models are only as good as the data you feed them.",
      "Tech debt is real debt. Pay it down or it'll bankrupt your codebase.",
      "Remote development teams are the future. Location is irrelevant.",
      "APIs first. Everything else second.",
      "Kubernetes changed how we think about deployment. Container orchestration is beautiful.",
      "The best developers I know read documentation like novels.",
      "Version control isn't optional. If you're not using git, what are you doing?",
      "Serverless architecture: pay for what you use. Revolutionary.",
      "The best UI is the one users don't notice. Invisible design.",
      "ChatGPT changed everything. We're in a new paradigm.",
      "Rust is the future of systems programming. Memory safety without garbage collection.",
      "TypeScript > JavaScript. Type safety saves hours of debugging.",
      "Quantum computing will break current encryption. We need to prepare now.",
      "Web3 is about ownership. Owning your data, your identity, your assets.",
      "Moore's Law may be slowing, but innovation isn't.",
      "Data privacy regulations are getting stricter. GDPR was just the beginning.",
      "The terminal is your friend. Learn to love the command line.",
      "Agile done right is beautiful. Agile done wrong is just meetings.",
      "Microservices vs monolith — pick the right architecture for the problem.",
      "CI/CD pipelines save lives. Automate everything.",
      "Test-driven development sounds slow but it's actually the fastest way to ship quality code.",
      "The best tech stack is the one your team knows best.",
      "Edge computing is bringing processing closer to the user. Lower latency, better experience.",
      "Docker containers: build once, run anywhere. Simple and powerful.",
      "Natural language processing is making computers understand us. Finally.",
      "5G is enabling IoT at scale. The connected world is here.",
      "Low-code and no-code platforms are democratizing software development.",
      "GraphQL > REST for complex data fetching. Fight me.",
      "Blockchain is more than crypto. Supply chain, identity, voting — the use cases are endless.",
      "The metaverse needs better hardware. We're not there yet.",
      "Debugging is twice as hard as writing the code. Write simpler code.",
      "Progressive web apps are making the web feel native. The gap is closing.",
      "Every developer should learn to write technical documentation. It's part of the job.",
      "The cloud is just someone else's computer. But it's a really good computer.",
      "A/B testing everything. Let data drive product decisions.",
      "Accessibility isn't a feature. It's a requirement.",
      "The best engineers I know spend 30% of their time reading others' code.",
      "Don't optimize prematurely. Ship first, optimize later.",
      "Python for ML, TypeScript for web, Rust for systems. Pick the right tool.",
      "Zero-knowledge proofs are the future of privacy. Math > trust.",
      "Your database schema is the foundation. Get it right early.",
      "The developer experience matters. DX = developer happiness = better products.",
    ],
    "Entertainment": [
      "New content just dropped! Link in bio 🔥",
      "Behind the scenes of today's shoot. The real magic happens off camera.",
      "Hit 1 million subscribers! Thank you for everything ❤️",
      "Thumbnail game has to be A1 or the video flops. That's the algorithm.",
      "Collab with my favorite creator today! This one's going to break the internet.",
      "YouTube Shorts vs TikTok vs Reels — you need to be on ALL of them.",
      "The algorithm rewards consistency. Post every day or get buried.",
      "My most viral video was the one I almost didn't upload. Funny how that works.",
      "Content creation is a real job. Don't let anyone tell you otherwise.",
      "Studio upgrade complete! The production quality is about to go crazy.",
      "Editing this video for 16 hours straight. The grind is real.",
      "Fan meet-up was incredible! You guys are the best community on the internet.",
      "My setup tour is coming! RGB everything 😂",
      "Livestream tonight! Come hang out and chat.",
      "Posted daily for 365 days straight. The results speak for themselves.",
      "Merch drop coming next week! You're going to love the designs.",
      "Reaction videos are underrated content. People want to feel connected.",
      "The first 30 seconds determine if someone watches. Hook them immediately.",
      "Brand deal came through! Being authentic about sponsorships is key.",
      "Just hit 100 videos! Each one taught me something new about content.",
      "Podcast episode dropped today with a HUGE guest. Check it out!",
      "The creator economy is worth $100B+ now. Get in or get left behind.",
      "My camera, my laptop, and my creativity — that's all you need to start.",
      "Engaged my audience with a poll. They chose the next video topic!",
      "Watch time > views. YouTube cares about retention.",
      "Going viral isn't a strategy. Consistency is.",
      "Reacting to my first ever video. We've come a long way 😂",
      "Best comment gets pinned. Drop your thoughts below!",
      "Editing tip: cut every unnecessary second. Attention spans are SHORT.",
      "My analytics say most viewers are between 18-24. Creating for the next gen!",
      "Content house life is wild. Every day is a new adventure.",
      "Audio quality > video quality. Invest in a good microphone first.",
      "The YouTube Partner Program changed my life. Monetizing creativity is powerful.",
      "Clicked upload and my anxiety disappeared. Ship it and let the audience decide.",
      "Night shoots hit different. The content comes alive after dark.",
      "Building a community > chasing subscribers. Quality > quantity.",
      "Today's video budget: $50K. The production value is going to be insane.",
      "My editor is the real MVP. Couldn't do this without the team.",
      "A/B testing thumbnails increased my CTR by 40%. Data matters in content.",
      "Uploaded at the wrong time once. Lost 50K potential views. Timing matters.",
      "The grind from 0 to 1000 subscribers was the hardest. It gets easier.",
      "Turned my passion into my paycheck. Best decision I ever made.",
      "Going to VidCon this year! Who wants to meet up?",
      "Content calendar for the month is LOCKED. Planning ahead = peace of mind.",
      "Every platform has its culture. What works on TikTok dies on YouTube.",
      "Challenge accepted! Filming the response video now.",
      "The blooper reel is honestly better than the actual video 😂",
      "Holiday special coming soon! This one is for the OG fans.",
      "Invested my YouTube revenue into stocks. Diversify your creator income.",
      "Started a podcast because long-form content is making a comeback.",
    ],
    "Sports": [
      "Game day. No excuses. Leave everything on the field 🏆",
      "Off-season is where champions are made. Nobody sees the 5 AM workouts.",
      "My coach always told me: hard work beats talent when talent doesn't work hard.",
      "Recovery is just as important as training. Ice bath day!",
      "Just hit a new personal record! The grind never stops 💪",
      "The mental game is 90% of sports. Master your mind, master the game.",
      "Teammates are family. We win together, we lose together.",
      "Study film like your career depends on it. Because it does.",
      "Pre-game routine is sacred. Don't mess with what works.",
      "Nutrition is the secret weapon nobody talks about.",
      "The offseason body transformation is going to shock everyone.",
      "Draft day changed my life. But the work started way before that.",
      "Visualization before every game. See the plays before they happen.",
      "Training in the rain. Weather doesn't take days off, neither do I.",
      "Fan support means everything. You guys keep us going!",
      "Championship mentality: every practice is a game, every game is the championship.",
      "Sports taught me discipline, teamwork, and how to handle failure.",
      "My highlight reel doesn't show the thousands of hours of practice behind it.",
      "Retired from playing but never from competing. Mentoring the next generation now.",
      "The stadium lights hit different when it's a playoff game.",
      "Protein, sleep, hydration — the athlete's holy trinity.",
      "Lost the game but won the lesson. Growth comes from defeat.",
      "Just signed a new deal. Grateful and ready to perform.",
      "Youth sports programs change lives. I know because they changed mine.",
      "MVP isn't given. It's earned. Every. Single. Day.",
      "The tunnel walk before a big game is the greatest feeling in sports.",
      "Cross-training is underrated. Swim, bike, run — be a complete athlete.",
      "Home crowd advantage is real. The energy is unmatched.",
      "Watched film for 4 hours today. Preparation separates good from great.",
      "Rookie year was humbling. But I wouldn't trade the lessons for anything.",
      "Charity game today! Giving back to the community that raised me.",
      "Strength coach changed my career. Find the right mentors.",
      "Every rep in the gym is a deposit in your performance bank account.",
      "Sportsmanship first. Win with grace, lose with dignity.",
      "The comeback story is the best story in sports.",
      "Training camp starts next week. Time to lock in.",
      "My jersey number means everything to me. It represents my journey.",
      "Clutch moments define careers. Train for the big moment.",
      "Team chemistry > individual talent. Every time.",
      "Rest day. Even machines need maintenance.",
      "The best athletes I know are the first to arrive and the last to leave.",
      "International competition represents your whole country. No pressure 😅",
      "Speed, agility, power — train all three or fall behind.",
      "Practice doesn't make perfect. Perfect practice makes perfect.",
      "Hall of Fame is the dream. But the journey is the real reward.",
      "Playoff beard coming in strong 🧔 No shaving until we win it all.",
      "Meditation before games changed my performance completely.",
      "The greatest rivalry is with yourself. Beat your last performance.",
      "Post-game recovery routine: ice bath, stretch, sleep. Repeat.",
      "Camp is tough. But that's the point.",
    ],
    "Music": [
      "New single dropping at midnight! You're not ready for this one 🎵",
      "Studio session went 14 hours today. When the vibes are right, you don't stop.",
      "Just finished the album. Every track tells a story. This one's personal.",
      "The tour has been insane! Every city brings different energy.",
      "Wrote my best song at 3 AM on a random Tuesday. Inspiration doesn't follow schedules.",
      "Platinum! Thank you to everyone who streamed, shared, and supported 💿",
      "Music saved my life. It's not just a career, it's my therapy.",
      "The vinyl pressing of the new album is gorgeous. Physical music matters.",
      "Collaborating with new artists keeps the creativity flowing.",
      "My first guitar was $50 from a garage sale. Now I play Madison Square Garden.",
      "The music industry is changing. Independence > record deals.",
      "Spotify wrapped: you guys really played my stuff on repeat 😭",
      "Sound check before the biggest show of my career. Nervous energy.",
      "The bridge of this new song is going to blow your mind.",
      "Self-produced beats hit different. Full creative control.",
      "Fan covers of my songs make me cry happy tears. You guys are talented.",
      "Music video shoot wrapped. The visuals match the sonics perfectly.",
      "Recording in analog. There's something magical about tape.",
      "The setlist for this tour has some deep cuts. Real fans are going to love it.",
      "Grammys are nice, but fan love is the real award.",
      "Released my first song 10 years ago today. Look how far we've come.",
      "Guitar strings changed, tuning done, coffee ready. Time to create.",
      "The album art is PERFECT. Visuals complete the story.",
      "Sold out the tour in 3 minutes. You guys are insane ❤️",
      "Late night sessions produce the rawest music. No filter, just feeling.",
      "Sampling old records and flipping them into something new. Hip-hop tradition.",
      "Freestyle Friday! Drop a topic and I'll rap about it.",
      "Music production tip: less is more. Don't overprocess the vocals.",
      "My producer just sent the craziest beat. This is going to be a hit.",
      "Backstage before the show. The calm before the storm.",
      "Independent artists are outselling major labels now. The game changed.",
      "Every melody I hear in everyday life becomes a song idea.",
      "The fans singing every word back to me is the greatest feeling on earth.",
      "Home studio setup tour coming soon. You don't need expensive gear to start.",
      "Mixing and mastering are where songs go from good to great.",
      "Feature verse done. This collab is going to break records.",
      "Music theory isn't required. But it's a superpower if you learn it.",
      "The unreleased vault has 500+ songs. Someday I'll let them all out.",
      "Just wrote a song in 20 minutes. Sometimes it flows like water.",
      "Classical training + street influence = my unique sound.",
      "Concert film coming to streaming soon. The live experience captured forever.",
      "Beatmaking tutorial dropping next week. Sharing the knowledge.",
      "Acoustic versions always hit different. Stripped down, raw emotion.",
      "The album rollout plan is insane. Singles, videos, merch — everything coordinated.",
      "Musicians supporting musicians. The community is everything.",
      "Playing a secret show tonight. IYKYK 🤫",
      "My childhood playlist shaped everything I make today.",
      "Live instruments > digital presets. You can hear the difference.",
      "Royalty check came in. Passive income from music is real.",
      "Opening act to headliner in 3 years. The grind is worth it.",
    ],
    "Fashion": [
      "Fashion is armor to survive the reality of everyday life. Dress accordingly 👗",
      "New collection just dropped! Every piece was designed with intention.",
      "Sustainability in fashion isn't optional anymore. It's mandatory.",
      "Street style > runway for real-world inspiration.",
      "Vintage finds today were incredible! The thrift gods were generous.",
      "Capsule wardrobe = less stress, more style. Quality over quantity.",
      "Fashion week highlights: the shows that made me rethink everything.",
      "Your outfit is the first thing people notice. Make it count.",
      "Mixing high and low fashion is the ultimate power move.",
      "The new colorway is 🔥 Limited edition drops drive the culture.",
      "Fashion is self-expression. There are no rules, only choices.",
      "Custom tailoring changed my entire wardrobe game.",
      "Sneaker drop camping is a sport at this point 👟",
      "Minimalist fashion: 20 pieces, unlimited combinations.",
      "The fabric matters more than the brand. Learn to feel quality.",
      "Fashion show behind the scenes: organized chaos at its finest.",
      "Upcycling old clothes into new pieces. Creativity meets sustainability.",
      "My style icon growing up was... surprising. Fashion inspiration comes from everywhere.",
      "Color theory in fashion: complementary colors always work.",
      "Accessories make the outfit. Don't skip them.",
      "Launching a fashion brand requires patience, creativity, and thick skin.",
      "Fashion industry needs more diversity. Representation matters on every runway.",
      "Tailored vs off-the-rack: there's no comparison.",
      "Athleisure isn't lazy. It's a lifestyle choice.",
      "My closet organization system is the most satisfying thing ever.",
      "Fashion and technology are converging. Smart fabrics are coming.",
      "Denim never goes out of style. Invest in a good pair of jeans.",
      "The fashion calendar runs my life. Next season's looks are already in production.",
      "Outfit of the day: all thrifted. Style doesn't require a big budget.",
      "Fashion forward thinking: what's trending is what you make it.",
      "Monochrome fits are underrated. Clean. Simple. Powerful.",
      "The right pair of shoes can change your entire mood.",
      "Fashion editorial shoot today. Every angle tells a different story.",
      "Luxury fashion is about craftsmanship, not logos.",
      "My fashion evolution from 2015 to now is WILD. Growth is visible.",
      "Seasonal wardrobe transition in progress. Out with winter, in with spring.",
      "Fashion is art you wear. Every outfit is a canvas.",
      "The sample sale was INSANE. Designer pieces at 80% off.",
      "Building a fashion empire brick by brick. Patience is the thread.",
      "Trend forecasting: oversized everything is here to stay.",
      "Pattern mixing done right is chef's kiss. Confidence is the key ingredient.",
      "The sewing machine is my secret weapon. Making pieces from scratch.",
      "Fashion show review: bold colors, dramatic silhouettes, and pure creativity.",
      "Invest in outerwear. A great coat ties everything together.",
      "Fashion week street style > the actual shows. That's where real style lives.",
      "Matching sets are the easiest way to look put together instantly.",
      "The fashion brand launched 2 years ago. Now we're in 200 stores.",
      "Leather goods are worth the investment. They only get better with age.",
      "My personal style rule: if it doesn't spark joy, it doesn't get worn.",
      "Fashion is cyclical. What's old becomes new again. Save your favorites.",
    ],
    "Health": [
      "Morning routine: sunrise walk, cold plunge, meditation. Non-negotiable protocol 🌅",
      "Sleep 7-9 hours. It's not optional. Your hormones, cognition, and recovery depend on it.",
      "Zone 2 cardio: the most underrated exercise for longevity and metabolic health.",
      "Processed food is designed to be addictive. Eat real food. Your body knows the difference.",
      "Strength training isn't just for bodybuilders. It prevents sarcopenia and improves bone density.",
      "Gut health determines everything: mood, immunity, cognition. Feed your microbiome.",
      "Hydration tip: drink half your body weight in ounces daily. Minimum.",
      "Fasting isn't starvation. Time-restricted eating has real metabolic benefits.",
      "Vitamin D deficiency is an epidemic. Get tested. Supplement if needed.",
      "The mind-body connection is real. Stress literally changes your biochemistry.",
      "Sauna 4x per week is associated with 40% reduced cardiovascular mortality.",
      "Walking 10K steps daily is the simplest longevity hack available.",
      "Protein is the most important macronutrient. Aim for 1g per pound of body weight.",
      "Breathwork: Box breathing, Wim Hof, or 4-7-8. Pick one and practice daily.",
      "Seed oils are everywhere. Read labels. Avoid processed vegetable oils.",
      "Magnesium is the most common deficiency. It affects 300+ enzymatic processes.",
      "Your nervous system needs recovery. Parasympathetic activation = healing.",
      "Blood work tells the truth. Get comprehensive labs annually.",
      "Creatine is the most studied supplement in history. 5g daily. That's it.",
      "High-intensity interval training: maximum benefit in minimum time.",
      "Mental health IS health. Therapy isn't weakness, it's maintenance.",
      "Inflammation is the root of chronic disease. Anti-inflammatory diet = prevention.",
      "Your posture affects your mood, your breathing, and your spine health.",
      "Omega-3 supplementation: EPA and DHA for brain and heart health.",
      "Alcohol is a toxin. There is no safe amount for optimal health.",
      "Progressive overload in training: the key to continuous improvement.",
      "Circadian rhythm alignment: bright light morning, dim light evening.",
      "Your body is the only place you have to live. Take care of it.",
      "Mobility work > stretching. Range of motion prevents injury.",
      "80% of your immune system is in your gut. Probiotics and fiber matter.",
      "The 4 pillars: sleep, nutrition, exercise, stress management. Master all four.",
      "Functional movement patterns: squat, hinge, push, pull, carry. Do them all.",
      "Continuous glucose monitors reveal what foods actually spike your blood sugar.",
      "VO2 max is the strongest predictor of all-cause mortality. Train it.",
      "Cold exposure benefits: dopamine, norepinephrine, immune function, brown fat activation.",
      "Meal prep Sunday is the most important hour of the week.",
      "Foam rolling isn't just for athletes. Myofascial release helps everyone.",
      "Digital detox: your eyes, your sleep, and your mental health will thank you.",
      "The longevity trifecta: cardio, strength, flexibility. Train all three.",
      "Journaling is a health practice. Writing reduces cortisol and clarifies thinking.",
      "Berberine: nature's metformin. Blood sugar regulation from a plant compound.",
      "Your environment shapes your health. Optimize your sleep space first.",
      "Resistance training 3-4x per week. Non-negotiable for aging well.",
      "Forest bathing (shinrin-yoku): nature exposure reduces stress hormones measurably.",
      "Sitting is the new smoking. Stand up, move, stretch every 30 minutes.",
      "Peptides, nootropics, adaptogens — biohacking tools for optimization.",
      "Community and social connection are longevity factors. Don't neglect relationships.",
      "Your DNA is not your destiny. Epigenetics shows lifestyle matters most.",
      "Daily sunlight exposure: vitamin D, serotonin, and circadian alignment.",
      "Health is wealth. Without it, nothing else matters.",
    ],
    "Real Estate": [
      "Location, location, location. The oldest rule in real estate still holds true 🏠",
      "House hacking: live in one unit, rent out the rest. Build wealth while sleeping.",
      "Cash-on-cash return is the metric that matters. Not appreciation speculation.",
      "Just closed on property #15! The portfolio grows one deal at a time.",
      "The BRRRR method works. Buy, Rehab, Rent, Refinance, Repeat.",
      "Interest rates are high but so is rent demand. Cash flow doesn't care about rates.",
      "Multifamily > single family for building real wealth. Scale matters.",
      "Property management is the unglamorous part nobody talks about.",
      "1031 exchange: defer capital gains taxes and roll into bigger properties.",
      "The best real estate deals are found off-market. Build relationships with sellers.",
      "Duplex strategy: one side pays your mortgage, the other builds equity.",
      "Cap rates in secondary markets are much more attractive right now.",
      "Tenant screening saves thousands. Never skip the background check.",
      "First investment property was terrifying. Best financial decision I ever made.",
      "Short-term rentals (Airbnb) vs long-term: know the pros and cons of each.",
      "Real estate syndication: pool capital with other investors for bigger deals.",
      "Rehab costs always exceed estimates. Budget 20% more than you think.",
      "Commercial real estate is a different beast. Higher risk, higher reward.",
      "Due diligence checklist: inspections, title search, environmental, zoning. Skip nothing.",
      "Leverage is real estate's superpower. 80% LTV means 5x leverage.",
      "The 1% rule: monthly rent should be at least 1% of purchase price.",
      "Build a power team: agent, lender, contractor, property manager, attorney.",
      "Vacancy kills returns. Keep your units occupied with quality tenants.",
      "Real estate appreciation is a bonus, not a strategy. Focus on cash flow.",
      "Tax benefits of real estate: depreciation, deductions, and deferral. Learn them all.",
      "Mobile home parks are the most underrated real estate investment class.",
      "Self-storage facilities: recession-resistant and low maintenance.",
      "Land investing: the most overlooked asset class with the highest margins.",
      "Market cycle awareness: know when to buy, hold, or sell.",
      "Creative financing: seller financing, subject-to, lease options. Think outside the bank.",
      "Just refinanced and pulled out $200K tax-free. Real estate is the ultimate wealth vehicle.",
      "Property appreciation in this market has been incredible. Equity is building fast.",
      "The real estate journey starts with education. Read 10 books before your first deal.",
      "Section 8 housing: guaranteed government rent payments. Underutilized strategy.",
      "Fix and flip profits are taxed as ordinary income. Plan for it.",
      "Your first deal won't be perfect. But it will teach you more than any course.",
      "Net operating income determines property value. Increase NOI, increase value.",
      "Real estate meetups: network with other investors. Your next deal could come from a handshake.",
      "Interest rates will normalize. The fundamentals of real estate don't change.",
      "Passive real estate income: the dream is achievable. It just takes discipline and time.",
      "Underwriting deals is a skill. Practice it daily with real listings.",
      "Property taxes vary wildly by location. Factor them into every analysis.",
      "Historic buildings can qualify for tax credits. Creative investors find creative deductions.",
      "Real estate agent vs investor: two very different games. Know which one you're playing.",
      "Cost segregation studies can accelerate depreciation. Ask your CPA about it.",
      "The housing shortage is real. Builders can't keep up with demand.",
      "International real estate: geographic diversification for your portfolio.",
      "REITs are the easiest way to invest in real estate without owning property.",
      "Construction costs are rising. Lock in deals with fixed-price contracts.",
      "Real estate is the foundation of generational wealth. Build it for your family.",
    ],
    "Crypto": [
      "Bitcoin is digital gold. The 21 million supply cap makes it the hardest money ever created ₿",
      "HODL through the noise. Long-term holders always win in crypto.",
      "Not your keys, not your coins. Self-custody is non-negotiable.",
      "DeFi is rebuilding the entire financial system from scratch. We're early.",
      "The blockchain doesn't care about your feelings. It just processes transactions.",
      "NFTs aren't dead. The speculation phase ended. The utility phase is beginning.",
      "Ethereum's transition to proof-of-stake was the most significant upgrade in crypto history.",
      "Dollar-cost averaging into Bitcoin is the safest strategy for most people.",
      "Smart contracts will automate industries we haven't even thought of yet.",
      "Crypto winter is building season. The best projects are shipping right now.",
      "Layer 2 scaling solutions are making blockchain transactions fast and cheap.",
      "Stablecoins are the bridge between traditional finance and crypto.",
      "The institutional adoption of Bitcoin is just beginning. ETFs changed everything.",
      "Crypto education > crypto speculation. Know what you're investing in.",
      "Decentralization isn't just technology. It's a philosophy of empowerment.",
      "On-chain analysis tells you what smart money is actually doing.",
      "Web3 gaming is the trojan horse for mass crypto adoption.",
      "The halving cycles drive Bitcoin's price appreciation. Study the charts.",
      "Yield farming and staking: make your crypto work for you.",
      "Regulatory clarity will unlock trillions in institutional capital.",
      "The metaverse economy will be powered by crypto. Digital ownership is the future.",
      "Cold storage hardware wallet: the best $100 you'll ever spend in crypto.",
      "Total crypto market cap is still tiny compared to global financial markets. Room to grow.",
      "Zero-knowledge proofs: privacy meets blockchain. This technology is revolutionary.",
      "DAO governance is democracy reimagined for the digital age.",
      "Bitcoin's energy consumption is a feature, not a bug. Security requires energy.",
      "Altcoin season rotates. Bitcoin dominance tells you when to diversify.",
      "Cross-chain bridges are connecting the multi-chain future.",
      "Tokenization of real-world assets is a multi-trillion dollar opportunity.",
      "The lightning network makes Bitcoin payments instant and nearly free.",
      "Crypto portfolio: 60% BTC, 25% ETH, 15% high-conviction alts. Adjust as needed.",
      "Every central bank is exploring CBDCs. Crypto forced the conversation.",
      "Mining difficulty adjustments are the most elegant consensus mechanism.",
      "Meme coins are casino chips. Treat them accordingly.",
      "Decentralized identity will replace passwords. Web3 login is the future.",
      "The crypto bear market is where millionaires are made. Accumulate wisely.",
      "Blockchain analytics are improving. Privacy and transparency can coexist.",
      "Gas fees on Ethereum are finally manageable. L2s are working.",
      "Crypto influencers and scams go hand in hand. Verify everything. Trust nothing.",
      "The lightning network and Nostr protocol are building freedom tech.",
      "Validator nodes: earn passive income while securing the network.",
      "Tokenomics matter. Understand inflation rate, supply, and demand before investing.",
      "Crypto taxes are complicated. Use tracking software and consult a CPA.",
      "Bitcoin at $100K was inevitable. What's next is even more exciting.",
      "The most important wallet address is the one you've backed up properly.",
      "Multi-sig wallets: because single points of failure are unacceptable for serious holdings.",
      "Crypto is global, 24/7, permissionless money. Traditional finance can't compete.",
      "Education before allocation. Don't invest what you can't explain.",
      "Airdrops reward early adopters. Use new protocols. The alpha is in the exploration.",
      "The crypto revolution is about financial sovereignty. Own your money.",
    ],
    "Comedy": [
      "If you can't laugh at yourself, don't worry — I'll do it for you 😂",
      "Stand-up is therapy with a microphone. I work out my issues on stage.",
      "The best comedy comes from truth. The more honest you are, the funnier it gets.",
      "Bombing on stage is the best teacher. You learn nothing from killing.",
      "New special coming soon! This one's my most personal work yet.",
      "Comedy clubs are the last real meritocracy. Either you're funny or you're not.",
      "Writing jokes is like mining for gold. You sift through tons of dirt for one nugget.",
      "Laughter is medicine. That's not a metaphor. It literally reduces cortisol.",
      "Open mic night. Where dreams begin and egos die 🎤",
      "The rule of three in comedy: setup, setup, punch. Simple but deadly.",
      "My comedy hero growing up was someone nobody expected. Inspiration is everywhere.",
      "Crowd work is an art form. Reading the room in real-time.",
      "Podcasting is the new comedy stage. Long-form conversation is king.",
      "The funniest person in the room is usually the most observant.",
      "Self-deprecating humor: making yourself the punchline so nobody else can.",
      "Comedy touring is exhausting but the laughs make it worth every mile.",
      "Writer's room energy: 10 comedians in a room. Pure chaotic brilliance.",
      "Timing is everything in comedy. The pause before the punchline does the heavy lifting.",
      "Just did a set in front of 10 people. Intimate shows hit different.",
      "Comedy advice: write every day. Even when nothing is funny. Especially then.",
      "The roast battle went viral. Sometimes you just have to embrace the chaos.",
      "Improv taught me that saying 'yes, and' changes everything.",
      "Sketches, stand-up, or improv? All three. Diversify your comedy portfolio.",
      "Sold out the theater! From open mics to this. The journey is surreal.",
      "Dark humor is like food. Not everyone gets it.",
      "Comedy and tragedy are two sides of the same coin. The best comedians know both.",
      "The comedy algorithm: be funny + be consistent + be patient = career.",
      "My Netflix special was the hardest thing I've ever done. And the most rewarding.",
      "Wordplay, observational, physical, absurdist — find your lane in comedy.",
      "Laughing with someone creates bonds stronger than almost any other shared experience.",
      "The green room before a big show: nervous energy, bad coffee, and pure adrenaline.",
      "Comedy punches up, not down. That's the rule I live by.",
      "Deadpan delivery is underappreciated. Sometimes less is more.",
      "Comedy is subjective. Not everyone will laugh. And that's perfectly okay.",
      "The heckler became part of the bit. Best improvised moment of my career.",
      "Funny is funny. Medium doesn't matter. Stage, screen, podcast, social — just be funny.",
      "I journal every funny thought. Half of them become material eventually.",
      "The comedy community is the most supportive creative community there is.",
      "Opening for a legend taught me more than any comedy class ever could.",
      "My therapist said I use humor as a defense mechanism. I said 'that's hilarious.'",
      "Character work is when comedy becomes acting. The best comedians are actors.",
      "Comedy in different languages is fascinating. Humor is universal but delivery isn't.",
      "The five-minute set is the hardest format. Every word has to earn its place.",
      "Watching my comedy special with my family was the most awkward hour of my life.",
      "Behind every comedian's smile is years of hard work, rejection, and terrible open mic nights.",
      "Memes are modern folk comedy. The internet's collective joke-writing room.",
      "Running a comedy show is harder than performing in one. Respect the producers.",
      "Observational comedy is dying. Or is it? Let me observe that for a moment.",
      "The callback: referencing an earlier joke for a bigger laugh. Structural comedy.",
      "Laughter yoga is a thing and it honestly changed my mornings.",
    ],
    "Education": [
      "Education is the most powerful weapon you can use to change the world 📚",
      "The best teachers make the complex simple. That's the real skill.",
      "Khan Academy proved that free education can reach millions. No excuses.",
      "Learn in public. Share your journey. Help others by being transparent.",
      "The education system needs disruption. We're teaching 19th century skills for a 21st century world.",
      "A degree doesn't guarantee success. Continuous learning does.",
      "Science communication is an art. Making data accessible is vital.",
      "Every child deserves access to quality education. Full stop.",
      "The best learning happens through curiosity, not compliance.",
      "Online courses: learn anything, anywhere, anytime. The golden age of education.",
      "STEM education needs more funding and more diverse voices.",
      "Critical thinking is the most important skill we can teach. Question everything.",
      "The Socratic method: asking questions is more powerful than giving answers.",
      "Lifelong learning is not optional in a rapidly changing world.",
      "Read 30 minutes daily. That's 20+ books a year. Knowledge compounds.",
      "Experiential learning > textbook learning. Get your hands dirty.",
      "The skill gap is really a training gap. Upskill or get left behind.",
      "Microlearning: 5-minute lessons can be more effective than hour-long lectures.",
      "Language learning opens doors to cultures, relationships, and opportunities.",
      "The biggest barrier to education isn't intelligence. It's access.",
      "Project-based learning produces better outcomes than memorization.",
      "AI tutoring will personalize education for every student on Earth.",
      "Teach to learn. Explaining concepts to others deepens your understanding.",
      "Financial literacy should be mandatory in every high school curriculum.",
      "The library is the most underutilized resource in every community.",
      "Spaced repetition: the scientifically proven method for long-term retention.",
      "Coding literacy is the new literacy. Every child should learn to code.",
      "History doesn't repeat, but it rhymes. Learn history to understand the present.",
      "Mentorship > formal education for practical career development.",
      "The Montessori method: follow the child. Their curiosity is the curriculum.",
      "Open-source textbooks could save students billions. Why haven't we done this?",
      "Study groups outperform solo studying. Collective intelligence is powerful.",
      "Education equity: every zip code deserves great schools. Period.",
      "Trade schools and vocational training deserve more respect and funding.",
      "The growth mindset vs fixed mindset: one leads to learning, the other to stagnation.",
      "Gamification in education works. Make learning fun and engagement skyrockets.",
      "The podcast is the modern classroom. Subscribe to learn.",
      "Academic papers should be accessible to everyone, not locked behind paywalls.",
      "Note-taking methods: Cornell, mapping, outlining. Find what works for your brain.",
      "University isn't for everyone. But education is for everyone.",
      "Climate education is urgent. The next generation needs to understand the science.",
      "Cognitive biases affect how we learn. Understanding them makes us better students.",
      "The flipped classroom model: learn at home, practice at school. It works.",
      "Digital literacy is essential. Understanding how the internet works should be taught early.",
      "Philosophy should be taught in elementary school. Critical thinking starts young.",
      "Speed reading is a myth. Deep reading is the real skill.",
      "Interdisciplinary learning connects the dots between fields. Innovation lives at intersections.",
      "The teacher shortage is a crisis. We need to value educators properly.",
      "Learning to learn is the meta-skill. Master it and everything else follows.",
      "Homework debates miss the point. Practice and application matter. The format is secondary.",
    ],
    "Lifestyle": [
      "Intentional living: design your day or someone else will design it for you 🌟",
      "Minimalism isn't about owning less. It's about making room for more of what matters.",
      "Morning routine: journaling, meditation, movement. Start the day on your terms.",
      "Travel is the best education money can buy. See the world.",
      "Slow living in a fast world. It's a conscious choice, not laziness.",
      "Productivity hack: batch your tasks. Context switching kills efficiency.",
      "Digital detox weekend changed my perspective. You don't realize how addicted you are until you stop.",
      "Home organization is self-care. Your space reflects your mind.",
      "Cooking at home saves money and improves your health. Double win.",
      "Gratitude journaling: 3 things every morning. It rewires your brain for positivity.",
      "The book I'm reading right now is changing how I think about everything.",
      "Work-life balance is a myth. Work-life integration is the goal.",
      "Capsule closet update: 30 pieces, infinite style. Less is truly more.",
      "Sunday planning sets up the entire week. 30 minutes that saves hours.",
      "Quality time with family > hustle culture. Protect your relationships.",
      "Plant-based meals 3x this week. Small changes, big impact.",
      "Journaling prompt: What would I do if I knew I couldn't fail?",
      "The power of saying no. Boundaries protect your energy and priorities.",
      "Neighborhood walks are underrated. You notice things you miss driving.",
      "One percent better every day. That's the philosophy. 365 improvements a year.",
      "Reading list for the quarter is set. 12 books across 3 months.",
      "The 90-90-1 rule: for 90 days, spend the first 90 minutes on your #1 priority.",
      "Created a vision board for the year. Visualization works. Science backs it.",
      "Financial independence isn't about being rich. It's about having options.",
      "Social media breaks are necessary. Your mental health will thank you.",
      "Home gym setup is complete. No excuses now. Convenience = consistency.",
      "Meal prep Sunday: 5 meals, 1 hour. Efficiency is beautiful.",
      "The 5 AM club isn't for everyone. Find YOUR optimal schedule.",
      "Hobby exploration: started pottery this month. Creativity is therapy.",
      "Unsubscribed from 50 email lists today. Inbox zero feels incredible.",
      "The compound effect: small daily choices create massive results over time.",
      "Deleted apps that were stealing my time. Reclaimed 2 hours daily.",
      "Skincare routine simplified: cleanser, SPF, moisturizer. Consistency > complexity.",
      "Walking meetings are the best meetings. Movement + conversation = productivity.",
      "Seasonal living: align your habits with nature's rhythms. It makes a difference.",
      "The 2-minute rule: if it takes less than 2 minutes, do it now.",
      "Deep work blocks: 90 minutes of focused creation. No phone. No email.",
      "Gratitude changes everything. Finding things to be grateful for is a skill you develop.",
      "Weekend adventures don't have to be expensive. Nature is free.",
      "Time audit: tracked every hour for a week. Eye-opening results.",
      "Essentialism: doing less but better. Not everything deserves your attention.",
      "Cold morning showers: 30 days in. The discipline transfers to every area of life.",
      "A clean desk means a clear mind. Reset your workspace daily.",
      "Annual life review: what worked, what didn't, what to change. Honest reflection.",
      "Building habits with the 21/90 rule: 21 days to create, 90 days to make permanent.",
      "Minimalist phone: removed social media. Only kept messaging and maps.",
      "Coffee ritual: manual grind, pour-over, mindful sipping. Start slow, finish strong.",
      "Friendships require maintenance. Schedule time for the people who matter.",
      "Nature therapy is real. Spending time outdoors reduces anxiety measurably.",
      "The life well-lived is not about more. It's about enough.",
    ],
    "Politics": [
      "Democracy requires participation. If you're not at the table, you're on the menu 🏛️",
      "Bipartisanship isn't dead. It just needs more people willing to listen.",
      "Policy over politics. Focus on what actually helps people.",
      "Civic engagement starts local. Your city council matters more than you think.",
      "The national debt is a problem we're leaving for future generations. We need to act now.",
      "Freedom of speech is the bedrock of democracy. Protect it for everyone.",
      "Term limits would solve more problems than any single policy proposal.",
      "Data-driven policy > ideology-driven policy. Show me the evidence.",
      "Voting is the bare minimum of civic duty. Get involved beyond the ballot.",
      "Political polarization is the greatest threat to democracy. Find common ground.",
      "Infrastructure investment is not partisan. Roads and bridges serve everyone.",
      "The filibuster debate matters. Legislative efficiency vs minority protection.",
      "Campaign finance reform: dark money is corrupting our political system.",
      "Foreign policy affects every citizen. It's not just for diplomats and generals.",
      "Healthcare policy should be debated on outcomes, not ideology.",
      "Education funding determines our nation's future competitiveness. Invest accordingly.",
      "Climate policy is economic policy. Green jobs are real jobs.",
      "Immigration policy should balance compassion with national interest.",
      "Tax policy shapes behavior. Incentives matter. Design them carefully.",
      "The judiciary is the quietest but most powerful branch. Pay attention to it.",
      "Regulatory frameworks should protect people without strangling innovation.",
      "Social safety nets aren't handouts. They're investments in stability.",
      "Veteran affairs should be the first budget priority, not the last.",
      "Gun policy requires nuanced conversation. Binary thinking helps no one.",
      "Trade policy affects every business and consumer. Tariffs have consequences.",
      "Political commentary needs more humility and more data.",
      "The Constitution is a living document. That's not weakness — it's strength.",
      "Grassroots organizing changes outcomes. Don't underestimate local movements.",
      "Gerrymandering undermines democracy. Fair maps = fair representation.",
      "Youth voter turnout is growing. The next generation is engaged.",
      "Transparency in government should be the default, not the exception.",
      "Lobbying reform is overdue. Public interest should outweigh private interest.",
      "State-level politics matter. That's where most policy actually gets made.",
      "National security in the digital age requires cybersecurity investment.",
      "Ranked-choice voting could fix our broken electoral system.",
      "Public servants should be held to the highest ethical standards.",
      "Economic inequality is a policy choice. We can choose differently.",
      "The midterm elections are just as important as the presidential race.",
      "Housing policy affects everything: education, health, economic mobility.",
      "Media literacy is the antidote to political misinformation.",
      "International alliances are not optional. Diplomacy prevents war.",
      "Privacy legislation is urgently needed in the age of surveillance.",
      "Environmental justice: pollution shouldn't be concentrated in poor communities.",
      "The national conversation needs more listening and less shouting.",
      "Public education is the great equalizer. Fund it accordingly.",
      "Criminal justice reform saves money and lives. The data is clear.",
      "Internet access is modern infrastructure. Broadband for all.",
      "Political courage means making unpopular decisions that are right.",
      "Fact-checking isn't censorship. It's journalism.",
      "The peaceful transfer of power is democracy's greatest achievement.",
    ],
    "Media": [
      "Breaking news never sleeps. Neither do journalists covering it 📰",
      "The newsroom is changing. Digital first, print second. Adapt or disappear.",
      "Source verification is the difference between journalism and noise.",
      "Investigative journalism holds power accountable. It's democracy's immune system.",
      "Podcasting killed traditional radio and created something better.",
      "Media literacy should be taught in every school. Consume critically.",
      "The attention economy rewards outrage over accuracy. We need to fix that.",
      "Newsletter era: direct to audience, no algorithm in between.",
      "Journalism isn't dying. The business model is. Content has never been more in demand.",
      "War correspondents are the bravest people in media. Full stop.",
      "The 24-hour news cycle creates urgency where none exists.",
      "Documentary filmmaking is journalism's most powerful format.",
      "Social media broke journalism. And created a million journalists.",
      "The interview is an art form. Preparation is everything.",
      "Op-eds vs reporting: know the difference. They serve different purposes.",
      "Citizen journalism filled gaps that traditional media couldn't.",
      "Press freedom is under threat globally. Defend it everywhere.",
      "The newspaper is dead. Long live the newspaper.",
      "Media consolidation reduces diverse voices. More owners = more perspectives.",
      "Streaming platforms are the new networks. Content creation is democratized.",
      "Headline writing is the most important skill in digital media.",
      "Verification before publication. Speed kills credibility.",
      "Photojournalism: one image can change the world.",
      "The algorithm decides what you see. That's a problem we need to solve.",
      "Local journalism is the most endangered species in media.",
      "Data journalism combines storytelling with statistics. The future of reporting.",
      "Corrections are not weaknesses. They're proof of integrity.",
      "Audio journalism is having a renaissance. Podcasts, audio stories, voice.",
      "Media ethics: the line between covering and creating the story.",
      "Subscription models work. People will pay for quality journalism.",
      "The reporter's notebook: where stories begin, long before publication.",
      "Fake news is real, and combating it requires everyone's participation.",
      "Video journalism: one-person crews producing broadcast-quality content.",
      "Anonymous sources are essential. Without them, many truths would never surface.",
      "The comment section is not journalism. But it reflects society.",
      "Editorial independence is not a luxury. It's a necessity.",
      "Cross-platform storytelling: the same story told differently for each medium.",
      "Media criticism is healthy. Echo chambers are not.",
      "The scoop matters less than getting it right.",
      "Freelance journalism is the backbone of modern media. Respect and pay freelancers.",
      "Wire services still power most of the news you read. AP, Reuters, AFP.",
      "Audience engagement: journalism is becoming a conversation, not a broadcast.",
      "Paywalls protect journalism. Free content devalues it.",
      "The byline carries weight. Your name means your reputation.",
      "Climate journalism needs to go beyond doom. Solutions matter.",
      "Sports journalism is storytelling at its finest.",
      "International reporting connects the world. Every story matters somewhere.",
      "The media landscape changes every year. Adaptability is the only constant.",
      "Trust is the currency of journalism. Once lost, nearly impossible to regain.",
      "The pen is still mightier than the sword. Write fearlessly.",
    ],
  };

  const INFLUENCER_NAMES_BY_CATEGORY: Record<string, { firstNames: string[], lastNames: string[] }> = {
    "Business": {
      firstNames: ["Alex", "Jordan", "Cameron", "Morgan", "Taylor", "Avery", "Riley", "Quinn", "Reese", "Dakota", "Hayden", "Kai", "Rowan", "Sage", "Blake", "Parker", "Emerson", "Finley", "Skyler", "Casey", "Drew", "Jamie", "Kendall", "Lane", "Noel", "Robin", "Terry", "Val", "Chris", "Pat", "Dominique", "Frankie", "Harley", "Jesse", "Kelly", "Lee", "Micah", "Nico", "Peyton", "Remy", "Sam", "Shawn", "Dana", "Corey", "Devon", "Ellis", "Gray", "Harper", "Ira", "Jules", "Marley", "Phoenix", "River", "Spencer", "Tatum", "Winter", "Ash", "Bay", "Eden", "Indigo", "Milan", "Ocean", "Raven", "Storm", "True", "Wren", "Zion", "August", "Haven", "Lennon", "Monroe", "Royal", "Sasha", "Arlo", "Briar", "Cypress", "Ember", "Fern", "Gem", "Honor", "Ivory", "Jade", "Kit", "Lark", "Neve", "Onyx", "Pearl", "Quest", "Reed", "Sol", "Teal", "Uma", "Vale", "Zen", "Arrow", "Cloud", "Dove", "Echo", "Frost", "Gale", "Halo", "Ion"],
      lastNames: ["Chen", "Patel", "Rodriguez", "Williams", "Kim", "Singh", "Nakamura", "O'Brien", "Andersen", "Johannsen", "Santos", "Ali", "Schmidt", "Volkov", "Yamamoto", "Costa", "Nguyen", "Park", "Berg", "Russo", "Fischer", "Sato", "Mueller", "Eriksson", "Tanaka", "Laurent", "Morales", "Hansen", "Dubois", "Petrov", "Shah", "Jensen", "Larsson", "Wang", "Li", "Zhang", "Liu", "Yang", "Huang", "Wu", "Cho", "Lim", "Tan", "Lee", "Khan", "Ahmed", "Hussein", "Ibrahim", "Hassan", "Osman", "Torres", "Garcia", "Lopez", "Martinez", "Hernandez", "Gonzalez", "Perez", "Sanchez", "Ramirez", "Flores", "Rivera", "Gomez", "Diaz", "Cruz", "Reyes", "Moreno", "Jimenez", "Alvarez", "Romero", "Ruiz", "Mendoza", "Ortiz", "Gutierrez", "Ramos", "Medina", "Vargas", "Castro", "Delgado", "Herrera", "Aguilar", "Cabrera", "Molina", "Vega", "Soto", "Rios", "Navarro", "Campos", "Silva", "Ferreira", "Oliveira", "Almeida", "Sousa", "Lima", "Araujo", "Barbosa", "Rocha", "Cardoso", "Ribeiro", "Carvalho"]
    },
    "Finance": {
      firstNames: ["Marcus", "Victoria", "Anthony", "Elena", "Brandon", "Sophia", "Derrick", "Natasha", "Vincent", "Claudia", "Raymond", "Giselle", "Terrence", "Helena", "Gregory", "Anastasia", "Leonard", "Bianca", "Frederick", "Catalina", "Lawrence", "Dominique", "Sterling", "Genevieve", "Winston", "Priscilla", "Reginald", "Valentina", "Malcolm", "Adriana", "Phillip", "Isabella", "Donovan", "Gabriella", "Franklin", "Cassandra", "Preston", "Juliana", "Marshall", "Veronica", "Carlton", "Simone", "Warren", "Celeste", "Roland", "Margaux", "Clifton", "Evangeline", "Bradford", "Rosalind"],
      lastNames: ["Whitfield", "Montgomery", "Beaumont", "Kensington", "Harrington", "Worthington", "Pemberton", "Blackwell", "Carmichael", "Davenport", "Ellsworth", "Fairfax", "Goldstein", "Hawthorne", "Ingersoll", "Jameson", "Kingsley", "Lancaster", "Montague", "Northrop", "Overstreet", "Prescott", "Quincy", "Rothschild", "Sheffield", "Thornton", "Underwood", "Vanderbilt", "Wellington", "Sterling", "Ashworth", "Bancroft", "Crawford", "Drummond", "Eldridge", "Fitzpatrick", "Grayson", "Holloway", "Irving", "Jefferson", "Kensington", "Lindberg", "Maxwell", "Newton", "Osborne", "Patterson", "Richmond", "Sullivan", "Townsend", "Weston"]
    },
    "Motivation": {
      firstNames: ["Marcus", "Trinity", "Devon", "Jasmine", "Isaiah", "Destiny", "Xavier", "Serenity", "Malik", "Heaven", "Andre", "Miracle", "Darius", "Harmony", "Khalil", "Precious", "Omar", "Diamond", "Tyrone", "Crystal", "Rashid", "Amber", "Jamal", "Hope", "Lamar", "Faith", "Terrell", "Grace", "Dante", "Joy", "Stefan", "Mercy", "Orion", "Nova", "Atlas", "Lyric", "Phoenix", "Aria", "Zenith", "Luna", "Blaze", "Star", "Summit", "Dawn", "Titan", "Aurora", "Magnus", "Destiny", "Valor", "Genesis"],
      lastNames: ["Bridges", "Waters", "Stone", "Fields", "Rivers", "Brooks", "Woods", "Hill", "Lake", "Banks", "Summit", "Springs", "Vale", "Peak", "Meadows", "Cross", "Storm", "Dawn", "Bright", "Strong", "Light", "Power", "Crown", "Noble", "Grace", "Truth", "Faith", "Hope", "Love", "Peace", "Bliss", "Joy", "Sage", "Wise", "True", "Bold", "Brave", "Free", "Reign", "Rise", "Bloom", "Shine", "Spark", "Flame", "Glory", "Dream", "Golden", "Silver", "Diamond", "Royal"]
    },
    "Tech": {
      firstNames: ["Dev", "Ada", "Alan", "Grace", "Linus", "Ruby", "Django", "Julia", "Rust", "Pearl", "Java", "Pixel", "Node", "Cloud", "Data", "Byte", "Link", "Chip", "Sage", "Neo", "Max", "Eve", "Rex", "Iris", "Zara", "Hugo", "Aria", "Leo", "Nora", "Finn", "Maya", "Owen", "Zoe", "Ian", "Elle", "Raj", "Mia", "Axel", "Lia", "Erik", "Nina", "Seth", "Kira", "Troy", "Vera", "Miles", "Dina", "Cole", "Tess", "Wade"],
      lastNames: ["Stack", "Loop", "Code", "Bits", "Wire", "Cache", "Shell", "Parse", "Debug", "Compile", "Runtime", "Buffer", "Kernel", "Thread", "Socket", "Vector", "Matrix", "Pixel", "Cipher", "Hash", "Crypto", "Binary", "Logic", "Query", "Index", "Server", "Cloud", "Stream", "Node", "Port", "Gate", "Chip", "Core", "Nano", "Micro", "Macro", "Meta", "Proto", "Sigma", "Delta", "Omega", "Alpha", "Beta", "Gamma", "Theta", "Lambda", "Kappa", "Epsilon", "Zeta", "Iota"]
    },
    "Entertainment": {
      firstNames: ["Jaylen", "Aaliyah", "Bryson", "Kiara", "Tyrell", "Imani", "Desmond", "Zara", "Cedric", "Naomi", "Marquis", "Layla", "Darian", "Sienna", "Tristan", "Amara", "Jaxon", "Nyla", "Colton", "Sage", "Beckett", "Luna", "Maddox", "Willow", "Easton", "Ivy", "Knox", "Violet", "Crew", "Hazel", "Nash", "Stella", "Wells", "Isla", "Ford", "Cora", "Ridge", "Eloise", "Heath", "Wren", "Brooks", "Thea", "Pierce", "Lila", "Briggs", "Olive", "Reid", "Ruby", "Grant", "Pearl"],
      lastNames: ["Blaze", "Volt", "Flash", "Thunder", "Lightning", "Storm", "Fire", "Ice", "Shadow", "Knight", "Star", "Moon", "Sun", "Sky", "Rain", "Snow", "Frost", "Blade", "Steel", "Stone", "Wolf", "Fox", "Hawk", "Eagle", "Falcon", "Raven", "Phoenix", "Dragon", "Tiger", "Lion", "Bear", "Cobra", "Viper", "Panther", "Jaguar", "Lynx", "Swift", "Chase", "Rush", "Dash", "Ace", "King", "Duke", "Prince", "Crown", "Royal", "Noble", "Glory", "Fame", "Legend"]
    },
    "Sports": {
      firstNames: ["Deshawn", "Brianna", "Jamal", "Kierra", "Terrence", "Aaliyah", "Darnell", "Shakira", "Antoine", "Tamika", "Rasheed", "Keisha", "Marquise", "Latisha", "DeAndre", "Shaniqua", "Tyrese", "Aisha", "Jarvis", "Tanya", "Viktor", "Svetlana", "Dmitri", "Katarina", "Nikolai", "Anastasia", "Sergei", "Natalia", "Andrei", "Olga", "Mateo", "Camila", "Santiago", "Valentina", "Sebastian", "Lucia", "Alejandro", "Sofia", "Diego", "Isabella", "Marco", "Giulia", "Luca", "Chiara", "Alessandro", "Francesca", "Giovanni", "Elena", "Pietro", "Bianca"],
      lastNames: ["Armstrong", "Champion", "Victory", "Trophy", "Medal", "Sprint", "Pace", "Stride", "Goal", "Score", "Win", "Record", "Masters", "Track", "Field", "Court", "Ring", "Arena", "Stadium", "Pitch", "Turf", "Lane", "Pool", "Veloz", "Rapido", "Guerrero", "Campeon", "Fuerza", "Poder", "Rey", "Santos", "Cruz", "Vega", "Luna", "Estrella", "Montoya", "Herrera", "Castillo", "Fernandez", "Delgado", "Moreno", "Navarro", "Aguilar", "Ortega", "Vargas", "Silva", "Costa", "Lima", "Rocha", "Alves"]
    },
    "Music": {
      firstNames: ["Deja", "Tyrell", "Aria", "Kobe", "Melody", "Darius", "Cadence", "Quincy", "Lyric", "Blaze", "Harmony", "Ace", "Viola", "Knox", "Sonata", "Cruz", "Allegra", "Jett", "Adagio", "Reed", "Symphony", "Drake", "Tempo", "Kai", "Octave", "Zion", "Serenade", "Myles", "Chorus", "Enzo", "Lullaby", "Rio", "Ballad", "Cairo", "Jazz", "Bowie", "Rhapsody", "Floyd", "Opera", "Prince", "Blues", "Elvis", "Soul", "Hendrix", "Gospel", "Marley", "Funk", "Ozzy", "Rhythm", "Lennon"],
      lastNames: ["Melody", "Harmony", "Bass", "Treble", "Sharp", "Flat", "Keys", "Strings", "Drums", "Horn", "Reed", "Bell", "Chime", "Song", "Verse", "Note", "Tune", "Chord", "Scale", "Beat", "Groove", "Flow", "Sound", "Echo", "Amp", "Solo", "Duet", "Trio", "Band", "Stage", "Mic", "Track", "Record", "Album", "Mix", "Fade", "Drop", "Rise", "Peak", "Bridge", "Hook", "Loop", "Wave", "Tone", "Pitch", "Tempo", "Sync", "Vibe", "Pulse", "Rhythm"]
    },
    "Fashion": {
      firstNames: ["Chanel", "Armani", "Gianni", "Coco", "Valentina", "Hugo", "Stella", "Yves", "Donatella", "Ralph", "Vera", "Marc", "Donna", "Oscar", "Carolina", "Tom", "Diane", "Calvin", "Miuccia", "Giorgio", "Vivienne", "Alexander", "Rei", "Issey", "Phoebe", "Hedi", "Virgil", "Demna", "Kim", "Pierpaolo", "Riccardo", "Raf", "Jonathan", "Nicolas", "John", "Dries", "Isabel", "Simone", "Christopher", "Clare", "Daniel", "Grace", "Jacquemus", "Balmain", "Dior", "Fendi", "Prada", "Gucci", "Versace", "Hermes"],
      lastNames: ["Vogue", "Couture", "Silk", "Satin", "Velvet", "Lace", "Tweed", "Cashmere", "Leather", "Suede", "Denim", "Cotton", "Linen", "Wool", "Organza", "Taffeta", "Chiffon", "Tulle", "Brocade", "Jacquard", "Embroidery", "Sequin", "Pleat", "Drape", "Stitch", "Thread", "Weave", "Knit", "Tailor", "Pattern", "Runway", "Atelier", "Haute", "Prêt", "Boutique", "Salon", "Maison", "Studio", "Gallery", "Avenue", "Lane", "Place", "Row", "Garden", "Park", "Bloom", "Rose", "Ivy", "Lily", "Fern"]
    },
    "Health": {
      firstNames: ["Dr. Marcus", "Dr. Sophia", "Dr. James", "Dr. Elena", "Dr. Chen", "Dr. Amara", "Dr. Raj", "Dr. Olivia", "Dr. Ahmed", "Dr. Maya", "Dr. Viktor", "Dr. Sarah", "Dr. Lee", "Dr. Anna", "Dr. Michael", "Dr. Claire", "Dr. Thomas", "Dr. Nicole", "Dr. Daniel", "Dr. Rachel", "Coach Brett", "Coach Tanya", "Coach Tyler", "Coach Nina", "Coach Derek", "Coach Alicia", "Coach Jason", "Coach Maria", "Coach Scott", "Coach Lisa", "Trainer Mike", "Trainer Jess", "Trainer Ryan", "Trainer Kate", "Trainer Dave", "Trainer Amy", "Trainer Ben", "Trainer Sara", "Trainer Nick", "Trainer Emma", "Yogi Ananda", "Yogi Priya", "Yogi Dev", "Yogi Lila", "Yogi Ram", "Yogi Sita", "Yogi Kavi", "Yogi Devi", "Yogi Om", "Yogi Tara"],
      lastNames: ["Vitale", "Wellness", "Health", "Thrive", "Restore", "Renew", "Heal", "Balance", "Flex", "Strength", "Power", "Endure", "Nurture", "Sustain", "Revive", "Recovery", "Resilient", "Vigor", "Stamina", "Energy", "Meridian", "Chakra", "Aura", "Zen", "Harmony", "Serenity", "Clarity", "Focus", "Calm", "Flow", "Peak", "Prime", "Elite", "Apex", "Summit", "Pinnacle", "Zenith", "Optimal", "Supreme", "Ultra", "Holistic", "Natural", "Organic", "Pure", "Clean", "Fresh", "Living", "Alive", "Active", "Strong"]
    },
    "Real Estate": {
      firstNames: ["Brandon", "Tiffany", "Marcus", "Chelsea", "Derek", "Savannah", "Travis", "Brittany", "Garrett", "Ashleigh", "Tucker", "Megan", "Hunter", "Lindsey", "Austin", "Courtney", "Brock", "Kayla", "Lance", "Brooke", "Preston", "Heather", "Grant", "Amber", "Clayton", "Lauren", "Blake", "Nicole", "Chase", "Danielle", "Tyler", "Rachel", "Cody", "Michelle", "Trent", "Stephanie", "Brett", "Jennifer", "Kyle", "Amanda", "Kent", "Melissa", "Bryce", "Christina", "Wade", "Sandra", "Troy", "Vanessa", "Curtis", "Diana"],
      lastNames: ["Property", "Realty", "Estate", "Manor", "Villa", "Castle", "Tower", "Heights", "Ridge", "Summit", "Crest", "Haven", "Meadow", "Prairie", "Ranch", "Lodge", "Harbor", "Landing", "Shores", "Bluff", "Canyon", "Valley", "Glen", "Dale", "Hollow", "Creek", "Spring", "Hill", "Terrace", "Plaza", "Court", "Commons", "Green", "Park", "Garden", "Gate", "Bridge", "Point", "Bay", "Cove", "Cape", "Isle", "Grove", "Orchard", "Field", "Wood", "Forest", "Lake", "River", "Pond"]
    },
    "Crypto": {
      firstNames: ["Satoshi", "Vitalik", "Gavin", "Charles", "Anatoly", "Do", "Sam", "Justin", "Changpeng", "Brian", "Jesse", "Michael", "Anthony", "Cathie", "Raoul", "Dan", "Hayden", "Andre", "Stani", "Robert", "Sergey", "Silvio", "Anatoly", "Haseeb", "Balaji", "Naval", "Chris", "Arthur", "Kyle", "Cobie", "Hsaka", "Loomdart", "GCR", "Tetranode", "DeFi", "Chad", "Alpha", "Sigma", "Wen", "Ser", "Anon", "Based", "Degen", "Whale", "Ape", "Moon", "Rekt", "Wagmi", "Ngmi", "Fren"],
      lastNames: ["Nakamoto", "Protocol", "Chain", "Block", "Hash", "Token", "Miner", "Validator", "Staker", "Yield", "Pool", "Farm", "Vault", "Bridge", "Oracle", "Node", "Gas", "Nonce", "Fork", "Merge", "Shard", "Layer", "Roll", "Proof", "Stake", "Work", "Swap", "Liquidity", "Margin", "Leverage", "Alpha", "Beta", "Signal", "Whale", "Bull", "Bear", "Moon", "Rekt", "Rug", "Pump", "Dump", "HODL", "FOMO", "FUD", "APY", "TVL", "DEX", "CEX", "DAO", "NFT"]
    },
    "Comedy": {
      firstNames: ["Marcus", "Tiffany", "Deshawn", "Jasmine", "Ricky", "Wanda", "Eddie", "Mo'Nique", "Martin", "Sherri", "Cedric", "Sommore", "Bernie", "Adele", "Steve", "Luenell", "Chris", "Leslie", "Kevin", "Tina", "Dave", "Amy", "Bill", "Sarah", "Jerry", "Chelsea", "Larry", "Whitney", "Ray", "Iliza", "Hannibal", "Nikki", "Jerrod", "Ali", "Anthony", "Hannah", "Pete", "Natasha", "John", "Fortune", "Trevor", "Michelle", "Hasan", "Taylor", "Bo", "Aisling", "Nate", "Bridget", "Deon", "Catherine"],
      lastNames: ["Funny", "Laughs", "Comedy", "Jokes", "Humor", "Wit", "Quips", "Puns", "Gags", "Bits", "Sketch", "Skit", "Roast", "Zing", "Jest", "Antic", "Caper", "Droll", "Farce", "Irony", "Parody", "Satire", "Spoof", "Mockery", "Banter", "Repartee", "Sass", "Snark", "Giggles", "Chuckles", "Howler", "Hoot", "Riot", "Scream", "Cackle", "Chortle", "Guffaw", "Snicker", "Crack", "Wisecrack", "Deadpan", "Slapstick", "Standup", "Improv", "Open", "Mic", "Stage", "Show", "Night", "Special"]
    },
    "Education": {
      firstNames: ["Professor", "Dr.", "Dean", "Scholar", "Lecturer", "Tutor", "Mentor", "Guide", "Teacher", "Coach", "Instructor", "Educator", "Academic", "Researcher", "Analyst", "Expert", "Specialist", "Authority", "Maven", "Guru", "Sage", "Savant", "Prodigy", "Genius", "Master", "Fellow", "Alumni", "Graduate", "Doctoral", "Post-Doc", "Marcus", "Elena", "James", "Sophia", "David", "Maria", "Robert", "Ana", "William", "Lucia", "Thomas", "Isabella", "Charles", "Carmen", "Richard", "Teresa", "Joseph", "Patricia", "Andrew", "Monica"],
      lastNames: ["Knowles", "Wisdom", "Scholar", "Learning", "Studies", "Academy", "Institute", "College", "University", "School", "Class", "Course", "Lesson", "Lecture", "Seminar", "Workshop", "Lab", "Library", "Archive", "Research", "Science", "Arts", "Letters", "Numbers", "Logic", "Reason", "Theory", "Practice", "Method", "System", "Framework", "Model", "Pattern", "Structure", "Design", "Blueprint", "Formula", "Equation", "Solution", "Discovery", "Innovation", "Progress", "Growth", "Development", "Curriculum", "Pedagogy", "Didactic", "Syllabus", "Thesis", "Discourse"]
    },
    "Lifestyle": {
      firstNames: ["Sage", "Willow", "River", "Meadow", "Autumn", "Summer", "Winter", "Spring", "Rain", "Sky", "Cloud", "Star", "Luna", "Sol", "Dawn", "Dusk", "Breeze", "Storm", "Ember", "Blaze", "Frost", "Coral", "Pearl", "Ruby", "Jade", "Ivy", "Fern", "Holly", "Clover", "Dahlia", "Violet", "Lily", "Rose", "Iris", "Jasmine", "Heather", "Laurel", "Olive", "Hazel", "Maple", "Aspen", "Cedar", "Birch", "Rowan", "Ash", "Oak", "Pine", "Reed", "Moss", "Stone"],
      lastNames: ["Wild", "Free", "Wander", "Roam", "Journey", "Path", "Trail", "Way", "Route", "Road", "Lane", "Drive", "Walk", "Step", "Pace", "Stride", "Leap", "Bound", "Soar", "Fly", "Float", "Drift", "Flow", "Stream", "Current", "Tide", "Wave", "Shore", "Coast", "Beach", "Harbor", "Haven", "Home", "Nest", "Den", "Retreat", "Refuge", "Sanctuary", "Oasis", "Paradise", "Bliss", "Joy", "Light", "Glow", "Shine", "Spark", "Flame", "Fire", "Warm", "Bright"]
    },
    "Politics": {
      firstNames: ["Senator", "Governor", "Mayor", "Councilmember", "Representative", "Commissioner", "Secretary", "Ambassador", "Delegate", "Speaker", "Chairman", "Director", "Analyst", "Strategist", "Advisor", "Commentator", "Correspondent", "Columnist", "Editor", "Publisher", "Marcus", "Victoria", "James", "Elizabeth", "Robert", "Catherine", "William", "Margaret", "Thomas", "Patricia", "Richard", "Eleanor", "Charles", "Dorothy", "Edward", "Virginia", "George", "Barbara", "Henry", "Florence", "Arthur", "Grace", "Frederick", "Helen", "Alexander", "Ruth", "Daniel", "Martha", "Benjamin", "Alice"],
      lastNames: ["Washington", "Jefferson", "Hamilton", "Madison", "Monroe", "Adams", "Jackson", "Lincoln", "Roosevelt", "Wilson", "Kennedy", "Reagan", "Clinton", "Obama", "Patriot", "Liberty", "Freedom", "Justice", "Democracy", "Republic", "Senate", "Capitol", "Congress", "Policy", "Reform", "Progress", "Change", "Action", "Campaign", "Ballot", "Vote", "Civic", "Union", "Federal", "State", "County", "District", "Borough", "Council", "Assembly", "Chamber", "Bench", "Court", "Law", "Order", "Rule", "Govern", "Lead", "Serve", "Pledge"]
    },
    "Media": {
      firstNames: ["Anderson", "Rachel", "Tucker", "Megyn", "Chris", "Savannah", "Lester", "Gayle", "Jake", "Norah", "Wolf", "Andrea", "Brian", "Robin", "Scott", "Hoda", "David", "Joy", "George", "Christiane", "Don", "Erin", "Sean", "Brooke", "Chuck", "Gwen", "Jose", "Maria", "Jorge", "Ana", "Shepard", "Dana", "Brett", "Sandra", "Neil", "Margaret", "Peter", "Judy", "Tim", "Amy", "Kaitlan", "Abby", "Jonathan", "Nicolle", "Bret", "Martha", "Alex", "Jen", "Phil", "Stephanie"],
      lastNames: ["Anchor", "Report", "News", "Broadcast", "Press", "Wire", "Beat", "Desk", "Bureau", "Network", "Channel", "Studio", "Stream", "Feed", "Live", "Breaking", "Alert", "Update", "Flash", "Bulletin", "Headline", "Story", "Article", "Column", "Editorial", "Feature", "Scoop", "Source", "Leak", "Tip", "Lead", "Angle", "Spin", "Frame", "Lens", "Focus", "Zoom", "Shot", "Clip", "Reel", "Tape", "Print", "Ink", "Type", "Font", "Copy", "Draft", "Proof", "Layout", "Page"]
    },
  };

  const FOLLOWER_COUNTS = [
    "1.2K", "2.5K", "3.8K", "5K", "7.2K", "10K", "12.5K", "15K", "18K", "22K",
    "25K", "30K", "35K", "42K", "50K", "65K", "75K", "85K", "95K", "100K",
    "120K", "150K", "180K", "200K", "250K", "300K", "350K", "400K", "500K", "600K",
    "750K", "800K", "900K", "1M", "1.2M", "1.5M", "1.8M", "2M", "2.5M", "3M",
    "3.5M", "4M", "5M", "6M", "7.5M", "8M", "10M", "12M", "15M", "20M",
    "25M", "30M", "40M", "50M", "75M", "100M", "150M", "200M",
  ];

  const INFLUENCER_CATEGORIES = [
    "Business", "Finance", "Motivation", "Tech", "Entertainment",
    "Sports", "Music", "Fashion", "Health", "Real Estate",
    "Crypto", "Comedy", "Education", "Lifestyle", "Politics", "Media"
  ];

  function generateInfluencerPost(): {
    id: string;
    influencerName: string;
    handle: string;
    category: string;
    verified: boolean;
    followers: string;
    content: string;
    contentType: string;
    image: string | null;
    timestamp: string;
  } {
    const useNamedProfile = Math.random() < 0.3;

    let name: string;
    let handle: string;
    let category: string;
    let verified: boolean;
    let followers: string;
    let content: string;

    if (useNamedProfile && NAMED_INFLUENCER_PROFILES.length > 0) {
      const profile = NAMED_INFLUENCER_PROFILES[Math.floor(Math.random() * NAMED_INFLUENCER_PROFILES.length)];
      name = profile.name;
      handle = profile.handle;
      category = profile.category;
      verified = profile.verified;
      followers = profile.followers;
      content = profile.posts[Math.floor(Math.random() * profile.posts.length)];
    } else {
      category = INFLUENCER_CATEGORIES[Math.floor(Math.random() * INFLUENCER_CATEGORIES.length)];
      const nameData = INFLUENCER_NAMES_BY_CATEGORY[category];
      const firstName = nameData.firstNames[Math.floor(Math.random() * nameData.firstNames.length)];
      const lastName = nameData.lastNames[Math.floor(Math.random() * nameData.lastNames.length)];
      name = `${firstName} ${lastName}`;
      handle = `@${firstName.toLowerCase().replace(/[^a-z]/g, "")}${lastName.toLowerCase().replace(/[^a-z]/g, "")}${Math.floor(Math.random() * 99)}`;
      verified = Math.random() < 0.4;
      followers = FOLLOWER_COUNTS[Math.floor(Math.random() * FOLLOWER_COUNTS.length)];
      const templates = INFLUENCER_CATEGORY_TEMPLATES[category];
      content = templates[Math.floor(Math.random() * templates.length)];
    }

    const contentTypeRoll = Math.random();
    let contentType: string;
    let image: string | null = null;

    if (contentTypeRoll < 0.3) {
      contentType = "video";
      const fakeVideoIds = [
        "dQw4w9WgXcQ", "jNQXAC9IVRw", "kJQP7kiw5Fk", "9bZkp7q19f0",
        "OPf0YbXqDm0", "JGwWNGJdvx8", "RgKAFK5djSk", "CevxZvSJLk8",
        "fJ9rUzIMcZQ", "60ItHLz5WEA", "hT_nvWreIhg", "YQHsXMglC9A",
        "pRpeEdMmmQ0", "kXYiU_JCYtU", "FTQbiNvZqaY", "2Vv-BfVoq4g",
        "HKlA5YjS6F0", "BaW_jenozKc", "Lrj2Hq7xqQ8", "nfWlot6h_JM"
      ];
      const videoId = fakeVideoIds[Math.floor(Math.random() * fakeVideoIds.length)];
      image = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
    } else if (contentTypeRoll < 0.6) {
      contentType = "photo";
      const gradients = [
        "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
        "linear-gradient(135deg, #f093fb 0%, #f5576c 100%)",
        "linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)",
        "linear-gradient(135deg, #43e97b 0%, #38f9d7 100%)",
        "linear-gradient(135deg, #fa709a 0%, #fee140 100%)",
        "linear-gradient(135deg, #a18cd1 0%, #fbc2eb 100%)",
        "linear-gradient(135deg, #ffecd2 0%, #fcb69f 100%)",
        "linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%)",
        "linear-gradient(135deg, #89f7fe 0%, #66a6ff 100%)",
        "linear-gradient(135deg, #fddb92 0%, #d1fdff 100%)",
      ];
      image = gradients[Math.floor(Math.random() * gradients.length)];
    } else {
      contentType = "text";
      image = null;
    }

    const now = Date.now();
    const jitter = Math.floor(Math.random() * 60000);

    return {
      id: `inf-${now}-${Math.random().toString(36).slice(2, 8)}`,
      influencerName: name,
      handle,
      category,
      verified,
      followers,
      content,
      contentType,
      image,
      timestamp: new Date(now - jitter).toISOString(),
    };
  }

  const influencerPostsCache: ReturnType<typeof generateInfluencerPost>[] = [];

  function startInfluencerPostEngine() {
    for (let i = 0; i < 50; i++) {
      influencerPostsCache.push(generateInfluencerPost());
    }
    console.log(`Influencer post engine started with ${influencerPostsCache.length} initial posts`);

    setInterval(() => {
      influencerPostsCache.push(generateInfluencerPost());
      if (influencerPostsCache.length > 100) {
        influencerPostsCache.shift();
      }
    }, 2000);
  }

  setTimeout(() => startInfluencerPostEngine(), 2000);

  app.get("/api/influencer-posts", (_req, res) => {
    try {
      const sorted = [...influencerPostsCache]
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 50);
      res.json({ posts: sorted, total: influencerPostsCache.length });
    } catch (error) {
      console.error("Influencer posts error:", error);
      res.status(500).json({ error: "Failed to load influencer posts" });
    }
  });

  // Bot posting engine - generates a new community post every 2 seconds
  const BOT_POST_TEMPLATES = [
    "Just finished reading 'Think and Grow Rich' for the 5th time. Every read reveals something new. Never stop learning 📚",
    "The difference between a dreamer and a doer is action. What did you DO today to get closer to your goals?",
    "Closed my first real estate deal today! MentXr® helped me build the confidence. Grateful for this community 🏠",
    "Stop waiting for the perfect moment. Start now, adjust later. Progress > perfection.",
    "Had an amazing session with the AI mentors today. The advice on scaling my business was exactly what I needed.",
    "Your network is your net worth. Who are you surrounding yourself with?",
    "Revenue hit $10K/month for the first time! Started from zero 8 months ago. Keep grinding 💪",
    "Reminder: Your 9-5 is funding your 5-9. Use those hours wisely.",
    "Just uploaded my credit report and got actionable insights in seconds. This platform is incredible.",
    "The best investment you can make is in yourself. Period.",
    "Failed 3 times before getting it right. Failure isn't the opposite of success—it's part of it.",
    "Morning routine: Wake up, gratitude journal, MentXr® session, then attack the day. What's yours?",
    "If you're the smartest person in the room, you're in the wrong room.",
    "Started my LLC today! One step closer to financial freedom 🎯",
    "Cash flow > salary. Learn the difference and change your life.",
    "Don't tell people your plans. Show them your results.",
    "Investing in index funds since 2023. Compound interest is real magic ✨",
    "The market doesn't care about your feelings. Learn to be data-driven.",
    "Hired my first employee today. Scaling is real when you delegate.",
    "Your habits determine your future. What habit are you building this month?",
    "NovaSage247's advice on this app hit different. 10X is a mindset, not just a number.",
    "Passive income update: $2,400/month from rental properties. Started with one unit.",
    "Stop scrolling, start building. Your future self will thank you.",
    "Negotiated a 30% raise today using tips from the LunarPeak303 session. Know your worth!",
    "Building generational wealth isn't optional—it's a responsibility.",
    "Credit score went from 580 to 740 in 14 months. Education + discipline = results.",
    "Read 52 books this year. Knowledge compounds faster than money.",
    "Side hustle turned main hustle. Quit my job last month. Scary but worth it 🚀",
    "The BlazeEcho512 sessions on social media marketing are gold. Grew my following 300% this quarter.",
    "Debt-free as of today! Took 3 years of discipline but we made it 🎉",
    "Your mindset is your most powerful asset. Protect it daily.",
    "Just got approved for my first business loan. Let's go! 🏦",
    "AlphaVolt889's compound interest lesson on here changed my perspective forever.",
    "Accountability partners > motivation. Find someone who won't let you slack.",
    "Launched my e-commerce store. First sale within 48 hours!",
    "Financial literacy should be taught in every school. Spreading the word through MentXr®",
    "Woke up to $500 in passive income. Systems over effort.",
    "IronFlux771's session on overcoming fear of failure was exactly what I needed today.",
    "Don't save what's left after spending. Spend what's left after saving.",
    "Closed a $50K deal using negotiation tactics I learned here. This community is the real deal.",
    "Your credit score is your financial GPA. Treat it accordingly.",
    "Year 1: survived. Year 2: stabilized. Year 3: scaled. Keep going.",
    "The ZenCipher108 session on financial literacy opened my eyes. Knowledge truly is the key 🔑",
    "Stop trading time for money. Build systems that work while you sleep.",
    "Invested in Bitcoin at $30K. Patience is a superpower in investing.",
    "Just hit 100 sessions on MentXr®. The growth has been insane.",
    "Real estate, stocks, crypto, business—diversify your income streams.",
    "SteelWraith666's real talk session was the wake-up call I needed. No more excuses.",
    "Budgeting isn't restricting. It's telling your money where to go instead of wondering where it went.",
    "First $1M in revenue this year. It started with a single conversation on this app.",
  ];

  let botUserIds: number[] = [];

  async function startBotPostingEngine() {
    try {
      botUserIds = await storage.getRandomBotUserIds(200);
      if (botUserIds.length === 0) {
        console.log("No bot users found, skipping bot posting engine");
        return;
      }
      console.log(`Bot posting engine started with ${botUserIds.length} bot users`);

      setInterval(async () => {
        try {
          const randomUserId = botUserIds[Math.floor(Math.random() * botUserIds.length)];
          const randomContent = BOT_POST_TEMPLATES[Math.floor(Math.random() * BOT_POST_TEMPLATES.length)];
          const randomLikes = Math.floor(Math.random() * 150) + 1;
          await storage.createPost({ userId: randomUserId, content: randomContent, likes: randomLikes });
        } catch (err) {
          console.error("Bot post error:", err);
        }
      }, 2000);
    } catch (err) {
      console.error("Failed to start bot posting engine:", err);
    }
  }

  setTimeout(() => startBotPostingEngine(), 3000);

  app.get("/api/posts", requireAuth, async (_req, res) => {
    try {
      const recentPosts = await storage.getRecentPosts(50);
      const userIds = [...new Set(recentPosts.map(p => p.userId))];
      const userMap: Record<number, { email: string }> = {};
      for (const uid of userIds) {
        const u = await storage.getUser(uid);
        if (u) userMap[uid] = { email: u.email };
      }
      const postsWithUsers = recentPosts.map(p => ({
        ...p,
        userEmail: userMap[p.userId]?.email || "anonymous@mentxr.com",
      }));
      res.json({ posts: postsWithUsers });
    } catch (error) {
      console.error("Posts error:", error);
      res.status(500).json({ error: "Failed to load posts" });
    }
  });

  app.get("/api/stats", async (_req, res) => {
    try {
      const result = await storage.getUserCount();
      res.json({ totalUsers: result, activeNow: Math.floor(result * 0.03) + Math.floor(Math.random() * 20) + 5 });
    } catch (error) {
      res.json({ totalUsers: 0, activeNow: 0 });
    }
  });

  return httpServer;
}
