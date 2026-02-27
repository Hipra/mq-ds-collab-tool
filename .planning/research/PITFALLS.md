# Domain Pitfalls

**Domain:** Live React/MUI component rendering and prototyping tool
**Researched:** 2026-02-27
**Confidence:** MEDIUM — Based on training data (cutoff Aug 2025). Web verification unavailable. Core security and architectural patterns are well-established; specific library version behaviors should be verified.

---

## Critical Pitfalls

Mistakes that cause rewrites, security incidents, or fundamentally broken architecture.

---

### Pitfall 1: Rendering Arbitrary User Code Without Isolation

**What goes wrong:** The app executes Claude Code-generated JSX/JS directly in the main application context (using `eval()`, `new Function()`, or a transpiler like Babel standalone without sandboxing). Any generated code — intentionally or by Claude hallucination — can access `window`, `document`, `localStorage`, cookies, and make network requests. In a shared-link scenario, a malicious actor could craft a prototype that exfiltrates data from any viewer's browser.

**Why it happens:** Developers reach for the simplest solution: `react-live` or Babel standalone in the same origin as the app. It works instantly for demos. The security gap only becomes visible later.

**Consequences:**
- XSS attacks via shared prototype links
- Session token theft from anyone who views a prototype link
- Arbitrary DOM manipulation outside the prototype frame
- Prototype access to the app's own React state and Redux stores

**Prevention:**
- Run all user-generated code inside a sandboxed `<iframe>` with `sandbox="allow-scripts"` (without `allow-same-origin`)
- Host the iframe renderer on a separate origin or subdomain (e.g., `preview.yourdomain.com`)
- Use `postMessage` for communication between the main app and the iframe
- Consider Sandpack (by CodeSandbox) which implements this isolation by default
- Set strict CSP headers on the preview origin: `script-src 'self'`; block all external fetch from the preview

**Warning signs:**
- You can call `window.parent` from inside generated code and get a response
- The preview renders in the same `document` as the nav bar
- You can `console.log(window.__APP_STATE__)` from inside a prototype

**Phase:** Address in Phase 1 (rendering foundation). Cannot be retrofitted safely.

---

### Pitfall 2: Claude Code Output Is Not a Fixed Contract

**What goes wrong:** The rendering system is built to expect a specific code shape from Claude Code — e.g., a default-exported React component, specific import syntax, no top-level side effects. Claude Code's output varies: it sometimes wraps in `export default function App()`, sometimes in `const App = () =>`, sometimes adds extra imports, sometimes outputs multiple components in one file, sometimes uses JSX fragments, sometimes not. When the output format shifts, rendering silently breaks or throws cryptic errors.

**Why it happens:** LLM output is probabilistic. There is no enforced contract between Claude Code and the renderer. Teams build the happy path and discover edge cases in production.

**Consequences:**
- Prototypes fail to render with no useful error message to the designer
- Designers blame themselves and re-prompt Claude Code repeatedly
- Support burden on developers to diagnose rendering failures

**Prevention:**
- Build a normalization layer between raw Claude Code output and the renderer. This layer handles: extracting the default export, stripping unsupported import patterns, wrapping bare JSX in a component
- Define and document the expected input format explicitly (e.g., "one default-exported React component, MUI imports only")
- Provide Claude Code with a system prompt / CLAUDE.md instruction that specifies the exact output format
- Display structured parse errors to the designer ("Could not find a default export — make sure your component ends with `export default MyComponent`")
- Add a test suite of Claude Code output samples that exercises the normalization layer

**Warning signs:**
- The renderer only has a single happy-path test case
- "Just re-ask Claude" is the documented fix for rendering failures
- Import resolution is done with naive string matching

**Phase:** Address in Phase 1 (rendering). The normalization layer is a first-class concern, not a polish item.

---

### Pitfall 3: MUI ThemeProvider Is Not in the Rendering Sandbox

**What goes wrong:** The prototype renders inside a sandbox or iframe, but the `ThemeProvider` and `CssBaseline` are only in the main app. Generated MUI components render with default browser styles or broken typography, not MUI's theme. When the team later adds custom design tokens, nothing in the sandbox picks them up.

**Why it happens:** When setting up the sandbox, developers focus on getting JSX to render at all. Theme injection is an afterthought. With iframe-based sandboxing, the main app's providers are completely inaccessible.

**Consequences:**
- Prototypes look wrong — wrong fonts, wrong spacing, wrong colors
- Dark/light mode switching doesn't affect the rendered prototype
- Future custom theme integration requires a full sandbox rebuild
- MUI Emotion cache may conflict between the host app and the sandbox

**Prevention:**
- The sandbox renderer must initialize its own `ThemeProvider` wrapping all rendered content
- Pass theme configuration into the sandbox via `postMessage` (for iframe) or props (for same-origin renderer)
- Build the theme-passing mechanism from day one, even if the only theme is MUI default
- Use MUI's `createTheme` + `ThemeProvider` in the sandbox entry point, not in the main app
- For iframe sandboxes: serialize the theme object to JSON and pass via `postMessage` on mount and whenever theme changes

**Warning signs:**
- The prototype preview is not wrapped in `<ThemeProvider>`
- Dark mode toggle changes the main app but not the prototype
- MUI components in the prototype render with default browser font instead of Roboto

**Phase:** Address in Phase 1. Retrofitting theme injection into an established sandbox is painful.

---

### Pitfall 4: Emotion/MUI Style Conflicts When Not Using Iframe Isolation

**What goes wrong:** If you render the prototype in the same DOM as the host app (e.g., using a same-origin div with react-live), Emotion generates CSS class names that can conflict between the host app's MUI components and the prototype's MUI components. Styles bleed between the two trees. This is especially bad when rendering multiple prototypes on a list page.

**Why it happens:** Emotion uses a single cache by default. Two separate MUI trees in the same document share the same cache, causing class name collisions and style overrides.

**Consequences:**
- Prototype styles randomly override or inherit from the main app
- Inconsistent rendering depending on which components are mounted
- CSS specificity bugs that are nearly impossible to debug

**Prevention:**
- If not using iframe isolation: create a separate Emotion cache for the prototype renderer using `@emotion/cache` with a distinct `key` (e.g., `proto`)
- Pass the custom cache via `CacheProvider` from `@emotion/react` wrapping the prototype
- Consider Shadow DOM for style isolation (complex, but eliminates all style bleed)
- Prefer iframe isolation — it eliminates this class of problem entirely

**Warning signs:**
- The host app's button padding changes when a prototype with buttons is mounted
- Font size on the main nav changes when the prototype preview opens
- You can see `.MuiButton-root` class names from the prototype in the main app's elements

**Phase:** Address in Phase 1 if using same-origin rendering; irrelevant if using iframe.

---

### Pitfall 5: Live Transpilation Blocking the Main Thread

**What goes wrong:** Babel standalone (used by react-live and similar) runs synchronously on the main thread. For prototype files with many components (5-10 screens), transpilation can take 200-800ms, causing the UI to freeze noticeably on every re-render or code update.

**Why it happens:** Babel standalone is the simplest transpilation option and works fine for small snippets. Prototype files are not snippets — they are full multi-component files.

**Consequences:**
- UI freezes when opening or switching prototypes
- Text editing in the copywriter panel triggers re-transpilation, causing input lag
- Inspector panel triggers re-transpilation on every interaction
- Poor perceived performance despite fast actual data fetching

**Prevention:**
- Move transpilation to a Web Worker (Sandpack does this; react-live does not by default)
- Cache transpilation results — if the source code hasn't changed, use the cached output
- Only re-transpile when source changes, not on every component interaction
- Consider build-time transpilation for saved prototypes (transpile once on save, store the output)
- If using react-live: wrap the `LiveProvider` carefully and debounce any live-editing triggers

**Warning signs:**
- Opening a prototype causes a visible UI freeze
- The browser's main thread shows 500ms+ tasks in Performance DevTools
- Editing text in the copywriter panel causes input to stutter

**Phase:** Address in Phase 2 (performance optimization). Phase 1 can use naive transpilation. Phase 2 must address before user testing.

---

### Pitfall 6: Component Inspector Relies on Runtime Hacks Instead of Design

**What goes wrong:** The inspector panel is built by walking `document.querySelectorAll('[data-component]')` or using React DevTools-style fiber tree traversal at runtime. This is fragile, breaks with React version changes, doesn't work inside iframes, and produces unreliable component trees that confuse developers.

**Why it happens:** Component inspection sounds like it requires deep React internals access. Developers reach for existing DevTools approaches without considering whether a simpler design-time approach fits the use case.

**Consequences:**
- Inspector breaks on React updates
- Iframe boundary makes `__REACT_DEVTOOLS_GLOBAL_HOOK__` inaccessible
- The "component tree" shown is DOM-shaped rather than React-component-shaped
- Props inspection is limited to what can be inferred from DOM attributes

**Prevention:**
- At the source code level: parse the JSX AST (using Babel or `@babel/parser`) to extract component structure and props before rendering
- Pass the AST-derived component tree as structured data alongside the rendered output
- This approach is completely sandboxing-independent and works reliably
- For prop values: show the source code prop values (strings, numbers from AST), not runtime values
- Scope the inspector to "what the developer wrote" not "what React has in memory" — this matches the prototype use case

**Warning signs:**
- The inspector code references `__REACT_FIBER__` or `__reactFiber`
- Inspector only works when React DevTools browser extension is installed
- Inspector stops working after a React minor version update

**Phase:** Address in Phase 2 (inspector panel). Design the AST-parse approach from the start.

---

### Pitfall 7: Text Editing Breaks the Prototype's Source of Truth

**What goes wrong:** The copywriter edits text inline. These edits are stored somewhere (state, database). When the designer later updates the prototype from Claude Code (new source file), the edited texts are silently overwritten. Alternatively, text edits are applied by mutating the stored source code directly, making the source code unreadable and un-regeneratable.

**Why it happens:** Text editing and source code management are designed independently. The integration point — "what wins when source updates" — is not specified.

**Consequences:**
- Copywriters lose their work when designers update prototypes
- Designers can't update prototypes without checking with copywriters first
- The source code becomes a patched mess of manual string replacements
- Status workflow (draft → review → approved) doesn't account for text changes

**Prevention:**
- Store text overrides as a separate, keyed overlay on top of the prototype source (not mutations to the source code itself)
- Key each text node by component path + prop name (e.g., `Header.title`, `Button[2].children`)
- When rendering, apply the overlay on top of the AST before transpilation
- On prototype source update: diff the new source against the old, flag which overlays may be stale
- Make it explicit in the UI: "This prototype has 3 text overrides. Source was updated — check if they still apply."

**Warning signs:**
- Text edits are stored as `source.replace("old text", "new text")`
- There is no separate `text_overrides` table or field in the data model
- Re-uploading a prototype silently resets all text edits with no warning

**Phase:** Address in Phase 2 (text editing) and ensure the data model supports it from Phase 1.

---

### Pitfall 8: Shared Link Security Has No Access Control

**What goes wrong:** Shareable prototype links are implemented as unguessable UUIDs with no authentication. This means anyone with the link can view the prototype, including people outside the team. For internal prototyping tools with potentially sensitive product designs, this is a leak risk.

**Why it happens:** Unguessable links are the path of least resistance for sharing. They feel secure because the URL is hard to guess.

**Consequences:**
- Prototype URLs indexed by browser history sync or corporate proxies
- Accidentally shared links expose unreleased product designs
- No way to revoke access without deleting the prototype
- Links shared in public Slack channels or emails remain active forever

**Prevention:**
- Decide explicitly: is this tool internal-only or can external stakeholders view?
- For internal-only: require authentication even for shared links (the "viewer" role needs login)
- For external sharing: add link expiry and revocation to the data model from the start
- At minimum: add a `is_public` flag per prototype and a revocation endpoint
- Do not index share links in search engines (`X-Robots-Tag: noindex` on preview pages)

**Warning signs:**
- Shared link works when you open it in an incognito window without logging in, and this is intentional
- There is no expiry field on the `share_links` table
- No UI to revoke a previously shared link

**Phase:** Address in Phase 1 (data model) and Phase 2 (sharing feature). Retrofitting auth onto share links is painful.

---

## Moderate Pitfalls

---

### Pitfall 9: MUI Import Alias Mismatch in the Sandbox

**What goes wrong:** Claude Code generates imports like `import { Button } from '@mui/material'`. The sandbox's module resolver must map this import to the actual MUI runtime. If the mapping is incomplete or uses a different MUI version than expected, components fail to render with cryptic "module not found" errors.

**Prevention:**
- Explicitly define and lock the import scope: list every MUI module path the sandbox will resolve
- Use a single version of `@mui/material`, `@mui/icons-material`, `@emotion/react`, `@emotion/styled` in the sandbox
- Pin versions in the sandbox bundle — don't allow version drift between the main app and sandbox
- Test with the actual import patterns Claude Code produces (they vary: named exports, default exports, icon imports)

**Warning signs:**
- "Cannot resolve module '@mui/icons-material/Search'" for any icon not explicitly tested
- The sandbox resolves `@mui/material` but not `@mui/material/styles`

**Phase:** Address in Phase 1 (sandbox module resolution).

---

### Pitfall 10: Responsive Preview Using CSS Scaling Instead of Actual Viewport

**What goes wrong:** The responsive breakpoint switcher (xs/sm/md/lg/xl) is implemented by scaling the iframe with `transform: scale()` instead of changing the iframe's actual width. MUI's responsive breakpoints are based on viewport width via media queries, not on the component's rendered size. A "scaled" preview gives wrong breakpoint behavior.

**Prevention:**
- Set the iframe's actual `width` CSS property to the target breakpoint width
- Use `width: 600px` for sm preview, not `transform: scale(0.5)` on a full-width iframe
- Contain the resized iframe in a scrollable viewport container so the UI doesn't break
- Test that MUI's `useMediaQuery` and `sx` responsive syntax behave correctly at each breakpoint width

**Warning signs:**
- The "mobile" preview shows the md-breakpoint layout at a smaller size
- `useMediaQuery(theme.breakpoints.down('sm'))` returns false in the "mobile" preview
- Changing breakpoint makes the content smaller/larger but doesn't reflow

**Phase:** Address in Phase 2 (responsive preview feature).

---

### Pitfall 11: No Error Boundary Around the Rendered Prototype

**What goes wrong:** The rendered prototype throws a JavaScript error (React rendering error, runtime TypeError). Without an error boundary, the entire host application crashes, not just the prototype preview. This is especially bad because Claude Code output is not guaranteed to be error-free.

**Prevention:**
- Wrap the rendered prototype in a React `ErrorBoundary` component
- Show a useful error message inside the preview area: the error type, the line number, and a "Copy error" button
- Log errors to a server-side error log for debugging
- Separate error states: "parse error" (can't transpile) vs "render error" (transpiled but threw)

**Warning signs:**
- A prototype error causes the nav bar and other UI to disappear
- There is no visible error state in the prototype preview area

**Phase:** Address in Phase 1 (rendering foundation).

---

### Pitfall 12: Status Workflow Not Enforced at the Data Layer

**What goes wrong:** The draft/review/approved status is stored but not enforced. Copywriters can edit approved prototypes. Designers can push new source to a prototype in "review" state. The status becomes a display label rather than a workflow gate.

**Prevention:**
- Define which actions are allowed in each state at the API layer, not just the UI
- `approved` prototypes: source updates require a new draft; text edits may be allowed with an explicit "re-open" action
- `review` prototypes: source updates automatically reset to draft with a changelog note
- Make state transitions explicit events (not just field updates) for auditability

**Warning signs:**
- Status is a `varchar` field updated with a simple `UPDATE` statement anywhere in the codebase
- No server-side validation of "can this user do this action in this state?"

**Phase:** Address in Phase 2 (status workflow feature).

---

## Minor Pitfalls

---

### Pitfall 13: Over-Engineering the Storage Format for Prototype Source

**What goes wrong:** Teams store prototype source as a structured AST JSON, or in a custom binary format, to enable "smart" features. This makes it impossible to simply view, edit, or migrate prototype source with standard tools.

**Prevention:**
- Store prototype source as plain text (the React/JSX file content)
- Parse to AST on demand (at read time), never as the primary storage format
- Plain text survives schema migrations, manual fixes, and debugging

**Phase:** Address in Phase 1 (data model).

---

### Pitfall 14: Reinventing Module Bundling Instead of Using Sandpack

**What goes wrong:** The team builds a custom module resolver and bundler to avoid Sandpack's complexity. This becomes a significant maintenance burden as Claude Code starts using more imports (`lodash`, `date-fns`, etc.) or new MUI packages.

**Prevention:**
- Use Sandpack or a well-maintained iframe sandbox solution as the rendering foundation
- Scope the allowed imports tightly (MUI + React + a short allowlist) and reject anything outside the list with a clear error
- Don't attempt to resolve arbitrary npm packages — that's Sandpack's job, not yours

**Phase:** Address in Phase 1 (architecture decision).

---

### Pitfall 15: Prototype List Page Performance with Many Prototypes

**What goes wrong:** Each prototype card in the list renders a live preview thumbnail (a mini iframe or canvas render). With 20+ prototypes, this causes 20+ simultaneous transpilations and iframe loads, making the list page unusable.

**Prevention:**
- Thumbnail previews are static screenshots (generated once on save/publish) not live renders
- Only the "open" prototype renders live
- Implement virtual scrolling for the list if the number grows large

**Phase:** Address in Phase 3 (list/search feature).

---

## Phase-Specific Warnings

| Phase Topic | Likely Pitfall | Mitigation |
|-------------|---------------|------------|
| Phase 1: Rendering foundation | Arbitrary code execution in main origin | Use iframe with `sandbox="allow-scripts"` on separate origin from day one |
| Phase 1: Rendering foundation | No error boundary | Wrap renderer in ErrorBoundary before any other feature |
| Phase 1: MUI theme setup | ThemeProvider not in sandbox | Initialize ThemeProvider inside the sandbox entry point |
| Phase 1: Data model | Text edits and source are coupled | Design `text_overrides` as a separate store from prototype source |
| Phase 2: Inspector panel | Runtime fiber traversal | Parse AST at source level, not at runtime |
| Phase 2: Text editing | Text overlays overwritten on source update | Build overlay diff/stale detection into the update flow |
| Phase 2: Responsive preview | CSS scaling not real viewport | Use actual iframe width, not transform:scale |
| Phase 2: Sharing | No access revocation | Add `is_public` + `expires_at` + revocation to share link model |
| Phase 3: List/search | Live thumbnails on list page | Use static screenshots, not live renders |

---

## Sources

- **react-live** GitHub issues and documentation (training data, HIGH confidence for limitations)
- **Sandpack** architecture documentation (training data, MEDIUM confidence — verify current API)
- **MUI Emotion cache isolation** — documented in MUI v5+ docs under `CacheProvider` (training data, HIGH confidence for pattern)
- **iframe sandbox attribute** — MDN Web Docs specification (HIGH confidence, web standard)
- **Babel standalone performance** — widely documented community experience (MEDIUM confidence)
- **AST-based inspection** — standard pattern used by Storybook, React Docgen (HIGH confidence for approach)

**Note:** Web verification was unavailable during this research session. Pitfalls 1, 4, 5 have HIGH confidence from multiple consistent community sources in training data. Pitfalls 6, 7, 8 are MEDIUM — well-reasoned but fewer direct sources. All should be reviewed against current library documentation during implementation phases.
