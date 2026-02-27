# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-27)

**Core value:** Designers can quickly create and share interactive MUI-based prototypes that every team member can use from their own perspective (text editing, component inspection, dark/light mode)
**Current focus:** Phase 1 — Rendering Foundation

## Current Position

Phase: 1 of 4 (Rendering Foundation)
Plan: 0 of ? in current phase
Status: Ready to plan
Last activity: 2026-02-27 — Roadmap created, traceability updated

Progress: [░░░░░░░░░░] 0%

## Performance Metrics

**Velocity:**
- Total plans completed: 0
- Average duration: —
- Total execution time: 0 hours

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| - | - | - | - |

**Recent Trend:**
- Last 5 plans: —
- Trend: —

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Setup]: Tech stack driven by research — Next.js 15 App Router, MUI v6, esbuild Node.js API, SQLite + Drizzle ORM, Zustand + TanStack Query
- [Phase 1]: esbuild + Next.js 15 App Router API route integration needs verification — `external` vs importmap for React/MUI delivery affects all prototype load times (~400KB/proto if bundled, once if importmap)
- [Phase 1]: ThemeProvider MUST live inside the sandboxed iframe from day one — cannot be retrofitted
- [Phase 2]: Use AST-based (Babel) component inspection, NOT runtime fiber introspection — fiber approach breaks across React versions and is inaccessible inside iframes

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 1 research flag]: esbuild `external` vs importmap decision must be resolved before implementation begins — affects bundle architecture for all subsequent phases
- [Phase 4]: Static thumbnail generation approach (Playwright screenshot vs canvas vs SSR-to-image) needs a decision during Phase 4 planning

## Session Continuity

Last session: 2026-02-27
Stopped at: Roadmap and STATE.md created — ready to plan Phase 1
Resume file: None
