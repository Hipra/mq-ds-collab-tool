import { Box, Button, Stack, TextField, Typography } from '@mui/material';

export default function Screen() {
  return (
    <Box sx={{ p: 3, maxWidth: 480 }}>
      <Typography variant="h6" sx={{ mb: 3 }}>Form</Typography>
      <Stack spacing={2}>
        <TextField label="Name" size="small" fullWidth />
        <TextField label="Email" size="small" fullWidth />
        <TextField label="Message" size="small" fullWidth multiline rows={3} />
        <Button variant="contained" sx={{ alignSelf: 'flex-start' }}>Submit</Button>
      </Stack>
    </Box>
  );
}
