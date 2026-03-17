/**
 * preview-jsx-runtime.js — Pseudo-translation proxy for react/jsx-runtime.
 *
 * Intercepts jsx/jsxs calls from prototype bundles (compiled with jsx:'automatic').
 * When window.__pseudoMode is set, transforms string props and children before
 * passing to the real React runtime. This is the only reliable way to transform
 * ALL text in a prototype — React.createElement patching doesn't work with the
 * automatic JSX transform.
 *
 * Activated by SET_PSEUDO_MODE postMessage → bootstrap sets window.__pseudoMode
 * and triggers a React re-render, causing all jsx/jsxs calls to re-run.
 */

export { Fragment } from 'https://esm.sh/react@19/jsx-runtime';
import { jsx as _jsx, jsxs as _jsxs } from 'https://esm.sh/react@19/jsx-runtime';

// ── Transformation logic (mirrors src/lib/pseudo-translation.ts) ──────────────
const _ACCENT_MAP = {
  a:'à',A:'À',b:'b',B:'B',c:'ç',C:'Ç',d:'ď',D:'Ď',e:'è',E:'È',f:'f',F:'F',
  g:'ĝ',G:'Ĝ',h:'ĥ',H:'Ĥ',i:'ì',I:'Ì',j:'ĵ',J:'Ĵ',k:'k',K:'K',l:'ĺ',L:'Ĺ',
  m:'m',M:'M',n:'ñ',N:'Ñ',o:'ò',O:'Ò',p:'p',P:'P',q:'q',Q:'Q',r:'ŕ',R:'Ŕ',
  s:'š',S:'Š',t:'ţ',T:'Ţ',u:'ù',U:'Ù',v:'v',V:'V',w:'ŵ',W:'Ŵ',x:'x',X:'X',
  y:'ŷ',Y:'Ŷ',z:'ž',Z:'Ž',
};
const _FILLER = 'Lorem ipsum dolor sit amet consetetur';

function _alreadyTransformed(text, mode) {
  if (mode === 'accented') return text.startsWith('[') && text.endsWith(']');
  if (mode === 'expanded') return text.includes(_FILLER.slice(0, 5));
  if (mode === 'double') {
    const n = Math.floor(text.length / 2);
    return text.length === 2 * n + 1 && text[n] === ' ' && text.slice(0, n) === text.slice(n + 1);
  }
  return false;
}

function _transform(text, mode) {
  if (!text || !text.trim()) return text;
  if (_alreadyTransformed(text, mode)) return text;
  if (mode === 'accented') return '[' + text.split('').map(c => _ACCENT_MAP[c] ?? c).join('') + ']';
  if (mode === 'expanded') {
    if (text.length > 100) return text + ' [...]';
    return text + ' ' + _FILLER.slice(0, Math.ceil(text.length * 0.4));
  }
  if (mode === 'double') return text + ' ' + text;
  return text;
}

// Props that carry user-visible text (skip technical/internal props)
const _TEXT_PROPS = new Set([
  'children', 'label', 'placeholder', 'helperText', 'title',
  'tooltip', 'caption', 'description', 'aria-label',
]);

function _transformProps(props, mode) {
  if (!props) return props;
  let next = null;
  for (const key of Object.keys(props)) {
    if (_TEXT_PROPS.has(key) && typeof props[key] === 'string' && props[key].trim()) {
      if (!next) next = Object.assign({}, props);
      next[key] = _transform(props[key], mode);
    }
  }
  return next ?? props;
}

// ── Proxied exports ────────────────────────────────────────────────────────────
export function jsx(type, props, key) {
  const mode = window.__pseudoMode;
  return _jsx(type, mode ? _transformProps(props, mode) : props, key);
}

export function jsxs(type, props, key) {
  const mode = window.__pseudoMode;
  return _jsxs(type, mode ? _transformProps(props, mode) : props, key);
}
