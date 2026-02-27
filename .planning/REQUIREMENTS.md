# Requirements: MQ DS Collab Tool

**Defined:** 2026-02-27
**Core Value:** Designerek gyorsan tudjanak interaktív, valódi MUI komponensekből álló prototípusokat készíteni és megosztani, amit a csapat minden tagja a saját szemszögéből tud használni.

## v1 Requirements

### Rendering

- [ ] **REND-01**: Claude Code által generált React/MUI fájlok élő renderelése sandboxolt iframe-ben
- [ ] **REND-02**: Error boundary — hibás komponens ne crashelje az appot, olvasható hibaüzenet jelenik meg
- [ ] **REND-03**: Dark/light mód váltás a prototípuson belül (ThemeProvider a sandboxban)
- [ ] **REND-04**: Reszponzív preview — breakpoint váltó (xs 0px, sm 600px, md 900px, lg 1200px, xl 1536px) iframe átméretezéssel

### Inspector Panel

- [ ] **INSP-01**: Komponens fa megjelenítése — MUI komponens hierarchia fa nézetben
- [ ] **INSP-02**: Prop inspector — kiválasztott komponens propjainak és értékeinek megjelenítése
- [ ] **INSP-03**: Inline text editing — "Copy" tab ahol a copywriter látja az összes szöveget és szerkesztheti
- [ ] **INSP-04**: Közös panel két tabbal: "Copy" (copywriter szövegszerkesztés) és "Components" (fejlesztői komponens fa + propok)

### Megosztás & Kezelés

- [ ] **SHAR-01**: Megosztható link generálás — egyedi URL, auth nélkül megtekinthető
- [ ] **SHAR-02**: Prototípus lista oldal — keresés és szűrés (név, státusz, dátum)
- [ ] **SHAR-03**: Státusz workflow — draft → review → approved állapotgép

### Multi-screen

- [ ] **SCRN-01**: Több screen per prototípus — 5-10 screen támogatás
- [ ] **SCRN-02**: Screenek közötti navigáció a prototípuson belül (tab strip vagy sidebar)

### Theme

- [ ] **THME-01**: MUI default theme alkalmazása a sandbox-ban, architektúra felkészítése custom theme JSON betöltésre

## v2 Requirements

### Nézetek & UX

- **VIEW-01**: Role-based nézet váltás (Designer/Copywriter/Developer)
- **VIEW-02**: Keyboard shortcut navigáció (D=dark, L=light, 1-5=breakpoint)
- **VIEW-03**: Copy-to-clipboard MUI import path

### Megosztás Fejlesztések

- **SHAR-04**: Draft watermark megosztott linken ("NOT FINAL")
- **SHAR-05**: Status-gated sharing (csak approved protók public linkje)

### Theme Fejlesztések

- **THME-02**: Custom MUI theme JSON betöltés és alkalmazás
- **THME-03**: Design token integráció (Figma Variables export)

### Fejlett Funkciók

- **ADVN-01**: Annotation layer — komponens kiemelés MUI docs linkkel
- **ADVN-02**: Verziókezelés UI — prototípus snapshot history
- **ADVN-03**: Prototípus thumbnail generálás a listához

## Out of Scope

| Feature | Reason |
|---------|--------|
| Real-time kollaboráció | CRDT/WebSocket komplexitás, v1-ben egy ember szerkeszt |
| In-app AI chat | Claude Code a fő interfész, nem duplikáljuk |
| Drag-and-drop vizuális editor | Claude Code generálja a kódot, nem UI builder |
| Komment szálak | Figma/Slack már megoldja |
| Production code export | Prototípus eszköz, nem code generator |
| Custom komponens könyvtár | Standard MUI only v1-ben |
| User authentication recipients számára | View-only link auth nélkül elérhető |
| Visual regression testing | Chromatic/CI terület, nem prototípus tool |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| REND-01 | — | Pending |
| REND-02 | — | Pending |
| REND-03 | — | Pending |
| REND-04 | — | Pending |
| INSP-01 | — | Pending |
| INSP-02 | — | Pending |
| INSP-03 | — | Pending |
| INSP-04 | — | Pending |
| SHAR-01 | — | Pending |
| SHAR-02 | — | Pending |
| SHAR-03 | — | Pending |
| SCRN-01 | — | Pending |
| SCRN-02 | — | Pending |
| THME-01 | — | Pending |

**Coverage:**
- v1 requirements: 14 total
- Mapped to phases: 0
- Unmapped: 14 (roadmap pending)

---
*Requirements defined: 2026-02-27*
*Last updated: 2026-02-27 after initial definition*
