import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow, Chip } from '@mui/material';

const ReportCard = () => {
  const rows = [
    { code: 'MTH101', name: 'Mathematics I', credits: 4, grade: 'A' },
    { code: 'PHY101', name: 'Physics', credits: 4, grade: 'B+' },
    { code: 'CSE101', name: 'Programming Basics', credits: 3, grade: 'A+' },
    { code: 'ENG101', name: 'English', credits: 2, grade: 'A' },
  ];

  const gradeColor = (g) => {
    switch (g) {
      case 'A+':
      case 'A':
        return 'success';
      case 'B+':
      case 'B':
        return 'primary';
      default:
        return 'warning';
    }
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Report Card
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Course Code</TableCell>
              <TableCell>Course Name</TableCell>
              <TableCell>Credits</TableCell>
              <TableCell>Grade</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {rows.map((r) => (
              <TableRow key={r.code}>
                <TableCell>{r.code}</TableCell>
                <TableCell>{r.name}</TableCell>
                <TableCell>{r.credits}</TableCell>
                <TableCell>
                  <Chip label={r.grade} color={gradeColor(r.grade)} size="small" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default ReportCard;


