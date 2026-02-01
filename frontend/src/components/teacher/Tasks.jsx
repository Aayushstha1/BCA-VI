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
  Grid,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Chip,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';
import { Add as AddIcon, Delete as DeleteIcon } from '@mui/icons-material';
import GradeIcon from '@mui/icons-material/Grade';
import SubmissionRatings from '../admin/SubmissionRatings';
import { useAuth } from '../../contexts/AuthContext';
import axios from 'axios';

// Reuse similar UI/logic as Admin Tasks but scoped for teacher
const TeacherTasks = () => {
  const { user } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    due_date: '',
    total_marks: 10,
    assigned_to_class: '',
    assigned_to_section: '',
  });
  const [classes, setClasses] = useState([]);
  const [sectionsMap, setSectionsMap] = useState({});
  const [sections, setSections] = useState([]);

  // Submissions / grading state
  const [submissions, setSubmissions] = useState([]);
  const [submissionsDialogOpen, setSubmissionsDialogOpen] = useState(false);
  const [gradeDialogOpen, setGradeDialogOpen] = useState(false);
  const [selectedTaskForSubmissions, setSelectedTaskForSubmissions] = useState(null);
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [gradeData, setGradeData] = useState({ score: '', feedback: '' });
  const [submittingGrade, setSubmittingGrade] = useState(false);
  const [ratingDialogOpenLocal, setRatingDialogOpenLocal] = useState(false);
  const [selectedSubmissionToRate, setSelectedSubmissionToRate] = useState(null);

  // Inline edit state
  const [editingSubmissionId, setEditingSubmissionId] = useState(null);
  const [inlineGradeData, setInlineGradeData] = useState({ score: '', feedback: '' });

  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  useEffect(() => { fetchTasks(); fetchClasses(); }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const response = await axios.get(`${API_BASE_URL}/tasks/`, { headers: { Authorization: `Token ${token}` } });
      const tasksData = Array.isArray(response.data) ? response.data : (response.data.results || []);
      setTasks(tasksData);
    } catch (err) {
      setError('Failed to load tasks: ' + (err.response?.data?.detail || err.message));
    } finally {
      setLoading(false);
    }
  };

  const fetchClasses = async () => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const resp = await axios.get(`${API_BASE_URL}/students/`, { headers: { Authorization: `Token ${token}` } });
      const data = Array.isArray(resp.data) ? resp.data : (resp.data.results || []);
      const uniqueClasses = Array.from(new Set(data.map((s) => s.current_class).filter(Boolean))).sort();
      setClasses(uniqueClasses);
      const map = {};
      data.forEach((s) => {
        if (!s.current_class) return;
        map[s.current_class] = map[s.current_class] || new Set();
        if (s.current_section) map[s.current_class].add(s.current_section);
      });
      const plainMap = {};
      Object.keys(map).forEach((k) => { plainMap[k] = Array.from(map[k]).sort(); });
      setSectionsMap(plainMap);
    } catch (err) {
      console.warn('Failed to fetch classes for teacher tasks', err);
    }
  };

  useEffect(() => { setSections(formSectionsForClass(formData.assigned_to_class)); }, [formData.assigned_to_class]);
  const formSectionsForClass = (cls) => cls ? sectionsMap[cls] || [] : [];

  const handleCreateOpen = () => { setFormData({ title: '', description: '', due_date: '', total_marks: 10, assigned_to_class: '', assigned_to_section: '' }); setCreateDialogOpen(true); };
  const handleCreateClose = () => setCreateDialogOpen(false);

  const handleCreateTask = async () => {
    if (!formData.title || !formData.description || !formData.due_date) { setError('Please fill all required fields'); return; }
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const resp = await axios.post(`${API_BASE_URL}/tasks/`, formData, { headers: { Authorization: `Token ${token}`, 'Content-Type': 'application/json' } });
      setTasks([resp.data, ...tasks]);
      setSuccess('Task created successfully');
      handleCreateClose();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to create task: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleViewSubmissions = async (task) => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const resp = await axios.get(`${API_BASE_URL}/tasks/${task.id}/submissions/`, { headers: { Authorization: `Token ${token}` } });
      const subs = Array.isArray(resp.data) ? resp.data : (resp.data.results || []);
      setSubmissions(subs);
      setSelectedTaskForSubmissions(task);
      setSubmissionsDialogOpen(true);
    } catch (err) {
      setError('Failed to load submissions: ' + (err.response?.data?.detail || err.message));
    }
  };

  const handleGradeOpen = (submission) => {
    setSelectedSubmission(submission);
    setGradeData({ score: submission.score || '', feedback: submission.feedback || '' });
    setGradeDialogOpen(true);
  };

  const startInlineEdit = (submission) => {
    setEditingSubmissionId(submission.id);
    setInlineGradeData({ score: submission.score || '', feedback: submission.feedback || '' });
  };

  const cancelInlineEdit = () => {
    setEditingSubmissionId(null);
    setInlineGradeData({ score: '', feedback: '' });
  };

  const saveInlineEdit = async (submissionId) => {
    if (inlineGradeData.score === '' || inlineGradeData.score === null) {
      setError('Please enter a score');
      return;
    }
    try {
      setSubmittingGrade(true);
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const resp = await axios.patch(`${API_BASE_URL}/tasks/submission/${submissionId}/grade/`, inlineGradeData, {
        headers: { Authorization: `Token ${token}`, 'Content-Type': 'application/json' }
      });
      setSubmissions(submissions.map(s => s.id === submissionId ? { ...s, ...resp.data } : s));
      setSuccess('Submission graded successfully');
      cancelInlineEdit();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to grade submission: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmittingGrade(false);
    }
  };

  const handleGradeClose = () => {
    setGradeDialogOpen(false);
    setSelectedSubmission(null);
    setGradeData({ score: '', feedback: '' });
  };

  const handleGradeSubmit = async () => {
    if (!selectedSubmission) return;
    if (gradeData.score === '' || gradeData.score === null) {
      setError('Please enter a score');
      return;
    }
    try {
      setSubmittingGrade(true);
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const resp = await axios.patch(`${API_BASE_URL}/tasks/submission/${selectedSubmission.id}/grade/`, gradeData, {
        headers: { Authorization: `Token ${token}`, 'Content-Type': 'application/json' }
      });

      // Update the submission in list
      setSubmissions(submissions.map(s => s.id === selectedSubmission.id ? { ...s, ...resp.data } : s));
      setSuccess('Submission graded successfully');
      handleGradeClose();
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to grade submission: ' + (err.response?.data?.detail || err.message));
    } finally {
      setSubmittingGrade(false);
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/tasks/${taskId}/`, { headers: { Authorization: `Token ${token}` } });
      setTasks(tasks.filter((t) => t.id !== taskId));
      setSuccess('Task deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
    } catch (err) {
      setError('Failed to delete task: ' + (err.response?.data?.detail || err.message));
    }
  };

  if (loading) return (<Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}><CircularProgress /></Box>);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ mb: 2, fontWeight: 600 }}>Teacher Tasks</Typography>
        <Button variant="contained" startIcon={<AddIcon />} onClick={handleCreateOpen}>Create Task</Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 3 }} onClose={() => setSuccess('')}>{success}</Alert>}

      {tasks.length === 0 ? (
        <Paper sx={{ p: 4, textAlign: 'center' }}><Typography>No tasks created yet</Typography></Paper>
      ) : (
        <Grid container spacing={2}>{tasks.map((task) => (
          <Grid item xs={12} key={task.id}><Card><CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between' }}>
              <Box>
                <Typography variant="h6">{task.title}</Typography>
                <Typography variant="body2" color="textSecondary">{task.description}</Typography>
                <Typography variant="caption"><strong>Class:</strong> {task.assigned_to_class ? (task.assigned_to_section ? `${task.assigned_to_class} ${task.assigned_to_section}` : task.assigned_to_class) : 'Individual'}</Typography>
                <Typography variant="caption" sx={{ display: 'block' }}><strong>Created by:</strong> {task.assigned_by_name}</Typography>
              </Box>
              <Box sx={{ display: 'flex', gap: 1 }}>
                <Button variant="outlined" size="small" onClick={() => handleViewSubmissions(task)}>View Submissions</Button>
                <Button variant="outlined" color="error" size="small" onClick={() => handleDeleteTask(task.id)} startIcon={<DeleteIcon />}>Delete</Button>
              </Box>
            </Box>
          </CardContent></Card></Grid>
        ))}</Grid>
      )}

      {/* Submissions Dialog */}
      <Dialog open={submissionsDialogOpen} onClose={() => setSubmissionsDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>Submissions for {selectedTaskForSubmissions?.title}</DialogTitle>
        <DialogContent>
          {submissions.length === 0 ? (
            <Typography>No submissions yet for this task.</Typography>
          ) : (
            <TableContainer component={Paper} sx={{ mt: 1 }}>
              <Table>
                <TableHead>
                  <TableRow>
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
                      <TableCell>{sub.submitted_at ? new Date(sub.submitted_at).toLocaleString() : 'Not submitted'}</TableCell>
                      <TableCell>
                        <Chip label={sub.status === 'graded' ? `Graded (${sub.score})` : (sub.status === 'submitted' ? 'Submitted' : 'Not Submitted')} color={sub.status === 'graded' ? 'success' : (sub.status === 'submitted' ? 'warning' : 'default')} size="small" />
                        {sub.is_late && <Chip label="Late" color="error" size="small" sx={{ ml: 1 }} />}
                      </TableCell>
                      <TableCell>
                        {editingSubmissionId === sub.id ? (
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                            <TextField size="small" type="number" value={inlineGradeData.score} onChange={(e) => setInlineGradeData({ ...inlineGradeData, score: parseInt(e.target.value) })} inputProps={{ min: 0 }} sx={{ width: 120 }} />
                            <TextField size="small" value={inlineGradeData.feedback} onChange={(e) => setInlineGradeData({ ...inlineGradeData, feedback: e.target.value })} sx={{ width: 260 }} />
                          </Box>
                        ) : (
                          (sub.score !== null ? `${sub.score}/${selectedTaskForSubmissions?.total_marks}` : '-')
                        )}
                      </TableCell>
                      <TableCell>
                        {editingSubmissionId === sub.id ? (
                          <>
                            <Button size="small" variant="contained" onClick={() => saveInlineEdit(sub.id)} disabled={submittingGrade}>Save</Button>
                            <Button size="small" onClick={cancelInlineEdit} sx={{ ml: 1 }}>Cancel</Button>
                          </>
                        ) : (
                          <>
                            <Button size="small" variant="outlined" onClick={() => handleGradeOpen(sub)} startIcon={<GradeIcon />}>Grade</Button>
                            <Button size="small" variant="text" onClick={() => startInlineEdit(sub)} sx={{ ml: 1 }}>Quick Edit</Button>
                            {sub.submission_file && (
                              <Button size="small" href={sub.submission_file} target="_blank" rel="noopener noreferrer" sx={{ ml: 1 }}>View</Button>
                            )}
                            <Button size="small" color="secondary" sx={{ ml: 1 }} onClick={() => { setSelectedSubmissionToRate(sub); setRatingDialogOpenLocal(true); }}>Rate</Button>
                          </>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSubmissionsDialogOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Grade Dialog */}
      <Dialog open={gradeDialogOpen} onClose={handleGradeClose} maxWidth="sm" fullWidth>
        <DialogTitle>Grade Submission</DialogTitle>
        <DialogContent>
          {selectedSubmission && (
            <>
              <Typography variant="body2" sx={{ mb: 2 }}><strong>Student:</strong> {selectedSubmission.student_name}</Typography>
              {selectedSubmission.submission_file && (
                <Button href={selectedSubmission.submission_file} target="_blank" rel="noopener noreferrer" variant="outlined" sx={{ mb: 2 }} fullWidth>View Submission</Button>
              )}
              <TextField label="Score" type="number" fullWidth margin="normal" value={gradeData.score} onChange={(e) => setGradeData({ ...gradeData, score: parseInt(e.target.value) })} inputProps={{ max: selectedTaskForSubmissions?.total_marks }} />
              <TextField label="Feedback" fullWidth margin="normal" multiline rows={4} value={gradeData.feedback} onChange={(e) => setGradeData({ ...gradeData, feedback: e.target.value })} />
            </>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={handleGradeClose}>Cancel</Button>
          <Button onClick={handleGradeSubmit} variant="contained" color="primary" disabled={submittingGrade}>{submittingGrade ? 'Grading...' : 'Submit Grade'}</Button>
        </DialogActions>
      </Dialog>

      <Dialog open={createDialogOpen} onClose={handleCreateClose} maxWidth="sm" fullWidth>
        <DialogTitle>Create Task</DialogTitle>
        <DialogContent>
          <TextField label="Title" fullWidth margin="normal" value={formData.title} onChange={(e) => setFormData({ ...formData, title: e.target.value })} />
          <TextField label="Description" fullWidth margin="normal" multiline rows={4} value={formData.description} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
          <FormControl fullWidth margin="normal">
            <InputLabel>Assign to Class</InputLabel>
            <Select value={formData.assigned_to_class} onChange={(e) => setFormData({ ...formData, assigned_to_class: e.target.value, assigned_to_section: '' })}>
              <MenuItem value="">Individual/None</MenuItem>
              {classes.map((c) => <MenuItem key={c} value={c}>{c}</MenuItem>)}
            </Select>
          </FormControl>
          <FormControl fullWidth margin="normal">
            <InputLabel>Assign to Section (optional)</InputLabel>
            <Select value={formData.assigned_to_section} onChange={(e) => setFormData({ ...formData, assigned_to_section: e.target.value })} disabled={!formData.assigned_to_class || sections.length === 0}>
              <MenuItem value="">Whole class</MenuItem>
              {sections.map((s) => <MenuItem key={s} value={s}>{s}</MenuItem>)}
            </Select>
          </FormControl>
          <TextField label="Total Marks" type="number" fullWidth margin="normal" value={formData.total_marks} onChange={(e) => setFormData({ ...formData, total_marks: parseInt(e.target.value) })} />
          <TextField label="Due Date" type="datetime-local" fullWidth margin="normal" InputLabelProps={{ shrink: true }} value={formData.due_date} onChange={(e) => setFormData({ ...formData, due_date: e.target.value })} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCreateClose}>Cancel</Button>
          <Button onClick={handleCreateTask} variant="contained" color="primary">Create</Button>
        </DialogActions>
      </Dialog>

      <SubmissionRatings
        open={ratingDialogOpenLocal}
        onClose={() => { setRatingDialogOpenLocal(false); setSelectedSubmissionToRate(null); }}
        submissionId={selectedSubmissionToRate?.id}
        onSaved={() => { if (selectedTaskForSubmissions) handleViewSubmissions(selectedTaskForSubmissions); else fetchTasks(); }}
      />

    </Container>
  );
};

export default TeacherTasks;
