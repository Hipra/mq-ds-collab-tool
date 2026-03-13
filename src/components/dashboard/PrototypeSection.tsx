'use client';

import { useState } from 'react';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Typography from '@mui/material/Typography';
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
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
  const [expanded, setExpanded] = useState(false);

  return (
    <Accordion
      expanded={expanded}
      onChange={(_e, isExpanded) => setExpanded(isExpanded)}
      disableGutters
      sx={{ mt: 1.5, '&::before': { display: 'none' } }}
    >
      <AccordionSummary
        expandIcon={<MqIcon name="chevron_down" size={16} />}
        sx={{
          '& .MuiAccordionSummary-content': { alignItems: 'center', gap: 1 },
        }}
      >
        <Typography variant="subtitle2" sx={{ flexGrow: 1 }}>
          {prototype.name}
        </Typography>
        <Button
          component={Link}
          href={`/prototype/${prototype.id}/flow`}
          size="small"
          variant="text"
          color="secondary"
          onClick={(e: React.MouseEvent) => e.stopPropagation()}
          sx={{ mr: 2 }}
        >
          View flow
        </Button>
      </AccordionSummary>
      <AccordionDetails>
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
      </AccordionDetails>
    </Accordion>
  );
}
