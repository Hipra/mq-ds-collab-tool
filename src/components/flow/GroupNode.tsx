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
        handleStyle={{
          width: 8,
          height: 8,
          borderRadius: 2,
          background: 'var(--mui-palette-primary-light)',
          border: '1px solid var(--mui-palette-primary-main)',
        }}
        lineStyle={{
          borderColor: 'var(--mui-palette-primary-light)',
          borderWidth: 1,
        }}
      />

      <div
        style={{
          width: '100%',
          height: '100%',
          borderRadius: 10,
          border: selected
            ? '2px dashed var(--mui-palette-primary-main)'
            : '1.5px dashed var(--mui-palette-divider)',
          backgroundColor: 'var(--mui-palette-primary-50, rgba(227, 242, 253, 0.25))',
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
                color: 'var(--mui-palette-primary-dark)',
                background: 'var(--mui-palette-background-paper)',
                border: '1.5px solid var(--mui-palette-primary-light)',
                borderRadius: 5,
                padding: '1px 8px',
                outline: 'none',
                minWidth: 80,
                boxShadow: '0 1px 4px rgba(0,0,0,0.1)',
              }}
            />
          ) : (
            <div
              style={{
                background: 'var(--mui-palette-background-paper)',
                border: `1.5px solid ${selected ? 'var(--mui-palette-primary-light)' : 'var(--mui-palette-divider)'}`,
                borderRadius: 5,
                padding: '1px 8px',
                fontSize: 12,
                fontWeight: 700,
                color: selected ? 'var(--mui-palette-primary-dark)' : 'var(--mui-palette-text-secondary)',
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
