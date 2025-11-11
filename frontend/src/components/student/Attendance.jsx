import React from 'react';
import { Box, Typography, Paper, LinearProgress, Grid, CircularProgress, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const Attendance = () => {
  const { user } = useAuth();
  const { data: records, isLoading, isError } = useQuery({
    queryKey: ['attendance'],
    queryFn: async () => {
      const res = await axios.get('/attendance/');
      const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      return list;
    },
  });

  // Group by subject and calculate percentage
  const bySubject = {};
  (records || []).forEach((r) => {
    const subj = r.subject_name || r.subject || 'Subject';
    if (!bySubject[subj]) {
      bySubject[subj] = { total: 0, present: 0 };
    }
    bySubject[subj].total += 1;
    if (['present', 'late'].includes(r.status)) {
      bySubject[subj].present += 1;
    }
  });
  const subjects = Object.keys(bySubject).map((name) => {
    const s = bySubject[name];
    const percent = s.total ? Math.round((s.present / s.total) * 100) : 0;
    return { name, percent };
  });

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }
  if (isError) {
    return <Alert severity="error">Failed to load attendance.</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Attendance
      </Typography>
      <Grid container spacing={2}>
        {subjects.map((s) => (
          <Grid item xs={12} md={6} key={s.name}>
            <Paper sx={{ p: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                {s.name}
              </Typography>
              <LinearProgress
                variant="determinate"
                value={s.percent}
                sx={{ height: 10, borderRadius: 5 }}
              />
              <Typography variant="caption" color="text.secondary">
                {s.percent}% attended
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );
};

export default Attendance;


