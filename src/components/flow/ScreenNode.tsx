'use client';

import { useEffect, useState, useCallback } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { WireframeTree } from './WireframeRenderer';
import type { ComponentNode } from '@/lib/ast-inspector';

export interface ScreenNodeData extends Record<string, unknown> {
  screenId: string;
  screenName: string;
  prototypeId: string;
}

export type ScreenNodeType = Node<ScreenNodeData, 'screenNode'>;

const NODE_W = 220;
const NODE_H = 300;
const HEADER_H = 28;

const HANDLE_STYLE: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: '50%',
  backgroundColor: '#fff',
  border: '2px solid #90caf9',
};

export function ScreenNode({ data, selected }: NodeProps<ScreenNodeType>) {
  const { screenId, screenName, prototypeId } = data;
  const [tree, setTree] = useState<ComponentNode[] | null>(null);

  const fetchTree = useCallback(async () => {
    try {
      const param = screenId !== 'index' ? `?screen=${screenId}` : '';
      const res = await fetch(`/api/preview/${prototypeId}/tree${param}`);
      if (res.ok) {
        setTree(await res.json());
      }
    } catch {
      setTree([]);
    }
  }, [prototypeId, screenId]);

  useEffect(() => {
    fetchTree();
  }, [fetchTree]);

  return (
    <div
      style={{
        width: NODE_W,
        height: NODE_H,
        borderRadius: 8,
        backgroundColor: '#fff',
        border: selected ? '2px solid #1976d2' : '1.5px solid #e0e0e0',
        boxShadow: selected
          ? '0 0 0 3px rgba(25,118,210,0.15), 0 4px 16px rgba(0,0,0,0.10)'
          : '0 2px 12px rgba(0,0,0,0.07)',
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        userSelect: 'none',
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
    >
      {/* Handles */}
      <Handle type="target" position={Position.Top}    style={{ ...HANDLE_STYLE, top: -5 }} />
      <Handle type="source" position={Position.Bottom} style={{ ...HANDLE_STYLE, bottom: -5 }} />
      <Handle type="source" position={Position.Right}  style={{ ...HANDLE_STYLE, right: -5 }} />
      <Handle type="target" position={Position.Left}   style={{ ...HANDLE_STYLE, left: -5 }} />

      {/* Header */}
      <div
        style={{
          height: HEADER_H,
          flexShrink: 0,
          backgroundColor: '#f5f7fa',
          borderBottom: '1px solid #e8eaed',
          display: 'flex',
          alignItems: 'center',
          paddingLeft: 10,
          paddingRight: 10,
          gap: 6,
        }}
      >
        {/* Screen icon dots */}
        <div style={{ display: 'flex', gap: 3, flexShrink: 0 }}>
          {['#ff5f57','#febc2e','#28c840'].map((c) => (
            <div key={c} style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: c }} />
          ))}
        </div>
        <span
          style={{
            fontSize: 11,
            fontWeight: 600,
            color: '#444',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
            textAlign: 'center',
          }}
        >
          {screenName}
        </span>
      </div>

      {/* Wireframe content */}
      <div
        style={{
          flex: 1,
          overflow: 'hidden',
          padding: 8,
          backgroundColor: '#fafafa',
        }}
      >
        {tree === null ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
            {[80, 60, 100, 70, 90, 50, 75].map((w, i) => (
              <div key={i} style={{ height: 8, width: `${w}%`, borderRadius: 2, backgroundColor: '#ebebeb', animation: 'pulse 1.5s ease-in-out infinite' }} />
            ))}
          </div>
        ) : (
          <WireframeTree tree={tree} />
        )}
      </div>
    </div>
  );
}
