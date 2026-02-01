import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert } from '@mui/material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const TeacherCVs = () => {
  const { user } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [ratingOpen, setRatingOpen] = useState(false);
  const [ratingTarget, setRatingTarget] = useState(null);
  const [ratingScore, setRatingScore] = useState(5);
  const [ratingComment, setRatingComment] = useState('');

  useEffect(() => { fetchCVs(); }, []);

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

  const openPreview = (url) => {
    setPreviewUrl(url);
    setPreviewOpen(true);
  };

  const openRating = (cv) => {
    setRatingTarget(cv);
    setRatingScore(5);
    setRatingComment('');
    setRatingOpen(true);
  };

  const submitRating = async () => {
    if (!ratingTarget) return;
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      await axios.post(`${API_BASE_URL}/students/cvs/${ratingTarget.id}/rate/`, { score: ratingScore, comment: ratingComment }, { headers: { Authorization: `Token ${token}` } });
      setRatingOpen(false);
      fetchCVs();
    } catch (err) {
      setError('Failed to submit rating');
    }
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;

  return (
    <Container sx={{ py: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Student CVs</Typography>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Summary</TableCell>
              <TableCell>File</TableCell>
              <TableCell>Avg</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {cvs.map((cv) => (
              <TableRow key={cv.id}>
                <TableCell>{cv.owner}</TableCell>
                <TableCell>{cv.title}{cv.is_primary ? ' (Primary)' : ''}</TableCell>
                <TableCell>{cv.summary}</TableCell>
                <TableCell>{cv.file_url ? <Button href={cv.file_url} target="_blank">Download</Button> : '—'} {cv.file_url && <Button size="small" onClick={() => openPreview(cv.file_url)} sx={{ ml: 1 }}>Preview</Button>}</TableCell>
                <TableCell>{cv.average_rating ? cv.average_rating.toFixed(1) : '—'}</TableCell>
                <TableCell>
                  <Button size="small" onClick={() => openRating(cv)}>Rate</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
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

      <Dialog open={ratingOpen} onClose={() => setRatingOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Rate CV</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>Score 1-5</Typography>
          <TextField type="number" fullWidth value={ratingScore} onChange={(e) => setRatingScore(parseInt(e.target.value) || 1)} inputProps={{ min: 1, max: 5 }} sx={{ mb: 2 }} />
          <TextField label="Comment (optional)" fullWidth multiline rows={4} value={ratingComment} onChange={(e) => setRatingComment(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRatingOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={submitRating}>Submit</Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default TeacherCVs;
