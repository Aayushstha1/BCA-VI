import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Chip, CircularProgress, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const ReportCard = () => {
  const { data: results, isLoading, isError } = useQuery({
    queryKey: ['report-card-results'],
    queryFn: async () => {
      const res = await axios.get('/results/');
      const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      return list;
    },
  });

  const gradeColor = (g) => {
    if (!g) return 'default';
    switch (g) {
      case 'A+':
      case 'A':
        return 'success';
      case 'B+':
      case 'B':
        return 'primary';
      default:
        return 'warning';
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Report Card
      </Typography>
      {isLoading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="30vh">
          <CircularProgress />
        </Box>
      )}
      {isError && (
        <Alert severity="error" sx={{ mb: 2 }}>Failed to load report card.</Alert>
      )}
      <Paper sx={{ p: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Subject Code</TableCell>
              <TableCell>Subject</TableCell>
              <TableCell>Exam</TableCell>
              <TableCell>Marks</TableCell>
              <TableCell>Grade</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(results || []).length === 0 && !isLoading ? (
              <TableRow>
                <TableCell colSpan={5}>
                  <Typography variant="body2" color="text.secondary">No approved results available yet.</Typography>
                </TableCell>
              </TableRow>
            ) : (
              (results || []).map((r) => (
                <TableRow key={r.id}>
                  <TableCell>{r.subject_code || '-'}</TableCell>
                  <TableCell>{r.subject_name || '-'}</TableCell>
                  <TableCell>{r.exam_name || r.exam}</TableCell>
                  <TableCell>{r.marks_obtained}{r.total_marks ? `/${r.total_marks}` : ''}</TableCell>
                  <TableCell>
                    <Chip label={r.grade || '-'} color={gradeColor(r.grade)} size="small" />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default ReportCard;


