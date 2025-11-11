import React from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Grid, Paper, List, ListItem, ListItemText, Divider, Button, Link } from '@mui/material';
import { Assessment, LibraryBooks, Grade, Wallet, School, Note, Campaign } from '@mui/icons-material';

const StatCard = ({ icon, label, value, color, to }) => {
  return (
    <Paper
      elevation={2}
      component={to ? RouterLink : 'div'}
      to={to}
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 120ms ease',
        '&:hover': { transform: to ? 'translateY(-2px)' : 'none' }
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          bgcolor: `${color}.light`,
          color: `${color}.dark`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mr: 2,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="subtitle2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h6">{value}</Typography>
      </Box>
    </Paper>
  );
};

const StudentHome = () => {
  const cards = [
    { icon: <Assessment />, label: 'Attendance (This Month)', value: '—', color: 'primary', to: '/student/attendance' },
    { icon: <Grade />, label: 'CGPA', value: '—', color: 'success', to: '/student/results' },
    { icon: <LibraryBooks />, label: 'Books Issued', value: '—', color: 'secondary', to: '/student/library' },
    { icon: <Wallet />, label: 'Finance Dues', value: '—', color: 'warning', to: '/student/finance' },
    { icon: <School />, label: 'Enrollment Status', value: '—', color: 'info', to: '/student/admission' },
    { icon: <Note />, label: 'New Notes', value: '—', color: 'error', to: '/student/notes' },
  ];

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        My Overview
      </Typography>
      <Grid container spacing={2}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={4} key={card.label}>
            <StatCard {...card} />
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="h6">Recent Notices</Typography>
              <Button size="small" component={RouterLink} to="/student/notes">View all</Button>
            </Box>
            <Divider sx={{ mb: 1 }} />
            <List>
              <ListItem>
                <ListItemText primary="No notices yet." secondary="Check back soon." />
              </ListItem>
            </List>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
              <Campaign color="primary" />
              <Typography variant="h6">Quick Links</Typography>
            </Box>
            <Divider sx={{ mb: 1 }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Link component={RouterLink} to="/student/report-card" underline="hover">Report Card</Link>
              <Link component={RouterLink} to="/student/attendance" underline="hover">Attendance</Link>
              <Link component={RouterLink} to="/student/library" underline="hover">Library</Link>
              <Link component={RouterLink} to="/student/admission" underline="hover">Admission</Link>
              <Link component={RouterLink} to="/student/results" underline="hover">Results</Link>
              <Link component={RouterLink} to="/student/notes" underline="hover">Notes</Link>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentHome;


