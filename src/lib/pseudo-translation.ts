/**
 * pseudo-translation.ts — Pure transformation functions for pseudo-translation modes.
 *
 * Modes:
 * - accented:  Latin chars → accented equivalents, wrapped in [brackets]. Shows encoding issues + untranslated strings.
 * - expanded:  Original text + ~40% filler. Simulates languages that expand (DE, FI, HU).
 * - double:    Text repeated twice. Reveals fixed-width containers.
 * - rtl:       Upside-down/mirrored characters, reversed. Simulates RTL text direction issues.
 */

export type PseudoMode = 'accented' | 'expanded' | 'double';

const ACCENT_MAP: Record<string, string> = {
  a: 'à', A: 'À', b: 'b', B: 'B', c: 'ç', C: 'Ç', d: 'ď', D: 'Ď',
  e: 'è', E: 'È', f: 'f', F: 'F', g: 'ĝ', G: 'Ĝ', h: 'ĥ', H: 'Ĥ',
  i: 'ì', I: 'Ì', j: 'ĵ', J: 'Ĵ', k: 'k', K: 'K', l: 'ĺ', L: 'Ĺ',
  m: 'm', M: 'M', n: 'ñ', N: 'Ñ', o: 'ò', O: 'Ò', p: 'p', P: 'P',
  q: 'q', Q: 'Q', r: 'ŕ', R: 'Ŕ', s: 'š', S: 'Š', t: 'ţ', T: 'Ţ',
  u: 'ù', U: 'Ù', v: 'v', V: 'V', w: 'ŵ', W: 'Ŵ', x: 'x', X: 'X',
  y: 'ŷ', Y: 'Ŷ', z: 'ž', Z: 'Ž',
};

const RTL_MAP: Record<string, string> = {
  a: 'ɐ', b: 'q', c: 'ɔ', d: 'p', e: 'ǝ', f: 'ɟ', g: 'ƃ', h: 'ɥ',
  i: 'ᴉ', j: 'ɾ', k: 'ʞ', l: 'l', m: 'ɯ', n: 'u', o: 'o', p: 'd',
  q: 'b', r: 'ɹ', s: 's', t: 'ʇ', u: 'n', v: 'ʌ', w: 'ʍ', x: 'x',
  y: 'ʎ', z: 'z', A: 'ɐ', B: 'q', C: 'ɔ', D: 'p', E: 'ǝ', F: 'ɟ',
  G: 'ƃ', H: 'ɥ', I: 'ᴉ', J: 'ɾ', K: 'ʞ', L: 'l', M: 'ɯ', N: 'u',
  O: 'o', P: 'd', Q: 'b', R: 'ɹ', S: 's', T: 'ʇ', U: 'n', V: 'ʌ',
  W: 'ʍ', X: 'x', Y: 'ʎ', Z: 'z',
};

const FILLER = 'Lorem ipsum dolor sit amet consetetur';

function applyAccented(text: string): string {
  const chars = text.split('').map((c) => ACCENT_MAP[c] ?? c).join('');
  return `[${chars}]`;
}

function applyExpanded(text: string): string {
  if (text.length > 100) return `${text} [...]`;
  const pad = Math.max(4, Math.ceil(text.length * 0.4));
  return `${text} ${FILLER.slice(0, pad)}`;
}

function applyDouble(text: string): string {
  return `${text} ${text}`;
}

function applyRtl(text: string): string {
  return text.split('').map((c) => RTL_MAP[c] ?? c).reverse().join('');
}

export function pseudoTransform(text: string, mode: PseudoMode): string {
  if (!text.trim()) return text;
  switch (mode) {
    case 'accented': return applyAccented(text);
    case 'expanded': return applyExpanded(text);
    case 'double':   return applyDouble(text);
  }
}

export const PSEUDO_MODE_LABELS: Record<PseudoMode, string> = {
  accented: 'Acc',
  expanded: 'Exp',
  double:   '×2',
};
