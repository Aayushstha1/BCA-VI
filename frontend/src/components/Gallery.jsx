import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  TextField,
  Button,
  Chip,
  Card,
  CardMedia,
  CardContent,
  CardActions,
  Tabs,
  Tab,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';
import {
  PhotoLibrary as GalleryIcon,
  CloudUpload as UploadIcon,
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
} from '@mui/icons-material';
import { useAuth } from '../contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const Gallery = () => {
  const { isAdmin } = useAuth();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState('all');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [formData, setFormData] = useState({
    event_name: '',
    event_date: '',
    description: '',
    photo: null,
  });
  const [rejectOpen, setRejectOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectTarget, setRejectTarget] = useState(null);

  const { data: galleryData, isLoading } = useQuery({
    queryKey: ['gallery-items'],
    queryFn: async () => {
      const response = await axios.get('gallery/');
      return response.data;
    },
  });

  const items = useMemo(() => {
    if (Array.isArray(galleryData)) return galleryData;
    return galleryData?.results || [];
  }, [galleryData]);

  const counts = useMemo(() => {
    return {
      all: items.length,
      pending: items.filter((i) => i.approval_status === 'pending').length,
      approved: items.filter((i) => i.approval_status === 'approved').length,
      rejected: items.filter((i) => i.approval_status === 'rejected').length,
    };
  }, [items]);

  const filteredItems = useMemo(() => {
    if (!isAdmin) return items;
    if (tab === 'all') return items;
    return items.filter((item) => item.approval_status === tab);
  }, [items, tab, isAdmin]);

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const response = await axios.post('gallery/', payload, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-items'] });
      setFormData({ event_name: '', event_date: '', description: '', photo: null });
      setError('');
      setSuccess(
        isAdmin
          ? 'Photo posted successfully.'
          : 'Submitted for admin approval.'
      );
    },
    onError: (err) => {
      const msg =
        typeof err.response?.data === 'object'
          ? JSON.stringify(err.response.data)
          : err.response?.data?.detail || 'Failed to submit photo.';
      setError(msg);
      setSuccess('');
    },
  });

  const approvalMutation = useMutation({
    mutationFn: async ({ id, status, reason }) => {
      const response = await axios.patch(`gallery/${id}/approve/`, {
        approval_status: status,
        rejection_reason: reason || '',
      });
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['gallery-items'] });
    },
  });

  const handleInputChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    setError('');
    setSuccess('');
  };

  const handleFileChange = (e) => {
    const file = e.target.files?.[0] || null;
    setFormData((prev) => ({ ...prev, photo: file }));
    setError('');
    setSuccess('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    if (!formData.event_name || !formData.event_date || !formData.photo) {
      setError('Event name, date, and photo are required.');
      return;
    }
    const payload = new FormData();
    payload.append('event_name', formData.event_name);
    payload.append('event_date', formData.event_date);
    if (formData.description) payload.append('description', formData.description);
    payload.append('photo', formData.photo);
    createMutation.mutate(payload);
  };

  const openRejectDialog = (item) => {
    setRejectTarget(item);
    setRejectReason('');
    setRejectOpen(true);
  };

  const handleReject = () => {
    if (!rejectTarget) return;
    approvalMutation.mutate({
      id: rejectTarget.id,
      status: 'rejected',
      reason: rejectReason,
    });
    setRejectOpen(false);
  };

  const handleApprove = (item) => {
    approvalMutation.mutate({ id: item.id, status: 'approved', reason: '' });
  };

  const statusConfig = {
    pending: { label: 'Pending Approval', color: 'warning' },
    approved: { label: 'Approved', color: 'success' },
    rejected: { label: 'Rejected', color: 'error' },
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <GalleryIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4">Gallery</Typography>
      </Box>

      <Paper sx={{ p: 3, mb: 4 }}>
        <Typography variant="h6" gutterBottom>
          Post Event / College Photo
        </Typography>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          {isAdmin
            ? 'Admin posts are published immediately.'
            : 'Student/Teacher posts require admin approval.'}
        </Typography>

        {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
        {success && <Alert severity="success" sx={{ mb: 2 }}>{success}</Alert>}

        <form onSubmit={handleSubmit}>
          <Grid container spacing={2}>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Event Name"
                name="event_name"
                value={formData.event_name}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="Event Date"
                name="event_date"
                type="date"
                value={formData.event_date}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (optional)"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={3}
              />
            </Grid>
            <Grid item xs={12} md={8}>
              <Button
                variant="outlined"
                component="label"
                startIcon={<UploadIcon />}
                fullWidth
              >
                {formData.photo ? `Selected: ${formData.photo.name}` : 'Upload Photo'}
                <input type="file" accept="image/*" hidden onChange={handleFileChange} />
              </Button>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Submitting...' : 'Submit'}
              </Button>
            </Grid>
          </Grid>
        </form>
      </Paper>

      {isAdmin && (
        <Paper sx={{ p: 2, mb: 3 }}>
          <Tabs
            value={tab}
            onChange={(e, value) => setTab(value)}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
          >
            <Tab value="all" label={`All (${counts.all})`} />
            <Tab value="pending" label={`Pending (${counts.pending})`} />
            <Tab value="approved" label={`Approved (${counts.approved})`} />
            <Tab value="rejected" label={`Rejected (${counts.rejected})`} />
          </Tabs>
        </Paper>
      )}

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Gallery Items ({filteredItems.length})
        </Typography>

        {filteredItems.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No gallery items available yet.
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {filteredItems.map((item) => {
              const status = statusConfig[item.approval_status] || statusConfig.pending;
              const imageSrc = item.photo_url || item.photo;
              return (
                <Grid item xs={12} sm={6} lg={4} key={item.id}>
                  <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                    {imageSrc ? (
                      <CardMedia component="img" height="180" image={imageSrc} alt={item.event_name} />
                    ) : (
                      <Box sx={{ height: 180, bgcolor: 'grey.200' }} />
                    )}
                    <CardContent sx={{ flexGrow: 1 }}>
                      <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={1}>
                        <Typography variant="h6" sx={{ mr: 1 }}>
                          {item.event_name}
                        </Typography>
                        <Chip
                          size="small"
                          label={status.label}
                          color={status.color}
                        />
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                        Event Date: {new Date(item.event_date).toLocaleDateString()}
                      </Typography>
                      {item.description && (
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                          {item.description}
                        </Typography>
                      )}
                      {isAdmin && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Submitted by: {item.created_by_name || 'Unknown'} ({item.created_by_role || 'user'})
                        </Typography>
                      )}
                      {item.approval_status === 'approved' && item.approved_by_name && (
                        <Typography variant="caption" color="text.secondary" display="block">
                          Approved by {item.approved_by_name}
                        </Typography>
                      )}
                      {item.approval_status === 'rejected' && item.rejection_reason && (
                        <Typography variant="caption" color="error" display="block">
                          Rejection: {item.rejection_reason}
                        </Typography>
                      )}
                    </CardContent>
                    {isAdmin && item.approval_status === 'pending' && (
                      <CardActions sx={{ justifyContent: 'flex-end' }}>
                        <Button
                          size="small"
                          color="success"
                          startIcon={<ApproveIcon />}
                          onClick={() => handleApprove(item)}
                          disabled={approvalMutation.isPending}
                        >
                          Approve
                        </Button>
                        <Button
                          size="small"
                          color="error"
                          startIcon={<RejectIcon />}
                          onClick={() => openRejectDialog(item)}
                          disabled={approvalMutation.isPending}
                        >
                          Reject
                        </Button>
                      </CardActions>
                    )}
                  </Card>
                </Grid>
              );
            })}
          </Grid>
        )}
      </Paper>

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Reject Gallery Item</DialogTitle>
        <DialogContent>
          <TextField
            fullWidth
            label="Reason (optional)"
            value={rejectReason}
            onChange={(e) => setRejectReason(e.target.value)}
            multiline
            rows={3}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRejectOpen(false)}>Cancel</Button>
          <Button
            variant="contained"
            color="error"
            onClick={handleReject}
            disabled={approvalMutation.isPending}
          >
            Reject
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default Gallery;
