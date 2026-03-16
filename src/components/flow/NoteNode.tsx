'use client';

import { useState, useRef, useEffect } from 'react';
import { type NodeProps, type Node, useReactFlow } from '@xyflow/react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import MqIcon from '@/components/MqIcon';

export type NoteColor = 'yellow' | 'pink' | 'blue' | 'green' | 'purple' | 'orange';

export const NOTE_COLORS: Record<NoteColor, { light: string; dark: string; border: string; minimap: string }> = {
  yellow: { light: '#fff9c4', dark: 'rgba(255, 249, 196, 0.10)', border: '#f9a825', minimap: '#ffe082' },
  pink:   { light: '#fce4ec', dark: 'rgba(252, 228, 236, 0.10)', border: '#e91e63', minimap: '#f48fb1' },
  blue:   { light: '#e3f2fd', dark: 'rgba(227, 242, 253, 0.10)', border: '#1e88e5', minimap: '#90caf9' },
  green:  { light: '#e8f5e9', dark: 'rgba(232, 245, 233, 0.10)', border: '#43a047', minimap: '#a5d6a7' },
  purple: { light: '#f3e5f5', dark: 'rgba(243, 229, 245, 0.10)', border: '#8e24aa', minimap: '#ce93d8' },
  orange: { light: '#fff3e0', dark: 'rgba(255, 243, 224, 0.10)', border: '#f57c00', minimap: '#ffb74d' },
};

const COLOR_ORDER: NoteColor[] = ['yellow', 'pink', 'blue', 'green', 'purple', 'orange'];

export function getNoteMinimapColor(color?: string): string {
  return NOTE_COLORS[(color as NoteColor) ?? 'yellow']?.minimap ?? NOTE_COLORS.yellow.minimap;
}

export interface NoteNodeData extends Record<string, unknown> {
  text: string;
  color?: NoteColor;
}

export type NoteNodeType = Node<NoteNodeData, 'noteNode'>;

export function NoteNode({ id, data, selected }: NodeProps<NoteNodeType>) {
  const { updateNodeData, deleteElements, getNode } = useReactFlow();
  const [editing, setEditing] = useState(!data.text);
  const [draft, setDraft] = useState(data.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const color = NOTE_COLORS[data.color ?? 'yellow'];

  useEffect(() => {
    if (editing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [editing]);

  const commit = () => {
    updateNodeData(id, { text: draft });
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault();
      commit();
    }
    if (e.key === 'Escape') {
      setDraft(data.text);
      setEditing(false);
    }
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    const node = getNode(id);
    if (node) deleteElements({ nodes: [node] });
  };

  return (
    <Box
      sx={{
        minWidth: 180,
        maxWidth: 280,
        bgcolor: color.light,
        '[data-mui-color-scheme="dark"] &': { bgcolor: color.dark },
        border: '1px solid',
        borderColor: selected ? color.border : 'divider',
        borderRadius: 1,
        boxShadow: selected ? 3 : 1,
        px: 1.75,
        py: 1.25,
        position: 'relative',
        cursor: 'default',
        userSelect: 'none',
        transition: 'box-shadow 0.2s, border-color 0.2s, background-color 0.2s',
      }}
      onDoubleClick={() => { setDraft(data.text); setEditing(true); }}
    >
      {/* Delete button */}
      {selected && !editing && (
        <Tooltip title="Delete note">
        <IconButton
          onClick={handleDelete}
          size="small"
          color="error"
          aria-label="Delete note"
          sx={{
            position: 'absolute',
            top: -8,
            right: -8,
            width: 16,
            height: 16,
            bgcolor: 'error.main',
            color: 'error.contrastText',
            border: '1.5px solid',
            borderColor: 'background.default',
            boxShadow: 1,
            '&:hover': { bgcolor: 'error.dark' },
          }}
        >
          <MqIcon name="close" size={8} color="#fff" />
        </IconButton>
        </Tooltip>
      )}

      {/* Color picker — shown when selected */}
      {selected && !editing && (
        <Box
          sx={{
            position: 'absolute',
            bottom: -28,
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: 0.5,
            bgcolor: 'common.white',
            '[data-mui-color-scheme="dark"] &': { bgcolor: 'background.default' },
            borderRadius: 100,
            px: 0.5,
            py: 0.25,
            boxShadow: 2,
            border: '1px solid',
            borderColor: 'divider',
          }}
        >
          {COLOR_ORDER.map((c) => (
            <Tooltip key={c} title={c.charAt(0).toUpperCase() + c.slice(1)}>
              <Box
                onClick={(e) => { e.stopPropagation(); updateNodeData(id, { color: c }); }}
                sx={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  bgcolor: NOTE_COLORS[c].light,
                  border: '1.5px solid',
                  borderColor: (data.color ?? 'yellow') === c ? NOTE_COLORS[c].border : 'divider',
                  cursor: 'pointer',
                  transition: 'transform 0.15s',
                  '&:hover': { transform: 'scale(1.25)' },
                }}
              />
            </Tooltip>
          ))}
        </Box>
      )}

      {editing ? (
        <>
          <textarea
            ref={textareaRef}
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={handleKeyDown}
            onBlur={commit}
            style={{
              width: '100%',
              minHeight: 64,
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              resize: 'none',
              fontSize: 13,
              fontFamily: 'inherit',
              lineHeight: 1.5,
              color: 'var(--mui-palette-text-secondary)',
            }}
            placeholder="Add a note…"
          />
          <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block', fontSize: 10 }}>
            ⌘↵ save · Esc cancel
          </Typography>
        </>
      ) : (
        <Typography
          variant="body2"
          sx={{
            whiteSpace: 'pre-wrap',
            wordBreak: 'break-word',
            color: 'text.secondary',
            lineHeight: 1.5,
          }}
        >
          {data.text || (
            <Typography component="span" variant="body2" color="text.disabled" sx={{ fontStyle: 'italic' }}>
              Double-click to edit
            </Typography>
          )}
        </Typography>
      )}

    </Box>
  );
}
