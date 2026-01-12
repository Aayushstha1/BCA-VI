import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Typography, CircularProgress, Paper, Button, Stack } from '@mui/material';
import PrintIcon from '@mui/icons-material/Print';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import DownloadIcon from '@mui/icons-material/FileDownload';
import axios from 'axios';
import './profile.css';

const PublicStudentProfile = () => {
  const { studentId } = useParams();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let mounted = true;
    axios.get(`/students/public/${studentId}/`)
      .then((resp) => { if (mounted) setData(resp.data); })
      .catch((err) => { if (mounted) setError(err.response?.data?.detail || 'Failed to load profile'); })
      .finally(() => { if (mounted) setLoading(false); });
    return () => { mounted = false; };
  }, [studentId]);

  const handlePrint = () => {
    window.print();
  };

  if (loading) return <Box display="flex" justifyContent="center" alignItems="center" minHeight="50vh"><CircularProgress /></Box>;
  if (error) return <Box p={3}><Typography color="error">{error}</Typography></Box>;
  if (!data) return null;

  const qrUrl = data.qr_code_url || data.profile_url;

  return (
    <Box p={3} display="flex" justifyContent="center">
      <Paper className="printable public-profile" sx={{ p: 3, maxWidth: 800, width: '100%' }}>
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
          <Box>
            <Typography variant="h6" className="school-name">Your Institution Name</Typography>
            <Typography variant="subtitle2" color="text.secondary">Public Student Profile</Typography>
          </Box>
          <Stack direction="row" spacing={1} className="no-print">
            {qrUrl && (
              <Button variant="outlined" startIcon={<OpenInNewIcon />} href={qrUrl} target="_blank">Open QR</Button>
            )}
            {qrUrl && (
              <Button variant="outlined" startIcon={<DownloadIcon />} href={qrUrl} target="_blank" download>Download QR</Button>
            )}
            <Button variant="contained" startIcon={<PrintIcon />} onClick={handlePrint}>Print</Button>
          </Stack>
        </Box>

        <Box display="flex" gap={3} alignItems="center" mb={2}>
          {data.user?.profile_picture ? (
            <img alt="profile" style={{ width: 112, height: 112, borderRadius: 8 }} src={data.user.profile_picture.startsWith('http') ? data.user.profile_picture : `${axios.defaults.baseURL.replace('/api','')}${data.user.profile_picture}`} />
          ) : (
            <Box sx={{ width: 112, height: 112, background: '#f3f4f6', display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 1 }}>No Image</Box>
          )}

          <Box sx={{ flex: 1 }}>
            <Typography variant="h4">{data.name}</Typography>
            <Typography variant="body1">Student ID: {data.student_id}</Typography>
            <Typography variant="body2">Class: {data.class} — Section: {data.section}</Typography>
            <Typography variant="body2">Roll: {data.roll_number}</Typography>
          </Box>

          <Box>
            {qrUrl ? (
              <img alt="QR" style={{ width: 160, height: 160 }} src={qrUrl} />
            ) : (
              <Typography color="text.secondary">No QR available</Typography>
            )}
          </Box>
        </Box>

        <Box sx={{ mt: 1 }}>
          <Typography variant="h6">Borrowed Books</Typography>
          {data.borrowed_books && data.borrowed_books.length ? data.borrowed_books.map((b,i)=>(<Typography key={i}>{b.title} — {b.issued_date}</Typography>)) : <Typography color="text.secondary">No borrowed books.</Typography>}
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="h6">Recent Results</Typography>
          {data.recent_results && data.recent_results.length ? data.recent_results.map((r,i)=>(<Typography key={i}>{r.exam}: {r.marks_obtained}/{r.total_marks} — Grade: {r.grade} — {r.passed ? 'Pass' : 'Fail'}</Typography>)) : <Typography color="text.secondary">No recent results.</Typography>}
        </Box>

        <Box sx={{ mt: 2 }}>
          <Typography variant="body2">Profile link: {data.profile_url ? <a href={data.profile_url} target="_blank" rel="noreferrer">Open profile</a> : 'Not available'}</Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default PublicStudentProfile;
