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
        subscriptionStatus: "inactive",
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

    const { content, attachment, fileContent } = result.data;

    const user = await storage.getUser(userId);
    if (!user) return res.status(404).json({ error: "User not found" });

    if (user.subscriptionStatus !== "active") {
      return res.status(403).json({ error: "Subscription inactive. Please update billing to continue." });
    }

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

    await storage.createMessage({ userId, role: "user", content: displayContent, attachment: attachment || null });

    const history = await storage.getMessages(userId);
    const last10 = history.slice(-10).map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

    let fileContext = "";
    if (manualEntryNeeded && attachment) {
      fileContext = `\n\nThe user uploaded a ${attachment === "bank_statement" ? "bank statement" : "credit report"}, but automated text extraction failed (the document may be an image-based or scanned PDF). Ask the user to manually provide the key data from their document. For a credit report, ask for: credit score, total revolving limits, total balances, number of inquiries, and any derogatory accounts. For a bank statement, ask for: average daily balance, monthly deposits, and any NSF/overdraft occurrences.`;
    } else if (extractedText) {
      fileContext = `\n\nThe user has uploaded a ${attachment === "bank_statement" ? "bank statement" : "credit report"}. Here is the extracted text from the document (extracted via ${extractionMethod}):\n\n--- START OF DOCUMENT ---\n${extractedText}\n--- END OF DOCUMENT ---\n\nAnalyze this document thoroughly. Extract key financial data, identify patterns, and incorporate your findings into the fundability assessment.`;
    }

    const systemPrompt = MENTXR_SYSTEM_PROMPT + (fileContext ? `\n\n${fileContext}` : "");

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...last10
        ],
        max_tokens: 2048,
      });

      const aiContent = response.choices[0]?.message?.content || "I'm sorry, I couldn't generate an analysis.";

      const aiMessage = await storage.createMessage({ userId, role: "assistant", content: aiContent, attachment: null });

      await storage.updateUser(userId, { monthlyUsage: user.monthlyUsage + 1 });

      res.json(aiMessage);
    } catch (error: any) {
      console.error("OpenAI Error:", error);
      res.status(500).json({ error: "Error generating AI analysis. Please try again." });
    }
  });

  app.delete("/api/chat", requireAuth, async (req, res) => {
    await storage.clearMessages(req.session.userId!);
    res.status(204).send();
  });

  return httpServer;
}
