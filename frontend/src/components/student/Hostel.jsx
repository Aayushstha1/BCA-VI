import React from 'react';
import { Box, Typography } from '@mui/material';
import HostelModule from './HostelModule';

const Hostel = () => {
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 2 }}>
        Hostel
      </Typography>
      <HostelModule subtitle="Student Hostel" />
    </Box>
  );
};

export default Hostel;
