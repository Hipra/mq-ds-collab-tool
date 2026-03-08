/* eslint-disable */
// @ts-nocheck
// Safe DS component barrel for the app shell.
// Individual component imports avoid the full DS barrel (which pulls in @mui/x-* deps).
// Webpack resolves @/ internals via NormalModuleReplacementPlugin in next.config.ts.

// Components that call React hooks (useMemo, useState, useEffect, etc.) are replaced
// with shell-native wrappers (shell-wrappers.tsx) so that DS's React 18 instance
// never calls hooks under the shell's React 19 renderer.
export { AppBar, Chip, ToggleButton, ToggleButtonGroup } from './shell-wrappers';

// Components with no React hook calls — safe to import from DS source directly.
// @ts-ignore
export { default as Button } from '../../../memoq.web.design/src/components/Button/Button';
// @ts-ignore
export { default as Typography } from '../../../memoq.web.design/src/components/Typography/Typography';
// @ts-ignore
export { default as Divider } from '../../../memoq.web.design/src/components/Divider/Divider';
// DS TextField NOT imported — its PasswordTextField has a broken forwardRef signature
// (missing ref param) that React 19 warns about at module-eval time, unfixable without
// patching DS source. MUI TextField is a drop-in for the shell's usage (no DS-specific
// endIconButton / numeric-only features needed here).
// @ts-ignore
export { default as TextField } from '@mui/material/TextField';
// @ts-ignore
export { Dialog } from '../../../memoq.web.design/src/components/Dialog/Dialog';
// @ts-ignore
export { DialogActions } from '../../../memoq.web.design/src/components/Dialog/DialogActions';
// @ts-ignore
export { DialogContent } from '../../../memoq.web.design/src/components/Dialog/DialogContent';
// @ts-ignore
export { default as DialogTitle } from '../../../memoq.web.design/src/components/Dialog/DialogTitle';
