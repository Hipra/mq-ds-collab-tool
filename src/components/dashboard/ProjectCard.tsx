'use client';

import { Box, Card, Divider, IconButton, Typography } from '@mui/material';
import MqIcon from '@/components/MqIcon';
import PrototypeSection from './PrototypeSection';
import type { ProjectWithPrototypes, ScreenInfo } from '@/types/project';

const STATUS_COLOR: Record<string, string> = {
  concept: 'text.disabled',
  not_started: 'text.disabled',
  in_progress: 'primary.main',
  review: 'secondary.main',
  qa: 'secondary.main',
  done: 'success.main',
  deployed: 'success.main',
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

function StatusIndicator({ label, status }: { label: string; status: string }) {
  const color = STATUS_COLOR[status] ?? 'text.disabled';
  const text = STATUS_LABEL[status] ?? status;

  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color, flexShrink: 0 }} />
      <Typography variant="caption" color="text.secondary">
        {label}: {text}
      </Typography>
    </Box>
  );
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
        <StatusIndicator label="UX design" status={project.designStatus} />
        <StatusIndicator label="Dev" status={project.devStatus} />
        <StatusIndicator label="UX copy" status={project.uxWriterStatus} />
      </Box>
    </Card>
  );
}
