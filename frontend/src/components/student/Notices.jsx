import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Card,
  CardContent,
  Grid,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Alert,
} from '@mui/material';
import {
  Announcement as NoticeIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { useQuery } from '@tanstack/react-query';
import axios from 'axios';

const NoticesPage = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('');
  const [filterCategory, setFilterCategory] = useState('');
  const [selectedNotice, setSelectedNotice] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);

  // Fetch notices
  const { data: notices, isLoading, isError } = useQuery({
    queryKey: ['notices'],
    queryFn: async () => {
      const response = await axios.get('notices/');
      return Array.isArray(response.data) ? response.data : (response.data?.results || []);
    },
  });

  // Fetch categories for filter
  const { data: categories } = useQuery({
    queryKey: ['notice-categories'],
    queryFn: async () => {
      const response = await axios.get('notices/categories/');
      return Array.isArray(response.data) ? response.data : (response.data?.results || []);
    },
  });

  const handleViewNotice = (notice) => {
    setSelectedNotice(notice);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedNotice(null);
  };

  // Filter notices
  const filteredNotices = (notices || []).filter((notice) => {
    const matchesSearch =
      notice.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      notice.content.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesPriority = !filterPriority || notice.priority === filterPriority;
    const matchesCategory = !filterCategory || notice.category === parseInt(filterCategory);

    return matchesSearch && matchesPriority && matchesCategory;
  });

  const getPriorityColor = (priority) => {
    switch (priority) {
      case 'urgent':
        return 'error';
      case 'high':
        return 'warning';
      case 'medium':
        return 'info';
      case 'low':
        return 'default';
      default:
        return 'default';
    }
  };

  const getTargetAudienceColor = (audience) => {
    switch (audience) {
      case 'all':
        return 'primary';
      case 'students':
        return 'success';
      case 'teachers':
        return 'secondary';
      case 'staff':
        return 'warning';
      case 'parents':
        return 'info';
      default:
        return 'default';
    }
  };

  if (isError) {
    return (
      <Box>
        <Alert severity="error">Failed to load notices. Please try again later.</Alert>
      </Box>
    );
  }

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <NoticeIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4">All Notices</Typography>
      </Box>

      {/* Filters */}
      <Paper sx={{ p: 2, mb: 3 }}>
        <Grid container spacing={2}>
          <Grid item xs={12} sm={6} md={3}>
            <TextField
              fullWidth
              placeholder="Search notices..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              InputProps={{
                startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              size="small"
            />
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Priority</InputLabel>
              <Select
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
                label="Priority"
              >
                <MenuItem value="">All Priorities</MenuItem>
                <MenuItem value="urgent">Urgent</MenuItem>
                <MenuItem value="high">High</MenuItem>
                <MenuItem value="medium">Medium</MenuItem>
                <MenuItem value="low">Low</MenuItem>
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <FormControl fullWidth size="small">
              <InputLabel>Category</InputLabel>
              <Select
                value={filterCategory}
                onChange={(e) => setFilterCategory(e.target.value)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {(categories || []).map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          <Grid item xs={12} sm={6} md={3}>
            <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
              {filteredNotices.length} notice(s) found
            </Typography>
          </Grid>
        </Grid>
      </Paper>

      {/* Notices List */}
      {isLoading ? (
        <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
          <CircularProgress />
        </Box>
      ) : filteredNotices.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <NoticeIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No notices found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Try adjusting your search or filters
          </Typography>
        </Paper>
      ) : (
        <Grid container spacing={2}>
          {filteredNotices.map((notice) => (
            <Grid item xs={12} md={6} lg={4} key={notice.id}>
              <Card
                sx={{
                  height: '100%',
                  cursor: 'pointer',
                  transition: 'transform 0.2s, box-shadow 0.2s',
                  '&:hover': {
                    transform: 'translateY(-4px)',
                    boxShadow: 4,
                  },
                }}
                onClick={() => handleViewNotice(notice)}
              >
                <CardContent>
                  <Box display="flex" justifyContent="space-between" alignItems="flex-start" mb={2}>
                    <Typography variant="h6" component="h3" sx={{ flex: 1 }}>
                      {notice.title}
                    </Typography>
                  </Box>

                  <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                    <Chip
                      label={notice.priority}
                      color={getPriorityColor(notice.priority)}
                      size="small"
                    />
                    <Chip
                      label={notice.target_audience}
                      color={getTargetAudienceColor(notice.target_audience)}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                    {notice.content}
                  </Typography>

                  <Box display="flex" justifyContent="space-between" alignItems="center">
                    <Typography variant="caption" color="text.secondary">
                      {new Date(notice.published_at).toLocaleDateString()}
                    </Typography>
                    <Chip
                      label={notice.category_name || 'Uncategorized'}
                      size="small"
                      variant="outlined"
                    />
                  </Box>

                  {notice.expires_at && (
                    <Typography variant="caption" color="warning.main" sx={{ mt: 1, display: 'block' }}>
                      Expires: {new Date(notice.expires_at).toLocaleDateString()}
                    </Typography>
                  )}
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {/* Notice Details Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        {selectedNotice && (
          <>
            <DialogTitle>{selectedNotice.title}</DialogTitle>
            <DialogContent>
              <Box sx={{ mt: 2 }}>
                <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                  <Chip
                    label={selectedNotice.priority}
                    color={getPriorityColor(selectedNotice.priority)}
                  />
                  <Chip
                    label={selectedNotice.target_audience}
                    color={getTargetAudienceColor(selectedNotice.target_audience)}
                    variant="outlined"
                  />
                  <Chip
                    label={selectedNotice.category_name || 'Uncategorized'}
                    variant="outlined"
                  />
                </Box>

                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Published by: {selectedNotice.published_by_name} on{' '}
                  {new Date(selectedNotice.published_at).toLocaleDateString()}
                </Typography>

                {selectedNotice.expires_at && (
                  <Typography variant="body2" color="warning.main" sx={{ mb: 2 }}>
                    Expires: {new Date(selectedNotice.expires_at).toLocaleDateString()}
                  </Typography>
                )}

                <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                  {selectedNotice.content}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCloseDialog}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default NoticesPage;
