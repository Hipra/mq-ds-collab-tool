import { useState, useEffect } from 'react';
import type { ProjectLink } from '@/types/project';

export function useProjectLinks(prototypeId: string): ProjectLink[] {
  const [links, setLinks] = useState<ProjectLink[]>([]);

  useEffect(() => {
    fetch(`/api/projects/by-prototype/${prototypeId}`)
      .then((res) => (res.ok ? res.json() : { links: [] }))
      .then((data) => setLinks(data.links ?? []))
      .catch(() => {});
  }, [prototypeId]);

  return links;
}
