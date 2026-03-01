import { Box, Button, IconButton, Stack } from '@mui/material';
import { MqIcon } from '@mq/icons';

export default function Prototype() {
  return (
    <Box sx={{ p: 3 }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Button variant="outlined" size="small" color="secondary">Test approve</Button>
        <IconButton size="small">
          <MqIcon name="archive" />
        </IconButton>
        <MqIcon name="check" size={24} color="#09AE67" />
        <MqIcon name="alert-filled" size={32} color="#EF3F3F" />
        <MqIcon name="archive" color="primary" />
      </Stack>
    </Box>
  );
}
