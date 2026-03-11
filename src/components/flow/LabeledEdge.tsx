'use client';

import { useState } from 'react';
import {
  getBezierPath,
  EdgeLabelRenderer,
  BaseEdge,
  type EdgeProps,
  type Edge,
  useReactFlow,
} from '@xyflow/react';

export interface LabeledEdgeData extends Record<string, unknown> {
  label?: string;
}

export type LabeledEdgeType = Edge<LabeledEdgeData, 'labeled'>;

export function LabeledEdge({
  id,
  sourceX, sourceY, targetX, targetY,
  sourcePosition, targetPosition,
  data,
  selected,
  markerEnd,
}: EdgeProps<LabeledEdgeType>) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data?.label ?? '');
  const { updateEdgeData, deleteElements, getEdge } = useReactFlow();

  const [edgePath, labelX, labelY] = getBezierPath({
    sourceX, sourceY, sourcePosition,
    targetX, targetY, targetPosition,
  });

  const commit = () => {
    updateEdgeData(id, { label: draft });
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { setDraft(data?.label ?? ''); setEditing(false); }
  };

  const handleDoubleClick = () => {
    setDraft(data?.label ?? '');
    setEditing(true);
  };

  const handleDeleteEdge = (e: React.MouseEvent) => {
    e.stopPropagation();
    const edge = getEdge(id);
    if (edge) deleteElements({ edges: [edge] });
  };

  const strokeColor = selected ? '#1976d2' : '#90caf9';
  const strokeWidth = selected ? 2 : 1.5;

  return (
    <>
      <BaseEdge
        id={id}
        path={edgePath}
        markerEnd={markerEnd}
        style={{ stroke: strokeColor, strokeWidth, cursor: 'pointer' }}
      />

      <EdgeLabelRenderer>
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
          onDoubleClick={handleDoubleClick}
        >
          {editing ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={handleKeyDown}
              style={{
                border: '1px solid #1976d2',
                borderRadius: 4,
                padding: '2px 6px',
                fontSize: 11,
                outline: 'none',
                backgroundColor: '#fff',
                boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                minWidth: 60,
              }}
            />
          ) : data?.label ? (
            <div
              style={{
                backgroundColor: '#fff',
                border: `1px solid ${selected ? '#1976d2' : '#ddd'}`,
                borderRadius: 4,
                padding: '2px 6px',
                fontSize: 11,
                color: '#555',
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
                display: 'flex',
                alignItems: 'center',
                gap: 4,
              }}
            >
              {data.label}
              {selected && (
                <span
                  onClick={handleDeleteEdge}
                  style={{ color: '#ef5350', cursor: 'pointer', lineHeight: 1 }}
                  title="Delete edge"
                >×</span>
              )}
            </div>
          ) : selected ? (
            <div
              style={{
                width: 20, height: 20, borderRadius: '50%',
                backgroundColor: '#fff',
                border: '1px solid #ddd',
                fontSize: 12, color: '#aaa',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
              }}
              title="Double-click to add label"
            >
              +
            </div>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
