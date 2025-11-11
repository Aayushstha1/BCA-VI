import React from 'react';
import { Box, Typography, Paper, Grid, Divider } from '@mui/material';

const Field = ({ label, value }) => (
  <Box sx={{ mb: 1.5 }}>
    <Typography variant="caption" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body1">{value}</Typography>
  </Box>
);

const Finance = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Finance
      </Typography>
      <Paper sx={{ p: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <Field label="Total Fee" value="—" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Field label="Paid" value="—" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Field label="Due" value="—" />
          </Grid>
          <Grid item xs={12} sm={6} md={3}>
            <Field label="Last Payment" value="—" />
          </Grid>
        </Grid>
        <Divider sx={{ my: 2 }} />
        <Typography variant="body2" color="text.secondary">
          Finance details will appear here once bills are generated.
        </Typography>
      </Paper>
    </Box>
  );
};

export default Finance;
