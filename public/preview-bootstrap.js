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
import { useColorScheme } from '@mui/material/styles';
import { ErrorBoundary } from 'react-error-boundary';

// ─── Emotion cache targeting THIS iframe's document.head ──────────────────────
// CRITICAL: Without this, MUI injects styles into the PARENT page's <head>,
// not the iframe's. Styles would render in the parent, not the preview.
const emotionCache = createCache({ key: 'mui', container: document.head });

// ─── MUI theme with CSS variables + light/dark color schemes ─────────────────
// cssVariables: true — mode switching changes CSS variable values, not component tree
// colorSchemes: { light, dark } — enables useColorScheme() with 'light'|'dark'|'system'
// ─── Component overrides — fetched from /api/preview/component-overrides ──────
// Single source of truth: src/lib/prototype-overrides.ts
// Fetched at startup so all prototypes always get the latest design system overrides.
let componentOverrides = {};

async function loadComponentOverrides() {
  try {
    const res = await fetch('/api/preview/component-overrides');
    if (res.ok) componentOverrides = await res.json();
  } catch {
    // Non-critical: fall back to no overrides (MUI defaults)
  }
}

function buildComponentsConfig() {
  return { components: componentOverrides };
}

function buildDefaultTheme() {
  return createTheme({
    cssVariables: true,
    colorSchemeSelector: 'data',
    colorSchemes: { light: true, dark: true },
    ...buildComponentsConfig(),
  });
}

let defaultTheme = buildDefaultTheme();

/** Build a MUI theme from ThemeConfig (sent via SET_THEME_CONFIG postMessage). */
function buildTheme(config) {
  if (!config) return defaultTheme;
  return createTheme({
    cssVariables: true,
    colorSchemeSelector: 'data',
    colorSchemes: {
      light: { palette: config.palette.light },
      dark: { palette: config.palette.dark },
    },
    typography: config.typography,
    shape: config.shape,
    spacing: config.spacing,
    ...buildComponentsConfig(),
  });
}

// ─── Text override context — Phase 3 copy editing ────────────────────────────
// Carries the current text override map from Root down to TextOverrideApplier
// without prop-drilling through the prototype component tree.
const TextOverrideContext = createContext({});

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

// ─── ThemeListener — registers postMessage handler for SET_THEME ──────────────
// This is a React component so it can use useColorScheme() (a hook).
// The bootstrap script needs to update the theme mode from outside React, so we
// store a ref to setMode that can be called from the postMessage listener.
function ThemeListener() {
  const { setMode } = useColorScheme();

  useEffect(() => {
    function handleMessage(event) {
      if (event.data?.type === 'SET_THEME') {
        const mode = event.data.mode;
        if (mode === 'light' || mode === 'dark' || mode === 'system') {
          setMode(mode);
        }
      }
    }

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [setMode]);

  return null; // renders nothing — only registers the listener
}

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
function PreviewApp({ Component, errorBoundaryKey, onRetry, textOverrides, theme }) {
  return createElement(
    CacheProvider,
    { value: emotionCache },
    createElement(
      ThemeProvider,
      { theme: theme || defaultTheme },
      createElement(CssBaseline),
      createElement(ThemeListener),
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
  // Phase 4: theme config
  const [themeConfig, setThemeConfig] = useState(null);
  const theme = useMemo(() => buildTheme(themeConfig), [themeConfig]);

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
      // Phase 3: apply text overrides from Copy tab
      if (event.data?.type === 'SET_TEXT_OVERRIDES') {
        setTextOverrides(event.data.overrides ?? {});
      }
      // Phase 4: apply theme config
      if (event.data?.type === 'SET_THEME_CONFIG') {
        setThemeConfig(event.data.config ?? null);
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
    theme,
  });
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

// Listen for HIGHLIGHT_TEXT from parent shell (triggered by Components panel selection)
window.addEventListener('message', function(event) {
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

// ─── Mount the root (after loading component overrides) ───────────────────────
const rootElement = document.getElementById('root');
if (rootElement) {
  rootInstance = createRoot(rootElement);
  // Load overrides first, then rebuild defaultTheme with them before first render
  loadComponentOverrides().then(() => {
    defaultTheme = buildDefaultTheme();
    rootInstance.render(createElement(Root));
  });
}
