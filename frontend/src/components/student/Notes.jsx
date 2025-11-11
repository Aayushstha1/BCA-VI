import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Chip } from '@mui/material';

const Notes = () => {
  const notes = [
    { subject: 'Mathematics I', title: 'Integration Techniques', tag: 'PDF' },
    { subject: 'Programming', title: 'JS Promises', tag: 'Article' },
    { subject: 'Physics', title: 'Waves and Optics', tag: 'Slides' },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Notes
      </Typography>
      <Paper>
        <List>
          {notes.map((n, i) => (
            <ListItem key={i} divider>
              <ListItemText
                primary={n.title}
                secondary={n.subject}
              />
              <Chip label={n.tag} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default Notes;


