import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { Assessment, LibraryBooks, FactCheck, Wallet, School, Grade, Note } from '@mui/icons-material';

const StatCard = ({ icon, label, value, color }) => {
  return (
    <Paper elevation={2} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          bgcolor: `${color}.light`,
          color: `${color}.dark`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mr: 2,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="subtitle2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h6">{value}</Typography>
      </Box>
    </Paper>
  );
};

const StudentHome = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        My Overview
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard icon={<Assessment />} label="Attendance (This Month)" value="92%" color="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard icon={<Grade />} label="CGPA" value="8.6" color="success" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard icon={<LibraryBooks />} label="Books Issued" value="2" color="secondary" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard icon={<Wallet />} label="Finance Dues" value="₹ 0" color="warning" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard icon={<School />} label="Enrollment Status" value="Active" color="info" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard icon={<Note />} label="New Notes" value="4" color="error" />
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentHome;


