import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Chip, CircularProgress, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const Notes = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const res = await axios.get('/notes/');
      const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      return list.slice(0, 10);
    },
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }
  if (isError) {
    return <Alert severity="error">Failed to load notes.</Alert>;
  }

  const notes = data || [];

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
                primary={n.title || 'Note'}
                secondary={n.subject_name || n.subject || ''}
              />
              <Chip label={n.category_name || n.tag || 'File'} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default Notes;


