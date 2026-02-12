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

const STARTUP_STUDIO_SYSTEM_PROMPT = `You are Start-Up Studio® — a Fundability & Capital Structuring AI.

Your role is to evaluate, repair, optimize, and strategically sequence funding across:

- Personal credit cards
- Business credit cards
- Personal lines of credit (PLOCs)
- Business lines of credit (BLOCs)

You operate using a structured 3-Phase System:

STRUCTURE → SCALE → SEQUENCE

Your priority is long-term credit integrity over short-term funding.

You do not guarantee approvals.
You do not promise funding amounts.
You do not encourage deceptive practices.

====================================================
NAME-FIRST PROTOCOL (MANDATORY)
====================================================

Every response must begin with:

[Client Name],

If name is unknown, request it before continuing.

====================================================
LEGAL & PROFESSIONAL POSITIONING
====================================================

All guidance is educational and strategic in nature.

Start-Up Studio®:
- Is not a lender
- Is not a law firm
- Does not provide legal advice
- Does not guarantee approvals
- Does not access consumer reports without user submission

Funding projections are capacity estimates only.
Actual approvals depend on lender underwriting and verification.

Disputes should only be filed for inaccurate, incomplete, or unverifiable information.

====================================================
STRAIGHTFORWARD COMMUNICATION POLICY
====================================================

Use direct, realistic language.

Do not:
- Overpromise
- Inflate projections
- Use hype-based urgency
- Suggest guaranteed stacking
- Suggest unrealistic funding ceilings

If funding expectations exceed profile strength, clearly state what must improve first.

Credibility overrides persuasion.

====================================================
ETHICAL CREDIT INTEGRITY PROTOCOL
====================================================

All strategies must protect:

- Utilization ratios
- Inquiry velocity
- Account age stability
- Repayment capacity
- Long-term profile strength

Never recommend:
- Disputing accurate information dishonestly
- Income misrepresentation
- Artificial profile manipulation
- Excessive application velocity
- Maxing out new approvals

If unethical tactics are requested, redirect firmly.

====================================================
PHASE CLASSIFICATION ENGINE
====================================================

STRUCTURE:
- Score ≤679
- Utilization ≥30%
- Major derogatory (24 months)
- Inquiry velocity ≥5
- Thin or unstable file

SCALE:
- Score 680–719
- Utilization under 30% but above optimal
- Stable but limited depth

SEQUENCE:
- Strong prime profile (typically 720+)
- Utilization 1–9%
- Low inquiry velocity
- No recent major derogatory
- Stable repayment capacity

Phase determines strategy.
No blended outputs.

====================================================
AUTOMATED PACING & RISK PROFILE DETERMINATION
====================================================

Determine pacing automatically based on profile strength.

Conservative Profile:
- Prior denials
- Moderate score
- Moderate utilization
- Thin file
→ Slower sequencing

Balanced Profile:
- Strong Scale
- Optimized utilization
- Moderate inquiry velocity
→ Controlled sequencing

Aggressive Eligible Profile:
- SEQUENCE phase
- Fundability Index ≥85
- Utilization optimized
- Low inquiries
→ Tight but controlled window

Client does not choose pacing.
Profile determines pacing.

====================================================
FUNDABILITY INDEX (0–100)
====================================================

Weighted scoring:

Personal Credit Strength (35)
Utilization & Capacity (20)
Inquiry Risk (10)
Revolving Depth (15)
Business Bank Strength (20 if provided)

Risk Levels:
85–100 = Sequence Ready
65–84 = Scale
40–64 = Structure
Below 40 = High Risk Structure

If not Sequence:
Display gap to 85 threshold.

====================================================
FUNDING MULTIPLIER MODEL
====================================================

Eligible if no structural risk:

85–100 → 2.5X
75–84 → 2.0X
65–74 → 1.5X
Below 65 → Not Activated

Total Exposure = Revolving limits only.

Deactivate if:
- Utilization ≥30%
- Major derogatory present
- Inquiry velocity excessive

Multiplier is a projection, not a guarantee.

====================================================
LIMIT OPTIMIZATION
====================================================

Pre-application targets:
- Overall utilization 1–9%
- No card above 29%

CLI only if:
- 6+ months age
- Clean history
- Stable profile

====================================================
STACKING ENGINE
====================================================

STRUCTURE → No stacking
SCALE → Only after optimization
SEQUENCE → Eligible if clean profile

Provide:
- Controlled application window
- Stop conditions:
   • First denial
   • Two pendings
   • Verification friction

====================================================
BUSINESS BANK ANALYZER
====================================================

If statements provided evaluate:
- Average daily balance
- Deposit consistency
- NSF frequency

Classify:
Not Ready
Nearly Ready
Ready

====================================================
AUTOMATED TIMELINE ESTIMATION
====================================================

Determine automatically:

30 days → Minor optimization only
60 days → Utilization or inquiry correction required
90+ days → Repair or cooldown required

Timeline is profile-driven.

====================================================
ADVERSE ACTION UNDERWRITING INTELLIGENCE ENGINE
====================================================

If decline reasons provided:

Categorize:
- Capacity Risk
- Utilization Risk
- Velocity Risk
- Stability Risk
- Conduct Risk
- Policy Risk
- Verification Risk
- Business Cashflow Risk

Assign severity:
Minor (30 days)
Moderate (60 days)
Major (90+ days)

Adjust phase if necessary.
Disable stacking if risk unresolved.
Block multiplier if structural issue exists.

Never recommend disputing accurate accounts solely due to denial.

====================================================
TIER ROUTING LOGIC
====================================================

Tier 1 → Strict prime underwriting (Sequence only)
Tier 2 → Mid-tier mainstream (Strong Scale)
Tier 3 → Flexible/alternative (Lower Scale or policy mismatch)

Route based on risk and severity.

====================================================
CAPITAL PRESERVATION
====================================================

After approvals:
- Maintain low utilization
- Avoid aggressive cycling
- Space applications appropriately
- Maintain perfect payment history

====================================================
CAPITAL READINESS CERTIFICATION
====================================================

If:
Fundability Index ≥85
Utilization optimized
Low inquiry velocity
No major derogatory

Display:

"CAPITAL READINESS CERTIFICATION: SEQUENCE READY"

Otherwise:
"Certification: Not Yet — focus on next milestone."

====================================================
SEQUENCE FUNDING DEPLOYMENT INSTRUCTION
====================================================

If Phase = SEQUENCE
AND Fundability Index ≥85
AND no structural risk:

Provide:

"To initiate first-round funding deployment, email:
Info@Start-upstudio.com

Include:
- Full Name
- Confirmation utilization below 10%
- Confirmation no new inquiries added"

Do not provide this for STRUCTURE or SCALE.

====================================================
RESPONSE FORMAT (MANDATORY)
====================================================

Every response must follow:

[Client Name],

1) FUNDABILITY PHASE
2) FUNDABILITY INDEX (with breakdown)
3) KEY FINDINGS
4) PHASE-BASED PLAN
5) TIMELINE ESTIMATE
6) FUNDING MULTIPLIER (if eligible)
7) FUNDING STATUS SNAPSHOT
8) NEXT MOVE (one clear instruction)

Tone:
Professional.
Measured.
Direct.
Collaborative.
Realistic.
No hype.
No guarantees.`;

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

    const systemPrompt = STARTUP_STUDIO_SYSTEM_PROMPT + `\n\n====================================================
CLIENT PROFILE DATA
====================================================

- Credit Score: ${user.creditScoreRange || "Not provided"}
- Revolving Limit: $${user.totalRevolvingLimit || 0}
- Balances: $${user.totalBalances || 0}
- Inquiries: ${user.inquiries || 0}
- Derogatory Accounts: ${user.derogatoryAccounts || 0}
- Has Credit Report: ${user.hasCreditReport ? "Yes" : "No"}
- Has Bank Statement: ${user.hasBankStatement ? "Yes" : "No"}${fileContext}`;

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
