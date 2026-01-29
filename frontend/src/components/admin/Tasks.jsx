import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Paper,
  Typography,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Alert,
  CircularProgress,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  Tab,
  Tabs,
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckIcon,
  Schedule as ScheduleIcon,
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

const AdminTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [tabValue, setTabValue] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [selectedTask, setSelectedTask] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [submissions, setSubmissions] = useState([]);
  const [submitting, setSubmitting] = useState(false);
  const [classes, setClasses] = useState([]);
  const [sectionsMap, setSectionsMap] = useState({});
  const [sections, setSections] = useState([]);
  const [classCounts, setClassCounts] = useState({});
  const [sectionCountsMap, setSectionCountsMap] = useState({});

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    total_marks: 10,
    assigned_to_class: '',
    assigned_to_section: '',
  });

  // Fetch available classes and sections from students endpoint
  useEffect(() => {
    const fetchClassesAndSections = async () => {
      try {
        let token = localStorage.getItem('access_token') || localStorage.getItem('token');
        const resp = await axios.get(`${API_BASE_URL}/students/`, {
          headers: { Authorization: `Token ${token}` },
        });
        const data = Array.isArray(resp.data) ? resp.data : (resp.data.results || []);
        const uniqueClasses = Array.from(new Set(data.map((s) => s.current_class).filter(Boolean)));
        uniqueClasses.sort();
        setClasses(uniqueClasses);

        // Build sections map and counts
        const map = {};
        const cCounts = {};
        const sCounts = {};
        data.forEach((s) => {
          if (!s.current_class) return;

          // class counts
          cCounts[s.current_class] = (cCounts[s.current_class] || 0) + 1;

          // sections map
          map[s.current_class] = map[s.current_class] || new Set();
          if (s.current_section) map[s.current_class].add(s.current_section);

          // section counts per class
          sCounts[s.current_class] = sCounts[s.current_class] || {};
          const sec = s.current_section || '';
          sCounts[s.current_class][sec] = (sCounts[s.current_class][sec] || 0) + 1;
        });

        const plainMap = {};
        Object.keys(map).forEach((k) => { plainMap[k] = Array.from(map[k]).sort(); });

        setSectionsMap(plainMap);
        setClassCounts(cCounts);
        setSectionCountsMap(sCounts);
      } catch (err) {
        console.warn('Failed to load classes/sections for task assignment', err);
      }
    };

    fetchClassesAndSections();
  }, []);

  // Update sections list when selected class changes
  useEffect(() => {
    const cls = formData.assigned_to_class;
    setSections(formSectionsForClass(cls));
  }, [formData.assigned_to_class]);

  const formSectionsForClass = (cls) => {
    if (!cls) return [];
    return sectionsMap[cls] || [];
  };

  const [gradeData, setGradeData] = useState({
    score: '',
    feedback: '',
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      let token = localStorage.getItem('access_token') || localStorage.getItem('token');

      const response = await axios.get(`${API_BASE_URL}/tasks/`, {
        headers: { Authorization: `Token ${token}` },
      });

      // Handle both array and paginated response formats
      const tasksData = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setTasks(tasksData);
    } catch (err) {
      setError('Failed to load tasks: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOpen = () => {
    setFormData({ title: '', description: '', due_date: '', total_marks: 10, assigned_to_class: '' });
    setCreateDialogOpen(true);
  };

  const handleCreateClose = () => {
    setCreateDialogOpen(false);
  };

  const handleCreateTask = async () => {
    if (!formData.title || !formData.description || !formData.due_date) {
      setError('Please fill all required fields');
      return;
    }

    try {
      setSubmitting(true);
      let token = localStorage.getItem('access_token') || localStorage.getItem('token');

      const response = await axios.post(`${API_BASE_URL}/tasks/`, formData, {
        headers: {
          Authorization: `Token ${token}`,
          'Content-Type': 'application/json',
        },
      });

      setTasks([response.data, ...tasks]);
      setSuccess('Task created successfully!');
      handleCreateClose();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to create task: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Are you sure you want to delete this task?')) return;

    try {
      let token = localStorage.getItem('access_token') || localStorage.getItem('token');

      await axios.delete(`${API_BASE_URL}/tasks/${taskId}/`, {
        headers: { Authorization: `Token ${token}` },
      });

      setTasks(tasks.filter((t) => t.id !== taskId));
      setSuccess('Task deleted successfully!');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete task: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleViewSubmissions = async (task) => {
    try {
      let token = localStorage.getItem('access_token') || localStorage.getItem('token');

      const response = await axios.get(`${API_BASE_URL}/tasks/${task.id}/submissions/`, {
        headers: { Authorization: `Token ${token}` },
      });

      setSelectedTask(task);
      setSubmissions(response.data);
      setTabValue(1);
    } catch (err) {
      setError('Failed to load submissions: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleGradeOpen = (submission) => {
    setSelectedSubmission(submission);
    setGradeData({ score: submission.score || '', feedback: submission.feedback || '' });
    setGradeDialogOpen(true);
  };

  const handleGradeClose = () => {
    setGradeDialogOpen(false);
    setSelectedSubmission(null);
  };

  const handleGradeSubmit = async () => {
    if (!gradeData.score) {
      setError('Please enter a score');
      return;
    }

    try {
      setSubmitting(true);
      let token = localStorage.getItem('access_token') || localStorage.getItem('token');

      const response = await axios.patch(
        `${API_BASE_URL}/tasks/submission/${selectedSubmission.id}/grade/`,
        gradeData,
        {
          headers: {
            Authorization: `Token ${token}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // Update submission in list
      setSubmissions(
        submissions.map((s) => (s.id === selectedSubmission.id ? { ...s, ...response.data } : s))
      );

      setSuccess('Task graded successfully!');
      handleGradeClose();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to grade task: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmitting(false);
    }
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
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={(e, v) => setTabValue(v)}>
          <Tab label="My Tasks" />
          <Tab label="Submissions & Grading" />
        </Tabs>
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

      {tabValue === 0 && (
        <>
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>
              Task Management
            </Typography>
            <Button
              variant="contained"
              color="primary"
              startIcon={<AddIcon />}
              onClick={handleCreateOpen}
            >
              Create Task
            </Button>
          </Box>

          {tasks.length === 0 ? (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="textSecondary">No tasks created yet</Typography>
            </Paper>
          ) : (
            <Grid container spacing={2}>
            {Array.isArray(tasks) && tasks.map((task) => (
              <Grid size={{ xs: 12 }} key={task.id}>
                  <Card>
                    <CardContent>
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
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
                              <strong>Class:</strong> {task.assigned_to_class ? (task.assigned_to_section ? `${task.assigned_to_class} ${task.assigned_to_section}` : task.assigned_to_class) : 'Individual'}
                            </Typography>
                            <Typography variant="caption" sx={{ display: 'block' }}>
                              <strong>Created by:</strong> {task.assigned_by_name}
                            </Typography>
                            <Chip
                              label={`${task.submission_count} Submissions`}
                              size="small"
                              variant="outlined"
                            />
                          </Box>
                        </Box>
                        <Box sx={{ display: 'flex', gap: 1 }}>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleViewSubmissions(task)}
                          >
                            View Submissions
                          </Button>
                          <Button
                            variant="outlined"
                            color="error"
                            size="small"
                            startIcon={<DeleteIcon />}
                            onClick={() => handleDeleteTask(task.id)}
                          >
                            Delete
                          </Button>
                        </Box>
                      </Box>
                    </CardContent>
                  </Card>
            </Grid>
            ))}
          </Grid>
        )}
        </>
      )}

      {tabValue === 1 && (
        <>
          {selectedTask ? (
            <>
              <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
                {selectedTask.title} - Submissions
              </Typography>
              <TableContainer component={Paper}>
                <Table>
                  <TableHead>
                    <TableRow sx={{ backgroundColor: '#f5f5f5' }}>
                      <TableCell>Student</TableCell>
                      <TableCell>Submitted At</TableCell>
                      <TableCell>Status</TableCell>
                      <TableCell>Score</TableCell>
                      <TableCell>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {submissions.map((sub) => (
                      <TableRow key={sub.id}>
                        <TableCell>{sub.student_name}</TableCell>
                        <TableCell>
                          {sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : 'Not submitted'}
                        </TableCell>
                        <TableCell>
                          <Chip
                            label={sub.status === 'graded' ? 'Graded' : 'Submitted'}
                            color={sub.status === 'graded' ? 'success' : 'warning'}
                            size="small"
                          />
                          {sub.is_late && (
                            <Chip label="Late" color="error" size="small" sx={{ ml: 1 }} />
                          )}
                        </TableCell>
                        <TableCell>{sub.score !== null ? `${sub.score}/${selectedTask.total_marks}` : '-'}</TableCell>
                        <TableCell>
                          <Button
                            variant="outlined"
                            size="small"
                            onClick={() => handleGradeOpen(sub)}
                          >
                            Grade
                          </Button>
                          {sub.submission_file && (
                            <Button
                              href={sub.submission_file}
                              target="_blank"
                              rel="noopener noreferrer"
                              variant="text"
                              size="small"
                              sx={{ ml: 1 }}
                            >
                              View
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </>
          ) : (
            <Paper sx={{ p: 4, textAlign: 'center' }}>
              <Typography color="textSecondary">Select a task from the left to view submissions</Typography>
            </Paper>
          )}
        </>
      )}

      {/* Create Task Dialog */}
      <Dialog open={createDialogOpen} onClose={handleCreateClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create New Task</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Task Title"
            fullWidth
            margin="normal"
            value={formData.title}
            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          />
          <TextField
            label="Description"
            fullWidth
            margin="normal"
            multiline
            rows={4}
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          />
          <FormControl fullWidth margin="normal">
            <InputLabel>Assign to Class</InputLabel>
            <Select
              value={formData.assigned_to_class}
              onChange={(e) => setFormData({ ...formData, assigned_to_class: e.target.value, assigned_to_section: '' })}
            >
              <MenuItem value="">Individual/None</MenuItem>
              {classes.map((c) => (
                <MenuItem key={c} value={c}>
                  {c} {classCounts[c] ? `(${classCounts[c]} students)` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          {/* Section select: optional, appears after choosing a class */}
          <FormControl fullWidth margin="normal">
            <InputLabel>Assign to Section (optional)</InputLabel>
            <Select
              value={formData.assigned_to_section}
              onChange={(e) => setFormData({ ...formData, assigned_to_section: e.target.value })}
              disabled={!formData.assigned_to_class || sections.length === 0}
            >
              <MenuItem value="">Whole class (All sections) {formData.assigned_to_class ? `(${classCounts[formData.assigned_to_class] || 0} students)` : ''}</MenuItem>
              {sections.map((s) => (
                <MenuItem key={s} value={s}>
                  {s} {sectionCountsMap[formData.assigned_to_class] && sectionCountsMap[formData.assigned_to_class][s] ? `(${sectionCountsMap[formData.assigned_to_class][s]} students)` : ''}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <TextField
            label="Total Marks"
            type="number"
            fullWidth
            margin="normal"
            value={formData.total_marks}
            onChange={(e) => setFormData({ ...formData, total_marks: parseInt(e.target.value) })}
          />
          <TextField
            label="Due Date"
            type="datetime-local"
            fullWidth
            margin="normal"
            InputLabelProps={{ shrink: true }}
            value={formData.due_date}
            onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateClose}>Cancel</Button>
          <Button
            onClick={handleCreateTask}
            variant="contained"
            color="primary"
            disabled={submitting}
          >
            {submitting ? 'Creating...' : 'Create'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Grade Dialog */}
      <Dialog open={gradeDialogOpen} onClose={handleGradeClose} maxWidth="sm" fullWidth>
        <DialogTitle>Grade Submission</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          {selectedSubmission && (
            <>
              <Typography variant="body2" sx={{ mb: 2 }}>
                <strong>Student:</strong> {selectedSubmission.student_name}
              </Typography>
              {selectedSubmission.submission_file && (
                <Button
                  href={selectedSubmission.submission_file}
                  target="_blank"
                  rel="noopener noreferrer"
                  variant="outlined"
                  sx={{ mb: 2 }}
                  fullWidth
                >
                  View Submission
                </Button>
              )}
              <TextField
                label="Score"
                type="number"
                fullWidth
                margin="normal"
                value={gradeData.score}
                onChange={(e) => setGradeData({ ...gradeData, score: parseInt(e.target.value) })}
                inputProps={{ max: selectedTask?.total_marks }}
              />
              <TextField
                label="Feedback"
                fullWidth
                margin="normal"
                multiline
                rows={4}
                value={gradeData.feedback}
                onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })}
              />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleGradeClose}>Cancel</Button>
          <Button
            onClick={handleGradeSubmit}
            variant="contained"
            color="primary"
            disabled={submitting}
          >
            {submitting ? 'Grading...' : 'Submit Grade'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default AdminTasks;
