import React, { useEffect, useState } from 'react';
import { Container, Paper, Typography, Table, TableHead, TableBody, TableRow, TableCell, Button, CircularProgress, Alert, IconButton, Dialog, DialogTitle, DialogContent, DialogActions, TextField, FormControlLabel, Checkbox, Chip, Box, Tabs, Tab } from '@mui/material';
import { Edit as EditIcon, Delete as DeleteIcon, CheckCircle as CheckCircleIcon, Cancel as CancelIcon, Pending as PendingIcon } from '@mui/icons-material';
import axios from 'axios';

const CVManagement = () => {
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';
  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editSummary, setEditSummary] = useState('');
  const [editFile, setEditFile] = useState(null);
  const [editIsPrimary, setEditIsPrimary] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [previewOpen, setPreviewOpen] = useState(false);
  const [ratingsOpen, setRatingsOpen] = useState(false);
  const [ratingsList, setRatingsList] = useState([]);
  const [ratingsLoading, setRatingsLoading] = useState(false);
  const [ratingsError, setRatingsError] = useState('');
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [approvalTarget, setApprovalTarget] = useState(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approving, setApproving] = useState(false);
  const [tabValue, setTabValue] = useState(0);

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
    } finally { setLoading(false); }
  };

  const handleEditOpen = (cv) => {
    setEditing(cv);
    setEditTitle(cv.title || '');
    setEditSummary(cv.summary || '');
    setEditIsPrimary(!!cv.is_primary);
    setEditFile(null);
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    if (!editing) return;
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', editTitle);
      formData.append('summary', editSummary || '');
      formData.append('is_primary', editIsPrimary ? 'true' : 'false');
      if (editFile) formData.append('file', editFile);
      const resp = await axios.patch(`${API_BASE_URL}/students/cvs/${editing.id}/`, formData, { headers: { Authorization: `Token ${token}`, 'Content-Type': 'multipart/form-data' } });
      setEditOpen(false);
      fetchCVs();
    } catch (err) {
      setError('Failed to save changes');
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

  const handlePreview = (url) => {
    setPreviewUrl(url);
    setPreviewOpen(true);
  };

  const openRatings = async (cv) => {
    try {
      setRatingsLoading(true);
      setRatingsError('');
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const resp = await axios.get(`${API_BASE_URL}/students/cvs/${cv.id}/ratings/`, { headers: { Authorization: `Token ${token}` } });
      setRatingsList(resp.data || []);
      setRatingsOpen(true);
    } catch (err) {
      setRatingsError('Failed to load ratings');
    } finally {
      setRatingsLoading(false);
    }
  };

  const handleDeleteRating = async (ratingId) => {
    if (!window.confirm('Delete this rating?')) return;
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/students/cvs/ratings/${ratingId}/`, { headers: { Authorization: `Token ${token}` } });
      setRatingsList(ratingsList.filter((r) => r.id !== ratingId));
      fetchCVs();
    } catch (err) {
      setRatingsError('Failed to delete rating');
    }
  };

  const handleApprove = async (cv, status) => {
    setApprovalTarget(cv);
    if (status === 'rejected') {
      setApprovalDialogOpen(true);
    } else {
      await submitApproval(cv.id, 'approved', '');
    }
  };

  const submitApproval = async (cvId, status, reason) => {
    try {
      setApproving(true);
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      await axios.patch(`${API_BASE_URL}/students/cvs/${cvId}/approve/`, {
        approval_status: status,
        rejection_reason: reason
      }, { headers: { Authorization: `Token ${token}` } });
      setApprovalDialogOpen(false);
      setRejectionReason('');
      setApprovalTarget(null);
      fetchCVs();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to update approval status');
    } finally {
      setApproving(false);
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { color: 'warning', icon: <PendingIcon />, label: 'Pending' },
      approved: { color: 'success', icon: <CheckCircleIcon />, label: 'Approved' },
      rejected: { color: 'error', icon: <CancelIcon />, label: 'Rejected' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Chip 
        icon={config.icon} 
        label={config.label} 
        color={config.color} 
        size="small" 
      />
    );
  };

  const filteredCVs = () => {
    if (tabValue === 0) return cvs; // All
    if (tabValue === 1) return cvs.filter(cv => cv.approval_status === 'pending');
    if (tabValue === 2) return cvs.filter(cv => cv.approval_status === 'approved');
    if (tabValue === 3) return cvs.filter(cv => cv.approval_status === 'rejected');
    return cvs;
  };

  if (loading) return <Container sx={{ mt: 6 }}><CircularProgress /></Container>;

  return (
    <Container sx={{ py: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Student CVs Management</Typography>
        
        <Tabs value={tabValue} onChange={(e, newValue) => setTabValue(newValue)} sx={{ mb: 2 }}>
          <Tab label="All" />
          <Tab label="Pending" />
          <Tab label="Approved" />
          <Tab label="Rejected" />
        </Tabs>

        <Table>
          <TableHead>
            <TableRow>
              <TableCell>Student</TableCell>
              <TableCell>Title</TableCell>
              <TableCell>Status</TableCell>
              <TableCell>Summary</TableCell>
              <TableCell>File</TableCell>
              <TableCell>Project File</TableCell>
              <TableCell>Avg Rating</TableCell>
              <TableCell>Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredCVs().length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} align="center">
                  <Typography color="textSecondary">No CVs found</Typography>
                </TableCell>
              </TableRow>
            ) : (
              filteredCVs().map(cv => (
                <TableRow key={cv.id}>
                  <TableCell>{cv.owner}</TableCell>
                  <TableCell>
                    {cv.title}
                    {cv.is_primary && <Chip label="Primary" color="primary" size="small" sx={{ ml: 1 }} />}
                  </TableCell>
                  <TableCell>{getStatusChip(cv.approval_status)}</TableCell>
                  <TableCell>{cv.summary || '—'}</TableCell>
                  <TableCell>
                    {cv.file_url ? (
                      <Box>
                        <Button size="small" href={cv.file_url} target="_blank">Download</Button>
                        <Button size="small" variant="outlined" sx={{ ml: 1 }} onClick={() => handlePreview(cv.file_url)}>Preview</Button>
                      </Box>
                    ) : '—'}
                  </TableCell>
                  <TableCell>
                    {cv.project_file_url ? (
                      <Button size="small" href={cv.project_file_url} target="_blank">View Project</Button>
                    ) : '—'}
                  </TableCell>
                  <TableCell>{cv.average_rating ? cv.average_rating.toFixed(1) : '—'}</TableCell>
                  <TableCell>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      {cv.approval_status === 'pending' && (
                        <>
                          <Button 
                            size="small" 
                            color="success" 
                            startIcon={<CheckCircleIcon />}
                            onClick={() => handleApprove(cv, 'approved')}
                          >
                            Approve
                          </Button>
                          <Button 
                            size="small" 
                            color="error" 
                            startIcon={<CancelIcon />}
                            onClick={() => handleApprove(cv, 'rejected')}
                          >
                            Reject
                          </Button>
                        </>
                      )}
                      <Button size="small" onClick={() => openRatings(cv)}>Ratings</Button>
                      <IconButton size="small" onClick={() => handleEditOpen(cv)}><EditIcon /></IconButton>
                      <IconButton size="small" onClick={() => handleDelete(cv.id)}><DeleteIcon color="error" /></IconButton>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={editOpen} onClose={() => setEditOpen(false)} fullWidth maxWidth="md">
        <DialogTitle>Edit CV</DialogTitle>
        <DialogContent>
          <TextField fullWidth label="Title" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} sx={{ mb: 2 }} />
          <TextField fullWidth label="Summary" value={editSummary} onChange={(e) => setEditSummary(e.target.value)} multiline rows={4} sx={{ mb: 2 }} />
          <FormControlLabel control={<Checkbox checked={editIsPrimary} onChange={(e) => setEditIsPrimary(e.target.checked)} />} label="Set as primary" />
          <Button variant="contained" component="label" sx={{ ml: 2 }}>
            Upload New File
            <input hidden type="file" accept="application/pdf" onChange={(e) => setEditFile(e.target.files[0])} />
          </Button>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setEditOpen(false)}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave}>Save</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle>Preview</DialogTitle>
        <DialogContent>
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

      <Dialog open={ratingsOpen} onClose={() => setRatingsOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>CV Ratings</DialogTitle>
        <DialogContent>
          {ratingsLoading ? (
            <CircularProgress />
          ) : ratingsError ? (
            <Alert severity="error">{ratingsError}</Alert>
          ) : ratingsList.length === 0 ? (
            <Typography>No ratings yet</Typography>
          ) : (
            ratingsList.map((r) => (
              <Paper key={r.id} sx={{ p: 2, mb: 1 }}>
                <Typography><strong>{r.rater}</strong> — {r.score}/5</Typography>
                <Typography variant="body2">{r.comment || 'No comment'}</Typography>
                <Button size="small" color="error" sx={{ mt: 1 }} onClick={() => handleDeleteRating(r.id)}>Delete</Button>
              </Paper>
            ))
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRatingsOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={approvalDialogOpen} onClose={() => { setApprovalDialogOpen(false); setRejectionReason(''); }} fullWidth maxWidth="sm">
        <DialogTitle>Reject CV</DialogTitle>
        <DialogContent>
          <Typography variant="body2" sx={{ mb: 2 }}>
            Please provide a reason for rejecting this CV:
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={4}
            label="Rejection Reason"
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter the reason for rejection..."
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setApprovalDialogOpen(false); setRejectionReason(''); }}>Cancel</Button>
          <Button 
            variant="contained" 
            color="error"
            onClick={() => approvalTarget && submitApproval(approvalTarget.id, 'rejected', rejectionReason)}
            disabled={!rejectionReason.trim() || approving}
          >
            {approving ? 'Rejecting...' : 'Reject CV'}
          </Button>
        </DialogActions>
      </Dialog>

    </Container>
  );
};

export default CVManagement;
