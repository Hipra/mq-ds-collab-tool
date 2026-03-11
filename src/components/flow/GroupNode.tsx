'use client';

import { useState } from 'react';
import { NodeResizer, type NodeProps, type Node, useReactFlow } from '@xyflow/react';

export interface GroupNodeData extends Record<string, unknown> {
  label: string;
}

export type GroupNodeType = Node<GroupNodeData, 'groupNode'>;

export function GroupNode({ id, data, selected }: NodeProps<GroupNodeType>) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(data.label);
  const { updateNodeData } = useReactFlow();

  const commit = () => {
    updateNodeData(id, { label: draft });
    setEditing(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') { e.preventDefault(); commit(); }
    if (e.key === 'Escape') { setDraft(data.label); setEditing(false); }
  };

  return (
    <>
      <NodeResizer
        isVisible={selected}
        minWidth={200}
        minHeight={120}
        handleStyle={{ width: 8, height: 8, borderRadius: 2, background: '#90caf9', border: '1px solid #1976d2' }}
        lineStyle={{ borderColor: '#90caf9', borderWidth: 1 }}
      />

      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 10,
          border: selected ? '2px dashed #1976d2' : '1.5px dashed #b0bec5',
          backgroundColor: 'rgba(227, 242, 253, 0.25)',
          boxSizing: 'border-box',
          position: 'relative',
        }}
      >
        {/* Phase label chip at top-left */}
        <div style={{ position: 'absolute', top: -13, left: 14 }}>
          {editing ? (
            <input
              autoFocus
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onBlur={commit}
              onKeyDown={handleKeyDown}
              style={{
                fontSize: 12,
                fontWeight: 700,
                color: '#1565c0',
                background: 'white',
                border: '1.5px solid #90caf9',
                borderRadius: 5,
                padding: '1px 8px',
                outline: 'none',
                minWidth: 80,
                boxShadow: '0 1px 4px rgba(25,118,210,0.15)',
              }}
            />
          ) : (
            <div
              style={{
                background: 'white',
                border: `1.5px solid ${selected ? '#90caf9' : '#cfd8dc'}`,
                borderRadius: 5,
                padding: '1px 8px',
                fontSize: 12,
                fontWeight: 700,
                color: selected ? '#1565c0' : '#607d8b',
                cursor: 'text',
                userSelect: 'none',
                boxShadow: '0 1px 3px rgba(0,0,0,0.07)',
                transition: 'border-color 0.15s, color 0.15s',
              }}
              onDoubleClick={() => { setDraft(data.label); setEditing(true); }}
            >
              {data.label || 'Phase'}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
