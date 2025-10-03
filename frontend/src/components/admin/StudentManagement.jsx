import React from 'react';
import { Box, Typography, Paper, Alert } from '@mui/material';
import { School as SchoolIcon } from '@mui/icons-material';

const StudentManagement = () => {
  return (
    <Box>
      <Box display="flex" alignItems="center" mb={3}>
        <SchoolIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4">
          Student Management
        </Typography>
      </Box>

      <Paper sx={{ p: 3 }}>
        <Alert severity="info">
          Student Management module is under development. This will include:
          <ul>
            <li>Student registration with QR code generation</li>
            <li>Student profile management</li>
            <li>Academic information tracking</li>
            <li>QR code scanning for attendance</li>
            <li>Student search and filtering</li>
          </ul>
        </Alert>
      </Paper>
    </Box>
  );
};

export default StudentManagement;
