/* eslint-disable */
// @ts-nocheck
// Minimal @/components barrel for DS internals.
// DS components import { Icon, Button, Select, ... } from "@/components"; this file serves that.
//
// Icon stub: passes through React elements as-is, renders nothing for string icon-name types.
// Button stub: provides Button.IconButton so DialogTitle close button renders correctly.
import React from 'react';
import MuiIconButton from '@mui/material/IconButton';

export const Icon = ({
  type,
}: {
  type?: unknown;
  color?: string;
  size?: string | 'large' | 'medium' | 'small';
  sx?: unknown;
}) => {
  if (React.isValidElement(type as React.ReactNode)) return type as React.ReactElement;
  return null;
};

// Minimal IconButton stub — renders MUI IconButton without the icon (string icons are
// not resolved here; MqIcon is used in the shell instead for icon rendering).
const _IconButton = React.forwardRef(function IconButton({ icon, iconSize, iconSx, iconClassName, ariaLabel, ...props }, ref) {
  return React.createElement(MuiIconButton, { 'aria-label': ariaLabel, ref, ...props });
});

export const Button = Object.assign(() => null, { IconButton: _IconButton });
