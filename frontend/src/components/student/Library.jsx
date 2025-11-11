import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Chip, CircularProgress, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const Library = () => {
  const { user } = useAuth();
  const { data: issues, isLoading, isError } = useQuery({
    queryKey: ['library-issues'],
    queryFn: async () => {
      const res = await axios.get('/library/issues/');
      const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      return list;
    },
  });

  const items = (issues || []).filter((i) => {
    // Match by student_name/id when available; fallback to show all
    return !i.student || !user ? true : (i.student === user.id || i.student_id || '').toString().length > 0;
  });

  const color = (status) => (status === 'Issued' ? 'warning' : 'success');

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }
  if (isError) {
    return <Alert severity="error">Failed to load library records.</Alert>;
  }

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
                primary={b.book_title || b.book?.title || 'Book'}
                secondary={`Due: ${b.due_date || '-'}`}
              />
              <Chip label={(b.status || '').charAt(0).toUpperCase() + (b.status || '').slice(1)} color={color((b.status || '').charAt(0).toUpperCase() + (b.status || '').slice(1))} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default Library;


