# AGENTS.md — AI Assistant Context

This document provides machine-readable context for AI coding assistants (opencode, Cursor, Windsurf, etc.) to understand the RadioFlow project — its architecture, conventions, invariants, and design decisions.

---

## Project Overview

- **Name**: RadioFlow
- **Repository**: https://github.com/sanot-tech/RadioFlow
- **Stack**: React 18 + TypeScript 5.5 (strict) + Vite 6 + Tailwind CSS 3 + shadcn/ui
- **Routing**: React Router 6 (client-side, lazy-loaded)
- **State**: React Context + Supabase Auth + TanStack React Query
- **Package Manager**: npm
- **Build**: `npm run build` -> `dist/` (Vite 6, esbuild minifier)
- **Dev**: `npm run dev` -> http://localhost:8080
- **Production**: https://radio-flow.vercel.app
- **Lint**: `npm run lint` (ESLint 9, flat config)
- **Type Check**: `npx tsc --noEmit` (must pass: 0 errors)
- **Tests**: None configured

## Project Structure

```
RadioFlow/
├── src/
│   ├── components/        # UI components (shadcn/ui + custom)
│   │   └── ui/            # shadcn/ui primitives (20+)
│   ├── pages/             # Page components (8 routes, lazy-loaded)
│   │   ├── StationsPage.tsx       # Unified Top/Trending (178 lines)
│   │   ├── TopStationsPage.tsx    # Thin wrapper (13 lines)
│   │   ├── TrendingStationsPage.tsx # Thin wrapper (13 lines)
│   │   ├── RadioFlow.tsx          # Home page (main entry)
│   │   ├── GenreStationsPage.tsx  # Genre explorer
│   │   ├── CountryStationsPage.tsx # Country explorer
│   │   ├── FavoritesPage.tsx      # User favorites (auth required)
│   │   ├── AuthCallback.tsx       # OAuth callback
│   │   └── NotFound.tsx           # 404
│   ├── services/          # Business logic services
│   │   ├── radioService.ts        # Radio Browser API client
│   │   ├── trendsService.ts       # Music trends aggregation
│   │   ├── diverseTrendGenerator.ts # Trend-matched station ranking
│   │   ├── favoritesService.ts    # Favorites CRUD (Supabase)
│   │   └── aiDescriptionService.ts # OpenRouter AI descriptions
│   ├── context/           # React context providers
│   │   ├── RadioPlayerContext.tsx  # Audio state machine + playback
│   │   └── AuthContext.tsx         # Authentication state
│   ├── hooks/             # Custom React hooks
│   │   ├── useTrends.ts           # Top/Trending station hooks
│   │   └── useAudioPersistence.ts # Audio across route changes
│   ├── invariants/        # Trinity Framework assertions
│   │   ├── radioPlayer.λ.ts       # 5-state audio machine
│   │   ├── auth.λ.ts              # Auth-required guard
│   │   ├── favorites.λ.ts         # Duplicate prevention
│   │   └── stations.λ.ts          # Data integrity checks
│   ├── lib/               # Utilities
│   │   ├── invariant.ts           # Trinity core (InvariantError, assert, TrinityCell)
│   │   └── utils.ts               # shortenCountryName, cn, etc.
│   ├── types/             # TypeScript type definitions
│   ├── data/              # Static data files
│   └── integrations/      # Third-party integrations
├── .github/               # CI/CD (GitHub Actions, 6 workflows)
├── screenshots/           # Playwright screenshots
├── PROGRESS.md            # Project progress & architecture overview
├── AGENTS.md              # This file
├── package.json           # name: radioflow, version: 1.0.0
└── README.md              # Project documentation (production tone)
```

## Architectural Decisions

### Invariant-First Architecture (Trinity Framework)

All state transitions and data mutations must pass through Trinity invariant assertions defined in `src/invariants/`. These are NOT tests — they are runtime contracts enforced in production.

### Duplicate Page Resolution

`TopStationsPage` and `TrendingStationsPage` are thin wrappers (13 lines each) around the unified `StationsPage` component (178 lines). They pass data via props (`{ title, label, stations, loading, error }`), NOT via hook callbacks (which would violate rules-of-hooks).

### Diverse Trending

`diverseTrendGenerator.ts` provides two methods:
- `getTopStations()` — sorted by descending matchScore (stable ranking)
- `getTrendingStations()` — shuffled with randomized scores (discovery mode)

Both derive from `generateDiverseTrends()` but differ in post-processing.

### UI/UX Pro Max Design System

Visual identity follows product type #45 "Music Streaming" from the UI/UX Pro Max Skill:
- Primary: `#1E1B4B` | Secondary: `#4338CA` | Accent: `#22C55E`
- Background: `#0F0F23` | Card: `#1B1B30` | Foreground: `#F8FAFC`
- Styles: Dark Mode (OLED) + Aurora UI + Glassmorphism + Micro-interactions

## Conventions

### Code Style
- NO comments in production code (unless absolutely necessary for complex logic)
- NO emojis in any project files (code, comments, docs)
- TypeScript strict mode; avoid `any` where possible
- shadcn/ui components in `src/components/ui/` — do NOT modify, extend via props
- Custom components in `src/components/` — functional components with TypeScript

### Naming
- Files: PascalCase for components, camelCase for utilities
- Invariant files: `.λ.ts` extension
- Services: suffix `Service` (e.g., `favoritesService.ts`)
- Hooks: prefix `use` (e.g., `useTrends.ts`)

### Imports
- Use `@/` path aliases (configured in tsconfig + vite.config)
- Group: React -> third-party -> local components -> local services -> styles

## Known Limitations

| Issue | Location | Workaround |
|---|---|---|
| `audioRef.current` typed `any` | RadioPlayerContext.tsx:48 | Cast as `HTMLAudioElement` |
| `allStations as any` casts | StationCard, StationsPage | Interface refinement needed |
| 124 `no-explicit-any` lint warnings | Various | Pre-existing, gradual fix |

## Vercel Deployment

- Project: `radio-flow` (ID: `prj_5E28O7YKM2UgHrTC3HNnq3q9OhDW`)
- `radioflow.vercel.app` is UNAVAILABLE (taken by another project)
- Custom alias not configured — use Vercel dashboard or CLI
