import React from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Button,
  CircularProgress,
  Alert,
} from '@mui/material';
import { Grade as GradeIcon, Check as CheckIcon, Close as CloseIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const ResultsManagement = () => {
  const queryClient = useQueryClient();

  const { data: results, isLoading, isError } = useQuery({
    queryKey: ['results', 'admin'],
    queryFn: async () => {
      const res = await axios.get('/results/');
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
      return list;
    },
  });

  const updateResultMutation = useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await axios.patch(`/results/${id}/`, { status });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['results', 'admin']);
      queryClient.invalidateQueries(['results']);
    },
  });

  const handleUpdateStatus = (id, status) => {
    updateResultMutation.mutate({ id, status });
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
  const pending = allResults.filter((r) => (r.status || '').toLowerCase() === 'pending');

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <GradeIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4">Results Management</Typography>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Pending Approvals ({pending.length})
        </Typography>
        {pending.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No pending results. All results are already approved or there are none yet.
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
                  <TableCell align="right">Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {pending.map((r) => (
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
                      <Chip label={r.status || 'pending'} size="small" />
                    </TableCell>
                    <TableCell align="right">
                      <Button
                        size="small"
                        color="success"
                        startIcon={<CheckIcon />}
                        sx={{ mr: 1 }}
                        onClick={() => handleUpdateStatus(r.id, 'approved')}
                      >
                        Approve
                      </Button>
                      <Button
                        size="small"
                        color="error"
                        startIcon={<CloseIcon />}
                        onClick={() => handleUpdateStatus(r.id, 'rejected')}
                      >
                        Reject
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
    </Box>
  );
};

export default ResultsManagement;
