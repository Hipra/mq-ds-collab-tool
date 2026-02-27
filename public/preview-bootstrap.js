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
import { createElement, useState, useEffect, useCallback } from 'react';
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
const theme = createTheme({
  cssVariables: true,
  colorSchemeSelector: 'data',
  colorSchemes: {
    light: true,
    dark: true,
  },
});

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

// ─── App shell — wraps prototype in ThemeProvider + CacheProvider + ErrorBoundary ─
function PreviewApp({ Component, errorBoundaryKey, onRetry }) {
  return createElement(
    CacheProvider,
    { value: emotionCache },
    createElement(
      ThemeProvider,
      { theme },
      createElement(CssBaseline),
      createElement(ThemeListener),
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

  // Listen for RELOAD postMessage
  useEffect(() => {
    function handleMessage(event) {
      if (event.data?.type === 'RELOAD') {
        setState((prev) => {
          const nextVersion = prev.bundleVersion + 1;
          load(nextVersion);
          return { ...prev, bundleVersion: nextVersion };
        });
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
  });
}

// ─── Inspector mode — hover/click to identify components ─────────────────────
let inspectorEnabled = true; // start enabled per default store state
let highlightOverlay = null;

function ensureOverlay() {
  if (highlightOverlay) return highlightOverlay;
  highlightOverlay = document.createElement('div');
  highlightOverlay.style.cssText = 'position:fixed;pointer-events:none;border:2px solid #1976d2;background:rgba(25,118,210,0.08);z-index:99999;display:none;transition:all 0.05s ease-out;';
  document.body.appendChild(highlightOverlay);
  return highlightOverlay;
}

function findInspectorTarget(el) {
  while (el && el !== document.body) {
    if (el.dataset && el.dataset.inspectorId) return el;
    el = el.parentElement;
  }
  return null;
}

document.addEventListener('mouseover', function(e) {
  if (!inspectorEnabled) return;
  const target = findInspectorTarget(e.target);
  if (!target) {
    const overlay = ensureOverlay();
    overlay.style.display = 'none';
    window.parent.postMessage({ type: 'COMPONENT_HOVER', id: null, rect: null }, '*');
    return;
  }
  const rect = target.getBoundingClientRect();
  const overlay = ensureOverlay();
  overlay.style.top = rect.top + 'px';
  overlay.style.left = rect.left + 'px';
  overlay.style.width = rect.width + 'px';
  overlay.style.height = rect.height + 'px';
  overlay.style.display = 'block';
  window.parent.postMessage({
    type: 'COMPONENT_HOVER',
    id: target.dataset.inspectorId,
    rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
  }, '*');
}, true);

document.addEventListener('mouseout', function(e) {
  if (!inspectorEnabled) return;
  if (e.relatedTarget && document.contains(e.relatedTarget)) return;
  const overlay = ensureOverlay();
  overlay.style.display = 'none';
  window.parent.postMessage({ type: 'COMPONENT_HOVER', id: null, rect: null }, '*');
}, true);

document.addEventListener('click', function(e) {
  if (!inspectorEnabled) return;
  const target = findInspectorTarget(e.target);
  if (!target) return;
  e.preventDefault();
  e.stopPropagation();
  const rect = target.getBoundingClientRect();
  window.parent.postMessage({
    type: 'COMPONENT_SELECT',
    id: target.dataset.inspectorId,
    rect: { top: rect.top, left: rect.left, width: rect.width, height: rect.height }
  }, '*');
}, true);

// Listen for SET_INSPECTOR_MODE from parent shell
window.addEventListener('message', function(event) {
  if (event.data?.type === 'SET_INSPECTOR_MODE') {
    inspectorEnabled = !!event.data.enabled;
    if (!inspectorEnabled && highlightOverlay) {
      highlightOverlay.style.display = 'none';
    }
  }
});

// ─── Mount the root ───────────────────────────────────────────────────────────
const rootElement = document.getElementById('root');
if (rootElement) {
  rootInstance = createRoot(rootElement);
  rootInstance.render(createElement(Root));
}
