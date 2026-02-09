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
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  IconButton,
  Chip,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const ClassSubjectsManagement = () => {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    class_name: '',
    section: '',
    subject: '',
    teacher: '',
    is_active: true,
  });

  const { data: assignments, isLoading: assignmentsLoading } = useQuery({
    queryKey: ['class-subject-assignments'],
    queryFn: async () => {
      const resp = await axios.get('results/class-subjects/');
      return Array.isArray(resp.data) ? resp.data : (resp.data?.results || []);
    },
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const resp = await axios.get('attendance/subjects/');
      return Array.isArray(resp.data) ? resp.data : (resp.data?.results || []);
    },
  });

  const { data: teachers } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const resp = await axios.get('teachers/');
      return Array.isArray(resp.data) ? resp.data : (resp.data?.results || []);
    },
  });

  const createMutation = useMutation({
    mutationFn: async (payload) => {
      const resp = await axios.post('results/class-subjects/', payload);
      return resp.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['class-subject-assignments']);
      setOpen(false);
      setFormData({ class_name: '', section: '', subject: '', teacher: '', is_active: true });
      setError('');
    },
    onError: (err) => {
      const data = err.response?.data;
      let msg = 'Failed to create assignment';
      if (data) {
        if (typeof data === 'string') msg = data;
        else if (data.detail) msg = data.detail;
        else msg = JSON.stringify(data);
      }
      setError(msg);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id) => axios.delete(`results/class-subjects/${id}/`),
    onSuccess: () => {
      queryClient.invalidateQueries(['class-subject-assignments']);
    },
    onError: (err) => {
      const data = err.response?.data;
      let msg = 'Failed to delete assignment';
      if (data) {
        if (typeof data === 'string') msg = data;
        else if (data.detail) msg = data.detail;
        else msg = JSON.stringify(data);
      }
      setError(msg);
    },
  });

  const handleOpen = () => {
    setOpen(true);
    setError('');
  };

  const handleClose = () => {
    setOpen(false);
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.class_name || !formData.subject || !formData.teacher) {
      setError('Class, subject, and teacher are required.');
      return;
    }
    const payload = { ...formData };
    if (payload.section === '') delete payload.section;
    createMutation.mutate(payload);
  };

  const rows = assignments || [];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Typography variant="h4">Class Subject Assignments</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleOpen}>
          Add Assignment
        </Button>
      </Box>

      {(subjects || []).length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No subjects found. Create subjects first, then assign them to classes.
        </Alert>
      )}
      {(teachers || []).length === 0 && (
        <Alert severity="info" sx={{ mb: 2 }}>
          No teachers found. Create teachers first, then assign them to class subjects.
        </Alert>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 2 }}>
        {assignmentsLoading ? (
          <Box display="flex" justifyContent="center" py={4}>
            <CircularProgress />
          </Box>
        ) : rows.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No class subject assignments yet.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell><strong>Class</strong></TableCell>
                  <TableCell><strong>Section</strong></TableCell>
                  <TableCell><strong>Subject</strong></TableCell>
                  <TableCell><strong>Teacher</strong></TableCell>
                  <TableCell align="center"><strong>Status</strong></TableCell>
                  <TableCell align="center"><strong>Actions</strong></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.class_name}</TableCell>
                    <TableCell>{row.section || '-'}</TableCell>
                    <TableCell>{row.subject_name || row.subject}</TableCell>
                    <TableCell>{row.teacher_name || row.teacher || '-'}</TableCell>
                    <TableCell align="center">
                      <Chip label={row.is_active ? 'Active' : 'Inactive'} color={row.is_active ? 'success' : 'default'} size="small" />
                    </TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => deleteMutation.mutate(row.id)} color="error" size="small">
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle>Assign Subject to Class</DialogTitle>
        <form onSubmit={handleSubmit}>
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
                  label="Class"
                  value={formData.class_name}
                  onChange={(e) => setFormData({ ...formData, class_name: e.target.value })}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Section (optional)"
                  value={formData.section}
                  onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Subject</InputLabel>
                  <Select
                    value={formData.subject}
                    label="Subject"
                    onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                  >
                    {(subjects || []).map((subj) => (
                      <MenuItem key={subj.id} value={subj.id}>
                        {subj.name} ({subj.code})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Teacher</InputLabel>
                  <Select
                    value={formData.teacher}
                    label="Teacher"
                    onChange={(e) => setFormData({ ...formData, teacher: e.target.value })}
                  >
                    {(teachers || []).map((t) => (
                      <MenuItem key={t.id} value={t.id}>
                      {t.user_details?.first_name || ''} {t.user_details?.last_name || ''} ({t.employee_id})
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    />
                  }
                  label="Active"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={createMutation.isPending}>
              {createMutation.isPending ? <CircularProgress size={20} /> : 'Save'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ClassSubjectsManagement;
