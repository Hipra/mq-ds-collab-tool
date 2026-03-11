/**
 * preview-bootstrap.js — runs INSIDE the iframe document.
 *
 * This script bootstraps the React root with:
 * - Emotion CacheProvider (styles injected into THIS document's <head>, not parent's)
 * - MUI ThemeProvider with colorSchemes (light/dark/system support)
 * - ErrorBoundary with readable message + Retry button
 * - Dynamic import of the prototype bundle from the API route
 *
 * postMessage protocol:
 * - Listens for SET_THEME { type: 'SET_THEME', mode: 'light'|'dark'|'system' }
 * - Listens for RELOAD { type: 'RELOAD' } — re-imports bundle with cache buster
 * - Sends RENDER_ERROR { type: 'RENDER_ERROR', message } to parent on error
 *
 * Uses createElement (not JSX) — this file runs as-is in the browser without transpilation.
 */

import { createRoot } from 'react-dom/client';
import { createElement, useState, useEffect, useCallback, useContext, createContext, useMemo } from 'react';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import { ErrorBoundary } from 'react-error-boundary';

// ─── Emotion cache targeting THIS iframe's document.head ──────────────────────
// CRITICAL: Without this, MUI injects styles into the PARENT page's <head>,
// not the iframe's. Styles would render in the parent, not the preview.
const emotionCache = createCache({ key: 'mui', container: document.head });

// ─── memoQ Design System theme — imported from /api/preview/ds-theme ─────────
// The DS theme provides palette, typography, shadows, and component styleOverrides.
// Component defaultProps are no longer injected here — prototypes receive actual DS
// wrapper components via the @mui/material importmap alias (/api/preview/ds-components),
// so the wrappers themselves apply the correct props (e.g. color="secondary").
//
// IMPORTANT: We do NOT use cssVariables: true here. In CSS-variables mode, palette values
// in styleOverrides callbacks become 'var(--mui-palette-xxx)' strings instead of actual
// colors, which breaks DS overrides that call alpha(theme.palette.secondary.main, 0.08).
// Dark/light mode is handled via React state + re-render instead.
let dsThemeOptions = null;

async function loadDSTheme() {
  try {
    const mod = await import('/api/preview/ds-theme');
    dsThemeOptions = mod.dsThemeOptions ?? null;
  } catch (err) {
    // Non-critical: fall back to MUI defaults if DS theme fails to load
    console.warn('[DS] theme load failed:', err);
  }
}

/** Build a plain MUI theme for the given mode using DS options. */
function buildThemeForMode(mode, customPalette) {
  const resolvedMode = mode === 'system'
    ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light')
    : (mode || 'light');

  const dsPalette = dsThemeOptions?.palettes[resolvedMode] ?? {};
  const palette = customPalette ? { ...dsPalette, ...customPalette } : dsPalette;

  return createTheme({
    palette: { ...palette, mode: resolvedMode },
    components: dsThemeOptions?.components ?? {},
    ...(dsThemeOptions?.typography && { typography: dsThemeOptions.typography }),
    ...(dsThemeOptions?.shadows && { shadows: dsThemeOptions.shadows }),
  });
}

let defaultTheme = buildThemeForMode('light', null);

// ─── Text override context — Phase 3 copy editing ────────────────────────────
// Carries the current text override map from Root down to TextOverrideApplier
// without prop-drilling through the prototype component tree.
const TextOverrideContext = createContext({});

// Carries text-content-based overrides for data array entries (e.g. TOOLBAR_GROUPS labels).
// Format: { [originalText]: newText } — targeted by text content, not data-inspector-id.
const TextContentOverrideContext = createContext({});

// ─── Bundle URL from <meta> tag ──────────────────────────────────────────────
// document.currentScript is always null inside type="module" scripts (browser spec),
// so we read the bundle URL from a <meta> tag instead.
const bundleUrl = document.querySelector('meta[name="bundle-url"]')?.getAttribute('content') ?? '';

// ─── Singleton render key for RELOAD support ─────────────────────────────────
let renderKey = 0;
let rootInstance = null;

// ─── Error display for pre-mount (import) errors ─────────────────────────────
function PreMountError({ message, onRetry }) {
  return createElement(
    'div',
    {
      style: {
        padding: '24px',
        fontFamily: 'monospace',
        color: '#d32f2f',
        background: '#fef8f8',
        border: '1px solid #f5c6c6',
        borderRadius: '4px',
        margin: '16px',
      },
    },
    createElement('div', { style: { fontWeight: 'bold', marginBottom: '8px' } }, 'Bundle Error'),
    createElement('pre', { style: { whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '13px' } }, message),
    createElement(
      'button',
      {
        onClick: onRetry,
        style: {
          marginTop: '16px',
          padding: '8px 16px',
          background: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
        },
      },
      'Retry'
    )
  );
}

// ─── Error fallback for React ErrorBoundary ───────────────────────────────────
function ErrorFallback({ error, resetErrorBoundary }) {
  useEffect(() => {
    // Notify parent shell of the render error
    window.parent.postMessage({ type: 'RENDER_ERROR', message: error.message }, '*');
  }, [error]);

  return createElement(
    'div',
    {
      style: {
        padding: '24px',
        fontFamily: 'monospace',
        color: '#d32f2f',
        background: '#fef8f8',
        border: '1px solid #f5c6c6',
        borderRadius: '4px',
        margin: '16px',
      },
    },
    createElement('div', { style: { fontWeight: 'bold', fontSize: '16px', marginBottom: '8px' } }, 'Render Error'),
    createElement(
      'pre',
      { style: { whiteSpace: 'pre-wrap', wordBreak: 'break-word', fontSize: '13px', marginBottom: '16px' } },
      error.message
    ),
    createElement(
      'button',
      {
        onClick: resetErrorBoundary,
        style: {
          padding: '8px 16px',
          background: '#1976d2',
          color: 'white',
          border: 'none',
          borderRadius: '4px',
          cursor: 'pointer',
          fontSize: '14px',
        },
      },
      'Retry'
    )
  );
}

// ThemeListener removed — mode is now managed as React state in Root (no cssVariables needed).

// ─── TextOverrideApplier — applies text overrides to DOM after each render ────
// Uses a MutationObserver to re-apply overrides whenever React re-renders, since
// direct DOM mutations are overwritten by React on each update.
// Tracks original values so removed overrides can be reverted without a full reload.
const _originals = {}; // { "inspectorId::propName": originalValue }

function TextOverrideApplier() {
  const overrides = useContext(TextOverrideContext);

  useEffect(() => {
    // Collect which keys are currently overridden
    const activeKeys = new Set();
    for (const [inspectorId, propOverrides] of Object.entries(overrides)) {
      for (const propName of Object.keys(propOverrides)) {
        activeKeys.add(`${inspectorId}::${propName}`);
      }
    }

    // Revert any previously overridden values that are no longer in overrides
    for (const compositeKey of Object.keys(_originals)) {
      if (!activeKeys.has(compositeKey)) {
        const [inspectorId, propName] = compositeKey.split('::');
        const el = document.querySelector(`[data-inspector-id="${inspectorId}"]`);
        if (el) {
          _applyValue(el, propName, _originals[compositeKey]);
        }
        delete _originals[compositeKey];
      }
    }

    if (!Object.keys(overrides).length) return;

    function applyOverrides() {
      for (const [inspectorId, propOverrides] of Object.entries(overrides)) {
        const el = document.querySelector(`[data-inspector-id="${inspectorId}"]`);
        if (!el) continue;
        for (const [propName, value] of Object.entries(propOverrides)) {
          const compositeKey = `${inspectorId}::${propName}`;
          // Save original value on first override
          if (!(compositeKey in _originals)) {
            _originals[compositeKey] = _readValue(el, propName);
          }
          _applyValue(el, propName, value);
        }
      }
    }

    applyOverrides();

    // Re-apply after React re-renders using MutationObserver
    const rootEl = document.getElementById('root');
    if (!rootEl) return;
    const observer = new MutationObserver(() => {
      requestAnimationFrame(applyOverrides);
    });
    observer.observe(rootEl, { childList: true, subtree: true, characterData: false });

    return () => observer.disconnect();
  }, [overrides]);

  return null; // renders nothing — only applies DOM overrides
}

// ─── TextContentOverrideApplier — live DOM patching for data array entries ───
// Data array labels (e.g. TOOLBAR_GROUPS) are rendered via {item.label} expressions,
// not static JSXText, so they have no unique data-inspector-id to target.
// Instead we match by text content: walk all text nodes, replace those that match
// an original value. _textContentApplied tracks applied values so incremental edits
// ("Undo" → "U" → "Un") work correctly even without a React re-render in between.
const _textContentApplied = new Map(); // Map<originalValue, currentlyAppliedValue>

function TextContentOverrideApplier() {
  const overrides = useContext(TextContentOverrideContext);

  useEffect(() => {
    // Build reverse map: appliedValue → originalValue (needed for incremental edits)
    const reverseMap = new Map();
    for (const [orig, applied] of _textContentApplied.entries()) {
      reverseMap.set(applied, orig);
    }

    function applyOverrides() {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
      let node = walker.nextNode();
      while (node) {
        const raw = node.nodeValue;
        if (raw) {
          const trimmed = raw.trim();
          if (trimmed) {
            // If DOM currently shows a previously-applied value, resolve back to original
            const effectiveOriginal = reverseMap.has(trimmed) ? reverseMap.get(trimmed) : trimmed;
            if (effectiveOriginal in overrides) {
              const newVal = overrides[effectiveOriginal];
              if (newVal !== trimmed) {
                node.nodeValue = raw.replace(trimmed, newVal);
                _textContentApplied.set(effectiveOriginal, newVal);
                reverseMap.delete(trimmed);
                reverseMap.set(newVal, effectiveOriginal);
              }
            }
            // Note: reset operations use RELOAD for a clean revert, not handled here.
          }
        }
        node = walker.nextNode();
      }
    }

    applyOverrides();

    const rootEl = document.getElementById('root');
    if (!rootEl) return;
    const observer = new MutationObserver(() => requestAnimationFrame(applyOverrides));
    observer.observe(rootEl, { childList: true, subtree: true, characterData: false });
    return () => observer.disconnect();
  }, [overrides]);

  return null;
}

/** Read the current DOM value for a given prop type */
function _readValue(el, propName) {
  if (propName === 'children') {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    let textNode = walker.nextNode();
    while (textNode) {
      if (textNode.nodeValue && textNode.nodeValue.trim()) return textNode.nodeValue;
      textNode = walker.nextNode();
    }
    return '';
  } else if (propName === 'placeholder') {
    const input = el.querySelector('input, textarea') || el;
    return input ? (input.getAttribute('placeholder') || '') : '';
  } else if (propName === 'aria-label') {
    return el.getAttribute('aria-label') || '';
  } else if (propName === 'label') {
    const chipLabel = el.querySelector('.MuiChip-label');
    if (chipLabel) return chipLabel.textContent || '';
    const label = el.querySelector('label');
    return label ? (label.textContent || '') : '';
  } else if (propName === 'helperText') {
    const helper = el.querySelector('p');
    return helper ? (helper.textContent || '') : '';
  } else if (propName === 'title') {
    return el.getAttribute('title') || '';
  }
  return '';
}

/** Apply a value to the DOM for a given prop type */
function _applyValue(el, propName, value) {
  if (propName === 'children') {
    const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null);
    let textNode = walker.nextNode();
    while (textNode) {
      if (textNode.nodeValue && textNode.nodeValue.trim()) {
        textNode.nodeValue = value;
        break;
      }
      textNode = walker.nextNode();
    }
  } else if (propName === 'placeholder') {
    const input = el.querySelector('input, textarea') || el;
    if (input) input.setAttribute('placeholder', value);
  } else if (propName === 'aria-label') {
    el.setAttribute('aria-label', value);
  } else if (propName === 'label') {
    const chipLabel = el.querySelector('.MuiChip-label');
    if (chipLabel) {
      chipLabel.textContent = value;
    } else {
      const label = el.querySelector('label');
      if (label) label.textContent = value;
    }
  } else if (propName === 'helperText') {
    const helper = el.querySelector('p');
    if (helper) helper.textContent = value;
  } else if (propName === 'title') {
    el.setAttribute('title', value);
  }
}

// ─── App shell — wraps prototype in ThemeProvider + CacheProvider + ErrorBoundary ─
function PreviewApp({ Component, errorBoundaryKey, onRetry, textOverrides, textContentOverrides, theme }) {
  return createElement(
    CacheProvider,
    { value: emotionCache },
    createElement(
      ThemeProvider,
      { theme: theme || defaultTheme },
      createElement(CssBaseline),
      createElement(
        TextContentOverrideContext.Provider,
        { value: textContentOverrides },
        createElement(TextContentOverrideApplier),
        createElement(
          TextOverrideContext.Provider,
          { value: textOverrides },
          createElement(TextOverrideApplier),
          createElement(
            ErrorBoundary,
            {
              FallbackComponent: ErrorFallback,
              resetKeys: [errorBoundaryKey],
              onReset: onRetry,
            },
            createElement(Component)
          )
        )
      )
    )
  );
}

// ─── Root app with state management ──────────────────────────────────────────
function Root() {
  const [state, setState] = useState({
    Component: null,
    error: null,
    bundleVersion: 0, // incremented on RELOAD
    errorBoundaryKey: 0, // incremented on Retry
  });
  // Phase 3: text overrides — Record<inspectorId, Record<propName, string>>
  const [textOverrides, setTextOverrides] = useState({});
  const [textContentOverrides, setTextContentOverrides] = useState({});
  // Theme: mode state + optional palette override from ThemeTab
  const [themeMode, setThemeMode] = useState('light');
  const [customPalette, setCustomPalette] = useState(null);
  const theme = useMemo(() => buildThemeForMode(themeMode, customPalette), [themeMode, customPalette]);

  const load = useCallback(async (version) => {
    const url = version > 0 ? `${bundleUrl}?t=${Date.now()}` : bundleUrl;
    try {
      const mod = await import(/* webpackIgnore: true */ url);
      const Component = mod.default;

      if (typeof Component !== 'function') {
        throw new Error(
          `Prototype did not export a default React component. Got: ${typeof Component}`
        );
      }

      setState((prev) => ({
        ...prev,
        Component,
        error: null,
      }));
      // Notify parent that the bundle loaded successfully (used after RELOAD
      // where the iframe onLoad event does not fire because the URL stays the same)
      window.parent.postMessage({ type: 'PREVIEW_READY' }, '*');
    } catch (err) {
      const message = err instanceof Error ? err.message : String(err);
      window.parent.postMessage({ type: 'RENDER_ERROR', message }, '*');
      setState((prev) => ({
        ...prev,
        Component: null,
        error: message,
      }));
    }
  }, []);

  // Load on mount
  useEffect(() => {
    load(0);
  }, [load]);

  // Listen for RELOAD and SET_TEXT_OVERRIDES postMessages
  useEffect(() => {
    function handleMessage(event) {
      if (event.data?.type === 'RELOAD') {
        setState((prev) => {
          const nextVersion = prev.bundleVersion + 1;
          load(nextVersion);
          return { ...prev, bundleVersion: nextVersion };
        });
      }
      // Phase 3: apply text overrides from Copy tab (inspector-id based, JSX entries)
      if (event.data?.type === 'SET_TEXT_OVERRIDES') {
        setTextOverrides(event.data.overrides ?? {});
      }
      // Data array entries (e.g. TOOLBAR_GROUPS labels) — text content based
      if (event.data?.type === 'SET_TEXT_CONTENT_OVERRIDES') {
        setTextContentOverrides(event.data.overrides ?? {});
      }
      // SET_THEME: mode switching (light/dark/system) — re-render with new mode
      if (event.data?.type === 'SET_THEME') {
        const mode = event.data.mode;
        if (mode === 'light' || mode === 'dark' || mode === 'system') {
          setThemeMode(mode);
        }
      }
      // SET_THEME_CONFIG: custom palette from ThemeTab
      if (event.data?.type === 'SET_THEME_CONFIG') {
        const config = event.data.config;
        setCustomPalette(config?.palette?.light ?? null);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [load]);

  const handleRetry = useCallback(() => {
    setState((prev) => ({
      ...prev,
      errorBoundaryKey: prev.errorBoundaryKey + 1,
      error: null,
      bundleVersion: prev.bundleVersion + 1,
    }));
    setState((prev) => {
      load(prev.bundleVersion);
      return prev;
    });
  }, [load]);

  if (state.error) {
    return createElement(PreMountError, {
      message: state.error,
      onRetry: handleRetry,
    });
  }

  if (!state.Component) {
    return createElement(
      'div',
      { style: { padding: '24px', color: '#666', fontFamily: 'sans-serif' } },
      'Loading...'
    );
  }

  return createElement(PreviewApp, {
    Component: state.Component,
    errorBoundaryKey: state.errorBoundaryKey,
    onRetry: handleRetry,
    textOverrides,
    textContentOverrides,
    theme,
  });
}

// ─── Screenshot capture — triggered by TAKE_SCREENSHOT postMessage ───────────
let html2canvasPromise = null;

function loadHtml2Canvas() {
  if (html2canvasPromise) return html2canvasPromise;
  html2canvasPromise = new Promise((resolve, reject) => {
    if (window.html2canvas) { resolve(window.html2canvas); return; }
    const script = document.createElement('script');
    script.src = 'https://cdnjs.cloudflare.com/ajax/libs/html2canvas/1.4.1/html2canvas.min.js';
    script.onload = () => resolve(window.html2canvas);
    script.onerror = () => { html2canvasPromise = null; reject(new Error('html2canvas load failed')); };
    document.head.appendChild(script);
  });
  return html2canvasPromise;
}

async function captureScreenshot() {
  try {
    const h2c = await loadHtml2Canvas();
    const target = document.body;
    if (!target) return;
    const canvas = await h2c(target, {
      useCORS: true,
      scale: 1,
      logging: false,
      backgroundColor: null,
    });
    const dataUrl = canvas.toDataURL('image/png');
    window.parent.postMessage({ type: 'SCREENSHOT_DATA', dataUrl }, '*');
  } catch {
    // Screenshot capture failed — ignore silently
  }
}

// ─── Inspector overlay — used for HIGHLIGHT_TEXT from parent shell ────────────
let highlightOverlay = null;

function ensureOverlay() {
  if (highlightOverlay) return highlightOverlay;
  highlightOverlay = document.createElement('div');
  highlightOverlay.style.cssText = 'position:fixed;pointer-events:none;border:2px solid #1976d2;background:rgba(25,118,210,0.08);z-index:99999;display:none;transition:all 0.05s ease-out;';
  document.body.appendChild(highlightOverlay);
  return highlightOverlay;
}

// Listen for HIGHLIGHT_TEXT and TAKE_SCREENSHOT from parent shell
window.addEventListener('message', function(event) {
  if (event.data?.type === 'TAKE_SCREENSHOT') {
    captureScreenshot();
  }

  // Phase 3: highlight element from Copy tab selection
  if (event.data?.type === 'HIGHLIGHT_TEXT') {
    const id = event.data.inspectorId;
    if (id) {
      const el = document.querySelector(`[data-inspector-id="${id}"]`);
      if (el) {
        const rect = el.getBoundingClientRect();
        const overlay = ensureOverlay();
        overlay.style.top = rect.top + 'px';
        overlay.style.left = rect.left + 'px';
        overlay.style.width = rect.width + 'px';
        overlay.style.height = rect.height + 'px';
        overlay.style.display = 'block';
        overlay.style.borderColor = '#ed6c02'; // amber to distinguish from inspector blue
        overlay.style.background = 'rgba(237,108,2,0.08)';
      }
    } else {
      if (highlightOverlay) {
        highlightOverlay.style.display = 'none';
        highlightOverlay.style.borderColor = '#1976d2'; // restore default
        highlightOverlay.style.background = 'rgba(25,118,210,0.08)';
      }
    }
  }
});

// ─── Mount the root (after loading DS theme) ─────────────────────────────────
const rootElement = document.getElementById('root');
if (rootElement) {
  rootInstance = createRoot(rootElement);
  // Load DS theme + proto overrides, then rebuild defaultTheme before first render
  loadDSTheme().then(() => {
    defaultTheme = buildThemeForMode('light', null);
    rootInstance.render(createElement(Root));
  });
}
