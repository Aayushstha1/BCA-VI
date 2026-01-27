import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Avatar,
  Button,
  Card,
  CardContent,
  Divider,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import { Edit as EditIcon, PhotoCamera as CameraIcon } from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const Profile = () => {
  const { user } = useAuth();
  const [student, setStudent] = useState(null);
  const [taskScores, setTaskScores] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editOpen, setEditOpen] = useState(false);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState(null);
  const [editData, setEditData] = useState({});
  const [uploading, setUploading] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  useEffect(() => {
    fetchStudentProfile();
  }, []);

  const fetchStudentProfile = async () => {
    try {
      setLoading(true);
      // Try both token names for compatibility
      let token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in.');
        setLoading(false);
        return;
      }
      
      // Use axios with proper auth header
      const response = await axios.get(`${API_BASE_URL}/students/profile/`, {
        headers: { Authorization: `Token ${token}` },
      });
      setStudent(response.data);
      setEditData({
        date_of_birth: response.data.date_of_birth,
        gender: response.data.gender,
        blood_group: response.data.blood_group,
        father_name: response.data.father_name,
        mother_name: response.data.mother_name,
        guardian_contact: response.data.guardian_contact,
      });
      setError('');

      // Fetch task scores
      try {
        const scoresResponse = await axios.get(
          `${API_BASE_URL}/tasks/student/${response.data.id}/scores/`,
          { headers: { Authorization: `Token ${token}` } }
        );
        setTaskScores(scoresResponse.data);
      } catch (scoreErr) {
        // Task scores endpoint might not be available, continue without them
        console.log('Could not fetch task scores');
      }
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.error || err.message;
      if (err.response?.status === 401) {
        setError('Unauthorized. Please ensure you are logged in as a student.');
      } else if (err.response?.status === 404) {
        setError('Student profile not found. Please contact the administrator.');
      } else {
        setError('Failed to load profile. ' + errorMsg);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEditOpen = () => {
    setEditOpen(true);
  };

  const handleEditClose = () => {
    setEditOpen(false);
  };

  const handleUploadOpen = () => {
    setUploadOpen(true);
  };

  const handleUploadClose = () => {
    setUploadOpen(false);
    setSelectedFile(null);
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        setError('Please select an image file');
        return;
      }
      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        setError('File size must be less than 5MB');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleUploadSubmit = async () => {
    if (!selectedFile) {
      setError('Please select a file');
      return;
    }

    try {
      setUploading(true);
      let token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in.');
        setUploading(false);
        return;
      }
      const formData = new FormData();
      formData.append('profile_picture', selectedFile);

      const response = await axios.put(
        `${API_BASE_URL}/students/${student.id}/profile-picture/`,
        formData,
        {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setStudent(response.data);
      setSuccess('Profile picture updated successfully!');
      handleUploadClose();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to upload profile picture. ' + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
    }
  };

  const handleEditChange = (field, value) => {
    setEditData({
      ...editData,
      [field]: value,
    });
  };

  const handleEditSubmit = async () => {
    try {
      setUploading(true);
      let token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found. Please log in.');
        setUploading(false);
        return;
      }
      const response = await axios.patch(
        `${API_BASE_URL}/students/profile/`,
        editData,
        {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );
      setStudent(response.data);
      setSuccess('Profile updated successfully!');
      handleEditClose();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to update profile. ' + (err.response?.data?.detail || err.message));
    } finally {
      setUploading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  if (!student) {
    return (
      <Container>
        <Alert severity="error">Failed to load student profile</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}

      <Paper sx={{ p: 3, mb: 3 }}>
        {/* Profile Header */}
        <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 3, mb: 3 }}>
          <Box sx={{ position: 'relative' }}>
            <Avatar
              src={student.profile_picture_url}
              sx={{
                width: 150,
                height: 150,
                fontSize: '3rem',
                bgcolor: 'primary.main',
              }}
            >
              {student.first_name?.[0]}
              {student.last_name?.[0]}
            </Avatar>
            <Button
              variant="contained"
              color="primary"
              size="small"
              sx={{
                position: 'absolute',
                bottom: 0,
                right: 0,
                minWidth: 'auto',
                p: 1,
                borderRadius: '50%',
              }}
              onClick={handleUploadOpen}
            >
              <CameraIcon sx={{ fontSize: '1.2rem' }} />
            </Button>
          </Box>

          <Box sx={{ flex: 1 }}>
            <Typography variant="h4" sx={{ fontWeight: 'bold', mb: 1 }}>
              {student.first_name} {student.last_name}
            </Typography>
            <Typography variant="body1" color="textSecondary" sx={{ mb: 1 }}>
              {student.username}
            </Typography>
            <Box sx={{ mt: 2, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 2 }}>
              <Box>
                <Typography variant="body2" color="textSecondary">Student ID</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{student.student_id}</Typography>
              </Box>
              <Box>
                <Typography variant="body2" color="textSecondary">Admission Number</Typography>
                <Typography variant="body1" sx={{ fontWeight: 'bold' }}>{student.admission_number}</Typography>
              </Box>
            </Box>
            <Button
              variant="outlined"
              startIcon={<EditIcon />}
              onClick={handleEditOpen}
              sx={{ mt: 2 }}
            >
              Edit Profile
            </Button>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Personal Information */}
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Personal Information
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
          <Box>
            <Card sx={{ bgcolor: 'background.default' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Date of Birth
                </Typography>
                <Typography variant="body1">
                  {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card sx={{ bgcolor: 'background.default' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Gender
                </Typography>
                <Typography variant="body1">
                  {student.gender === 'M' ? 'Male' : student.gender === 'F' ? 'Female' : 'Other'}
                </Typography>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card sx={{ bgcolor: 'background.default' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Blood Group
                </Typography>
                <Typography variant="body1">{student.blood_group || 'N/A'}</Typography>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card sx={{ bgcolor: 'background.default' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Email
                </Typography>
                <Typography variant="body1">{student.email}</Typography>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card sx={{ bgcolor: 'background.default' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Phone
                </Typography>
                <Typography variant="body1">{student.phone || 'N/A'}</Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Family Information */}
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Family Information
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
          <Box>
            <Card sx={{ bgcolor: 'background.default' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Father's Name
                </Typography>
                <Typography variant="body1">{student.father_name}</Typography>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card sx={{ bgcolor: 'background.default' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Mother's Name
                </Typography>
                <Typography variant="body1">{student.mother_name}</Typography>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card sx={{ bgcolor: 'background.default' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Mother's Name
                </Typography>
                <Typography variant="body1">{student.mother_name}</Typography>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card sx={{ bgcolor: 'background.default' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Guardian Contact
                </Typography>
                <Typography variant="body1">{student.guardian_contact}</Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Academic Information */}
        <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Academic Information
        </Typography>
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 3 }}>
          <Box>
            <Card sx={{ bgcolor: 'background.default' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Class
                </Typography>
                <Typography variant="body1">{student.current_class}</Typography>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card sx={{ bgcolor: 'background.default' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Section
                </Typography>
                <Typography variant="body1">{student.current_section}</Typography>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card sx={{ bgcolor: 'background.default' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Roll Number
                </Typography>
                <Typography variant="body1">{student.roll_number}</Typography>
              </CardContent>
            </Card>
          </Box>
          <Box>
            <Card sx={{ bgcolor: 'background.default' }}>
              <CardContent>
                <Typography color="textSecondary" gutterBottom>
                  Admission Date
                </Typography>
                <Typography variant="body1">
                  {student.admission_date ? new Date(student.admission_date).toLocaleDateString() : 'N/A'}
                </Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* Task Scores */}
        {taskScores && (
          <>
            <Typography variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
              Task Performance
            </Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: 'repeat(2, 1fr)' }, gap: 3 }}>
              <Box>
                <Card sx={{ bgcolor: 'background.default' }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Tasks
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {taskScores.total_tasks}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
              <Box>
                <Card sx={{ bgcolor: 'background.default' }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Completed Tasks
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'success.main' }}>
                      {taskScores.completed_tasks}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
              <Box>
                <Card sx={{ bgcolor: 'background.default' }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Total Score
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold' }}>
                      {taskScores.total_score}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
              <Box>
                <Card sx={{ bgcolor: 'background.default' }}>
                  <CardContent>
                    <Typography color="textSecondary" gutterBottom>
                      Average Score
                    </Typography>
                    <Typography variant="h5" sx={{ fontWeight: 'bold', color: 'primary.main' }}>
                      {taskScores.average_score.toFixed(2)}
                    </Typography>
                  </CardContent>
                </Card>
              </Box>
            </Box>
            <Divider sx={{ my: 3 }} />
          </>
        )}
      </Paper>

      {/* Upload Profile Picture Dialog */}
      <Dialog open={uploadOpen} onClose={handleUploadClose} maxWidth="sm" fullWidth>
        <DialogTitle>Upload Profile Picture</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ textAlign: 'center' }}>
            {selectedFile && (
              <Box sx={{ mb: 2 }}>
                <Avatar
                  src={URL.createObjectURL(selectedFile)}
                  sx={{
                    width: 150,
                    height: 150,
                    mx: 'auto',
                    mb: 2,
                  }}
                />
                <Typography variant="body2">{selectedFile.name}</Typography>
              </Box>
            )}
            <input
              type="file"
              id="profile-picture-input"
              accept="image/*"
              onChange={handleFileSelect}
              style={{ display: 'none' }}
            />
            <Button
              variant="contained"
              component="label"
              htmlFor="profile-picture-input"
              startIcon={<CameraIcon />}
            >
              Select Image
            </Button>
            <Typography variant="caption" sx={{ display: 'block', mt: 2, color: 'textSecondary' }}>
              Max size: 5MB. Supported formats: JPG, PNG, GIF
            </Typography>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleUploadClose}>Cancel</Button>
          <Button
            onClick={handleUploadSubmit}
            variant="contained"
            disabled={!selectedFile || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle>Edit Profile</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Date of Birth"
              type="date"
              value={editData.date_of_birth || ''}
              onChange={(e) => handleEditChange('date_of_birth', e.target.value)}
              InputLabelProps={{ shrink: true }}
              fullWidth
            />
            <FormControl fullWidth>
              <InputLabel>Gender</InputLabel>
              <Select
                value={editData.gender || ''}
                onChange={(e) => handleEditChange('gender', e.target.value)}
                label="Gender"
              >
                <MenuItem value="M">Male</MenuItem>
                <MenuItem value="F">Female</MenuItem>
                <MenuItem value="O">Other</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Blood Group</InputLabel>
              <Select
                value={editData.blood_group || ''}
                onChange={(e) => handleEditChange('blood_group', e.target.value)}
                label="Blood Group"
              >
                <MenuItem value="A+">A+</MenuItem>
                <MenuItem value="A-">A-</MenuItem>
                <MenuItem value="B+">B+</MenuItem>
                <MenuItem value="B-">B-</MenuItem>
                <MenuItem value="AB+">AB+</MenuItem>
                <MenuItem value="AB-">AB-</MenuItem>
                <MenuItem value="O+">O+</MenuItem>
                <MenuItem value="O-">O-</MenuItem>
              </Select>
            </FormControl>
            <TextField
              label="Father's Name"
              value={editData.father_name || ''}
              onChange={(e) => handleEditChange('father_name', e.target.value)}
              fullWidth
            />
            <TextField
              label="Mother's Name"
              value={editData.mother_name || ''}
              onChange={(e) => handleEditChange('mother_name', e.target.value)}
              fullWidth
            />
            <TextField
              label="Guardian Contact"
              value={editData.guardian_contact || ''}
              onChange={(e) => handleEditChange('guardian_contact', e.target.value)}
              fullWidth
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleEditClose}>Cancel</Button>
          <Button onClick={handleEditSubmit} variant="contained" disabled={uploading}>
            {uploading ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default Profile;
