import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Grid,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Card,
  CardContent,
  Switch,
  FormControlLabel
} from '@mui/material';
import {
  Event as AttendanceIcon,
  QrCodeScanner as QRScannerIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon,
  Download as DownloadIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const AttendanceManagement = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [openQRDialog, setOpenQRDialog] = useState(false);
  const [openMarkDialog, setOpenMarkDialog] = useState(false);
  const [students, setStudents] = useState([]);
  const [studentsLoading, setStudentsLoading] = useState(false);
  const [attendanceMarks, setAttendanceMarks] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    subject: '',
    class_name: '',
    section: '',
    period: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [activeSessionId, setActiveSessionId] = useState(null);

  const queryClient = useQueryClient();

  const { data: sessions, isLoading, isError: isSessionsError, error: sessionsError } = useQuery({
    queryKey: ['sessions', selectedDate],
    queryFn: async () => {
      const response = await axios.get(`/attendance/sessions/?date=${selectedDate}`);
      return response.data;
    },
  });

  const { data: subjects, isError: isSubjectsError, error: subjectsError } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await axios.get('/attendance/subjects/');
      return response.data;
    },
  });

  const formatDate = (value) => {
    try {
      const d = new Date(value);
      if (isNaN(d.getTime())) return '-';
      return d.toLocaleDateString();
    } catch (_) {
      return '-';
    }
  };

  const createAttendanceMutation = useMutation({
    mutationFn: async (attendanceData) => {
      const response = await axios.post('/attendance/sessions/', attendanceData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sessions']);
      setOpenDialog(false);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        subject: '',
        class_name: '',
        section: '',
        period: 1
      });
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Failed to create attendance session');
    }
  });

  const markAttendanceMutation = useMutation({
    mutationFn: async (attendanceData) => {
      const response = await axios.post('/attendance/mark/', attendanceData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['sessions']);
      setOpenQRDialog(false);
      setQrCode('');
      setActiveSessionId(null);
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Failed to mark attendance');
    }
  });

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setError('');
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError('');
    setFormData({
      date: new Date().toISOString().split('T')[0],
      subject: '',
      class_name: '',
      section: '',
      period: 1
    });
  };

  const handleOpenQRDialog = (attendanceId) => {
    setOpenQRDialog(true);
    setQrCode(`ATTENDANCE:${attendanceId}:${selectedDate}`);
    setActiveSessionId(attendanceId);
    setError('');
  };

  const handleOpenMarkDialog = async (attendance) => {
    setOpenMarkDialog(true);
    setActiveSessionId(attendance.id);
    setError('');
    setStudentsLoading(true);

    try {
      // Fetch students for the class and section of the attendance session
      const response = await axios.get(`/students/?class=${encodeURIComponent(attendance.class_name)}&section=${encodeURIComponent(attendance.section || '')}`);
      const studentsData = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setStudents(studentsData);

      // Initialize marks to absent by default
      const initialMarks = {};
      studentsData.forEach((s) => { initialMarks[s.id] = 'absent'; });
      setAttendanceMarks(initialMarks);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load students');
    } finally {
      setStudentsLoading(false);
    }
  };

  const handleCloseMarkDialog = () => {
    setOpenMarkDialog(false);
    setStudents([]);
    setAttendanceMarks({});
    setActiveSessionId(null);
    setError('');
  };

  const toggleStudentStatus = (studentId) => {
    setAttendanceMarks(prev => ({
      ...prev,
      [studentId]: prev[studentId] === 'present' ? 'absent' : 'present'
    }));
  };

  const handleSaveMarks = async () => {
    if (!activeSessionId) return;
    setLoading(true);
    try {
      const posts = Object.keys(attendanceMarks).map((studentId) => {
        return axios.post('/attendance/mark/', {
          session: activeSessionId,
          student: parseInt(studentId, 10),
          status: attendanceMarks[studentId],
        });
      });

      await Promise.all(posts);
      queryClient.invalidateQueries(['sessions']);
      handleCloseMarkDialog();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save attendance marks');
    } finally {
      setLoading(false);
    }
  };

  const handleCloseQRDialog = () => {
    setOpenQRDialog(false);
    setQrCode('');
    setActiveSessionId(null);
    setError('');
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    createAttendanceMutation.mutate(formData);
    setLoading(false);
  };

  const handleMarkAttendance = (studentId, status) => {
    const attendanceData = {
      session: activeSessionId,
      student: studentId,
      status: status,
      remarks: ''
    };
    markAttendanceMutation.mutate(attendanceData);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'present': return 'success';
      case 'absent': return 'error';
      case 'late': return 'warning';
      case 'excused': return 'info';
      default: return 'default';
    }
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  if (isSessionsError) {
    return (
      <Box p={2}>
        <Alert severity="error">Failed to load attendance sessions{sessionsError?.message ? `: ${sessionsError.message}` : ''}</Alert>
      </Box>
    );
  }

  const sessionsArray = Array.isArray(sessions) ? sessions : (sessions?.results || []);
  const subjectsArray = Array.isArray(subjects) ? subjects : (subjects?.results || []);

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box display="flex" alignItems="center">
          <AttendanceIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4">
            Attendance Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Create Attendance Session
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            label="Select Date"
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            InputLabelProps={{ shrink: true }}
          />
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
          >
            Export Report
          </Button>
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Attendance Sessions ({sessionsArray.length})
        </Typography>
        
        {sessionsArray.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No attendance sessions for {new Date(selectedDate).toLocaleDateString()}. Create a session to start marking attendance!
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {sessionsArray.map((attendance) => (
              <Grid item xs={12} md={6} lg={4} key={attendance.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6" component="h2">
                        {attendance.subject_name}
                      </Typography>
                      <Chip
                        label={`Period ${attendance.period}`}
                        color="primary"
                        size="small"
                      />
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Class: {attendance.class_name} - {attendance.section}
                    </Typography>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Date: {formatDate(attendance?.date)}
                    </Typography>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                      <Typography variant="body2">
                        Total Students: {attendance.total_students || 0}
                      </Typography>
                      <Typography variant="body2">
                        Present: {attendance.present_count || 0}
                      </Typography>
                    </Box>
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Box display="flex" gap={1}>
                        <Button
                          variant="contained"
                          size="small"
                          onClick={() => handleOpenMarkDialog(attendance)}
                        >
                          Mark Attendance
                        </Button>
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<QRScannerIcon />}
                          onClick={() => handleOpenQRDialog(attendance.id)}
                        >
                          QR Scanner
                        </Button>
                      </Box>
                      <Box>
                        <Tooltip title="View Details">
                          <IconButton size="small">
                            <ViewIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Edit">
                          <IconButton size="small">
                            <EditIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Delete">
                          <IconButton size="small">
                            <DeleteIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            ))}
          </Grid>
        )}
      </Paper>

      {/* Create Attendance Session Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Create Attendance Session</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Date"
                  name="date"
                  type="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Subject</InputLabel>
                  <Select
                    name="subject"
                    value={formData.subject}
                    onChange={handleInputChange}
                    label="Subject"
                  >
                    {subjectsArray.map((subject) => (
                      <MenuItem key={subject.id} value={subject.id}>
                        {subject.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Period"
                  name="period"
                  type="number"
                  value={formData.period}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Class"
                  name="class_name"
                  value={formData.class_name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Section"
                  name="section"
                  value={formData.section}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleCloseDialog}>Cancel</Button>
            <Button
              type="submit"
              variant="contained"
              disabled={loading}
            >
              {loading ? <CircularProgress size={24} /> : 'Create Session'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* QR Code Scanner Dialog */}
      {/* Mark Attendance Dialog */}
      <Dialog open={openMarkDialog} onClose={handleCloseMarkDialog} maxWidth="md" fullWidth>
        <DialogTitle>Mark Attendance</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          {studentsLoading ? (
            <Box display="flex" justifyContent="center" py={4}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>Roll</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell>{s.roll_number || '-'}</TableCell>
                      <TableCell>{s.user?.first_name} {s.user?.last_name}</TableCell>
                      <TableCell>{s.current_class} {s.current_section}</TableCell>
                      <TableCell align="center">
                        <FormControlLabel
                          control={<Switch checked={attendanceMarks[s.id] === 'present'} onChange={() => toggleStudentStatus(s.id)} />}
                          label={attendanceMarks[s.id] === 'present' ? 'Present' : 'Absent'}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseMarkDialog}>Cancel</Button>
          <Button variant="contained" onClick={handleSaveMarks} disabled={loading || studentsLoading}>
            {loading ? <CircularProgress size={20} /> : 'Save Marks'}
          </Button>
        </DialogActions>
      </Dialog>
      <Dialog open={openQRDialog} onClose={handleCloseQRDialog} maxWidth="sm" fullWidth>
        <DialogTitle>QR Code Attendance Scanner</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          <Box textAlign="center" py={4}>
            <Typography variant="h6" gutterBottom>
              Scan Student QR Code
            </Typography>
            
            <Box 
              sx={{ 
                width: 200, 
                height: 200, 
                border: '2px dashed #ccc', 
                borderRadius: 2, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                mx: 'auto',
                mb: 3
              }}
            >
              <Typography variant="body2" color="text.secondary">
                QR Scanner Placeholder
              </Typography>
            </Box>
            
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Or manually enter student ID:
            </Typography>
            
            <TextField
              placeholder="Enter Student ID"
              variant="outlined"
              sx={{ mb: 2 }}
            />
            
            <Box display="flex" gap={2} justifyContent="center">
              <Button
                variant="contained"
                color="success"
                onClick={() => handleMarkAttendance(1, 'present')}
              >
                Mark Present
              </Button>
              <Button
                variant="contained"
                color="error"
                onClick={() => handleMarkAttendance(1, 'absent')}
              >
                Mark Absent
              </Button>
              <Button
                variant="contained"
                color="warning"
                onClick={() => handleMarkAttendance(1, 'late')}
              >
                Mark Late
              </Button>
            </Box>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseQRDialog}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AttendanceManagement;
