import React from 'react';
import { Box, Typography, Grid, Paper, CircularProgress, Alert, List, ListItem, ListItemText, Divider, Button } from '@mui/material';
import { Class as ClassIcon, Assessment, LibraryBooks, Note, CalendarMonth, Groups, Campaign } from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import CalendarWidget from '../CalendarWidget';

const StatCard = ({ icon, label, value, color }) => {
  return (
    <Paper elevation={2} sx={{ p: 2, display: 'flex', alignItems: 'center' }}>
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

const TeacherHome = () => {
  const queryClient = useQueryClient();
  // Students
  const {
    data: students,
    isLoading: studentsLoading,
    isError: studentsError,
  } = useQuery({
    queryKey: ['students', 'stats'],
    queryFn: async () => {
      const res = await axios.get('/students/');
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
      return list;
    },
  });

  // Attendance sessions
  const {
    data: sessions,
    isLoading: sessionsLoading,
    isError: sessionsError,
  } = useQuery({
    queryKey: ['attendance-sessions', 'stats'],
    queryFn: async () => {
      const res = await axios.get('/attendance/sessions/');
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
      return list;
    },
  });

  // Notes
  const {
    data: notes,
    isLoading: notesLoading,
    isError: notesError,
  } = useQuery({
    queryKey: ['notes', 'stats'],
    queryFn: async () => {
      const res = await axios.get('/notes/');
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
      return list;
    },
  });

  // Library resources
  const {
    data: books,
    isLoading: booksLoading,
    isError: booksError,
  } = useQuery({
    queryKey: ['books', 'stats'],
    queryFn: async () => {
      const res = await axios.get('/library/books/');
      const list = Array.isArray(res.data) ? res.data : res.data?.results || [];
      return list;
    },
  });

  // Notices
  const {
    data: notices,
    isLoading: noticesLoading,
  } = useQuery({
    queryKey: ['notices'],
    queryFn: async () => {
      const res = await axios.get('notices/');
      return Array.isArray(res.data) ? res.data.slice(0, 5) : (res.data?.results || []).slice(0, 5);
    },
  });

  const { data: cvsData, isLoading: cvsLoading } = useQuery({
    queryKey: ['teacher-cvs'],
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
      queryClient.invalidateQueries({ queryKey: ['teacher-cvs'] });
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

  const loading = studentsLoading || sessionsLoading || notesLoading || booksLoading;
  const hasError = studentsError || sessionsError || notesError || booksError;

  // Compute derived stats
  const studentCount = (students || []).length;

  const now = new Date();
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() - 7);

  const sessionsList = sessions || [];
  const sessionsThisWeek = sessionsList.filter((s) => {
    if (!s.date) return false;
    const d = new Date(s.date);
    if (isNaN(d.getTime())) return false;
    return d >= startOfWeek && d <= now;
  });

  const activeClasses = Array.from(
    new Set(
      sessionsThisWeek
        .map((s) => s.class_name)
        .filter(Boolean),
    ),
  ).length;

  // Attendance marked: how many sessions this week have at least one present student
  const attendanceMarkedSessions = sessionsThisWeek.filter(
    (s) => (s.present_count || 0) > 0,
  ).length;

  const notesList = notes || [];
  const booksList = books || [];

  // For "this week" counts for notes/resources, you can later add a date filter if backend provides it.
  const resourcesShared = booksList.length;
  const notesUpdated = notesList.length;

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        Teaching Overview
      </Typography>

      {loading && (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="20vh" mb={2}>
          <CircularProgress />
        </Box>
      )}

      {hasError && (
        <Box mb={2}>
          <Alert severity="warning">
            Some dashboard stats could not be loaded. Showing what is available.
          </Alert>
        </Box>
      )}

      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard icon={<Groups />} label="Total Students" value={studentCount} color="primary" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<ClassIcon />}
            label="Active Classes (This Week)"
            value={activeClasses}
            color="success"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<CalendarMonth />}
            label="Sessions This Week"
            value={sessionsThisWeek.length}
            color="secondary"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<Assessment />}
            label="Attendance Sessions Marked"
            value={attendanceMarkedSessions}
            color="info"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<LibraryBooks />}
            label="Resources Shared"
            value={resourcesShared}
            color="warning"
          />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatCard
            icon={<Note />}
            label="Notes Updated"
            value={notesUpdated}
            color="error"
          />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
              <Campaign color="primary" />
              <Typography variant="h6">Recent Notices</Typography>
            </Box>
            <Divider sx={{ mb: 1 }} />
            {noticesLoading ? (
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
              <Typography color="text.secondary" sx={{ p: 2, textAlign: 'center' }}>
                No notices yet.
              </Typography>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="h6">Pending CVs</Typography>
              <Button size="small" href="/teacher/cvs">View all</Button>
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
      </Grid>

      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12}>
          <CalendarWidget canCreate title="Events Calendar" />
        </Grid>
      </Grid>
    </Box>
  );
};

export default TeacherHome;


