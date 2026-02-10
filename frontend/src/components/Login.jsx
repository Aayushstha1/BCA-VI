import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Container,
  Paper,
  TextField,
  Button,
  Typography,
  Box,
  Alert,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Divider
} from '@mui/material';
import { School as SchoolIcon } from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';

const Login = () => {
  const [formData, setFormData] = useState({
    username: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [forgotOpen, setForgotOpen] = useState(false);
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotData, setForgotData] = useState({
    username: '',
    father_name: '',
    current_class: '',
    current_section: ''
  });
  
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated && user) {
      // Redirect based on user role
      switch (user.role) {
        case 'admin':
          navigate('/admin');
          break;
        case 'student':
          navigate('/student');
          break;
        case 'teacher':
          navigate('/teacher');
          break;
        default:
          navigate('/login');
      }
    }
  }, [isAuthenticated, user, navigate]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const result = await login(formData.username, formData.password);
    
    if (result.success) {
      // Navigation will be handled by useEffect
    } else {
      setError(result.error);
    }
    
    setLoading(false);
  };

  const handleForgotChange = (e) => {
    setForgotData({
      ...forgotData,
      [e.target.name]: e.target.value
    });
    setForgotError('');
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotError('');
    setForgotSuccess('');

    try {
      const resp = await axios.post('/accounts/password-reset-requests/', forgotData);
      setForgotSuccess(resp.data?.message || 'Request submitted. Admin will verify and email you.');
      setForgotData({
        username: '',
        father_name: '',
        current_class: '',
        current_section: ''
      });
    } catch (err) {
      setForgotError(err.response?.data?.detail || 'Failed to submit request');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <Container component="main" maxWidth="sm">
      <Box
        sx={{
          marginTop: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper elevation={3} sx={{ padding: 4, width: '100%' }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <SchoolIcon sx={{ fontSize: 48, color: 'primary.main', mb: 2 }} />
            <Typography component="h1" variant="h4" gutterBottom>
              Student Management System
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
              Please sign in to your account
            </Typography>
            
            {error && (
              <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
                {error}
              </Alert>
            )}

            <Box component="form" onSubmit={handleSubmit} sx={{ width: '100%' }}>
              <TextField
                margin="normal"
                required
                fullWidth
                id="username"
                label="Username"
                name="username"
                autoComplete="username"
                autoFocus
                value={formData.username}
                onChange={handleChange}
                disabled={loading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                name="password"
                label="Password"
                type="password"
                id="password"
                autoComplete="current-password"
                value={formData.password}
                onChange={handleChange}
                disabled={loading}
              />
              <Button
                type="submit"
                fullWidth
                variant="contained"
                sx={{ mt: 3, mb: 2 }}
                disabled={loading}
              >
                {loading ? <CircularProgress size={24} /> : 'Sign In'}
              </Button>
            </Box>

            <Divider sx={{ width: '100%', my: 2 }} />
            <Button
              variant="text"
              onClick={() => setForgotOpen(true)}
              sx={{ textTransform: 'none', fontWeight: 600 }}
            >
              Forgot password?
            </Button>
          </Box>
        </Paper>
      </Box>

      <Dialog open={forgotOpen} onClose={() => setForgotOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Forgot Password</DialogTitle>
        <form onSubmit={handleForgotSubmit}>
          <DialogContent>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Enter the details below. Admin will verify and send your new password by email.
            </Typography>

            {forgotError && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {forgotError}
              </Alert>
            )}
            {forgotSuccess && (
              <Alert severity="success" sx={{ mb: 2 }}>
                {forgotSuccess}
              </Alert>
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              label="Username"
              name="username"
              value={forgotData.username}
              onChange={handleForgotChange}
              disabled={forgotLoading}
            />
            <TextField
              margin="normal"
              required
              fullWidth
              label="Father Name"
              name="father_name"
              value={forgotData.father_name}
              onChange={handleForgotChange}
              disabled={forgotLoading}
            />
            <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
              <TextField
                margin="normal"
                required
                fullWidth
                label="Class"
                name="current_class"
                value={forgotData.current_class}
                onChange={handleForgotChange}
                disabled={forgotLoading}
              />
              <TextField
                margin="normal"
                required
                fullWidth
                label="Section"
                name="current_section"
                value={forgotData.current_section}
                onChange={handleForgotChange}
                disabled={forgotLoading}
              />
            </Box>
          </DialogContent>
          <DialogActions sx={{ p: 2 }}>
            <Button onClick={() => setForgotOpen(false)} color="inherit">
              Close
            </Button>
            <Button type="submit" variant="contained" disabled={forgotLoading}>
              {forgotLoading ? <CircularProgress size={20} /> : 'Submit Request'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Container>
  );
};

export default Login;
