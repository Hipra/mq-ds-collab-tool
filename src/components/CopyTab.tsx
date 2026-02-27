'use client';

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import Tooltip from '@mui/material/Tooltip';
import Divider from '@mui/material/Divider';
import Alert from '@mui/material/Alert';
import List from '@mui/material/List';
import ListItemText from '@mui/material/ListItemText';
import ListItem from '@mui/material/ListItem';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import RestoreIcon from '@mui/icons-material/Restore';
import HistoryIcon from '@mui/icons-material/History';
import DownloadIcon from '@mui/icons-material/Download';
import UploadIcon from '@mui/icons-material/Upload';
import { useCopyStore } from '@/stores/copy';
import { useInspectorStore } from '@/stores/inspector';
import type { CopyEntryWithHistory } from '@/stores/copy';

interface CopyTabProps {
  prototypeId: string;
}

/** Format a timestamp as relative time (e.g., "2 min ago", "just now") */
function formatRelativeTime(timestamp: string): string {
  const diff = Date.now() - new Date(timestamp).getTime();
  const seconds = Math.floor(diff / 1000);
  if (seconds < 60) return 'just now';
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  return `${days}d ago`;
}

/** Post a message to the preview iframe by id */
function postToPreview(message: object) {
  const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement | null;
  iframe?.contentWindow?.postMessage(message, '*');
}

/** Build the full override map from all modified entries */
function buildOverrideMap(entries: CopyEntryWithHistory[]): Record<string, Record<string, string>> {
  const overrides: Record<string, Record<string, string>> = {};
  for (const e of entries) {
    if (e.currentValue !== e.sourceValue) {
      if (!overrides[e.inspectorId]) overrides[e.inspectorId] = {};
      overrides[e.inspectorId][e.propName] = e.currentValue;
    }
  }
  return overrides;
}

/** Category label mapping */
const CATEGORY_LABELS: Record<string, string> = {
  visible: 'Visible Text',
  placeholder: 'Placeholder',
  accessibility: 'Accessibility',
};

/** Debounce a function */
function useDebounce<T extends (...args: Parameters<T>) => void>(fn: T, delay: number): T {
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  return useCallback(
    (...args: Parameters<T>) => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      timeoutRef.current = setTimeout(() => fn(...args), delay);
    },
    [fn, delay]
  ) as T;
}

/**
 * CopyTab — full copy editing UI for the Inspector panel.
 *
 * Features:
 * - Load text entries from /api/preview/[id]/copy
 * - Group entries by component, sub-group by category
 * - Inline editing with 500ms debounced PATCH to API
 * - Live preview via SET_TEXT_OVERRIDES postMessage
 * - Two-way visual linking: preview click -> scroll to entry, entry focus -> highlight in preview
 * - Export/import as JSON
 * - Conflict resolution UI
 * - Edit history per entry
 */
export function CopyTab({ prototypeId }: CopyTabProps) {
  const {
    entries,
    conflicts,
    summary,
    searchQuery,
    collapsedGroups,
    highlightedKey,
    loading,
    setEntries,
    updateEntry,
    resetEntry,
    setSearchQuery,
    toggleGroup,
    setHighlightedKey,
    setLoading,
    resolveConflict,
  } = useCopyStore();

  const { activeScreenId } = useInspectorStore();
  const entryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedHistory, setExpandedHistory] = React.useState<Set<string>>(new Set());

  // Fetch copy data on mount and when screen changes
  const fetchCopyData = useCallback(async (screenId: string) => {
    setLoading(true);
    try {
      const screen = screenId !== 'index' ? `?screen=${screenId}` : '';
      const res = await fetch(`/api/preview/${prototypeId}/copy${screen}`);
      if (res.ok) {
        const data = await res.json();
        // Build edits map from API response
        const editsMap: Record<string, Array<{ value: string; timestamp: string }>> = {};
        if (data.editsMap) {
          Object.assign(editsMap, data.editsMap);
        }
        setEntries(data.entries ?? [], data.conflicts ?? [], data.summary ?? { total: 0, modified: 0 }, editsMap);

        // If any entries are already modified, send overrides to iframe
        const modifiedEntries: CopyEntryWithHistory[] = (data.entries ?? []).filter(
          (e: CopyEntryWithHistory) => e.currentValue !== e.sourceValue
        );
        if (modifiedEntries.length > 0) {
          const overrides = buildOverrideMap(data.entries ?? []);
          postToPreview({ type: 'SET_TEXT_OVERRIDES', overrides });
        }
      }
    } catch {
      // Non-critical — show empty state if fetch fails
      setLoading(false);
    }
  }, [prototypeId, setEntries, setLoading]);

  useEffect(() => {
    fetchCopyData(activeScreenId);
  }, [activeScreenId, fetchCopyData]);

  // Scroll to highlighted entry when it changes
  useEffect(() => {
    if (highlightedKey && entryRefs.current[highlightedKey]) {
      entryRefs.current[highlightedKey]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedKey]);

  // Debounced PATCH to API
  const patchEntry = useDebounce(
    useCallback(
      async (key: string, value: string, sourceValue: string) => {
        try {
          await fetch(`/api/preview/${prototypeId}/copy`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value, sourceValue }),
          });
        } catch {
          // Silently ignore patch failures — state is still updated optimistically
        }
      },
      [prototypeId]
    ),
    500
  );

  const handleEntryChange = useCallback(
    (entry: CopyEntryWithHistory, newValue: string) => {
      updateEntry(entry.key, newValue);
      patchEntry(entry.key, newValue, entry.sourceValue);
      // Build fresh override map from store after update
      // Use updated entries directly to avoid stale closure
      const currentEntries = useCopyStore.getState().entries;
      const overrides = buildOverrideMap(currentEntries);
      postToPreview({ type: 'SET_TEXT_OVERRIDES', overrides });
    },
    [updateEntry, patchEntry]
  );

  const handleResetEntry = useCallback(
    (entry: CopyEntryWithHistory) => {
      resetEntry(entry.key);
      // Reset value in API
      patchEntry(entry.key, entry.sourceValue, entry.sourceValue);
      // Rebuild overrides after reset
      const currentEntries = useCopyStore.getState().entries;
      const overrides = buildOverrideMap(currentEntries);
      postToPreview({ type: 'SET_TEXT_OVERRIDES', overrides });
    },
    [resetEntry, patchEntry]
  );

  const handleEntryFocus = useCallback((entry: CopyEntryWithHistory) => {
    postToPreview({ type: 'HIGHLIGHT_TEXT', inspectorId: entry.inspectorId });
  }, []);

  const handleEntryBlur = useCallback(() => {
    postToPreview({ type: 'HIGHLIGHT_TEXT', inspectorId: null });
  }, []);

  const toggleHistory = useCallback((key: string) => {
    setExpandedHistory((prev) => {
      const next = new Set(prev);
      if (next.has(key)) {
        next.delete(key);
      } else {
        next.add(key);
      }
      return next;
    });
  }, []);

  // Filter entries by search query
  const filteredEntries = useMemo(() => {
    if (!searchQuery.trim()) return entries;
    const q = searchQuery.toLowerCase();
    return entries.filter(
      (e) =>
        e.currentValue.toLowerCase().includes(q) ||
        e.sourceValue.toLowerCase().includes(q) ||
        e.componentName.toLowerCase().includes(q) ||
        e.componentPath.toLowerCase().includes(q)
    );
  }, [entries, searchQuery]);

  // Group filtered entries by componentName
  const groupedEntries = useMemo(() => {
    const groups: Record<string, CopyEntryWithHistory[]> = {};
    for (const entry of filteredEntries) {
      if (!groups[entry.componentName]) groups[entry.componentName] = [];
      groups[entry.componentName].push(entry);
    }
    return groups;
  }, [filteredEntries]);

  // Export as JSON
  const handleExport = useCallback(() => {
    const data = {
      prototypeId,
      exportedAt: new Date().toISOString(),
      entries: entries.map((e) => ({
        key: e.key,
        componentName: e.componentName,
        propName: e.propName,
        value: e.currentValue,
      })),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${prototypeId}-copy.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [entries, prototypeId]);

  // Import from JSON
  const handleImport = useCallback(
    (file: File) => {
      const reader = new FileReader();
      reader.onload = async (ev) => {
        try {
          const data = JSON.parse(ev.target?.result as string);
          const importedEntries: Array<{ key: string; value: string }> = data.entries ?? [];
          let matched = 0;
          let skipped = 0;
          for (const imported of importedEntries) {
            const existing = entries.find((e) => e.key === imported.key);
            if (existing) {
              updateEntry(imported.key, imported.value);
              await patchEntry(imported.key, imported.value, existing.sourceValue);
              matched++;
            } else {
              skipped++;
            }
          }
          // Rebuild and send overrides
          const currentEntries = useCopyStore.getState().entries;
          const overrides = buildOverrideMap(currentEntries);
          postToPreview({ type: 'SET_TEXT_OVERRIDES', overrides });
          alert(`Imported ${matched} entries, ${skipped} skipped (not found in current source).`);
        } catch {
          alert('Failed to parse import file. Please select a valid JSON file.');
        }
      };
      reader.readAsText(file);
    },
    [entries, updateEntry, patchEntry]
  );

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
        <CircularProgress size={24} />
      </Box>
    );
  }

  if (entries.length === 0) {
    return (
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Typography variant="body2" color="text.secondary">
          No text entries found in this prototype. Add Typography, Button, or other text components to see them here.
        </Typography>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header: summary + search + actions */}
      <Box sx={{ p: 1.5, flexShrink: 0, borderBottom: 1, borderColor: 'divider' }}>
        {/* Summary */}
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
          {summary.total} text entries &middot; {summary.modified} modified
        </Typography>

        {/* Search */}
        <TextField
          size="small"
          variant="outlined"
          fullWidth
          placeholder="Search text..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          slotProps={{
            input: {
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon fontSize="small" />
                </InputAdornment>
              ),
            },
          }}
          sx={{ mb: 1 }}
        />

        {/* Action buttons */}
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button
            size="small"
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleExport}
            sx={{ fontSize: '12px' }}
          >
            Export JSON
          </Button>
          <Button
            size="small"
            variant="outlined"
            startIcon={<UploadIcon />}
            onClick={() => fileInputRef.current?.click()}
            sx={{ fontSize: '12px' }}
          >
            Import JSON
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleImport(file);
              e.target.value = '';
            }}
          />
        </Box>
      </Box>

      {/* Conflicts banner */}
      {conflicts.length > 0 && (
        <Alert severity="warning" sx={{ m: 1, flexShrink: 0, fontSize: '12px' }}>
          {conflicts.length} text {conflicts.length === 1 ? 'entry has' : 'entries have'} conflicts — designer changed
          the source text after you edited it.
        </Alert>
      )}

      {/* Entry groups */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {Object.entries(groupedEntries).map(([componentName, groupEntries]) => {
          const isCollapsed = collapsedGroups.has(componentName);
          const componentPath = groupEntries[0]?.componentPath ?? componentName;

          // Sub-group by category
          const byCategory: Record<string, CopyEntryWithHistory[]> = {};
          for (const entry of groupEntries) {
            if (!byCategory[entry.category]) byCategory[entry.category] = [];
            byCategory[entry.category].push(entry);
          }

          return (
            <Box key={componentName}>
              {/* Group header */}
              <Tooltip title={componentPath} placement="right">
                <Box
                  onClick={() => toggleGroup(componentName)}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    px: 1.5,
                    py: 0.75,
                    cursor: 'pointer',
                    bgcolor: 'action.hover',
                    '&:hover': { bgcolor: 'action.selected' },
                    position: 'sticky',
                    top: 0,
                    zIndex: 2,
                    borderBottom: 1,
                    borderColor: 'divider',
                  }}
                >
                  {isCollapsed ? <ExpandMoreIcon fontSize="small" /> : <ExpandLessIcon fontSize="small" />}
                  <Typography variant="caption" fontWeight="bold" sx={{ ml: 0.5, flex: 1 }}>
                    {componentName}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {groupEntries.length}
                  </Typography>
                </Box>
              </Tooltip>

              {/* Entries */}
              <Collapse in={!isCollapsed}>
                {Object.entries(byCategory).map(([category, catEntries]) => (
                  <Box key={category}>
                    {/* Category sub-header */}
                    <Typography
                      variant="caption"
                      color="text.disabled"
                      sx={{ px: 2, py: 0.25, display: 'block', fontSize: '10px', textTransform: 'uppercase', letterSpacing: 0.5 }}
                    >
                      {CATEGORY_LABELS[category] ?? category}
                    </Typography>

                    {catEntries.map((entry) => {
                      const isModified = entry.currentValue !== entry.sourceValue;
                      const isHighlighted = highlightedKey === entry.key;
                      const histExpanded = expandedHistory.has(entry.key);
                      const conflict = conflicts.find((c) => c.key === entry.key);
                      const isMultiline = entry.sourceValue.includes('\n') || entry.sourceValue.length > 80;

                      return (
                        <Box
                          key={entry.key}
                          ref={(el: HTMLDivElement | null) => {
                            entryRefs.current[entry.key] = el;
                          }}
                          sx={{
                            px: 1.5,
                            py: 1,
                            borderLeft: isHighlighted ? '3px solid' : '3px solid transparent',
                            borderLeftColor: isHighlighted ? 'primary.main' : 'transparent',
                            bgcolor: isHighlighted ? 'action.selected' : 'transparent',
                            transition: 'all 0.15s',
                          }}
                        >
                          {/* Entry label row */}
                          <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                            {/* Modified indicator dot */}
                            {isModified && (
                              <Box
                                sx={{
                                  width: 8,
                                  height: 8,
                                  borderRadius: '50%',
                                  bgcolor: 'warning.main',
                                  mr: 0.75,
                                  flexShrink: 0,
                                }}
                              />
                            )}
                            <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
                              {entry.propName}
                            </Typography>
                            {/* History toggle */}
                            {isModified && entry.edits.length > 0 && (
                              <Tooltip title="Edit history">
                                <IconButton
                                  size="small"
                                  onClick={() => toggleHistory(entry.key)}
                                  sx={{ p: 0.25 }}
                                >
                                  <HistoryIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                            {/* Reset button */}
                            {isModified && (
                              <Tooltip title="Reset to original">
                                <IconButton
                                  size="small"
                                  onClick={() => handleResetEntry(entry)}
                                  sx={{ p: 0.25 }}
                                >
                                  <RestoreIcon sx={{ fontSize: 14 }} />
                                </IconButton>
                              </Tooltip>
                            )}
                          </Box>

                          {/* Conflict display */}
                          {conflict ? (
                            <Box sx={{ border: 1, borderColor: 'warning.main', borderRadius: 1, p: 1, mb: 0.5 }}>
                              <Box sx={{ display: 'flex', gap: 1, mb: 0.5 }}>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Designer&apos;s version:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontSize: '12px' }}>
                                    {conflict.designerValue}
                                  </Typography>
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="caption" color="text.secondary" display="block">
                                    Your version:
                                  </Typography>
                                  <Typography variant="body2" sx={{ fontSize: '12px' }}>
                                    {conflict.copywriterValue}
                                  </Typography>
                                </Box>
                              </Box>
                              <Box sx={{ display: 'flex', gap: 1 }}>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  color="warning"
                                  sx={{ fontSize: '11px', py: 0.25 }}
                                  onClick={() => {
                                    resolveConflict(entry.key, conflict.designerValue);
                                    patchEntry(entry.key, conflict.designerValue, entry.sourceValue);
                                  }}
                                >
                                  Accept designer&apos;s
                                </Button>
                                <Button
                                  size="small"
                                  variant="outlined"
                                  sx={{ fontSize: '11px', py: 0.25 }}
                                  onClick={() => {
                                    resolveConflict(entry.key, conflict.copywriterValue);
                                    patchEntry(entry.key, conflict.copywriterValue, entry.sourceValue);
                                  }}
                                >
                                  Keep mine
                                </Button>
                              </Box>
                            </Box>
                          ) : (
                            /* Text field */
                            <TextField
                              size="small"
                              fullWidth
                              multiline={isMultiline}
                              minRows={isMultiline ? 1 : undefined}
                              maxRows={isMultiline ? 6 : undefined}
                              value={entry.currentValue}
                              onChange={(e) => handleEntryChange(entry, e.target.value)}
                              onFocus={() => {
                                setHighlightedKey(entry.key);
                                handleEntryFocus(entry);
                              }}
                              onBlur={handleEntryBlur}
                              helperText={`${entry.currentValue.length} chars`}
                              slotProps={{
                                formHelperText: { sx: { mx: 0, fontSize: '10px' } },
                              }}
                            />
                          )}

                          {/* Edit history */}
                          <Collapse in={histExpanded}>
                            <Box sx={{ mt: 0.5, borderLeft: 2, borderLeftColor: 'divider', pl: 1 }}>
                              <List dense disablePadding>
                                <ListItem disableGutters disablePadding sx={{ py: 0 }}>
                                  <ListItemText
                                    primary={entry.sourceValue}
                                    secondary="Original"
                                    primaryTypographyProps={{ variant: 'caption' }}
                                    secondaryTypographyProps={{ sx: { fontSize: '10px' } }}
                                  />
                                </ListItem>
                                {entry.edits.map((edit, idx) => (
                                  <ListItem key={idx} disableGutters disablePadding sx={{ py: 0 }}>
                                    <ListItemText
                                      primary={edit.value}
                                      secondary={formatRelativeTime(edit.timestamp)}
                                      primaryTypographyProps={{ variant: 'caption' }}
                                      secondaryTypographyProps={{ sx: { fontSize: '10px' } }}
                                    />
                                  </ListItem>
                                ))}
                              </List>
                            </Box>
                          </Collapse>
                        </Box>
                      );
                    })}
                    <Divider />
                  </Box>
                ))}
              </Collapse>
            </Box>
          );
        })}

        {/* Empty search state */}
        {searchQuery && Object.keys(groupedEntries).length === 0 && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No entries match &quot;{searchQuery}&quot;
            </Typography>
          </Box>
        )}
      </Box>
    </Box>
  );
}
