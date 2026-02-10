import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Tabs,
  Tab,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  Alert,
  CircularProgress,
  Stack
} from '@mui/material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const statusOptions = [
  { label: 'Pending', value: 'pending' },
  { label: 'Approved', value: 'approved' },
  { label: 'Rejected', value: 'rejected' }
];

const PasswordResetRequests = () => {
  const [tabValue, setTabValue] = useState(0);
  const [approveOpen, setApproveOpen] = useState(false);
  const [rejectOpen, setRejectOpen] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState(null);
  const [approveData, setApproveData] = useState({ new_password: '', admin_note: '' });
  const [rejectNote, setRejectNote] = useState('');
  const [error, setError] = useState('');

  const queryClient = useQueryClient();
  const status = statusOptions[tabValue]?.value || 'pending';

  const { data, isLoading } = useQuery({
    queryKey: ['password-reset-requests', status],
    queryFn: async () => {
      const response = await axios.get(`/accounts/password-reset-requests/list/?status=${status}`);
      return response.data;
    },
  });

  const requests = useMemo(() => (Array.isArray(data) ? data : []), [data]);

  const approveMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const response = await axios.post(`/accounts/password-reset-requests/${id}/approve/`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['password-reset-requests']);
      setApproveOpen(false);
      setApproveData({ new_password: '', admin_note: '' });
      setSelectedRequest(null);
      setError('');
    },
    onError: (err) => {
      setError(err.response?.data?.detail || 'Failed to approve request');
    }
  });

  const rejectMutation = useMutation({
    mutationFn: async ({ id, payload }) => {
      const response = await axios.post(`/accounts/password-reset-requests/${id}/reject/`, payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['password-reset-requests']);
      setRejectOpen(false);
      setRejectNote('');
      setSelectedRequest(null);
      setError('');
    },
    onError: (err) => {
      setError(err.response?.data?.detail || 'Failed to reject request');
    }
  });

  const handleApproveOpen = (req) => {
    setSelectedRequest(req);
    setApproveData({ new_password: '', admin_note: '' });
    setError('');
    setApproveOpen(true);
  };

  const handleRejectOpen = (req) => {
    setSelectedRequest(req);
    setRejectNote('');
    setError('');
    setRejectOpen(true);
  };

  const handleApproveSubmit = (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    approveMutation.mutate({ id: selectedRequest.id, payload: approveData });
  };

  const handleRejectSubmit = (e) => {
    e.preventDefault();
    if (!selectedRequest) return;
    rejectMutation.mutate({ id: selectedRequest.id, payload: { admin_note: rejectNote } });
  };

  const formatDate = (value) => {
    try {
      return new Date(value).toLocaleString();
    } catch (e) {
      return value || '-';
    }
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
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Password Reset Requests</Typography>
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          {statusOptions.map((opt) => (
            <Tab key={opt.value} label={opt.label} />
          ))}
        </Tabs>
      </Paper>

      <Paper sx={{ p: 2 }}>
        {requests.length === 0 ? (
          <Typography color="text.secondary">
            No requests found.
          </Typography>
        ) : (
          <Stack spacing={2}>
            {requests.map((req) => (
              <Paper key={req.id} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'divider' }}>
                <Box display="flex" justifyContent="space-between" alignItems="flex-start" gap={2}>
                  <Box>
                    <Typography variant="h6">{req.username}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      Father: {req.father_name} | Class: {req.current_class} | Section: {req.current_section}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Requested: {formatDate(req.created_at)}
                    </Typography>
                    <Box mt={1} display="flex" gap={1} flexWrap="wrap">
                      <Chip
                        size="small"
                        color={req.auto_match ? 'success' : 'warning'}
                        label={req.auto_match ? 'Auto Match' : 'Needs Review'}
                      />
                      <Chip size="small" label={req.status.toUpperCase()} />
                    </Box>
                  </Box>

                  <Box textAlign="right">
                    <Typography variant="subtitle2">Student Record</Typography>
                    {req.student_id ? (
                      <Typography variant="body2" color="text.secondary">
                        {req.student_name || '-'} | {req.student_id}
                        <br />
                        Class: {req.student_class || '-'} | Section: {req.student_section || '-'}
                        <br />
                        Email: {req.student_email || 'Not set'}
                      </Typography>
                    ) : (
                      <Typography variant="body2" color="text.secondary">No match</Typography>
                    )}
                  </Box>
                </Box>

                {req.status === 'pending' && (
                  <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                    <Button variant="contained" onClick={() => handleApproveOpen(req)}>
                      Approve & Send Email
                    </Button>
                    <Button variant="outlined" color="error" onClick={() => handleRejectOpen(req)}>
                      Reject
                    </Button>
                  </Box>
                )}
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>

      <Dialog open={approveOpen} onClose={() => setApproveOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Approve Request</DialogTitle>
        <form onSubmit={handleApproveSubmit}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Leave password blank to auto-generate a secure one and email it to the student.
            </Typography>
            <TextField
              fullWidth
              label="New Password (optional)"
              type="text"
              value={approveData.new_password}
              onChange={(e) => setApproveData({ ...approveData, new_password: e.target.value })}
              sx={{ mb: 2 }}
            />
            <TextField
              fullWidth
              label="Admin Note (optional)"
              multiline
              minRows={2}
              value={approveData.admin_note}
              onChange={(e) => setApproveData({ ...approveData, admin_note: e.target.value })}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setApproveOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" disabled={approveMutation.isPending}>
              {approveMutation.isPending ? <CircularProgress size={20} /> : 'Approve'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      <Dialog open={rejectOpen} onClose={() => setRejectOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Reject Request</DialogTitle>
        <form onSubmit={handleRejectSubmit}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <TextField
              fullWidth
              label="Reason (optional)"
              multiline
              minRows={2}
              value={rejectNote}
              onChange={(e) => setRejectNote(e.target.value)}
            />
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setRejectOpen(false)} color="inherit">Cancel</Button>
            <Button type="submit" variant="contained" color="error" disabled={rejectMutation.isPending}>
              {rejectMutation.isPending ? <CircularProgress size={20} /> : 'Reject'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default PasswordResetRequests;
