'use client';

import React, { useState } from 'react';
import { ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import createCache from '@emotion/cache';
import { CacheProvider } from '@emotion/react';
import { useServerInsertedHTML } from 'next/navigation';
import { createAppTheme } from '@/lib/theme';

const shellTheme = createAppTheme();

/**
 * Emotion SSR registry for Next.js App Router.
 *
 * Next.js App Router SSRs Client Components. Without this registry, Emotion
 * injects <style> tags inline in the React tree during SSR, causing a
 * hydration mismatch because the client renders differently.
 *
 * This intercepts Emotion insertions and uses useServerInsertedHTML to flush
 * them into <head> during SSR, matching client behavior.
 */
function EmotionRegistry({ children }: { children: React.ReactNode }) {
  const [{ cache, flush }] = useState(() => {
    const c = createCache({ key: 'css' });
    c.compat = true;
    const prevInsert = c.insert.bind(c);
    let inserted: string[] = [];
    c.insert = (...args: Parameters<typeof prevInsert>) => {
      const result = prevInsert(...args);
      const name = args[1]?.name;
      if (name && c.inserted[name] !== undefined && !inserted.includes(name)) {
        inserted.push(name);
      }
      return result;
    };
    const flushFn = () => { const prev = inserted; inserted = []; return prev; };
    return { cache: c, flush: flushFn };
  });

  useServerInsertedHTML(() => {
    const names = flush();
    if (names.length === 0) return null;
    const styles = names.map((name) => cache.inserted[name]).join('');
    return (
      <style
        key={cache.key}
        data-emotion={`${cache.key} ${names.join(' ')}`}
        dangerouslySetInnerHTML={{ __html: styles }}
      />
    );
  });

  return <CacheProvider value={cache}>{children}</CacheProvider>;
}

export default function ShellLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <EmotionRegistry>
      <ThemeProvider theme={shellTheme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </EmotionRegistry>
  );
}
