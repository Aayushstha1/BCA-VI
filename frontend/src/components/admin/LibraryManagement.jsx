import React, { useState } from 'react';
import { Box, Typography, Paper, Alert, Button, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Grid, CircularProgress, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, IconButton, Tooltip, Chip, FormControl, InputLabel, Select, MenuItem } from '@mui/material';
import { LibraryBooks as LibraryIcon, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const categories = ['textbook', 'reference', 'novel', 'magazine', 'journal', 'other'];

const LibraryManagement = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedBook, setSelectedBook] = useState(null);
  const [formData, setFormData] = useState({
    title: '', author: '', isbn: '', category: 'textbook', publisher: '', publication_year: '', total_copies: 1, available_copies: 1, shelf_number: '', description: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const queryClient = useQueryClient();

  const { data: books, isLoading } = useQuery({
    queryKey: ['books'],
    queryFn: async () => {
      const res = await axios.get('/library/books/');
      return res.data;
    }
  });

  const createBookMutation = useMutation({
    mutationFn: async (book) => {
      const payload = { ...book };
      Object.keys(payload).forEach((k) => { if (payload[k] === '') delete payload[k]; });
      const res = await axios.post('/library/books/', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['books']);
      setOpenDialog(false);
      setFormData({ title: '', author: '', isbn: '', category: 'textbook', publisher: '', publication_year: '', total_copies: 1, available_copies: 1, shelf_number: '', description: '' });
    },
    onError: (e) => setError(e.response?.data?.message || 'Failed to create book')
  });

  const updateBookMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const payload = { ...updates };
      Object.keys(payload).forEach((k) => { if (payload[k] === '') delete payload[k]; });
      const res = await axios.put(`/library/books/${id}/`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['books']);
      setOpenEditDialog(false);
      setSelectedBook(null);
    },
    onError: (e) => setError(e.response?.data?.message || 'Failed to update book')
  });

  const deleteBookMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`/library/books/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['books']);
      setOpenDeleteDialog(false);
      setSelectedBook(null);
    },
    onError: (e) => setError(e.response?.data?.message || 'Failed to delete book')
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  const booksArray = Array.isArray(books) ? books : (books?.results || []);

  return (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={3}>
        <Box display="flex" alignItems="center">
          <LibraryIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4">Library Management</Typography>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => { setOpenDialog(true); setError(''); }}>Add Book</Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>Books ({booksArray.length})</Typography>
        {booksArray.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>No books found. Add your first book!</Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Author</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>ISBN</TableCell>
                  <TableCell>Copies</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {booksArray.map((book) => (
                  <TableRow key={book.id}>
                    <TableCell>{book.title}</TableCell>
                    <TableCell>{book.author}</TableCell>
                    <TableCell>{book.category}</TableCell>
                    <TableCell>{book.isbn || '-'}</TableCell>
                    <TableCell>{book.available_copies}/{book.total_copies}</TableCell>
                    <TableCell>
                      <Chip label={book.is_active ? 'Active' : 'Inactive'} color={book.is_active ? 'success' : 'default'} size="small" />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => {
                          setSelectedBook(book);
                          setFormData({
                            title: book.title || '', author: book.author || '', isbn: book.isbn || '', category: book.category || 'textbook', publisher: book.publisher || '', publication_year: book.publication_year || '', total_copies: book.total_copies || 1, available_copies: book.available_copies || 1, shelf_number: book.shelf_number || '', description: book.description || ''
                          });
                          setOpenEditDialog(true);
                          setError('');
                        }}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => { setSelectedBook(book); setOpenDeleteDialog(true); setError(''); }}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Create Book Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Add Book</DialogTitle>
        <form onSubmit={(e) => { e.preventDefault(); setLoading(true); createBookMutation.mutate(formData); setLoading(false); }}>
          <DialogContent>
            {error && (<Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>)}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Title" name="title" value={formData.title} onChange={handleInputChange} required /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Author" name="author" value={formData.author} onChange={handleInputChange} required /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="ISBN" name="isbn" value={formData.isbn} onChange={handleInputChange} /></Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select name="category" value={formData.category} label="Category" onChange={handleInputChange}>
                    {categories.map((c) => (<MenuItem key={c} value={c}>{c}</MenuItem>))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Publisher" name="publisher" value={formData.publisher} onChange={handleInputChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Publication Year" name="publication_year" type="number" value={formData.publication_year} onChange={handleInputChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Total Copies" name="total_copies" type="number" value={formData.total_copies} onChange={handleInputChange} required /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Available Copies" name="available_copies" type="number" value={formData.available_copies} onChange={handleInputChange} required /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Shelf Number" name="shelf_number" value={formData.shelf_number} onChange={handleInputChange} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Description" name="description" value={formData.description} onChange={handleInputChange} multiline rows={3} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>{loading ? <CircularProgress size={24} /> : 'Create'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Book Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Book</DialogTitle>
        <form onSubmit={(e) => { e.preventDefault(); if (!selectedBook) return; setLoading(true); updateBookMutation.mutate({ id: selectedBook.id, updates: formData }); setLoading(false); }}>
          <DialogContent>
            {error && (<Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>)}
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Title" name="title" value={formData.title} onChange={handleInputChange} required /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Author" name="author" value={formData.author} onChange={handleInputChange} required /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="ISBN" name="isbn" value={formData.isbn} onChange={handleInputChange} /></Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select name="category" value={formData.category} label="Category" onChange={handleInputChange}>
                    {categories.map((c) => (<MenuItem key={c} value={c}>{c}</MenuItem>))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Publisher" name="publisher" value={formData.publisher} onChange={handleInputChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Publication Year" name="publication_year" type="number" value={formData.publication_year} onChange={handleInputChange} /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Total Copies" name="total_copies" type="number" value={formData.total_copies} onChange={handleInputChange} required /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Available Copies" name="available_copies" type="number" value={formData.available_copies} onChange={handleInputChange} required /></Grid>
              <Grid item xs={12} sm={6}><TextField fullWidth label="Shelf Number" name="shelf_number" value={formData.shelf_number} onChange={handleInputChange} /></Grid>
              <Grid item xs={12}><TextField fullWidth label="Description" name="description" value={formData.description} onChange={handleInputChange} multiline rows={3} /></Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>{loading ? <CircularProgress size={24} /> : 'Save'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Book */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete Book</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this book?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => { if (selectedBook) deleteBookMutation.mutate(selectedBook.id); }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default LibraryManagement;
