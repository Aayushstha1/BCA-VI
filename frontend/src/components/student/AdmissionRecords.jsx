import React from 'react';
import { Box, Typography, Paper, Grid, Divider, CircularProgress, Alert } from '@mui/material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const AdmissionRecords = () => {
  const { user } = useAuth();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['student-profile', user?.id],
    queryFn: async () => {
      const res = await axios.get('/students/');
      const list = Array.isArray(res.data) ? res.data : (res.data?.results || []);
      return list.find((s) => s?.user_details?.id === user?.id);
    },
    enabled: !!user?.id,
  });

  const Field = ({ label, value }) => (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Box>
  );

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="40vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isError || !data) {
    return <Alert severity="warning">Could not load admission records.</Alert>;
  }

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Admission Records
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Field label="Enrollment No." value={data.student_id} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Field label="Program" value={data.current_class} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Field label="Section" value={data.current_section} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Field label="Roll Number" value={data.roll_number} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Field label="Status" value={data.is_active ? 'Active' : 'Inactive'} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Field label="Admission Number" value={data.admission_number} />
          </Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Field label="Admission Date" value={data.admission_date} />
      </Paper>
    </Box>
  );
};

export default AdmissionRecords;


