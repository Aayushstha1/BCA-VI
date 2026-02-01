import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, TextField, Button, Grid, List, ListItem, ListItemText, IconButton, CircularProgress, Alert, FormControl, Dialog, DialogTitle, DialogContent, DialogActions } from '@mui/material';
import { Upload as UploadIcon, Delete as DeleteIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const MyCVs = () => {
  const { user } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [file, setFile] = useState(null);
  const [isPrimary, setIsPrimary] = useState(false);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [ratingDialogOpen, setRatingDialogOpen] = useState(false);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingTarget, setRatingTarget] = useState(null);

  useEffect(() => {
    fetchCVs();
  }, []);

  const fetchCVs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const resp = await axios.get(`${API_BASE_URL}/students/cvs/`, { headers: { Authorization: `Token ${token}` } });
      const results = resp.data.results || resp.data;
      setCvs(results);
    } catch (err) {
      setError('Failed to load CVs');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleSubmit = async () => {
    if (!title) {
      setError('Please enter a title');
      return;
    }
    setSubmitting(true);
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', title);
      formData.append('summary', summary || '');
      formData.append('is_primary', isPrimary ? 'true' : 'false');
      if (file) formData.append('file', file);
      const resp = await axios.post(`${API_BASE_URL}/students/cvs/`, formData, { headers: { Authorization: `Token ${token}`, 'Content-Type': 'multipart/form-data' } });
      setTitle('');
      setSummary('');
      setFile(null);
      setIsPrimary(false);
      fetchCVs();
    } catch (err) {
      setError('Failed to create CV');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this CV?')) return;
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/students/cvs/${id}/`, { headers: { Authorization: `Token ${token}` } });
      fetchCVs();
    } catch (err) {
      setError('Failed to delete CV');
    }
  };

  const handleRateCV = (cvId) => {
    setRatingTarget({ type: 'cv', id: cvId });
    setRatingScore(5);
    setRatingComment('');
    setRatingDialogOpen(true);
  };

  const submitRating = async () => {
    if (!ratingTarget) return;
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const url = ratingTarget.type === 'cv' ? `${API_BASE_URL}/students/cvs/${ratingTarget.id}/rate/` : '';
      const resp = await axios.post(url, { score: ratingScore, comment: ratingComment }, { headers: { Authorization: `Token ${token}` } });
      setRatingDialogOpen(false);
      fetchCVs();
    } catch (err) {
      setError('Failed to submit rating');
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Create / Upload CV</Typography>
        <Grid container spacing={2}>
          <Grid item xs={12} md={6}>
            <TextField label="Title" fullWidth value={title} onChange={(e) => setTitle(e.target.value)} />
          </Grid>
          <Grid item xs={12} md={6}>
            <Button variant="contained" component="label" startIcon={<UploadIcon />}>
              Upload File
              <input hidden type="file" accept="application/pdf" onChange={handleFileChange} />
            </Button>
            <Typography variant="body2" sx={{ mt: 1 }}>{file ? file.name : 'No file selected'}</Typography>
          </Grid>
          <Grid item xs={12} md={6}>
            <FormControl fullWidth>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <input type="checkbox" checked={isPrimary} onChange={(e) => setIsPrimary(e.target.checked)} /> Set as primary
              </label>
            </FormControl>
          </Grid>
          <Grid item xs={12}>
            <TextField label="Summary" fullWidth multiline rows={4} value={summary} onChange={(e) => setSummary(e.target.value)} />
          </Grid>
          <Grid item xs={12}>
            <Button variant="contained" onClick={handleSubmit} disabled={submitting}>{submitting ? 'Saving...' : 'Save CV'}</Button>
          </Grid>
        </Grid>
      </Paper>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>My CVs</Typography>
        <List>
          {cvs.length === 0 && <Typography>No CVs found</Typography>}
          {cvs.map((cv) => (
            <ListItem key={cv.id} secondaryAction={(
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                {cv.file_url && (
                  <>
                    <Button size="small" href={cv.file_url} target="_blank" rel="noopener noreferrer">Download</Button>
                    <Button size="small" variant="outlined" onClick={() => { setPreviewUrl(cv.file_url); setPreviewOpen(true); }}>Preview</Button>
                    {(user?.role === 'admin' || user?.role === 'teacher') && (
                      <Button size="small" color="secondary" sx={{ ml: 1 }} onClick={() => handleRateCV(cv.id)}>Rate</Button>
                    )}
                  </>
                )}
                <IconButton edge="end" aria-label="delete" onClick={() => handleDelete(cv.id)}><DeleteIcon /></IconButton>
              </Box>
            )}>
              <ListItemText primary={cv.title + (cv.is_primary ? ' (Primary)' : '')} secondary={cv.summary} />
            </ListItem>
          ))}
        </List>
      </Paper>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle>Preview</DialogTitle>
        <DialogContent sx={{ minHeight: 400 }}>
          {previewUrl ? (
            <object data={previewUrl} type="application/pdf" width="100%" height="600"> 
              <p>Your browser does not support PDFs. <a href={previewUrl}>Download</a></p>
            </object>
          ) : (
            <Typography>No file to preview</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={ratingDialogOpen} onClose={() => setRatingDialogOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Rate CV</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>Only admins and teachers can rate CVs.</Typography>
          <TextField label="Score (1-5)" type="number" fullWidth value={ratingScore} onChange={(e) => setRatingScore(parseInt(e.target.value) || 1)} inputProps={{ min: 1, max: 5 }} sx={{ mb: 2 }} />
          <TextField label="Comment (optional)" fullWidth multiline rows={4} value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRatingDialogOpen(false)}>Cancel</Button>
          <Button onClick={submitRating} variant="contained">Submit</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyCVs;
