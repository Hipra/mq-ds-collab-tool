'use client';

import { useCallback, useRef, useState } from 'react';
import { Box, Divider, IconButton, Tooltip, Typography } from '@mui/material';
import { Button } from '@memoq/memoq.web.design';
import MqIcon from '@/components/MqIcon';
import { StatusDot } from '@/components/StatusDot';
import PrototypeSection from './PrototypeSection';
import ReferencesPanel from './ReferencesPanel';
import type { ProjectWithPrototypes, ProjectLink, ScreenInfo, DesignStatus, DevStatus, UxWriterStatus } from '@/types/project';

const DESIGN_OPTIONS: DesignStatus[] = ['in_progress', 'review', 'done'];
const DEV_OPTIONS: DevStatus[] = ['not_started', 'in_progress', 'qa', 'deployed'];
const COPY_OPTIONS: UxWriterStatus[] = ['not_started', 'in_progress', 'review', 'done'];

interface ProjectDetailProps {
  project: ProjectWithPrototypes;
  onEdit: (project: ProjectWithPrototypes) => void;
  onThumbnailClick: (prototypeId: string, screen: ScreenInfo) => void;
  onLinksChange: (projectId: string, links: ProjectLink[]) => void;
  onStatusChange: (projectId: string, field: string, value: string) => void;
  onAddPrototype: (projectId: string) => void;
  onAddScreen: (prototypeId: string) => void;
  onDeletePrototype: (prototypeId: string) => void;
}

export default function ProjectDetail({
  project, onEdit, onThumbnailClick, onLinksChange, onStatusChange, onAddPrototype, onAddScreen, onDeletePrototype,
}: ProjectDetailProps) {
  const updatedDate = new Date(project.updatedAt).toLocaleDateString();
  const [triggerAddRef, setTriggerAddRef] = useState(false);
  const refsPanelRef = useRef<HTMLDivElement>(null);

  const handleAddingDone = useCallback(() => {
    setTriggerAddRef(false);
  }, []);

  return (
    <Box sx={{ height: '100%', overflow: 'auto' }}>
      {/* Section: Project info */}
      <Box sx={{ px: 3, py: 2.5 }}>
        <Box
          sx={{
            display: 'flex',
            alignItems: 'flex-start',
            gap: 1,
            '& .edit-btn': { visibility: 'hidden' },
            '&:hover .edit-btn': { visibility: 'visible' },
          }}
        >
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {project.name}
          </Typography>
          <Tooltip title="Edit project">
            <IconButton className="edit-btn" size="small" onClick={() => onEdit(project)} aria-label="Edit project" sx={{ ml: -0.5 }}>
              <MqIcon name="edit" size={18} />
            </IconButton>
          </Tooltip>
          <Box sx={{ flex: 1 }} />
          <Button
            variant="outlined"
            color="secondary"
            size="small"
            startIcon={<MqIcon name="plus" size={14} />}
            onClick={() => onAddPrototype(project.id)}
          >
            Add new prototype
          </Button>
        </Box>


        {project.description && (
          <Typography variant="body1" color="text.secondary" sx={{ mt: 0.75 }}>
            {project.description}
          </Typography>
        )}

        <Typography variant="caption" color="text.disabled" sx={{ mt: 0.5, display: 'block' }}>
          Updated: {updatedDate}
        </Typography>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2.5 }}>
          <StatusDot label="Design" status={project.designStatus} options={DESIGN_OPTIONS} onChange={(v) => onStatusChange(project.id, 'designStatus', v)} />
          <StatusDot label="Copy" status={project.uxWriterStatus} options={COPY_OPTIONS} onChange={(v) => onStatusChange(project.id, 'uxWriterStatus', v)} />
        </Box>
      </Box>

      <Divider />

      {/* Section: Prototypes */}
      <Box sx={{ px: 3, py: 2.5 }}>
        {project.prototypes.length > 0 ? (
          project.prototypes.map((proto) => (
            <PrototypeSection
              key={proto.id}
              prototype={proto}
              onThumbnailClick={onThumbnailClick}
              onAddScreen={() => onAddScreen(proto.id)}
              onDelete={onDeletePrototype}
            />
          ))
        ) : (
          <Typography variant="body2" color="text.disabled">
            No prototypes yet
          </Typography>
        )}
      </Box>

      <Divider />

      {/* Section: References */}
      <Box sx={{ px: 3, py: 2.5 }} ref={refsPanelRef}>
        <ReferencesPanel
          links={project.links ?? []}
          onChange={(links) => onLinksChange(project.id, links)}
          startAdding={triggerAddRef}
          onAddingDone={handleAddingDone}
        />
      </Box>
    </Box>
  );
}
