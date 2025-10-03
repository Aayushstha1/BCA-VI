import React from 'react';
import { Box, Typography, Paper, Alert } from '@mui/material';
import { LibraryBooks as LibraryIcon } from '@mui/icons-material';

const LibraryManagement = () => {
  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <LibraryIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4">
          Library Management
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Alert severity="info">
          Library Management module is under development. This will include:
          <ul>
            <li>Book catalog management</li>
            <li>Book issue and return tracking</li>
            <li>Fine calculation and collection</li>
            <li>Library reports and analytics</li>
            <li>Book reservation system</li>
          </ul>
        </Alert>
      </Paper>
    </Box>
  );
};

export default LibraryManagement;
