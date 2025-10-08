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
  Card,
  CardContent,
  Chip,
  IconButton,
  Tooltip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  Announcement as NoticeIcon,
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Visibility as ViewIcon
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const NoticesManagement = () => {
  const [openDialog, setOpenDialog] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: '',
    priority: 'medium',
    target_audience: 'all',
    expires_at: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const queryClient = useQueryClient();

  const { data: notices, isLoading } = useQuery({
    queryKey: ['notices'],
    queryFn: async () => {
      const response = await axios.get('/notices/');
      return response.data;
    },
  });

  const { data: categories } = useQuery({
    queryKey: ['notice-categories'],
    queryFn: async () => {
      const response = await axios.get('/notices/categories/');
      return response.data;
    },
  });

  const createNoticeMutation = useMutation({
    mutationFn: async (noticeData) => {
      const response = await axios.post('/notices/', noticeData);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['notices']);
      setOpenDialog(false);
      setFormData({
        title: '',
        content: '',
        category: '',
        priority: 'medium',
        target_audience: 'all',
        expires_at: ''
      });
    },
    onError: (error) => {
      setError(error.response?.data?.message || 'Failed to publish notice');
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
      title: '',
      content: '',
      category: '',
      priority: 'medium',
      target_audience: 'all',
      expires_at: ''
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
    createNoticeMutation.mutate(formData);
    setLoading(false);
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent': return 'error';
      case 'high': return 'warning';
      case 'medium': return 'info';
      case 'low': return 'default';
      default: return 'default';
    }
  };

  const getTargetAudienceColor = (audience) => {
    switch (audience) {
      case 'all': return 'primary';
      case 'students': return 'success';
      case 'teachers': return 'secondary';
      case 'staff': return 'warning';
      case 'parents': return 'info';
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
          <NoticeIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
          <Typography variant="h4">
            Notices Management
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={handleOpenDialog}
        >
          Publish Notice
        </Button>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          Published Notices ({(Array.isArray(notices) ? notices : (notices?.results || [])).length})
        </Typography>
        
        {!(Array.isArray(notices) ? notices : (notices?.results || [])).length ? (
          <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
            No notices published yet. Publish your first notice!
          </Typography>
        ) : (
          <Grid container spacing={2}>
            {(Array.isArray(notices) ? notices : (notices?.results || [])).map((notice) => (
              <Grid item xs={12} md={6} lg={4} key={notice.id}>
                <Card sx={{ height: '100%' }}>
                  <CardContent>
                    <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                      <Typography variant="h6" component="h2" sx={{ flexGrow: 1, mr: 1 }}>
                        {notice.title}
                      </Typography>
                      <Box>
                        <Chip
                          label={notice.priority}
                          color={getPriorityColor(notice.priority)}
                          size="small"
                          sx={{ mb: 1 }}
                        />
                        <Chip
                          label={notice.target_audience}
                          color={getTargetAudienceColor(notice.target_audience)}
                          size="small"
                          variant="outlined"
                        />
                      </Box>
                    </Box>
                    
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      {notice.content.length > 100 
                        ? `${notice.content.substring(0, 100)}...` 
                        : notice.content
                      }
                    </Typography>
                    
                    <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                      Published by: {notice.published_by_name} • {new Date(notice.published_at).toLocaleDateString()}
                    </Typography>
                    
                    {notice.expires_at && (
                      <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                        Expires: {new Date(notice.expires_at).toLocaleDateString()}
                      </Typography>
                    )}
                    
                    <Box display="flex" justifyContent="space-between" alignItems="center">
                      <Chip
                        label={notice.category_name || 'Uncategorized'}
                        size="small"
                        variant="outlined"
                      />
                      <Box>
                        <Tooltip title="View">
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

      {/* Publish Notice Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>Publish New Notice</DialogTitle>
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
                  label="Notice Title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                />
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Category</InputLabel>
                  <Select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    label="Category"
                  >
                    {(Array.isArray(categories) ? categories : (categories?.results || [])).map((category) => (
                      <MenuItem key={category.id} value={category.id}>
                        {category.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Priority</InputLabel>
                  <Select
                    name="priority"
                    value={formData.priority}
                    onChange={handleInputChange}
                    label="Priority"
                  >
                    <MenuItem value="low">Low</MenuItem>
                    <MenuItem value="medium">Medium</MenuItem>
                    <MenuItem value="high">High</MenuItem>
                    <MenuItem value="urgent">Urgent</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>Target Audience</InputLabel>
                  <Select
                    name="target_audience"
                    value={formData.target_audience}
                    onChange={handleInputChange}
                    label="Target Audience"
                  >
                    <MenuItem value="all">All</MenuItem>
                    <MenuItem value="students">Students</MenuItem>
                    <MenuItem value="teachers">Teachers</MenuItem>
                    <MenuItem value="staff">Staff</MenuItem>
                    <MenuItem value="parents">Parents</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  label="Expiry Date (Optional)"
                  name="expires_at"
                  type="date"
                  value={formData.expires_at}
                  onChange={handleInputChange}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Notice Content"
                  name="content"
                  multiline
                  rows={6}
                  value={formData.content}
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
              {loading ? <CircularProgress size={24} /> : 'Publish Notice'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default NoticesManagement;
