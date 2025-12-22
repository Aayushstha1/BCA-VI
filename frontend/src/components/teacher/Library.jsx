import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  CircularProgress,
} from '@mui/material';
import { LibraryBooks as LibraryIcon, Add as AddIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const Library = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    author: '',
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const queryClient = useQueryClient();

  const { data: books, isLoading, isError } = useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const res = await axios.get('/library/books/');
      return res.data;
    },
  });

  const createBookMutation = useMutation({
    mutationFn: async ({ title, author, file }) => {
      const formDataToSend = new FormData();
      formDataToSend.append('title', title);
      formDataToSend.append('author', author);
      // Backend requires a category; default to "other" when adding from teacher UI
      formDataToSend.append('category', 'other');
      // Sensible defaults so backend validations pass
      formDataToSend.append('total_copies', '1');
      formDataToSend.append('available_copies', '1');
      if (file) {
        formDataToSend.append('file', file);
      }
      const res = await axios.post('/library/books/', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['books']);
      setOpenDialog(false);
      setFormData({
        title: '',
        author: '',
      });
      setFile(null);
    },
    onError: (e) => setError(e.response?.data?.message || 'Failed to add book'),
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleFileChange = (e) => {
    const selected = e.target.files && e.target.files[0];
    setFile(selected || null);
    setError('');
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return <Alert severity="error">Failed to load books.</Alert>;
  }

  const booksArray = Array.isArray(books) ? books : books?.results || [];

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <LibraryIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4">Library</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setOpenDialog(true);
            setError('');
          }}
        >
          Add Book
        </Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Books ({booksArray.length})
        </Typography>
        {booksArray.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No books found. Add your first book!
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Author</TableCell>
                  <TableCell>PDF</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {booksArray.map((book) => {
                  const filePath = book.file_url || book.file;
                  let href = filePath || '';
                  if (href && !href.startsWith('http')) {
                    const base = (axios.defaults.baseURL || '').replace('/api', '');
                    href = `${base}${href}`;
                  }
                  return (
                    <TableRow key={book.id}>
                      <TableCell>{book.title}</TableCell>
                      <TableCell>{book.author}</TableCell>
                      <TableCell>
                        {filePath ? (
                          <a href={href} target="_blank" rel="noopener noreferrer">
                            Open PDF
                          </a>
                        ) : (
                          '-'
                        )}
                      </TableCell>
                      <TableCell>
                        <Chip
                          label={book.is_active ? 'Active' : 'Inactive'}
                          color={book.is_active ? 'success' : 'default'}
                          size="small"
                        />
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add Book Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Book</DialogTitle>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setLoading(true);
            createBookMutation.mutate(
              { title: formData.title, author: formData.author, file },
              {
              onSettled: () => setLoading(false),
              },
            );
          }}
        >
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Author"
                  name="author"
                  value={formData.author}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="file"
                  inputProps={{ accept: 'application/pdf' }}
                  onChange={handleFileChange}
                  helperText="Upload book PDF (optional)"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Create'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Library;


