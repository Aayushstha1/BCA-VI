import React from 'react';
import { Box, Typography, Paper, Table, TableBody, TableCell, TableHead, TableRow } from '@mui/material';

const Results = () => {
  const terms = [
    { term: 'Semester 1', sgpa: 8.2, passed: 6, backlogs: 0 },
    { term: 'Semester 2', sgpa: 8.9, passed: 6, backlogs: 0 },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Results
      </Typography>
      <Paper sx={{ p: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Term</TableCell>
              <TableCell>SGPA</TableCell>
              <TableCell>Passed</TableCell>
              <TableCell>Backlogs</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {terms.map((t) => (
              <TableRow key={t.term}>
                <TableCell>{t.term}</TableCell>
                <TableCell>{t.sgpa}</TableCell>
                <TableCell>{t.passed}</TableCell>
                <TableCell>{t.backlogs}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>
    </Box>
  );
};

export default Results;


