'use client';

import { useState, useRef, useEffect } from 'react';
import { type NodeProps, type Node, useReactFlow } from '@xyflow/react';

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
    <div
      style={{
        minWidth: 160,
        maxWidth: 260,
        backgroundColor: '#fffde7',
        border: selected ? '1.5px solid #f9a825' : '1.5px solid #ffe082',
        borderRadius: 6,
        boxShadow: selected
          ? '0 0 0 3px rgba(249,168,37,0.2), 0 3px 12px rgba(0,0,0,0.10)'
          : '0 2px 8px rgba(0,0,0,0.08)',
        padding: '8px 10px',
        position: 'relative',
        cursor: 'default',
        userSelect: 'none',
      }}
      onDoubleClick={() => { setDraft(data.text); setEditing(true); }}
    >
      {/* Delete button */}
      {selected && !editing && (
        <button
          onClick={handleDelete}
          style={{
            position: 'absolute',
            top: -8,
            right: -8,
            width: 18,
            height: 18,
            borderRadius: '50%',
            border: 'none',
            backgroundColor: '#ef5350',
            color: '#fff',
            fontSize: 11,
            lineHeight: '18px',
            textAlign: 'center',
            cursor: 'pointer',
            padding: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
          title="Delete comment"
        >
          ×
        </button>
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
              minHeight: 60,
              border: 'none',
              outline: 'none',
              backgroundColor: 'transparent',
              resize: 'none',
              fontSize: 12,
              fontFamily: 'inherit',
              lineHeight: 1.5,
              color: '#555',
            }}
            placeholder="Add a comment…"
          />
          <div style={{ fontSize: 10, color: '#aaa', marginTop: 2 }}>⌘↵ to save · Esc to cancel</div>
        </>
      ) : (
        <p style={{ margin: 0, fontSize: 12, lineHeight: 1.5, color: '#555', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
          {data.text || <span style={{ color: '#bbb', fontStyle: 'italic' }}>Double-click to edit</span>}
        </p>
      )}

      {/* Little tail */}
      <div
        style={{
          position: 'absolute',
          bottom: -8,
          left: 18,
          width: 0,
          height: 0,
          borderLeft: '6px solid transparent',
          borderRight: '6px solid transparent',
          borderTop: `8px solid ${selected ? '#f9a825' : '#ffe082'}`,
        }}
      />
    </div>
  );
}
