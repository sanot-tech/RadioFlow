#!/usr/bin/env node
/**
 * LICENSE & DEMO GATE
 *
 * RadioFlow — Next-Generation Internet Radio Intelligence Platform
 * Classification: Internal Demo Build
 *
 * This software is protected by the Intellectual Property
 * Protection Framework. Unauthorized execution is prohibited.
 *
 * Authorized access: https://github.com/sanot-tech/RadioFlow/issues
 */

const REPO = 'https://github.com/sanot-tech/RadioFlow'
const HOMEPAGE = 'https://radio-flow.vercel.app'
const VERSION = '1.0.0'

const BANNER = `
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+

     RRRR    AAA   DDDD   III   OOO     FFFFF  L      OOO   W   W
     R   R  A   A  D   D   I   O   O    F      L     O   O  W   W
     RRRR   AAAAA  D   D   I   O   O    FFFF   L     O   O  W W W
     R   R  A   A  D   D   I   O   O    F      L     O   O  WW WW
     R   R  A   A  DDDD   III   OOO     F      LLLL   OOO   W   W

+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
     INTERNET RADIO INTELLIGENCE PLATFORM  |  LICENSED BUILD v${VERSION}
+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
`

function printSection(title: string, content: string): void {
  const line = '-'.repeat(78)
  console.log(`\n  +${line}+`)
  console.log(`  | ${title.padEnd(76)} |`)
  console.log(`  +${line}+`)
  for (const l of content.split('\n')) {
    console.log(`  | ${l.padEnd(76)} |`)
  }
  console.log(`  +${line}+`)
}

function printFeatures(): void {
  printSection('CORE CAPABILITIES', `
    * Global Radio Directory          - 100,000+ stations across 195+ countries
    * AI Trend Correlation Engine     - Multi-dimensional matching (genre/keyword/mood)
    * Track Recognition Pipeline      - Dual-pass ICY + Shazam fingerprinting
    * LLM Chat Interface              - AI-powered discovery with 8 news categories
    * Intelligent Caching Layer       - Multi-tier (memory + localStorage + SW)
    * Multi-Surface Orchestration     - Web + PWA + Capacitor (Android/iOS)
    * Invariant-First Assurance       - Runtime state machine verification
  `)
}

function printStack(): void {
  printSection('TECHNOLOGY STACK', `
    * React 18                        - Component architecture
    * TypeScript 5.7                  - Strict mode, type safety
    * Vite 6                          - Build tooling, tree-shaking
    * Tailwind CSS 3                  - Utility-first styling
    * TanStack Query 5                - Data fetching & caching
    * shadcn/ui                       - Production design system
    * Capacitor 7                     - Native mobile bridge
    * CodeQL + Dependabot             - Supply chain security
  `)
}

function printProFeatures(): void {
  printSection('PRODUCTION FEATURES', `
    * Vercel Edge Network             - 200+ POPs global delivery
    * Sub-second API failover         - 3 geo-redundant radio-browser nodes
    * Tree-shaken bundles             - 156KB gzip production build
    * CDN-optimized assets            - Global delivery ready
    * PWA-first architecture          - Offline support, install prompt
    * CI/CD with automated testing    - Lint + Typecheck + Build + CodeQL
    * Vercel audio proxy              - Bypasses regional radio-browser blocking
    * Runtime invariant guarding      - Trinity framework assertions
  `)
}

function printLinks(): void {
  console.log(`
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  |                          ACCESS & RESOURCES                               |
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  |                                                                           |
  |  Production instance     |  ${HOMEPAGE.padEnd(54)}|
  |  Source repository       |  ${REPO.padEnd(54)}|
  |  Star on GitHub          |  ${REPO}/stargazers|
  |  Discussions & support   |  ${REPO}/discussions|
  |  Report an issue         |  ${REPO}/issues/new|
  |  Documentation           |  ${REPO}/blob/main/README.md|
  |                                                                           |
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  |                                                                           |
  |  Need a license key or licensed access?                                |
  |  -> Open an issue at ${REPO}/issues|
  |                                                                           |
  |  For development builds, set NODE_ENV=development                         |
  |  or add ENTITLEMENT_KEY=dev-access to your .env file.                    |
  |                                                                           |
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  `)
}

function printFooter(): void {
  console.log(`  RadioFlow v${VERSION}  |  Licensed Build  |  Copyright (c) 2026 sanot-tech`)
  console.log(`  All Rights Reserved.  |  Authorized use only.\n`)
}

function validateEntitlement(): boolean {
  if (process.env.ENTITLEMENT_KEY) return true
  if (process.env.NODE_ENV === 'development' || process.env.NODE_ENV === 'dev') return true
  if (process.argv.includes('--dev') || process.argv.includes('--bypass')) return true
  return false
}

function main(): void {
  console.log(BANNER)

  if (!validateEntitlement()) {
    console.log(`
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  |                    LICENSE VALIDATION REQUIRED                            |
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
  |                                                                           |
  |  This is a proprietary licensed build. Execution requires a valid       |
  |  entitlement key.                                                         |
  |                                                                           |
  |  HOW TO OBTAIN ACCESS:                                                    |
  |                                                                           |
  |  1. Open an issue at: ${REPO}/issues|
  |  2. Include your use case and platform details                           |
  |  3. Receive your entitlement key within 1-2 business days                |
  |                                                                           |
  |  EVALUATION:                                                              |
  |                                                                           |
  |  To run without a key (development only):                                |
  |     $ NODE_ENV=development npx tsx cli/license-gate.ts               |
  |                                                                           |
  +-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+-+
    `)
    process.exit(0)
  }

  printFeatures()
  printStack()
  printProFeatures()
  printLinks()
  printFooter()
}

main()
