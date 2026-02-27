# Phase 1: Rendering Foundation - Context

**Gathered:** 2026-02-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Sandboxolt iframe rendering pipeline — Claude Code által generált React/MUI .jsx fájlok élő megjelenítése a böngészőben. Error boundary hibakezelés, dark/light mód váltás, és MUI ThemeProvider a sandbox iframe-ben. Nem tartalmaz: inspector panelt, szövegszerkesztést, megosztható linkeket, multi-screen navigációt.

</domain>

<decisions>
## Implementation Decisions

### Fájl betöltés
- Claude Code egy fix projekt mappába ír (pl. `/prototypes/`), a webapp figyeli a mappát
- Hot reload: fájl mentéskor automatikusan frissül a preview
- Fájlstruktúra (egy fájl vs mappa per protó): Claude's discretion
- Metaadat kezelés (fájlnév vs config fájl): Claude's discretion

### Preview élmény
- Minimál toolbar a preview felett: protó neve, dark/light toggle, breakpoint váltó
- Betöltés közben: spinner (nem skeleton)
- Preview háttér (iframe körüli terület): Claude's discretion
- Empty state (nincs még protó): Claude's discretion

### Hiba megjelenítés
- Retry gomb a hibaüzenet mellett — teljes render hiba esetén legyen újrapróbálás lehetőség
- Hiba részletessége (fejlesztői stack trace vs egyszerűsített): Claude's discretion — a célközönséghez igazítva
- Hiba határ (csak hibás rész vs egész preview): Claude's discretion — ami technikailag megoldható

### Dark/light váltás
- Alapértelmezett mód: rendszert követi (prefers-color-scheme)
- Három állapotú toggle: Light / Dark / System
- Scope: az egész app shell ÉS a protó is vált (nem csak az iframe)
- Mentés: globális beállítás (nem protónként)

### Claude's Discretion
- Fájlstruktúra konvenció (egy fájl vs mappa per protó)
- Metaadat kezelés megoldása
- Preview háttér stílus
- Empty state design
- Error részletesség és hiba határ megoldás
- Loading spinner megjelenés

</decisions>

<specifics>
## Specific Ideas

- A toolbar legyen minimális — a fókusz a prototípuson legyen, ne a toolon
- Hot reload fontos: a designer Claude Code-ban dolgozik, és folyamatosan akarja látni a változást

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-rendering-foundation*
*Context gathered: 2026-02-27*
