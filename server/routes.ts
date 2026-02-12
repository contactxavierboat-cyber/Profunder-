import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { openai } from "./replit_integrations/audio/client";

export async function registerRoutes(app: Express): Promise<Server> {
  // Mock Auth for MVP (Auto-login/signup)
  app.post("/api/login", async (req, res) => {
    const { email } = req.body;
    let user = await storage.getUserByEmail(email);
    if (!user) {
      user = await storage.createUser({
        email,
        password: "password", // In a real app, hash this
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
        hasBankStatement: false
      });
    }
    res.json(user);
  });

  app.get("/api/user/:id", async (req, res) => {
    const user = await storage.getUser(parseInt(req.params.id));
    res.json(user);
  });

  app.patch("/api/user/:id", async (req, res) => {
    const user = await storage.updateUser(parseInt(req.params.id), req.body);
    res.json(user);
  });

  // Chat API with OpenAI
  app.get("/api/chat/:userId", async (req, res) => {
    const messages = await storage.getMessages(parseInt(req.params.userId));
    res.json(messages);
  });

  app.post("/api/chat/:userId", async (req, res) => {
    const userId = parseInt(req.params.userId);
    const { content, attachment } = req.body;
    
    const user = await storage.getUser(userId);
    if (!user) return res.status(404).send("User not found");
    
    if (user.subscriptionStatus !== "active") {
      return res.status(403).json({ error: "Subscription inactive. Please update billing to continue." });
    }
    
    if (user.monthlyUsage >= user.maxUsage) {
      return res.status(403).json({ error: "Monthly analysis limit reached. Please wait for reset." });
    }

    // Save user message
    await storage.createMessage({ userId, role: "user", content, attachment: attachment || null });

    // Get context
    const history = await storage.getMessages(userId);
    const last10 = history.slice(-10).map(m => ({ role: m.role as "user"|"assistant", content: m.content }));
    
    const systemPrompt = `You are the Start-Up Studio® AI, a digital underwriting expert.
    Evaluate the user's fundability based on their profile and the 3-phase system: Structure, Scale, Sequence.
    
    User Profile:
    - Credit Score: ${user.creditScoreRange || "Not provided"}
    - Revolving Limit: $${user.totalRevolvingLimit || 0}
    - Balances: $${user.totalBalances || 0}
    - Inquiries: ${user.inquiries || 0}
    - Derogatory Accounts: ${user.derogatoryAccounts || 0}
    
    Structure your response with:
    - Fundability Phase
    - Fundability Index Score (0–100)
    - Key Findings
    - Phase-Based Plan
    - Timeline Estimate
    - Funding Multiplier
    - Next Move`;

    try {
      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          { role: "system", content: systemPrompt },
          ...last10
        ]
      });

      const aiContent = response.choices[0].message.content || "I'm sorry, I couldn't generate an analysis.";
      
      // Save assistant response
      const aiMessage = await storage.createMessage({ userId, role: "assistant", content: aiContent, attachment: null });
      
      // Increment usage
      await storage.updateUser(userId, { monthlyUsage: user.monthlyUsage + 1 });
      
      res.json(aiMessage);
    } catch (error) {
      console.error("OpenAI Error:", error);
      res.status(500).send("Error generating AI analysis");
    }
  });

  app.delete("/api/chat/:userId", async (req, res) => {
    await storage.clearMessages(parseInt(req.params.userId));
    res.status(204).send();
  });

  const httpServer = createServer(app);
  return httpServer;
}
