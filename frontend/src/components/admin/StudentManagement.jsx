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
  Tooltip
} from '@mui/material';
import {
  School as SchoolIcon,
  Add as AddIcon,
  QrCode as QRCodeIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

// Add missing import for Chip used in the table
import { Chip } from '@mui/material';

const StudentManagement = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openQRDialog, setOpenQRDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [qrData, setQrData] = useState(null);
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
                      <Tooltip title="View QR Code">
                      <IconButton size="small" onClick={async () => {
                        setSelectedStudent(student);
                        setOpenQRDialog(true);
                        setError('');
                        try {
                          const resp = await axios.get(`/students/${student.id}/qr-code/`);
                          setQrData(resp.data);
                        } catch (e) {
                          setQrData(null);
                        }
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
                {selectedStudent.qr_code && (
                  <img
                    alt="QR Code"
                    style={{ width: 160, height: 160 }}
                    src={`${axios.defaults.baseURL.replace('/api','')}${selectedStudent.qr_code}`}
                  />
                )}
                <Box>
                  <Typography variant="body2">Student ID: {selectedStudent.student_id}</Typography>
                  <Typography variant="body2">Class: {selectedStudent.current_class}</Typography>
                  <Typography variant="body2">Section: {selectedStudent.current_section}</Typography>
                  <Typography variant="body2">Roll: {selectedStudent.roll_number}</Typography>
                </Box>
              </Box>
              {qrData && (
                <Box sx={{ mt: 1 }}>
                  <Typography variant="subtitle2">QR Encoded Data</Typography>
                  <pre style={{ background:'#f6f8fa', padding: 8, borderRadius: 6, overflowX: 'auto' }}>{JSON.stringify(qrData, null, 2)}</pre>
                </Box>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setOpenQRDialog(false); setQrData(null); }}>Close</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default StudentManagement;
