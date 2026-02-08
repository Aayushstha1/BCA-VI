import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, Paper, Table, TableHead, TableBody, TableRow, TableCell, Button, CircularProgress, Dialog, DialogTitle, DialogContent, DialogActions, TextField, Alert, Chip, Tabs, Tab } from '@mui/material';
import { CheckCircle as CheckCircleIcon, Cancel as CancelIcon, Pending as PendingIcon } from '@mui/icons-material';
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

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;

  return (
    <Container sx={{ py: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>Student CVs</Typography>
        
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
              filteredCVs().map((cv) => (
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
                        <Button size="small" variant="outlined" sx={{ ml: 1 }} onClick={() => openPreview(cv.file_url)}>Preview</Button>
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
                      <Button size="small" onClick={() => openRating(cv)}>Rate</Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))
            )}
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

export default TeacherCVs;
