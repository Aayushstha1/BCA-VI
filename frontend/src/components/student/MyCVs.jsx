import React, { useState, useEffect, useMemo } from 'react';
import {
  Box,
  Container,
  Typography,
  Paper,
  TextField,
  Button,
  Grid,
  List,
  ListItem,
  ListItemText,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  Divider,
  Card,
  CardContent,
  CardActions,
  Stepper,
  Step,
  StepLabel,
  FormControlLabel,
  Checkbox,
  Stack,
} from '@mui/material';
import {
  Upload as UploadIcon,
  Delete as DeleteIcon,
  CheckCircle as CheckCircleIcon,
  Cancel as CancelIcon,
  Pending as PendingIcon,
  Visibility as VisibilityIcon,
  Download as DownloadIcon,
} from '@mui/icons-material';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const parseList = (value, limit = 8) => {
  if (!value) return [];
  return value
    .split(/,|\n/)
    .map((item) => item.trim())
    .filter(Boolean)
    .slice(0, limit);
};

const MyCVs = () => {
  const { user } = useAuth();
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  const [cvs, setCvs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

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

  const [submitting, setSubmitting] = useState(false);
  const [activeStep, setActiveStep] = useState(0);

  const steps = ['Basics', 'Education & Experience', 'Skills & Projects', 'Additional Details'];

  useEffect(() => {
    fetchCVs();
  }, []);

  const fetchCVs = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const resp = await axios.get(`${API_BASE_URL}/students/cvs/`, {
        headers: { Authorization: `Token ${token}` },
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
          'Content-Type': 'multipart/form-data',
        },
      });

      resetForm();
      setSuccess('CV submitted successfully. It is pending approval.');
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
        headers: { Authorization: `Token ${token}` },
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
      <Chip icon={config.icon} label={config.label} color={config.color} size="small" />
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

  const displayName = user?.first_name || user?.last_name
    ? `${user?.first_name || ''} ${user?.last_name || ''}`.trim()
    : (user?.username || 'Student');
  const displayEmail = user?.email || 'email@example.com';

  const skillChips = useMemo(() => parseList(skills), [skills]);
  const languageChips = useMemo(() => parseList(languages), [languages]);
  const certificationChips = useMemo(() => parseList(certifications), [certifications]);

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 6 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
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

      <Paper
        sx={{
          p: 3,
          mb: 3,
          borderRadius: 3,
          color: 'white',
          background: 'linear-gradient(120deg, #0f172a 0%, #1d4ed8 100%)',
        }}
      >
        <Grid container spacing={2} alignItems="center">
          <Grid item xs={12} md={8}>
            <Typography variant="h4" sx={{ fontWeight: 700 }}>
              Professional CV Studio
            </Typography>
            <Typography variant="body1" sx={{ mt: 1, opacity: 0.9 }}>
              Build a business-ready CV with clean sections, measurable impact, and a modern layout.
            </Typography>
            <Stack direction="row" spacing={1} sx={{ mt: 2, flexWrap: 'wrap' }}>
              <Chip label="ATS-ready" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }} />
              <Chip label="Executive style" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }} />
              <Chip label="Fast approvals" sx={{ bgcolor: 'rgba(255,255,255,0.15)', color: 'white' }} />
            </Stack>
          </Grid>
          <Grid item xs={12} md={4} sx={{ textAlign: { xs: 'left', md: 'right' } }}>
            <Button
              variant="contained"
              startIcon={<UploadIcon />}
              onClick={resetForm}
              sx={{
                bgcolor: 'white',
                color: '#1d4ed8',
                fontWeight: 600,
                '&:hover': { bgcolor: '#e2e8f0' },
              }}
            >
              Create New CV
            </Button>
          </Grid>
        </Grid>
      </Paper>

      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
              <Typography variant="h6" sx={{ fontWeight: 600 }}>
                CV Builder
              </Typography>
              <Chip
                label={isPrimary ? 'Primary CV' : 'Draft'}
                color={isPrimary ? 'primary' : 'default'}
                size="small"
              />
            </Box>
            <Divider sx={{ mb: 2 }} />
            <Stepper activeStep={activeStep} alternativeLabel sx={{ mb: 3 }}>
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
                    label="CV Title"
                    fullWidth
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Professional Summary"
                    fullWidth
                    multiline
                    rows={4}
                    value={summary}
                    onChange={(e) => setSummary(e.target.value)}
                    placeholder="Short summary highlighting your strengths, role, and impact."
                  />
                </Grid>
                <Grid item xs={12}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderStyle: 'dashed',
                      borderColor: 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2">Upload CV file (PDF)</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Optional but recommended for a polished CV.
                      </Typography>
                    </Box>
                    <Button variant="contained" component="label" startIcon={<UploadIcon />}>
                      Select File
                      <input hidden type="file" accept="application/pdf" onChange={handleFileChange} />
                    </Button>
                  </Paper>
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
                    placeholder="Degree, institution, year, honors, GPA, certifications."
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
                    placeholder="Company, role, key achievements, measurable results."
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
                    placeholder="Example: Leadership, Financial Modeling, Sales Strategy, Excel"
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
                    placeholder="Key projects, impact, tools used, results."
                  />
                </Grid>
                <Grid item xs={12}>
                  <Paper
                    variant="outlined"
                    sx={{
                      p: 2,
                      borderStyle: 'dashed',
                      borderColor: 'divider',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      gap: 2,
                      flexWrap: 'wrap',
                    }}
                  >
                    <Box>
                      <Typography variant="subtitle2">Upload supporting project file</Typography>
                      <Typography variant="caption" color="text.secondary">
                        Optional case study, portfolio, or project report.
                      </Typography>
                    </Box>
                    <Button variant="outlined" component="label" startIcon={<UploadIcon />}>
                      Upload File
                      <input hidden type="file" onChange={handleProjectFileChange} />
                    </Button>
                  </Paper>
                  <Typography variant="body2" sx={{ mt: 1, color: 'text.secondary' }}>
                    {projectFile ? projectFile.name : 'No file selected'}
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
                    placeholder="Certifications, awards, professional courses."
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
                    placeholder="Example: English, Hindi, French"
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    label="Interests"
                    fullWidth
                    multiline
                    rows={3}
                    value={hobbies}
                    onChange={(e) => setHobbies(e.target.value)}
                    placeholder="Leadership clubs, volunteering, travel, debate."
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControlLabel
                    control={
                      <Checkbox
                        checked={isPrimary}
                        onChange={(e) => setIsPrimary(e.target.checked)}
                      />
                    }
                    label="Set as primary CV (after approval)"
                  />
                </Grid>
              </Grid>
            )}

            <Box display="flex" justifyContent="space-between" mt={3}>
              <Button onClick={handleBack} disabled={activeStep === 0}>
                Back
              </Button>
              {activeStep < steps.length - 1 ? (
                <Button onClick={handleNext} variant="contained">
                  Next
                </Button>
              ) : (
                <Button onClick={handleSubmit} variant="contained" disabled={submitting}>
                  {submitting ? 'Submitting...' : 'Submit CV'}
                </Button>
              )}
            </Box>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              CV Submissions
            </Typography>
            {cvs.length === 0 ? (
              <Typography color="text.secondary" sx={{ textAlign: 'center', py: 4 }}>
                No CVs found. Create your first CV to get started.
              </Typography>
            ) : (
              <Grid container spacing={2}>
                {cvs.map((cv) => (
                  <Grid item xs={12} md={6} key={cv.id}>
                    <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
                      <CardContent sx={{ flexGrow: 1 }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 600 }}>
                            {cv.title}
                          </Typography>
                          {getStatusChip(cv.approval_status)}
                          {cv.is_primary && <Chip label="Primary" color="primary" size="small" />}
                        </Box>
                        {cv.summary && (
                          <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                            {cv.summary}
                          </Typography>
                        )}
                        {cv.approval_status === 'rejected' && cv.rejection_reason && (
                          <Alert severity="error" sx={{ mt: 1 }}>
                            <Typography variant="body2">
                              Rejection: {cv.rejection_reason}
                            </Typography>
                          </Alert>
                        )}
                        {cv.approval_status === 'approved' && cv.approved_by_name && (
                          <Typography variant="caption" color="text.secondary">
                            Approved by {cv.approved_by_name}
                            {cv.approved_at && ` on ${new Date(cv.approved_at).toLocaleDateString()}`}
                          </Typography>
                        )}
                      </CardContent>
                      <CardActions sx={{ justifyContent: 'space-between' }}>
                        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                          {cv.file_url && (
                            <Button
                              size="small"
                              href={cv.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              startIcon={<VisibilityIcon />}
                            >
                              View
                            </Button>
                          )}
                          {cv.file_url && (
                            <Button
                              size="small"
                              href={cv.file_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              startIcon={<DownloadIcon />}
                            >
                              Download
                            </Button>
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
                        </Box>
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
                      </CardActions>
                    </Card>
                  </Grid>
                ))}
              </Grid>
            )}
          </Paper>
        </Grid>

        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 3, borderRadius: 3, mb: 3 }}>
            <Typography variant="h6" sx={{ mb: 2 }}>
              Live Preview
            </Typography>
            <Box sx={{ p: 2, borderRadius: 2, bgcolor: '#f8fafc', border: '1px solid #e2e8f0' }}>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                {displayName}
              </Typography>
              <Typography variant="subtitle2" color="text.secondary">
                {title || 'Business Analyst | Strategy | Growth'}
              </Typography>
              <Typography variant="body2" sx={{ mt: 1 }}>
                Email: {displayEmail}
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Summary
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                {summary || 'Add a strong summary to highlight your experience, results, and leadership.'}
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Education
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                {education || 'Add your degree, institution, and academic achievements.'}
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Experience
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-line' }}>
                {experience || 'Outline your roles and measurable impact.'}
              </Typography>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Skills
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {skillChips.length ? (
                  skillChips.map((skill) => <Chip key={skill} label={skill} size="small" />)
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Add skills to highlight your expertise.
                  </Typography>
                )}
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Certifications
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {certificationChips.length ? (
                  certificationChips.map((item) => <Chip key={item} label={item} size="small" />)
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Add certifications or awards.
                  </Typography>
                )}
              </Box>
              <Divider sx={{ my: 1.5 }} />
              <Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
                Languages
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                {languageChips.length ? (
                  languageChips.map((item) => <Chip key={item} label={item} size="small" />)
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    Add languages to show communication skills.
                  </Typography>
                )}
              </Box>
            </Box>
          </Paper>

          <Paper sx={{ p: 3, borderRadius: 3 }}>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1 }}>
              Business CV Tips
            </Typography>
            <List dense>
              <ListItem>
                <ListItemText primary="Lead with impact by quantifying outcomes." />
              </ListItem>
              <ListItem>
                <ListItemText primary="Keep summaries concise and role-specific." />
              </ListItem>
              <ListItem>
                <ListItemText primary="Highlight leadership, strategy, and measurable growth." />
              </ListItem>
              <ListItem>
                <ListItemText primary="Use strong action verbs and results in bullet points." />
              </ListItem>
            </List>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default MyCVs;
