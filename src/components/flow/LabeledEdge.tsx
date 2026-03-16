'use client';

import { useState } from 'react';
import {
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
  MarkerType,
  type EdgeProps,
  type Edge,
  useReactFlow,
} from '@xyflow/react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import TextField from '@mui/material/TextField';
import MqIcon from '@/components/MqIcon';

export type TriggerType = 'click' | 'error' | 'back' | 'auto';

export interface LabeledEdgeData extends Record<string, unknown> {
  label?: string;
  triggerType?: TriggerType;
}

export type LabeledEdgeType = Edge<LabeledEdgeData, 'labeled'>;

const TRIGGER_CONFIG: Record<TriggerType, {
  label: string;
  stroke: string;
  activeColor: string;
  dashed: boolean;
}> = {
  click: { label: 'Click', stroke: '#90caf9', activeColor: '#1976d2', dashed: false },
  error: { label: 'Error', stroke: '#ef9a9a', activeColor: '#c62828', dashed: true  },
  back:  { label: 'Back',  stroke: '#bdbdbd', activeColor: '#546e7a', dashed: true  },
  auto:  { label: 'Auto',  stroke: '#ce93d8', activeColor: '#6a1b9a', dashed: true  },
};

export function LabeledEdge({
  id,
  sourceX, sourceY,
  targetX, targetY,
  sourcePosition, targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps<LabeledEdgeType>) {
  const [editingLabel, setEditingLabel] = useState(false);
  const [draft, setDraft] = useState(data?.label ?? '');
  const { updateEdgeData, deleteElements, getEdge, setEdges } = useReactFlow();

  const currentType: TriggerType = (data?.triggerType as TriggerType) in TRIGGER_CONFIG
    ? (data?.triggerType as TriggerType)
    : 'click';
  const cfg = TRIGGER_CONFIG[currentType];

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const strokeColor = selected ? cfg.activeColor : cfg.stroke;
  const strokeWidth = selected ? 2.5 : 1.8;

  const commitLabel = () => {
    updateEdgeData(id, { label: draft });
    setEditingLabel(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); commitLabel(); }
    if (e.key === 'Escape') { setDraft(data?.label ?? ''); setEditingLabel(false); }
  };

  const handleDeleteEdge = (e: React.MouseEvent) => {
    e.stopPropagation();
    const edge = getEdge(id);
    if (edge) deleteElements({ edges: [edge] });
  };

  const handleTypeChange = (e: React.MouseEvent, newType: TriggerType) => {
    e.stopPropagation();
    const newCfg = TRIGGER_CONFIG[newType];
    setEdges((es) =>
      es.map((edge) =>
        edge.id === id
          ? {
              ...edge,
              data: { ...edge.data, triggerType: newType },
              markerEnd: { type: MarkerType.ArrowClosed, color: newCfg.stroke, width: 16, height: 16 },
            }
          : edge,
      ),
    );
  };

  const showBadge = !editingLabel && (data?.label || currentType !== 'click');

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        interactionWidth={20}
        style={{
          stroke: strokeColor,
          strokeWidth,
          strokeDasharray: cfg.dashed ? '6 3' : undefined,
          cursor: 'pointer',
        }}
      />

      <EdgeLabelRenderer>
        {/* Midpoint badge */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
          onDoubleClick={() => { setDraft(data?.label ?? ''); setEditingLabel(true); }}
        >
          {showBadge && (
            <Box
              sx={{
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: selected ? cfg.activeColor : 'divider',
                borderRadius: 2,
                px: 1,
                py: 0.25,
                boxShadow: 1,
                display: 'flex',
                alignItems: 'center',
                gap: 0.5,
                whiteSpace: 'nowrap',
              }}
            >
              {currentType !== 'click' && (
                <Typography
                  variant="caption"
                  sx={{ color: cfg.activeColor, fontWeight: 600, fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}
                >
                  {cfg.label}
                </Typography>
              )}
              {data?.label && currentType !== 'click' && (
                <Typography variant="caption" color="text.disabled">·</Typography>
              )}
              {data?.label && (
                <Typography variant="caption" color="text.secondary">{data.label}</Typography>
              )}
            </Box>
          )}
        </div>

        {/* Controls above midpoint — only when selected */}
        {selected && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -100%) translate(${labelX}px,${labelY - 12}px)`,
              pointerEvents: 'all',
              zIndex: 9999,
            }}
            className="nodrag nopan"
          >
            <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
              {/* Trigger type selector */}
              <Box
                sx={{
                  bgcolor: 'background.paper',
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2.5,
                  boxShadow: 3,
                  overflow: 'hidden',
                  minWidth: 96,
                }}
              >
                {(Object.keys(TRIGGER_CONFIG) as TriggerType[]).map((type) => {
                  const tc = TRIGGER_CONFIG[type];
                  const active = type === currentType;
                  return (
                    <Box
                      key={type}
                      onClick={(e) => handleTypeChange(e, type)}
                      sx={{
                        px: 1.5,
                        py: 0.75,
                        fontSize: 11,
                        fontWeight: active ? 600 : 400,
                        color: active ? tc.activeColor : 'text.secondary',
                        bgcolor: active ? tc.activeColor + '12' : 'transparent',
                        cursor: 'pointer',
                        transition: 'background-color 0.1s',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 0.75,
                        '&:hover': !active ? { bgcolor: 'action.hover' } : {},
                      }}
                    >
                      <Box
                        sx={{
                          width: 8,
                          height: 3,
                          borderRadius: 1,
                          bgcolor: tc.activeColor,
                          opacity: active ? 1 : 0.4,
                        }}
                      />
                      {tc.label}
                    </Box>
                  );
                })}
              </Box>

              {editingLabel ? (
                <TextField
                  autoFocus
                  value={draft}
                  onChange={(e) => setDraft(e.target.value)}
                  onBlur={commitLabel}
                  onKeyDown={handleKeyDown}
                  size="small"
                  variant="outlined"
                  sx={{ minWidth: 80, '& .MuiOutlinedInput-root': { fontSize: 11 } }}
                  slotProps={{ input: { notched: false } }}
                />
              ) : (
                <Box sx={{ display: 'flex', gap: 0.5 }}>
                  <Tooltip title="Edit label">
                    <IconButton
                      onClick={() => { setDraft(data?.label ?? ''); setEditingLabel(true); }}
                      aria-label="Edit label"
                      size="small"
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'divider',
                        boxShadow: 1,
                        '&:hover': { bgcolor: 'action.hover' },
                      }}
                    >
                      <MqIcon name="edit" size={13} />
                    </IconButton>
                  </Tooltip>

                  <Tooltip title="Delete connection">
                    <IconButton
                      onClick={handleDeleteEdge}
                      aria-label="Delete connection"
                      size="small"
                      color="error"
                      sx={{
                        width: 28,
                        height: 28,
                        bgcolor: 'background.paper',
                        border: '1px solid',
                        borderColor: 'error.light',
                        boxShadow: 1,
                        '&:hover': { bgcolor: 'error.50' },
                      }}
                    >
                      <MqIcon name="trash" size={13} color="error" />
                    </IconButton>
                  </Tooltip>
                </Box>
              )}
            </Box>
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
