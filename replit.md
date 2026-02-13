# MentXr®

## Overview
A free AI mentorship platform ("Mentorship On Demand") combining Capital Readiness analytics with AI-powered mentorship. Features a 6-component Capital Readiness evaluation system (Capital Strength, Credit Quality, Management & Structure, Earnings & Cash Flow, Liquidity & Leverage, Risk Signals), 2.5x exposure ceiling calculation, tier eligibility (Prime/Mid-Tier/Alternative), operating mode (Pre-Funding/Repair), denial simulation, AI chat workspace with 7 bot mentors, PDF document upload with OCR, friends list, admin panel, and free membership access.

## Recent Changes
- 2026-02-13: Integrated Master Capital Readiness System Prompt into funding engine and document analysis
- 2026-02-13: Added 6-component scoring: Capital Strength (0-20), Credit Quality (0-20), Management (0-15), Cash Flow (0-15), Liquidity (0-15), Risk Signals (0-15)
- 2026-02-13: Added 2.5x exposure ceiling logic with dynamic multiplier adjustments
- 2026-02-13: Added tier eligibility (Tier 1 Prime, Tier 2 Mid-Tier, Tier 3 Alternative Capital)
- 2026-02-13: Added operating mode engine (Pre-Funding Mode vs Repair Mode)
- 2026-02-13: Added denial simulation with triggers, risk levels, and corrective recommendations
- 2026-02-13: Dashboard UI updated with component breakdown bars, exposure ceiling card, tier/mode cards, denial simulation card
- 2026-02-13: Document analysis AI prompt updated to Capital Readiness analyst tone
- 2026-02-13: Added document upload on Dashboard with AI-powered analysis (credit report + bank statement)
- 2026-02-13: AI extracts financial data from uploaded documents and auto-populates funding score fields
- 2026-02-13: Added POST /api/analyze-document endpoint with PDF extraction pipeline + OpenAI analysis
- 2026-02-13: Added Next Steps section to Dashboard showing AI-generated personalized recommendations after analysis
- 2026-02-13: Added lastAnalysisDate, analysisSummary, analysisNextSteps fields to users table
- 2026-02-13: Funding score auto-refreshes after document analysis completes
- 2026-02-13: Replaced social feed with Funding Readiness Dashboard (score, qualification range, risk alerts, action plan, progress tracker, insights)
- 2026-02-13: Added /api/funding-readiness endpoint calculating score from credit profile data
- 2026-02-13: Dashboard tab replaces Feed tab - private banking/financial analytics terminal design
- 2026-02-13: Removed social elements (live feed, community posts, influencer posts, likes, comments on feed)
- 2026-02-13: Kept friends list sidebar with add/accept/reject/remove friend functionality
- 2026-02-13: Added friend feature - send/accept/reject friend requests, search users, friends list in AOL buddy list sidebar
- 2026-02-13: Replaced all 7 real mentors with anonymous bot profiles (NovaSage247, AlphaVolt889, BlazeEcho512, LunarPeak303, IronFlux771, ZenCipher108, SteelWraith666)
- 2026-02-13: Bot mentors use color-gradient avatars with initials instead of real celebrity photos
- 2026-02-12: Each mentor has unique system prompt, specialty, tagline, and keyword detection
- 2026-02-12: Graduated from visual prototype to full-stack working app with PostgreSQL + Drizzle ORM
- 2026-02-12: Implemented OpenAI AI chat integration via Replit AI Integrations (server-side only)
- 2026-02-12: Added admin panel with user management (toggle subscriptions, reset usage)
- 2026-02-12: Added 30 analyses/month usage limiting with proper error messages

## User Preferences
- Dark theme (#0D0D0D background) with dark gray color scheme (#0D0D0D, #1A1A1A, #E0E0E0)
- Inter font for UI, JetBrains Mono for data/metrics
- "Digital Brutalism/Tech Finance" aesthetic with glass-panel effects and subtle grid backgrounds
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
- `shared/schema.ts` - Database schema (users, messages tables) + Zod types
- `server/routes.ts` - API routes (login, user CRUD, chat/AI analysis)
- `server/storage.ts` - Drizzle ORM storage interface
- `server/db.ts` - Database connection
- `client/src/lib/store.tsx` - Auth context + API client (React Query)
- `client/src/pages/landing.tsx` - Login page
- `client/src/pages/dashboard.tsx` - Main member dashboard
- `client/src/pages/admin.tsx` - Admin user management
- `client/src/pages/subscription.tsx` - Subscription activation page
- `client/src/components/chat-interface.tsx` - AI chat component
- `client/src/components/profile-form.tsx` - Credit profile form
- `client/src/components/layout.tsx` - Dashboard sidebar layout

### Data Model
- Users: email, password, role, subscriptionStatus, monthlyUsage, maxUsage, credit profile fields, document flags
- Messages: userId, role (user/assistant), content, attachment type, mentor (nullable), timestamp

### Bot Mentor System
- 7 anonymous bots: NovaSage247 (Sales), AlphaVolt889 (Investing), BlazeEcho512 (Marketing), LunarPeak303 (Leadership), IronFlux771 (Entrepreneurship), ZenCipher108 (Mindset), SteelWraith666 (Youth Advocacy)
- Each has: color-gradient avatar with initials, system prompt, specialty, tagline, keyword detection
- Backend: MENTOR_PROFILES in server/routes.ts, /api/mentors endpoint
- Frontend: MENTOR_INFO + BOT_COLORS in chat-interface.tsx & dashboard.tsx, mentor selection panel with grid UI
- Priority: explicit UI selection > keyword detection > conversation persistence > default MentXr® AI
