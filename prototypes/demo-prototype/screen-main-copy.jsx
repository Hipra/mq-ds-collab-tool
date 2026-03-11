import { useState } from 'react';
import {
  Alert,
  Avatar,
  Badge,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  FormControlLabel,
  IconButton,
  LinearProgress,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Slider,
  Stack,
  Switch,
  Tooltip,
  Typography,
} from '@mui/material';
import { MqIcon } from '@mq/icons';

const NOTIFICATIONS = [
  { id: 1, name: 'Anna K.', text: 'Left a comment on segment 42', time: '2m ago', unread: true },
  { id: 2, name: 'Béla T.', text: 'Confirmed 18 segments', time: '14m ago', unread: true },
  { id: 3, name: 'Csilla M.', text: 'Rejected segment 7 — see note', time: '1h ago', unread: false },
];

const STATUS_CHIPS = [
  { label: 'Confirmed', color: 'success' },
  { label: 'Draft', color: 'warning' },
  { label: 'Rejected', color: 'error' },
  { label: 'Locked', color: 'default' },
  { label: 'Fuzzy', color: 'info' },
];

export default function Prototype() {
  const [notifOpen, setNotifOpen] = useState(true);
  const [autoSave, setAutoSave] = useState(true);
  const [spellCheck, setSpellCheck] = useState(false);
  const [quality, setQuality] = useState(72);
  const [starred, setStarred] = useState(false);

  return (
    <Box sx={{ p: 3, bgcolor: 'background.default', minHeight: '100vh' }}>
      <Stack spacing={3}>

        {/* Header row */}
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h6">Random screen</Typography>
          <Stack direction="row" spacing={1}>
            <Tooltip title={starred ? 'Unstar' : 'Star'}>
              <IconButton onClick={() => setStarred((v) => !v)} color={starred ? 'primary' : 'default'}>
                <MqIcon name={starred ? 'star_filled' : 'star'} size={20} />
              </IconButton>
            </Tooltip>
            <Tooltip title="Settings">
              <IconButton>
                <MqIcon name="settings" size={20} />
              </IconButton>
            </Tooltip>
            <Button variant="contained" startIcon={<MqIcon name="confirm_segment" size={16} color="#fff" />}>
              Confirm all
            </Button>
          </Stack>
        </Stack>

        {/* Alert */}
        {notifOpen && (
          <Alert
            severity="info"
            onClose={() => setNotifOpen(false)}
            icon={<MqIcon name="info" size={20} />}
          >
            2 new comments from team members since your last visit.
          </Alert>
        )}

        {/* Two-column row */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>

          {/* Progress card */}
          <Card variant="outlined" sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Translation progress
              </Typography>
              <Stack spacing={1.5}>
                {[
                  { label: 'Confirmed', value: 68, color: 'success' },
                  { label: 'Draft', value: 18, color: 'warning' },
                  { label: 'Untranslated', value: 14, color: 'inherit' },
                ].map((row) => (
                  <Box key={row.label}>
                    <Stack direction="row" justifyContent="space-between" sx={{ mb: 0.5 }}>
                      <Typography variant="caption" color="text.secondary">{row.label}</Typography>
                      <Typography variant="caption">{row.value}%</Typography>
                    </Stack>
                    <LinearProgress
                      variant="determinate"
                      value={row.value}
                      color={row.color === 'inherit' ? 'inherit' : row.color}
                      sx={{ borderRadius: 1, height: 6 }}
                    />
                  </Box>
                ))}
              </Stack>
            </CardContent>
          </Card>

          {/* Quality slider card */}
          <Card variant="outlined" sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>
                Quality threshold
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Only pre-fill segments above this TM match score.
              </Typography>
              <Stack direction="row" spacing={2} alignItems="center">
                <MqIcon name="translation_memory" size={18} color="action" />
                <Slider
                  value={quality}
                  onChange={(_, v) => setQuality(v)}
                  min={0}
                  max={100}
                  valueLabelDisplay="auto"
                  marks={[{ value: 50, label: '50%' }, { value: 100, label: '100%' }]}
                />
              </Stack>
              <Typography variant="caption" color="text.secondary">
                Current: {quality}%
              </Typography>
            </CardContent>
          </Card>
        </Stack>

        {/* Status chips */}
        <Box>
          <Typography variant="subtitle2" sx={{ mb: 1 }}>Segment statuses</Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
            {STATUS_CHIPS.map((chip) => (
              <Chip
                key={chip.label}
                label={chip.label}
                color={chip.color}
                variant="outlined"
                size="small"
              />
            ))}
          </Stack>
        </Box>

        <Divider />

        {/* Toggles + notifications row */}
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={2}>

          {/* Settings toggles */}
          <Card variant="outlined" sx={{ flex: 1 }}>
            <CardContent>
              <Typography variant="subtitle2" gutterBottom>Editor options</Typography>
              <Stack spacing={0.5}>
                <FormControlLabel
                  control={<Switch checked={autoSave} onChange={(e) => setAutoSave(e.target.checked)} size="small" />}
                  label={<Typography variant="body2">Auto-save</Typography>}
                />
                <FormControlLabel
                  control={<Switch checked={spellCheck} onChange={(e) => setSpellCheck(e.target.checked)} size="small" />}
                  label={<Typography variant="body2">Spell check</Typography>}
                />
              </Stack>
            </CardContent>
          </Card>

          {/* Notification list */}
          <Card variant="outlined" sx={{ flex: 2 }}>
            <CardContent sx={{ pb: '12px !important' }}>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2">Team activity</Typography>
                <Badge badgeContent={NOTIFICATIONS.filter((n) => n.unread).length} color="primary">
                  <MqIcon name="notification" size={18} />
                </Badge>
              </Stack>
              <List dense disablePadding>
                {NOTIFICATIONS.map((n, i) => (
                  <Box key={n.id}>
                    <ListItem disablePadding sx={{ py: 0.5 }}>
                      <ListItemAvatar sx={{ minWidth: 36 }}>
                        <Avatar sx={{ width: 28, height: 28, fontSize: 12, bgcolor: n.unread ? 'primary.main' : 'action.disabledBackground' }}>
                          {n.name[0]}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Stack direction="row" spacing={0.5} alignItems="baseline">
                            <Typography variant="body2" fontWeight={n.unread ? 600 : 400}>{n.name}</Typography>
                            <Typography variant="caption" color="text.secondary">· {n.time}</Typography>
                          </Stack>
                        }
                        secondary={<Typography variant="caption" color="text.secondary">{n.text}</Typography>}
                      />
                    </ListItem>
                    {i < NOTIFICATIONS.length - 1 && <Divider component="li" />}
                  </Box>
                ))}
              </List>
            </CardContent>
          </Card>
        </Stack>

      </Stack>
    </Box>
  );
}
