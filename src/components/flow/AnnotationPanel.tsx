'use client';

import { useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import { Box, Typography, TextField, MenuItem, IconButton, Divider } from '@mui/material';
import MqIcon from '@/components/MqIcon';
import { useFlowContext } from './FlowContext';
import type { ScreenNodeData } from './ScreenNode';

const COPY_TONES = [
  { value: 'neutral',     label: 'Neutral' },
  { value: 'reassuring',  label: 'Reassuring' },
  { value: 'instructive', label: 'Instructive' },
  { value: 'celebratory', label: 'Celebratory' },
  { value: 'urgent',      label: 'Urgent' },
];

interface AnnotationPanelProps {
  nodeId: string;
  onClose: () => void;
}

export function AnnotationPanel({ nodeId, onClose }: AnnotationPanelProps) {
  const { updateNodeData, getNode } = useReactFlow();
  const { triggerSave } = useFlowContext();

  const nodeData = (getNode(nodeId)?.data ?? {}) as ScreenNodeData;

  const [purpose,    setPurpose]    = useState(nodeData.purpose    ?? '');
  const [userIntent, setUserIntent] = useState(nodeData.userIntent ?? '');
  const [copyTone,   setCopyTone]   = useState(nodeData.copyTone   ?? 'neutral');
  const [notes,      setNotes]      = useState(nodeData.notes      ?? '');

  const savePurpose    = () => { updateNodeData(nodeId, { purpose });    triggerSave(); };
  const saveUserIntent = () => { updateNodeData(nodeId, { userIntent }); triggerSave(); };
  const saveNotes      = () => { updateNodeData(nodeId, { notes });      triggerSave(); };
  const saveCopyTone   = (tone: string) => { updateNodeData(nodeId, { copyTone: tone }); triggerSave(); };

  const INPUT_SLOT = { input: { notched: false } } as const;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 12,
        right: 12,
        width: 272,
        maxHeight: 'calc(100% - 24px)',
        overflowY: 'auto',
        bgcolor: 'background.paper',
        borderRadius: 2,
        boxShadow: '0 4px 24px rgba(0,0,0,0.13)',
        borderLeft: '3px solid',
        borderLeftColor: 'primary.main',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <Box sx={{ px: 2, pt: 1.5, pb: 0.5, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.secondary', textTransform: 'uppercase', letterSpacing: 0.6 }}>
          Screen notes
        </Typography>
        <IconButton size="small" onClick={onClose} sx={{ mr: -0.75 }}>
          <MqIcon name="close" size={14} />
        </IconButton>
      </Box>

      <Typography variant="subtitle2" sx={{ px: 2, pb: 1.5, fontWeight: 700, color: 'text.primary' }}>
        {nodeData.screenName}
      </Typography>

      <Divider />

      <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
        <TextField
          label="Purpose"
          placeholder="What is the goal of this screen?"
          value={purpose}
          onChange={(e) => setPurpose(e.target.value)}
          onBlur={savePurpose}
          size="small"
          multiline
          rows={2}
          fullWidth
          slotProps={INPUT_SLOT}
        />

        <TextField
          label="User intent"
          placeholder="What is the user trying to do?"
          value={userIntent}
          onChange={(e) => setUserIntent(e.target.value)}
          onBlur={saveUserIntent}
          size="small"
          multiline
          rows={2}
          fullWidth
          slotProps={INPUT_SLOT}
        />

        <TextField
          select
          label="Copy tone"
          value={copyTone}
          onChange={(e) => { setCopyTone(e.target.value); saveCopyTone(e.target.value); }}
          size="small"
          fullWidth
          slotProps={INPUT_SLOT}
        >
          {COPY_TONES.map((t) => (
            <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>
          ))}
        </TextField>

        <TextField
          label="Notes / TODOs"
          placeholder="Open questions, copy hints…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          size="small"
          multiline
          rows={3}
          fullWidth
          slotProps={INPUT_SLOT}
        />
      </Box>
    </Box>
  );
}
