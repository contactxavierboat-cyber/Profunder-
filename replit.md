# MentXr®

## Overview
A subscription-based AI mentorship platform ("Capital Operating System") combining comprehensive funding phase management (5 phases: Repair→Build→Optimize→Apply→Scale) with AI-powered mentorship. Features weighted 6-category Capital Readiness scoring, Safe Exposure monitoring, Bureau Health tracking (3-bureau map), dispute case management with AI-generated FCRA-compliant letters, bank rating and pledge loan simulators, capital stack planning, application window optimization, AI chat workspace with 7 bot mentors, Creator Connect (AI-powered YouTube creator matching without API key), Credit Report Repair System, Messages/DM system with Team AI, session-based auth, PDF upload with OCR, AOL AIM-style buddy list sidebar, and admin panel.

## Recent Changes
- 2026-02-16: **Capital Operating System** - Complete architecture upgrade with 5-phase funding journey
- 2026-02-16: Left sidebar navigation (7 items): Mission Control, Repair Engine, Build Strategy, Funding Strategy, Creator Connect, Messages, Progress Tracker
- 2026-02-16: Mission Control dashboard with 4 metric cards (Readiness Score gauge, Phase tracker, Exposure meter, Application Window)
- 2026-02-16: Bureau Health Map - 3 bureau tiles (Experian, Equifax, TransUnion) with utilization, inquiries, derogatories, risk status
- 2026-02-16: Weighted Capital Readiness Score: Payment History (30%), Utilization (25%), Exposure Depth (15%), Inquiry Sensitivity (10%), Account Age (10%), Bureau Strength (10%)
- 2026-02-16: Safe Exposure Meter with safe/caution/denial zones and max safe credit amount calculation
- 2026-02-16: Funding Phase Engine calculates position in 5-phase journey based on credit metrics
- 2026-02-16: Build Strategy section with Bank Rating Simulator and Pledge Loan Simulator
- 2026-02-16: Funding Strategy section with Application Window Timer and Capital Stack Simulator
- 2026-02-16: Progress Tracker with phase progress bar and 6-category breakdown
- 2026-02-16: Dispute Case Management with AI-generated FCRA-compliant letters, status tracking, timelines
- 2026-02-16: System Alerts with read/unread tracking
- 2026-02-16: Schema extended with fundingPhase, bureau health fields, disputeCases table, systemAlerts table, bank rating fields
- 2026-02-16: server/capitalEngines.ts - computation engines for all capital metrics
- 2026-02-16: 15+ new API endpoints under /api/capital-os/*
- 2026-02-16: Removed Live Feed tab entirely
- 2026-02-16: Mobile tab optimization - stacked icon/label layout on mobile, responsive text sizing
- 2026-02-16: Creator Connect uses AI-powered YouTube creator matching (no API key needed)
- 2026-02-15: Renamed "Creator AI" tab to "Creator Connect" across dashboard
- 2026-02-14: Creator Connect with multi-creator aggregation mode
- 2026-02-13: Bot mentors with anonymous profiles and color-gradient avatars
- 2026-02-13: Credit Repair System with AI-powered report parsing and dispute letters
- 2026-02-13: Document upload with AI analysis (credit report + bank statement)
- 2026-02-12: Full-stack app with PostgreSQL + Drizzle ORM + OpenAI integration

## User Preferences
- White UI with white-to-lavender gradient background and animated floating deep silver blobs
- Frosted glass content blocks (bg-white/70 backdrop-blur-md)
- Inter font for UI, JetBrains Mono for data/metrics
- Minimal fintech aesthetic - clean, infrastructure-focused
- API key must be stored server-side only, never exposed to frontend
- Monthly usage limit of 30 analyses per user

## Project Architecture

### Tech Stack
- Frontend: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- Backend: Express.js + TypeScript
- Database: PostgreSQL with Drizzle ORM
- AI: OpenAI GPT-4o via Replit AI Integrations
- Routing: wouter (frontend)
- State: React Context + TanStack React Query

### Key Files
- `shared/schema.ts` - Database schema (users, messages, disputeCases, systemAlerts tables) + Zod types
- `server/routes.ts` - API routes (login, user CRUD, chat/AI analysis, Capital OS endpoints)
- `server/capitalEngines.ts` - Capital computation engines (phase, readiness, exposure, bureau health, window, simulators)
- `server/storage.ts` - Drizzle ORM storage interface with dispute/alert CRUD
- `server/db.ts` - Database connection
- `client/src/lib/store.tsx` - Auth context + API client (React Query)
- `client/src/pages/landing.tsx` - Login page
- `client/src/pages/dashboard.tsx` - Main Capital OS dashboard (left nav + 7 sections)
- `client/src/pages/admin.tsx` - Admin user management
- `client/src/pages/subscription.tsx` - Subscription activation page
- `client/src/components/chat-interface.tsx` - AI chat component
- `client/src/components/profile-form.tsx` - Credit profile form
- `client/src/components/layout.tsx` - Dashboard sidebar layout

### Data Model
- Users: email, password, role, subscriptionStatus, monthlyUsage, maxUsage, credit profile fields, document flags, fundingPhase, bank rating fields
- Messages: userId, role (user/assistant), content, attachment type, mentor (nullable), timestamp
- DisputeCases: userId, bureau, accountName, accountNumber, disputeType, disputeMethod, fcraCitation, letterContent, status, sentDate, reminderDate, responseDeadline, resolution
- SystemAlerts: userId, alertType, severity, title, message, isRead, metadata

### Capital Operating System
- 5 Funding Phases: Repair → Build → Optimize → Apply → Scale
- Phase engine determines user position based on credit score, utilization, derogatory items, account age
- Readiness Score: weighted 6-category model (Payment 30%, Util 25%, Exposure 15%, Inquiry 10%, Age 10%, Bureau 10%)
- Safe Exposure: calculates max safe credit based on score, utilization, inquiries, account count
- Bureau Health: 3-bureau comparison with risk status, priority bureau recommendation
- Application Window: optimal timing based on inquiry density, utilization, negative items, score
- Bank Rating Simulator: estimates internal bank rating based on deposits, relationship length
- Pledge Loan Simulator: projects utilization/score improvement from pledge strategies
- Capital Stack Planner: multi-stage funding roadmap across bureaus

### Underwriting Intelligence Engine
- 18 input variables extracted from credit reports via AI
- Hard Stop Auto-Repair triggers: bankruptcy, chargeoffs, collections, public records, late payments ≥2 in 24mo, identity flags, utilization ≥70%, highest card ≥90%, inquiries ≥8 in 6mo, oldest account <1yr
- Credit Score Tiers: EXCELLENT (≥740), STRONG (≥700), BORDERLINE (≥680), WEAK (<680)
- Final Modes: REPAIR, OPTIMIZATION, FUNDING_READY, WAIT_AND_OPTIMIZE
- Denial Reason Mapping: all hard-stop triggers + utilization/velocity/age/thin-file/derogatory flags
- Conditional Funding Calculator: min = revolving limit × 1.5, max = revolving limit × 2.5 (only in FUNDING_READY)
- Additional fields: chargeoffs, bankruptcyPresent, identityFlagsPresent, issuerRelationshipNegative, highestCardUtilizationPercent, hardInquiries6mo/12mo, recentAccounts12mo
- API: GET /api/capital-os/underwriting (standalone), also included in GET /api/capital-os/dashboard response

### Navigation Structure (Left Sidebar)
1. Mission Control - Main dashboard with 4 metric cards + bureau health + document upload
2. Repair Engine - Credit repair with dispute letters, issues, action plan
3. Build Strategy - Bank rating + pledge loan simulators
4. Funding Strategy - Application window timer + capital stack planner
5. Creator Connect - AI-powered YouTube creator matching
6. Messages - DM system with friends + Team AI
7. Progress Tracker - Phase progress bar + category breakdown

### Messages / DM System
- Messages section allows friends to DM each other directly
- Team AI: Either friend can ask AI a question within the DM, both see the response
- Team AI uses conversation context + both users' names for collaborative guidance
- Auto-polls every 5 seconds for new messages when in a conversation
- Schema: directMessages table (conversationKey, senderId, receiverId, content, isAi, timestamp)
- API: GET/POST /api/dm/:friendId, POST /api/dm/:friendId/team-ai, DELETE /api/dm/:friendId

### Bot Mentor System
- 7 anonymous bots: NovaSage247 (Sales), AlphaVolt889 (Investing), BlazeEcho512 (Marketing), LunarPeak303 (Leadership), IronFlux771 (Entrepreneurship), ZenCipher108 (Mindset), SteelWraith666 (Youth Advocacy)
- Each has: color-gradient avatar with initials, system prompt, specialty, tagline, keyword detection
- Backend: MENTOR_PROFILES in server/routes.ts, /api/mentors endpoint
- Frontend: MENTOR_INFO + BOT_COLORS in dashboard.tsx, mentor selection panel with grid UI
- Priority: explicit UI selection > keyword detection > conversation persistence > default MentXr® AI
