'use client';

import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import MqIcon from '@/components/MqIcon';
import type { ProjectLink } from '@/types/project';

function getLinkIcon(link: ProjectLink): string {
  const url = link.url.toLowerCase();
  if (url.includes('figma.com')) return 'figma';
  if (url.includes('github.com')) return 'github';
  if (url.includes('jira') || url.includes('atlassian')) return 'bug';
  return 'open_external';
}

interface ProjectLinksProps {
  links: ProjectLink[];
  size?: number;
}

export function ProjectLinks({ links, size = 18 }: ProjectLinksProps) {
  if (links.length === 0) return null;

  return (
    <>
      {links.map((link, i) => (
        <Tooltip key={i} title={link.label}>
          <IconButton
            component="a"
            href={link.url}
            target="_blank"
            rel="noopener noreferrer"
            size="small"
          >
            <MqIcon name={getLinkIcon(link)} size={size} />
          </IconButton>
        </Tooltip>
      ))}
    </>
  );
}
