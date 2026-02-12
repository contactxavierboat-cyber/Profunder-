# MentXr®

## Overview
A subscription-based AI mentorship platform ("Mentorship On Demand") that provides personalized conversations with digital versions of influential mentors. Features ChatGPT-style dark theme interface, session-based authentication, Stripe checkout ($50/month), OpenAI GPT-4o powered conversations, PDF document upload, admin panel, and subscription-based access control.

## Recent Changes
- 2026-02-12: Added mentor selection panel with 5 mentors (Grant Cardone, Warren Buffett, Gary Vaynerchuk, Oprah Winfrey, Sara Blakely)
- 2026-02-12: Each mentor has unique avatar, system prompt, specialty, tagline, and keyword detection
- 2026-02-12: Users can explicitly select/switch/clear mentors via UI panel or type mentor name
- 2026-02-12: Added /api/mentors endpoint for listing available mentors
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

### Mentor System
- 5 mentors: Grant Cardone, Warren Buffett, Gary Vaynerchuk, Oprah Winfrey, Sara Blakely
- Each has: unique avatar (PNG in client/src/assets/), system prompt, specialty, tagline, keyword detection
- Backend: MENTOR_PROFILES in server/routes.ts, /api/mentors endpoint
- Frontend: MENTOR_INFO in chat-interface.tsx, mentor selection panel with grid UI
- Priority: explicit UI selection > keyword detection > conversation persistence > default MentXr® AI
