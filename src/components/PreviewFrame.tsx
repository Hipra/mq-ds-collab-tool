'use client';

import React, { useRef, useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { useThemeStore } from '@/stores/theme';

import { ErrorDisplay } from '@/components/ErrorDisplay';

interface PreviewFrameProps {
  prototypeId: string;
}

type PreviewState = 'loading' | 'ready' | 'error';

/**
 * iframe wrapper that embeds the prototype preview with:
 * - postMessage bridge: sends SET_THEME when theme mode changes
 * - SSE hot reload: subscribes to /api/watch, sends RELOAD on file change
 * - Error handling: listens for RENDER_ERROR from iframe, shows ErrorDisplay
 * - Loading state: shows spinner while iframe is loading
 *
 * Design decisions:
 * - sandbox="allow-scripts allow-same-origin": same-origin needed for Blob URL
 *   imports inside the iframe (security tradeoff documented in research — acceptable
 *   for Phase 1 since prototypes are local Claude Code output only)
 * - Theme sync: sends SET_THEME on every mode change AFTER iframe loads (onLoad)
 * - Hot reload: checks if changed file path includes the prototypeId before reloading
 * - Error recovery: RELOAD message also clears the error state
 */
export function PreviewFrame({ prototypeId }: PreviewFrameProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [previewState, setPreviewState] = useState<PreviewState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const isLoadedRef = useRef(false);
  const { mode } = useThemeStore();

  // Send theme to iframe via postMessage
  const sendThemeToIframe = useCallback(
    (themeMode: string) => {
      if (iframeRef.current?.contentWindow && isLoadedRef.current) {
        iframeRef.current.contentWindow.postMessage(
          { type: 'SET_THEME', mode: themeMode },
          '*'
        );
      }
    },
    []
  );

  // Send RELOAD to iframe via postMessage
  const sendReloadToIframe = useCallback(() => {
    if (iframeRef.current?.contentWindow) {
      iframeRef.current.contentWindow.postMessage({ type: 'RELOAD' }, '*');
      // Clear error state on reload attempt
      setErrorMessage('');
      setPreviewState('loading');
      isLoadedRef.current = false;
    }
  }, []);

  // Theme sync: send SET_THEME whenever mode changes (after iframe is loaded)
  useEffect(() => {
    if (mode) {
      sendThemeToIframe(mode);
    }
  }, [mode, sendThemeToIframe]);

  // SSE hot reload: subscribe to /api/watch
  useEffect(() => {
    const eventSource = new EventSource('/api/watch');

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data) as { file: string };
        // Only reload if the changed file belongs to this prototype
        if (data.file.includes(prototypeId)) {
          sendReloadToIframe();
        }
      } catch {
        // Malformed SSE message — ignore
      }
    };

    eventSource.onerror = () => {
      // SSE connection error — will auto-reconnect; no user-visible error needed
    };

    return () => {
      eventSource.close();
    };
  }, [prototypeId, sendReloadToIframe]);

  // Listen for messages from iframe (RENDER_ERROR)
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (!event.data || typeof event.data !== 'object') return;

      if (event.data.type === 'RENDER_ERROR') {
        const message = event.data.message ?? 'Unknown render error';
        setErrorMessage(String(message));
        setPreviewState('error');
      }
    };

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, []);

  // iframe onLoad: mark as loaded, send initial theme
  const handleIframeLoad = useCallback(() => {
    isLoadedRef.current = true;
    setPreviewState('ready');
    if (mode) {
      if (iframeRef.current?.contentWindow) {
        iframeRef.current.contentWindow.postMessage(
          { type: 'SET_THEME', mode },
          '*'
        );
      }
    }
  }, [mode]);

  // Catch iframe loads that happened before React hydration (browser cache race).
  // On refresh, the iframe may load from cache before React attaches the onLoad
  // handler, so the load event is missed and the spinner stays forever.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (iframe && !isLoadedRef.current) {
      // Check if the iframe document is already loaded
      try {
        const doc = iframe.contentDocument || iframe.contentWindow?.document;
        if (doc && doc.readyState === 'complete') {
          handleIframeLoad();
        }
      } catch {
        // Cross-origin access blocked — fall back to onLoad handler
      }
    }
  }, [handleIframeLoad]);

  return (
    <Box
      sx={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Loading spinner — shown while iframe is loading */}
      {previewState === 'loading' && (
        <Box
          sx={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1,
          }}
        >
          <CircularProgress />
        </Box>
      )}

      {/* Error display — shown when iframe sends RENDER_ERROR */}
      {previewState === 'error' && (
        <ErrorDisplay message={errorMessage} onRetry={sendReloadToIframe} />
      )}

      {/* iframe — always in DOM to preserve load state; hidden during loading/error */}
      <Box
        component="iframe"
        ref={iframeRef}
        src={`/preview/${prototypeId}`}
        sandbox="allow-scripts allow-same-origin"
        onLoad={handleIframeLoad}
        sx={{
          width: '100%',
          flex: 1,
          border: 'none',
          display: previewState === 'ready' ? 'block' : 'none',
        }}
        title={`Preview: ${prototypeId}`}
      />
    </Box>
  );
}
