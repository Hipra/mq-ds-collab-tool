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
  click: { label: 'Click', stroke: '#64b5f6', activeColor: '#1976d2', dashed: false },
  error: { label: 'Error', stroke: '#ef9a9a', activeColor: '#c62828', dashed: true  },
  back:  { label: 'Back',  stroke: '#bdbdbd', activeColor: '#546e7a', dashed: true  },
  auto:  { label: 'Auto',  stroke: '#ce93d8', activeColor: '#6a1b9a', dashed: true  },
};

const BTN: React.CSSProperties = {
  borderRadius: 3,
  border: '1px solid #ddd',
  backgroundColor: '#fff',
  cursor: 'pointer',
  boxShadow: '0 1px 3px rgba(0,0,0,0.10)',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: 0,
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
  const strokeWidth = selected ? 2.5 : 1.5;

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
            <div style={{
              backgroundColor: '#fff',
              border: `1px solid ${selected ? cfg.activeColor : '#e0e0e0'}`,
              borderRadius: 4,
              padding: '2px 6px',
              fontSize: 11,
              color: selected ? cfg.activeColor : '#666',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              display: 'flex',
              alignItems: 'center',
              gap: 3,
              whiteSpace: 'nowrap',
            }}>
              {currentType !== 'click' && (
                <span style={{ color: cfg.activeColor, fontWeight: 600 }}>{cfg.label}</span>
              )}
              {data?.label && currentType !== 'click' && <span style={{ color: '#ccc' }}>·</span>}
              {data?.label && <span>{data.label}</span>}
            </div>
          )}
        </div>

        {/* Controls above midpoint — only when selected */}
        {selected && (
          <div
            style={{
              position: 'absolute',
              transform: `translate(-50%, -100%) translate(${labelX}px,${labelY - 10}px)`,
              pointerEvents: 'all',
              zIndex: 9999,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 3,
            }}
            className="nodrag nopan"
          >
            {/* Trigger type selector */}
            <div style={{
              backgroundColor: '#fff',
              border: '1px solid #e0e0e0',
              borderRadius: 6,
              boxShadow: '0 2px 8px rgba(0,0,0,0.12)',
              overflow: 'hidden',
              minWidth: 90,
            }}>
              {(Object.keys(TRIGGER_CONFIG) as TriggerType[]).map((type) => {
                const tc = TRIGGER_CONFIG[type];
                const active = type === currentType;
                return (
                  <div
                    key={type}
                    onClick={(e) => handleTypeChange(e, type)}
                    style={{
                      padding: '5px 10px',
                      fontSize: 11,
                      fontWeight: active ? 700 : 400,
                      color: active ? tc.activeColor : '#555',
                      backgroundColor: active ? tc.activeColor + '18' : 'transparent',
                      cursor: 'pointer',
                      transition: 'background-color 0.1s',
                    }}
                    onMouseEnter={(e) => { if (!active) e.currentTarget.style.backgroundColor = '#f5f5f5'; }}
                    onMouseLeave={(e) => { if (!active) e.currentTarget.style.backgroundColor = 'transparent'; }}
                  >
                    {tc.label}
                  </div>
                );
              })}
            </div>

            {editingLabel ? (
              <input
                autoFocus
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onBlur={commitLabel}
                onKeyDown={handleKeyDown}
                style={{
                  border: '1px solid #1976d2',
                  borderRadius: 4,
                  padding: '2px 6px',
                  fontSize: 11,
                  outline: 'none',
                  backgroundColor: '#fff',
                  boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                  minWidth: 80,
                }}
              />
            ) : (
              <div style={{ display: 'flex', gap: 2 }}>
                <button
                  onClick={() => { setDraft(data?.label ?? ''); setEditingLabel(true); }}
                  title="Edit label"
                  style={{ ...BTN, width: 22, height: 22, fontSize: 11, color: '#888' }}
                >
                  ✎
                </button>

                <button
                  onClick={handleDeleteEdge}
                  title="Delete connection"
                  style={{
                    ...BTN,
                    width: 22, height: 22,
                    border: '1px solid #ffcdd2',
                    fontSize: 13,
                    color: '#ef5350',
                    fontWeight: 700,
                    lineHeight: 1,
                  }}
                >
                  ×
                </button>
              </div>
            )}
          </div>
        )}
      </EdgeLabelRenderer>
    </>
  );
}
