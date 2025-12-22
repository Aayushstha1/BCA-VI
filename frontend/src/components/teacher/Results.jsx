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
import { Add as AddIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const Results = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    student: '',
    subject: '',
    exam: '',
    marks_obtained: '',
    grade: '',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const queryClient = useQueryClient();

  const { data: results, isLoading, isError } = useQuery({
    queryKey: ['results', 'teacher'],
    queryFn: async () => {
      const res = await axios.get('/results/');
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
      return list;
    },
  });

  const createResultMutation = useMutation({
    mutationFn: async (result) => {
      const payload = { ...result };
      // Ensure numeric
      if (payload.marks_obtained !== '') {
        payload.marks_obtained = Number(payload.marks_obtained);
      }
      Object.keys(payload).forEach((k) => {
        if (payload[k] === '') delete payload[k];
      });
      // Default status to pending; backend may ignore if it manages status itself
      if (!payload.status) {
        payload.status = 'pending';
      }
      const res = await axios.post('/results/', payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['results', 'teacher']);
      queryClient.invalidateQueries(['results', 'admin']);
      setOpenDialog(false);
      setFormData({
        student: '',
        subject: '',
        exam: '',
        marks_obtained: '',
        grade: '',
      });
    },
    onError: (e) => setError(e.response?.data?.message || 'Failed to create result'),
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
    return <Alert severity="error">Failed to load results.</Alert>;
  }

  const allResults = results || [];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" sx={{ mb: 3 }}>
        <Typography variant="h4">Results Management</Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => {
            setOpenDialog(true);
            setError('');
          }}
        >
          Add Marks
        </Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          All Results ({allResults.length})
        </Typography>
        {allResults.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No results yet. Use &quot;Add Marks&quot; to create one.
          </Typography>
        ) : (
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell>Student</TableCell>
                  <TableCell>Exam</TableCell>
                  <TableCell>Subject</TableCell>
                  <TableCell>Marks</TableCell>
                  <TableCell>Grade</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {allResults.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>
                      {r.student_name ||
                        r.student_full_name ||
                        r.student ||
                        '-'}
                    </TableCell>
                    <TableCell>{r.exam_name || r.exam || '-'}</TableCell>
                    <TableCell>{r.subject_name || r.subject || '-'}</TableCell>
                    <TableCell>{r.marks_obtained ?? '-'}</TableCell>
                    <TableCell>{r.grade ?? '-'}</TableCell>
                    <TableCell>
                      <Chip
                        label={(r.status || 'pending').toString()}
                        size="small"
                        color={
                          (r.status || '').toLowerCase() === 'approved'
                            ? 'success'
                            : (r.status || '').toLowerCase() === 'rejected'
                            ? 'error'
                            : 'warning'
                        }
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add Result Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Add Marks</DialogTitle>
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setLoading(true);
            createResultMutation.mutate(formData, {
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
                  label="Student ID"
                  name="student"
                  value={formData.student}
                  onChange={handleInputChange}
                  helperText="Enter student ID or primary key expected by backend"
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
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Exam"
                  name="exam"
                  value={formData.exam}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Marks Obtained"
                  name="marks_obtained"
                  type="number"
                  value={formData.marks_obtained}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Grade"
                  name="grade"
                  value={formData.grade}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>
              {loading ? <CircularProgress size={24} /> : 'Submit for Approval'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default Results;


