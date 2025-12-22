import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
} from '@mui/material';
import { Note as NoteIcon, Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import IconButton from '@mui/material/IconButton';
import Tooltip from '@mui/material/Tooltip';

const NotesManagement = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    category: '',
  });
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const queryClient = useQueryClient();

  const { data: notes, isLoading, isError } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const res = await axios.get('/notes/');
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
      return list;
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async ({ title, subject, category, file }) => {
      const formDataToSend = new FormData();
      formDataToSend.append('title', title);
      if (subject) formDataToSend.append('subject', subject);
      if (category) formDataToSend.append('category', category);
      if (file) {
        formDataToSend.append('file', file);
      }
      const res = await axios.post('/notes/', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notes']);
      setOpenDialog(false);
      setFormData({
        title: '',
        subject: '',
        category: '',
      });
      setFile(null);
    },
    onError: (e) => {
      setError(e.response?.data?.message || 'Failed to create note');
    },
  });

  const deleteNoteMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`/notes/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notes']);
    },
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
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isError) {
    return <Alert severity="error">Failed to load notes.</Alert>;
  }

  const notesArray = notes || [];

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3} justifyContent="space-between">
        <Box display="flex" alignItems="center">
          <NoteIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4">Notes Management</Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setOpenDialog(true);
            setError('');
          }}
        >
          Add Note
        </Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Notes ({notesArray.length})
        </Typography>
        {notesArray.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No notes found. Add your first note!
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Title</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Category</TableCell>
                  <TableCell>File</TableCell>
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {notesArray.map((n) => (
                  <TableRow key={n.id}>
                    <TableCell>{n.title || 'Note'}</TableCell>
                    <TableCell>{n.subject_name || n.subject || '-'}</TableCell>
                    <TableCell>
                      <Chip label={n.category_name || n.category || 'File'} size="small" />
                    </TableCell>
                    <TableCell>
                      {(() => {
                        const filePath = n.file_url || n.file;
                        if (!filePath) return '-';
                        let href = filePath;
                        if (href && !href.startsWith('http')) {
                          const base = (axios.defaults.baseURL || '').replace('/api', '');
                          href = `${base}${href}`;
                        }
                        return (
                          <a href={href} target="_blank" rel="noopener noreferrer">
                            Open
                          </a>
                        );
                      })()}
                    </TableCell>
                    <TableCell align="right">
                      <Tooltip title="Delete">
                        <IconButton
                          size="small"
                          color="error"
                          onClick={() => deleteNoteMutation.mutate(n.id)}
                        >
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

      {/* Add Note Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Note</DialogTitle>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setLoading(true);
            createNoteMutation.mutate(formData, {
              onSettled: () => setLoading(false),
            });
          }}
        >
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Category"
                  name="category"
                  value={formData.category}
                  onChange={handleInputChange}
                  helperText="e.g., PDF, Slides, Assignment"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="File URL"
                  name="file_url"
                  value={formData.file_url}
                  onChange={handleInputChange}
                  helperText="Paste link to file (Drive, S3, etc.)"
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

export default NotesManagement;
