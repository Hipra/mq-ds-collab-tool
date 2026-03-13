'use client';

import { Box, Button, Typography } from '@mui/material';
import MqIcon from '@/components/MqIcon';
import Link from 'next/link';
import type { PrototypeInfo, ScreenInfo } from '@/types/project';

interface PrototypeSectionProps {
  prototype: PrototypeInfo;
  onThumbnailClick: (prototypeId: string, screen: ScreenInfo) => void;
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
          width: 120,
          height: 80,
          borderRadius: 1,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: screen.hasThumbnail ? 'transparent' : 'action.hover',
          '&:hover': { boxShadow: '0 2px 8px rgba(0,0,0,0.1)' },
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

export default function PrototypeSection({ prototype, onThumbnailClick }: PrototypeSectionProps) {
  return (
    <Box sx={{ mt: 2 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
        <Typography variant="body2" sx={{ fontWeight: 600 }}>
          {prototype.name}
        </Typography>
        <Button
          component={Link}
          href={`/prototype/${prototype.id}`}
          size="small"
          variant="text"
          startIcon={<MqIcon name="open-in-new" size={14} />}
        >
          Prototype
        </Button>
        <Button
          component={Link}
          href={`/prototype/${prototype.id}/flow`}
          size="small"
          variant="text"
          startIcon={<MqIcon name="workflow" size={14} />}
        >
          Flow
        </Button>
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
      </Box>
    </Box>
  );
}
