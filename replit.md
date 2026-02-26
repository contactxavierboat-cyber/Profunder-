# Profundr

## Overview
Profundr is a subscription-based AI-powered fundability platform, envisioned as a "Capital Operating System." It guides users through a comprehensive five-phase funding journey (Repair → Build → Optimize → Apply → Scale) and integrates commercial bank-grade credit underwriting. Key features include the BASE44 Master Prompt for metric-based risk assessment, Safe Exposure monitoring, detailed Bureau Health tracking with per-bureau guidance, AI-powered dispute case management, capital stack planning, and application window optimization. The platform also offers an AI chat workspace with specialized bot mentors, an AI-powered YouTube creator matching service (Creator Connect), and a secure messaging system. Profundr aims to provide users with a robust, data-driven approach to improving their fundability and navigating the capital landscape. Access to the dashboard is gated by a $50/month Stripe subscription.

## User Preferences
- White UI with white-to-lavender gradient background and animated floating deep silver blobs
- Frosted glass content blocks (bg-white/70 backdrop-blur-md)
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
- **Commercial Bank-Grade Underwriting (BASE44 Master Prompt):** Employs 8 independent risk metrics (Utilization, Payment Performance, Payment Recency, Derogatory Events, Inquiry Velocity, Credit Depth, Account Mix, Balance Trend) to classify users into risk tiers (PRIME, STANDARD, SUBPRIME, DECLINE LIKELY). No composite score is used.
- **Per-Bureau Credit Reporting & Guidance:** Users upload individual credit reports for Experian, Equifax, and TransUnion. The system processes each bureau's data independently, providing per-bureau risk tiers, funding phases, exposure ceilings (2.5x highest limit), denial triggers, and action items.
- **Velocity Risk Model:** Assesses portfolio expansion rate, exposure growth, and inquiry density to determine velocity approval tiers, adjust exposure ceilings, and enforce mandatory waiting periods.
- **Account Seasoning & Application Readiness:** Tracks new accounts, average account age, and seasoned accounts per bureau to determine application readiness and potential denial triggers.
- **Credit Report Repair System:** Generates AI-powered, FCRA-compliant dispute letters for derogatory items, organized into a 3-round system. Repair analysis is contextualized by the specific bureau.
- **Capital Operating System Dashboard (Mission Control):** Per-bureau tabbed interface (Experian/Equifax/TransUnion) with Document Analysis at top showing phase description and next steps. Each bureau tab displays Risk Tier, Funding Phase, Potential Funding (highest limit x2.5), and Application Window. User-friendly educational language throughout. No Underwriter File Summary (internal only).
- **Potential Funding Meter:** Shows expected funding amount per bureau based on highest credit limit x2.5 — not a guarantee, but an estimate when approval-ready.
- **Application Window Optimization:** Per-bureau readiness indicator showing when profile is strong enough to apply.
- **Creator Connect:** AI-powered matching of YouTube creators without requiring API keys.
- **AI Chat Workspace:** Features 7 specialized bot mentors (e.g., Sales, Investing, Marketing) that offer targeted guidance.
- **Messages / DM System:** Allows direct messaging between users and includes a "Team AI" feature for collaborative AI assistance within conversations.
- **UI/UX:** Adheres to a minimal fintech aesthetic with a white-to-lavender gradient background, frosted glass content blocks, and distinct fonts for UI and data.
- **Authentication & Subscription:** Session-based authentication with a mandatory $50/month Stripe subscription paywall.

### Data Model Highlights
- **Users:** Stores subscription status, credit profile fields, funding phase, and monthly AI usage.
- **Messages:** Manages direct messages and AI interactions.
- **DisputeCases:** Tracks credit dispute details, including letter content and resolution status.
- **SystemAlerts:** Manages user notifications and alerts.

## External Dependencies
- **Stripe:** For managing user subscriptions and payment processing.
- **OpenAI GPT-4o:** Integrated via Replit AI Integrations for all AI-powered functionalities (underwriting, chat mentors, dispute letter generation, creator matching, document analysis).
- **PostgreSQL:** Primary database for persistent storage.
- **Drizzle ORM:** Used for database interaction with PostgreSQL.
- **YouTube (indirectly):** Creator Connect uses AI to match creators, implying interaction with YouTube data without direct API key integration.