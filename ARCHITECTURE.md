# RadioFlow Studio — Architecture Reference

> **Document Version**: 2.0.0  
> **Classification**: Internal — Engineering  
> **Last Updated**: 2026-02-01  
> **Status**: ✅ Ratified

---

## 1. System Overview

RadioFlow Studio is a **cloud-native, single-page application (SPA)** engineered for **real-time internet radio intelligence**. The system operates on a **three-tier architecture** with strict separation of concerns, runtime invariant enforcement, and a **defense-in-depth** security model.

### 1.1 Architectural Philosophy

```
+-------------------------------------------------------------+
|                     ARCHITECTURAL PILLARS                     |
|                                                              |
|  1. INVARIANT-FIRST    — Every state mutation is guarded     |
|  2. COMPOSITION-ROOT   — Dependencies injected at boundaries |
|  3. OFFLINE-RESILIENT  — Graceful degradation is mandatory   |
|  4. OBSERVABLE-BY-DEF  — All subsystems emit structured logs |
|  5. FAIL-FAST          — Errors propagate, never silently    |
+-------------------------------------------------------------+
```

### 1.2 System Context Diagram

```
+================+         +=================+         +=================+
|                |   HTTPS |                 |   HTTPS |                 |
|   END-USER     |-------->|   RADIOFLOW     |-------->|   RADIO         |
|   BROWSER      |<--------|   APPLICATION   |<--------|   BROWSER API   |
|   (React SPA)  |  Stream |   (Vite/Vercel) |  JSON   |   (3 endpoints) |
|                |  Audio  |                 |         |                 |
+================+  Proxy  +=================+         +=================+
     |                          |                              |
     |                     +==========+                  +==========+
     |                     | SHAZAM   |                  | OPENROUTER|
     |                     | DISCOVERY|                  | GPT-4o-mini|
     |                     | API      |                  | (AI Desc) |
     |                     +==========+                  +==========+
     |
+==========+
|  PWA SV  |
|  WORKER  |
+==========+
```

---

## 2. Frontend Architecture (Presentation Tier)

### 2.1 Component Hierarchy

```
<App>
  ├── <AuthProvider>           — Context: AuthState (user, session, login/logout)
  ├── <RadioPlayerProvider>    — Context: AudioStateMachine, nowPlaying, queue
  ├── <Toaster />             — Sonner toast notifications (global)
  ├── <Routes>
  │   ├── "/" → <RadioFlow>              — Page: Station discovery + player
  │   │   ├── <TopBar />                 — Logo, search toggle, auth buttons
  │   │   ├── <GenreCarousel />          — Horizontal genre navigation
  │   │   ├── <StationGrid />            — Responsive station cards (CSS Grid)
  │   │   │   └── <StationCard />        — Individual station representation
  │   │   │       ├── <StationImage />   — Lazy-loaded favicon/placeholder
  │   │   │       ├── <StationInfo />    — Name, genre tags, bitrate, listeners
  │   │   │       └── <StationActions /> — Play, favorite, vote controls
  │   │   ├── <NowPlayingCard />         — Floating player card with controls
  │   │   │   ├── <AudioVisualizer />    — Web Audio API Canvas 2D equalizer
  │   │   │   └── <RecognizeButton />    — Track recognition trigger
  │   │   └── <FixedControls />          — Persistent bottom navigation bar
  │   ├── "/genre/top-vote" → <TopStations>       — Page: Top-rated stations
  │   ├── "/genre/trending" → <TrendingStations>  — Page: AI-matched trends
  │   ├── "/genre/:genre" → <GenreExplorer>       — Page: Genre-specific browse
  │   ├── "/country/:country" → <CountryExplorer> — Page: Country-specific browse
  │   ├── "/favorites" → <Favorites>              — Page: User favorites
  │   └── "/auth/callback" → <AuthCallback>       — Page: OAuth redirect handler
  └── </Routes>
```

### 2.2 State Management Strategy

| State Type | Mechanism | Scope | Persistence |
|---|---|---|---|
| **Server state** | TanStack Query (cache + GC) | Per-query | In-memory GC after 5 min |
| **Auth state** | React Context (`useReducer`) | Global | Session cookie (Supabase) |
| **Player state** | React Context (`useReducer`) | Global | None (ephemeral) |
| **UI state** | Local `useState` / `useReducer` | Component-scoped | None |
| **Cache layer** | Browser Cache API (SW) | Cross-session | IndexedDB via Workbox |
| **Favorites** | TanStack Query + Optimistic UI | Per-user | Supabase PostgreSQL |

### 2.3 Routing & Lazy Loading

All route-level components use React.lazy() + Suspense with a skeleton placeholder:

```typescript
const RadioFlow = lazy(() => import('@/pages/RadioFlow'));
const Favorites = lazy(() => import('@/pages/Favorites'));
```

Route transitions trigger a 200ms minimum skeleton display to prevent layout flash.

---

## 3. Audio Pipeline (Domain Layer)

### 3.1 Finite State Machine

```
                                    ┌──────────────┐
                          ┌────────│    ERROR      │◄────────┐
                          │        └──────────────┘         │
                          │                                 │
                    ┌─────▼─────┐                    ┌──────┴──────┐
       ┌───────────│  LOADING   │                    │   PAUSED    │
       │           └─────┬─────┘                    └──────┬──────┘
       │                 │                                 │
  ┌────▼─────┐          │                                 │
  │   IDLE   │          │     ┌──────────┐                │
  └────▲─────┘          └────►│ PLAYING  │◄───────────────┘
       │                      └──────────┘
       │                            │
       └────────────────────────────┘
```

- **Transitions**: `idle → loading → playing ↔ paused → error`
- **Enforcement**: Runtime invariant (`radioPlayer.λ.ts`) rejects illegal transitions with descriptive error
- **Guards**: Audio element `canPlay` event must fire before `playing` is permitted

### 3.2 Audio Proxy Middleware

In development mode, Vite middleware proxies radio streams through the application server to bypass CORS restrictions:

```
Client → GET /audio-proxy?url=<station-stream> → Vite Server → HTTP GET → Radio Station
```

Headers forwarded:
- `User-Agent`: `Mozilla/5.0 (... RadioFlow/1.0)`
- `Icy-MetaData`: `0` (disabled in proxy to avoid metadata interference)
- `Accept`: `*/*`

Response headers proxied:
- `access-control-allow-origin`: `*`
- `content-type`: original stream MIME type

---

## 4. Track Recognition Pipeline (v1.5)

### 4.1 Architecture

```
┌──────────┐     ┌──────────────┐     ┌─────────────────┐     ┌───────────────┐
│  Client  │────►│  /api/recog  │────►│  ICY Parser     │────►│  Shazam API   │
│  Button  │     │  (Vercel)    │     │  (1-2s fast)    │     │  (8-10s fall) │
└──────────┘     └──────────────┘     └─────────────────┘     └───────────────┘
                                              │                        │
                                              ▼                        ▼
                                      { track, artist }        { track, artist }
```

### 4.2 Data Flow

1. **Client** sends `GET /api/recognize?url=<streamUrl>`  
2. **Vercel Serverless Function** receives request and delegates to `recognizeTrack()`  
3. **Stage 1 — ICY Metadata** (fast path, ~1-2s):  
   - Sends `Icy-MetaData: 1` header  
   - Parses `StreamTitle='...'` from stream metadata blocks  
   - Returns immediately if found  
4. **Stage 2 — Shazam Discovery** (fallback, ~8-10s):  
   - Reconnects without metadata header  
   - Buffers ~160KB of audio data (~10 seconds at 128kbps)  
   - POSTs as `multipart/form-data` to Shazam discovery API  
   - Parses JSON response for `track.title` and `track.subtitle`

### 4.3 Recognition Response Schema

```typescript
interface RecognizeResult {
  track: string | null;   // "Bohemian Rhapsody"
  artist: string | null;  // "Queen"
  method: 'icy' | 'shazam' | 'no-icy' | 'no-data' | 'error' | 'timeout';
}
```

---

## 5. Trend Correlation Engine

### 5.1 Data Sources

| Source | Type | Refresh Cadence | Geographic Focus |
|---|---|---|---|
| YouTube Music | Web scraping | 4 hours | Global |
| Spotify Global 50 | Web scraping | 24 hours | Global |
| Apple Music Top 100 | Web scraping | 24 hours | Global |
| Yandex Music | Web scraping | 4 hours | Russia/CIS |
| VK Music | Web scraping | 4 hours | Russia/CIS |
| genre.fm | Web scraping | 12 hours | Global |

### 5.2 Matching Algorithm (Multi-Dimensional)

```
input: Station[] + Trends[]
output: ScoredStation[]

for each station in Station[]:
    score = 0
    score += genre_overlap(station.genre, trends.genres) * 0.35
    score += keyword_match(station.name + description, trend.keywords) * 0.30
    score += mood_analysis(station.tags, trends.vibe) * 0.20
    score += fresh_boost(trends.timestamp) * 0.15
    station.score = clamp(score, 0, 100)
return sort(stations, by: score desc) limit 50
```

---

## 6. Caching Strategy

### 6.1 Multi-Tier Cache Hierarchy

| Tier | Storage | TTL | Max Entries | Eviction |
|---|---|---|---|---|
| L1 — In-Memory (ES Module) | `Map<string, {data, timestamp}>` | 30s | 100 | LRU |
| L2 — localStorage | `window.localStorage` | 5 min | 50 | Manual flush |
| L3 — Service Worker | Cache API (IndexedDB) | 24h | 100 (API) + 50 (images) | SW lifecycle |

### 6.2 Cache Invalidation Rules

- **Radio API responses**: Invalidated on network error (triggers fallback to next API node)
- **Trend data**: Forced refresh every 4 hours (matching scraping cadence)
- **AI descriptions**: 7-day TTL with manual purge option
- **Station search results**: 30s TTL — stale data is acceptable for discovery

---

## 7. Security Model

### 7.1 Authentication Flow (OAuth 2.0 + PKCE)

```
1. User clicks "Sign in with Google"
2. App generates code_verifier + code_challenge (SHA-256)
3. Supabase Auth redirects to Google OAuth consent screen
4. Google redirects to /auth/callback with authorization code
5. Supabase exchanges code + code_verifier for session tokens
6. AuthContext.user is populated; protected routes become accessible
```

### 7.2 Content Security Policy

```
default-src 'self';
script-src 'self' 'strict-dynamic' 'nonce-{random}';
style-src 'self' 'unsafe-inline';
img-src 'self' data: https:;
connect-src 'self'
    https://*.api.radio-browser.info
    https://api.openrouter.ai
    https://amps.shazam.com
    https://*.supabase.co
    wss://*.supabase.co;
media-src 'self' https:;
```

---

## 8. Deployment Topology

### 8.1 Vercel Configuration

```
Production:    radioflow.app                        → Vercel Edge (US East)
Staging:       staging.radioflow.app                → Vercel Edge (US East)
Preview:       {branch}.radioflow.app               → Vercel Edge (per PR)
```

- **Function Runtime**: Node.js 20.x (Serverless)
- **Memory**: 512MB (default)
- **Max Duration**: 30s (Shazam recognition requires ≤ 15s)
- **Regions**: `iad1` (US East) — primary; failover to `hkg1` (Hong Kong)

### 8.2 Build Artifacts

| Artifact | Size (gzip) | Contains |
|---|---|---|
| `dist/assets/index-*.js` | 143KB | Application bundle (code-split) |
| `dist/assets/vendor-*.js` | 213KB | React, Router, Query, Radix |
| `dist/assets/index-*.css` | 52KB | Tailwind + shadcn/ui styles |
| `dist/sw.js` | 4KB | Service worker (Workbox) |

---

## 9. Error Handling & Observability

### 9.1 Error Taxonomy

| Category | Examples | Recovery |
|---|---|---|
| **Transient** | Network timeout, API 503 | Retry (up to 2× with exponential backoff) |
| **Terminal** | Invalid stream URL, malformed response | User-facing error toast |
| **Auth** | Expired session, invalid PKCE | Silent redirect to login |
| **Invariant** | Illegal state transition | Console error + state reset |

### 9.2 Logging Convention

```typescript
// Structured logging with correlation IDs
logger.info('AudioPlayer.transition', { from: 'loading', to: 'playing', stationId });
logger.error('RecognitionPipeline.failed', { method: 'shazam', error: err.message });
logger.warn('Cache.stale', { key: cacheKey, age: Date.now() - timestamp });
```

### 9.3 Runtime Diagnostics

- **Window**: `(window as any).__RADIOFLOW_DEBUG__` → exposes player state, cache keys, invariant checks
- **Console**: formatted group logs for audio pipeline, recognition, and state transitions

---

## 10. Performance Budget

| Metric | Budget | Enforcement |
|---|---|---|
| Total bundle (gzip) | ≤ 200KB | Vite rollup-plugin-visualizer |
| TTI (3G) | ≤ 3.5s | Lighthouse CI |
| TTI (WiFi) | ≤ 1.8s | Lighthouse CI |
| API p95 latency | ≤ 500ms | Grafana |
| Recognition (ICY) | ≤ 3s | Datadog RUM |
| Recognition (Shazam) | ≤ 12s | Datadog RUM |
| Lighthouse score | ≥ 90 | PR gate |

---

## 11. Constraints & Assumptions

### 11.1 Design Constraints

1. **Zero external audio processing dependencies**: No ffmpeg, no native audio codecs
2. **Single codebase**: Monorepo with no dedicated backend service
3. **Vercel serverless**: Max function duration 30s, 512MB memory
4. **No database dependency**: Station data obtained via public API; favorites stored in Supabase
5. **Client-side audio decoding**: Browser decodes MP3/AAC via HTMLAudioElement

### 11.2 Assumptions

1. Radio Browser API remains available with ≥ 99.5% uptime
2. Shazam Discovery API protocol remains stable (reverse-engineered)
3. Supabase Free Tier provides sufficient throughput for expected load
4. Client browsers support Web Audio API (all modern browsers)
5. Target audience has stable internet connection (≥ 256 kbps)

---

## 12. Glossary

| Term | Definition |
|---|---|
| **ICY** | Icecast metadata protocol — real-time stream metadata embedded in audio stream |
| **Trinity** | Custom runtime invariant framework enforcing Design by Contract |
| **Shazam Discovery** | Reverse-engineered API for audio fingerprint-based track identification |
| **ISR** | Incremental Static Regeneration — Vercel's hybrid rendering strategy |
| **Stale-While-Revalidate** | Cache strategy: serve stale data immediately, refresh in background |
| **Invariant** | A condition that must always hold true at runtime |
| **Capacitor** | Cross-platform native runtime for web applications |

---

<p align="center">
  <sub>© 2025–2026 RadioFlow Studio. All rights reserved.</sub><br>
  <sub>This document contains proprietary information. Distribution without authorization is prohibited.</sub>
</p>
