'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import { useInspectorStore } from '@/stores/inspector';
import { useFlowContext } from './FlowContext';

export interface ScreenNodeData extends Record<string, unknown> {
  screenId: string;
  screenName: string;
  prototypeId: string;
  notes?: string;
}

export type ScreenNodeType = Node<ScreenNodeData, 'screenNode'>;

const HANDLE_STYLE: React.CSSProperties = {
  width: 10,
  height: 10,
  borderRadius: '50%',
  backgroundColor: 'var(--mui-palette-common-white)',
  border: '2px solid var(--mui-palette-primary-light)',
};

export function ScreenNode({ data, selected }: NodeProps<ScreenNodeType>) {
  const { screenId, screenName, prototypeId } = data;
  const router = useRouter();
  const setActiveScreen = useInspectorStore((s) => s.setActiveScreen);
  const { thumbnailVersions } = useFlowContext();

  const version = thumbnailVersions[screenId] ?? 0;
  const thumbnailSrc = `/api/preview/${prototypeId}/thumbnail?screen=${screenId}&t=${version}`;
  const [thumbnailFailed, setThumbnailFailed] = useState(false);

  useEffect(() => {
    setThumbnailFailed(false);
  }, [version]);

  const handleDoubleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setActiveScreen(screenId);
    router.push(`/prototype/${prototypeId}`);
  };

  return (
    <Box
      onDoubleClick={handleDoubleClick}
      sx={{
        width: 280,
        borderRadius: 1,
        bgcolor: 'common.white',
        '[data-mui-color-scheme="dark"] &': { bgcolor: 'background.default' },
        border: selected ? '2px solid' : '1px solid',
        borderColor: selected ? 'primary.main' : 'divider',
        boxShadow: selected ? 4 : 2,
        userSelect: 'none',
        cursor: 'default',
        transition: 'box-shadow 0.2s, border-color 0.2s',
        overflow: 'hidden',
      }}
    >
      <Handle id="top"    type="target" position={Position.Top}    style={{ ...HANDLE_STYLE, top: -5 }} />
      <Handle id="bottom" type="source" position={Position.Bottom} style={{ ...HANDLE_STYLE, bottom: -5 }} />
      <Handle id="right"  type="source" position={Position.Right}  style={{ ...HANDLE_STYLE, right: -5 }} />
      <Handle id="left"   type="target" position={Position.Left}   style={{ ...HANDLE_STYLE, left: -5 }} />

      {/* Thumbnail area */}
      <Box
        sx={{
          width: '100%',
          height: 168,
          overflow: 'hidden',
          flexShrink: 0,
        }}
      >
        {!thumbnailFailed ? (
          <Box
            component="img"
            src={thumbnailSrc}
            alt=""
            onError={() => setThumbnailFailed(true)}
            sx={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'top',
              display: 'block',
            }}
          />
        ) : (
          <Box
            sx={{
              width: '100%',
              height: '100%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'text.disabled',
              fontSize: 11,
            }}
          >
            No preview
          </Box>
        )}
      </Box>

      {/* Content */}
      <Box sx={{ px: 1.75, py: 1.5, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          <Typography
            variant="caption"
            sx={{
              fontWeight: 600,
              color: 'text.primary',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              fontSize: 13,
              flexGrow: 1,
            }}
          >
            {screenName}
          </Typography>
          <Button
            variant="text"
            color="secondary"
            size="small"
            onClick={(e) => {
              e.stopPropagation();
              setActiveScreen(screenId);
              router.push(`/prototype/${prototypeId}`);
            }}
            sx={{ textTransform: 'none', fontSize: 11, minWidth: 0, px: 1, py: 0.25, flexShrink: 0 }}
          >
            View
          </Button>
        </Box>

        {/* Notes preview */}
        {data.notes && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              lineHeight: 1.45,
              overflow: 'hidden',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
            }}
          >
            {data.notes}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
