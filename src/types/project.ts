export type DesignStatus = 'concept' | 'in_progress' | 'review' | 'done';
export type DevStatus = 'not_started' | 'in_progress' | 'qa' | 'deployed';
export type UxWriterStatus = 'not_started' | 'in_progress' | 'review' | 'done';

export interface ProjectLink {
  label: string;
  url: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  assignee: string;
  designStatus: DesignStatus;
  devStatus: DevStatus;
  uxWriterStatus: UxWriterStatus;
  prototypeIds: string[];
  links?: ProjectLink[];
  updatedAt: string;
}

export interface ScreenInfo {
  id: string;
  name: string;
  hasThumbnail: boolean;
}

export interface PrototypeInfo {
  id: string;
  name: string;
  screens: ScreenInfo[];
}

export interface ProjectWithPrototypes extends Project {
  prototypes: PrototypeInfo[];
}
