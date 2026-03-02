import { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  Checkbox,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  IconButton,
  Stack,
  Tooltip,
  Typography,
} from '@mui/material';
import { MqIcon } from '@mq/icons';

const TOOLBAR_GROUPS = [
  [
    { id: 'undo', label: 'Undo', icon: 'undo' },
    { id: 'redo', label: 'Redo', icon: 'redo' },
  ],
  [
    { id: 'bold', label: 'Bold', icon: 'bold' },
    { id: 'italic', label: 'Italic', icon: 'italic' },
    { id: 'underline', label: 'Underline', icon: 'underlined' },
    { id: 'toggle-case', label: 'Toggle case', icon: 'toggle_case' },
  ],
  [
    { id: 'superscript', label: 'Superscript', icon: 'superscript' },
    { id: 'subscript', label: 'Subscript', icon: 'subscript' },
  ],
  [
    { id: 'copy-source', label: 'Copy source to target', icon: 'copy_source_to_target' },
    { id: 'clear-translations', label: 'Clear translations of selected segments', icon: 'clear_translation' },
  ],
  [
    { id: 'tag-format', label: 'Tag format', icon: 'tag_format' },
    { id: 'copy-next-tag', label: 'Copy next tag sequence', icon: 'copy_tag' },
  ],
  [
    { id: 'track-changes', label: 'Tracked changes', icon: 'track_changes' },
    { id: 'spell-check', label: 'Check spelling and get suggestions', icon: 'spell_check' },
  ],
  [
    { id: 'find', label: 'Find and replace', icon: 'find' },
    { id: 'filter', label: 'Filter', icon: 'filter' },
  ],
  [
    { id: 'confirm-segment', label: 'Confirm segment', icon: 'confirm_segment' },
    { id: 'reject-segment', label: 'Reject segment', icon: 'reject_segment' },
    { id: 'lock-unlock', label: 'Lock or unlock segments', icon: 'lock_unlock' },
  ],
  [
    { id: 'show-sorting', label: 'Show sorting options', icon: 'sorting' },
    { id: 'jump-to-row', label: 'Show jump to row', icon: 'jump_to_row' },
  ],
];

const ALL_ITEMS = TOOLBAR_GROUPS.flat();

export default function Prototype() {
  const [open, setOpen] = useState(true);
  const [expanded, setExpanded] = useState(true);
  const [groups, setGroups] = useState(TOOLBAR_GROUPS);
  const [items, setItems] = useState(
    () => Object.fromEntries(ALL_ITEMS.map((item) => [item.id, true]))
  );
  const [saved, setSaved] = useState({ items: { ...items }, groups: TOOLBAR_GROUPS });

  const handleToggle = (id) => {
    setItems((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  const moveGroup = (index, direction) => {
    setGroups((prev) => {
      const next = [...prev];
      const swapIndex = index + direction;
      [next[index], next[swapIndex]] = [next[swapIndex], next[index]];
      return next;
    });
  };

  const handleCancel = () => {
    setItems(saved.items);
    setGroups(saved.groups);
    setOpen(false);
  };

  const handleApply = () => {
    setSaved({ items: { ...items }, groups });
    setOpen(false);
  };

  return (
    <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Button variant="outlined" onClick={() => setOpen(true)}>
        Open Settings
      </Button>

      <Dialog
        open={open}
        onClose={handleCancel}
        slotProps={{ paper: { sx: { width: 600, maxWidth: 600 } } }}
      >
        <DialogTitle>Settings</DialogTitle>

        <DialogContent dividers>
          <Accordion
            expanded={expanded}
            disableGutters
            elevation={0}
            sx={{ border: '1px solid', borderColor: 'divider', borderRadius: 1 }}
          >
            <AccordionSummary
              expandIcon={
                <Box sx={{ display: 'flex', transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s' }}>
                  <MqIcon name="chevron_down" size={20} />
                </Box>
              }
              onClick={() => setExpanded(v => !v)}
            >
              <Typography variant="subtitle2">Customizing toolbar</Typography>
            </AccordionSummary>

            <AccordionDetails sx={{ p: 0 }}>
              <Stack>

                {groups.map((group, groupIndex) => (
                  <Box key={group[0].id}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                      <Box sx={{ flex: 1 }}>
                        {group.map((item) => (
                          <Box
                            key={item.id}
                            sx={{ display: 'flex', alignItems: 'center', px: 1, py: 0.5 }}
                          >
                            <Checkbox
                              checked={items[item.id]}
                              onChange={() => handleToggle(item.id)}
                              size="small"
                              sx={{ mr: 0.5 }}
                            />
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <MqIcon name={item.icon} size={18} color="action" />
                              <Typography variant="body2">{item.label}</Typography>
                            </Box>
                          </Box>
                        ))}
                      </Box>

                      <Stack direction="row" sx={{ pr: 1 }}>
                        <Tooltip title="Move up">
                          <span>
                            <IconButton
                              size="small"
                              disabled={groupIndex === 0}
                              onClick={() => moveGroup(groupIndex, -1)}
                            >
                              <MqIcon name="arrow_top" size={16} />
                            </IconButton>
                          </span>
                        </Tooltip>
                        <Tooltip title="Move down">
                          <span>
                            <IconButton
                              size="small"
                              disabled={groupIndex === groups.length - 1}
                              onClick={() => moveGroup(groupIndex, 1)}
                            >
                              <MqIcon name="arrow_bottom" size={16} />
                            </IconButton>
                          </span>
                        </Tooltip>
                      </Stack>
                    </Box>

                    {groupIndex < groups.length - 1 && <Divider />}
                  </Box>
                ))}
              </Stack>
              <Divider />
              <Box sx={{ p: 1 }}>
                <Button
                  variant="text"
                  color="secondary"
                  size="small"
                  onClick={() => {
                    setGroups(TOOLBAR_GROUPS);
                    setItems(Object.fromEntries(ALL_ITEMS.map((item) => [item.id, true])));
                  }}
                >
                  Reset to default
                </Button>
              </Box>
            </AccordionDetails>
          </Accordion>
        </DialogContent>

        <DialogActions>
          <Button variant="text" onClick={handleCancel}>
            Cancel
          </Button>
          <Button variant="contained" onClick={handleApply}>
            Apply
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
