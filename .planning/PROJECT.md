# MQ DS Collab Tool

## What This Is

Egy belső prototípus-készítő és -megosztó webapp, ami MUI React komponensekre épül. Designerek Claude Code-on keresztül generálnak interaktív, reszponzív prototípusokat (5-10 screen, navigációval vagy anélkül), majd megosztható linken keresztül UX copywriterek szerkesztik a szövegeket, fejlesztők pedig a komponens-struktúrát és propokat vizsgálják.

## Core Value

Designerek gyorsan tudjanak interaktív, valódi MUI komponensekből álló prototípusokat készíteni és megosztani, amit a csapat minden tagja a saját szemszögéből tud használni (szöveg szerkesztés, komponens inspekció, dark/light mód).

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Claude Code-ból generált React/MUI fájlok megjelenítése élő prototípusként
- [ ] Megosztható link generálás prototípusokhoz
- [ ] Inspector panel: komponens fa és propok megjelenítése (fejlesztői nézet)
- [ ] Szövegszerkesztő panel: inline szövegek szerkesztése (copywriter nézet)
- [ ] Dark/light mód váltás a prototípuson belül
- [ ] Reszponzív nézet standard MUI breakpointokkal (xs/sm/md/lg/xl)
- [ ] Prototípus státusz kezelés (draft → review → approved)
- [ ] Prototípusok listázása és keresése
- [ ] AI-asszisztált prototípus-létrehozás Claude Code-ban (conversation flow: mit építünk, méretek, javaslatok, státusz emlékeztető)
- [ ] MUI theme támogatás (jelenleg default, később custom design tokenek)
- [ ] Prototípusok megőrzése és későbbi továbbfejleszthetősége

### Out of Scope

- Valós idejű kollaboráció (v1-ben egy ember dolgozik egy protón) — komplexitás
- Verziókezelés UI (git history elegendő) — v1-ben nem prioritás
- Kommentelés a toolban (Slack/email marad) — egyszerűség
- Vizuális drag-and-drop editor — Claude Code a fő interfész
- Webapp-on belüli AI chat — Claude Code-ban marad a conversation
- Production kód generálás — ez prototípus eszköz, nem code generator

## Context

- A csapat MUI-t használ a production alkalmazásokhoz, ezért a prototípusoknak is MUI-ra kell épülniük
- A workflow: designer leírja Claude Code-nak → Claude Code React fájlokat generál → a webapp megjeleníti → megosztja → copywriter szerkeszti a szövegeket → fejlesztő megnézi a struktúrát → státuszt állítanak
- Design token rendszer még nem kész, egyelőre MUI default theme, de a rendszernek fel kell készülnie custom theme-re
- A prototípusok jellemzően 5-10 screenből állnak, néha navigációval, néha anélkül
- Breakpointok: xs (0px), sm (600px), md (900px), lg (1200px), xl (1536px) — standard MUI

## Constraints

- **Komponens könyvtár**: Kizárólag standard MUI komponensek (custom wrapperek nélkül)
- **Prototípus-készítés**: Claude Code a fő interfész, a webapp nem tartalmaz AI chat-et
- **Theme**: Egyelőre MUI default, de az architektúrának támogatnia kell custom theme cserét

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Claude Code mint prototípus-készítő interfész | A designer már ismeri, nem kell új editort tanulnia | — Pending |
| Standard MUI komponensek, nem custom wrapperek | Egyszerűség, széles dokumentáció, nincs maintenance overhead | — Pending |
| Egyszerű státusz flow (draft/review/approved), nem kommentek | Kommentelés Slacken/emailben történik, a tool nem próbál Figma lenni | — Pending |
| Default MUI theme egyelőre, custom token rendszer később | A token rendszer még alakul, nem blokkolhatja a fejlesztést | — Pending |
| Tech stack: kutatás döntse el | Nincs erős preferencia, a research ajánljon optimális megoldást | — Pending |
| Deploy: később eldöntjük | Nem kritikus v1-ben | — Pending |

---
*Last updated: 2026-02-27 after initialization*
