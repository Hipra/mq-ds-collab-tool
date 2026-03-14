'use client';

import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Typography from '@mui/material/Typography';
import MqIcon from '@/components/MqIcon';
import Link from 'next/link';
import type { PrototypeInfo, ScreenInfo } from '@/types/project';

interface PrototypeSectionProps {
  prototype: PrototypeInfo;
  onThumbnailClick: (prototypeId: string, screen: ScreenInfo) => void;
  onAddScreen?: () => void;
  onDelete?: (prototypeId: string) => void;
}

function ScreenThumbnail({
  prototypeId,
  screen,
  onClick,
}: {
  prototypeId: string;
  screen: ScreenInfo;
  onClick: () => void;
}) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5 }}>
      <Box
        onClick={onClick}
        sx={{
          width: 200,
          height: 130,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: screen.hasThumbnail ? 'transparent' : 'action.hover',
          '&:hover': { boxShadow: 3 },
        }}
      >
        {screen.hasThumbnail ? (
          <Box
            component="img"
            src={`/api/preview/${prototypeId}/thumbnail?screen=${screen.id}`}
            alt={screen.name}
            sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <MqIcon name="image" size={24} color="disabled" />
        )}
      </Box>
      <Typography
        component={Link}
        href={`/prototype/${prototypeId}?screen=${screen.id}`}
        variant="caption"
        color="text.secondary"
        sx={{ textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}
      >
        {screen.name}
      </Typography>
    </Box>
  );
}

export default function PrototypeSection({ prototype, onThumbnailClick, onAddScreen, onDelete }: PrototypeSectionProps) {
  return (
    <Box sx={{ '&:not(:first-of-type)': { mt: 2.5 } }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5, minHeight: 32 }}>
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
          {prototype.name}
        </Typography>
        <Button
          component={Link}
          href={`/prototype/${prototype.id}/flow`}
          size="small"
          variant="outlined"
          color="secondary"
          startIcon={<MqIcon name="eye_opened" size={14} />}
        >
          View flow
        </Button>
        {onDelete && (
          <Tooltip title="Delete prototype">
            <IconButton size="small" onClick={() => onDelete(prototype.id)}>
              <MqIcon name="trash" size={16} />
            </IconButton>
          </Tooltip>
        )}
      </Box>
      <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1 }}>
        {prototype.screens.map((screen) => (
          <ScreenThumbnail
            key={screen.id}
            prototypeId={prototype.id}
            screen={screen}
            onClick={() => onThumbnailClick(prototype.id, screen)}
          />
        ))}
        {onAddScreen && (
          <Box
            onClick={onAddScreen}
            sx={{
              width: 200,
              height: 130,
              borderRadius: 1,
              border: '1px dashed',
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 0.5,
              cursor: 'pointer',
              flexShrink: 0,
              color: 'text.disabled',
              transition: 'border-color 150ms, color 150ms',
              '&:hover': { borderColor: 'text.secondary', color: 'text.secondary' },
            }}
          >
            <MqIcon name="plus" size={24} />
            <Typography variant="caption">Add screen</Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
