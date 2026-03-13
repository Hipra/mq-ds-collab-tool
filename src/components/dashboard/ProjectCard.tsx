'use client';

import { Box, Card, CardContent, Chip, IconButton, Typography } from '@mui/material';
import MqIcon from '@/components/MqIcon';
import PrototypeSection from './PrototypeSection';
import type { ProjectWithPrototypes, ScreenInfo } from '@/types/project';

const STATUS_COLOR: Record<string, 'default' | 'primary' | 'secondary' | 'success'> = {
  concept: 'default',
  not_started: 'default',
  in_progress: 'primary',
  review: 'secondary',
  qa: 'secondary',
  done: 'success',
  deployed: 'success',
};

const STATUS_LABEL: Record<string, string> = {
  concept: 'Concept',
  in_progress: 'In Progress',
  review: 'Review',
  done: 'Done',
  not_started: 'Not Started',
  qa: 'QA',
  deployed: 'Deployed',
};

interface ProjectCardProps {
  project: ProjectWithPrototypes;
  onEdit: (project: ProjectWithPrototypes) => void;
  onThumbnailClick: (prototypeId: string, screen: ScreenInfo) => void;
}

export default function ProjectCard({ project, onEdit, onThumbnailClick }: ProjectCardProps) {
  const updatedDate = new Date(project.updatedAt).toLocaleDateString();

  return (
    <Card variant="outlined" sx={{ borderRadius: 2, mb: 2 }}>
      <CardContent>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            {project.name}
          </Typography>
          <Chip
            size="small"
            label={`Design: ${STATUS_LABEL[project.designStatus]}`}
            color={STATUS_COLOR[project.designStatus]}
          />
          <Chip
            size="small"
            label={`Dev: ${STATUS_LABEL[project.devStatus]}`}
            color={STATUS_COLOR[project.devStatus]}
          />
          <Chip
            size="small"
            label={`UX: ${STATUS_LABEL[project.uxWriterStatus]}`}
            color={STATUS_COLOR[project.uxWriterStatus]}
          />
          <IconButton size="small" onClick={() => onEdit(project)}>
            <MqIcon name="edit" size={18} />
          </IconButton>
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 1 }}>
          {project.assignee && (
            <Typography variant="caption" color="text.secondary">
              {project.assignee}
            </Typography>
          )}
          <Typography variant="caption" color="text.secondary">
            Updated: {updatedDate}
          </Typography>
        </Box>

        {project.description && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
            {project.description}
          </Typography>
        )}

        {project.prototypes.map((proto) => (
          <PrototypeSection
            key={proto.id}
            prototype={proto}
            onThumbnailClick={onThumbnailClick}
          />
        ))}
      </CardContent>
    </Card>
  );
}
