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
  ListItemText,
  ListItemAvatar,
  Chip,
  CircularProgress,
  Alert
} from '@mui/material';
import {
  People as PeopleIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  TrendingUp as TrendingUpIcon,
  Assessment as AssessmentIcon,
  Home as HomeIcon
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const StatCard = ({ title, value, icon, color, trend }) => (
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

const Dashboard = () => {
  const [stats, setStats] = useState({
    total_students: 0,
    total_teachers: 0,
    total_users: 0,
    active_students: 0,
    active_teachers: 0,
  });

  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard-stats'],
    queryFn: async () => {
      const response = await axios.get('/accounts/dashboard-stats/');
      return response.data;
    },
  });

  useEffect(() => {
    if (dashboardData) {
      setStats(dashboardData);
    }
  }, [dashboardData]);

  const recentActivities = [
    // Recent activities will be populated from real data in the future
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
      <Typography variant="body1" color="text.secondary" gutterBottom>
        Welcome to the Student Management System admin panel. Here's an overview of your institution.
      </Typography>

      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* Statistics Cards */}
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

        {/* Recent Activities */}
        <Grid item xs={12} md={8}>
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

        {/* Quick Actions */}
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Typography variant="h6" gutterBottom>
              Quick Actions
            </Typography>
            <List>
              <ListItem button component="a" href="/admin/students">
                <ListItemText primary="Add New Student" />
              </ListItem>
              <ListItem button component="a" href="/admin/teachers">
                <ListItemText primary="Add New Teacher" />
              </ListItem>
              <ListItem button component="a" href="/admin/attendance">
                <ListItemText primary="Mark Attendance" />
              </ListItem>
              <ListItem button component="a" href="/admin/notices">
                <ListItemText primary="Publish Notice" />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
};

export default Dashboard;
