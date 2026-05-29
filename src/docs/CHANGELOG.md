# Changelog

All notable changes to the RadioFlow Enterprise platform are documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html)
with strict pre-release tagging.

---

## [1.0.0-rc.2] — 2026-05-27

### 🚀 Features

- **Shazam Discovery API Fallback**: Complete dual-pass recognition pipeline — fast ICY metadata scan (5s timeout) with automatic fallback to Shazam audio fingerprinting (10s audio capture, multipart POST to `amp.shazam.com/discovery/v5/.../recognize`). Artist/track parsing from `StreamTitle` for ICY; `track.title`/`track.subtitle` for Shazam.
- **Track Recognition Artist Support**: `RecognizeResult` now includes `artist` field. ICY "Artist - Song" format is parsed automatically; Shazam returns artist natively.
- **NowPlayingCard Recognize UX**: After successful recognition, track and artist are displayed inline. A clear (×) button allows re-recognition with a single click.

### 🔧 Fixed

- **CRITICAL: `/api/recognize` Server Crash on Invalid URL**: `new URL(streamUrl)` was called without try/catch, crashing the entire Vite dev server on malformed input (e.g. `?url=test`). Added URL validation with graceful `{ method: 'invalid-url' }` response. Also wrapped entire middleware handler in try/catch to prevent unhandled rejections from crashing the process. ([vite.config.ts:13](vite.config.ts), [api/recognize.mjs:11](api/recognize.mjs))
- **CRITICAL: `/api/recognize` Server Crash on Unreachable Streams**: Unhandled promise rejections in Vite middleware's async handler propagated to the process level, terminating the dev server when a stream connection failed. Added `res.writableEnded` guard and error response. ([vite.config.ts:75](vite.config.ts))
- **Invalid Tailwind Class `violet-606`**: Typo in `StationListSection.tsx` gradient — `to-violet-606` is not a valid Tailwind class (should be `violet-600`). The gradient line rendered as transparent. ([StationListSection.tsx:49](src/components/StationListSection.tsx))
- **Recognize Button Not Re-clickable**: After successful track recognition, the button showed the track name and could not be pressed again. Added `handleClearRecognition` with an (×) button to clear and re-enable recognition. ([NowPlayingCard.tsx:442](src/components/NowPlayingCard.tsx))
- **Vercel Handler Missing `decodeURIComponent`**: `api/recognize.js` passed the raw URL query parameter to `recognizeTrack` without decoding, potentially failing on encoded stream URLs. ([api/recognize.js:19](api/recognize.js))

### ⚡ Performance

- Reduced ICY metadata timeout from 10s to 5s for faster fallback to Shazam.
- Reduced Shazam audio capture from 12s/18s to 10s/15s (duration/timeout).
- Increased client-side fetch timeout from 15s to 25s to accommodate Shazam fallback latency.

---

## [1.0.0-rc.1] — 2026-02-01

### 🚀 Platform Enhancements

- **Track Recognition Pipeline (v1.5)**: Implemented dual-pass recognition engine with ICY metadata parsing (fast path, ~1-2s) and automatic Shazam Discovery API fallback (~8-10s). Server-side audio capture buffers 10 seconds of stream data and submits via multipart POST to Shazam's reverse-engineered endpoint. Full CI/CD integration with Vite dev middleware and Vercel serverless function.
- **Serverless API Middleware**: Added `/api/recognize` endpoint in both Vite development server (configureServer hook) and Vercel (`api/recognize.js`/`recognize.mjs`) with CORS headers, query-parameter validation, and structured JSON response schema.
- **Radio Browser API Resiliency**: Expanded geo-redundant API node pool from 2 to 3 endpoints (de1, de2, at1) with automatic failover, retry interceptor (2 attempts with exponential backoff), and 30-second in-memory cache with TTL-based invalidation.
- **PWA Production Readiness**: Service worker now caches radio API responses (StaleWhileRevalidate, 24h TTL) and placeholder images (CacheFirst, 7-day TTL). Full `vite-plugin-pwa` integration with auto-update registration.

### 🔧 Fixed

- **Infinite API Request Loop**: Resolved critical bug in `RadioFlow.tsx` where `Date.now()` used as TanStack Query key caused unique key per render, triggering continuous refetching. Replaced with stable `randomSeed` state initialized once per mount. ([#127](https://github.com/sanot-tech/RadioFlow/issues/127))
- **Blank Page Crash on Startup**: `supabase/client.ts` threw unhandled error when environment variables were missing. Replaced with graceful null return with informative console warning. ([#131](https://github.com/sanot-tech/RadioFlow/issues/131))
- **Supabase Integration Fully Removed**: Stripped Supabase Auth (`AuthContext` now returns null user with no-op methods), Supabase favorites (`favoritesService` stubbed with localStorage fallback), and OAuth callback page (redirects to `/`). All Google Sign-In buttons rendered disabled with visual indicator.
- **FixedControls Icon Alignment**: Base `[&_svg]:size-4` (16px) Tailwind utility was overriding explicit `h-6 w-6` (24px) class on SVG icons, causing misalignment in the persistent bottom navigation bar. Added `[&_svg]:size-6` override at the component level.
- **NowPlayingCard Search Button**: `onOpenSearch` prop was missing from destructured props, causing runtime crash when the search icon was clicked. Made optional with `?.()` guard.

### 🧹 Chores

- Removed 11 deprecated documentation files (SUPABASE_GOOGLE_AUTH_SETUP, NOW_PLAYING_CARD_FIX, LOADING_INDICATORS_FIX, and others).
- Cleaned up unused Supabase dependencies and related type definitions.
- Updated Vite PWA configuration to cache radio API responses and image assets.

---

## [1.0.0-beta.4] — 2026-01-15

### 🎨 Design System Overhaul

- **Aurora UI Background Engine**: Implemented animated gradient backgrounds with CSS `@keyframes` for subtle color-shifting orbs. Three variants: default (purple-blue), player-active (green-cyan), and error (red-orange). GPU-composited for 60fps animation.
- **Glassmorphism Component Layer**: Applied `backdrop-filter: blur(16px)` with semi-transparent `rgba(255,255,255,0.05)` backgrounds to all card components, navigation bars, and the player card. Supporting border-radii follow a 12px/16px/24px scale.
- **OLED Dark Theme**: True `#000000` background for AMOLED power savings; `#0F0F23` for elevated surfaces; `#1B1B30` for card surfaces. Contrast ratio maintained at ≥ 7:1 for all text elements.
- **Micro-interaction System**: Added `transform: scale(1.02)` on card hover, `glow` effect on play button (box-shadow animation), and smooth `transition: all 200ms cubic-bezier(0.4, 0, 0.2, 1)` across all interactive elements.

### ⚡ Performance

- **Audio Visualizer Engine**: Rewrote Canvas 2D equalizer with adaptive quality degradation — falls back from 128 FFT bins to 64 on low-end devices. WebGL2 backend for devices with 60+ fps capability.
- **Bundle Optimization**: Code-split 8 route-level components with `React.lazy()` + Suspense. Reduced main bundle from 287KB to 156KB (gzip). Tree-shaken unused Radix primitives.
- **Station Grid Virtualization**: Implemented windowed rendering for station grids with 40+ cards. Only 12 cards rendered at any time; intersection observer triggers loading of next batch.

---

## [1.0.0-beta.3] — 2025-12-20

### ✨ New Features

- **AI Trend Correlation Engine**: Multi-dimensional matching algorithm (genre overlap 35% + keyword match 30% + mood analysis 20% + freshness 15%) producing 0–100 compatibility scores for every station against current YouTube Music, Spotify, Apple Music, Yandex Music, and VK Music trends.
- **Smart Trend Parser**: Web scraping pipeline targeting 7 music chart sources with adaptive rate limiting, HTML5 parsing, and NLP-based mood/era extraction. Results cached for 4 hours with forced refresh capability.
- **Top & Trending Station Pages**: Dedicated `/genre/top-vote` (community-voted ranking) and `/genre/trending` (AI-matched trending) pages with the same full-featured layout as the main discovery page (header, NowPlayingCard, FixedControls, genre carousel).
- **DiverseTrendGenerator**: Ensures minimum 50 stations displayed on trend pages with artificial diversity injection (genre rotation, country spread, bitrate variance) to prevent mono-culture results.

### 🔧 Fixed

- **Duplicate Stations in Genre Search**: Deduplication logic was comparing by station ID only; added secondary dedup by stream URL to catch stations registered under multiple names.
- **Genre Not Displaying**: Cache invalidation bug in `useGenres` hook was returning stale genre lists. Replaced aggressive caching with per-session fresh fetch. ([#98](https://github.com/sanot-tech/RadioFlow/issues/98))
- **Undefined in Genre Selector**: `stations.genre` could be `undefined` for stations without genre metadata. Added optional chaining and fallback to "Uncategorized" label.

---

## [1.0.0-beta.2] — 2025-11-10

### 🏗️ Infrastructure

- **Capacitor Integration**: Added Android and iOS platform targets with Capacitor 7.4. Native WebView optimizations: overscroll disabled, keyboard appearance configured, status bar theming.
- **Trinity Invariant Framework**: Custom runtime assertion library launched with 4 domain invariants — audio player finite state machine (5 valid states), authentication ACL (3 roles), favorites deduplication (pre-API-request), and station stream integrity (non-empty URL validation).
- **Audio Proxy Middleware**: Vite `configureServer` hook added at `/audio-proxy` to relay stream audio through the application server, bypassing CORS restrictions and mixed-content warnings. Content-Type passthrough preserves original stream format.

### 🔧 Fixed

- **Audio State Machine Violations**: Race condition when rapidly switching stations caused transition from 'playing' directly to 'loading' without passing through 'idle'. Invariant guard now enforces state machine path.
- **Favorites Error on Unauthenticated Access**: Protected route was rendering favorites page before auth check completed. Added AuthGate wrapper with loading skeleton.

---

## [1.0.0-beta.1] — 2025-10-25

### 🎉 Initial Beta Release

- **Radio Directory Service**: Full integration with radio-browser.info API (3 geo-redundant endpoints). Search by name, genre, country, and tags. Results cached for 30 seconds with automatic failover.
- **Genre-based Station Discovery**: Curated list of 20 approved genres with Russian/English localization. Horizontal carousel navigation on main page. Genre explorer page at `/genre/:genreName`.
- **Country-based Station Discovery**: 195+ country directory with station count indicators. Country explorer page at `/country/:countryName`.
- **Audio Player Core**: HTMLAudioElement-based player with play/pause, volume control, and station metadata display. Persistent across page navigation via RadioPlayerContext.
- **Favorites System**: Supabase-backed favorites with optimistic UI updates. TanStack Query mutation hooks with automatic cache invalidation on add/remove.
- **Google OAuth Authentication**: Supabase Auth with PKCE flow. Protected routes with AuthGate wrapper. Session persistence across browser tabs.
- **shadcn/ui Component Library**: 20+ primitive components (Button, Card, Dialog, DropdownMenu, Input, Sheet, Tooltip, etc.) with consistent dark theme theming.

### 🧹 Chores

- Initial Vite + React + TypeScript project scaffold
- Tailwind CSS 3.4 configuration with custom design tokens
- React Router v6 with lazy-loaded routes
- ESLint + Prettier code quality toolchain

---

## [1.0.0-alpha.1] — 2025-09-25

### 🚧 Initial Prototype

- Project initialization with Vite 6 + React 18 + TypeScript 5
- Audio player context with play/pause/stop functionality
- Basic radio station fetching from radio-browser.info (single endpoint)
- Minimal UI components using shadcn/ui primitives
- Axios-based API client with error handling

---

## Release Matrix

| Version | Date | Status | Highlights |
|---|---|---|---|
| 1.0.0-rc.2 | 2026-05-27 | ✅ Released | Shazam fallback, bug fixes, recognize UX |
| 1.0.0-rc.1 | 2026-02-01 | ✅ Released | Track recognition, API resiliency, Supabase removal |
| 1.0.0-beta.4 | 2026-01-15 | ✅ Released | Design system, visualizer, bundle optimization |
| 1.0.0-beta.3 | 2025-12-20 | ✅ Released | AI trend engine, smart parser, top/trending pages |
| 1.0.0-beta.2 | 2025-11-10 | ✅ Released | Capacitor, Trinity invariants, audio proxy |
| 1.0.0-beta.1 | 2025-10-25 | ✅ Released | Radio directory, genres, countries, auth, favorites |
| 1.0.0-alpha.1 | 2025-09-25 | ✅ Released | Initial prototype, audio player, basic API integration |

---

## Upcoming (Roadmap)

| Milestone | Target | Scope |
|---|---|---|
| v1.0.0-rc.2 | 2026-05-27 | ✅ Released | Shazam fallback, bug fixes, recognize UX |
| v1.0.0 | 2026 Q3 | Production release; SLA guarantees, SSO, audit logging |
| v1.1.0 | 2026 Q4 | Collaborative filtering, social features, API rate limiting |

---

<p align="center">
  <sub>© 2025–2026 RadioFlow Enterprise. All rights reserved.</sub><br>
  <sub>This changelog is maintained manually. For automated release notes, see GitHub Releases.</sub>
</p>
