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
  IconButton,
  Tooltip,
  Avatar,
  Card,
  CardContent,
  Divider
} from '@mui/material';
import {
  School as SchoolIcon,
  Add as AddIcon,
  QrCode as QRCodeIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  PhotoCamera as CameraIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

// Add missing import for Chip used in the table
import { Chip } from '@mui/material';

const StudentManagement = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openQRDialog, setOpenQRDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [openProfileDialog, setOpenProfileDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [studentProfile, setStudentProfile] = useState(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [selectedProfileFile, setSelectedProfileFile] = useState(null);
  const [qrData, setQrData] = useState(null);
  const [tempPasswordDialogOpen, setTempPasswordDialogOpen] = useState(false);
  const [temporaryPassword, setTemporaryPassword] = useState('');
  const [resettingPassword, setResettingPassword] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone: '',
    admission_date: '',
    date_of_birth: '',
    gender: '',
    blood_group: '',
    father_name: '',
    mother_name: '',
    guardian_contact: '',
    current_class: '',
    current_section: '',
    roll_number: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const queryClient = useQueryClient();

  const { data: students, isLoading } = useQuery({
    queryKey: ['students'],
    queryFn: async () => {
      const response = await axios.get('/students/');
      return response.data;
    },
  });

  const createStudentMutation = useMutation({
    mutationFn: async (studentData) => {
      // Normalize and sanitize payload
      const payload = { ...studentData };

      // Map gender text to codes expected by backend
      if (payload.gender && !['M', 'F', 'O'].includes(payload.gender)) {
        const g = String(payload.gender).trim().toLowerCase();
        if (g === 'male') payload.gender = 'M';
        else if (g === 'female') payload.gender = 'F';
        else if (g === 'other' || g === 'others') payload.gender = 'O';
      }

      Object.keys(payload).forEach((key) => {
        if (payload[key] === '') {
          // Set known optional fields to null; otherwise remove
          if (['phone', 'blood_group'].includes(key)) {
            payload[key] = null;
          } else {
            delete payload[key];
          }
        }
      });
      const response = await axios.post('/students/', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      setOpenDialog(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        first_name: '',
        last_name: '',
        phone: '',
        admission_date: '',
        date_of_birth: '',
        gender: '',
        blood_group: '',
        father_name: '',
        mother_name: '',
        guardian_contact: '',
        current_class: '',
        current_section: '',
        roll_number: ''
      });
    },
    onError: (error) => {
      const data = error.response?.data;
      let msg = data?.message || 'Failed to create student';
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const firstKey = Object.keys(data)[0];
        if (firstKey) {
          const val = data[firstKey];
          if (Array.isArray(val)) msg = val[0];
          else if (typeof val === 'string') msg = val;
        }
      }
      setError(msg);
    }
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId) => {
      await axios.delete(`/students/${studentId}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      setOpenDeleteDialog(false);
      setSelectedStudent(null);
    },
    onError: (error) => {
      const data = error.response?.data;
      setError(data?.message || 'Failed to delete student');
    }
  });

  const updateStudentMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      // Only send student fields, not nested user
      const payload = { ...updates };
      // Normalize gender codes if needed
      if (payload.gender && !['M', 'F', 'O'].includes(payload.gender)) {
        const g = String(payload.gender).trim().toLowerCase();
        if (g === 'male') payload.gender = 'M';
        else if (g === 'female') payload.gender = 'F';
        else if (g === 'other' || g === 'others') payload.gender = 'O';
      }
      Object.keys(payload).forEach((k) => {
        if (payload[k] === '') delete payload[k];
      });
      const res = await axios.put(`/students/${id}/`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['students']);
      setOpenEditDialog(false);
      setSelectedStudent(null);
    },
    onError: (error) => {
      const data = error.response?.data;
      let msg = data?.message || 'Failed to update student';
      if (data && typeof data === 'object' && !Array.isArray(data)) {
        const firstKey = Object.keys(data)[0];
        if (firstKey) {
          const val = data[firstKey];
          if (Array.isArray(val)) msg = val[0];
          else if (typeof val === 'string') msg = val;
        }
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
    setFormData({
      username: '',
      email: '',
      password: '',
      password_confirm: '',
      first_name: '',
      last_name: '',
      phone: '',
      admission_date: '',
      date_of_birth: '',
      gender: '',
      blood_group: '',
      father_name: '',
      mother_name: '',
      guardian_contact: '',
      current_class: '',
      current_section: '',
      roll_number: ''
    });
  };

  const { user } = useAuth();

  const handleResetPassword = async () => {
    if (!selectedStudent) return;
    if (!user || user.role !== 'admin') {
      setError('Permission denied');
      return;
    }

    try {
      setResettingPassword(true);
      setError('');
      const resp = await axios.post(`/students/${selectedStudent.id}/reset-password/`);
      setTemporaryPassword(resp.data.temporary_password || '');
      setTempPasswordDialogOpen(true);
    } catch (err) {
      setError('Failed to reset password');
    } finally {
      setResettingPassword(false);
    }
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
    createStudentMutation.mutate(formData);
    setLoading(false);
  };

  const studentsArray = Array.isArray(students) ? students : (students?.results || []);

  const filteredStudents = studentsArray.filter(student => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      student.student_id?.toLowerCase().includes(query) ||
      student.user_details?.first_name?.toLowerCase().includes(query) ||
      student.user_details?.last_name?.toLowerCase().includes(query) ||
      student.current_class?.toLowerCase().includes(query) ||
      student.roll_number?.toLowerCase().includes(query)
    );
  });

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
          <SchoolIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4">
            Student Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add New Student
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            placeholder="Search students..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />
            }}
            sx={{ flexGrow: 1 }}
          />
        </Box>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Students ({filteredStudents.length})
        </Typography>
        
        {filteredStudents.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            {searchQuery ? 'No students found matching your search.' : 'No students found. Add your first student!'}
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Student ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Class</TableCell>
                  <TableCell>Section</TableCell>
                  <TableCell>Roll No.</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>{student.student_id}</TableCell>
                    <TableCell>
                      {student.user_details?.first_name} {student.user_details?.last_name}
                    </TableCell>
                    <TableCell>{student.current_class}</TableCell>
                    <TableCell>{student.current_section}</TableCell>
                    <TableCell>{student.roll_number}</TableCell>
                    <TableCell>
                      <Chip
                        label={student.is_active ? 'Active' : 'Inactive'}
                        color={student.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="View Profile">
                        <IconButton size="small" onClick={async () => {
                          setSelectedStudent(student);
                          setProfileLoading(true);
                          setSelectedProfileFile(null);
                          setError('');
                          try {
                            const resp = await axios.get(`/students/${student.id}/profile/`);
                            setStudentProfile(resp.data);
                          } catch (e) {
                            setError('Failed to load student profile');
                            setStudentProfile(null);
                          }
                          setProfileLoading(false);
                          setOpenProfileDialog(true);
                        }}>
                          <ViewIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="View QR Code">
                      <IconButton size="small" onClick={async () => {
                        setSelectedStudent(student);
                        setError('');
                        try {
                          const resp = await axios.get(`/students/${student.id}/qr-code/`);
                          setQrData(resp.data);
                        } catch (e) {
                          setQrData(null);
                        }
                        setOpenQRDialog(true);
                      }}>
                          <QRCodeIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Edit">
                      <IconButton size="small" onClick={() => {
                        setSelectedStudent(student);
                        // Pre-fill form with student fields for editing
                        setFormData({
                          ...formData,
                          username: student.user_details?.username || '',
                          password: '',
                          password_confirm: '',
                          admission_date: student.admission_date || '',
                          date_of_birth: student.date_of_birth || '',
                          gender: student.gender || '',
                          blood_group: student.blood_group || '',
                          father_name: student.father_name || '',
                          mother_name: student.mother_name || '',
                          guardian_contact: student.guardian_contact || '',
                          current_class: student.current_class || '',
                          current_section: student.current_section || '',
                          roll_number: student.roll_number || ''
                        });
                        setOpenEditDialog(true);
                        setError('');
                      }}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                      <IconButton size="small" onClick={() => {
                        setSelectedStudent(student);
                        setOpenDeleteDialog(true);
                        setError('');
                      }}>
                          <DeleteIcon />
                        </IconButton>
                      </Tooltip>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      {/* Add Student Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Add New Student</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Grid container spacing={2}>
              {/* Account Information */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  Account Information
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Email"
                  name="email"
                  type="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="First Name"
                  name="first_name"
                  value={formData.first_name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Last Name"
                  name="last_name"
                  value={formData.last_name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="password_confirm"
                  type="password"
                  value={formData.password_confirm}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Phone"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                />
              </Grid>

              {/* Academic Information */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Academic Information
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Admission Date"
                  name="admission_date"
                  type="date"
                  value={formData.admission_date}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Date of Birth"
                  name="date_of_birth"
                  type="date"
                  value={formData.date_of_birth}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Gender"
                  name="gender"
                  value={formData.gender}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Blood Group"
                  name="blood_group"
                  value={formData.blood_group}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Father's Name"
                  name="father_name"
                  value={formData.father_name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Mother's Name"
                  name="mother_name"
                  value={formData.mother_name}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Guardian Contact"
                  name="guardian_contact"
                  value={formData.guardian_contact}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Current Class"
                  name="current_class"
                  value={formData.current_class}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Section"
                  name="current_section"
                  value={formData.current_section}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Roll Number"
                  name="roll_number"
                  value={formData.roll_number}
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
              {loading ? <CircularProgress size={24} /> : 'Create Student'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Student Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Student</DialogTitle>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!selectedStudent) return;
          setLoading(true);
          // Build updates from current formData (student fields only)
          const updates = {
            admission_date: formData.admission_date,
            date_of_birth: formData.date_of_birth,
            gender: formData.gender,
            blood_group: formData.blood_group,
            father_name: formData.father_name,
            mother_name: formData.mother_name,
            guardian_contact: formData.guardian_contact,
            current_class: formData.current_class,
            current_section: formData.current_section,
            roll_number: formData.roll_number,
          };
          
          // Include username and password if provided
          if (formData.username) {
            updates.username = formData.username;
          }
          if (formData.password) {
            updates.password = formData.password;
          }
          
          updateStudentMutation.mutate({ id: selectedStudent.id, updates });
          setLoading(false);
        }}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Grid container spacing={2}>
              {/* User Credentials Section */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                  User Credentials
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Username"
                  name="username"
                  value={formData.username}
                  onChange={handleInputChange}
                  helperText="Leave blank to keep current username"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="New Password"
                  name="password"
                  type="password"
                  value={formData.password}
                  onChange={handleInputChange}
                  helperText="Leave blank to keep current password"
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Confirm Password"
                  name="password_confirm"
                  type="password"
                  value={formData.password_confirm}
                  onChange={handleInputChange}
                  helperText="Leave blank to keep current password"
                />
              </Grid>
              
              {/* Academic Information Section */}
              <Grid item xs={12}>
                <Typography variant="h6" sx={{ fontWeight: 600, mt: 2, mb: 1 }}>
                  Academic Information
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Admission Date" name="admission_date" type="date" value={formData.admission_date} onChange={handleInputChange} InputLabelProps={{ shrink: true }} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Date of Birth" name="date_of_birth" type="date" value={formData.date_of_birth} onChange={handleInputChange} InputLabelProps={{ shrink: true }} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Gender (M/F/O)" name="gender" value={formData.gender} onChange={handleInputChange} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Blood Group" name="blood_group" value={formData.blood_group} onChange={handleInputChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Father's Name" name="father_name" value={formData.father_name} onChange={handleInputChange} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Mother's Name" name="mother_name" value={formData.mother_name} onChange={handleInputChange} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Guardian Contact" name="guardian_contact" value={formData.guardian_contact} onChange={handleInputChange} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Current Class" name="current_class" value={formData.current_class} onChange={handleInputChange} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Section" name="current_section" value={formData.current_section} onChange={handleInputChange} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Roll Number" name="roll_number" value={formData.roll_number} onChange={handleInputChange} required />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setOpenEditDialog(false)}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={loading}>{loading ? <CircularProgress size={24} /> : 'Save Changes'}</Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Delete Confirm Dialog */}
      <Dialog open={openDeleteDialog} onClose={() => setOpenDeleteDialog(false)}>
        <DialogTitle>Delete Student</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this student?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => {
            if (selectedStudent) deleteStudentMutation.mutate(selectedStudent.id);
          }}>Delete</Button>
        </DialogActions>
      </Dialog>

      {/* QR Modal */}
      <Dialog open={openQRDialog} onClose={() => { setOpenQRDialog(false); setQrData(null); }} maxWidth="sm" fullWidth>
        <DialogTitle>Student QR Code</DialogTitle>
        <DialogContent>
          {selectedStudent && (
            <Box>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                {selectedStudent.user_details?.first_name} {selectedStudent.user_details?.last_name}
              </Typography>
              <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', mb: 2 }}>
                {(qrData?.qr_code_url || selectedStudent?.qr_code) ? (
                  <img
                    alt="QR Code"
                    style={{ width: 160, height: 160 }}
                    src={qrData?.qr_code_url || (selectedStudent.qr_code ? `${axios.defaults.baseURL.replace('/api','')}${selectedStudent.qr_code}` : '')}
                  />
                ) : (
                  <Typography color="text.secondary">No QR image available</Typography>
                )}
                <Box>
                  <Typography variant="body2">Student ID: {selectedStudent.student_id}</Typography>
                  <Typography variant="body2">Class: {selectedStudent.current_class}</Typography>
                  <Typography variant="body2">Section: {selectedStudent.current_section}</Typography>
                  <Typography variant="body2">Roll: {selectedStudent.roll_number}</Typography>
                </Box>
              </Box>
              {/* Display domain-specific info instead of raw QR payload */}
              {qrData && (
                <Box sx={{ mt: 1 }}>
                  {/* Borrowed books */}
                  {Array.isArray(qrData.borrowed_books) && qrData.borrowed_books.length > 0 ? (
                    <Box sx={{ mb: 2 }}>
                      <Typography variant="subtitle2">Borrowed Books</Typography>
                      {qrData.borrowed_books.map((b, i) => (
                        <Typography key={i} variant="body2">{b.title} — Issued: {b.issued_date || 'N/A'} — Status: {b.status}</Typography>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No borrowed books.</Typography>
                  )}

                  {/* Recent results */}
                  {Array.isArray(qrData.recent_results) && qrData.recent_results.length > 0 ? (
                    <Box>
                      <Typography variant="subtitle2">Recent Results</Typography>
                      {qrData.recent_results.map((r, i) => (
                        <Typography key={i} variant="body2">{r.exam}: {r.marks_obtained}/{r.total_marks} — Grade: {r.grade || 'N/A'} — {r.passed ? 'Pass' : 'Fail'}</Typography>
                      ))}
                    </Box>
                  ) : (
                    <Typography variant="body2" color="text.secondary">No recent results available.</Typography>
                  )}
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenQRDialog(false); setQrData(null); }}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Student Profile Dialog */}
      <Dialog open={openProfileDialog} onClose={() => setOpenProfileDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Student Profile</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
          {profileLoading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
              <CircularProgress />
            </Box>
          ) : studentProfile ? (
            <Box>
              {/* Profile Picture Section */}
              <Box sx={{ textAlign: 'center', mb: 3 }}>
                <Avatar
                  src={studentProfile.profile_picture_url}
                  sx={{
                    width: 120,
                    height: 120,
                    mx: 'auto',
                    mb: 2,
                    fontSize: '3rem',
                    bgcolor: 'primary.main',
                  }}
                >
                  {studentProfile.first_name?.[0]}
                  {studentProfile.last_name?.[0]}
                </Avatar>
                <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
                  {studentProfile.first_name} {studentProfile.last_name}
                </Typography>
                <Typography variant="body2" color="textSecondary">
                  {studentProfile.username}
                </Typography>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Profile Picture Upload */}
              <Box sx={{ mb: 3 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Upload Profile Picture
                </Typography>
                <input
                  type="file"
                  id="profile-pic-input"
                  accept="image/*"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      if (!file.type.startsWith('image/')) {
                        setError('Please select an image file');
                        return;
                      }
                      if (file.size > 5 * 1024 * 1024) {
                        setError('File size must be less than 5MB');
                        return;
                      }
                      setSelectedProfileFile(file);
                      setError('');
                    }
                  }}
                  style={{ display: 'none' }}
                />
                <Box sx={{ display: 'flex', gap: 1 }}>
                  <Button
                    variant="outlined"
                    component="label"
                    htmlFor="profile-pic-input"
                    startIcon={<CameraIcon />}
                    size="small"
                  >
                    Select Image
                  </Button>
                  {selectedProfileFile && (
                    <Button
                      variant="contained"
                      size="small"
                      onClick={async () => {
                        try {
                          const formData = new FormData();
                          formData.append('profile_picture', selectedProfileFile);
                          const token = localStorage.getItem('access_token');
                          const resp = await axios.put(
                            `/students/${selectedStudent.id}/profile-picture/`,
                            formData,
                            {
                              headers: {
                                Authorization: `Bearer ${token}`,
                                'Content-Type': 'multipart/form-data',
                              },
                            }
                          );
                          setStudentProfile(resp.data);
                          setSelectedProfileFile(null);
                          setError('');
                        } catch (err) {
                          setError('Failed to upload profile picture');
                        }
                      }}
                    >
                      Upload
                    </Button>
                  )}
                </Box>
                {selectedProfileFile && (
                  <Typography variant="caption" color="textSecondary" sx={{ display: 'block', mt: 1 }}>
                    Selected: {selectedProfileFile.name}
                  </Typography>
                )}
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Basic Information */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Basic Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Student ID</Typography>
                    <Typography variant="body2">{studentProfile.student_id}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Admission No.</Typography>
                    <Typography variant="body2">{studentProfile.admission_number}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Email</Typography>
                    <Typography variant="body2">{studentProfile.email}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Phone</Typography>
                    <Typography variant="body2">{studentProfile.phone || 'N/A'}</Typography>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Personal Information */}
              <Box sx={{ mb: 2 }}>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Personal Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">DOB</Typography>
                    <Typography variant="body2">
                      {studentProfile.date_of_birth ? new Date(studentProfile.date_of_birth).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Gender</Typography>
                    <Typography variant="body2">
                      {studentProfile.gender === 'M' ? 'Male' : studentProfile.gender === 'F' ? 'Female' : 'Other'}
                    </Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Blood Group</Typography>
                    <Typography variant="body2">{studentProfile.blood_group || 'N/A'}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Father's Name</Typography>
                    <Typography variant="body2">{studentProfile.father_name}</Typography>
                  </Box>
                  <Box sx={{ gridColumn: '1/-1' }}>
                    <Typography variant="caption" color="textSecondary">Mother's Name</Typography>
                    <Typography variant="body2">{studentProfile.mother_name}</Typography>
                  </Box>
                  <Box sx={{ gridColumn: '1/-1' }}>
                    <Typography variant="caption" color="textSecondary">Guardian Contact</Typography>
                    <Typography variant="body2">{studentProfile.guardian_contact}</Typography>
                  </Box>
                </Box>
              </Box>

              <Divider sx={{ my: 2 }} />

              {/* Academic Information */}
              <Box>
                <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                  Academic Information
                </Typography>
                <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Class</Typography>
                    <Typography variant="body2">{studentProfile.current_class}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Section</Typography>
                    <Typography variant="body2">{studentProfile.current_section}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Roll Number</Typography>
                    <Typography variant="body2">{studentProfile.roll_number}</Typography>
                  </Box>
                  <Box>
                    <Typography variant="caption" color="textSecondary">Admission Date</Typography>
                    <Typography variant="body2">
                      {studentProfile.admission_date ? new Date(studentProfile.admission_date).toLocaleDateString() : 'N/A'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Box>
          ) : (
            <Typography color="textSecondary">No profile data available</Typography>
          )}
        </DialogContent>
        <DialogActions>
          {user?.role === 'admin' && (
            <Button color="warning" onClick={handleResetPassword} disabled={resettingPassword}>
              {resettingPassword ? 'Resetting...' : 'Reset Password'}
            </Button>
          )}
          <Button onClick={() => setOpenProfileDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Temporary password dialog — shown once with the generated password */}
      <Dialog open={tempPasswordDialogOpen} onClose={() => setTempPasswordDialogOpen(false)}>
        <DialogTitle>Temporary Password</DialogTitle>
        <DialogContent>
          <Typography variant="body2">This password will be shown only once. Share it securely with the student.</Typography>
          <Box sx={{ mt: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
            <Typography variant="h6" sx={{ fontFamily: 'monospace' }}>{temporaryPassword}</Typography>
            <Button size="small" onClick={() => { navigator.clipboard?.writeText(temporaryPassword); }}>Copy</Button>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setTempPasswordDialogOpen(false); setTemporaryPassword(''); }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentManagement;
