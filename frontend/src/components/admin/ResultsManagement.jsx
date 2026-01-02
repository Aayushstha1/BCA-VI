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
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Alert,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tab,
  Tabs,
  Grid,
} from '@mui/material';
import {
  CheckCircle as ApproveIcon,
  Cancel as RejectIcon,
  Visibility as ViewIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`tabpanel-${index}`}
      aria-labelledby={`tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ResultsManagement = () => {
  const queryClient = useQueryClient();
  const [tabValue, setTabValue] = useState(0);
  const [selectedExam, setSelectedExam] = useState('');
  const [selectedClass, setSelectedClass] = useState('');
  const [openDialog, setOpenDialog] = useState(false);
  const [dialogMode, setDialogMode] = useState(''); // 'approve' or 'reject'
  const [selectedClassResults, setSelectedClassResults] = useState(null);
  const [remarks, setRemarks] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // Fetch all pending results grouped by exam and class
  const { data: groupedResults, isLoading } = useQuery({
    queryKey: ['results-pending'],
    queryFn: async () => {
      const response = await axios.get('results/');
      const allResults = Array.isArray(response.data) ? response.data : (response.data?.results || []);
      
      // Filter pending results
      const pending = allResults.filter((r) => r.status === 'pending_approval');
      
      // Group by exam and class
      const grouped = {};
      pending.forEach((result) => {
        const examId = result.exam || 'unknown';
        const studentClass = result.student_class || 'unknown';
        const key = `${examId}-${studentClass}`;
        
        if (!grouped[key]) {
          grouped[key] = {
            examId,
            examName: result.exam_name || `Exam ${examId}`,
            class: studentClass,
            results: [],
            subjects: new Set(),
            students: new Set(),
          };
        }
        
        grouped[key].results.push(result);
        grouped[key].subjects.add(result.subject_name || result.subject || 'Unknown');
        grouped[key].students.add(result.student_name || result.student || 'Unknown');
      });

      return Object.values(grouped);
    },
  });

  // Fetch approved results for display
  const { data: approvedResults } = useQuery({
    queryKey: ['results-approved'],
    queryFn: async () => {
      const response = await axios.get('results/');
      const allResults = Array.isArray(response.data) ? response.data : (response.data?.results || []);
      
      // Filter approved results
      const approved = allResults.filter((r) => r.status === 'approved');
      
      // Group by exam and class
      const grouped = {};
      approved.forEach((result) => {
        const examId = result.exam || 'unknown';
        const studentClass = result.student_class || 'unknown';
        const key = `${examId}-${studentClass}`;
        
        if (!grouped[key]) {
          grouped[key] = {
            examId,
            examName: result.exam_name || `Exam ${examId}`,
            class: studentClass,
            results: [],
            subjects: new Set(),
            students: new Set(),
            approvedBy: result.approved_by_name || 'Admin',
            approvedAt: result.approved_at,
          };
        }
        
        grouped[key].results.push(result);
        grouped[key].subjects.add(result.subject_name || result.subject || 'Unknown');
        grouped[key].students.add(result.student_name || result.student || 'Unknown');
      });

      return Object.values(grouped);
    },
  });

  const approvalMutation = useMutation({
    mutationFn: async ({ resultIds, action, remarks: approvalRemarks }) => {
      const payload = {
        exam: selectedClassResults.examId,
        class: selectedClassResults.class,
        action,
      };
      if (approvalRemarks) {
        payload.remarks = approvalRemarks;
      }
      
      const response = await axios.post('results/approve/', payload);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['results-pending']);
      queryClient.invalidateQueries(['results-approved']);
      setOpenDialog(false);
      setRemarks('');
      setSuccess(`Results ${dialogMode === 'approve' ? 'approved' : 'rejected'} successfully!`);
      setTimeout(() => setSuccess(''), 4000);
    },
    onError: (err) => {
      setError(err.response?.data?.detail || 'Failed to update results');
    },
  });

  const handleApproveClass = (classGroup) => {
    setSelectedClassResults(classGroup);
    setDialogMode('approve');
    setOpenDialog(true);
    setRemarks('');
    setError('');
  };

  const handleRejectClass = (classGroup) => {
    setSelectedClassResults(classGroup);
    setDialogMode('reject');
    setOpenDialog(true);
    setRemarks('');
    setError('');
  };

  const handleConfirmAction = () => {
    if (!remarks.trim() && dialogMode === 'reject') {
      setError('Please provide a reason for rejection');
      return;
    }

    approvalMutation.mutate({
      action: dialogMode === 'approve' ? 'approve' : 'reject',
      remarks: remarks,
    });
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  if (isLoading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh">
        <CircularProgress />
      </Box>
    );
  }

  const pendingGroups = groupedResults || [];
  const approvedGroups = approvedResults || [];

  return (
    <Box>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" sx={{ mb: 1 }}>
          Results Management
        </Typography>
        <Typography variant="body2" color="text.secondary">
          Review and approve class results submissions
        </Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>
          {success}
        </Alert>
      )}

      {/* Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={tabValue}
          onChange={handleTabChange}
          aria-label="results tabs"
          sx={{ borderBottom: 1, borderColor: 'divider' }}
        >
          <Tab label={`Pending Approval (${pendingGroups.length})`} id="tab-0" />
          <Tab label={`Approved (${approvedGroups.length})`} id="tab-1" />
        </Tabs>

        {/* Pending Results Tab */}
        <TabPanel value={tabValue} index={0}>
          {pendingGroups.length === 0 ? (
            <Alert severity="info">No pending results for approval</Alert>
          ) : (
            <Grid container spacing={3}>
              {pendingGroups.map((group, idx) => (
                <Grid item xs={12} key={idx}>
                  <Card>
                    <CardContent>
                      {/* Class Header */}
                      <Box display="flex" justifyContent="space-between" alignItems="start" sx={{ mb: 2 }}>
                        <Box>
                          <Typography variant="h6">
                            {group.examName} - Class {group.class}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            <strong>Students:</strong> {group.students.size} | <strong>Subjects:</strong>{' '}
                            {group.subjects.size}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            {Array.from(group.subjects).map((subject) => (
                              <Chip
                                key={subject}
                                label={subject}
                                size="small"
                                variant="outlined"
                                sx={{ mr: 1, mt: 0.5 }}
                              />
                            ))}
                          </Box>
                        </Box>
                        <Chip
                          label="Pending Review"
                          color="warning"
                          size="small"
                        />
                      </Box>

                      {/* Results Table */}
                      <TableContainer sx={{ mt: 2 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                              <TableCell><strong>Student</strong></TableCell>
                              <TableCell><strong>Subject</strong></TableCell>
                              <TableCell align="right"><strong>Marks</strong></TableCell>
                              <TableCell align="center"><strong>Grade</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {group.results.map((result, ridx) => (
                              <TableRow key={ridx}>
                                <TableCell>{result.student_name || result.student || '-'}</TableCell>
                                <TableCell>{result.subject_name || result.subject || '-'}</TableCell>
                                <TableCell align="right">
                                  {result.marks_obtained ?? '-'}/{result.total_marks || '100'}
                                </TableCell>
                                <TableCell align="center">
                                  <Chip
                                    label={result.grade || '-'}
                                    size="small"
                                    color={
                                      result.grade?.startsWith('A')
                                        ? 'success'
                                        : result.grade?.startsWith('B')
                                        ? 'info'
                                        : result.grade?.startsWith('C')
                                        ? 'warning'
                                        : 'error'
                                    }
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>

                      {/* Action Buttons */}
                      <Box display="flex" gap={2} sx={{ mt: 3 }}>
                        <Button
                          variant="contained"
                          color="success"
                          startIcon={<ApproveIcon />}
                          onClick={() => handleApproveClass(group)}
                          fullWidth
                        >
                          Approve Class Results
                        </Button>
                        <Button
                          variant="outlined"
                          color="error"
                          startIcon={<RejectIcon />}
                          onClick={() => handleRejectClass(group)}
                          fullWidth
                        >
                          Reject & Request Revision
                        </Button>
                      </Box>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>

        {/* Approved Results Tab */}
        <TabPanel value={tabValue} index={1}>
          {approvedGroups.length === 0 ? (
            <Alert severity="info">No approved results yet</Alert>
          ) : (
            <Grid container spacing={3}>
              {approvedGroups.map((group, idx) => (
                <Grid item xs={12} key={idx}>
                  <Card>
                    <CardContent>
                      {/* Class Header */}
                      <Box display="flex" justifyContent="space-between" alignItems="start" sx={{ mb: 2 }}>
                        <Box>
                          <Typography variant="h6">
                            {group.examName} - Class {group.class}
                          </Typography>
                          <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                            <strong>Students:</strong> {group.students.size} | <strong>Subjects:</strong>{' '}
                            {group.subjects.size}
                          </Typography>
                          <Typography variant="caption" color="success.main" sx={{ display: 'block', mt: 1 }}>
                            ✓ Approved by {group.approvedBy} on{' '}
                            {new Date(group.approvedAt).toLocaleDateString()}
                          </Typography>
                          <Box sx={{ mt: 1 }}>
                            {Array.from(group.subjects).map((subject) => (
                              <Chip
                                key={subject}
                                label={subject}
                                size="small"
                                variant="outlined"
                                sx={{ mr: 1, mt: 0.5 }}
                              />
                            ))}
                          </Box>
                        </Box>
                        <Chip label="Approved" color="success" size="small" />
                      </Box>

                      {/* Results Table */}
                      <TableContainer sx={{ mt: 2 }}>
                        <Table size="small">
                          <TableHead>
                            <TableRow sx={{ bgcolor: 'action.hover' }}>
                              <TableCell><strong>Student</strong></TableCell>
                              <TableCell><strong>Subject</strong></TableCell>
                              <TableCell align="right"><strong>Marks</strong></TableCell>
                              <TableCell align="center"><strong>Grade</strong></TableCell>
                            </TableRow>
                          </TableHead>
                          <TableBody>
                            {group.results.map((result, ridx) => (
                              <TableRow key={ridx}>
                                <TableCell>{result.student_name || result.student || '-'}</TableCell>
                                <TableCell>{result.subject_name || result.subject || '-'}</TableCell>
                                <TableCell align="right">
                                  {result.marks_obtained ?? '-'}/{result.total_marks || '100'}
                                </TableCell>
                                <TableCell align="center">
                                  <Chip
                                    label={result.grade || '-'}
                                    size="small"
                                    color={
                                      result.grade?.startsWith('A')
                                        ? 'success'
                                        : result.grade?.startsWith('B')
                                        ? 'info'
                                        : result.grade?.startsWith('C')
                                        ? 'warning'
                                        : 'error'
                                    }
                                  />
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </TableContainer>
                    </CardContent>
                  </Card>
                </Grid>
              ))}
            </Grid>
          )}
        </TabPanel>
      </Paper>

      {/* Approval/Rejection Dialog */}
      <Dialog open={openDialog} onClose={() => setOpenDialog(false)} maxWidth="sm" fullWidth>
        <DialogTitle>
          {dialogMode === 'approve' ? 'Approve' : 'Reject'} Class Results
        </DialogTitle>
        <DialogContent>
          {selectedClassResults && (
            <Box sx={{ mt: 2 }}>
              <Alert severity={dialogMode === 'approve' ? 'success' : 'error'} sx={{ mb: 2 }}>
                {dialogMode === 'approve'
                  ? `Approve ${selectedClassResults.students.size} students' results for Class ${selectedClassResults.class}?`
                  : `Reject and request revision for Class ${selectedClassResults.class} results?`}
              </Alert>

              {dialogMode === 'reject' && (
                <TextField
                  fullWidth
                  multiline
                  rows={4}
                  label="Reason for Rejection"
                  placeholder="e.g., Marks exceed total, please review and resubmit..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  sx={{ mt: 2 }}
                />
              )}

              {dialogMode === 'approve' && (
                <TextField
                  fullWidth
                  multiline
                  rows={3}
                  label="Optional Remarks"
                  placeholder="Add any comments or notes..."
                  value={remarks}
                  onChange={(e) => setRemarks(e.target.value)}
                  sx={{ mt: 2 }}
                />
              )}

              {error && (
                <Alert severity="error" sx={{ mt: 2 }}>
                  {error}
                </Alert>
              )}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenDialog(false)}>Cancel</Button>
          <Button
            variant="contained"
            color={dialogMode === 'approve' ? 'success' : 'error'}
            onClick={handleConfirmAction}
            disabled={
              approvalMutation.isPending ||
              (dialogMode === 'reject' && !remarks.trim())
            }
          >
            {approvalMutation.isPending ? (
              <CircularProgress size={24} />
            ) : dialogMode === 'approve' ? (
              'Approve'
            ) : (
              'Reject'
            )}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ResultsManagement;
