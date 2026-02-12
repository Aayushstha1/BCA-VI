import React, { useMemo } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import { Box, Typography, Grid, Paper, List, ListItem, ListItemText, Divider, Button, Link, CircularProgress } from '@mui/material';
import { Assessment, LibraryBooks, Grade, Wallet, School, Note, Campaign } from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';
import CalendarWidget from '../CalendarWidget';
import { useAuth } from '../../contexts/AuthContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

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
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  const cards = [
    { icon: <Assessment />, label: 'Attendance (This Month)', value: '—', color: 'primary', to: '/student/attendance' },
    { icon: <Grade />, label: 'CGPA', value: '—', color: 'success', to: '/student/results' },
    { icon: <LibraryBooks />, label: 'Books Issued', value: '—', color: 'secondary', to: '/student/library' },
    { icon: <Wallet />, label: 'Finance Dues', value: '—', color: 'warning', to: '/student/finance' },
    { icon: <School />, label: 'Enrollment Status', value: '—', color: 'info', to: '/student/admission' },
    { icon: <Note />, label: 'New Notes', value: '—', color: 'error', to: '/student/notes' },
  ];

  const { data: notices, isLoading } = useQuery({
    queryKey: ['notices'],
    queryFn: async () => {
      const response = await axios.get('notices/');
      return Array.isArray(response.data) ? response.data.slice(0, 5) : (response.data?.results || []).slice(0, 5);
    },
  });

  const {
    data: progressResponse,
    isLoading: isProgressLoading,
    error: progressError,
  } = useQuery({
    queryKey: ['attendance-progress', currentYear],
    queryFn: async () => {
      const response = await axios.get(`attendance/progress/yearly/?year=${currentYear}`);
      return response.data;
    },
  });

  const {
    data: monthlyResponse,
    isLoading: isMonthlyLoading,
    error: monthlyError,
  } = useQuery({
    queryKey: ['attendance-progress-monthly', currentYear, currentMonth],
    queryFn: async () => {
      const response = await axios.get(`attendance/progress/monthly/?year=${currentYear}&month=${currentMonth}`);
      return response.data;
    },
  });

  const yearlyProgressData = useMemo(() => {
    const base = monthLabels.map((label, index) => ({
      month: label,
      progress: 0,
      total_days: 0,
      present_days: 0,
      month_index: index + 1,
    }));

    if (!progressResponse?.data) return base;
    const byMonth = new Map(progressResponse.data.map((item) => [item.month, item]));
    return base.map((entry) => {
      const monthData = byMonth.get(entry.month_index);
      if (!monthData) return entry;
      return {
        ...entry,
        progress: Math.round(monthData.progress || 0),
        total_days: monthData.total_days || 0,
        present_days: monthData.present_days || 0,
      };
    });
  }, [progressResponse, monthLabels]);

  const averageProgress = useMemo(() => {
    if (!yearlyProgressData.length) return 0;
    const total = yearlyProgressData.reduce((sum, item) => sum + item.progress, 0);
    return Math.round(total / yearlyProgressData.length);
  }, [yearlyProgressData]);

  const monthlyPieData = useMemo(() => {
    if (!monthlyResponse) return [];
    const present = monthlyResponse.present_days || 0;
    const late = monthlyResponse.late_days || 0;
    const absent = monthlyResponse.absent_days || 0;
    const excused = monthlyResponse.excused_days || 0;
    const data = [
      { name: 'Present', value: present },
      { name: 'Late', value: late },
      { name: 'Absent', value: absent },
      { name: 'Excused', value: excused },
    ];
    return data.filter((d) => d.value > 0);
  }, [monthlyResponse]);

  const monthlyProgressPercent = Math.round(monthlyResponse?.progress || 0);
  const monthlyTotalDays = monthlyResponse?.total_days || 0;
  const monthLabel = monthLabels[currentMonth - 1];

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
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Box>
                <Typography variant="h6">Yearly Progress ({currentYear})</Typography>
                <Typography variant="body2" color="text.secondary">
                  Monthly progress trend for the academic year
                </Typography>
              </Box>
              <Typography variant="h6" color="primary">
                Avg: {averageProgress}%
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {progressError ? (
              <Typography color="error" sx={{ py: 2 }}>
                Failed to load yearly progress.
              </Typography>
            ) : isProgressLoading ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={30} />
              </Box>
            ) : (
              <Box sx={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yearlyProgressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <RechartsTooltip
                      formatter={(value) => [`${value}%`, 'Progress']}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Line type="monotone" dataKey="progress" stroke="#1976d2" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Box>
                <Typography variant="h6">Monthly Progress</Typography>
                <Typography variant="body2" color="text.secondary">
                  {monthLabel} {currentYear} â€¢ {monthlyTotalDays} days
                </Typography>
              </Box>
              <Typography variant="h6" color="primary">
                {monthlyProgressPercent}%
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {monthlyError ? (
              <Typography color="error" sx={{ py: 2 }}>
                Failed to load monthly progress.
              </Typography>
            ) : isMonthlyLoading ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={30} />
              </Box>
            ) : monthlyPieData.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2 }}>
                No attendance data for this month.
              </Typography>
            ) : (
              <Box sx={{ width: '100%', height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={monthlyPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {monthlyPieData.map((entry, index) => {
                        const colors = ['#2e7d32', '#ffb300', '#d32f2f', '#6d4c41'];
                        return <Cell key={`cell-${entry.name}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} />
                    <RechartsTooltip formatter={(value, name) => [`${value}`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="h6">Recent Notices</Typography>
              <Button size="small" component={RouterLink} to="/student/notes">View all</Button>
            </Box>
            <Divider sx={{ mb: 1 }} />
            {isLoading ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={30} />
              </Box>
            ) : (notices && notices.length > 0) ? (
              <List>
                {notices.map((notice) => (
                  <ListItem key={notice.id}>
                    <ListItemText 
                      primary={notice.title}
                      secondary={`${notice.priority} • ${new Date(notice.published_at).toLocaleDateString()}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <List>
                <ListItem>
                  <ListItemText primary="No notices yet." secondary="Check back soon." />
                </ListItem>
              </List>
            )}
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

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12}>
          <CalendarWidget title="Events Calendar" />
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentHome;


