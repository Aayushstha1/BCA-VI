import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Chip } from '@mui/material';

const Notes = () => {
  const notes = [
    { title: 'DS: Trees and Graphs', tag: 'PDF' },
    { title: 'DBMS: Normalization', tag: 'Slides' },
    { title: 'OS: Scheduling', tag: 'Article' },
  ];
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Notes & Materials
      </Typography>
      <Paper>
        <List>
          {notes.map((n, i) => (
            <ListItem key={i} divider>
              <ListItemText primary={n.title} />
              <Chip label={n.tag} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default Notes;


