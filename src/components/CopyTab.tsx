'use client';

import React, { useEffect, useRef, useCallback, useMemo } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import IconButton from '@mui/material/IconButton';
import Collapse from '@mui/material/Collapse';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';
import List from '@mui/material/List';
import ListItemText from '@mui/material/ListItemText';
import ListItem from '@mui/material/ListItem';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import MqIcon from "@/components/MqIcon";
import { pseudoTransform, PSEUDO_MODE_LABELS, type PseudoMode } from '@/lib/pseudo-translation';
import { usePseudoTranslationStore } from '@/stores/pseudo-translation';





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

/**
 * Returns true if the entry comes from a top-level data array (not a JSX element).
 * Data array key format: "VARNAME_index_propName" — third-from-last segment is NOT numeric.
 * JSX key format: "ComponentName_line_col_propName" — both line and col are numeric.
 */
function isDataArrayEntry(entry: CopyEntryWithHistory): boolean {
  const parts = entry.key.split('_');
  if (parts.length < 3) return false;
  const maybeLine = parseInt(parts[parts.length - 3], 10);
  return isNaN(maybeLine);
}

/** For data array entries, derive a display label that includes the index: "[0] label" */
function getEntryDisplayPropName(entry: CopyEntryWithHistory): string {
  if (!isDataArrayEntry(entry)) return entry.propName;
  const parts = entry.key.split('_');
  const index = parseInt(parts[parts.length - 2], 10);
  return `[${index}] ${entry.propName}`;
}

/** Build the full override map from all modified JSX entries (inspector-id based) */
function buildOverrideMap(entries: CopyEntryWithHistory[]): Record<string, Record<string, string>> {
  const overrides: Record<string, Record<string, string>> = {};
  for (const e of entries) {
    if (!isDataArrayEntry(e) && e.currentValue !== e.sourceValue) {
      if (!overrides[e.inspectorId]) overrides[e.inspectorId] = {};
      overrides[e.inspectorId][e.propName] = e.currentValue;
    }
  }
  return overrides;
}

/** Build text-content override map for data array entries (e.g. TOOLBAR_GROUPS labels) */
function buildTextContentOverrideMap(entries: CopyEntryWithHistory[]): Record<string, string> {
  const result: Record<string, string> = {};
  for (const e of entries) {
    if (isDataArrayEntry(e) && e.currentValue !== e.sourceValue) {
      result[e.sourceValue] = e.currentValue;
    }
  }
  return result;
}



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
    highlightedKey,
    loading,
    refreshToken,
    setEntries,
    updateEntry,
    resetEntry,
    setSearchQuery,
    setHighlightedKey,
    setLoading,
    resolveConflict,
  } = useCopyStore();

  const { activeScreenId } = useInspectorStore();
  const { mode: pseudoMode, setMode: setPseudoMode } = usePseudoTranslationStore();
  const entryRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [expandedHistory, setExpandedHistory] = React.useState<Set<string>>(new Set());
  const [approving, setApproving] = React.useState(false);

  // Fetch copy data on mount and when screen changes
  const fetchCopyData = useCallback(async (screenId: string, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const screen = screenId !== 'index' ? `?screen=${screenId}` : '';
      const res = await fetch(`/api/preview/${prototypeId}/copy${screen}`);
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const data = await res.json();
      // Build edits map from API response
      const editsMap: Record<string, Array<{ value: string; timestamp: string }>> = {};
      if (data.editsMap) {
        Object.assign(editsMap, data.editsMap);
      }
      setEntries(data.entries ?? [], data.conflicts ?? [], data.summary ?? { total: 0, modified: 0 }, editsMap);

      // If any entries are already modified, send overrides to iframe
      const allEntries: CopyEntryWithHistory[] = data.entries ?? [];
      const hasModified = allEntries.some((e: CopyEntryWithHistory) => e.currentValue !== e.sourceValue);
      if (hasModified) {
        postToPreview({ type: 'SET_TEXT_OVERRIDES', overrides: buildOverrideMap(allEntries) });
        postToPreview({ type: 'SET_TEXT_CONTENT_OVERRIDES', overrides: buildTextContentOverrideMap(allEntries) });
      }
    } catch {
      // Non-critical — show empty state if fetch fails
      setLoading(false);
    }
  }, [prototypeId, setEntries, setLoading]);

  // Keep latest values in refs so the refreshToken effect can access them without
  // being in their dependency array (avoids re-subscribing on every render)
  const fetchCopyDataRef = useRef(fetchCopyData);
  fetchCopyDataRef.current = fetchCopyData;
  const activeScreenIdRef = useRef(activeScreenId);
  activeScreenIdRef.current = activeScreenId;

  useEffect(() => {
    fetchCopyData(activeScreenId);
  }, [activeScreenId, fetchCopyData]);

  // Silently re-fetch when PreviewFrame signals a source file change
  // (handles race condition where new prototype files aren't ready on first mount fetch)
  useEffect(() => {
    if (refreshToken === 0) return;
    fetchCopyDataRef.current(activeScreenIdRef.current, true);
  }, [refreshToken]);

  // Pseudo-translation: send SET_PSEUDO_MODE to iframe.
  // The bootstrap patches React.createElement to transform text at render time —
  // no DOM manipulation, no RELOAD, works for all text types universally.
  useEffect(() => {
    postToPreview({ type: 'SET_PSEUDO_MODE', mode: pseudoMode });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pseudoMode]);

  // Scroll to highlighted entry when it changes
  useEffect(() => {
    if (highlightedKey && entryRefs.current[highlightedKey]) {
      entryRefs.current[highlightedKey]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [highlightedKey]);

  // Debounced PATCH to API (for JSX text entries — live DOM override)
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

  // Debounced PATCH + RELOAD for data array entry reset (need clean bundle without overlay)
  const patchDataEntryReset = useDebounce(
    useCallback(
      async (key: string, sourceValue: string) => {
        try {
          await fetch(`/api/preview/${prototypeId}/copy`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key, value: sourceValue, sourceValue }),
          });
          postToPreview({ type: 'RELOAD' });
        } catch {
          // Silently ignore
        }
      },
      [prototypeId]
    ),
    500
  );

  const handleEntryChange = useCallback(
    (entry: CopyEntryWithHistory, newValue: string) => {
      updateEntry(entry.key, newValue);
      if (isDataArrayEntry(entry)) {
        // Data array entries: persist overlay, update live via text-content DOM patching (no reload)
        patchEntry(entry.key, newValue, entry.sourceValue);
        const currentEntries = useCopyStore.getState().entries;
        postToPreview({ type: 'SET_TEXT_CONTENT_OVERRIDES', overrides: buildTextContentOverrideMap(currentEntries) });
      } else {
        patchEntry(entry.key, newValue, entry.sourceValue);
        const currentEntries = useCopyStore.getState().entries;
        postToPreview({ type: 'SET_TEXT_OVERRIDES', overrides: buildOverrideMap(currentEntries) });
      }
    },
    [updateEntry, patchEntry]
  );

  const handleResetEntry = useCallback(
    (entry: CopyEntryWithHistory) => {
      resetEntry(entry.key);
      if (isDataArrayEntry(entry)) {
        // Clear text content override immediately (best-effort DOM revert for current session)
        const currentEntries = useCopyStore.getState().entries;
        postToPreview({ type: 'SET_TEXT_CONTENT_OVERRIDES', overrides: buildTextContentOverrideMap(currentEntries) });
        // Also PATCH + RELOAD so the bundle is clean (handles the case where the
        // bundle was loaded with this value already baked in from a previous session)
        patchDataEntryReset(entry.key, entry.sourceValue);
      } else {
        patchEntry(entry.key, entry.sourceValue, entry.sourceValue);
        const currentEntries = useCopyStore.getState().entries;
        postToPreview({ type: 'SET_TEXT_OVERRIDES', overrides: buildOverrideMap(currentEntries) });
      }
    },
    [resetEntry, patchEntry, patchDataEntryReset]
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

  // Approve entries: write text edits back to JSX source
  const handleApprove = useCallback(
    async (entriesToApprove: Array<{ key: string; value: string }>) => {
      setApproving(true);
      try {
        const screen = activeScreenId !== 'index' ? activeScreenId : undefined;
        const res = await fetch(`/api/preview/${prototypeId}/copy/approve`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ entries: entriesToApprove, screen }),
        });
        if (res.ok) {
          // Re-fetch copy data to reflect the updated source (silent — no full-screen spinner)
          await fetchCopyData(activeScreenId, true);
        }
      } catch {
        // Silently ignore — re-fetch will show current state
      } finally {
        setApproving(false);
      }
    },
    [prototypeId, activeScreenId, fetchCopyData]
  );

  const handleApproveAll = useCallback(() => {
    const modified = entries.filter((e) => e.currentValue !== e.sourceValue);
    if (modified.length === 0) return;
    handleApprove(modified.map((e) => ({ key: e.key, value: e.currentValue })));
  }, [entries, handleApprove]);

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

  const sortedEntries = useMemo(
    () => [...filteredEntries].sort((a, b) => a.sourceLine - b.sourceLine),
    [filteredEntries]
  );

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
      <Box sx={{ flexShrink: 0 }}>
        {/* Pseudo-translation control */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
          <Typography variant="caption" color="text.secondary" sx={{ flex: 1 }}>
            Pseudo-translation
          </Typography>
          <ToggleButtonGroup
            size="small"
            exclusive
            value={pseudoMode}
            onChange={(_e, val: PseudoMode | null) => setPseudoMode(val)}
            sx={{ '& .MuiToggleButton-root': { py: 0.25, px: 1, fontSize: '11px', lineHeight: 1.6, textTransform: 'none' } }}
          >
            {(Object.keys(PSEUDO_MODE_LABELS) as PseudoMode[]).map((m) => (
              <ToggleButton key={m} value={m} aria-label={m}>
                {PSEUDO_MODE_LABELS[m]}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>

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
                  <MqIcon name="search" size={20} />
                </InputAdornment>
              ),
              sx: { fontSize: '0.8125rem' },
            },
          }}
          sx={{ mb: 0.5 }}
        />

        {/* Summary */}
        <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 1 }}>
          {summary.total} text entries &middot; {summary.modified} modified
        </Typography>

      </Box>

      {/* Conflicts banner */}
      {conflicts.length > 0 && (
        <Alert severity="warning" sx={{ m: 1, flexShrink: 0, fontSize: '12px' }}>
          {conflicts.length} text {conflicts.length === 1 ? 'entry has' : 'entries have'} conflicts — designer changed
          the source text after you edited it.
        </Alert>
      )}

      {/* Flat entry list */}
      <Box sx={{ flex: 1, overflow: 'auto' }}>
        {sortedEntries.map((entry) => {
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
                            py: 1,
                          }}
                        >
                          {/* Action row — only visible when modified and not in pseudo mode */}
                          {isModified && !pseudoMode && (
                            <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
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
                              <Box sx={{ flex: 1 }} />
                              {entry.edits.length > 0 && (
                                <Tooltip title="Edit history">
                                  <IconButton size="small" onClick={() => toggleHistory(entry.key)} aria-label="Edit history" sx={{ p: 0.25 }}>
                                    <MqIcon name="history" size={20} />
                                  </IconButton>
                                </Tooltip>
                              )}
                              <Tooltip title="Approve — write to source">
                                <IconButton
                                  size="small"
                                  onClick={() => handleApprove([{ key: entry.key, value: entry.currentValue }])}
                                  disabled={approving}
                                  aria-label="Approve — write to source"
                                  sx={{ p: 0.25 }}
                                >
                                  <MqIcon name="check" size={20} />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title="Reset to original">
                                <IconButton size="small" onClick={() => handleResetEntry(entry)} aria-label="Reset to original" sx={{ p: 0.25 }}>
                                  <MqIcon name="reload" size={20} />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          )}

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
                              value={pseudoMode ? pseudoTransform(entry.sourceValue, pseudoMode) : entry.currentValue}
                              onChange={pseudoMode ? undefined : (e) => handleEntryChange(entry, e.target.value)}
                              onFocus={() => {
                                setHighlightedKey(entry.key);
                                handleEntryFocus(entry);
                              }}
                              onBlur={handleEntryBlur}
                              helperText={pseudoMode ? entry.sourceValue : `${entry.currentValue.length} chars`}
                              sx={{
                                '& .MuiInputBase-input': { fontSize: '0.8125rem' },
                                ...(pseudoMode && { '& .MuiInputBase-root': { bgcolor: 'action.hover' } }),
                              }}
                              slotProps={{
                                input: { readOnly: !!pseudoMode },
                                formHelperText: { sx: { mx: 0, fontSize: '10px', fontStyle: pseudoMode ? 'italic' : 'normal', color: pseudoMode ? 'text.disabled' : undefined } },
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

        {/* Empty search state */}
        {searchQuery && sortedEntries.length === 0 && (
          <Box sx={{ p: 2, textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              No entries match &quot;{searchQuery}&quot;
            </Typography>
          </Box>
        )}
      </Box>

      {/* Footer: export / import */}
      <Box sx={{ py: 1.5, flexShrink: 0, display: 'flex', gap: 1 }}>
        <Button
          size="small"
          variant="outlined"
          color="secondary"
          startIcon={<MqIcon name="download" size={20} />}
          onClick={handleExport}
          fullWidth
          sx={{ fontSize: '12px' }}
        >
          Export
        </Button>
        <Button
          size="small"
          variant="outlined"
          color="secondary"
          startIcon={<MqIcon name="upload" size={20} />}
          onClick={() => fileInputRef.current?.click()}
          fullWidth
          sx={{ fontSize: '12px' }}
        >
          Import
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
  );
}
