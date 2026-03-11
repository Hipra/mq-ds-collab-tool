'use client';

import { useState, useEffect, useRef } from 'react';

interface Screen {
  id: string;
}

interface Props {
  prototypeId: string;
  /** Called on each captured screen: done = number finished, total = all screens */
  onProgress: (done: number, total: number) => void;
}

/**
 * Captures screenshots of all screens by rendering each one in a hidden off-screen
 * iframe, waiting for PREVIEW_READY, sending TAKE_SCREENSHOT, and saving the result.
 *
 * Screens are captured sequentially — one iframe at a time. A fresh iframe is used
 * per screen (key={captureIndex}) to avoid stale contentWindow references.
 */
export function ScreenshotCapturer({ prototypeId, onProgress }: Props) {
  const [screens, setScreens] = useState<Screen[] | null>(null);
  const [captureIndex, setCaptureIndex] = useState(0);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fetch screens on mount
  useEffect(() => {
    fetch(`/api/preview/${prototypeId}/screens`)
      .then((r) => r.json())
      .then((data: Screen[]) => {
        setScreens(data);
        onProgress(0, data.length);
      })
      .catch(() => setScreens([]));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [prototypeId]);

  // Listen for postMessages from the current hidden iframe
  useEffect(() => {
    function handleMessage(event: MessageEvent) {
      const win = iframeRef.current?.contentWindow;
      if (!win || event.source !== win) return;

      if (event.data?.type === 'PREVIEW_READY') {
        if (timerRef.current) clearTimeout(timerRef.current);
        // Wait for fonts/styles to settle before capturing
        timerRef.current = setTimeout(() => {
          win.postMessage({ type: 'TAKE_SCREENSHOT' }, '*');
        }, 800);
      }

      if (event.data?.type === 'SCREENSHOT_DATA') {
        const screen = screens?.[captureIndex];
        if (screen) {
          const { dataUrl } = event.data as { dataUrl: string };
          fetch(`/api/preview/${prototypeId}/thumbnail`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ screenId: screen.id, dataUrl }),
          }).catch(() => {});
        }
        const nextIndex = captureIndex + 1;
        if (screens) onProgress(nextIndex, screens.length);
        setCaptureIndex(nextIndex);
      }
    }

    window.addEventListener('message', handleMessage);
    return () => {
      window.removeEventListener('message', handleMessage);
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [screens, captureIndex, prototypeId, onProgress]);

  // Nothing to capture yet, or all done
  if (!screens || captureIndex >= screens.length) return null;

  const screen = screens[captureIndex];
  const screenParam = screen.id !== 'index' ? `?screen=${screen.id}` : '';

  return (
    <iframe
      key={captureIndex}
      ref={iframeRef}
      src={`/preview/${prototypeId}${screenParam}`}
      style={{
        position: 'fixed',
        left: -9999,
        top: 0,
        width: 1280,
        height: 800,
        border: 'none',
        pointerEvents: 'none',
        visibility: 'hidden',
      }}
      sandbox="allow-scripts allow-same-origin"
      title="screenshot-capture"
    />
  );
}
