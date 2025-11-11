import React from 'react';
import { Box, Typography, Paper, LinearProgress, Grid } from '@mui/material';

const Attendance = () => {
  const subjects = [
    { name: 'Mathematics I', percent: 95 },
    { name: 'Physics', percent: 88 },
    { name: 'Programming Basics', percent: 92 },
    { name: 'English', percent: 86 },
  ];

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


