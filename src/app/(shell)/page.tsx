'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import AppBar from '@mui/material/AppBar';
import Box from '@mui/material/Box';
import MuiToolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import ToggleButton from '@mui/material/ToggleButton';
import ToggleButtonGroup from '@mui/material/ToggleButtonGroup';
import Card from '@mui/material/Card';
import CardActionArea from '@mui/material/CardActionArea';
import CardContent from '@mui/material/CardContent';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';
import InputAdornment from '@mui/material/InputAdornment';
import SearchIcon from '@mui/icons-material/Search';
import LightModeIcon from '@mui/icons-material/LightMode';
import DarkModeIcon from '@mui/icons-material/DarkMode';
import SettingsBrightnessIcon from '@mui/icons-material/SettingsBrightness';
import { useThemeStore, type ThemeMode } from '@/stores/theme';

interface Prototype {
  id: string;
  name: string;
  status: string;
  createdAt: string;
  hasShareToken: boolean;
}

type StatusFilter = 'all' | 'draft' | 'review' | 'approved';

const STATUS_CONFIG: Record<string, { label: string; color: 'default' | 'warning' | 'success' }> = {
  draft: { label: 'Draft', color: 'default' },
  review: { label: 'Review', color: 'warning' },
  approved: { label: 'Approved', color: 'success' },
};

const MODE_CONFIG: Record<ThemeMode, { icon: React.ReactNode; label: string }> = {
  light: { icon: <LightModeIcon />, label: 'Light mode' },
  dark: { icon: <DarkModeIcon />, label: 'Dark mode' },
  system: { icon: <SettingsBrightnessIcon />, label: 'System mode' },
};

export default function GalleryPage() {
  const router = useRouter();
  const { mode, cycleMode } = useThemeStore();
  const [prototypes, setPrototypes] = useState<Prototype[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');

  useEffect(() => {
    fetch('/api/prototypes')
      .then((res) => res.json())
      .then((data: Prototype[]) => {
        setPrototypes(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return prototypes.filter((p) => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [prototypes, searchQuery, statusFilter]);

  const modeConfig = MODE_CONFIG[mode] ?? MODE_CONFIG.system;

  return (
    <Box sx={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <AppBar position="static" color="default" elevation={0}>
        <MuiToolbar variant="dense">
          <Typography variant="subtitle1" component="div" sx={{ fontWeight: 500 }}>
            Prototypes
          </Typography>
          <Box sx={{ flex: 1 }} />
          <Tooltip title={modeConfig.label}>
            <IconButton onClick={cycleMode} size="small" aria-label={modeConfig.label}>
              {modeConfig.icon}
            </IconButton>
          </Tooltip>
        </MuiToolbar>
      </AppBar>

      <Box sx={{ p: 3, flex: 1, overflow: 'auto' }}>
        {/* Filters */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, alignItems: 'center', flexWrap: 'wrap' }}>
          <TextField
            size="small"
            placeholder="Search prototypes..."
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
            sx={{ minWidth: 240 }}
          />
          <ToggleButtonGroup
            value={statusFilter}
            exclusive
            onChange={(_e, val) => { if (val !== null) setStatusFilter(val); }}
            size="small"
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="draft">Draft</ToggleButton>
            <ToggleButton value="review">Review</ToggleButton>
            <ToggleButton value="approved">Approved</ToggleButton>
          </ToggleButtonGroup>
        </Box>

        {/* Loading */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
            <CircularProgress />
          </Box>
        )}

        {/* Empty state */}
        {!loading && filtered.length === 0 && (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 8 }}>
            {prototypes.length === 0
              ? 'No prototypes found.'
              : 'No prototypes match your search.'}
          </Typography>
        )}

        {/* Grid */}
        {!loading && filtered.length > 0 && (
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: {
                xs: '1fr',
                sm: 'repeat(2, 1fr)',
                md: 'repeat(3, 1fr)',
                lg: 'repeat(4, 1fr)',
              },
              gap: 2,
            }}
          >
            {filtered.map((proto) => {
              const config = STATUS_CONFIG[proto.status] ?? STATUS_CONFIG.draft;
              return (
                <Card key={proto.id} variant="outlined">
                  <CardActionArea onClick={() => router.push(`/prototype/${proto.id}`)}>
                    <CardContent>
                      <Typography variant="subtitle1" sx={{ fontWeight: 500, mb: 1 }}>
                        {proto.name}
                      </Typography>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Chip label={config.label} color={config.color} size="small" />
                        {proto.createdAt && (
                          <Typography variant="caption" color="text.secondary">
                            {new Date(proto.createdAt).toLocaleDateString()}
                          </Typography>
                        )}
                      </Box>
                    </CardContent>
                  </CardActionArea>
                </Card>
              );
            })}
          </Box>
        )}
      </Box>
    </Box>
  );
}
