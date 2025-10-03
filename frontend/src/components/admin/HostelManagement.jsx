import React from 'react';
import { Box, Typography, Paper, Alert } from '@mui/material';
import { Home as HomeIcon } from '@mui/icons-material';

const HostelManagement = () => {
  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <HomeIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4">
          Hostel Management
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Alert severity="info">
          Hostel Management module is under development. This will include:
          <ul>
            <li>Hostel and room allocation</li>
            <li>Room availability tracking</li>
            <li>Hostel fee management</li>
            <li>Maintenance requests</li>
            <li>Hostel occupancy reports</li>
          </ul>
        </Alert>
      </Paper>
    </Box>
  );
};

export default HostelManagement;
