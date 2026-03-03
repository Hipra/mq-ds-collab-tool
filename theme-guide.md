# Theme testreszabási útmutató

## A két réteg

A prototípusok témája két helyen konfigurálható:

| Réteg | Fájl | Mire jó |
|---|---|---|
| **Paletta, tipográfia, shape, spacing** | `theme-config.json` | MUI token-szintű értékek |
| **Komponens-szintű overrides** | `src/lib/prototype-overrides.ts` | Gomb padding, border-radius, shadow stb. |

Mindkét réteg automatikusan érvényes minden prototípusra (meglévőkre is).

---

## `theme-config.json` — paletta és globális tokenek

### Struktúra

```json
{
  "palette": {
    "light": { ... },
    "dark":  { ... }
  },
  "typography": { ... },
  "shape":      { ... },
  "spacing":    8
}
```

Csak az eltérő értékeket kell megadni — a hiányzó mezők a MUI v7 defaultokra esnek vissza.

---

### `palette.light` / `palette.dark` — mezők

#### Szín tokenek (mind kötelező ha meg van adva a blokk)

```json
"primary":   { "light": "#42A5F5", "main": "#1976D2", "dark": "#1565C0", "contrastText": "#fff" },
"secondary": { "light": "#BA68C8", "main": "#9C27B0", "dark": "#7B1FA2", "contrastText": "#fff" },
"error":     { "light": "#EF5350", "main": "#D32F2F", "dark": "#C62828", "contrastText": "#fff" },
"warning":   { "light": "#FF9800", "main": "#ED6C02", "dark": "#E65100", "contrastText": "#fff" },
"info":      { "light": "#03A9F4", "main": "#0288D1", "dark": "#01579B", "contrastText": "#fff" },
"success":   { "light": "#4CAF50", "main": "#2E7D32", "dark": "#1B5E20", "contrastText": "#fff" }
```

- `main` — az alapszín, ez jelenik meg a komponenseken
- `light` / `dark` — hover és focus állapotokhoz, MUI automatikusan is tudja generálni `main`-ből
- `contrastText` — szöveg szín a `main` háttér felett (általában `#fff` vagy `#000`)

#### Háttérszínek

```json
"background": {
  "default": "#ffffff",
  "paper":   "#ffffff"
}
```

- `default` — az oldal háttere
- `paper` — Paper, Card, Dialog, Popover háttere

#### Szövegszínek

```json
"text": {
  "primary":   "rgba(0, 0, 0, 0.87)",
  "secondary": "rgba(0, 0, 0, 0.6)",
  "disabled":  "rgba(0, 0, 0, 0.38)"
}
```

#### Elválasztó

```json
"divider": "rgba(0, 0, 0, 0.12)"
```

#### Action tokenek

```json
"action": {
  "active":            "rgba(0, 0, 0, 0.54)",
  "hover":             "rgba(0, 0, 0, 0.04)",
  "selected":          "rgba(0, 0, 0, 0.08)",
  "disabled":          "rgba(0, 0, 0, 0.26)",
  "disabledBackground":"rgba(0, 0, 0, 0.12)"
}
```

---

### `typography`

```json
"typography": {
  "fontFamily": "\"Inter\", \"Helvetica\", \"Arial\", sans-serif",
  "fontSize": 14
}
```

- `fontFamily` — alap betűcsalád (a JSON-ban a belső idézőjeleket `\"` kell escapelni)
- `fontSize` — alap méret px-ben; a MUI ebből számítja a `rem` értékeket (`body1` = `fontSize/14 * 1rem`)

---

### `shape`

```json
"shape": {
  "borderRadius": 4
}
```

Az alap border-radius token px-ben. A MUI komponensek ezt szorozzák (`borderRadius * 2`, `borderRadius * 3` stb.).

---

### `spacing`

```json
"spacing": 8
```

Az alap spacing unit px-ben. `theme.spacing(2)` = `16px`.

---

## `src/lib/prototype-overrides.ts` — komponens-szintű overrides

Ide kerülnek a komponens vizuális viselkedésének módosításai. **Csak plain object** — nincs theme függvény, nincs CSS variable referencia (JSON-ba kell serializálni).

### Példa — Button DS alignment

```ts
export const prototypeComponentOverrides: Components<Theme> = {
  MuiButton: {
    styleOverrides: {
      root: {
        borderRadius: 100,
        textTransform: 'none',
      },
      sizeMedium: { padding: '10px 24px' },
    },
  },
};
```

### Fontos korlát

Mivel ez a fájl JSON-ná alakul és az iframe-be töltődik, **nem használható**:
- `({ theme }) => ...` callback
- `var(--mui-palette-...)` CSS változók
- `alpha()`, `darken()` stb. helper függvények

Ha ilyesmire van szükség → `src/lib/theme.ts`-ben kell megoldani (de az csak az app shellre vonatkozik, a prototípus iframe-re nem).

---

## Workflow — DS értékek bekötése Figmából

1. Figmából kimérni az értékeket (szín, padding, radius stb.)
2. Paletta tokenek → `theme-config.json`
3. Komponens overrides → `prototype-overrides.ts`
4. `npm run dev` → ellenőrzés a prototípusban
