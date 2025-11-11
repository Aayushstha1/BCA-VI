import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Chip } from '@mui/material';

const Library = () => {
  const items = [
    { title: 'Clean Code', due: '2025-11-20', status: 'Issued' },
    { title: 'Introduction to Algorithms', due: '2025-11-25', status: 'Issued' },
    { title: 'Database System Concepts', due: '-', status: 'Returned' },
  ];

  const color = (status) => (status === 'Issued' ? 'warning' : 'success');

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Library Records
      </Typography>
      <Paper>
        <List>
          {items.map((b, i) => (
            <ListItem key={i} divider>
              <ListItemText
                primary={b.title}
                secondary={`Due: ${b.due}`}
              />
              <Chip label={b.status} color={color(b.status)} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default Library;


