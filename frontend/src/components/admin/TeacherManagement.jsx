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
  MenuItem
} from '@mui/material';
import {
  Person as PersonIcon,
  Add as AddIcon,
  Search as SearchIcon,
  Edit as EditIcon,
  Delete as DeleteIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const TeacherManagement = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [openDeleteDialog, setOpenDeleteDialog] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    phone: '',
    joining_date: '',
    qualification: '',
    department: '',
    designation: 'Teacher',
    experience_years: 0,
    salary: '',
    emergency_contact: '',
    emergency_contact_name: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const queryClient = useQueryClient();

  const { data: teachers, isLoading } = useQuery({
    queryKey: ['teachers'],
    queryFn: async () => {
      const response = await axios.get('/teachers/');
      return response.data;
    },
  });

  const createTeacherMutation = useMutation({
    mutationFn: async (teacherData) => {
      const response = await axios.post('/teachers/', teacherData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['teachers']);
      setOpenDialog(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        first_name: '',
        last_name: '',
        phone: '',
        joining_date: '',
        qualification: '',
        department: '',
        designation: 'Teacher',
        experience_years: 0,
        salary: '',
        emergency_contact: '',
        emergency_contact_name: ''
      });
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Failed to create teacher');
    }
  });

  const updateTeacherMutation = useMutation({
    mutationFn: async ({ id, updates }) => {
      const payload = { ...updates };
      Object.keys(payload).forEach((k) => {
        if (payload[k] === '') delete payload[k];
      });
      const res = await axios.put(`/teachers/${id}/`, payload);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['teachers']);
      setOpenEditDialog(false);
      setSelectedTeacher(null);
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Failed to update teacher');
    }
  });

  const deleteTeacherMutation = useMutation({
    mutationFn: async (id) => {
      await axios.delete(`/teachers/${id}/`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['teachers']);
      setOpenDeleteDialog(false);
      setSelectedTeacher(null);
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Failed to delete teacher');
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
      joining_date: '',
      qualification: '',
      department: '',
      designation: 'Teacher',
      experience_years: 0,
      salary: '',
      emergency_contact: '',
      emergency_contact_name: ''
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
    createTeacherMutation.mutate(formData);
    setLoading(false);
  };

  const teachersArray = Array.isArray(teachers) ? teachers : (teachers?.results || []);
  const filteredTeachers = teachersArray.filter(teacher => {
    if (!searchQuery) return true;
    const query = searchQuery.toLowerCase();
    return (
      teacher.employee_id?.toLowerCase().includes(query) ||
      teacher.user_details?.first_name?.toLowerCase().includes(query) ||
      teacher.user_details?.last_name?.toLowerCase().includes(query) ||
      teacher.department?.toLowerCase().includes(query) ||
      teacher.designation?.toLowerCase().includes(query)
    );
  });

  const departments = [
    'Mathematics', 'Science', 'English', 'Social Studies', 
    'Physical Education', 'Computer Science', 'Arts', 'Music', 'Other'
  ];

  const qualifications = [
    'B.A', 'B.Sc', 'B.Ed', 'M.A', 'M.Sc', 'M.Ed', 'Ph.D', 'Other'
  ];

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
          <PersonIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4">
            Teacher Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add New Teacher
        </Button>
      </Box>

      <Paper sx={{ p: 2, mb: 2 }}>
        <Box display="flex" alignItems="center" gap={2}>
          <TextField
            placeholder="Search teachers..."
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
          Teachers ({filteredTeachers.length})
        </Typography>
        
        {filteredTeachers.length === 0 ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            {searchQuery ? 'No teachers found matching your search.' : 'No teachers found. Add your first teacher!'}
          </Typography>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Employee ID</TableCell>
                  <TableCell>Name</TableCell>
                  <TableCell>Department</TableCell>
                  <TableCell>Designation</TableCell>
                  <TableCell>Qualification</TableCell>
                  <TableCell>Experience</TableCell>
                  <TableCell>Status</TableCell>
                  <TableCell>Actions</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {filteredTeachers.map((teacher) => (
                  <TableRow key={teacher.id}>
                    <TableCell>{teacher.employee_id}</TableCell>
                    <TableCell>
                      {teacher.user_details?.first_name} {teacher.user_details?.last_name}
                    </TableCell>
                    <TableCell>{teacher.department}</TableCell>
                    <TableCell>{teacher.designation}</TableCell>
                    <TableCell>{teacher.qualification}</TableCell>
                    <TableCell>{teacher.experience_years} years</TableCell>
                    <TableCell>
                      <Chip
                        label={teacher.is_active ? 'Active' : 'Inactive'}
                        color={teacher.is_active ? 'success' : 'default'}
                        size="small"
                      />
                    </TableCell>
                    <TableCell>
                      <Tooltip title="Edit">
                        <IconButton size="small" onClick={() => {
                          setSelectedTeacher(teacher);
                          setFormData({
                            ...formData,
                            // user fields are not editable here; only teacher profile fields
                            phone: teacher.user_details?.phone || '',
                            joining_date: teacher.joining_date || '',
                            qualification: teacher.qualification || '',
                            department: teacher.department || '',
                            designation: teacher.designation || 'Teacher',
                            experience_years: teacher.experience_years ?? 0,
                            salary: teacher.salary || '',
                            emergency_contact: teacher.emergency_contact || '',
                            emergency_contact_name: teacher.emergency_contact_name || ''
                          });
                          setOpenEditDialog(true);
                          setError('');
                        }}>
                          <EditIcon />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete">
                        <IconButton size="small" onClick={() => {
                          setSelectedTeacher(teacher);
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

      {/* Add Teacher Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Add New Teacher</DialogTitle>
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

              {/* Professional Information */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Professional Information
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Joining Date"
                  name="joining_date"
                  type="date"
                  value={formData.joining_date}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Qualification</InputLabel>
                  <Select
                    name="qualification"
                    value={formData.qualification}
                    onChange={handleInputChange}
                    label="Qualification"
                  >
                    {qualifications.map((qual) => (
                      <MenuItem key={qual} value={qual}>{qual}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Department</InputLabel>
                  <Select
                    name="department"
                    value={formData.department}
                    onChange={handleInputChange}
                    label="Department"
                  >
                    {departments.map((dept) => (
                      <MenuItem key={dept} value={dept}>{dept}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Designation"
                  name="designation"
                  value={formData.designation}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Experience (Years)"
                  name="experience_years"
                  type="number"
                  value={formData.experience_years}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Salary"
                  name="salary"
                  type="number"
                  value={formData.salary}
                  onChange={handleInputChange}
                />
              </Grid>

              {/* Emergency Contact */}
              <Grid item xs={12} sx={{ mt: 2 }}>
                <Typography variant="h6" gutterBottom>
                  Emergency Contact
                </Typography>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Emergency Contact Name"
                  name="emergency_contact_name"
                  value={formData.emergency_contact_name}
                  onChange={handleInputChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Emergency Contact Number"
                  name="emergency_contact"
                  value={formData.emergency_contact}
                  onChange={handleInputChange}
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
              {loading ? <CircularProgress size={24} /> : 'Create Teacher'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit Teacher Dialog */}
      <Dialog open={openEditDialog} onClose={() => setOpenEditDialog(false)} maxWidth="md" fullWidth>
        <DialogTitle>Edit Teacher</DialogTitle>
        <form onSubmit={(e) => {
          e.preventDefault();
          if (!selectedTeacher) return;
          setLoading(true);
          const updates = {
            // Only teacher model fields
            joining_date: formData.joining_date,
            qualification: formData.qualification,
            department: formData.department,
            designation: formData.designation,
            experience_years: formData.experience_years,
            salary: formData.salary,
            emergency_contact: formData.emergency_contact,
            emergency_contact_name: formData.emergency_contact_name,
          };
          updateTeacherMutation.mutate({ id: selectedTeacher.id, updates });
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
                <TextField fullWidth label="Joining Date" name="joining_date" type="date" value={formData.joining_date} onChange={handleInputChange} InputLabelProps={{ shrink: true }} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Qualification</InputLabel>
                  <Select name="qualification" value={formData.qualification} label="Qualification" onChange={handleInputChange}>
                    {qualifications.map((q) => (<MenuItem key={q} value={q}>{q}</MenuItem>))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Department</InputLabel>
                  <Select name="department" value={formData.department} label="Department" onChange={handleInputChange}>
                    {departments.map((d) => (<MenuItem key={d} value={d}>{d}</MenuItem>))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Designation" name="designation" value={formData.designation} onChange={handleInputChange} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="number" label="Experience (Years)" name="experience_years" value={formData.experience_years} onChange={handleInputChange} required />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth type="number" label="Salary" name="salary" value={formData.salary} onChange={handleInputChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Emergency Contact Name" name="emergency_contact_name" value={formData.emergency_contact_name} onChange={handleInputChange} />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField fullWidth label="Emergency Contact Number" name="emergency_contact" value={formData.emergency_contact} onChange={handleInputChange} />
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
        <DialogTitle>Delete Teacher</DialogTitle>
        <DialogContent>
          <Typography>Are you sure you want to delete this teacher?</Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDeleteDialog(false)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={() => {
            if (selectedTeacher) deleteTeacherMutation.mutate(selectedTeacher.id);
          }}>Delete</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherManagement;
