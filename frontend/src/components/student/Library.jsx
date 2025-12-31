import React from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
  Chip,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const Library = () => {
  const { user } = useAuth();

  // Fetch books issued to students
  const {
    data: issues,
    isLoading: isIssuesLoading,
    isError: isIssuesError,
  } = useQuery({
    queryKey: ['library-issues'],
    queryFn: async () => {
      const res = await axios.get('/library/issues/');
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
      return list;
    },
  });

  // Fetch all books
  const {
    data: books,
    isLoading: isBooksLoading,
    isError: isBooksError,
  } = useQuery({
    queryKey: ['library-books-student'],
    queryFn: async () => {
      const res = await axios.get('/library/books/');
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
      return list;
    },
  });

  // Filter issues for current student
  const myIssuedBooks = (issues || []).filter((i) =>
    !i.student || !user
      ? true
      : (i.student === user.id || i.student_id || '').toString().length > 0
  );

  const statusColor = (status) => (status === 'Issued' ? 'warning' : 'success');

  if (isIssuesLoading || isBooksLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isIssuesError || isBooksError) {
    return <Alert severity="error">Failed to load library data.</Alert>;
  }

  const booksArray = books || [];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Library
      </Typography>

      {/* Books issued to this student */}
      <Paper sx={{ mb: 2 }}>
        <Typography variant="h6" sx={{ px: 2, pt: 2 }}>
          My Issued Books
        </Typography>
        <List>
          {myIssuedBooks.length === 0 && (
            <ListItem>
              <ListItemText primary="No books issued yet." />
            </ListItem>
          )}
          {myIssuedBooks.map((b, i) => (
            <ListItem key={i} divider>
              <ListItemText
                primary={b.book_title || b.book?.title || 'Book'}
                secondary={`Due: ${b.due_date || '-'}`}
              />
              <Chip
                label={(b.status || '').charAt(0).toUpperCase() + (b.status || '').slice(1)}
                color={statusColor((b.status || '').charAt(0).toUpperCase() + (b.status || '').slice(1))}
              />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Divider sx={{ my: 2 }} />

      {/* All available books */}
      <Paper>
        <Typography variant="h6" sx={{ px: 2, pt: 2 }}>
          Available Books
        </Typography>
        <List>
          {booksArray.length === 0 && (
            <ListItem>
              <ListItemText primary="No books available in library." />
            </ListItem>
          )}
          {booksArray.map((book) => {
            let fileUrl = book.file_url || book.file;
            if (fileUrl && !fileUrl.startsWith('http')) {
              fileUrl = `${axios.defaults.baseURL.replace('/api', '')}${fileUrl}`;
            }
            return (
              <ListItem key={book.id} divider>
                <ListItemText primary={book.title} secondary={book.author || ''} />
                {fileUrl ? (
                  <Chip
                    label="Open PDF"
                    component="a"
                    href={fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    clickable
                    color="primary"
                  />
                ) : (
                  <Chip label="No PDF" size="small" />
                )}
              </ListItem>
            );
          })}
        </List>
      </Paper>
    </Box>
  );
};

export default Library;
