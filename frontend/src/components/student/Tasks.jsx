import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Grid,
  TextField,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Check as CheckIcon,
  Close as CloseIcon,
  AssignmentTurnedIn as SubmittedIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const StudentTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [submissions, setSubmissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [submitOpen, setSubmitOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let token = localStorage.getItem('access_token') || localStorage.getItem('token');
      if (!token) {
        setError('No authentication token found');
        return;
      }

      const response = await axios.get(`${API_BASE_URL}/tasks/`, {
        headers: { Authorization: `Token ${token}` },
      });

      setTasks(response.data);

      // Fetch submissions for each task
      const submissionsData = {};
      for (const task of response.data) {
        try {
          const submissionResponse = await axios.get(
            `${API_BASE_URL}/tasks/${task.id}/submissions/`,
            { headers: { Authorization: `Token ${token}` } }
          );
          if (submissionResponse.data.length > 0) {
            submissionsData[task.id] = submissionResponse.data[0];
          }
        } catch (err) {
          // No submission yet
        }
      }
      setSubmissions(submissionsData);
    } catch (err) {
      setError('Failed to load tasks: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSubmitOpen = (task) => {
    setSelectedTask(task);
    setSelectedFile(null);
    setSubmitOpen(true);
  };

  const handleSubmitClose = () => {
    setSubmitOpen(false);
    setSelectedTask(null);
    setSelectedFile(null);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    if (file) {
      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        setError('File size must be less than 10MB');
        return;
      }
      setSelectedFile(file);
      setError('');
    }
  };

  const handleSubmitTask = async () => {
    if (!selectedFile) {
      setError('Please select a file to submit');
      return;
    }

    try {
      setSubmitting(true);
      let token = localStorage.getItem('access_token') || localStorage.getItem('token');

      const formData = new FormData();
      formData.append('submission_file', selectedFile);

      const response = await axios.post(
        `${API_BASE_URL}/tasks/${selectedTask.id}/submit/`,
        formData,
        {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'multipart/form-data',
          },
        }
      );

      setSubmissions({
        ...submissions,
        [selectedTask.id]: response.data,
      });

      setSuccess('Task submitted successfully!');
      handleSubmitClose();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to submit task: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const getTaskStatus = (task) => {
    const submission = submissions[task.id];
    if (!submission) {
      return { label: 'Not Submitted', color: 'error', icon: <CloseIcon /> };
    }
    if (submission.status === 'graded') {
      return { label: `Graded: ${submission.score}/${task.total_marks}`, color: 'success', icon: <CheckIcon /> };
    }
    return { label: 'Submitted', color: 'warning', icon: <SubmittedIcon /> };
  };

  const isOverdue = (task) => {
    return new Date(task.due_date) < new Date();
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" sx={{ mb: 1, fontWeight: 600 }}>
          Tasks
        </Typography>
        <Typography variant="body2" color="textSecondary">
          View and submit your assigned tasks
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {tasks.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography color="textSecondary">No tasks assigned yet</Typography>
        </Paper>
      ) : (
        <Grid container spacing={3}>
          {tasks.map((task) => {
            const status = getTaskStatus(task);
            const overdue = isOverdue(task);
            const submission = submissions[task.id];

            return (
              <Grid item xs={12} key={task.id}>
                <Card sx={{ 
                  border: overdue && !submission ? '2px solid #d32f2f' : '1px solid #e0e0e0',
                  backgroundColor: overdue && !submission ? '#ffebee' : 'white'
                }}>
                  <CardContent>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                      <Box sx={{ flex: 1 }}>
                        <Typography variant="h6" sx={{ fontWeight: 600, mb: 1 }}>
                          {task.title}
                        </Typography>
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
                          {task.description}
                        </Typography>
                        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexWrap: 'wrap' }}>
                          <Typography variant="caption">
                            <strong>Due:</strong> {new Date(task.due_date).toLocaleString()}
                          </Typography>
                          <Typography variant="caption">
                            <strong>Total Marks:</strong> {task.total_marks}
                          </Typography>
                          <Typography variant="caption">
                            <strong>Set by:</strong> {task.assigned_by_name}
                          </Typography>
                        </Box>
                      </Box>
                      <Chip
                        icon={status.icon}
                        label={status.label}
                        color={status.color}
                        sx={{ ml: 2 }}
                      />
                    </Box>

                    {submission && (
                      <Box sx={{ mb: 2, p: 2, backgroundColor: '#f5f5f5', borderRadius: 1 }}>
                        <Typography variant="caption" sx={{ display: 'block', mb: 1 }}>
                          <strong>Submission:</strong> {new Date(submission.submitted_at).toLocaleString()}
                        </Typography>
                        {submission.is_late && (
                          <Chip
                            label="Late Submission"
                            color="error"
                            size="small"
                            sx={{ mb: 1, mr: 1 }}
                          />
                        )}
                        {submission.feedback && (
                          <Box sx={{ mt: 1 }}>
                            <Typography variant="caption"><strong>Feedback:</strong></Typography>
                            <Typography variant="caption" component="p">
                              {submission.feedback}
                            </Typography>
                          </Box>
                        )}
                      </Box>
                    )}

                    <Box sx={{ display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      {!submission || submission.status !== 'graded' ? (
                        <Button
                          variant="contained"
                          color="primary"
                          startIcon={<UploadIcon />}
                          onClick={() => handleSubmitOpen(task)}
                          disabled={submission && submission.status === 'graded'}
                        >
                          {submission ? 'Resubmit' : 'Submit'}
                        </Button>
                      ) : null}
                    </Box>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      )}

      {/* Submit Dialog */}
      <Dialog open={submitOpen} onClose={handleSubmitClose} maxWidth="sm" fullWidth>
        <DialogTitle>Submit Task</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedTask && (
            <>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Task:</strong> {selectedTask.title}
              </Typography>
              <Box sx={{ mb: 2 }}>
                <input
                  type="file"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                  id="file-input"
                />
                <label htmlFor="file-input" style={{ width: '100%' }}>
                  <Button
                    variant="outlined"
                    component="span"
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    Choose File
                  </Button>
                </label>
                {selectedFile && (
                  <Typography variant="caption" color="success.main">
                    ✓ {selectedFile.name}
                  </Typography>
                )}
              </Box>
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleSubmitClose}>Cancel</Button>
          <Button
            onClick={handleSubmitTask}
            variant="contained"
            color="primary"
            disabled={submitting || !selectedFile}
          >
            {submitting ? 'Submitting...' : 'Submit'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default StudentTasks;
