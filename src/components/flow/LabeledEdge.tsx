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
        interactionWidth={20}
        style={{ stroke: strokeColor, strokeWidth, cursor: 'pointer' }}
      />

      <EdgeLabelRenderer>
        {/* Label at midpoint */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -50%) translate(${labelX}px,${labelY}px)`,
            pointerEvents: 'all',
          }}
          className="nodrag nopan"
          onDoubleClick={handleDoubleClick}
        >
          {!editing && data?.label && (
            <div style={{
              backgroundColor: '#fff',
              border: `1px solid ${selected ? '#1976d2' : '#ddd'}`,
              borderRadius: 4,
              padding: '2px 6px',
              fontSize: 11,
              color: '#555',
              boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
            }}>
              {data.label}
            </div>
          )}
        </div>

        {/* Action buttons: offset ABOVE midpoint to avoid being hidden by nodes */}
        <div
          style={{
            position: 'absolute',
            transform: `translate(-50%, -100%) translate(${labelX}px,${labelY - 6}px)`,
            pointerEvents: 'all',
            zIndex: 9999,
          }}
          className="nodrag nopan"
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
          ) : selected ? (
            <div style={{ display: 'flex', gap: 2 }}>
              <button
                onClick={handleDoubleClick}
                title="Edit label"
                style={{
                  width: 20, height: 20, borderRadius: 4,
                  border: '1px solid #ddd', backgroundColor: '#fff',
                  fontSize: 11, color: '#888', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 0, boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                }}
              >
                ✎
              </button>
              <button
                onClick={handleDeleteEdge}
                title="Delete connection"
                style={{
                  width: 20, height: 20, borderRadius: 4,
                  border: '1px solid #ffcdd2', backgroundColor: '#fff',
                  fontSize: 13, color: '#ef5350', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  padding: 0, fontWeight: 700, lineHeight: 1,
                  boxShadow: '0 1px 3px rgba(0,0,0,0.12)',
                }}
              >
                ×
              </button>
            </div>
          ) : null}
        </div>
      </EdgeLabelRenderer>
    </>
  );
}
