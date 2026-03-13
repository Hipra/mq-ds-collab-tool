'use client';

import { useState } from 'react';
import { Box, Button, Card, Divider, IconButton, TextField, Typography } from '@mui/material';
import MqIcon from '@/components/MqIcon';
import { StatusDot } from '@/components/StatusDot';
import PrototypeSection from './PrototypeSection';
import type { ProjectWithPrototypes, ProjectLink, ScreenInfo } from '@/types/project';

interface ProjectCardProps {
  project: ProjectWithPrototypes;
  onEdit: (project: ProjectWithPrototypes) => void;
  onThumbnailClick: (prototypeId: string, screen: ScreenInfo) => void;
  onLinksChange: (projectId: string, links: ProjectLink[]) => void;
}

function getLinkIcon(link: ProjectLink): string {
  const url = link.url.toLowerCase();
  if (url.includes('figma.com')) return 'figma';
  if (url.includes('github.com')) return 'github';
  if (url.includes('jira') || url.includes('atlassian')) return 'bug';
  return 'open_external';
}

function ReferencesPanel({
  links,
  onChange,
}: {
  links: ProjectLink[];
  onChange: (links: ProjectLink[]) => void;
}) {
  const [adding, setAdding] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newUrl, setNewUrl] = useState('');

  const handleAdd = () => {
    if (!newUrl.trim()) return;
    const label = newLabel.trim() || new URL(newUrl).hostname.replace('www.', '');
    onChange([...links, { label, url: newUrl.trim() }]);
    setNewLabel('');
    setNewUrl('');
    setAdding(false);
  };

  const handleRemove = (index: number) => {
    onChange(links.filter((_, i) => i !== index));
  };

  return (
    <Box>
      <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1.5 }}>
        References
      </Typography>

      {links.length === 0 && !adding && (
        <Typography variant="caption" color="text.disabled">
          No references yet
        </Typography>
      )}

      <Box component="ul" sx={{ m: 0, pl: 2, display: 'flex', flexDirection: 'column', gap: 0.75 }}>
        {links.map((link, i) => (
          <Box
            component="li"
            key={i}
            sx={{
              '& .remove-link': { visibility: 'hidden' },
              '&:hover .remove-link': { visibility: 'visible' },
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
              <Typography
                component="a"
                href={link.url}
                target="_blank"
                rel="noopener noreferrer"
                variant="body2"
                color="text.secondary"
                sx={{
                  textDecoration: 'none',
                  '&:hover': { textDecoration: 'underline' },
                  flexGrow: 1,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {link.label}
              </Typography>
              <IconButton className="remove-link" size="small" onClick={() => handleRemove(i)} sx={{ flexShrink: 0 }}>
                <MqIcon name="trash" size={16} />
              </IconButton>
            </Box>
          </Box>
        ))}
      </Box>

      {adding ? (
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1, mt: 1.5 }}>
          <TextField
            label="Label"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            size="small"
            placeholder="e.g. Figma"
            slotProps={{ input: { notched: false, color: 'secondary' } }}
          />
          <TextField
            label="URL"
            value={newUrl}
            onChange={(e) => setNewUrl(e.target.value)}
            size="small"
            autoFocus
            slotProps={{ input: { notched: false, color: 'secondary' } }}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAdd(); }}
          />
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button size="small" variant="contained" color="secondary" onClick={handleAdd} disabled={!newUrl.trim()}>
              Add
            </Button>
            <Button size="small" variant="text" color="secondary" onClick={() => { setAdding(false); setNewLabel(''); setNewUrl(''); }}>
              Cancel
            </Button>
          </Box>
        </Box>
      ) : (
        <Button
          size="small"
          variant="text"
          color="secondary"
          onClick={() => setAdding(true)}
          sx={{ mt: 1, alignSelf: 'flex-start' }}
        >
          + Add reference
        </Button>
      )}
    </Box>
  );
}

export default function ProjectCard({ project, onEdit, onThumbnailClick, onLinksChange }: ProjectCardProps) {
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
      <Box sx={{ display: 'flex' }}>
        {/* Left — 80% */}
        <Box sx={{ flex: '0 0 80%', px: 3, pt: 3, pb: 2 }}>
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

          {project.prototypes.length > 0 &&
            project.prototypes.map((proto) => (
              <PrototypeSection
                key={proto.id}
                prototype={proto}
                onThumbnailClick={onThumbnailClick}
              />
            ))
          }
        </Box>

        {/* Right — 20% */}
        <Box
          sx={{
            flex: '0 0 20%',
            px: 3,
            pt: 3,
            pb: 2,
            borderLeft: '1px solid',
            borderColor: 'divider',
          }}
        >
          <ReferencesPanel
            links={project.links ?? []}
            onChange={(links) => onLinksChange(project.id, links)}
          />
        </Box>
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
