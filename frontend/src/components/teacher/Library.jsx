import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Chip } from '@mui/material';

const Library = () => {
  const resources = [
    { title: 'Clean Architecture (Slides)', status: 'Shared' },
    { title: 'SQL Practice Set', status: 'Shared' },
    { title: 'OS Lab Sheet 3', status: 'Draft' },
  ];
  const color = (s) => (s === 'Shared' ? 'success' : 'default');
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Library Resources
      </Typography>
      <Paper>
        <List>
          {resources.map((r, i) => (
            <ListItem key={i} divider>
              <ListItemText primary={r.title} />
              <Chip label={r.status} color={color(r.status)} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default Library;


