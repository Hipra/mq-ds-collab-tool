# Lehetséges továbbfejlesztési irányok

> Készült: 2026-02-27 — a jelenlegi állapot (Phase 1–5 kész) alapján

---

## 1. Design Token rendszer

Jelenleg a prototípusok a MUI default témát használják. Egy saját design token rendszer lehetővé tenné:

- Egyedi szín-, tipográfia- és spacing-paletták definiálása prototípusonként
- Token szerkesztő UI az inspector panelben (pl. egy "Theme" tab)
- Token export/import (JSON vagy CSS variables formátumban)
- Figma variable-ökkel való szinkronizálás (a Figma MCP már elérhető)

**Hatás:** A prototípusok vizuálisan közelebb kerülnének a végleges termékhez, a designer–developer handoff egyszerűsödne.

---

## 2. Verziókezelés / History

A `copy-overlay.json` már tárol edit history-t, de ez kiterjeszthető:

- Teljes prototípus-szintű snapshot-ok (JSX + overlay + metadata)
- Visszaállítás korábbi verzióra
- Változások összehasonlítása (diff nézet)
- Timeline UI az oldalon belül

**Hatás:** Biztonságosabb iteráció, a csapat bátrabban kísérletezhet.

---

## 3. Valós idejű kollaboráció

Jelenleg a sharing read-only. Többfelhasználós szerkesztés irányába:

- WebSocket alapú valós idejű szinkronizáció (copy szerkesztés)
- Kurzor/jelenlét mutatók (ki melyik entry-t szerkeszti)
- Kommentelés/annotáció közvetlenül a preview-n (kattintás + megjegyzés)
- Értesítések (ha valaki módosít egy prototípust)

**Hatás:** A csapat párhuzamosan dolgozhat, nem kell várni egymásra.

---

## 4. Export / Handoff funkciók

A prototípusból végső deliverable generálása:

- **Copy export:** CSV/XLSX a copywriter-ek számára (összes szöveg + státusz)
- **Kód export:** tiszta React komponensek generálása (production-ready, CDN import nélkül)
- **Figma export:** prototípus visszaírása Figma-ba (`generate_figma_design` MCP-vel)
- **PDF export:** screenshot-alapú dokumentáció minden screen-ről

**Hatás:** Zökkenőmentes átmenet a prototípusból a végleges termékbe.

---

## 5. Komponens könyvtár / Reusable elemek

- Megosztott komponensek prototípusok között (pl. közös header, footer)
- Komponens "snippets" galéria, amiből Claude Code vagy a felhasználó válogathat
- Template rendszer: új prototípus létrehozása meglévőből

**Hatás:** Gyorsabb prototípus-készítés, konzisztens megjelenés.

---

## 6. Claude Code integráció elmélyítése

A jelenlegi clipboard-alapú integráció bővítése:

- Kontextuális prompt-ok: pl. "változtasd meg ezt a szöveget" közvetlenül a CopyTab-ból
- Copy-overlay automatikus alkalmazása a forrás JSX-re (szerkesztett szövegek visszaírása a kódba)
- AI-alapú javaslatok: "Ez a szöveg túl hosszú ehhez a komponenshez"

> Megjegyzés: az `apply-text-to-source.ts` fájl már létezik unstaged-ként — ebbe az irányba már elindult a munka.

**Hatás:** A copywriter munkája közvetlenül beépül a kódba, kevesebb manuális lépés.

---

## 7. Tesztelés és minőségbiztosítás

- Accessibility audit a preview-n belül (WCAG ellenőrzés prototípusonként)
- Responsive preview javítása: valódi device frame-ek (iPhone, iPad mockup)
- Visual regression: screenshot-ok összehasonlítása változtatások után
- Prototípus validáció: ellenőrzés, hogy minden szöveg le van-e fordítva / szerkesztve

**Hatás:** Magasabb minőségű prototípusok, kevesebb hiba a handoff során.

---

## 8. Perzisztencia és deployment

Jelenleg fájlrendszer-alapú, lokális fejlesztői eszköz. Skálázás irányába:

- Adatbázis backend (SQLite vagy PostgreSQL) a fájlrendszer helyett
- Felhasználói autentikáció (ki mit szerkeszthet)
- Cloud deployment lehetőség (csapat számára központilag elérhető)
- Git integráció: prototípus változásainak commitolása a UI-ból

**Hatás:** A tool csapatszinten használhatóvá válik, nem csak lokálisan.
