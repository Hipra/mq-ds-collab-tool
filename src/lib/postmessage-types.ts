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
 *
 * Phase 3 additions:
 *   Shell -> Iframe: SET_TEXT_OVERRIDES, HIGHLIGHT_TEXT
 *   Iframe -> Shell: TEXT_CLICK
 */

// Shell -> iframe
export type ShellToIframe =
  | { type: 'SET_THEME'; mode: 'light' | 'dark' | 'system' }
  | { type: 'RELOAD' }
  | { type: 'SET_INSPECTOR_MODE'; enabled: boolean }
  // Phase 3: copy editing
  | { type: 'SET_TEXT_OVERRIDES'; overrides: Record<string, Record<string, string>> }
  // overrides format: { [inspectorId]: { [propName]: editedValue } }
  // e.g., { "Typography_5_4": { "children": "New text" } }
  | { type: 'HIGHLIGHT_TEXT'; inspectorId: string | null };
  // Highlights an element in the preview when an entry is selected in Copy tab

// Iframe -> shell
export type IframeToShell =
  | { type: 'RENDER_ERROR'; message: string }
  | { type: 'COMPONENT_TREE'; tree: ComponentNode[] }
  | { type: 'COMPONENT_HOVER'; id: string | null; rect: { top: number; left: number; width: number; height: number } | null }
  | { type: 'COMPONENT_SELECT'; id: string; rect: { top: number; left: number; width: number; height: number } }
  // Phase 3: copy editing
  | { type: 'TEXT_CLICK'; key: string; inspectorId: string };
  // Sent when user clicks text in the preview while Copy tab is active
