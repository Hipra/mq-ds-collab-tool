'use client';

import { useState } from 'react';
import { useReactFlow } from '@xyflow/react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import MqIcon from '@/components/MqIcon';
import { useFlowContext } from './FlowContext';
import type { ScreenNodeData } from './ScreenNode';

interface AnnotationPanelProps {
  nodeId: string;
  onClose: () => void;
}

export function AnnotationPanel({ nodeId, onClose }: AnnotationPanelProps) {
  const { updateNodeData, getNode } = useReactFlow();
  const { triggerSave } = useFlowContext();

  const nodeData = (getNode(nodeId)?.data ?? {}) as ScreenNodeData;

  const [notes, setNotes] = useState(nodeData.notes ?? '');

  const saveNotes = () => { updateNodeData(nodeId, { notes }); triggerSave(); };

  const INPUT_SLOT = { input: { notched: false } } as const;

  return (
    <Box
      sx={{
        position: 'absolute',
        top: 12,
        right: 12,
        width: 280,
        maxHeight: 'calc(100% - 24px)',
        overflowY: 'auto',
        bgcolor: 'background.paper',
        borderRadius: 3,
        boxShadow: '0 4px 24px rgba(0,0,0,0.10), 0 0 0 1px rgba(0,0,0,0.04)',
        zIndex: 20,
        display: 'flex',
        flexDirection: 'column',
      }}
      onMouseDown={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <Box sx={{ px: 2, pt: 2, pb: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Typography variant="caption" sx={{ fontWeight: 700, color: 'text.disabled', textTransform: 'uppercase', letterSpacing: 0.8, fontSize: 10 }}>
          Screen notes
        </Typography>
        <Tooltip title="Close">
          <IconButton size="small" onClick={onClose} aria-label="Close" sx={{ mr: -0.5 }}>
            <MqIcon name="close" size={14} />
          </IconButton>
        </Tooltip>
      </Box>

      <Typography variant="subtitle2" sx={{ px: 2, pb: 1.5, fontWeight: 700, color: 'text.primary' }}>
        {nodeData.screenName}
      </Typography>

      <Divider />

      <Box sx={{ p: 2 }}>
        <TextField
          label="Notes"
          placeholder="Open questions, copy hints, TODOs…"
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          onBlur={saveNotes}
          size="small"
          multiline
          rows={4}
          fullWidth
          slotProps={INPUT_SLOT}
        />
      </Box>
    </Box>
  );
}
