'use client';

import { useState, useEffect } from 'react';
import {
  Box, Button, Dialog, DialogActions, DialogContent, DialogTitle,
  TextField, Alert,
} from '@mui/material';
import type { ProjectWithPrototypes } from '@/types/project';

interface ProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  editProject?: ProjectWithPrototypes | null;
}

export default function ProjectDialog({ open, onClose, onSave, editProject }: ProjectDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      if (editProject) {
        setName(editProject.name);
        setDescription(editProject.description);
      } else {
        setName('');
        setDescription('');
      }
      setError('');
    }
  }, [open, editProject]);

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      const body = { name, description };
      const url = editProject ? `/api/projects/${editProject.id}` : '/api/projects';
      const method = editProject ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || 'Failed to save project');
      }

      onSave();
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>{editProject ? 'Edit Project' : 'New Project'}</DialogTitle>
      <DialogContent>
        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
          <TextField
            label="Project name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            size="small"
            slotProps={{ input: { notched: false, color: 'secondary' } }}
            autoFocus
          />
          <TextField
            label="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            size="small"
            multiline
            rows={2}
            slotProps={{ input: { notched: false, color: 'secondary' } }}
          />
        </Box>
      </DialogContent>
      <DialogActions>
        <Button variant="text" color="secondary" onClick={onClose}>
          Cancel
        </Button>
        <Button variant="contained" onClick={handleSave} disabled={!name.trim() || loading}>
          {editProject ? 'Save' : 'Create'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
