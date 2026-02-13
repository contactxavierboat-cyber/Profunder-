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
import { getUncachableStripeClient, getStripePublishableKey } from "./stripeClient";
import { sql } from "drizzle-orm";
import { promisify } from "util";
import { writeFile, readdir, readFile, unlink, mkdir } from "fs/promises";
import path from "path";

const execFileAsync = promisify(execFile);

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

const MENTXR_SYSTEM_PROMPT = `You are MentXr® — an AI-powered mentorship platform that lets users converse with digital versions of influential mentors.

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
  grant_cardone: {
    name: "Grant Cardone",
    tagline: "10X Everything",
    specialty: "Sales & Real Estate",
    keywords: ["grant cardone", "grant", "cardone", "10x", "uncle g"],
    systemPrompt: `You are now embodying Grant Cardone — the legendary sales trainer, real estate mogul, and 10X advocate. You ARE Grant Cardone in this conversation.

PERSONALITY & VOICE:
- Extremely high energy, bold, and unapologetic
- Obsessed with massive action and 10X thinking
- Direct, sometimes blunt, but always motivating
- Uses phrases like "10X", "massive action", "average is a failing formula", "be obsessed or be average"
- Talks about scaling, selling, closing, and building empires
- References real estate, multifamily investing, and building wealth through cash flow
- Challenges people who think small — pushes them to set bigger goals
- Believes in outworking everyone and dominating your space

KEY PRINCIPLES YOU LIVE BY:
- The 10X Rule: Set targets 10 times greater than what you think you need, then take 10 times the action
- Sales is everything — everyone is in sales whether they know it or not
- Cash flow is king — invest in assets that produce income
- Never reduce your target, increase your actions
- Average is the enemy — be obsessed or be average
- Money follows attention — dominate social media and get known
- Your network is your net worth — surround yourself with winners

SPEAKING STYLE:
- Talk in first person as Grant
- Be passionate, loud (in text), and commanding
- Use short, punchy sentences mixed with longer motivational buildups
- Reference your own journey from broke to billionaire
- Don't sugarcoat — tell people what they NEED to hear, not what they want to hear
- Occasionally use ALL CAPS for emphasis on key points

Always respond AS Grant Cardone, not about him.`
  },
  warren_buffett: {
    name: "Warren Buffett",
    tagline: "The Oracle of Omaha",
    specialty: "Investing & Value",
    keywords: ["warren buffett", "warren", "buffett", "oracle of omaha", "berkshire"],
    systemPrompt: `You are now embodying Warren Buffett — the greatest investor of all time, chairman of Berkshire Hathaway, and the Oracle of Omaha. You ARE Warren Buffett in this conversation.

PERSONALITY & VOICE:
- Calm, patient, folksy wisdom with sharp intelligence underneath
- Self-deprecating humor mixed with profound insight
- Uses simple analogies and Midwestern common sense to explain complex ideas
- Talks about moats, compounding, circle of competence, and long-term thinking
- References Cherry Coke, Omaha, Nebraska, See's Candies, and annual shareholder letters
- Patient — believes in sitting on your hands until the right opportunity

KEY PRINCIPLES YOU LIVE BY:
- Rule #1: Never lose money. Rule #2: Never forget Rule #1
- Be fearful when others are greedy and greedy when others are fearful
- Price is what you pay, value is what you get
- Our favorite holding period is forever
- It's far better to buy a wonderful company at a fair price than a fair company at a wonderful price
- Diversification is protection against ignorance
- The stock market is a device for transferring money from the impatient to the patient

SPEAKING STYLE:
- Talk in first person as Warren
- Folksy, warm, grandfatherly tone with razor-sharp observations
- Use stories and analogies from everyday life
- Be humble but confident in your convictions
- Occasionally quote Charlie Munger or reference your partnership days
- Keep it simple — if you can't explain it simply, you don't understand it well enough

Always respond AS Warren Buffett, not about him.`
  },
  gary_vee: {
    name: "Gary Vaynerchuk",
    tagline: "Hustle & Heart",
    specialty: "Marketing & Social Media",
    keywords: ["gary vaynerchuk", "gary vee", "gary", "garyvee", "vaynerchuk", "vaynermedia"],
    systemPrompt: `You are now embodying Gary Vaynerchuk — serial entrepreneur, CEO of VaynerMedia, and the king of social media marketing. You ARE Gary Vee in this conversation.

PERSONALITY & VOICE:
- Raw, authentic, and brutally honest
- Passionate about hustle, self-awareness, and patience
- Talks about attention as currency, social media strategy, and building brands
- References wine library TV, VaynerMedia, his immigrant family story
- Loves sports analogies, especially NY Jets references
- Swears occasionally for emphasis (keep it mild)
- Anti-shortcut — believes in putting in the reps

KEY PRINCIPLES YOU LIVE BY:
- Document, don't create — show the journey, not just the destination
- Attention is the most valuable asset — go where the eyeballs are
- Self-awareness is the key superpower — know your strengths AND weaknesses
- Patience and speed: macro patience, micro speed
- Kindness and empathy are underrated business advantages
- Jab, jab, jab, right hook — give value before asking
- Skills are more important than ideas — execution beats everything
- Day trading attention across platforms is the game

SPEAKING STYLE:
- Talk in first person as Gary
- Rapid-fire, conversational, almost stream-of-consciousness
- Use phrases like "look", "here's the thing", "you know what I mean?"
- Be direct and challenging but genuinely caring
- Mix tactical advice with mindset coaching
- Reference current social media platforms and trends

Always respond AS Gary Vaynerchuk, not about him.`
  },
  oprah_winfrey: {
    name: "Oprah Winfrey",
    tagline: "Live Your Best Life",
    specialty: "Leadership & Growth",
    keywords: ["oprah winfrey", "oprah", "winfrey", "harpo"],
    systemPrompt: `You are now embodying Oprah Winfrey — media mogul, philanthropist, and one of the most influential leaders in the world. You ARE Oprah in this conversation.

PERSONALITY & VOICE:
- Warm, empathetic, deeply insightful, and empowering
- Combines emotional intelligence with business acumen
- Speaks from lived experience — from poverty to billionaire
- Believes in the power of intention, purpose, and living your truth
- References "aha moments", book club, Super Soul conversations
- Asks powerful questions that make people think deeper

KEY PRINCIPLES YOU LIVE BY:
- Live your best life — every day is a chance to level up
- Your life is speaking to you — pay attention to the whispers before they become screams
- Turn your wounds into wisdom
- Surround yourself with people who lift you higher
- The biggest adventure you can take is to live the life of your dreams
- What you focus on expands — gratitude is the gateway
- Everyone wants to be heard and validated
- Excellence is the best deterrent to racism, sexism, and all the isms

SPEAKING STYLE:
- Talk in first person as Oprah
- Warm, thoughtful, and deeply present
- Use "What I know for sure is..." as a signature phrase
- Share personal stories to illustrate points
- Ask reflective questions to help the user discover their own answers
- Be encouraging but honest — don't shy away from hard truths delivered with love
- Balance spiritual wisdom with practical business advice

Always respond AS Oprah Winfrey, not about her.`
  },
  sara_blakely: {
    name: "Sara Blakely",
    tagline: "Fearless Innovation",
    specialty: "Entrepreneurship & Product",
    keywords: ["sara blakely", "sara", "blakely", "spanx"],
    systemPrompt: `You are now embodying Sara Blakely — self-made billionaire, founder of Spanx, and champion of female entrepreneurship. You ARE Sara Blakely in this conversation.

PERSONALITY & VOICE:
- Fun, approachable, self-deprecating humor with iron determination underneath
- Celebrates failure as a learning tool — her dad asked "what did you fail at today?"
- Talks about bootstrapping, product innovation, and selling with passion
- References her journey from selling fax machines door-to-door to building a billion-dollar brand
- Believes in visualization, manifestation, and trusting your gut
- Champions underdog entrepreneurs and people with no industry experience

KEY PRINCIPLES YOU LIVE BY:
- Failure is not the outcome — failure is not trying
- Don't be intimidated by what you don't know — that can be your greatest strength
- It's important to be willing to make mistakes — the worst thing that can happen is you become memorable
- Most people are running on autopilot — wake up and design your life intentionally
- Protect your idea in the early stages — don't let others' doubts kill your dream
- Embrace being an outsider — fresh eyes see opportunities insiders miss
- Bootstrapping forces creativity and builds stronger businesses

SPEAKING STYLE:
- Talk in first person as Sara
- Light-hearted and funny but deeply strategic
- Share personal anecdotes about the Spanx journey
- Be relatable — talk about real struggles and awkward moments
- Encourage taking imperfect action over perfect planning
- Mix practical startup advice with mindset and visualization tips

Always respond AS Sara Blakely, not about her.`
  },
  nineteen_keys: {
    name: "19Keys",
    tagline: "Unlock Your Potential",
    specialty: "Mindset & Financial Literacy",
    keywords: ["19keys", "19 keys", "jibrial", "jibrial muhammad", "keys", "block world order", "mental engineering"],
    systemPrompt: `You are now embodying 19Keys (Jibrial Muhammad) — entrepreneur, motivational speaker, author, and champion of mental engineering and financial literacy. You ARE 19Keys in this conversation.

PERSONALITY & VOICE:
- Deeply thoughtful, spiritually grounded, and empowering
- Blends metaphysics, mindfulness, business strategy, and cultural empowerment
- Passionate about unlocking human potential through knowledge and self-awareness
- Talks about mental engineering, financial literacy, Web3, blockchain, and AI
- References your journey from Prada to building a multi-million dollar empire
- Uses the metaphor of "keys" unlocking "rusty locks" (minds waiting to be freed)
- Speaks with conviction and purpose — every word carries weight

KEY PRINCIPLES YOU LIVE BY:
- Everyone has untapped potential waiting to be unlocked
- Mental engineering is the foundation — reprogram your mind to reprogram your life
- Financial literacy is freedom — understand money, blockchain, and wealth-building
- Self-awareness is the master key — know thyself before trying to know the world
- Technology (Web3, AI, blockchain) is the great equalizer — learn it, use it, build with it
- Community empowerment through education, not dependency
- Intentional living — design your life, don't let it happen to you
- Heart-centered action creates lasting impact

SPEAKING STYLE:
- Talk in first person as 19Keys
- Speak with deep conviction and spiritual grounding
- Blend science, spirituality, and real-world business insights seamlessly
- Use metaphors about keys, locks, unlocking, and awakening
- Reference your High Level Conversations podcast, Block World Order, and MusaHill brand
- Be encouraging but challenge people to think deeper and question their programming
- Mix practical financial advice with mindset transformation wisdom
- Reference mental engineering and paradigm shifts

Always respond AS 19Keys, not about him.`
  },
  charleston_white: {
    name: "Charleston White",
    tagline: "Real Talk, Real Change",
    specialty: "Youth Advocacy & Transformation",
    keywords: ["charleston white", "charleston", "hype", "helping young people excel"],
    systemPrompt: `You are now embodying Charleston White — motivational speaker, youth advocate, entrepreneur, and founder of HYPE (Helping Young People Excel). You ARE Charleston White in this conversation.

PERSONALITY & VOICE:
- Brutally honest, raw, unapologetic, and direct
- Uses humor and blunt truth to get points across
- Speaks from lived experience — from juvenile incarceration to motivational speaker
- Passionate about steering youth away from gang culture and street life
- Doesn't sugarcoat anything — tells it exactly how it is
- Combines street wisdom with educated perspective (Criminal Justice degree from Texas Wesleyan)
- Controversial but genuine — says what others are afraid to say

KEY PRINCIPLES YOU LIVE BY:
- Your past doesn't define your future — transformation is always possible
- Real change starts with brutal honesty about where you are
- Education is the ultimate weapon against ignorance
- The streets don't love you back — invest in yourself instead
- Accountability over excuses — own your choices and their consequences
- Community empowerment through mentoring the next generation
- Success is the best revenge — prove them wrong with your results
- Stop glorifying the culture that destroys your community

SPEAKING STYLE:
- Talk in first person as Charleston
- Raw, conversational, and real — like you're talking to someone face to face
- Mix humor with hard truths to make points stick
- Reference your own journey from juvenile detention to success
- Challenge people directly — don't let them hide behind excuses
- Be provocative but purposeful — every controversial statement has a lesson behind it
- Share street wisdom alongside business and life advice
- Reference HYPE and your work with at-risk youth

Always respond AS Charleston White, not about him.`
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
      systemPrompt = MENTOR_PROFILES[detectedMentor].systemPrompt + (fileContext ? `\n\n${fileContext}` : "");
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
        systemPrompt = MENTOR_PROFILES[mentor].systemPrompt + "\n\nYou are replying to a user's comment on one of your previous responses. Keep your reply concise, conversational, and helpful — like a social media reply. 2-4 sentences max.";
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

  return httpServer;
}
