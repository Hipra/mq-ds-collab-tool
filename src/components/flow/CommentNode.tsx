'use client';

import { useState, useRef, useEffect } from 'react';
import { type NodeProps, type Node, useReactFlow } from '@xyflow/react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import MqIcon from '@/components/MqIcon';

export interface CommentNodeData extends Record<string, unknown> {
  text: string;
}

export type CommentNodeType = Node<CommentNodeData, 'commentNode'>;

export function CommentNode({ id, data, selected }: NodeProps<CommentNodeType>) {
  const { updateNodeData, deleteElements, getNode } = useReactFlow();
  const [editing, setEditing] = useState(!data.text);
  const [draft, setDraft] = useState(data.text);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

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
        bgcolor: '#fffde7',
        border: '1px solid',
        borderColor: selected ? 'warning.main' : 'divider',
        borderRadius: 2.5,
        boxShadow: selected ? 3 : 1,
        px: 1.75,
        py: 1.25,
        position: 'relative',
        cursor: 'default',
        userSelect: 'none',
        transition: 'box-shadow 0.2s, border-color 0.2s',
      }}
      onDoubleClick={() => { setDraft(data.text); setEditing(true); }}
    >
      {/* Delete button */}
      {selected && !editing && (
        <IconButton
          onClick={handleDelete}
          size="small"
          color="error"
          title="Delete comment"
          sx={{
            position: 'absolute',
            top: -8,
            right: -8,
            width: 16,
            height: 16,
            bgcolor: 'error.main',
            color: 'error.contrastText',
            border: '1.5px solid',
            borderColor: 'common.white',
            boxShadow: 1,
            '&:hover': { bgcolor: 'error.dark' },
          }}
        >
          <MqIcon name="close" size={8} color="#fff" />
        </IconButton>
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
              color: '#444',
            }}
            placeholder="Add a comment…"
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
