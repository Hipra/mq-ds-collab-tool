'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { useInspectorStore } from '@/stores/inspector';
import { useFlowContext } from './FlowContext';

export interface ScreenNodeData extends Record<string, unknown> {
  screenId: string;
  screenName: string;
  prototypeId: string;
  status: 'draft' | 'review' | 'approved';
  // UX writer annotations
  purpose?: string;
  userIntent?: string;
  copyTone?: string;
  notes?: string;
}

export type ScreenNodeType = Node<ScreenNodeData, 'screenNode'>;

const STATUS_CONFIG = {
  draft:    { label: 'Draft',    color: '#757575', bg: '#f5f5f5', border: '#e0e0e0' },
  review:   { label: 'Review',   color: '#1565c0', bg: '#e3f2fd', border: '#90caf9' },
  approved: { label: 'Approved', color: '#2e7d32', bg: '#e8f5e9', border: '#a5d6a7' },
};

const TONE_COLORS: Record<string, string> = {
  reassuring:  '#4caf50',
  instructive: '#1976d2',
  celebratory: '#f57c00',
  urgent:      '#d32f2f',
  neutral:     '#9e9e9e',
};

const HANDLE_STYLE: React.CSSProperties = {
  width: 9,
  height: 9,
  borderRadius: '50%',
  backgroundColor: '#fff',
  border: '2px solid #90caf9',
};

export function ScreenNode({ data, selected }: NodeProps<ScreenNodeType>) {
  const { screenId, screenName, prototypeId, status } = data;
  const router = useRouter();
  const setActiveScreen = useInspectorStore((s) => s.setActiveScreen);
  const { thumbnailVersions } = useFlowContext();

  const version = thumbnailVersions[screenId] ?? 0;
  const thumbnailSrc = `/api/preview/${prototypeId}/thumbnail?screen=${screenId}&t=${version}`;
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  // Reset error state when version changes so we retry the new thumbnail
  useEffect(() => {
    setThumbnailFailed(false);
  }, [version]);

  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.draft;
  const hasNotes = !!(data.purpose || data.userIntent || data.notes);
  const toneColor = data.copyTone ? TONE_COLORS[data.copyTone] ?? '#9e9e9e' : null;

  const handleOpen = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveScreen(screenId);
    router.push(`/prototype/${prototypeId}`);
  };

  return (
    <div
      style={{
        width: 280,
        borderRadius: 8,
        backgroundColor: '#fff',
        border: selected ? '2px solid #1976d2' : `1.5px solid ${toneColor ?? '#e0e0e0'}`,
        boxShadow: selected
          ? '0 0 0 3px rgba(25,118,210,0.12), 0 2px 10px rgba(0,0,0,0.08)'
          : '0 1px 6px rgba(0,0,0,0.06)',
        userSelect: 'none',
        transition: 'box-shadow 0.15s, border-color 0.15s',
      }}
    >
      <Handle id="top"    type="target" position={Position.Top}    style={{ ...HANDLE_STYLE, top: -5 }} />
      <Handle id="bottom" type="source" position={Position.Bottom} style={{ ...HANDLE_STYLE, bottom: -5 }} />
      <Handle id="right"  type="source" position={Position.Right}  style={{ ...HANDLE_STYLE, right: -5 }} />
      <Handle id="left"   type="target" position={Position.Left}   style={{ ...HANDLE_STYLE, left: -5 }} />

      {/* Thumbnail area */}
      <div
        style={{
          width: '100%',
          height: 168,
          borderRadius: '6px 6px 0 0',
          overflow: 'hidden',
          backgroundColor: '#f0f2f5',
          flexShrink: 0,
        }}
      >
        {!thumbnailFailed ? (
          <img
            src={thumbnailSrc}
            alt=""
            onError={() => setThumbnailFailed(true)}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'top',
              display: 'block',
            }}
          />
        ) : (
          <div
            style={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#bdbdbd',
              fontSize: 11,
              fontFamily: 'sans-serif',
            }}
          >
            No preview
          </div>
        )}
      </div>

      <div style={{ padding: '10px 12px', display: 'flex', flexDirection: 'column', gap: 5 }}>
        {/* Name row */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 6 }}>
          {/* Notes indicator dot */}
          {hasNotes && (
            <div
              style={{
                width: 6,
                height: 6,
                borderRadius: '50%',
                backgroundColor: '#1976d2',
                opacity: 0.6,
                flexShrink: 0,
              }}
            />
          )}

          <span style={{
            fontSize: 13,
            fontWeight: 600,
            color: '#1a1a1a',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
            flex: 1,
          }}>
            {screenName}
          </span>

          <div style={{ display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0 }}>
            {/* Open link */}
            <button
              onClick={handleOpen}
              className="nodrag"
              style={{
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                padding: '2px 4px',
                borderRadius: 4,
                color: '#1976d2',
                fontSize: 11,
                fontWeight: 500,
                opacity: 0.7,
                transition: 'opacity 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '1')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '0.7')}
            >
              Open prototype
            </button>
          </div>
        </div>

        {/* Purpose preview */}
        {data.purpose && (
          <p style={{
            margin: 0,
            fontSize: 11,
            color: '#777',
            lineHeight: 1.4,
            overflow: 'hidden',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
          }}>
            {data.purpose}
          </p>
        )}

        {/* Status badge */}
        <div style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          alignSelf: 'flex-start',
          padding: '2px 7px',
          borderRadius: 4,
          backgroundColor: statusCfg.bg,
          border: `1px solid ${statusCfg.border}`,
          fontSize: 11,
          fontWeight: 500,
          color: statusCfg.color,
        }}>
          <div style={{ width: 6, height: 6, borderRadius: '50%', backgroundColor: statusCfg.color, flexShrink: 0 }} />
          {statusCfg.label}
        </div>
      </div>
    </div>
  );
}
