import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, CircularProgress, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const Results = () => {
  const { user } = useAuth();
  const { data: results, isLoading, isError } = useQuery({
    queryKey: ['results'],
    queryFn: async () => {
      const res = await axios.get('/results/');
      const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      return list;
    },
  });

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

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Results
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Exam</TableCell>
              <TableCell>SGPA</TableCell>
              <TableCell>Marks</TableCell>
              <TableCell>Grade</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {(results || []).map((r) => (
              <TableRow key={r.id}>
                <TableCell>{r.exam_name || r.exam}</TableCell>
                <TableCell>{/* Placeholder SGPA per exam not defined */}-</TableCell>
                <TableCell>{r.marks_obtained}</TableCell>
                <TableCell>{r.grade}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default Results;


