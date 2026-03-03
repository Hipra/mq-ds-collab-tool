import { useState } from 'react';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  Avatar,
  Badge,
  Box,
  Breadcrumbs,
  Button,
  Card,
  CardActions,
  CardContent,
  CardHeader,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  IconButton,
  LinearProgress,
  Link,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  MenuItem,
  Pagination,
  Paper,
  Radio,
  Select,
  Skeleton,
  Slider,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Tooltip,
  Typography,
} from '@mui/material';
import { MqIcon } from '@mq/icons';

const COLORS = ['primary', 'secondary', 'error', 'warning', 'info', 'success'];

function Section({ title, children }) {
  return (
    <Box component="section" sx={{ mb: 8 }}>
      <Typography
        variant="h5"
        sx={{ mb: 3, pb: 1, borderBottom: 2, borderColor: 'primary.main', fontWeight: 700 }}
      >
        {title}
      </Typography>
      {children}
    </Box>
  );
}

function Group({ label, children, direction = 'row', wrap = true }) {
  return (
    <Box sx={{ mb: 3 }}>
      {label && (
        <Typography
          variant="overline"
          color="text.secondary"
          sx={{ mb: 1, display: 'block', letterSpacing: 1 }}
        >
          {label}
        </Typography>
      )}
      <Stack direction={direction} spacing={1.5} flexWrap={wrap ? 'wrap' : 'nowrap'} alignItems="center">
        {children}
      </Stack>
    </Box>
  );
}

const TABLE_ROWS = [
  { name: 'Segment 1', status: 'Translated', words: 12 },
  { name: 'Segment 2', status: 'Draft', words: 8 },
  { name: 'Segment 3', status: 'Rejected', words: 21 },
];

export default function ComponentGallery() {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [snackOpen, setSnackOpen] = useState(false);
  const [tab, setTab] = useState(0);
  const [accordion, setAccordion] = useState(null);
  const [toggle, setToggle] = useState('bold');
  const [checked, setChecked] = useState(true);
  const [radio, setRadio] = useState('a');
  const [sw, setSw] = useState(true);
  const [sel, setSel] = useState('option1');

  return (
    <Box sx={{ p: 5, maxWidth: 1000, mx: 'auto' }}>
      <Typography variant="h3" sx={{ mb: 0.5 }}>
        Component Gallery
      </Typography>
      <Typography variant="body2" color="text.secondary" sx={{ mb: 8 }}>
        memoQ DS · MUI v7 · minden komponens egy helyen
      </Typography>

      {/* ── Typography ── */}
      <Section title="Typography">
        {[
          'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
          'subtitle1', 'subtitle2',
          'body1', 'body2',
          'button', 'caption', 'overline',
        ].map((v) => (
          <Typography key={v} variant={v} display="block" gutterBottom>
            <Box component="span" sx={{ color: 'text.disabled', mr: 1.5, fontFamily: 'monospace', fontSize: '0.75em' }}>
              {v}
            </Box>
            The quick brown fox jumps over the lazy dog
          </Typography>
        ))}
      </Section>

      {/* ── Palette ── */}
      <Section title="Palette">
        <Group label="main colors">
          {COLORS.map((c) => (
            <Box key={c} sx={{ textAlign: 'center' }}>
              <Stack>
                <Box sx={{ width: 80, height: 32, bgcolor: `${c}.light`, borderRadius: '4px 4px 0 0' }} />
                <Box sx={{ width: 80, height: 32, bgcolor: `${c}.main` }} />
                <Box sx={{ width: 80, height: 32, bgcolor: `${c}.dark`, borderRadius: '0 0 4px 4px' }} />
              </Stack>
              <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>{c}</Typography>
            </Box>
          ))}
        </Group>
        <Group label="neutral / surface">
          {[
            ['background.default', 'bg.default'],
            ['background.paper', 'bg.paper'],
            ['text.primary', 'text.primary'],
            ['text.secondary', 'text.secondary'],
            ['text.disabled', 'text.disabled'],
            ['divider', 'divider'],
          ].map(([token, label]) => (
            <Box key={token} sx={{ textAlign: 'center' }}>
              <Box
                sx={{
                  width: 80,
                  height: 48,
                  bgcolor: token,
                  border: 1,
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 0.5,
                }}
              />
              <Typography variant="caption" display="block">{label}</Typography>
            </Box>
          ))}
        </Group>
      </Section>

      {/* ── Button ── */}
      <Section title="Button">
        {['contained', 'outlined', 'text'].map((variant) => (
          <Group key={variant} label={variant}>
            {COLORS.map((color) => (
              <Button key={color} variant={variant} color={color}>
                {color}
              </Button>
            ))}
            <Button variant={variant} disabled>disabled</Button>
          </Group>
        ))}
        <Group label="sizes · contained primary">
          <Button variant="contained" size="small">small</Button>
          <Button variant="contained" size="medium">medium</Button>
          <Button variant="contained" size="large">large</Button>
        </Group>
        <Group label="with icon">
          <Button variant="contained" startIcon={<MqIcon name="archive" size={18} />}>
            Start icon
          </Button>
          <Button variant="outlined" endIcon={<MqIcon name="filter" size={18} />}>
            End icon
          </Button>
          <Button variant="text" startIcon={<MqIcon name="find" size={18} />}>
            Text + icon
          </Button>
        </Group>
      </Section>

      {/* ── IconButton ── */}
      <Section title="IconButton">
        <Group label="sizes">
          <IconButton size="small"><MqIcon name="archive" size={16} /></IconButton>
          <IconButton size="medium"><MqIcon name="archive" size={20} /></IconButton>
          <IconButton size="large"><MqIcon name="archive" size={24} /></IconButton>
        </Group>
        <Group label="colors">
          {COLORS.map((c) => (
            <IconButton key={c} color={c}><MqIcon name="archive" size={20} /></IconButton>
          ))}
          <IconButton disabled><MqIcon name="archive" size={20} /></IconButton>
        </Group>
      </Section>

      {/* ── Chip ── */}
      <Section title="Chip">
        <Group label="filled">
          <Chip label="default" />
          {COLORS.map((c) => <Chip key={c} label={c} color={c} />)}
          <Chip label="disabled" disabled />
        </Group>
        <Group label="outlined">
          <Chip label="default" variant="outlined" />
          {COLORS.map((c) => <Chip key={c} label={c} color={c} variant="outlined" />)}
        </Group>
        <Group label="with extras">
          <Chip icon={<MqIcon name="archive" size={16} />} label="with icon" />
          <Chip label="deletable" onDelete={() => {}} />
          <Chip avatar={<Avatar>A</Avatar>} label="with avatar" />
        </Group>
        <Group label="sizes">
          <Chip label="small" size="small" />
          <Chip label="medium" size="medium" />
        </Group>
      </Section>

      {/* ── TextField ── */}
      <Section title="TextField">
        {['outlined', 'filled', 'standard'].map((variant) => (
          <Group key={variant} label={variant}>
            <TextField variant={variant} label="Label" size="small" placeholder="Placeholder" sx={{ width: 180 }} />
            <TextField variant={variant} label="With value" size="small" defaultValue="Value" sx={{ width: 180 }} />
            <TextField
              variant={variant}
              label="Error"
              size="small"
              error
              helperText="Error message"
              sx={{ width: 180 }}
            />
            <TextField
              variant={variant}
              label="Disabled"
              size="small"
              disabled
              defaultValue="Value"
              sx={{ width: 180 }}
            />
          </Group>
        ))}
        <Group label="multiline">
          <TextField label="Multiline" multiline rows={3} sx={{ width: 320 }} />
        </Group>
      </Section>

      {/* ── Select ── */}
      <Section title="Select">
        <Group label="variants">
          {['outlined', 'filled', 'standard'].map((variant) => (
            <Box key={variant}>
              <Typography variant="caption" display="block" sx={{ mb: 0.5 }}>{variant}</Typography>
              <Select
                variant={variant}
                value={sel}
                onChange={(e) => setSel(e.target.value)}
                size="small"
                sx={{ width: 160 }}
              >
                <MenuItem value="option1">Option 1</MenuItem>
                <MenuItem value="option2">Option 2</MenuItem>
                <MenuItem value="option3">Option 3</MenuItem>
              </Select>
            </Box>
          ))}
        </Group>
      </Section>

      {/* ── Checkbox / Radio / Switch ── */}
      <Section title="Form Controls">
        <Group label="Checkbox" wrap>
          <FormControlLabel
            control={<Checkbox checked={checked} onChange={(e) => setChecked(e.target.checked)} />}
            label="Checked"
          />
          <FormControlLabel control={<Checkbox />} label="Unchecked" />
          <FormControlLabel control={<Checkbox indeterminate />} label="Indeterminate" />
          <FormControlLabel control={<Checkbox disabled />} label="Disabled" />
          <FormControlLabel control={<Checkbox checked disabled />} label="Checked disabled" />
        </Group>
        <Group label="Checkbox colors">
          {COLORS.map((c) => (
            <FormControlLabel key={c} control={<Checkbox checked color={c} />} label={c} />
          ))}
        </Group>
        <Group label="Radio">
          {['a', 'b', 'c'].map((v) => (
            <FormControlLabel
              key={v}
              control={<Radio checked={radio === v} onClick={() => setRadio(v)} />}
              label={`Option ${v.toUpperCase()}`}
            />
          ))}
          <FormControlLabel control={<Radio disabled />} label="Disabled" />
        </Group>
        <Group label="Switch">
          <FormControlLabel
            control={<Switch checked={sw} onChange={(e) => setSw(e.target.checked)} />}
            label="On"
          />
          <FormControlLabel control={<Switch />} label="Off" />
          <FormControlLabel control={<Switch disabled />} label="Disabled" />
        </Group>
        <Group label="Switch colors">
          {COLORS.map((c) => (
            <FormControlLabel key={c} control={<Switch checked color={c} />} label={c} />
          ))}
        </Group>
      </Section>

      {/* ── Slider ── */}
      <Section title="Slider">
        <Group label="continuous">
          <Slider defaultValue={40} sx={{ width: 240 }} />
        </Group>
        <Group label="discrete with marks">
          <Slider defaultValue={2} step={1} marks min={0} max={5} sx={{ width: 240 }} />
        </Group>
        <Group label="range">
          <Slider defaultValue={[25, 70]} sx={{ width: 240 }} />
        </Group>
        <Group label="colors">
          {COLORS.map((c) => (
            <Slider key={c} defaultValue={50} color={c} sx={{ width: 100 }} />
          ))}
        </Group>
      </Section>

      {/* ── Alert ── */}
      <Section title="Alert">
        {['error', 'warning', 'info', 'success'].map((severity) => (
          <Stack key={severity} spacing={1} sx={{ mb: 3 }}>
            {['standard', 'filled', 'outlined'].map((variant) => (
              <Alert key={variant} severity={severity} variant={variant}>
                <strong>{severity}</strong> · {variant} — Something happened that requires attention.
              </Alert>
            ))}
          </Stack>
        ))}
      </Section>

      {/* ── Tabs ── */}
      <Section title="Tabs">
        <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 2 }}>
          <Tabs value={tab}>
            {['Tab one', 'Tab two', 'Tab three', 'Disabled'].map((label, i) => (
              <Tab
                key={label}
                label={label}
                disabled={label === 'Disabled'}
                onClick={() => label !== 'Disabled' && setTab(i)}
                sx={{ color: tab === i ? 'primary.main' : undefined }}
              />
            ))}
          </Tabs>
        </Box>
        <Typography variant="body2" color="text.secondary">
          Active: tab {tab + 1}
        </Typography>
      </Section>

      {/* ── Accordion ── */}
      <Section title="Accordion">
        {['Panel one', 'Panel two', 'Panel three'].map((label, i) => {
          const expanded = accordion === i;
          return (
            <Accordion key={i} expanded={expanded}>
              <AccordionSummary
                expandIcon={
                  <MqIcon
                    name="chevron_down"
                    size={20}
                    style={{
                      transform: expanded ? 'rotate(180deg)' : 'rotate(0deg)',
                      transition: 'transform 200ms',
                    }}
                  />
                }
                onClick={() => setAccordion(expanded ? null : i)}
              >
                <Typography>{label}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Typography variant="body2">
                  Content for {label}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
                </Typography>
              </AccordionDetails>
            </Accordion>
          );
        })}
      </Section>

      {/* ── ToggleButtonGroup ── */}
      <Section title="ToggleButtonGroup">
        <Group label="exclusive">
          <ToggleButtonGroup value={toggle}>
            {[
              { value: 'bold', icon: 'bold' },
              { value: 'italic', icon: 'italic' },
              { value: 'underlined', icon: 'underlined' },
            ].map(({ value, icon }) => (
              <ToggleButton
                key={value}
                value={value}
                selected={toggle === value}
                onClick={() => setToggle(value)}
              >
                <MqIcon name={icon} size={18} />
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Group>
        <Group label="sizes">
          {['small', 'medium', 'large'].map((size) => (
            <ToggleButton key={size} value={size} selected={false} size={size}>
              {size}
            </ToggleButton>
          ))}
        </Group>
      </Section>

      {/* ── List ── */}
      <Section title="List">
        <Stack direction="row" spacing={3} flexWrap="wrap">
          <Paper variant="outlined" sx={{ width: 280 }}>
            <List dense disablePadding>
              {['Item one', 'Item two', 'Item three'].map((item, i) => (
                <ListItem key={i} disablePadding>
                  <ListItemButton selected={i === 1}>
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <MqIcon name="archive" size={18} />
                    </ListItemIcon>
                    <ListItemText primary={item} secondary={i === 1 ? 'Selected' : null} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>
          <Paper variant="outlined" sx={{ width: 280 }}>
            <List dense disablePadding>
              {['Item one', 'Item two (disabled)', 'Item three'].map((item, i) => (
                <ListItem key={i} disablePadding>
                  <ListItemButton disabled={i === 1}>
                    <ListItemText primary={item} />
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
          </Paper>
        </Stack>
      </Section>

      {/* ── Table ── */}
      <Section title="Table">
        <TableContainer component={Paper} variant="outlined">
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Segment</TableCell>
                <TableCell>Status</TableCell>
                <TableCell align="right">Words</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {TABLE_ROWS.map((row) => (
                <TableRow key={row.name} hover>
                  <TableCell>{row.name}</TableCell>
                  <TableCell>{row.status}</TableCell>
                  <TableCell align="right">{row.words}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Section>

      {/* ── Paper ── */}
      <Section title="Paper">
        <Group label="elevation">
          {[0, 1, 2, 4, 8, 16, 24].map((e) => (
            <Paper key={e} elevation={e} sx={{ p: 2, width: 72, textAlign: 'center' }}>
              <Typography variant="caption">elev {e}</Typography>
            </Paper>
          ))}
          <Paper variant="outlined" sx={{ p: 2, width: 72, textAlign: 'center' }}>
            <Typography variant="caption">outlined</Typography>
          </Paper>
        </Group>
      </Section>

      {/* ── Card ── */}
      <Section title="Card">
        <Stack direction="row" spacing={2} flexWrap="wrap">
          <Card sx={{ width: 240 }}>
            <CardHeader title="Card title" subheader="Subheader text" />
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Card content goes here. Short description of the item.
              </Typography>
            </CardContent>
            <CardActions>
              <Button size="small">Action</Button>
              <Button size="small" color="error">Delete</Button>
            </CardActions>
          </Card>
          <Card variant="outlined" sx={{ width: 240 }}>
            <CardHeader title="Outlined card" subheader="Subheader text" />
            <CardContent>
              <Typography variant="body2" color="text.secondary">
                Outlined variant. No elevation shadow.
              </Typography>
            </CardContent>
          </Card>
        </Stack>
      </Section>

      {/* ── Avatar ── */}
      <Section title="Avatar">
        <Group label="types">
          <Avatar>A</Avatar>
          <Avatar sx={{ bgcolor: 'primary.main' }}>GB</Avatar>
          <Avatar sx={{ bgcolor: 'secondary.main' }}>MQ</Avatar>
          <Avatar sx={{ bgcolor: 'error.main' }}>!</Avatar>
        </Group>
        <Group label="sizes">
          {[24, 32, 40, 56, 72].map((s) => (
            <Avatar key={s} sx={{ width: s, height: s, bgcolor: 'primary.main', fontSize: s * 0.45 }}>
              {s}
            </Avatar>
          ))}
        </Group>
        <Group label="colors">
          {COLORS.map((c) => (
            <Avatar key={c} sx={{ bgcolor: `${c}.main` }}>
              {c[0].toUpperCase()}
            </Avatar>
          ))}
        </Group>
      </Section>

      {/* ── Badge ── */}
      <Section title="Badge">
        <Group label="colors">
          {COLORS.map((c) => (
            <Badge key={c} badgeContent={4} color={c}>
              <MqIcon name="archive" size={24} />
            </Badge>
          ))}
        </Group>
        <Group label="variants">
          <Badge badgeContent={99} max={99} color="primary">
            <MqIcon name="archive" size={24} />
          </Badge>
          <Badge badgeContent={1000} color="primary">
            <MqIcon name="archive" size={24} />
          </Badge>
          <Badge variant="dot" color="error">
            <MqIcon name="archive" size={24} />
          </Badge>
          <Badge variant="dot" color="success">
            <MqIcon name="archive" size={24} />
          </Badge>
        </Group>
      </Section>

      {/* ── Tooltip ── */}
      <Section title="Tooltip">
        <Group label="placements">
          {['top', 'right', 'bottom', 'left'].map((p) => (
            <Tooltip key={p} title={`Tooltip on ${p}`} placement={p} arrow>
              <Button variant="outlined" size="small">{p}</Button>
            </Tooltip>
          ))}
        </Group>
      </Section>

      {/* ── Progress ── */}
      <Section title="Progress">
        <Group label="LinearProgress" direction="column" wrap={false}>
          <Box sx={{ width: 320 }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
              indeterminate
            </Typography>
            <LinearProgress />
          </Box>
          <Box sx={{ width: 320 }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
              determinate · 60%
            </Typography>
            <LinearProgress variant="determinate" value={60} />
          </Box>
          <Box sx={{ width: 320 }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
              buffer
            </Typography>
            <LinearProgress variant="buffer" value={60} valueBuffer={80} />
          </Box>
          <Box sx={{ width: 320 }}>
            <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 0.5 }}>
              secondary
            </Typography>
            <LinearProgress color="secondary" />
          </Box>
        </Group>
        <Group label="CircularProgress">
          <CircularProgress />
          <CircularProgress variant="determinate" value={75} />
          <CircularProgress color="secondary" />
          <CircularProgress size={20} />
          <CircularProgress size={60} />
        </Group>
      </Section>

      {/* ── Skeleton ── */}
      <Section title="Skeleton">
        <Stack spacing={1} sx={{ width: 320 }}>
          <Skeleton variant="text" sx={{ fontSize: '1rem' }} />
          <Skeleton variant="text" sx={{ fontSize: '1rem' }} width="80%" />
          <Stack direction="row" spacing={2} alignItems="center">
            <Skeleton variant="circular" width={40} height={40} />
            <Box sx={{ flex: 1 }}>
              <Skeleton variant="text" />
              <Skeleton variant="text" width="60%" />
            </Box>
          </Stack>
          <Skeleton variant="rectangular" width={320} height={80} />
          <Skeleton variant="rounded" width={320} height={60} />
        </Stack>
      </Section>

      {/* ── Divider ── */}
      <Section title="Divider">
        <Stack spacing={2} sx={{ mb: 2 }}>
          <Divider />
          <Divider textAlign="left">
            <Typography variant="caption">Left label</Typography>
          </Divider>
          <Divider textAlign="center">
            <Typography variant="caption">Center label</Typography>
          </Divider>
          <Divider textAlign="right">
            <Typography variant="caption">Right label</Typography>
          </Divider>
        </Stack>
        <Stack direction="row" spacing={3} alignItems="center" sx={{ height: 40 }}>
          <Typography variant="body2">Vertical</Typography>
          <Divider orientation="vertical" flexItem />
          <Typography variant="body2">dividers</Typography>
          <Divider orientation="vertical" flexItem />
          <Typography variant="body2">between items</Typography>
        </Stack>
      </Section>

      {/* ── Breadcrumbs & Link ── */}
      <Section title="Breadcrumbs & Link">
        <Breadcrumbs sx={{ mb: 3 }}>
          <Link href="#" underline="hover" color="inherit">Home</Link>
          <Link href="#" underline="hover" color="inherit">Projects</Link>
          <Typography color="text.primary">Current page</Typography>
        </Breadcrumbs>
        <Group label="Link underline variants">
          {['always', 'hover', 'none'].map((u) => (
            <Link key={u} href="#" underline={u} sx={{ mr: 1 }}>
              underline="{u}"
            </Link>
          ))}
        </Group>
        <Group label="Link colors">
          {COLORS.map((c) => (
            <Link key={c} href="#" color={`${c}.main`} underline="hover">{c}</Link>
          ))}
        </Group>
      </Section>

      {/* ── Pagination ── */}
      <Section title="Pagination">
        <Group label="default">
          <Pagination count={10} page={3} />
        </Group>
        <Group label="outlined">
          <Pagination count={10} page={3} variant="outlined" />
        </Group>
        <Group label="outlined rounded">
          <Pagination count={10} page={3} variant="outlined" shape="rounded" />
        </Group>
        <Group label="sizes">
          <Pagination count={5} size="small" />
          <Pagination count={5} size="medium" />
          <Pagination count={5} size="large" />
        </Group>
        <Group label="colors">
          {COLORS.slice(0, 3).map((c) => (
            <Pagination key={c} count={5} page={2} color={c} />
          ))}
        </Group>
      </Section>

      {/* ── Dialog ── */}
      <Section title="Dialog">
        <Button variant="outlined" onClick={() => setDialogOpen(true)}>
          Open dialog
        </Button>
        <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
          <DialogTitle>Dialog title</DialogTitle>
          <DialogContent>
            <Typography sx={{ mb: 2 }}>
              This is the dialog content area. It can contain any content.
            </Typography>
            <TextField label="Input inside dialog" size="small" fullWidth />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button variant="contained" onClick={() => setDialogOpen(false)}>
              Confirm
            </Button>
          </DialogActions>
        </Dialog>
      </Section>

      {/* ── Snackbar ── */}
      <Section title="Snackbar">
        <Button variant="outlined" onClick={() => setSnackOpen(true)}>
          Show snackbar
        </Button>
        <Snackbar
          open={snackOpen}
          autoHideDuration={3000}
          onClose={() => setSnackOpen(false)}
          message="Action completed successfully"
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
        />
      </Section>
    </Box>
  );
}
