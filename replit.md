# Start-Up Studio®

## Overview
A subscription-based SaaS web app that evaluates users' credit profiles and determines fundability using a 3-phase system (Structure, Scale, Sequence). Features secure authentication, subscription management, a member dashboard with credit profile inputs, document uploads, an AI-powered chat analysis interface using OpenAI, and an admin panel for user management.

## Recent Changes
- 2026-02-12: Graduated from visual prototype to full-stack working app with PostgreSQL + Drizzle ORM
- 2026-02-12: Implemented OpenAI AI chat integration via Replit AI Integrations (server-side only)
- 2026-02-12: Added admin panel with user management (toggle subscriptions, reset usage)
- 2026-02-12: Added 30 analyses/month usage limiting with proper error messages

## User Preferences
- Dark theme (#0A0A0A background) with Acid Green (#CCFF00) primary color
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
- Messages: userId, role (user/assistant), content, attachment type, timestamp

### AI System Prompt Structure
Returns: Fundability Phase, Index Score (0-100), Key Findings, Phase-Based Plan, Timeline Estimate, Funding Multiplier, Funding Status Snapshot, Next Move
