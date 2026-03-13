'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Card from '@mui/material/Card';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import MqIcon from '@/components/MqIcon';
import {
  AppBar,
  Typography,
  TextField,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@memoq/memoq.web.design';
import { useThemeStore, type ThemeMode } from '@/stores/theme';

import ProjectCard from '@/components/dashboard/ProjectCard';
import ProjectDialog from '@/components/dashboard/ProjectDialog';
import ScreenshotModal from '@/components/dashboard/ScreenshotModal';
import type { ProjectWithPrototypes, ScreenInfo } from '@/types/project';

interface Prototype {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  hasShareToken: boolean;
}

interface Template {
  id: string;
  name: string;
  builtIn: boolean;
  createdAt?: string;
}

type ActiveTab = 'prototypes' | 'templates';

const STATUS_CONFIG: Record<string, { label: string; color: 'default' | 'warning' | 'success' }> = {
  draft: { label: 'Draft', color: 'default' },
  review: { label: 'Review', color: 'warning' },
  approved: { label: 'Approved', color: 'success' },
};

const MODE_CONFIG: Record<ThemeMode, { icon: React.ReactNode; label: string }> = {
  light: { icon: <MqIcon name="sun" size={20} />, label: 'Light mode' },
  dark: { icon: <MqIcon name="moon" size={20} />, label: 'Dark mode' },
  system: { icon: <MqIcon name="system_theme" size={20} />, label: 'System mode' },
};

function EmptyState({ icon, title, description }: { icon: React.ReactNode; title: string; description: string }) {
  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 12, gap: 1.5 }}>
      <Box sx={{ fontSize: 48, lineHeight: 1, display: 'flex', color: 'action.disabled' }}>{icon}</Box>
      <Typography variant="subtitle1" color="text.secondary" sx={{ fontWeight: 500 }}>
        {title}
      </Typography>
      <Typography variant="body2" color="text.disabled" sx={{ textAlign: 'center', maxWidth: 280 }}>
        {description}
      </Typography>
    </Box>
  );
}

export default function GalleryPage() {
  const router = useRouter();
  const { mode, cycleMode } = useThemeStore();

  const [activeTab, setActiveTab] = useState<ActiveTab>('prototypes');

  // Prototypes state
  const [prototypes, setPrototypes] = useState<Prototype[]>([]);
  const [loading, setLoading] = useState(true);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Prototype | null>(null);
  const [deleteError, setDeleteError] = useState('');
  const [deleting, setDeleting] = useState(false);
  const [cloneTarget, setCloneTarget] = useState<Prototype | null>(null);
  const [cloneName, setCloneName] = useState('');
  const [cloneError, setCloneError] = useState('');
  const [cloning, setCloning] = useState(false);

  // Templates state
  const [templates, setTemplates] = useState<Template[]>([]);
  const [templatesLoading, setTemplatesLoading] = useState(false);
  const [templatesFetched, setTemplatesFetched] = useState(false);
  const [deleteTemplateTarget, setDeleteTemplateTarget] = useState<Template | null>(null);
  const [deleteTemplateError, setDeleteTemplateError] = useState('');
  const [deletingTemplate, setDeletingTemplate] = useState(false);

  // "Add to prototype" dialog
  const [addToTemplate, setAddToTemplate] = useState<Template | null>(null);
  const [addToProtoId, setAddToProtoId] = useState<string>('');
  const [addToLoading, setAddToLoading] = useState(false);
  const [addToError, setAddToError] = useState('');

  // Projects state
  const [projects, setProjects] = useState<ProjectWithPrototypes[]>([]);

  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithPrototypes | null>(null);
  const [screenshotModal, setScreenshotModal] = useState<{ src: string; name: string } | null>(null);

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data = await res.json();
        setProjects(data);
      }
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetch('/api/prototypes')
      .then((res) => res.json())
      .then((data: Prototype[]) => { setPrototypes(data); setLoading(false); })
      .catch(() => setLoading(false));
    fetchProjects();
  }, []);

  useEffect(() => {
    if (activeTab === 'templates' && !templatesFetched) {
      setTemplatesLoading(true);
      fetch('/api/templates')
        .then((res) => res.json())
        .then((data: Template[]) => { setTemplates(data); setTemplatesLoading(false); setTemplatesFetched(true); })
        .catch(() => setTemplatesLoading(false));
    }
  }, [activeTab, templatesFetched]);

  const handleCreate = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCreating(true);
    setCreateError('');
    try {
      const res = await fetch('/api/prototypes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) { setCreateError((await res.json()).error ?? 'Failed to create prototype'); return; }
      const data = await res.json();
      setCreateOpen(false);
      router.push(`/prototype/${data.id}`);
    } catch { setCreateError('Network error'); }
    finally { setCreating(false); }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError('');
    try {
      const res = await fetch(`/api/prototypes/${deleteTarget.id}`, { method: 'DELETE' });
      if (!res.ok) { setDeleteError((await res.json()).error ?? 'Failed to delete prototype'); return; }
      setPrototypes((prev) => prev.filter((p) => p.id !== deleteTarget.id));
      setDeleteTarget(null);
    } catch { setDeleteError('Network error'); }
    finally { setDeleting(false); }
  };

  const handleClone = async () => {
    if (!cloneTarget) return;
    setCloning(true);
    setCloneError('');
    try {
      const res = await fetch(`/api/prototypes/${cloneTarget.id}/clone`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: cloneName.trim() }),
      });
      if (!res.ok) { setCloneError((await res.json()).error ?? 'Failed to clone prototype'); return; }
      const data = await res.json();
      setCloneTarget(null);
      router.push(`/prototype/${data.id}`);
    } catch { setCloneError('Network error'); }
    finally { setCloning(false); }
  };

  const handleDeleteTemplate = async () => {
    if (!deleteTemplateTarget) return;
    setDeletingTemplate(true);
    setDeleteTemplateError('');
    try {
      const res = await fetch(`/api/templates/${deleteTemplateTarget.id}`, { method: 'DELETE' });
      if (!res.ok) { setDeleteTemplateError((await res.json()).error ?? 'Failed to delete template'); return; }
      setTemplates((prev) => prev.filter((t) => t.id !== deleteTemplateTarget.id));
      setDeleteTemplateTarget(null);
    } catch { setDeleteTemplateError('Network error'); }
    finally { setDeletingTemplate(false); }
  };

  const handleAddToPrototype = async () => {
    if (!addToTemplate || !addToProtoId) return;
    setAddToLoading(true);
    setAddToError('');
    try {
      const res = await fetch(`/api/preview/${addToProtoId}/screens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: addToTemplate.name, templateId: addToTemplate.id }),
      });
      if (!res.ok) { setAddToError((await res.json()).error ?? 'Failed to add screen'); return; }
      setAddToTemplate(null);
      router.push(`/prototype/${addToProtoId}`);
    } catch { setAddToError('Network error'); }
    finally { setAddToLoading(false); }
  };

  const assignedPrototypeIds = new Set(projects.flatMap((p) => p.prototypeIds));
  const unassignedPrototypes = prototypes.filter((p) => !assignedPrototypeIds.has(p.id));




  const handleEditProject = (project: ProjectWithPrototypes) => {
    setEditingProject(project);
    setProjectDialogOpen(true);
  };

  const handleCreateProject = () => {
    setEditingProject(null);
    setProjectDialogOpen(true);
  };

  const handleProjectSaved = () => {
    fetchProjects();
    fetch('/api/prototypes')
      .then((res) => res.json())
      .then((data: Prototype[]) => setPrototypes(data))
      .catch(() => {});
  };

  const handleThumbnailClick = (prototypeId: string, screen: ScreenInfo) => {
    setScreenshotModal({
      src: `/api/preview/${prototypeId}/thumbnail?screen=${screen.id}`,
      name: screen.name,
    });
  };

  const modeConfig = MODE_CONFIG[mode] ?? MODE_CONFIG.system;

  const cardSx = {
    borderRadius: 2,
    p: 2,
    cursor: 'pointer',
    border: '1px solid rgba(0,0,0,0.07)',
    boxShadow: '0 1px 2px rgba(0,0,0,0.04)',
    transition: 'box-shadow 300ms cubic-bezier(0.4, 0, 0.2, 1)',
    '&:hover': { boxShadow: '0 4px 12px rgba(0,0,0,0.07), 0 1px 3px rgba(0,0,0,0.04)' },
    '& .card-actions': { opacity: 0, transition: 'opacity 150ms ease' },
    '&:hover .card-actions': { opacity: 1 },
    '[data-mui-color-scheme="dark"] &': {
      backgroundColor: '#222222',
      borderColor: 'rgba(255,255,255,0.08)',
    },
  } as const;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── AppBar ── */}
      <AppBar position="static" variant="dense" sx={{ '& .MuiToolbar-gutters': { px: 2.5 } }}>
          <Typography
            variant="subtitle2"
            component="div"
            sx={{ letterSpacing: '0.04em', color: 'inherit', userSelect: 'none' }}
          >
            mq collab
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Tooltip title={modeConfig.label}>
            <IconButton onClick={cycleMode} size="small" aria-label={modeConfig.label}>
              {modeConfig.icon}
            </IconButton>
          </Tooltip>
      </AppBar>

      {/* ── Content ── */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <Box sx={{ px: 3, py: 3 }}>

          {/* ── Tab bar ── */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <Tabs
              value={activeTab}
              onChange={(_e, val: ActiveTab) => setActiveTab(val)}
              sx={{ minHeight: 36, '& .MuiTab-root': { minHeight: 36, py: 0, textTransform: 'none' } }}
            >
              <Tab label="Prototypes" value="prototypes" />
              <Tab label="Templates" value="templates" />
            </Tabs>
            <Box sx={{ flex: 1 }} />
            {activeTab === 'prototypes' && (
              <Button
                variant="contained"
                size="small"
                startIcon={<MqIcon name="plus" size={16} />}
                onClick={handleCreateProject}
              >
                New Project
              </Button>
            )}
          </Box>

          {/* ── Prototypes tab ── */}
          {activeTab === 'prototypes' && (
            <>
              {loading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                  <CircularProgress />
                </Box>
              )}

              {!loading && (
                <>
                  {/* Project cards */}
                  {projects.map((project) => (
                    <ProjectCard
                      key={project.id}
                      project={project}
                      onEdit={handleEditProject}
                      onThumbnailClick={handleThumbnailClick}
                    />
                  ))}

                  {/* Unassigned section */}
                  {unassignedPrototypes.length > 0 && (
                    <>
                      {projects.length > 0 && (
                        <Typography variant="h6" sx={{ mt: 3, mb: 2 }}>Unassigned</Typography>
                      )}
                      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 2 }}>
                        {unassignedPrototypes.map((proto) => {
                          const config = STATUS_CONFIG[proto.status] ?? STATUS_CONFIG.draft;
                          return (
                            <Card
                              key={proto.id}
                              elevation={0}
                              onClick={() => router.push(`/prototype/${proto.id}`)}
                              sx={cardSx}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                                <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.4, flex: 1, wordBreak: 'break-word' }}>
                                  {proto.name}
                                </Typography>
                                <Box className="card-actions" sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
                                  <Tooltip title="Clone">
                                    <IconButton
                                      size="small"
                                      aria-label="Clone"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setCloneError('');
                                        setCloneName(`Copy of ${proto.name}`);
                                        setCloneTarget(proto);
                                      }}
                                    >
                                      <MqIcon name="copy_clone" size={16} />
                                    </IconButton>
                                  </Tooltip>
                                  <Tooltip title="Delete">
                                    <IconButton
                                      size="small"
                                      aria-label="Delete"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        setDeleteError('');
                                        setDeleteTarget(proto);
                                      }}
                                    >
                                      <MqIcon name="trash" size={16} />
                                    </IconButton>
                                  </Tooltip>
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                                <Chip label={config.label} color={config.color} size="small" />
                                <Typography variant="caption" color="text.disabled">
                                  {proto.createdAt ? new Date(proto.createdAt).toLocaleDateString() : '—'}
                                </Typography>
                              </Box>
                            </Card>
                          );
                        })}
                      </Box>
                    </>
                  )}

                  {projects.length === 0 && unassignedPrototypes.length === 0 && (
                    <EmptyState
                      icon={<MqIcon name="artboard" size={20} />}
                      title="No prototypes yet"
                      description="Create your first project to get started."
                    />
                  )}
                </>
              )}
            </>
          )}

          {/* ── Templates tab ── */}
          {activeTab === 'templates' && (
            <>
              {templatesLoading && (
                <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}>
                  <CircularProgress />
                </Box>
              )}

              {!templatesLoading && templates.length === 0 && (
                <EmptyState
                  icon={<MqIcon name="palette" size={20} />}
                  title="No templates yet"
                  description="Save a screen as a template from within a prototype."
                />
              )}

              {!templatesLoading && templates.length > 0 && (
                <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: 2 }}>
                  {templates.map((tmpl) => (
                    <Card
                      key={tmpl.id}
                      elevation={0}
                      onClick={() => router.push(`/template/${tmpl.id}`)}
                      sx={cardSx}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 1 }}>
                        <Typography variant="body2" sx={{ fontWeight: 600, lineHeight: 1.4, flex: 1, wordBreak: 'break-word' }}>
                          {tmpl.name}
                        </Typography>
                        <Box className="card-actions" sx={{ display: 'flex', gap: 0.25, flexShrink: 0 }}>
                          <Tooltip title="Add to prototype">
                            <IconButton
                              size="small"
                              aria-label="Add to prototype"
                              onClick={(e) => {
                                e.stopPropagation();
                                setAddToError('');
                                setAddToProtoId('');
                                setAddToTemplate(tmpl);
                              }}
                            >
                              <MqIcon name="list_numbered" size={16} />
                            </IconButton>
                          </Tooltip>
                          <Tooltip title={tmpl.builtIn ? 'Built-in templates cannot be deleted' : 'Delete'}>
                            <span>
                              <IconButton
                                size="small"
                                aria-label="Delete template"
                                disabled={tmpl.builtIn}
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setDeleteTemplateError('');
                                  setDeleteTemplateTarget(tmpl);
                                }}
                              >
                                <MqIcon name="trash" size={16} />
                              </IconButton>
                            </span>
                          </Tooltip>
                        </Box>
                      </Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mt: 2 }}>
                        {tmpl.builtIn
                          ? <Chip label="Built-in" size="small" variant="outlined" />
                          : <Box />}
                        <Typography variant="caption" color="text.disabled">
                          {tmpl.createdAt ? new Date(tmpl.createdAt).toLocaleDateString() : '—'}
                        </Typography>
                      </Box>
                    </Card>
                  ))}
                </Box>
              )}
            </>
          )}

        </Box>
      </Box>

      {/* ── New Prototype dialog ── */}
      <Dialog open={createOpen} onClose={() => setCreateOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>New Prototype</DialogTitle>
        <DialogContent>
          {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}
          <TextField
            autoFocus fullWidth label="Prototype name" value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreate(); }}
            slotProps={{ input: { notched: false, color: 'secondary' } }}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="secondary" onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreate} disabled={!newName.trim() || creating}>
            {creating ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Clone dialog ── */}
      <Dialog open={cloneTarget !== null} onClose={() => setCloneTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Clone prototype</DialogTitle>
        <DialogContent>
          {cloneError && <Alert severity="error" sx={{ mb: 2 }}>{cloneError}</Alert>}
          <TextField
            autoFocus fullWidth label="New name" value={cloneName}
            onChange={(e) => setCloneName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleClone(); }}
            slotProps={{ input: { notched: false, color: 'secondary' } }}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="secondary" onClick={() => setCloneTarget(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleClone} disabled={!cloneName.trim() || cloning}>
            {cloning ? 'Cloning…' : 'Clone'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete prototype dialog ── */}
      <Dialog open={deleteTarget !== null} onClose={() => setDeleteTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete prototype?</DialogTitle>
        <DialogContent>
          {deleteError && <Alert severity="error" sx={{ mb: 2 }}>{deleteError}</Alert>}
          <Typography>
            <strong>{deleteTarget?.name}</strong> will be permanently deleted. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="secondary" onClick={() => setDeleteTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete} disabled={deleting}>
            {deleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Delete template dialog ── */}
      <Dialog open={deleteTemplateTarget !== null} onClose={() => setDeleteTemplateTarget(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete template?</DialogTitle>
        <DialogContent>
          {deleteTemplateError && <Alert severity="error" sx={{ mb: 2 }}>{deleteTemplateError}</Alert>}
          <Typography>
            <strong>{deleteTemplateTarget?.name}</strong> will be permanently deleted. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="secondary" onClick={() => setDeleteTemplateTarget(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeleteTemplate} disabled={deletingTemplate}>
            {deletingTemplate ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Add to prototype dialog ── */}
      <Dialog open={addToTemplate !== null} onClose={() => setAddToTemplate(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Add &ldquo;{addToTemplate?.name}&rdquo; to prototype</DialogTitle>
        <DialogContent sx={{ p: 0 }}>
          {addToError && <Alert severity="error" sx={{ mx: 2, mt: 2 }}>{addToError}</Alert>}
          {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress size={24} />
            </Box>
          ) : prototypes.length === 0 ? (
            <Typography color="text.secondary" sx={{ px: 3, py: 3 }}>
              No prototypes yet. Create one first.
            </Typography>
          ) : (
            <List disablePadding>
              {prototypes.map((proto, idx) => (
                <React.Fragment key={proto.id}>
                  {idx > 0 && <Divider component="li" />}
                  <ListItemButton selected={addToProtoId === proto.id} onClick={() => setAddToProtoId(proto.id)}>
                    <ListItemText primary={proto.name} slotProps={{ primary: { variant: 'body2' } }} />
                  </ListItemButton>
                </React.Fragment>
              ))}
            </List>
          )}
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="secondary" onClick={() => setAddToTemplate(null)}>Cancel</Button>
          <Button variant="contained" onClick={handleAddToPrototype} disabled={!addToProtoId || addToLoading}>
            {addToLoading ? 'Adding…' : 'Add screen'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Project dialog ── */}
      <ProjectDialog
        open={projectDialogOpen}
        onClose={() => setProjectDialogOpen(false)}
        onSave={handleProjectSaved}
        editProject={editingProject}
      />

      {/* ── Screenshot modal ── */}
      <ScreenshotModal
        open={!!screenshotModal}
        onClose={() => setScreenshotModal(null)}
        src={screenshotModal?.src || ''}
        screenName={screenshotModal?.name || ''}
      />
    </Box>
  );
}
