/* eslint-disable */
// @ts-nocheck
// Safe DS styleOverrides barrel for the app shell (webpack / Next.js build).
// Mirrors the SAFE_STYLEOVERRIDES list in /api/preview/ds-theme/route.ts —
// excludes date-picker components that depend on @mui/x-date-pickers.
// Webpack's NormalModuleReplacementPlugin (next.config.ts) rewrites the
// @/ aliases inside these DS files at build time.

export { MuiAccordion }        from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiAccordion';
export { MuiAccordionDetails } from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiAccordionDetails';
export { MuiAccordionSummary } from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiAccordionSummary';
export { MuiAlert }            from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiAlert';
export { MuiAppBar }           from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiAppBar';
export { MuiAutocomplete }     from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiAutocomplete';
export { MuiBackdrop }         from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiBackdrop';
export { MuiBadge }            from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiBadge';
export { MuiButton }           from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiButton';
export { MuiChip }             from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiChip';
export { MuiDialogActions }    from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiDialogActions';
export { MuiDialogContent }    from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiDialogContent';
export { MuiDialogContentText} from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiDialogContentText';
export { MuiDialogTitle }      from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiDialogTitle';
export { MuiDrawer }           from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiDrawer';
export { MuiFormControlLabel } from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiFormControlLabel';
export { MuiFormHelperText }   from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiFormHelperText';
export { MuiFormLabel }        from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiFormLabel';
export { MuiInputLabel }       from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiInputLabel';
export { MuiLink }             from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiLink';
export { MuiListItemAvatar }   from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiListItemAvatar';
export { MuiListItemButton }   from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiListItemButton';
export { MuiListItemIcon }     from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiListItemIcon';
export { MuiListItemText }     from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiListItemText';
export { MuiListSubheader }    from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiListSubheader';
export { MuiMenu }             from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiMenu';
export { MuiMenuItem }         from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiMenuItem';
export { MuiOutlinedInput }    from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiOutlinedInput';
export { MuiPagination }       from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiPagination';
export { MuiPaper }            from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiPaper';
export { MuiRadio }            from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiRadio';
export { MuiSelect }           from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiSelect';
export { MuiSwitch }           from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiSwitch';
export { MuiTab }              from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiTab';
export { MuiToggleButton }     from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiToggleButton';
export { MuiToggleButtonGroup }from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiToggleButtonGroup';
export { MuiToolbar }          from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiToolbar';
export { MuiTooltip }          from '../../../memoq.web.design/src/theme/components/styleoverrides/MuiTooltip';
