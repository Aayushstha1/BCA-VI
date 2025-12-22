import React from 'react';
import { Box, Typography, Paper, LinearProgress, Grid, CircularProgress, Alert, Divider } from '@mui/material';
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

  // Daily summary: operating days, present days, absent days
  const byDate = {};
  (records || []).forEach((r) => {
    const dateKey = (r.date || r.attendance_date || '').split('T')[0] || 'unknown';
    if (!byDate[dateKey]) {
      byDate[dateKey] = { any: false, present: false };
    }
    byDate[dateKey].any = true;
    if (['present', 'late'].includes((r.status || '').toLowerCase())) {
      byDate[dateKey].present = true;
    }
  });
  const validDays = Object.keys(byDate).filter((d) => d !== 'unknown');
  const operatingDays = validDays.length;
  const presentDays = validDays.filter((d) => byDate[d].present).length;
  const absentDays = operatingDays - presentDays;
  const overallPercent = operatingDays ? Math.round((presentDays / operatingDays) * 100) : 0;

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

      {/* Overall summary */}
      <Grid container spacing={2} sx={{ mb: 2 }}>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Operating Days
            </Typography>
            <Typography variant="h6">{operatingDays || '—'}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Present Days
            </Typography>
            <Typography variant="h6">{presentDays || '—'}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Absent Days
            </Typography>
            <Typography variant="h6">{absentDays || '—'}</Typography>
          </Paper>
        </Grid>
        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="subtitle2" color="text.secondary">
              Overall Attendance
            </Typography>
            <Box display="flex" alignItems="center" gap={2}>
              <Box sx={{ flexGrow: 1 }}>
                <LinearProgress
                  variant="determinate"
                  value={overallPercent}
                  sx={{ height: 10, borderRadius: 5 }}
                />
              </Box>
              <Typography variant="body2">{overallPercent}%</Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Divider sx={{ my: 2 }} />

      {/* Per subject attendance */}
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


