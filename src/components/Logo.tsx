import Box from '@mui/material/Box';
import type { SxProps, Theme } from '@mui/material/styles';

export function Logo({ height = 32, sx }: { height?: number; sx?: SxProps<Theme> }) {
  return (
    <Box
      component="img"
      src="/logo-handoff.svg"
      alt="Handoff"
      sx={{
        height,
        display: 'block',
        filter: 'invert(1)',
        ...sx as object,
      }}
    />
  );
}
