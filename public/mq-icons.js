/**
 * @mq/icons — MqIcon component for prototypes.
 *
 * Standalone ESM module running inside the preview iframe.
 * Fetches SVG icons from /icon-set/<name>.svg, caches them in memory,
 * and renders them inline with MUI-compatible size/color/sx support.
 *
 * Usage in prototypes:
 *   import { MqIcon } from '@mq/icons';
 *   <MqIcon name="check" size={32} color="#ff5722" />
 */

import { createElement, useState, useEffect } from 'react';
import { Box } from '@mui/material';

const svgCache = new Map();

async function fetchSvg(name) {
  if (svgCache.has(name)) return svgCache.get(name);

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

const PALETTE_COLORS = ['primary', 'secondary', 'error', 'warning', 'info', 'success'];

function resolveColor(color) {
  if (PALETTE_COLORS.includes(color)) return `${color}.main`;
  return color;
}

export function MqIcon({ name, size = 24, color = 'currentColor', sx, ...rest }) {
  const [svg, setSvg] = useState(svgCache.get(name) ?? null);

  useEffect(() => {
    let cancelled = false;
    fetchSvg(name).then((result) => {
      if (!cancelled) setSvg(result);
    });
    return () => { cancelled = true; };
  }, [name]);

  if (!svg) return null;

  // If the cached value is an error string (no < at start), show nothing
  if (!svg.startsWith('<')) return null;

  // Strip width/height from the SVG root so we can control size via the wrapper,
  // and replace any hardcoded fill colors with currentColor so `color` prop works.
  const processed = svg
    .replace(/\s(width|height)="[^"]*"/g, '')
    .replace(/fill="(?!none)[^"]*"/g, `fill="currentColor"`);

  return createElement(Box, {
    component: 'span',
    'aria-hidden': true,
    ...rest,
    sx: {
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      width: size,
      height: size,
      color: resolveColor(color),
      flexShrink: 0,
      '& svg': {
        width: '100%',
        height: '100%',
      },
      ...sx,
    },
    dangerouslySetInnerHTML: { __html: processed },
  });
}
