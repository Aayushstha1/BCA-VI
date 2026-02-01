import React, { useState } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button, Typography } from '@mui/material';
import axios from 'axios';

const SubmissionRatings = ({ open, onClose, submissionId, onSaved }) => {
  const [score, setScore] = useState(5);
  const [comment, setComment] = useState('');
  const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api';

  const submit = async () => {
    try {
      const token = localStorage.getItem('access_token') || localStorage.getItem('token');
      const resp = await axios.post(`${API_BASE_URL}/tasks/submission/${submissionId}/rate/`, { score, comment }, { headers: { Authorization: `Token ${token}` } });
      onSaved(resp.data);
      onClose();
    } catch (err) {
      console.error('Failed to rate submission', err);
    }
  };

  return (
    <Dialog open={open} onClose={onClose}>
      <DialogTitle>Rate Submission</DialogTitle>
      <DialogContent>
        <Typography variant="body2">Score 1-5</Typography>
        <TextField type="number" value={score} onChange={(e) => setScore(parseInt(e.target.value) || 1)} inputProps={{ min: 1, max: 5 }} sx={{ mt: 2 }} fullWidth />
        <TextField label="Comment" multiline rows={4} value={comment} onChange={(e) => setComment(e.target.value)} sx={{ mt: 2 }} fullWidth />
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={submit}>Submit</Button>
      </DialogActions>
    </Dialog>
  );
};

export default SubmissionRatings;