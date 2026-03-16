'use client';

import { useState, useEffect } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  IconButton, TextField, Tooltip, Typography,
} from '@mui/material';
import MqIcon from '@/components/MqIcon';
import type { ProjectLink } from '@/types/project';

interface ReferencesPanelProps {
  links: ProjectLink[];
  onChange: (links: ProjectLink[]) => void;
  startAdding?: boolean;
  onAddingDone?: () => void;
}

export default function ReferencesPanel({ links, onChange, startAdding, onAddingDone }: ReferencesPanelProps) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');

  useEffect(() => {
    if (startAdding) {
      openDialog();
      onAddingDone?.();
    }
  }, [startAdding, onAddingDone]);

  const openDialog = () => {
    setNewLabel('');
    setNewUrl('');
    setDialogOpen(true);
  };

  const handleAdd = () => {
    if (!newUrl.trim()) return;
    const label = newLabel.trim() || new URL(newUrl).hostname.replace('www.', '');
    onChange([...links, { label, url: newUrl.trim() }]);
    setDialogOpen(false);
  };

  const handleRemove = (index: number) => {
    onChange(links.filter((_, i) => i !== index));
  };

  const hasLinks = links.length > 0;

  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', minHeight: 32, mb: 1.5 }}>
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
          References
        </Typography>
        {hasLinks && (
          <Button
            size="small"
            variant="outlined"
            color="secondary"
            startIcon={<MqIcon name="plus" size={14} />}
            onClick={openDialog}
          >
            Add reference
          </Button>
        )}
      </Box>

      {hasLinks ? (
        <Box component="ul" sx={{ m: 0, pl: 2, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
          {links.map((link, i) => (
            <Box
              component="li"
              key={i}
              sx={{
                '& .remove-link': { visibility: 'hidden' },
                '&:hover .remove-link': { visibility: 'visible' },
              }}
            >
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Typography
                  component="a"
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    textDecoration: 'none',
                    '&:hover': { textDecoration: 'underline' },
                    flexGrow: 1,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {link.label}
                </Typography>
                <Tooltip title="Remove link">
                  <IconButton className="remove-link" size="small" onClick={() => handleRemove(i)} aria-label="Remove link" sx={{ flexShrink: 0 }}>
                    <MqIcon name="trash" size={16} />
                  </IconButton>
                </Tooltip>
              </Box>
            </Box>
          ))}
        </Box>
      ) : (
        <Box
          onClick={openDialog}
          sx={{
            width: '100%',
            height: 64,
            borderRadius: 1,
            border: '1px dashed',
            borderColor: 'divider',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 0.5,
            cursor: 'pointer',
            color: 'text.disabled',
            transition: 'border-color 150ms, color 150ms',
            '&:hover': { borderColor: 'text.secondary', color: 'text.secondary' },
          }}
        >
          <MqIcon name="plus" size={20} />
          <Typography variant="caption">Add reference</Typography>
        </Box>
      )}

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Add reference</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              label="Label"
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              placeholder="e.g. Figma"
              slotProps={{ input: { notched: false, color: 'secondary' } }}
              autoFocus
            />
            <TextField
              label="URL"
              value={newUrl}
              onChange={(e) => setNewUrl(e.target.value)}
              slotProps={{ input: { notched: false, color: 'secondary' } }}
              onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="secondary" onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleAdd} disabled={!newUrl.trim()}>Add</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
