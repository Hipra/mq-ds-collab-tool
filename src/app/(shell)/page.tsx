'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Box from '@mui/material/Box';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
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
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider,
} from '@memoq/memoq.web.design';
import { useThemeStore, type ThemeMode } from '@/stores/theme';

import { Logo } from '@/components/Logo';
import ProjectDetail from '@/components/dashboard/ProjectDetail';
import ProjectDialog from '@/components/dashboard/ProjectDialog';
import ScreenshotModal from '@/components/dashboard/ScreenshotModal';
import type { ProjectWithPrototypes, ProjectLink, ScreenInfo } from '@/types/project';

interface Template {
  id: string;
  name: string;
  builtIn: boolean;
  createdAt?: string;
  hasThumbnail?: boolean;
}

type ActiveTab = 'prototypes' | 'templates';

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

  // Projects state
  const [projects, setProjects] = useState<ProjectWithPrototypes[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null);

  const [projectDialogOpen, setProjectDialogOpen] = useState(false);
  const [editingProject, setEditingProject] = useState<ProjectWithPrototypes | null>(null);
  const [screenshotModal, setScreenshotModal] = useState<{ src: string; name: string } | null>(null);

  // Add prototype dialog
  const [addProtoOpen, setAddProtoOpen] = useState(false);
  const [addProtoProjectId, setAddProtoProjectId] = useState('');
  const [addProtoName, setAddProtoName] = useState('');
  const [addProtoError, setAddProtoError] = useState('');
  const [addProtoLoading, setAddProtoLoading] = useState(false);

  // Add screen dialog
  const [addScreenOpen, setAddScreenOpen] = useState(false);
  const [addScreenProtoId, setAddScreenProtoId] = useState('');
  const [addScreenName, setAddScreenName] = useState('');
  const [addScreenError, setAddScreenError] = useState('');
  const [addScreenLoading, setAddScreenLoading] = useState(false);

  // Delete prototype dialog
  const [deleteProtoId, setDeleteProtoId] = useState<string | null>(null);
  const [deleteProtoError, setDeleteProtoError] = useState('');
  const [deletingProto, setDeletingProto] = useState(false);

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

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      if (res.ok) {
        const data: ProjectWithPrototypes[] = await res.json();
        setProjects(data);
        // Auto-select first project if none selected or selected no longer exists
        if (data.length > 0) {
          setSelectedProjectId((prev) => {
            if (prev && data.some((p) => p.id === prev)) return prev;
            return data[0].id;
          });
        } else {
          setSelectedProjectId(null);
        }
      }
    } catch { /* silent */ }
  };

  useEffect(() => {
    fetchProjects().then(() => setLoading(false));
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
  };

  const handleLinksChange = async (projectId: string, links: ProjectLink[]) => {
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, links } : p)));
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ links }),
      });
    } catch { /* silent */ }
  };

  const handleStatusChange = async (projectId: string, field: string, value: string) => {
    setProjects((prev) => prev.map((p) => (p.id === projectId ? { ...p, [field]: value } : p)));
    try {
      await fetch(`/api/projects/${projectId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ [field]: value }),
      });
    } catch { /* silent */ }
  };

  const handleThumbnailClick = (prototypeId: string, screen: ScreenInfo) => {
    setScreenshotModal({
      src: `/api/preview/${prototypeId}/thumbnail?screen=${screen.id}`,
      name: screen.name,
    });
  };

  const handleAddPrototype = (projectId: string) => {
    setAddProtoProjectId(projectId);
    setAddProtoName('');
    setAddProtoError('');
    setAddProtoOpen(true);
  };

  const handleCreatePrototype = async () => {
    const trimmed = addProtoName.trim();
    if (!trimmed) return;
    setAddProtoLoading(true);
    setAddProtoError('');
    try {
      // 1. Create prototype
      const res = await fetch('/api/prototypes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAddProtoError(data.error || 'Failed to create prototype');
        return;
      }
      const proto = await res.json();

      // 2. Add prototype to project
      const project = projects.find((p) => p.id === addProtoProjectId);
      if (project) {
        const prototypeIds = [...project.prototypeIds, proto.id];
        await fetch(`/api/projects/${addProtoProjectId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prototypeIds }),
        });
      }

      setAddProtoOpen(false);
      fetchProjects();
    } catch {
      setAddProtoError('Network error');
    } finally {
      setAddProtoLoading(false);
    }
  };

  const handleAddScreen = (prototypeId: string) => {
    setAddScreenProtoId(prototypeId);
    setAddScreenName('');
    setAddScreenError('');
    setAddScreenOpen(true);
  };

  const handleCreateScreen = async () => {
    const trimmed = addScreenName.trim();
    if (!trimmed) return;
    setAddScreenLoading(true);
    setAddScreenError('');
    try {
      const res = await fetch(`/api/preview/${addScreenProtoId}/screens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setAddScreenError(data.error || 'Failed to create screen');
        return;
      }

      setAddScreenOpen(false);
      fetchProjects();
    } catch {
      setAddScreenError('Network error');
    } finally {
      setAddScreenLoading(false);
    }
  };

  const handleDeletePrototype = async () => {
    if (!deleteProtoId) return;
    setDeletingProto(true);
    setDeleteProtoError('');
    try {
      const res = await fetch(`/api/prototypes/${deleteProtoId}`, { method: 'DELETE' });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        setDeleteProtoError(data.error ?? 'Failed to delete prototype');
        return;
      }
      setDeleteProtoId(null);
      fetchProjects();
    } catch {
      setDeleteProtoError('Network error');
    } finally {
      setDeletingProto(false);
    }
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

  const selectedProject = projects.find((p) => p.id === selectedProjectId) ?? null;

  const modeConfig = MODE_CONFIG[mode] ?? MODE_CONFIG.system;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* ── AppBar ── */}
      <AppBar position="static" variant="dense" sx={{ '& .MuiToolbar-gutters': { px: 2.5 } }}>
          <Logo height={20} />
          <Box sx={{ flex: 1 }} />
          <Tabs
            value={activeTab}
            onChange={(_e, val: ActiveTab) => setActiveTab(val)}
            sx={{
              minHeight: 40,
              '& .MuiTab-root': { minHeight: 40, py: 0, textTransform: 'none' },
            }}
          >
            <Tab label="Projects" value="prototypes" />
            <Tab label="Templates" value="templates" />
          </Tabs>
          <Box sx={{ flex: 1 }} />
          <Tooltip title={modeConfig.label}>
            <IconButton onClick={cycleMode} size="small" aria-label={modeConfig.label}>
              {modeConfig.icon}
            </IconButton>
          </Tooltip>
      </AppBar>

      {/* ── Content ── */}
      <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>

        {/* ── Prototypes tab — master-detail ── */}
        {activeTab === 'prototypes' && (
          <Box sx={{ flex: 1, overflow: 'hidden', display: 'flex' }}>
            {loading ? (
              <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', flex: 1 }}>
                <CircularProgress />
              </Box>
            ) : projects.length === 0 ? (
              <Box sx={{ flex: 1 }}>
                <EmptyState
                  icon={<MqIcon name="artboard" size={20} />}
                  title="No projects yet"
                  description="Create your first project to get started."
                />
              </Box>
            ) : (
              <>
                {/* Left — project list */}
                <Box
                  sx={{
                    width: 260,
                    flexShrink: 0,
                    borderRight: '1px solid',
                    borderColor: 'divider',
                    display: 'flex',
                    flexDirection: 'column',
                  }}
                >
                  <List disablePadding sx={{ flex: 1, overflow: 'auto' }}>
                    {projects.map((project) => (
                      <ListItemButton
                        key={project.id}
                        selected={project.id === selectedProjectId}
                        onClick={() => setSelectedProjectId(project.id)}
                        sx={{ px: 3, py: 1.5 }}
                      >
                        <ListItemText
                          primary={project.name}
                          slotProps={{ primary: { variant: 'body2', fontWeight: project.id === selectedProjectId ? 600 : 400 } }}
                        />
                      </ListItemButton>
                    ))}
                  </List>
                  <Box sx={{ p: 2 }}>
                    <Button
                      variant="contained"
                      fullWidth
                      startIcon={<MqIcon name="plus" size={16} />}
                      onClick={handleCreateProject}
                    >
                      New project
                    </Button>
                  </Box>
                </Box>

                {/* Right — detail panel */}
                <Box sx={{ flex: 1, overflow: 'auto' }}>
                  {selectedProject ? (
                    <ProjectDetail
                      project={selectedProject}
                      onEdit={handleEditProject}
                      onThumbnailClick={handleThumbnailClick}
                      onLinksChange={handleLinksChange}
                      onStatusChange={handleStatusChange}
                      onAddPrototype={handleAddPrototype}
                      onAddScreen={handleAddScreen}
                      onDeletePrototype={(protoId) => { setDeleteProtoError(''); setDeleteProtoId(protoId); }}
                    />
                  ) : (
                    <EmptyState
                      icon={<MqIcon name="artboard" size={20} />}
                      title="Select a project"
                      description="Choose a project from the list to see its details."
                    />
                  )}
                </Box>
              </>
            )}
          </Box>
        )}

        {/* ── Templates tab ── */}
        {activeTab === 'templates' && (
          <Box sx={{ flex: 1, overflow: 'auto', px: 3, pt: 3, pb: 3 }}>
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
              <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', flexWrap: 'wrap', pb: 1 }}>
                {templates.map((tmpl) => (
                  <Box
                    key={tmpl.id}
                    sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0.5, position: 'relative' }}
                  >
                    <Box
                      onClick={() => router.push(`/template/${tmpl.id}`)}
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
                        bgcolor: tmpl.hasThumbnail ? 'transparent' : 'action.hover',
                        position: 'relative',
                        '&:hover': { boxShadow: 3 },
                        '&:hover .card-actions': { opacity: 1 },
                      }}
                    >
                      {tmpl.hasThumbnail ? (
                        <Box
                          component="img"
                          src={`/api/preview/template/${tmpl.id}/thumbnail`}
                          alt={tmpl.name}
                          sx={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        />
                      ) : (
                        <MqIcon name="image" size={24} color="disabled" />
                      )}
                      <Box
                        className="card-actions"
                        sx={{
                          position: 'absolute',
                          top: 4,
                          right: 4,
                          display: 'flex',
                          gap: 0.25,
                          opacity: 0,
                          transition: 'opacity 150ms ease',
                          bgcolor: 'background.paper',
                          borderRadius: 1,
                        }}
                      >
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
                    <Typography
                      variant="caption"
                      color="text.secondary"
                      onClick={() => router.push(`/template/${tmpl.id}`)}
                      sx={{ cursor: 'pointer', textAlign: 'center', maxWidth: 200, '&:hover': { textDecoration: 'underline' } }}
                    >
                      {tmpl.name}
                    </Typography>
                  </Box>
                ))}
              </Box>
            )}
          </Box>
        )}
      </Box>

      {/* ── Delete prototype dialog ── */}
      <Dialog open={deleteProtoId !== null} onClose={() => setDeleteProtoId(null)} maxWidth="xs" fullWidth>
        <DialogTitle>Delete prototype?</DialogTitle>
        <DialogContent>
          {deleteProtoError && <Alert severity="error" sx={{ mb: 2 }}>{deleteProtoError}</Alert>}
          <Typography>
            This prototype and all its screens will be permanently deleted. This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="secondary" onClick={() => setDeleteProtoId(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDeletePrototype} disabled={deletingProto}>
            {deletingProto ? 'Deleting…' : 'Delete'}
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
          ) : projects.length === 0 ? (
            <Typography color="text.secondary" sx={{ px: 3, py: 3 }}>
              No projects yet. Create one first.
            </Typography>
          ) : (
            <List disablePadding>
              {projects.flatMap((p) => p.prototypes).map((proto, idx, arr) => (
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

      {/* ── Add prototype dialog ── */}
      <Dialog open={addProtoOpen} onClose={() => setAddProtoOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>New prototype</DialogTitle>
        <DialogContent>
          {addProtoError && <Alert severity="error" sx={{ mb: 2 }}>{addProtoError}</Alert>}
          <TextField
            autoFocus
            fullWidth
            label="Prototype name"
            value={addProtoName}
            onChange={(e) => setAddProtoName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreatePrototype(); }}
            slotProps={{ input: { notched: false, color: 'secondary' } }}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="secondary" onClick={() => setAddProtoOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreatePrototype} disabled={!addProtoName.trim() || addProtoLoading}>
            {addProtoLoading ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Add screen dialog ── */}
      <Dialog open={addScreenOpen} onClose={() => setAddScreenOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>New screen</DialogTitle>
        <DialogContent>
          {addScreenError && <Alert severity="error" sx={{ mb: 2 }}>{addScreenError}</Alert>}
          <TextField
            autoFocus
            fullWidth
            label="Screen name"
            value={addScreenName}
            onChange={(e) => setAddScreenName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateScreen(); }}
            slotProps={{ input: { notched: false, color: 'secondary' } }}
          />
        </DialogContent>
        <DialogActions>
          <Button variant="text" color="secondary" onClick={() => setAddScreenOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateScreen} disabled={!addScreenName.trim() || addScreenLoading}>
            {addScreenLoading ? 'Creating…' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* ── Project dialog ── */}
      <ProjectDialog
        open={projectDialogOpen}
        onClose={() => setProjectDialogOpen(false)}
        onSave={handleProjectSaved}
        onDelete={(id) => {
          setProjects((prev) => prev.filter((p) => p.id !== id));
          setSelectedProjectId((prev) => (prev === id ? null : prev));
        }}
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
