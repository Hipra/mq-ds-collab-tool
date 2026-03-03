'use client';

/**
 * MqIcon — memoQ DS icon component for the app shell.
 *
 * Fetches SVGs from /icon-set/<name>.svg (served from public/icon-set/ → assets/icon-set/),
 * caches them in memory, and renders inline with MUI-compatible size/color/sx support.
 *
 * Identical behaviour to public/mq-icons.js (used in prototype iframes),
 * but typed and importable in Next.js server/client components.
 *
 * Usage:
 *   import MqIcon from '@/components/MqIcon';
 *   <MqIcon name="archive" size={20} color="primary" />
 */

import { useState, useEffect } from 'react';
import { Box, type SxProps, type Theme } from '@mui/material';

const svgCache = new Map<string, string>();

async function fetchSvg(name: string): Promise<string> {
  if (svgCache.has(name)) return svgCache.get(name)!;

  const resp = await fetch(`/icon-set/${encodeURIComponent(name)}.svg`);
  if (!resp.ok) {
    const err = `Icon "${name}" not found`;
    svgCache.set(name, err);
    return err;
  }

  const text = await resp.text();
  svgCache.set(name, text);
  return text;
}

const PALETTE_COLORS = ['primary', 'secondary', 'error', 'warning', 'info', 'success', 'neutral'];

function resolveColor(color: string): string {
  if (PALETTE_COLORS.includes(color)) return `${color}.main`;
  return color;
}

interface MqIconProps {
  name: string;
  size?: number;
  color?: string;
  sx?: SxProps<Theme>;
  [key: string]: unknown;
}

export default function MqIcon({ name, size = 24, color = 'currentColor', sx, ...rest }: MqIconProps) {
  const [svg, setSvg] = useState<string | null>(svgCache.get(name) ?? null);

  useEffect(() => {
    let cancelled = false;
    fetchSvg(name).then((result) => {
      if (!cancelled) setSvg(result);
    });
    return () => { cancelled = true; };
  }, [name]);

  if (!svg || !svg.startsWith('<')) return null;

  const processed = svg
    .replace(/\s(width|height)="[^"]*"/g, '')
    .replace(/fill="(?!none)[^"]*"/g, 'fill="currentColor"');

  return (
    <Box
      component="span"
      aria-hidden
      {...rest}
      sx={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: size,
        height: size,
        color: resolveColor(color),
        flexShrink: 0,
        '& svg': { width: '100%', height: '100%' },
        ...sx,
      }}
      dangerouslySetInnerHTML={{ __html: processed }}
    />
  );
}
