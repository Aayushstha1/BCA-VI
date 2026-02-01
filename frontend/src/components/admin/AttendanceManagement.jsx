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
  FormControlLabel,
  Avatar
} from '@mui/material';
import { CameraAlt as CameraAltIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
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
  const [uploading, setUploading] = useState({});
  const { user } = useAuth();
  const navigate = useNavigate();
  const [attendanceMarks, setAttendanceMarks] = useState({});
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    class_name: '',
    section: '',
    period: 1
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [qrCode, setQrCode] = useState('');
  const [activeSessionId, setActiveSessionId] = useState(null);
  const [duplicateSession, setDuplicateSession] = useState(null);

  const queryClient = useQueryClient();

  const { data: sessions, isLoading, isError: isSessionsError, error: sessionsError } = useQuery({
    queryKey: ['sessions', selectedDate],
    queryFn: async () => {
      const response = await axios.get(`/attendance/sessions/?date=${selectedDate}`);
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
      setDuplicateSession(null);
      setFormData({
        date: new Date().toISOString().split('T')[0],
        class_name: '',
        section: '',
        period: 1
      });
    },
    onError: (error) => {
      const data = error.response?.data;
      let msg = 'Failed to create attendance session';
      if (data) {
        if (typeof data === 'string') msg = data;
        else if (data.detail) msg = data.detail;
        else msg = JSON.stringify(data);
      }
      setError(msg);
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
      const data = error.response?.data;
      let msg = 'Failed to mark attendance';
      if (data) {
        if (typeof data === 'string') msg = data;
        else if (data.detail) msg = data.detail;
        else msg = JSON.stringify(data);
      }
      setError(msg);
    }
  });

  const handleOpenDialog = () => {
    setOpenDialog(true);
    setError('');
  };
 
  const handleCloseDialog = () => {
    setOpenDialog(false);
    setError('');
    setDuplicateSession(null);
    setFormData({
      date: new Date().toISOString().split('T')[0],
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
      let studentsData = Array.isArray(response.data) ? response.data : (response.data.results || []);

      // Sort students by roll number (numeric when possible), then by name
      studentsData.sort((a, b) => {
        const ra = parseInt(a.roll_number, 10);
        const rb = parseInt(b.roll_number, 10);
        if (!isNaN(ra) && !isNaN(rb)) return ra - rb;
        if (!isNaN(ra)) return -1;
        if (!isNaN(rb)) return 1;
        const na = ((a.user?.first_name || '') + ' ' + (a.user?.last_name || '')).trim();
        const nb = ((b.user?.first_name || '') + ' ' + (b.user?.last_name || '')).trim();
        return na.localeCompare(nb);
      });

      setStudents(studentsData);

      // Initialize marks to absent by default
      const initialMarks = {};
      studentsData.forEach((s) => { initialMarks[s.id] = 'absent'; });
      setAttendanceMarks(initialMarks);
    } catch (err) {
      const data = err.response?.data;
      let msg = 'Failed to load students';
      if (data) {
        if (typeof data === 'string') msg = data;
        else if (data.detail) msg = data.detail;
        else msg = JSON.stringify(data);
      }
      setError(msg);
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

  const uploadProfilePicture = async (studentId, file) => {
    setUploading((u) => ({ ...u, [studentId]: true }));
    try {
      const fd = new FormData();
      fd.append('profile_picture', file);
      const resp = await axios.put(`/students/${studentId}/profile-picture/`, fd, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      // Update student's profile_picture_url locally
      setStudents((prev) => prev.map((st) => st.id === studentId ? { ...st, profile_picture_url: resp.data.profile_picture_url || resp.data.profile_picture } : st));
      queryClient.invalidateQueries(['sessions']);
    } catch (err) {
      const data = err.response?.data;
      let msg = 'Failed to upload profile picture';
      if (data) {
        if (typeof data === 'string') msg = data;
        else if (data.detail) msg = data.detail;
        else msg = JSON.stringify(data);
      }
      setError(msg);
    } finally {
      setUploading((u) => ({ ...u, [studentId]: false }));
    }
  };

  const handleSaveMarks = async () => {
    if (!activeSessionId) return;
    setLoading(true);
    try {
      // Process requests sequentially to avoid SQLite database lock errors
      const studentIds = Object.keys(attendanceMarks);
      for (const studentId of studentIds) {
        await axios.post('/attendance/mark/', {
          session: activeSessionId,
          student: parseInt(studentId, 10),
          status: attendanceMarks[studentId],
        });
      }

      queryClient.invalidateQueries(['sessions']);
      handleCloseMarkDialog();
    } catch (err) {
      const data = err.response?.data;
      let msg = 'Failed to save attendance marks';
      if (data) {
        if (typeof data === 'string') msg = data;
        else if (data.detail) msg = data.detail;
        else msg = JSON.stringify(data);
      }
      setError(msg);
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    // Remove any empty string fields (e.g., subject: '') so serializer doesn't reject them
    const payload = { ...formData };
    Object.keys(payload).forEach((k) => {
      if (payload[k] === '') delete payload[k];
    });

    // Client-side uniqueness check: avoid POSTing a duplicate session
    try {
      const checkDate = payload.date || selectedDate;
      let sessionsForDate = sessionsArray;
      if (checkDate !== selectedDate) {
        const resp = await axios.get(`/attendance/sessions/?date=${checkDate}`);
        sessionsForDate = Array.isArray(resp.data) ? resp.data : (resp.data.results || []);
      }

      const duplicate = sessionsForDate.find((s) => (
        s.class_name === payload.class_name &&
        (s.section || '') === (payload.section || '') &&
        parseInt(s.period, 10) === parseInt(payload.period, 10)
      ));

        if (duplicate) {
        setError('An attendance session for this date, period, class and section already exists.');
        setDuplicateSession(duplicate);
        setLoading(false);
        return;
      }
    } catch (err) {
      // If check fails, still attempt creation; server-side validation will catch duplicates
      // but surface the exact message in the dialog.
    }

    createAttendanceMutation.mutate(payload);
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
                        {attendance.class_name} {attendance.section}
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
              <>
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
                {duplicateSession && (
                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mb: 2 }}>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        // Close the create dialog and open the existing session for marking
                        setOpenDialog(false);
                        setTimeout(() => handleOpenMarkDialog(duplicateSession), 0);
                      }}
                    >
                      Open existing session
                    </Button>
                  </Box>
                )}
              </>
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
                    <TableCell>Photo</TableCell>
                    <TableCell>Roll</TableCell>
                    <TableCell>Name</TableCell>
                    <TableCell>Class</TableCell>
                    <TableCell align="center">Status</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {students.map((s) => (
                    <TableRow key={s.id} hover>
                      <TableCell>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <IconButton
                            size="small"
                            onClick={() => navigate(`/public/student/${s.student_id}`)}
                            aria-label="Open profile"
                          >
                            <Avatar
                              alt={`${(s.user_details?.first_name || '')} ${(s.user_details?.last_name || '')}`.trim() || s.user || s.student_id}
                              src={s.profile_picture_url || s.user_details?.profile_picture}
                              sx={{ width: 56, height: 56 }}
                            />
                          </IconButton>

                          {user && user.role === 'admin' && (
                            <>
                              <input
                                type="file"
                                accept="image/*"
                                id={`pf-${s.id}`}
                                style={{ display: 'none' }}
                                onChange={(e) => {
                                  const f = e.target.files && e.target.files[0];
                                  if (f) uploadProfilePicture(s.id, f);
                                }}
                              />
                              <Tooltip title="Upload photo">
                                <span>
                                  <IconButton
                                    size="small"
                                    onClick={() => document.getElementById(`pf-${s.id}`).click()}
                                    disabled={uploading[s.id]}
                                  >
                                    {uploading[s.id] ? <CircularProgress size={20} /> : <CameraAltIcon fontSize="small" />}
                                  </IconButton>
                                </span>
                              </Tooltip>
                            </>
                          )}
                        </Box>
                      </TableCell>
                      <TableCell>{s.roll_number || '-'}</TableCell>
                      <TableCell>{`${(s.user_details?.first_name || '')} ${(s.user_details?.last_name || '')}`.trim() || s.user || s.student_id}</TableCell>
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
