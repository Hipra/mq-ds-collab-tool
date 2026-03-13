'use client';

import { useState, useEffect } from 'react';
import {
  Box, Button, Chip, Dialog, DialogActions, DialogContent, DialogTitle,
  MenuItem, Select, TextField, Typography, Alert, type SelectChangeEvent,
} from '@mui/material';
import type { ProjectWithPrototypes } from '@/types/project';

interface PrototypeListItem {
  id: string;
  name: string;
}

interface ProjectDialogProps {
  open: boolean;
  onClose: () => void;
  onSave: () => void;
  editProject?: ProjectWithPrototypes | null;
}

export default function ProjectDialog({ open, onClose, onSave, editProject }: ProjectDialogProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [assignee, setAssignee] = useState('');
  const [selectedPrototypeIds, setSelectedPrototypeIds] = useState<string[]>([]);
  const [availablePrototypes, setAvailablePrototypes] = useState<PrototypeListItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (open) {
      fetch('/api/prototypes')
        .then((r) => r.json())
        .then((data) => setAvailablePrototypes(data))
        .catch(() => setAvailablePrototypes([]));

      if (editProject) {
        setName(editProject.name);
        setDescription(editProject.description);
        setAssignee(editProject.assignee);
        setSelectedPrototypeIds(editProject.prototypeIds);
      } else {
        setName('');
        setDescription('');
        setAssignee('');
        setSelectedPrototypeIds([]);
      }
      setError('');
    }
  }, [open, editProject]);

  const handlePrototypeChange = (e: SelectChangeEvent<string[]>) => {
    const val = e.target.value;
    setSelectedPrototypeIds(typeof val === 'string' ? val.split(',') : val);
  };

  const handleSave = async () => {
    setLoading(true);
    setError('');
    try {
      const body = { name, description, assignee, prototypeIds: selectedPrototypeIds };
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
          <TextField
            label="Assignee"
            value={assignee}
            onChange={(e) => setAssignee(e.target.value)}
            size="small"
            slotProps={{ input: { notched: false, color: 'secondary' } }}
          />
          <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
              Prototypes
            </Typography>
            <Select
              multiple
              size="small"
              value={selectedPrototypeIds}
              onChange={handlePrototypeChange}
              displayEmpty
              fullWidth
              renderValue={(selected) =>
                selected.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">Select prototypes</Typography>
                ) : (
                  <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                    {selected.map((id) => {
                      const proto = availablePrototypes.find((p) => p.id === id);
                      return <Chip key={id} label={proto?.name || id} size="small" />;
                    })}
                  </Box>
                )
              }
            >
              {availablePrototypes.map((proto) => (
                <MenuItem key={proto.id} value={proto.id}>
                  {proto.name}
                </MenuItem>
              ))}
            </Select>
          </Box>
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
