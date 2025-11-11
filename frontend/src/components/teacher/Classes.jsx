import React from 'react';
import { Box, Typography, Paper, List, ListItem, ListItemText, Chip } from '@mui/material';

const Classes = () => {
  const classes = [
    { code: 'CSE201', name: 'Data Structures', section: 'A', schedule: 'Mon/Wed 10:00-11:30' },
    { code: 'CSE205', name: 'DBMS', section: 'B', schedule: 'Tue/Thu 12:00-1:30' },
    { code: 'CSE210', name: 'OS', section: 'A', schedule: 'Fri 10:00-12:00' },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        My Classes
      </Typography>
      <Paper>
        <List>
          {classes.map((c) => (
            <ListItem key={c.code} divider>
              <ListItemText primary={`${c.code} - ${c.name}`} secondary={c.schedule} />
              <Chip label={`Section ${c.section}`} />
            </ListItem>
          ))}
        </List>
      </Paper>
    </Box>
  );
};

export default Classes;


