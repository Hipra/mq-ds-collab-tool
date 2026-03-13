'use client';

import { Box, Card, Divider, IconButton, Typography } from '@mui/material';
import MqIcon from '@/components/MqIcon';
import { StatusDot } from '@/components/StatusDot';
import PrototypeSection from './PrototypeSection';
import type { ProjectWithPrototypes, ScreenInfo } from '@/types/project';

interface ProjectCardProps {
  project: ProjectWithPrototypes;
  onEdit: (project: ProjectWithPrototypes) => void;
  onThumbnailClick: (prototypeId: string, screen: ScreenInfo) => void;
}

export default function ProjectCard({ project, onEdit, onThumbnailClick }: ProjectCardProps) {
  const updatedDate = new Date(project.updatedAt).toLocaleDateString();

  return (
    <Card
      variant="outlined"
      sx={{
        borderRadius: 3,
        mb: 2.5,
        '& .edit-action': { opacity: 0, transition: 'opacity 150ms ease' },
        '&:hover .edit-action': { opacity: 1 },
      }}
    >
      {/* Main content */}
      <Box sx={{ px: 3, pt: 3, pb: 2 }}>
        {/* Title + edit */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
          <Typography variant="subtitle1" sx={{ flexGrow: 1, fontWeight: 600 }}>
            {project.name}
          </Typography>
          <IconButton className="edit-action" size="small" onClick={() => onEdit(project)}>
            <MqIcon name="edit" size={18} />
          </IconButton>
        </Box>

        {project.description && (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.75 }}>
            {project.description}
          </Typography>
        )}

        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
          Updated: {updatedDate}
        </Typography>

        {/* Prototype sections */}
        {project.prototypes.length > 0 &&
          project.prototypes.map((proto) => (
            <Box
              key={proto.id}
              sx={{
                mt: 2,
                bgcolor: 'action.hover',
                borderRadius: 2,
                px: 2,
                py: 1.5,
              }}
            >
              <PrototypeSection
                prototype={proto}
                onThumbnailClick={onThumbnailClick}
              />
            </Box>
          ))
        }
      </Box>

      {/* Footer */}
      <Divider />
      <Box sx={{ px: 3, py: 1.5, display: 'flex', alignItems: 'center', gap: 3 }}>
        <StatusDot label="UX design" status={project.designStatus} />
        <StatusDot label="Dev" status={project.devStatus} />
        <StatusDot label="UX copy" status={project.uxWriterStatus} />
      </Box>
    </Card>
  );
}
