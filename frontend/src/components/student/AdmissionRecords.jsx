import React from 'react';
import { Box, Typography, Paper, Grid, Divider } from '@mui/material';

const AdmissionRecords = () => {
  const data = {
    enrollmentNo: 'STU-2072A7C0',
    program: 'B.Tech Computer Science',
    batch: '2023-2027',
    semester: '3',
    status: 'Active',
    section: 'CSE-2',
    admissionDate: '2023-08-01',
  };

  const Field = ({ label, value }) => (
    <Box sx={{ mb: 1.5 }}>
      <Typography variant="caption" color="text.secondary">
        {label}
      </Typography>
      <Typography variant="body1">{value}</Typography>
    </Box>
  );

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Admission Records
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={4}>
            <Field label="Enrollment No." value={data.enrollmentNo} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Field label="Program" value={data.program} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Field label="Batch" value={data.batch} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Field label="Semester" value={data.semester} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Field label="Section" value={data.section} />
          </Grid>
          <Grid item xs={12} sm={6} md={4}>
            <Field label="Status" value={data.status} />
          </Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Field label="Admission Date" value={data.admissionDate} />
      </Paper>
    </Box>
  );
};

export default AdmissionRecords;


