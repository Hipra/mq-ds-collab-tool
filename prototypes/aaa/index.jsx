import { useState } from 'react';
import {
  Box,
  Stack,
  Typography,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Checkbox,
  FormControlLabel,
  Switch,
  Slider,
  Button,
  Chip,
  Alert,
  Divider,
  Paper,
  Radio,
} from '@mui/material';
import { MqIcon } from '@mq/icons';

const ROLES = ['Translator', 'Reviewer', 'Project Manager', 'Terminologist'];
const NOTIFICATION_OPTIONS = ['E-mail értesítés', 'Böngésző push', 'In-app értesítés'];

export default function Prototype() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [role, setRole] = useState('');
  const [notifications, setNotifications] = useState([true, false, true]);
  const [selectedRadio, setSelectedRadio] = useState('manual');
  const [autoSave, setAutoSave] = useState(true);
  const [quality, setQuality] = useState(70);
  const [saved, setSaved] = useState(false);

  const handleNotificationChange = (index) => {
    setNotifications((prev) => prev.map((v, i) => (i === index ? !v : v)));
  };

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <Box sx={{ p: 4, maxWidth: 680, mx: 'auto' }}>
      <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 0.5 }}>
        <MqIcon name="profile" size={24} color="primary" />
        <Typography variant="h5">Felhasználói beállítások</Typography>
      </Stack>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
        Személyes adatok és munkakörnyezet konfigurálása.
      </Typography>

      {saved && (
        <Alert
          severity="success"
          icon={<MqIcon name="check_circle" size={20} />}
          sx={{ mb: 3 }}
        >
          Beállítások sikeresen mentve.
        </Alert>
      )}

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          Személyes adatok
        </Typography>
        <Stack spacing={2.5}>
          <TextField
            label="Teljes név"
            placeholder="pl. Kiss János"
            value={name}
            onChange={(e) => setName(e.target.value)}
            fullWidth
            slotProps={{ input: { startAdornment: <Box sx={{ mr: 1, display: 'flex' }}><MqIcon name="profile" size={18} color="text.secondary" /></Box> } }}
          />
          <TextField
            label="E-mail cím"
            type="email"
            placeholder="pl. kiss.janos@ceg.hu"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            fullWidth
            slotProps={{ input: { startAdornment: <Box sx={{ mr: 1, display: 'flex' }}><MqIcon name="email" size={18} color="text.secondary" /></Box> } }}
          />
          <FormControl fullWidth>
            <InputLabel>Szerepkör</InputLabel>
            <Select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              label="Szerepkör"
              alignedToWidestItem={false}
            >
              {ROLES.map((r) => (
                <MenuItem key={r} value={r}>{r}</MenuItem>
              ))}
            </Select>
          </FormControl>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          Értesítések
        </Typography>
        <Stack spacing={1}>
          {NOTIFICATION_OPTIONS.map((label, i) => (
            <FormControlLabel
              key={label}
              label={label}
              control={
                <Checkbox
                  checked={notifications[i]}
                  onChange={() => handleNotificationChange(i)}
                />
              }
            />
          ))}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          Fordítási mód
        </Typography>
        <Stack spacing={1}>
          {[
            { value: 'manual', label: 'Kézi fordítás' },
            { value: 'mt', label: 'Gépi fordítás segítséggel' },
            { value: 'auto', label: 'Teljesen automatikus' },
          ].map(({ value, label }) => (
            <FormControlLabel
              key={value}
              label={label}
              control={
                <Radio
                  checked={selectedRadio === value}
                  onClick={() => setSelectedRadio(value)}
                />
              }
            />
          ))}
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ p: 3, mb: 3 }}>
        <Typography variant="subtitle1" sx={{ mb: 2, fontWeight: 600 }}>
          Munkakörnyezet
        </Typography>
        <Stack spacing={2}>
          <FormControlLabel
            label="Automatikus mentés"
            control={
              <Switch
                checked={autoSave}
                onChange={(e) => setAutoSave(e.target.checked)}
              />
            }
          />
          <Divider />
          <Box>
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
              <Typography variant="body2">Minőségi küszöb (QA)</Typography>
              <Chip label={`${quality}%`} size="small" color="primary" variant="outlined" />
            </Stack>
            <Slider
              value={quality}
              onChange={(_, v) => setQuality(v)}
              min={0}
              max={100}
              step={5}
              marks={[
                { value: 0, label: '0%' },
                { value: 50, label: '50%' },
                { value: 100, label: '100%' },
              ]}
            />
          </Box>
        </Stack>
      </Paper>

      <Stack direction="row" spacing={2} justifyContent="flex-end">
        <Button variant="outlined" onClick={() => { setName(''); setEmail(''); setRole(''); }}>
          Visszaállítás
        </Button>
        <Button
          variant="contained"
          onClick={handleSave}
          startIcon={<MqIcon name="cloud_checked" size={18} color="inherit" />}
        >
          Mentés
        </Button>
      </Stack>
    </Box>
  );
}
