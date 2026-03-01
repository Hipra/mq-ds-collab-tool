import { Box, Card, CardContent, Chip, Stack, Typography } from '@mui/material';

export default function Screen() {
  const items = [
    { title: 'Item one', description: 'Description for item one', status: 'Active' },
    { title: 'Item two', description: 'Description for item two', status: 'Draft' },
    { title: 'Item three', description: 'Description for item three', status: 'Active' },
  ];

  return (
    <Box sx={{ p: 3 }}>
      <Typography variant="h6" sx={{ mb: 2 }}>List</Typography>
      <Stack spacing={2}>
        {items.map((item) => (
          <Card key={item.title} variant="outlined">
            <CardContent>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <Box>
                  <Typography variant="subtitle2">{item.title}</Typography>
                  <Typography variant="body2" color="text.secondary">{item.description}</Typography>
                </Box>
                <Chip label={item.status} size="small" />
              </Box>
            </CardContent>
          </Card>
        ))}
      </Stack>
    </Box>
  );
}
