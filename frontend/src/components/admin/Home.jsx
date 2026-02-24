import React, { useState, useEffect } from 'react';
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Avatar,
  Paper,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemAvatar,
  Chip,
  Button,
  CircularProgress,
  Alert,
  Divider,
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import CalendarWidget from '../CalendarWidget';

const StatCard = ({ title, value, icon, color }) => (
  <Card>
    <CardContent>
      <Box display="flex" alignItems="center" justifyContent="space-between">
        <Box>
          <Typography color="textSecondary" gutterBottom variant="h6">
            {title}
          </Typography>
          <Typography variant="h4" component="h2">
            {value}
          </Typography>
        </Box>
        <Avatar sx={{ bgcolor: color, width: 56, height: 56 }}>
          {icon}
        </Avatar>
      </Box>
    </CardContent>
  </Card>
);

const Home = () => {
  const queryClient = useQueryClient();
  const [stats, setStats] = useState({
    total_students: 0,
    total_teachers: 0,
    total_users: 0,
    active_students: 0,
    active_teachers: 0,
  });

  const [lastUpdated, setLastUpdated] = React.useState(null);

  const { data: dashboardData, isLoading, error, isFetching } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await axios.get('/accounts/dashboard-stats/');
      return response.data;
    },
    // Poll every 10 seconds for near-real-time stats
    refetchInterval: 10000,
    refetchOnWindowFocus: true,
    staleTime: 5000,
  });

  const { data: cvsData, isLoading: cvsLoading } = useQuery({
    queryKey: ['cvs'],
    queryFn: async () => (await axios.get('/students/cvs/')).data,
  });

  const approvalMutation = useMutation({
    mutationFn: async ({ id, status, reason }) => {
      return axios.patch(`/students/cvs/${id}/approve/`, {
        approval_status: status,
        rejection_reason: reason || '',
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cvs'] });
    },
  });

  const cvsList = Array.isArray(cvsData) ? cvsData : (cvsData?.results || []);
  const pendingCVs = cvsList.filter((cv) => cv.approval_status === 'pending').slice(0, 5);

  const handleApprove = (cv) => {
    approvalMutation.mutate({ id: cv.id, status: 'approved', reason: '' });
  };

  const handleReject = (cv) => {
    const reason = window.prompt('Reason for rejection (optional):', '');
    if (reason === null) return;
    approvalMutation.mutate({ id: cv.id, status: 'rejected', reason });
  };

  useEffect(() => {
    if (dashboardData) {
      setStats(dashboardData);
      setLastUpdated(new Date());
    }
  }, [dashboardData]);

  const recentActivities = [
    // Placeholder for future activity feed
  ];

  const getActivityIcon = (type) => {
    switch (type) {
      case 'student':
        return <SchoolIcon />;
      case 'teacher':
        return <PersonIcon />;
      case 'attendance':
        return <AssessmentIcon />;
      case 'notice':
        return <HomeIcon />;
      default:
        return <PeopleIcon />;
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'student':
        return 'primary';
      case 'teacher':
        return 'secondary';
      case 'attendance':
        return 'success';
      case 'notice':
        return 'warning';
      default:
        return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Alert severity="error">
        Failed to load dashboard data. Please try again.
      </Alert>
    );
  }

  return (
    <Box>
      <Typography variant="h4" gutterBottom>
        Admin Dashboard
      </Typography>

      <Box display="flex" alignItems="center" gap={1} mb={1}>
        {isFetching ? <CircularProgress size={14} /> : null}
        <Typography variant="body2" color="text.secondary">
          {lastUpdated ? `Last updated: ${new Date(lastUpdated).toLocaleTimeString()}` : 'Live updates enabled'}
        </Typography>
      </Box>

      <Typography variant="body1" color="text.secondary" gutterBottom>
        Welcome to the Student Management System admin panel. Here's an overview of your institution.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Total Students"
            value={stats.total_students}
            icon={<SchoolIcon />}
            color="primary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Total Teachers"
            value={stats.total_teachers}
            icon={<PersonIcon />}
            color="secondary.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Active Students"
            value={stats.active_students}
            icon={<TrendingUpIcon />}
            color="success.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Active Teachers"
            value={stats.active_teachers}
            icon={<PeopleIcon />}
            color="info.main"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={2.4}>
          <StatCard
            title="Total Users"
            value={stats.total_users}
            icon={<PeopleIcon />}
            color="warning.main"
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="h6">Pending CVs</Typography>
              <ListItemButton component="a" href="/admin/cvs" sx={{ width: 'auto', px: 2 }}>
                <ListItemText primary="View all" />
              </ListItemButton>
            </Box>
            <Divider sx={{ mb: 1 }} />
            {cvsLoading ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} />
              </Box>
            ) : pendingCVs.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 2 }}>
                No pending CVs.
              </Typography>
            ) : (
              <List>
                {pendingCVs.map((cv) => (
                  <ListItem
                    key={cv.id}
                    secondaryAction={
                      <Box display="flex" gap={1}>
                        <Button size="small" color="success" onClick={() => handleApprove(cv)}>
                          Approve
                        </Button>
                        <Button size="small" color="error" onClick={() => handleReject(cv)}>
                          Reject
                        </Button>
                      </Box>
                    }
                  >
                    <ListItemText
                      primary={cv.title}
                      secondary={cv.owner || 'Student'}
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <List>
              <ListItem disablePadding>
                <ListItemButton component="a" href="/admin/students">
                  <ListItemText primary="Add New Student" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton component="a" href="/admin/teachers">
                  <ListItemText primary="Add New Teacher" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton component="a" href="/admin/attendance">
                  <ListItemText primary="Mark Attendance" />
                </ListItemButton>
              </ListItem>
              <ListItem disablePadding>
                <ListItemButton component="a" href="/admin/notices">
                  <ListItemText primary="Publish Notice" />
                </ListItemButton>
              </ListItem>
            </List>
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Recent Activities
            </Typography>
            {recentActivities.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No recent activities to display. Activities will appear here as users interact with the system.
              </Typography>
            ) : (
              <List>
                {recentActivities.map((activity, index) => (
                  <ListItem key={index} divider={index < recentActivities.length - 1}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: `${getActivityColor(activity.type)}.light` }}>
                        {getActivityIcon(activity.type)}
                      </Avatar>
                    </ListItemAvatar>
                    <ListItemText
                      primary={activity.action}
                      secondary={
                        <Box display="flex" alignItems="center" gap={1}>
                          <Typography variant="body2" color="text.secondary">
                            {activity.user}
                          </Typography>
                          <Chip
                            label={activity.time}
                            size="small"
                            variant="outlined"
                            color={getActivityColor(activity.type)}
                          />
                        </Box>
                      }
                    />
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12}>
          <CalendarWidget canCreate title="Events Calendar" />
        </Grid>
      </Grid>
    </Box>
  );
};

export default Home;


