'use client';

import { Box, Chip, MenuItem, Select, TextField, Typography, type SelectChangeEvent } from '@mui/material';
import MqIcon from '@/components/MqIcon';

const DESIGN_STATUSES = ['in_progress', 'review', 'done'] as const;
const DEV_STATUSES = ['not_started', 'in_progress', 'qa', 'deployed'] as const;
const UX_WRITER_STATUSES = ['not_started', 'in_progress', 'review', 'done'] as const;

const STATUS_LABELS: Record<string, string> = {
  in_progress: 'In progress',
  review: 'Review',
  done: 'Done',
  not_started: 'Not started',
  qa: 'QA',
  deployed: 'Deployed',
};

interface FilterBarProps {
  designFilter: string[];
  devFilter: string[];
  uxWriterFilter: string[];
  searchQuery: string;
  onDesignFilterChange: (values: string[]) => void;
  onDevFilterChange: (values: string[]) => void;
  onUxWriterFilterChange: (values: string[]) => void;
  onSearchChange: (query: string) => void;
}

function StatusSelect({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: readonly string[];
  value: string[];
  onChange: (values: string[]) => void;
}) {
  const handleChange = (e: SelectChangeEvent<string[]>) => {
    const val = e.target.value;
    onChange(typeof val === 'string' ? val.split(',') : val);
  };

  return (
    <Box sx={{ minWidth: 160 }}>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 0.5, display: 'block' }}>
        {label}
      </Typography>
      <Select
        multiple
        size="small"
        value={value}
        onChange={handleChange}
        displayEmpty
        renderValue={(selected) =>
          selected.length === 0 ? (
            <Typography variant="body2" color="text.secondary">All</Typography>
          ) : (
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
              {selected.map((v) => (
                <Chip key={v} label={STATUS_LABELS[v] || v} size="small" />
              ))}
            </Box>
          )
        }
        sx={{ minWidth: 160 }}
      >
        {options.map((status) => (
          <MenuItem key={status} value={status}>
            {STATUS_LABELS[status] || status}
          </MenuItem>
        ))}
      </Select>
    </Box>
  );
}

export default function FilterBar({
  designFilter,
  devFilter,
  uxWriterFilter,
  searchQuery,
  onDesignFilterChange,
  onDevFilterChange,
  onUxWriterFilterChange,
  onSearchChange,
}: FilterBarProps) {
  return (
    <Box sx={{ display: 'flex', gap: 2, alignItems: 'flex-end', flexWrap: 'wrap', mb: 3 }}>
      <StatusSelect label="Design" options={DESIGN_STATUSES} value={designFilter} onChange={onDesignFilterChange} />
      <StatusSelect label="Dev" options={DEV_STATUSES} value={devFilter} onChange={onDevFilterChange} />
      <StatusSelect label="UX Writer" options={UX_WRITER_STATUSES} value={uxWriterFilter} onChange={onUxWriterFilterChange} />
      <TextField
        size="small"
        placeholder="Search projects..."
        value={searchQuery}
        onChange={(e) => onSearchChange(e.target.value)}
        slotProps={{ input: { startAdornment: <MqIcon name="search" size={18} color="action" /> } }}
        sx={{ minWidth: 220, ml: 'auto' }}
      />
    </Box>
  );
}
