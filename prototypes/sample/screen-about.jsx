import { Box, Typography, Button, Stack } from '@mui/material';

export default function AboutScreen() {
  return (
    <Box sx={{ p: 3, maxWidth: 600, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>
        About Page
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        This is the about screen of the sample prototype.
      </Typography>
      <Stack direction="row" spacing={2}>
        <Button variant="contained">Contact Us</Button>
        <Button variant="outlined">Go Back</Button>
      </Stack>
    </Box>
  );
}
