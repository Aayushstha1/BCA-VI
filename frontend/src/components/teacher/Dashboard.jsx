import React from 'react';
import { Box, Typography, Grid, Paper } from '@mui/material';
import { Class as ClassIcon, Assessment, LibraryBooks, Note, CalendarMonth, Groups } from '@mui/icons-material';

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

const TeacherHome = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Teaching Overview
      </Typography>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard icon={<Groups />} label="Total Students" value="132" color="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard icon={<ClassIcon />} label="Active Classes" value="5" color="success" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard icon={<CalendarMonth />} label="Sessions This Week" value="18" color="secondary" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard icon={<Assessment />} label="Attendance Marked" value="96%" color="info" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard icon={<LibraryBooks />} label="Resources Shared" value="12" color="warning" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard icon={<Note />} label="Notes Updated" value="3" color="error" />
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeacherHome;


