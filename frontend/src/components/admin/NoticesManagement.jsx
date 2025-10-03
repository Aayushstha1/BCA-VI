import React from 'react';
import { Box, Typography, Paper, Alert } from '@mui/material';
import { Announcement as NoticeIcon } from '@mui/icons-material';

const NoticesManagement = () => {
  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <NoticeIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4">
          Notices Management
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Alert severity="info">
          Notices Management module is under development. This will include:
          <ul>
            <li>Notice creation and publishing</li>
            <li>Target audience selection</li>
            <li>Notice categories and priorities</li>
            <li>Read status tracking</li>
            <li>Notice archiving and search</li>
          </ul>
        </Alert>
      </Paper>
    </Box>
  );
};

export default NoticesManagement;
