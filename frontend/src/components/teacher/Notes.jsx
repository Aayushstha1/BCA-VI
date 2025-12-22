import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  List,
  ListItem,
  ListItemText,
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
import { Add as AddIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const Notes = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    subject: '',
    category: '',
    file_url: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => {
      const res = await axios.get('/notes/');
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
      return list;
    },
  });

  const createNoteMutation = useMutation({
    mutationFn: async (note) => {
      const payload = { ...note };
      Object.keys(payload).forEach((k) => {
        if (payload[k] === '') delete payload[k];
      });
      const res = await axios.post('/notes/', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notes']);
      setOpenDialog(false);
      setFormData({
        title: '',
        subject: '',
        category: '',
        file_url: '',
      });
    },
    onError: (e) => setError(e.response?.data?.message || 'Failed to create note'),
  });

  const handleInputChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
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

  const notes = data || [];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">Notes & Materials</Typography>
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
      <Paper>
        <List>
          {notes.map((n, i) => (
            <ListItem key={n.id || i} divider>
              <ListItemText
                primary={n.title || 'Note'}
                secondary={n.subject_name || n.subject || ''}
              />
              <Chip label={n.category_name || n.category || 'File'} />
            </ListItem>
          ))}
          {notes.length === 0 && (
            <ListItem>
              <ListItemText
                primary="No notes yet."
                secondary="Use 'Add Note' to upload study material."
              />
            </ListItem>
          )}
        </List>
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
                  helperText="Paste link to the file"
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

export default Notes;


