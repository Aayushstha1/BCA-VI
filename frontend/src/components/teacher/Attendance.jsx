import React from 'react';
import { Box, Typography, Paper, Table, TableHead, TableRow, TableCell, TableBody, Button } from '@mui/material';

const Attendance = () => {
  const rows = [
    { date: '2025-11-10', class: 'CSE201', present: 42, total: 45 },
    { date: '2025-11-09', class: 'CSE205', present: 38, total: 40 },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Attendance
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Date</TableCell>
              <TableCell>Class</TableCell>
              <TableCell align="right">Present</TableCell>
              <TableCell align="right">Total</TableCell>
              <TableCell align="right">Actions</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r, i) => (
              <TableRow key={i}>
                <TableCell>{r.date}</TableCell>
                <TableCell>{r.class}</TableCell>
                <TableCell align="right">{r.present}</TableCell>
                <TableCell align="right">{r.total}</TableCell>
                <TableCell align="right">
                  <Button size="small" variant="outlined">View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default Attendance;


