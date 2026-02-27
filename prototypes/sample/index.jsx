import {
  Box,
  Typography,
  Button,
  Stack,
  TextField,
  Card,
  CardContent,
  CardActions,
  Chip,
} from '@mui/material';

export default function SamplePrototype() {
  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        Sample Prototype
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        This is a sample Claude Code-generated prototype to verify the rendering pipeline.
      </Typography>
      <Stack spacing={2}>
        <TextField label="Email" variant="outlined" fullWidth />
        <TextField label="Password" type="password" variant="outlined" fullWidth />
        <Card variant="outlined">
          <CardContent>
            <Typography variant="h6">Card Title</Typography>
            <Typography variant="body2" color="text.secondary">
              Card content with some descriptive text about the design system component.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
              <Chip label="Tag 1" size="small" />
              <Chip label="Tag 2" size="small" color="primary" />
            </Stack>
          </CardContent>
          <CardActions>
            <Button size="small">Learn More</Button>
          </CardActions>
        </Card>
        <Stack direction="row" spacing={2}>
          <Button variant="contained">Submit</Button>
          <Button variant="outlined">Cancel</Button>
        </Stack>
      </Stack>
    </Box>
  );
}
