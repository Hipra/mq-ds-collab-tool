import type { ComponentNode } from './ast-inspector';

/**
 * postmessage-types.ts — shared type definitions for the shell <-> iframe postMessage protocol.
 *
 * Phase 1 messages:
 *   Shell -> Iframe: SET_THEME, RELOAD
 *   Iframe -> Shell: RENDER_ERROR
 *
 * Phase 2 additions:
 *   Shell -> Iframe: SET_INSPECTOR_MODE
 *   Iframe -> Shell: COMPONENT_TREE, COMPONENT_HOVER, COMPONENT_SELECT
 */

// Shell -> iframe
export type ShellToIframe =
  | { type: 'SET_THEME'; mode: 'light' | 'dark' | 'system' }
  | { type: 'RELOAD' }
  | { type: 'SET_INSPECTOR_MODE'; enabled: boolean };

// Iframe -> shell
export type IframeToShell =
  | { type: 'RENDER_ERROR'; message: string }
  | { type: 'COMPONENT_TREE'; tree: ComponentNode[] }
  | { type: 'COMPONENT_HOVER'; id: string | null; rect: { top: number; left: number; width: number; height: number } | null }
  | { type: 'COMPONENT_SELECT'; id: string; rect: { top: number; left: number; width: number; height: number } };
