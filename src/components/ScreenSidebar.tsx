'use client';

import React, { useEffect, useState, useCallback } from 'react';
import Box from '@mui/material/Box';
import List from '@mui/material/List';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import Alert from '@mui/material/Alert';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';
import DragIndicatorIcon from '@mui/icons-material/DragIndicator';
import AddIcon from '@mui/icons-material/Add';
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
  arrayMove,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { useInspectorStore } from '@/stores/inspector';

interface ScreenSidebarProps {
  prototypeId: string;
}

interface Screen {
  id: string;
  name: string;
  file: string;
}

interface SortableScreenItemProps {
  screen: Screen;
  isActive: boolean;
  isEditing: boolean;
  editValue: string;
  onSelect: (id: string) => void;
  onDoubleClick: (id: string, name: string) => void;
  onEditChange: (value: string) => void;
  onEditCommit: () => void;
  onEditCancel: () => void;
}

function SortableScreenItem({
  screen,
  isActive,
  isEditing,
  editValue,
  onSelect,
  onDoubleClick,
  onEditChange,
  onEditCommit,
  onEditCancel,
}: SortableScreenItemProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: screen.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  return (
    <div ref={setNodeRef} style={style}>
      <ListItemButton
        selected={isActive}
        onClick={() => onSelect(screen.id)}
        onDoubleClick={() => onDoubleClick(screen.id, screen.name)}
        sx={{
          pr: 1,
          pl: 0.5,
          '&.Mui-selected': {
            bgcolor: 'action.selected',
          },
        }}
      >
        {/* Drag handle */}
        <Box
          {...attributes}
          {...listeners}
          sx={{
            display: 'flex',
            alignItems: 'center',
            cursor: 'grab',
            color: 'text.disabled',
            '&:active': { cursor: 'grabbing' },
            mr: 0.5,
            flexShrink: 0,
          }}
        >
          <DragIndicatorIcon sx={{ fontSize: 16 }} />
        </Box>

        {isEditing ? (
          <TextField
            value={editValue}
            onChange={(e) => onEditChange(e.target.value)}
            onBlur={onEditCommit}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                onEditCommit();
              }
              if (e.key === 'Escape') {
                e.preventDefault();
                onEditCancel();
              }
            }}
            size="small"
            variant="standard"
            autoFocus
            onClick={(e) => e.stopPropagation()}
            sx={{ flex: 1 }}
            inputProps={{ style: { fontSize: 13 } }}
          />
        ) : (
          <ListItemText
            primary={screen.name}
            primaryTypographyProps={{ fontSize: 13, noWrap: true }}
          />
        )}
      </ListItemButton>
    </div>
  );
}

/**
 * ScreenSidebar — collapsible left panel listing discovered prototype screens.
 *
 * Features:
 * - Fetches screen list from /api/preview/[id]/screens on mount
 * - Stores screens and active screen in Zustand inspector store
 * - Drag-to-reorder via dnd-kit (PointerSensor with distance constraint to avoid
 *   interfering with click-to-select and double-click-to-edit)
 * - Double-click inline name editing with persistence via PATCH /api/preview/[id]/screens
 * - Collapses to zero-width with a toggle button
 *
 * Design decisions:
 * - Local screen order state (not Zustand) since reorder is sidebar-local
 * - PATCH to screens route for both order and customNames persistence
 * - PointerSensor activationConstraint.distance = 8px prevents drag/click conflict
 */
export function ScreenSidebar({ prototypeId }: ScreenSidebarProps) {
  const [localScreens, setLocalScreens] = useState<Screen[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValue, setEditValue] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState('');
  const [createError, setCreateError] = useState('');
  const [creating, setCreating] = useState(false);

  const { sidebarOpen, setSidebarOpen, activeScreenId, setActiveScreen, setScreens } = useInspectorStore();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  // Fetch screens on mount
  useEffect(() => {
    const fetchScreens = async () => {
      try {
        const res = await fetch(`/api/preview/${prototypeId}/screens`);
        if (res.ok) {
          const data = (await res.json()) as Screen[];
          setLocalScreens(data);
          setScreens(data);
        }
      } catch {
        // Screen list is non-critical — fail silently
      }
    };
    fetchScreens();
  }, [prototypeId, setScreens]);

  // Persist order to metadata via PATCH
  const persistOrder = useCallback(
    async (orderedIds: string[]) => {
      try {
        await fetch(`/api/preview/${prototypeId}/screens`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ order: orderedIds }),
        });
      } catch {
        // Persist failure is non-fatal — order is correct in memory
      }
    },
    [prototypeId]
  );

  // Persist custom name to metadata via PATCH
  const persistCustomName = useCallback(
    async (id: string, name: string) => {
      try {
        await fetch(`/api/preview/${prototypeId}/screens`, {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ customNames: { [id]: name } }),
        });
      } catch {
        // Persist failure is non-fatal
      }
    },
    [prototypeId]
  );

  const handleDragEnd = useCallback(
    (event: DragEndEvent) => {
      const { active, over } = event;
      if (!over || active.id === over.id) return;

      const oldIndex = localScreens.findIndex((s) => s.id === active.id);
      const newIndex = localScreens.findIndex((s) => s.id === over.id);
      const reordered = arrayMove(localScreens, oldIndex, newIndex);
      setLocalScreens(reordered);
      setScreens(reordered);
      persistOrder(reordered.map((s) => s.id));
    },
    [localScreens, setScreens, persistOrder]
  );

  const handleDoubleClick = useCallback((id: string, name: string) => {
    setEditingId(id);
    setEditValue(name);
  }, []);

  const handleEditCommit = useCallback(() => {
    if (!editingId) return;
    const trimmed = editValue.trim();
    if (trimmed) {
      const updated = localScreens.map((s) =>
        s.id === editingId ? { ...s, name: trimmed } : s
      );
      setLocalScreens(updated);
      setScreens(updated);
      persistCustomName(editingId, trimmed);
    }
    setEditingId(null);
    setEditValue('');
  }, [editingId, editValue, localScreens, setScreens, persistCustomName]);

  const handleEditCancel = useCallback(() => {
    setEditingId(null);
    setEditValue('');
  }, []);

  const handleCreateScreen = async () => {
    const trimmed = newName.trim();
    if (!trimmed) return;
    setCreating(true);
    setCreateError('');
    try {
      const res = await fetch(`/api/preview/${prototypeId}/screens`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: trimmed }),
      });
      if (!res.ok) {
        const data = await res.json();
        setCreateError(data.error ?? 'Failed to create screen');
        return;
      }
      const newScreen = (await res.json()) as Screen;
      const updated = [...localScreens, newScreen];
      setLocalScreens(updated);
      setScreens(updated);
      setActiveScreen(newScreen.id);
      setCreateOpen(false);
      setNewName('');
    } catch {
      setCreateError('Network error');
    } finally {
      setCreating(false);
    }
  };

  const isOnlyIndex =
    localScreens.length === 1 && localScreens[0]?.id === 'index';

  return (
    <Box
      sx={{
        width: sidebarOpen ? 200 : 0,
        flexShrink: 0,
        overflow: 'hidden',
        borderRight: sidebarOpen ? 1 : 0,
        borderColor: 'divider',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.2s ease',
        position: 'relative',
      }}
    >
      {/* Sidebar header with toggle */}
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          px: 1,
          py: 0.5,
          borderBottom: 1,
          borderColor: 'divider',
          minHeight: 40,
        }}
      >
        <Typography variant="caption" sx={{ fontWeight: 600, letterSpacing: 0.5, textTransform: 'uppercase' }}>
          Screens
        </Typography>
        <IconButton size="small" onClick={() => setSidebarOpen(false)}>
          <ChevronLeftIcon sx={{ fontSize: 18 }} />
        </IconButton>
      </Box>

      {/* Screen list */}
      <Box sx={{ flex: 1, overflowY: 'auto' }}>
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={localScreens.map((s) => s.id)}
            strategy={verticalListSortingStrategy}
          >
            <List dense disablePadding>
              {localScreens.map((screen) => (
                <SortableScreenItem
                  key={screen.id}
                  screen={screen}
                  isActive={screen.id === activeScreenId}
                  isEditing={editingId === screen.id}
                  editValue={editValue}
                  onSelect={setActiveScreen}
                  onDoubleClick={handleDoubleClick}
                  onEditChange={setEditValue}
                  onEditCommit={handleEditCommit}
                  onEditCancel={handleEditCancel}
                />
              ))}
            </List>
          </SortableContext>
        </DndContext>

      </Box>

      {/* Add screen button */}
      <Box sx={{ p: 1, borderTop: 1, borderColor: 'divider' }}>
        <Button
          variant="outlined"
          color="secondary"
          size="small"
          startIcon={<AddIcon />}
          fullWidth
          onClick={() => { setCreateError(''); setNewName(''); setCreateOpen(true); }}
          sx={{ textTransform: 'none', fontSize: 12 }}
        >
          Add screen
        </Button>
      </Box>

      {/* Create screen dialog */}
      <Dialog
        open={createOpen}
        onClose={() => setCreateOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>New screen</DialogTitle>
        <DialogContent>
          {createError && <Alert severity="error" sx={{ mb: 2 }}>{createError}</Alert>}
          <TextField
            autoFocus
            fullWidth
            size="small"
            label="Screen name"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleCreateScreen(); }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCreateOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleCreateScreen}
            disabled={!newName.trim() || creating}
          >
            {creating ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
