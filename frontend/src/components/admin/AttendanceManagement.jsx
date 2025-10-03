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

  const queryClient = useQueryClient();

  const { data: attendances, isLoading } = useQuery({
    queryKey: ['attendances', selectedDate],
    queryFn: async () => {
      const response = await axios.get(`/attendance/?date=${selectedDate}`);
      return response.data;
    },
  });

  const { data: subjects } = useQuery({
    queryKey: ['subjects'],
    queryFn: async () => {
      const response = await axios.get('/attendance/subjects/');
      return response.data;
    },
  });

  const createAttendanceMutation = useMutation({
    mutationFn: async (attendanceData) => {
      const response = await axios.post('/attendance/', attendanceData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['attendances']);
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
      queryClient.invalidateQueries(['attendances']);
      setOpenQRDialog(false);
      setQrCode('');
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
    setError('');
  };

  const handleCloseQRDialog = () => {
    setOpenQRDialog(false);
    setQrCode('');
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
      student: studentId,
      date: selectedDate,
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
          Attendance Sessions ({attendances?.length || 0})
        </Typography>
        
        {!attendances || attendances.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No attendance sessions for {new Date(selectedDate).toLocaleDateString()}. Create a session to start marking attendance!
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {attendances.map((attendance) => (
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
                      Date: {new Date(attendance.date).toLocaleDateString()}
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
                      <Button
                        variant="contained"
                        size="small"
                        startIcon={<QRScannerIcon />}
                        onClick={() => handleOpenQRDialog(attendance.id)}
                      >
                        QR Scanner
                      </Button>
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
                    {subjects?.map((subject) => (
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
