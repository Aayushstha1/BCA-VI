import React, { useState } from 'react';
import {
  Box,
  Typography,
  Tabs,
  Tab,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Alert,
  CircularProgress
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const UserManagement = () => {
  const [tabValue, setTabValue] = useState(0);
  const [openDialog, setOpenDialog] = useState(false);
  const [openEditDialog, setOpenEditDialog] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    password_confirm: '',
    first_name: '',
    last_name: '',
    role: 'student',
    phone: '',
    address: ''
  });
  const [editFormData, setEditFormData] = useState({
    username: '',
    password: '',
    password_confirm: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const queryClient = useQueryClient();

  const { data: users, isLoading } = useQuery({
    queryKey: ['users'],
    queryFn: async () => {
      const response = await axios.get('/accounts/users/');
      return response.data;
    },
  });

  const createUserMutation = useMutation({
    mutationFn: async (userData) => {
      const response = await axios.post('/accounts/users/', userData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setOpenDialog(false);
      setFormData({
        username: '',
        email: '',
        password: '',
        password_confirm: '',
        first_name: '',
        last_name: '',
        role: 'student',
        phone: '',
        address: ''
      });
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Failed to create user');
    }
  });

  const updateUserMutation = useMutation({
    mutationFn: async (userData) => {
      const { userId, ...data } = userData;
      const response = await axios.patch(`/accounts/users/${userId}/`, data);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['users']);
      setOpenEditDialog(false);
      setSelectedUser(null);
      setEditFormData({
        username: '',
        password: '',
        password_confirm: ''
      });
    },
    onError: (error) => {
      setError(error.response?.data?.detail || error.response?.data?.message || 'Failed to update user');
    }
  });

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

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
      role: 'student',
      phone: '',
      address: ''
    });
  };

  const handleOpenEditDialog = (user) => {
    setSelectedUser(user);
    setEditFormData({
      username: user.username,
      password: '',
      password_confirm: ''
    });
    setOpenEditDialog(true);
    setError('');
  };

  const handleCloseEditDialog = () => {
    setOpenEditDialog(false);
    setSelectedUser(null);
    setEditFormData({
      username: '',
      password: '',
      password_confirm: ''
    });
    setError('');
  };

  const handleInputChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleEditInputChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    createUserMutation.mutate(formData);
    setLoading(false);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    
    if (editFormData.password && editFormData.password !== editFormData.password_confirm) {
      setError("Passwords don't match");
      return;
    }

    setLoading(true);
    
    const updateData = {
      userId: selectedUser.id,
      username: editFormData.username
    };
    
    if (editFormData.password) {
      updateData.password = editFormData.password;
    }

    updateUserMutation.mutate(updateData);
    setLoading(false);
  };

  const usersArray = Array.isArray(users) ? users : (users?.results || []);
  const filteredUsers = usersArray.filter(user => {
    if (tabValue === 0) return user.role === 'student';
    if (tabValue === 1) return user.role === 'teacher';
    return true;
  });

  const getRoleLabel = (role) => {
    switch (role) {
      case 'student': return 'Students';
      case 'teacher': return 'Teachers';
      default: return 'All Users';
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
        <Typography variant="h4">
          User Management
        </Typography>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Add New User
        </Button>
      </Box>

      <Paper sx={{ mb: 2 }}>
        <Tabs value={tabValue} onChange={handleTabChange}>
          <Tab label="Students" />
          <Tab label="Teachers" />
        </Tabs>
      </Paper>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {getRoleLabel(tabValue === 0 ? 'student' : 'teacher')} ({filteredUsers.length})
        </Typography>
        
        {filteredUsers.length === 0 ? (
          <Typography color="text.secondary">
            No {getRoleLabel(tabValue === 0 ? 'student' : 'teacher').toLowerCase()} found.
          </Typography>
        ) : (
          <Box>
            {filteredUsers.map((user) => (
              <Box
                key={user.id}
                sx={{
                  p: 2,
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 1,
                  mb: 1,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center'
                }}
              >
                <Box>
                  <Typography variant="h6">
                    {user.first_name} {user.last_name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Username: {user.username} | Email: {user.email}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Phone: {user.phone || 'Not provided'} | Role: {user.role}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button
                    variant="outlined"
                    size="small"
                    startIcon={<EditIcon />}
                    onClick={() => handleOpenEditDialog(user)}
                  >
                    Edit
                  </Button>
                  <Typography
                    variant="caption"
                    sx={{
                      color: user.is_active ? 'success.main' : 'error.main',
                      fontWeight: 'bold'
                    }}
                  >
                    {user.is_active ? 'Active' : 'Inactive'}
                  </Typography>
                </Box>
              </Box>
            ))}
          </Box>
        )}
      </Paper>

      {/* Create User Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Create New User</DialogTitle>
        <form onSubmit={handleSubmit}>
          <DialogContent>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            
            <Grid container spacing={2}>
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
                <FormControl fullWidth>
                  <InputLabel>Role</InputLabel>
                  <Select
                    name="role"
                    value={formData.role}
                    onChange={handleInputChange}
                    label="Role"
                  >
                    <MenuItem value="student">Student</MenuItem>
                    <MenuItem value="teacher">Teacher</MenuItem>
                  </Select>
                </FormControl>
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
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Address"
                  name="address"
                  multiline
                  rows={3}
                  value={formData.address}
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
              {loading ? <CircularProgress size={24} /> : 'Create User'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* Edit User Dialog */}
      <Dialog open={openEditDialog} onClose={handleCloseEditDialog} maxWidth="sm" fullWidth>
        <DialogTitle>Edit User Credentials</DialogTitle>
        <DialogContent dividers sx={{ py: 3 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}
          
          {selectedUser && (
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <Typography variant="body2" color="textSecondary">
                Editing: <strong>{selectedUser.first_name} {selectedUser.last_name}</strong>
              </Typography>
              
              <TextField
                fullWidth
                label="Username"
                name="username"
                value={editFormData.username}
                onChange={handleEditInputChange}
                variant="outlined"
              />
              
              <TextField
                fullWidth
                label="New Password"
                placeholder="Leave blank to keep current password"
                name="password"
                type="password"
                value={editFormData.password}
                onChange={handleEditInputChange}
                variant="outlined"
              />
              
              <TextField
                fullWidth
                label="Confirm New Password"
                placeholder="Leave blank to keep current password"
                name="password_confirm"
                type="password"
                value={editFormData.password_confirm}
                onChange={handleEditInputChange}
                variant="outlined"
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={handleCloseEditDialog} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleEditSubmit}
            variant="contained"
            color="primary"
            disabled={loading}
          >
            {loading ? <CircularProgress size={20} /> : 'Update'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default UserManagement;
