import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Chip } from '@mui/material';

const Results = () => {
  const items = [
    { course: 'Data Structures', status: 'Submitted' },
    { course: 'DBMS', status: 'Pending' },
    { course: 'Operating Systems', status: 'Submitted' },
  ];
  const color = (s) => (s === 'Submitted' ? 'success' : 'warning');
  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Results Management
      </Typography>
      <Paper>
        <List>
          {items.map((x, i) => (
            <ListItem key={i} divider>
              <ListItemText primary={x.course} />
              <Chip label={x.status} color={color(x.status)} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default Results;


