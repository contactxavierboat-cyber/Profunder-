import type { Express, Request, Response, NextFunction } from "express";
import type { Server } from "http";
import { storage } from "./storage";
import { z } from "zod";
import OpenAI from "openai";
import session from "express-session";
import MemoryStore from "memorystore";
// @ts-ignore
import PDFParser from "pdf2json";

const openai = new OpenAI({
  apiKey: process.env.AI_INTEGRATIONS_OPENAI_API_KEY,
  baseURL: process.env.AI_INTEGRATIONS_OPENAI_BASE_URL,
});

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

  app.post("/api/subscribe", requireAuth, async (req, res) => {
    const user = await storage.getUser(req.session.userId!);
    if (!user) return res.status(404).json({ error: "User not found" });
    const updated = await storage.updateUser(user.id, { subscriptionStatus: "active" });
    res.json(stripPassword(updated));
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
    if (fileContent && attachment) {
      try {
        const isPdf = fileContent.length > 100 && !fileContent.includes("\n");
        if (isPdf) {
          const buffer = Buffer.from(fileContent, "base64");
          extractedText = await new Promise<string>((resolve, reject) => {
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
                  const sortedYs = [...lineMap.keys()].sort((a, b) => a - b);
                  for (const y of sortedYs) {
                    const items = lineMap.get(y)!.sort((a, b) => a.x - b.x);
                    const lineText = items.map(i => i.text).join("  ");
                    if (lineText.trim()) lines.push(lineText.trim());
                  }
                  lines.push("---");
                }
                const fullText = lines.join("\n");
                console.log(`PDF extracted ${fullText.length} chars from ${pages.length} pages`);
                resolve(fullText.slice(0, 30000));
              } catch (e) {
                const rawText = pdfParser.getRawTextContent();
                const decoded = decodeURIComponent(rawText);
                console.log(`PDF fallback extracted ${decoded.length} chars`);
                resolve(decoded.slice(0, 30000));
              }
            });
            pdfParser.on("pdfParser_dataError", (errData: any) => {
              reject(new Error(errData.parserError || "PDF parse failed"));
            });
            pdfParser.parseBuffer(buffer);
          });
        } else {
          extractedText = fileContent.slice(0, 30000);
        }
      } catch (err) {
        console.error("File parsing error:", err);
        extractedText = "[Could not extract text from uploaded file]";
      }
    }

    const displayContent = extractedText
      ? `${content}\n\n[Attached ${attachment === "bank_statement" ? "Bank Statement" : "Credit Report"} - ${extractedText.length} chars extracted]`
      : content;

    await storage.createMessage({ userId, role: "user", content: displayContent, attachment: attachment || null });

    const history = await storage.getMessages(userId);
    const last10 = history.slice(-10).map(m => ({ role: m.role as "user" | "assistant", content: m.content }));

    let fileContext = "";
    if (extractedText) {
      fileContext = `\n\nThe user has uploaded a ${attachment === "bank_statement" ? "bank statement" : "credit report"}. Here is the extracted text from the document:\n\n--- START OF DOCUMENT ---\n${extractedText}\n--- END OF DOCUMENT ---\n\nAnalyze this document thoroughly. Extract key financial data, identify patterns, and incorporate your findings into the fundability assessment.`;
    }

    const systemPrompt = `You are the Start-Up Studio® AI, a digital underwriting expert.
Evaluate the user's fundability based on their profile and the 3-phase system: Structure, Scale, Sequence.

User Profile:
- Credit Score: ${user.creditScoreRange || "Not provided"}
- Revolving Limit: $${user.totalRevolvingLimit || 0}
- Balances: $${user.totalBalances || 0}
- Inquiries: ${user.inquiries || 0}
- Derogatory Accounts: ${user.derogatoryAccounts || 0}
- Has Credit Report: ${user.hasCreditReport ? "Yes" : "No"}
- Has Bank Statement: ${user.hasBankStatement ? "Yes" : "No"}${fileContext}

Always structure your response with these sections:
**Fundability Phase:** (Structure, Scale, or Sequence)
**Fundability Index Score:** (0–100)
**Key Findings:** (bullet points)
**Phase-Based Plan:** (actionable steps)
**Timeline Estimate:** (realistic timeframe)
**Funding Multiplier:** (if eligible, explain)
**Funding Status Snapshot:** (brief summary)
**Next Move:** (immediate next action)`;

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
