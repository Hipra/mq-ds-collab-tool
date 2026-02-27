# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-27)

**Core value:** Designers can quickly create and share interactive MUI-based prototypes that every team member can use from their own perspective (text editing, component inspection, dark/light mode)
**Current focus:** Phase 1 — Rendering Foundation

## Current Position

Phase: 1 of 4 (Rendering Foundation)
Plan: 1 of 2 in current phase
Status: In progress
Last activity: 2026-02-27 — Plan 01-01 complete (rendering pipeline)

Progress: [█░░░░░░░░░] 10%

## Performance Metrics

**Velocity:**
- Total plans completed: 1
- Average duration: 5 min
- Total execution time: 0.08 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-rendering-foundation | 1 | 5 min | 5 min |

**Recent Trend:**
- Last 5 plans: 01-01 (5 min)
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Setup]: Tech stack driven by research — Next.js 15 App Router, MUI v6, esbuild Node.js API, SQLite + Drizzle ORM, Zustand + TanStack Query
- [Phase 1]: ThemeProvider MUST live inside the sandboxed iframe from day one — cannot be retrofitted
- [Phase 1][01-01]: Route Handler (route.ts) used for /preview/[id] instead of page.tsx — produces standalone HTML bypassing Next.js layout system
- [Phase 1][01-01]: esbuild build() + esm.sh import map chosen — React/MUI served once via CDN, not bundled per prototype (~400KB savings per load)
- [Phase 1][01-01]: chokidar v4 (CJS) over v5 (ESM) — Node 18+ compatibility for Next.js 15 minimum
- [Phase 2]: Use AST-based (Babel) component inspection, NOT runtime fiber introspection — fiber approach breaks across React versions and is inaccessible inside iframes

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 4]: Static thumbnail generation approach (Playwright screenshot vs canvas vs SSR-to-image) needs a decision during Phase 4 planning

## Session Continuity

Last session: 2026-02-27
Stopped at: Completed 01-01-PLAN.md (rendering pipeline)
Resume file: None
