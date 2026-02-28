# Profundr

## Overview
Profundr is a subscription-based AI-powered fundability platform, envisioned as a "Capital Operating System." It guides users through a comprehensive five-phase funding journey (Repair → Build → Optimize → Apply → Scale) and integrates commercial bank-grade credit underwriting. Key features include the BASE44 Master Prompt for metric-based risk assessment, Safe Exposure monitoring, detailed Bureau Health tracking with per-bureau guidance, AI-powered dispute case management, and application window optimization. The platform also offers an AI chat workspace with specialized bot mentors, an AI-powered YouTube creator matching service (Creator Connect), and a secure messaging system. Profundr aims to provide users with a robust, data-driven approach to improving their fundability and navigating the capital landscape. Access to the dashboard is gated by a $50/month Stripe subscription.

## User Preferences
- Landing page: Light UI theme (bg-[#fafafa]) with centered headline "How approval-ready are you?", chat input bar at bottom, suggestion pills, and real AI chat powered by /api/chat/guest endpoint. Nav bar is sticky inside scroll area (scrolls with chat). Collapsible left docs panel with localStorage persistence for saving dispute letters, credit reports, and other documents. Folder icon in nav with badge count.
- AI system prompt: Profundr identity — high-level digital underwriting strategist with human-like personality (calm, sharp, strategic, premium, direct). Combines three roles: Credit Repair Specialist, Funding Readiness Strategist, Capital Stacking Architect. Phase-based classification (Repair/Build/Funding/Wait). FCRA-compliant dispute letter generation with statutory citations. Communication style: plain everyday language, direct and grounded, short sentences, no corporate-speak or motivational energy, acknowledges specifics without blanket praise, states bad news clearly then moves to solutions.
- Dispute letters: AI outputs DISPUTE: items in structured format; frontend parses and offers PDF download via /api/dispute-letters endpoint (PDFKit)
- Login from landing page uses `loginSilent` (no redirect) so users stay on chat
- Inter font for UI, JetBrains Mono for data/metrics
- Minimal fintech aesthetic - clean, infrastructure-focused
- API key must be stored server-side only, never exposed to frontend
- Monthly usage limit of 30 analyses per user

## System Architecture

### Tech Stack
- Frontend: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- Backend: Express.js + TypeScript
- Database: PostgreSQL with Drizzle ORM
- AI: OpenAI GPT-4o via Replit AI Integrations
- Routing: wouter (frontend)
- State: React Context + TanStack React Query

### Core Features and Design
- **Funding Phase Management:** A five-phase system (Repair, Build, Optimize, Apply, Scale) determines user progression based on credit metrics.
- **Approval Index Model:** Proprietary 0-100 score based on 6 weighted pillars: Payment Integrity (25%), Utilization Control (20%), File Stability (15%), Credit Depth (15%), Timing Risk (10%), Lender Confidence (15%). Hard caps at 59/74/84 based on structural triggers. Bands: Exceptional (90-100), Strong (80-89), Viable (70-79), Borderline (60-69), Weak (45-59), High Risk (0-44). Phase assignment: Repair/Build/Wait/Funding. Top 3 approval suppressors identified per analysis.
- **Financial Identity Card Stack:** New card showing who the user is to lenders. Includes: Profile Type (Thin File/Starter/Established/Seasoned/Premium), Credit Age, Exposure Level, Bureau Footprint, Identity Strength (0-100 score), and Lender Perception (one-line summary of how lenders see the profile). Parsed from AI response, rendered in chat card stack and included in PDF analysis report.
- **Per-Bureau Credit Reporting & Guidance:** Users upload individual credit reports for Experian, Equifax, and TransUnion. The system processes each bureau's data independently, providing per-bureau risk tiers, funding phases, exposure ceilings (2.5x highest limit), denial triggers, and action items.
- **Velocity Risk Model:** Assesses portfolio expansion rate, exposure growth, and inquiry density to determine velocity approval tiers, adjust exposure ceilings, and enforce mandatory waiting periods.
- **Account Seasoning & Application Readiness:** Tracks new accounts, average account age, and seasoned accounts per bureau to determine application readiness and potential denial triggers.
- **Credit Report Repair System:** Generates AI-powered, FCRA-compliant dispute letters for derogatory items, organized into a 3-round escalation system (DisputeBee methodology). The AI system prompt embeds actual FCRA statutory text from the May 2023 FTC version — exact language from §604 (permissible purposes), §605 (reporting time limits), §607(b) (accuracy obligation), §611 (dispute procedure with all subsections), §616/§617 (civil liability), §618 (statute of limitations), and §623 (furnisher duties). PDF letters cite specific statutory sections with quoted language. Two PDF templates: inquiry-specific (§604/§1681b permissible purpose demand) and account disputes (§611/§623 reinvestigation demand). Repair analysis is contextualized by the specific bureau.
- **Capital Operating System Dashboard (Mission Control):** Per-bureau tabbed interface (Experian/Equifax/TransUnion) with Document Analysis at top showing phase description and next steps. Each bureau tab displays Risk Tier, Funding Phase, Potential Funding (highest limit x2.5), and Application Window. User-friendly educational language throughout. No Underwriter File Summary (internal only).
- **Potential Funding Meter:** Shows expected funding amount per bureau based on highest credit limit x2.5 — not a guarantee, but an estimate when approval-ready.
- **Application Window Optimization:** Per-bureau readiness indicator showing when profile is strong enough to apply.
- **Optimize Funding Strategy:** Per-bureau tabbed interface showing step-by-step funding readiness process (Clean Negatives → Optimize Utilization → Season Accounts → Minimize Inquiries → Build Mix → Apply). Includes estimated timeline, denial triggers, and numbered next steps per bureau. Uses data from Mission Control underwriting.
- **Creator Connect:** AI-powered matching of YouTube creators with profile photos proxied via unavatar.io through backend endpoint (`/api/youtube-avatar/:handle`), conversational creator messages (as-if speaking to user), and recommended video links per creator. Creator-Informed Q&A includes inline YouTube video links.
- **AI Chat Workspace:** Main AI chat on the left side for credit analysis, document upload, and general AI assistance.
- **Messages / DM System:** Pure team member direct messaging system. Users add team members, then message them directly.
- **Buddy Panel (Team Members):** Right-side panel strictly for team member management — add members, accept/decline invites, view online members, click to open DM. No AI mentors in buddy panel.
- **UI/UX:** Adheres to a minimal fintech aesthetic with a white-to-lavender gradient background, frosted glass content blocks, and distinct fonts for UI and data.
- **Team Collaboration:** Team section in the docs panel allows adding team members by email search with auto-accept (no pending state). Clicking a team member opens a dedicated shared 3-way chat session (User + Friend + Profundr AI) isolated from personal chat. Backend uses shared conversation keys `teamchat_{id1}_{id2}` in the directMessages table, with friendship authorization checks on both read/write endpoints. Frontend switches between personal and team chat via `activeTeamChat` state; team chat banner shows at top with "Back to personal" button. Personal chat uses `team_{userId}` keys. Notification sound plays on incoming team messages. Polls every 3s.
- **Authentication & Subscription:** Session-based auth. Subscription is currently FREE (auto-activated on sign-in via `/api/activate-free`). Stripe product/price preserved but bypassed. No dashboard — subscribers are redirected to the front page which is the full product.
- **Navigation:** Brain icon (top-left) opens the docs/team panel. "Sign In" button for guests, "Subscription" button for logged-in users.

### Data Model Highlights
- **Users:** Stores subscription status, credit profile fields, funding phase, and monthly AI usage.
- **Messages:** Manages direct messages and AI interactions.
- **DisputeCases:** Tracks credit dispute details, including letter content and resolution status.
- **SystemAlerts:** Manages user notifications and alerts.

### Bug Fixes Applied
- **searchUsers** now properly excludes the current user from search results
- **primaryDenialTriggers** parsing wrapped in try-catch to prevent crashes on malformed JSON
- **monthlyUsage** increments changed from read-then-write to atomic SQL (`SET monthlyUsage = monthlyUsage + 1`) to prevent race conditions
- **parseInt validation** added to dispute and alert route params to reject NaN values
- **Session secret** fallback changed from hardcoded string to crypto-random, improving security

## External Dependencies
- **Stripe:** For managing user subscriptions and payment processing.
- **OpenAI GPT-4o:** Integrated via Replit AI Integrations for all AI-powered functionalities (underwriting, chat mentors, dispute letter generation, creator matching, document analysis).
- **PostgreSQL:** Primary database for persistent storage.
- **Drizzle ORM:** Used for database interaction with PostgreSQL.
- **YouTube (indirectly):** Creator Connect uses AI to match creators, implying interaction with YouTube data without direct API key integration.