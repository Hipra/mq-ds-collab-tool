'use client';

import { Box, Dialog, DialogActions, DialogContent, Button } from '@mui/material';

interface ScreenshotModalProps {
  open: boolean;
  onClose: () => void;
  src: string;
  screenName: string;
}

export default function ScreenshotModal({ open, onClose, src, screenName }: ScreenshotModalProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogContent sx={{ p: 1, display: 'flex', justifyContent: 'center' }}>
        <Box
          component="img"
          src={src}
          alt={`Screenshot of ${screenName}`}
          sx={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain', borderRadius: 1 }}
        />
      </DialogContent>
      <DialogActions>
        <Button variant="text" color="secondary" onClick={onClose}>
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
}
