import React, { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  TextField,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  Chip,
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
  Stepper,
  Step,
  StepLabel,
  FormGroup,
  FormControlLabel,
  Checkbox,
} from '@mui/material';
import {
  Grade as ResultsIcon,
  Add as AddIcon,
  Delete as DeleteIcon,
  Send as SendIcon,
} from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const TeacherResults = () => {
  const queryClient = useQueryClient();
  
  // States
  const [step, setStep] = useState(0); // 0: Select Class & Exams, 1: Add Student Marks
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExams, setSelectedExams] = useState([]); // Array of exam IDs
  const [students, setStudents] = useState([]);
  const [studentName, setStudentName] = useState('');
  const [marks, setMarks] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [openPreview, setOpenPreview] = useState(false);

  // Fetch classes from students
  const { data: classes, isLoading: classesLoading } = useQuery({
    queryKey: ['classes'],
    queryFn: async () => {
      const response = await axios.get('students/');
      const studentList = Array.isArray(response.data) ? response.data : (response.data?.results || []);
      
      const uniqueClasses = [...new Set(studentList.map((s) => s.current_class))];
      return uniqueClasses.sort((a, b) => {
        const numA = parseInt(a);
        const numB = parseInt(b);
        return numA - numB;
      });
    },
  });

  // Fetch exams
  const { data: exams, isLoading: examsLoading } = useQuery({
    queryKey: ['exams'],
    queryFn: async () => {
      const response = await axios.get('results/exams/');
      return Array.isArray(response.data) ? response.data : (response.data?.results || []);
    },
  });

  // Fetch students for selected class
  const { data: classStudents } = useQuery({
    queryKey: ['class-students', selectedClass],
    queryFn: async () => {
      const response = await axios.get('students/');
      const studentList = Array.isArray(response.data) ? response.data : (response.data?.results || []);
      return studentList.filter((s) => s.current_class === selectedClass);
    },
    enabled: !!selectedClass,
  });

  // Get selected exam details
  const selectedExamDetails = (exams || []).filter((e) => selectedExams.includes(e.id));

  // Publish results mutation
  const publishMutation = useMutation({
    mutationFn: async (resultsData) => {
      const responses = await Promise.all(
        resultsData.map((result) =>
          axios.post('results/', result)
        )
      );
      return responses;
    },
    onSuccess: () => {
      queryClient.invalidateQueries(['results']);
      setSuccessMessage(`Successfully added marks for ${students.length} students!`);
      // Reset form
      setStep(0);
      setSelectedClass('');
      setSelectedExams([]);
      setStudents([]);
      setMarks({});
      setStudentName('');
      setTimeout(() => setSuccessMessage(''), 4000);
    },
    onError: (err) => {
      setError(err.response?.data?.detail || 'Failed to add results');
    },
  });

  const handleExamSelection = (examId) => {
    setSelectedExams((prev) =>
      prev.includes(examId)
        ? prev.filter((id) => id !== examId)
        : [...prev, examId]
    );
  };

  const handleAddStudent = () => {
    if (!studentName.trim()) {
      setError('Please select a student');
      return;
    }

    if (Object.keys(marks).length !== selectedExams.length) {
      setError('Please enter marks for all selected exams');
      return;
    }

    const student = classStudents.find((s) => s.student_id === studentName);
    
    setStudents([
      ...students,
      {
        student_id: studentName,
        student_name: student ? `${student.user.first_name} ${student.user.last_name}` : studentName,
        marks: { ...marks },
      },
    ]);

    // Reset form for next student
    setStudentName('');
    setMarks({});
    setError('');
  };

  const handleRemoveStudent = (idx) => {
    setStudents(students.filter((_, i) => i !== idx));
  };

  const handlePublish = () => {
    if (students.length === 0) {
      setError('Please add at least one student');
      return;
    }

    setLoading(true);
    const allResults = [];
    
    students.forEach((student) => {
      selectedExams.forEach((examId) => {
        allResults.push({
          student: student.student_id,
          exam: examId,
          marks_obtained: parseInt(student.marks[examId] || 0),
        });
      });
    });

    publishMutation.mutate(allResults);
    setLoading(false);
  };

  const steps = ['Select Class & Exams', 'Add Student Marks'];

  return (
    <Box>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={3}>
        <ResultsIcon sx={{ fontSize: 32, mr: 2, color: 'primary.main' }} />
        <Typography variant="h4">Publish Class Results</Typography>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccessMessage('')}>
          {successMessage}
        </Alert>
      )}

      {/* Stepper */}
      <Stepper activeStep={step} sx={{ mb: 3 }}>
        {steps.map((label) => (
          <Step key={label}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* Step 0: Select Class & Exams */}
      {step === 0 && (
        <Paper sx={{ p: 3 }}>
          <Typography variant="h6" sx={{ mb: 2 }}>
            Step 1: Select Class & Exams
          </Typography>
          <Grid container spacing={3}>
            <Grid item xs={12}>
              <FormControl fullWidth>
                <InputLabel>Select Class</InputLabel>
                <Select
                  value={selectedClass}
                  onChange={(e) => {
                    setSelectedClass(e.target.value);
                    setSelectedExams([]);
                    setStudents([]);
                    setMarks({});
                  }}
                  label="Select Class"
                >
                  {(classes || []).map((cls) => (
                    <MenuItem key={cls} value={cls}>
                      Class {cls}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>

            {selectedClass && (
              <Grid item xs={12}>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Select Exams/Subjects for Class {selectedClass}
                </Typography>
                <Paper sx={{ p: 2, bgcolor: 'action.hover' }}>
                  {examsLoading ? (
                    <Box display="flex" alignItems="center" justifyContent="center" sx={{ py: 2 }}>
                      <CircularProgress size={24} sx={{ mr: 1 }} />
                      <Typography variant="body2">Loading exams...</Typography>
                    </Box>
                  ) : !exams || exams.length === 0 ? (
                    <Typography variant="body2" color="text.secondary">
                      No exams available. Please create exams first.
                    </Typography>
                  ) : (
                    <FormGroup>
                      {exams.map((exam) => (
                        <FormControlLabel
                          key={exam.id}
                          control={
                            <Checkbox
                              checked={selectedExams.includes(exam.id)}
                              onChange={() => handleExamSelection(exam.id)}
                            />
                          }
                          label={`${exam.subject_name || 'Unknown Subject'} (${exam.name || 'Unnamed Exam'}) - Max: ${exam.total_marks || 0} marks`}
                        />
                      ))}
                    </FormGroup>
                  )}
                </Paper>
              </Grid>
            )}

            {selectedExams.length > 0 && (
              <Grid item xs={12}>
                <Box sx={{ mt: 2 }}>
                  <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                    Selected Subjects ({selectedExams.length}):
                  </Typography>
                  <Box display="flex" flexWrap="wrap" gap={1}>
                    {selectedExamDetails.map((exam) => (
                      <Chip
                        key={exam.id}
                        label={`${exam.subject_name} (${exam.total_marks} marks)`}
                        color="primary"
                      />
                    ))}
                  </Box>
                </Box>
              </Grid>
            )}
          </Grid>

          <Button
            variant="contained"
            onClick={() => setStep(1)}
            disabled={!selectedClass || selectedExams.length === 0}
            sx={{ mt: 3 }}
            size="large"
          >
            Continue to Add Marks
          </Button>
        </Paper>
      )}

      {/* Step 1: Add Marks */}
      {step === 1 && (
        <Box>
          <Paper sx={{ p: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 3 }}>
              Step 2: Add Student Marks
            </Typography>

            <Card sx={{ mb: 3, bgcolor: 'action.hover' }}>
              <CardContent>
                <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>
                  Enter Student Details
                </Typography>
                <Grid container spacing={2}>
                  <Grid item xs={12} sm={6}>
                    <FormControl fullWidth>
                      <InputLabel>Student Name</InputLabel>
                      <Select
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        label="Student Name"
                      >
                        {(classStudents || [])
                          .filter((s) => !students.some((st) => st.student_id === s.student_id))
                          .map((student) => (
                            <MenuItem key={student.id} value={student.student_id}>
                              {student.user.first_name} {student.user.last_name} ({student.student_id})
                            </MenuItem>
                          ))}
                      </Select>
                    </FormControl>
                  </Grid>
                </Grid>

                {/* Exam Marks Inputs */}
                {studentName && (
                  <Box sx={{ mt: 3 }}>
                    <Typography variant="body2" sx={{ mb: 2, color: 'text.secondary' }}>
                      Enter marks for {classStudents?.find((s) => s.student_id === studentName)?.user.first_name}:
                    </Typography>
                    {selectedExamDetails.map((exam) => (
                      <TextField
                        key={exam.id}
                        fullWidth
                        label={`${exam.subject_name} (Max: ${exam.total_marks})`}
                        type="number"
                        value={marks[exam.id] || ''}
                        onChange={(e) =>
                          setMarks({
                            ...marks,
                            [exam.id]: e.target.value,
                          })
                        }
                        sx={{ mb: 2 }}
                        inputProps={{ max: exam.total_marks, min: 0 }}
                      />
                    ))}

                    <Button
                      variant="contained"
                      fullWidth
                      onClick={handleAddStudent}
                      startIcon={<SendIcon />}
                      size="large"
                    >
                      Add Student & Continue
                    </Button>
                  </Box>
                )}
              </CardContent>
            </Card>
          </Paper>

          {/* Added Students Preview */}
          {students.length > 0 && (
            <Paper sx={{ p: 3, mb: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Students Added: {students.length} / {classStudents?.length || 0}
              </Typography>

              <TableContainer>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: 'primary.light' }}>
                      <TableCell sx={{ fontWeight: 'bold' }}>Student</TableCell>
                      {selectedExamDetails.map((exam) => (
                        <TableCell key={exam.id} align="center" sx={{ fontWeight: 'bold' }}>
                          {exam.subject_name}
                        </TableCell>
                      ))}
                      <TableCell align="center" sx={{ fontWeight: 'bold' }}>
                        Action
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {students.map((student, idx) => (
                      <TableRow key={idx}>
                        <TableCell>{student.student_name}</TableCell>
                        {selectedExamDetails.map((exam) => (
                          <TableCell key={exam.id} align="center">
                            {student.marks[exam.id] || '-'}
                          </TableCell>
                        ))}
                        <TableCell align="center">
                          <Button
                            size="small"
                            color="error"
                            onClick={() => handleRemoveStudent(idx)}
                          >
                            <DeleteIcon fontSize="small" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Paper>
          )}

          {/* Action Buttons */}
          <Box display="flex" gap={2}>
            <Button variant="outlined" onClick={() => setStep(0)}>
              Back
            </Button>
            <Button
              variant="contained"
              color="success"
              onClick={() => setOpenPreview(true)}
              disabled={students.length === 0}
              size="large"
            >
              Preview & Submit for Approval
            </Button>
          </Box>
        </Box>
      )}

      {/* Preview Dialog */}
      <Dialog open={openPreview} onClose={() => setOpenPreview(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Confirm & Submit for Approval</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Class:</strong> {selectedClass}
            </Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              <strong>Subjects:</strong> {selectedExamDetails.length}
            </Typography>
            <Typography variant="body2" sx={{ mb: 2 }}>
              <strong>Students:</strong> {students.length}
            </Typography>
            <Alert severity="info">
              These results will be sent for admin approval. Students will not see them until approved.
            </Alert>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPreview(false)}>Cancel</Button>
          <Button
            variant="contained"
            onClick={() => {
              setOpenPreview(false);
              handlePublish();
            }}
            disabled={publishMutation.isPending}
          >
            {publishMutation.isPending ? <CircularProgress size={24} /> : 'Submit for Approval'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default TeacherResults;


