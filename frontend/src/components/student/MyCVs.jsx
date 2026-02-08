import React, { useState, useEffect } from 'react';
import { 
  Box, Container, Typography, Paper, TextField, Button, Grid, 
  List, ListItem, ListItemText, IconButton, CircularProgress, 
  Alert, Dialog, DialogTitle, DialogContent, DialogActions, 
  Chip, Divider, Card, CardContent, Stepper, Step, StepLabel
} from '@mui/material';
import { 
  Upload as UploadIcon, Delete as DeleteIcon, 
  CheckCircle as CheckCircleIcon, Cancel as CancelIcon,
  Pending as PendingIcon, Visibility as VisibilityIcon
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const MyCVs = () => {
  const { user } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Form fields
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [education, setEducation] = useState('');
  const [experience, setExperience] = useState('');
  const [skills, setSkills] = useState('');
  const [projects, setProjects] = useState('');
  const [certifications, setCertifications] = useState('');
  const [languages, setLanguages] = useState('');
  const [hobbies, setHobbies] = useState('');
  const [file, setFile] = useState(null);
  const [projectFile, setProjectFile] = useState(null);
  const [isPrimary, setIsPrimary] = useState(false);
  
  const [previewOpen, setPreviewOpen] = useState(false);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [formOpen, setFormOpen] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const steps = ['Basic Information', 'Education & Experience', 'Skills & Projects', 'Additional Details'];

  useEffect(() => {
    fetchCVs();
  }, []);

  const fetchCVs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const resp = await axios.get(`${API_BASE_URL}/students/cvs/`, { 
        headers: { Authorization: `Token ${token}` } 
      });
      const results = resp.data.results || resp.data;
      setCvs(results);
    } catch (err) {
      setError('Failed to load CVs');
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleProjectFileChange = (e) => {
    setProjectFile(e.target.files[0]);
  };

  const handleNext = () => {
    if (activeStep === 0 && !title.trim()) {
      setError('Please enter a title');
      return;
    }
    setActiveStep((prevStep) => prevStep + 1);
    setError('');
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
    setError('');
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      setError('Please enter a title');
      return;
    }
    
    setSubmitting(true);
    setError('');
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const formData = new FormData();
      formData.append('title', title);
      formData.append('summary', summary || '');
      formData.append('education', education || '');
      formData.append('experience', experience || '');
      formData.append('skills', skills || '');
      formData.append('projects', projects || '');
      formData.append('certifications', certifications || '');
      formData.append('languages', languages || '');
      formData.append('hobbies', hobbies || '');
      formData.append('is_primary', isPrimary ? 'true' : 'false');
      if (file) formData.append('file', file);
      if (projectFile) formData.append('project_file', projectFile);
      
      await axios.post(`${API_BASE_URL}/students/cvs/`, formData, { 
        headers: { 
          Authorization: `Token ${token}`, 
          'Content-Type': 'multipart/form-data' 
        } 
      });
      
      // Reset form
      setTitle('');
      setSummary('');
      setEducation('');
      setExperience('');
      setSkills('');
      setProjects('');
      setCertifications('');
      setLanguages('');
      setHobbies('');
      setFile(null);
      setProjectFile(null);
      setIsPrimary(false);
      setActiveStep(0);
      setFormOpen(false);
      setSuccess('CV submitted successfully! It is pending approval from admin/teacher.');
      setTimeout(() => setSuccess(''), 5000);
      fetchCVs();
    } catch (err) {
      setError(err.response?.data?.detail || err.response?.data?.error || 'Failed to create CV');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this CV?')) return;
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      await axios.delete(`${API_BASE_URL}/students/cvs/${id}/`, { 
        headers: { Authorization: `Token ${token}` } 
      });
      setSuccess('CV deleted successfully');
      setTimeout(() => setSuccess(''), 3000);
      fetchCVs();
    } catch (err) {
      setError('Failed to delete CV');
    }
  };

  const getStatusChip = (status) => {
    const statusConfig = {
      pending: { color: 'warning', icon: <PendingIcon />, label: 'Pending' },
      approved: { color: 'success', icon: <CheckCircleIcon />, label: 'Approved' },
      rejected: { color: 'error', icon: <CancelIcon />, label: 'Rejected' },
    };
    const config = statusConfig[status] || statusConfig.pending;
    return (
      <Chip 
        icon={config.icon} 
        label={config.label} 
        color={config.color} 
        size="small" 
      />
    );
  };

  const resetForm = () => {
    setTitle('');
    setSummary('');
    setEducation('');
    setExperience('');
    setSkills('');
    setProjects('');
    setCertifications('');
    setLanguages('');
    setHobbies('');
    setFile(null);
    setProjectFile(null);
    setIsPrimary(false);
    setActiveStep(0);
    setError('');
  };

  if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {error && <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>{error}</Alert>}
      {success && <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess('')}>{success}</Alert>}
      
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h4" sx={{ fontWeight: 'bold' }}>My CVs</Typography>
        <Button 
          variant="contained" 
          startIcon={<UploadIcon />}
          onClick={() => {
            resetForm();
            setFormOpen(true);
          }}
        >
          Create New CV
        </Button>
      </Box>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" sx={{ mb: 2 }}>CV Submissions</Typography>
        {cvs.length === 0 ? (
          <Typography color="textSecondary" sx={{ textAlign: 'center', py: 4 }}>
            No CVs found. Create your first CV to get started!
          </Typography>
        ) : (
          <List>
            {cvs.map((cv) => (
              <Card key={cv.id} sx={{ mb: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
                    <Box sx={{ flex: 1 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                        <Typography variant="h6">{cv.title}</Typography>
                        {getStatusChip(cv.approval_status)}
                        {cv.is_primary && (
                          <Chip label="Primary" color="primary" size="small" />
                        )}
                      </Box>
                      {cv.summary && (
                        <Typography variant="body2" color="textSecondary" sx={{ mb: 1 }}>
                          {cv.summary}
                        </Typography>
                      )}
                      {cv.approval_status === 'rejected' && cv.rejection_reason && (
                        <Alert severity="error" sx={{ mt: 1, mb: 1 }}>
                          <Typography variant="body2"><strong>Rejection Reason:</strong> {cv.rejection_reason}</Typography>
                        </Alert>
                      )}
                      {cv.approval_status === 'approved' && cv.approved_by_name && (
                        <Typography variant="caption" color="textSecondary">
                          Approved by {cv.approved_by_name}
                          {cv.approved_at && ` on ${new Date(cv.approved_at).toLocaleDateString()}`}
                        </Typography>
                      )}
                    </Box>
                    <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                      {cv.file_url && (
                        <>
                          <Button 
                            size="small" 
                            href={cv.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            startIcon={<VisibilityIcon />}
                          >
                            View
                          </Button>
                          <Button 
                            size="small" 
                            href={cv.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            download
                          >
                            Download
                          </Button>
                        </>
                      )}
                      {cv.project_file_url && (
                        <Button 
                          size="small" 
                          variant="outlined"
                          href={cv.project_file_url} 
                          target="_blank" 
                          rel="noopener noreferrer"
                        >
                          Project File
                        </Button>
                      )}
                      {cv.approval_status !== 'approved' && (
                        <IconButton 
                          edge="end" 
                          aria-label="delete" 
                          onClick={() => handleDelete(cv.id)}
                          color="error"
                        >
                          <DeleteIcon />
                        </IconButton>
                      )}
                    </Box>
                  </Box>
                  
                  <Divider sx={{ my: 2 }} />
                  
                  <Grid container spacing={2}>
                    {cv.education && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">Education</Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{cv.education}</Typography>
                      </Grid>
                    )}
                    {cv.experience && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">Experience</Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{cv.experience}</Typography>
                      </Grid>
                    )}
                    {cv.skills && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">Skills</Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{cv.skills}</Typography>
                      </Grid>
                    )}
                    {cv.projects && (
                      <Grid item xs={12} md={6}>
                        <Typography variant="subtitle2" color="textSecondary">Projects</Typography>
                        <Typography variant="body2" sx={{ whiteSpace: 'pre-line' }}>{cv.projects}</Typography>
                      </Grid>
                    )}
                  </Grid>
                </CardContent>
              </Card>
            ))}
          </List>
        )}
      </Paper>

      {/* Create CV Dialog */}
      <Dialog open={formOpen} onClose={() => { setFormOpen(false); resetForm(); }} fullWidth maxWidth="md">
        <DialogTitle>Create New CV</DialogTitle>
        <DialogContent>
          <Stepper activeStep={activeStep} sx={{ mb: 4, mt: 2 }}>
            {steps.map((label) => (
              <Step key={label}>
                <StepLabel>{label}</StepLabel>
              </Step>
            ))}
          </Stepper>

          {activeStep === 0 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField 
                  label="CV Title *" 
                  fullWidth 
                  value={title} 
                  onChange={(e) => setTitle(e.target.value)}
                  required
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  label="Summary" 
                  fullWidth 
                  multiline 
                  rows={4} 
                  value={summary} 
                  onChange={(e) => setSummary(e.target.value)}
                  placeholder="Brief summary about yourself"
                />
              </Grid>
              <Grid item xs={12}>
                <Button variant="contained" component="label" startIcon={<UploadIcon />}>
                  Upload CV File (PDF)
                  <input hidden type="file" accept="application/pdf" onChange={handleFileChange} />
                </Button>
                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                  {file ? file.name : 'No file selected'}
                </Typography>
              </Grid>
            </Grid>
          )}

          {activeStep === 1 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField 
                  label="Education" 
                  fullWidth 
                  multiline 
                  rows={6} 
                  value={education} 
                  onChange={(e) => setEducation(e.target.value)}
                  placeholder="List your educational qualifications, degrees, institutions, years, etc."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  label="Experience" 
                  fullWidth 
                  multiline 
                  rows={6} 
                  value={experience} 
                  onChange={(e) => setExperience(e.target.value)}
                  placeholder="List your work experience, internships, positions, responsibilities, etc."
                />
              </Grid>
            </Grid>
          )}

          {activeStep === 2 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField 
                  label="Skills" 
                  fullWidth 
                  multiline 
                  rows={4} 
                  value={skills} 
                  onChange={(e) => setSkills(e.target.value)}
                  placeholder="List your technical skills, programming languages, tools, etc."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  label="Projects" 
                  fullWidth 
                  multiline 
                  rows={6} 
                  value={projects} 
                  onChange={(e) => setProjects(e.target.value)}
                  placeholder="Describe your projects, technologies used, your role, achievements, etc."
                />
              </Grid>
              <Grid item xs={12}>
                <Button variant="outlined" component="label" startIcon={<UploadIcon />}>
                  Upload Project File/Document
                  <input hidden type="file" onChange={handleProjectFileChange} />
                </Button>
                <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                  {projectFile ? projectFile.name : 'No file selected (optional)'}
                </Typography>
              </Grid>
            </Grid>
          )}

          {activeStep === 3 && (
            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField 
                  label="Certifications" 
                  fullWidth 
                  multiline 
                  rows={4} 
                  value={certifications} 
                  onChange={(e) => setCertifications(e.target.value)}
                  placeholder="List your certifications, courses, achievements, awards, etc."
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  label="Languages" 
                  fullWidth 
                  multiline 
                  rows={2} 
                  value={languages} 
                  onChange={(e) => setLanguages(e.target.value)}
                  placeholder="Languages you know (e.g., English, Hindi, etc.)"
                />
              </Grid>
              <Grid item xs={12}>
                <TextField 
                  label="Hobbies & Interests" 
                  fullWidth 
                  multiline 
                  rows={3} 
                  value={hobbies} 
                  onChange={(e) => setHobbies(e.target.value)}
                  placeholder="Your hobbies and interests"
                />
              </Grid>
              <Grid item xs={12}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <input 
                    type="checkbox" 
                    checked={isPrimary} 
                    onChange={(e) => setIsPrimary(e.target.checked)}
                    id="isPrimary"
                  />
                  <label htmlFor="isPrimary">Set as primary CV (only applies after approval)</label>
                </Box>
              </Grid>
            </Grid>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => { setFormOpen(false); resetForm(); }}>Cancel</Button>
          {activeStep > 0 && <Button onClick={handleBack}>Back</Button>}
          {activeStep < steps.length - 1 ? (
            <Button onClick={handleNext} variant="contained">Next</Button>
          ) : (
            <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
              {submitting ? 'Submitting...' : 'Submit CV'}
            </Button>
          )}
        </DialogActions>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={previewOpen} onClose={() => setPreviewOpen(false)} fullWidth maxWidth="lg">
        <DialogTitle>Preview CV</DialogTitle>
        <DialogContent sx={{ minHeight: 400 }}>
          {previewUrl ? (
            <object data={previewUrl} type="application/pdf" width="100%" height="600"> 
              <p>Your browser does not support PDFs. <a href={previewUrl}>Download</a></p>
            </object>
          ) : (
            <Typography>No file to preview</Typography>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setPreviewOpen(false)}>Close</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default MyCVs;
