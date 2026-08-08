# ForgeFit (workout-gen) — Agent Instructions

## Project Overview
Next.js 16 (App Router) + React 19 + Tailwind CSS v4 + PostgreSQL + Google Gemini AI. PWA with offline `localStorage` fallback.

## Commands
```bash
npm run dev       # Start dev server (turbopack)
npm run build     # Production build
npm run start     # Run production server
npm run lint      # ESLint (next lint)
npm run db:init   # Initialize PostgreSQL tables (runs automatically on startup too)
```

## Environment
Required `.env` keys:
- `DATABASE_URL` or `DB_HOST`/`DB_PORT`/`DB_USER`/`DB_PASSWORD`/`DB_NAME` — PostgreSQL
- `GEMINI_API_KEY` — Google Gemini (falls back to rule-based generator if missing)
- `JWT_SECRET`, `NEXT_PUBLIC_APP_URL` — Auth
- `KV_REST_API_*` / `REDIS_URL` — Upstash Redis (rate limiting, caching)
- `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` — OAuth
- `OTEL_EXPORTER_OTLP_*` — Grafana observability

## Architecture
- **Entry**: `src/app/layout.jsx` → `src/app/page.jsx` (client component with tabs)
- **API Routes**: `src/app/api/workouts/route.js`, `src/app/api/workouts/multi-agent-generate/route.js`
- **Models**: `src/models/*.model.js` — PostgreSQL via `pg` pool (`src/config/database.js`)
- **AI Pipeline**: `src/lib/multiAgentPipeline.js` — 4-agent streaming pipeline (Planner → Selector → Optimizer → Reviewer) with strict JSON schemas
- **Fallback Generator**: `src/lib/generator.js` — procedural rule-based workout generator
- **Auth**: `src/utils/auth.js` — JWT in HttpOnly cookies + Google OAuth
- **Rate Limiting**: `src/utils/rateLimit.js` + Redis
- **Path Alias**: `@/*` → `src/*` (jsconfig.json)

## Key Conventions
- **Server Components by default** — API routes are Route Handlers (Next.js 13+)
- **Client Components** — `'use client'` directive at top (e.g., `page.jsx`, tab components)
- **Streaming AI responses** — NDJSON (`application/x-ndjson`) from multi-agent pipeline
- **Database auto-init** — `initDB()` runs on module load in `database.js`; also callable via `npm run db:init`
- **localStorage fallback** — client-side `src/lib/storage.js` mirrors DB models for offline mode
- **Tailwind v4** — `@import "tailwindcss"` in `globals.css` with `@theme` for custom colors/fonts; light/dark via `.theme-light`/`.theme-dark` classes

## Testing & Quality
- No test framework configured
- Lint: `npm run lint` (ESLint + `eslint-config-next`)
- TypeScript: not used (JS only, `jsconfig.json` for path aliases)

## Gotchas
- **No TypeScript** — all `.js`/`.jsx` files
- **Gemini API key required for AI features** — falls back silently to procedural generator
- **PostgreSQL must be running** — app crashes if DB unavailable (no health check endpoint)
- **Redis/Upstash used for caching & rate limits** — optional but recommended
- **PWA Service Worker** — `public/sw.js` caches static assets; dynamic routes fallback to `localStorage`
- **Auth via cookies** — `getUserIdFromRequest()` reads JWT from `Authorization` header or cookie

## File Structure (High-Level)
```
src/
├── app/
│   ├── api/workouts/           # REST + multi-agent generate
│   ├── globals.css             # Tailwind v4 + theme tokens
│   ├── layout.jsx              # Root layout (providers, font loading)
│   └── page.jsx                # Main client shell (tabs)
├── components/                 # All client components (tabs, modals)
├── config/database.js          # pg pool + auto initDB()
├── lib/
│   ├── multiAgentPipeline.js   # 4-agent Gemini pipeline (streaming)
│   ├── generator.js            # Procedural fallback generator
│   ├── data.js                 # Exercise database + filterExercises()
│   ├── redis.js                # Upstash client + cache helpers
│   └── routine.js              # Routine helpers
├── models/                     # DB models (workouts, routines, users, logs)
└── utils/
    ├── auth.js                 # JWT + Google OAuth
    ├── gemini.js               # @google/generative-ai init
    ├── rateLimit.js            # Redis-backed rate limiting
    └── id.js                   # UUID generator
db/init.js                      # Standalone DB init script
```