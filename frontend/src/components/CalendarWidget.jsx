import React, { useMemo, useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  IconButton,
  Divider,
  Grid,
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemText,
} from '@mui/material';
import { ChevronLeft, ChevronRight, Event as EventIcon, Add as AddIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const dayLabels = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

const formatDateKey = (date) => {
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd}`;
};

const parseDateKey = (value) => {
  if (!value) return null;
  const [year, month, day] = value.split('-').map(Number);
  if (!year || !month || !day) return null;
  return new Date(year, month - 1, day);
};

const formatDisplayDate = (value) => {
  if (!value) return '';
  const parsed = parseDateKey(value);
  return parsed ? parsed.toLocaleDateString() : value;
};

const CalendarWidget = ({ canCreate = false, title = 'Calendar' }) => {
  const queryClient = useQueryClient();
  const [monthCursor, setMonthCursor] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [formData, setFormData] = useState(() => ({
    title: '',
    event_date: canCreate ? formatDateKey(new Date()) : '',
    is_holiday: false,
    description: '',
  }));
  const [formError, setFormError] = useState('');
  const [formSuccess, setFormSuccess] = useState('');

  const { data: eventsData, isLoading, error } = useQuery({
    queryKey: ['calendar-events'],
    queryFn: async () => (await axios.get('/events/')).data,
  });

  const events = useMemo(() => {
    if (Array.isArray(eventsData)) return eventsData;
    return eventsData?.results || [];
  }, [eventsData]);

  const eventsByDate = useMemo(() => {
    const map = {};
    events.forEach((event) => {
      if (!event?.event_date) return;
      if (!map[event.event_date]) {
        map[event.event_date] = [];
      }
      map[event.event_date].push(event);
    });
    return map;
  }, [events]);

  const days = useMemo(() => {
    const startOfMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth(), 1);
    const endOfMonth = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + 1, 0);
    const start = new Date(startOfMonth);
    start.setDate(startOfMonth.getDate() - startOfMonth.getDay());
    const end = new Date(endOfMonth);
    end.setDate(endOfMonth.getDate() + (6 - endOfMonth.getDay()));

    const result = [];
    const cursor = new Date(start);
    while (cursor <= end) {
      result.push(new Date(cursor));
      cursor.setDate(cursor.getDate() + 1);
    }
    return result;
  }, [monthCursor]);

  const selectedKey = formatDateKey(selectedDate);
  const selectedEvents = eventsByDate[selectedKey] || [];
  const monthLabel = monthCursor.toLocaleString('default', { month: 'long', year: 'numeric' });

  const changeMonth = (delta) => {
    const next = new Date(monthCursor.getFullYear(), monthCursor.getMonth() + delta, 1);
    setMonthCursor(next);
    setSelectedDate(next);
    if (canCreate) {
      setFormData((prev) => ({ ...prev, event_date: formatDateKey(next) }));
    }
  };

  const handleSelectDate = (day) => {
    setSelectedDate(day);
    if (canCreate) {
      setFormData((prev) => ({ ...prev, event_date: formatDateKey(day) }));
    }
  };

  const createMutation = useMutation({
    mutationFn: async (payload) => (await axios.post('/events/', payload)).data,
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      setFormData((prev) => ({
        ...prev,
        title: '',
        description: '',
        is_holiday: false,
        event_date: prev.event_date || variables?.event_date || '',
      }));
      setFormError('');
      setFormSuccess('Event added successfully.');
      if (variables?.event_date) {
        const parsed = parseDateKey(variables.event_date);
        if (parsed) {
          setSelectedDate(parsed);
          setMonthCursor(new Date(parsed.getFullYear(), parsed.getMonth(), 1));
        }
      }
    },
    onError: (err) => {
      const msg =
        typeof err.response?.data === 'object'
          ? JSON.stringify(err.response.data)
          : err.response?.data?.detail || 'Failed to add event.';
      setFormError(msg);
      setFormSuccess('');
    },
  });

  const handleInputChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    setFormError('');
    setFormSuccess('');
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setFormError('');
    setFormSuccess('');
    if (!formData.title || !formData.event_date) {
      setFormError('Event title and date are required.');
      return;
    }
    createMutation.mutate({
      title: formData.title,
      event_date: formData.event_date,
      is_holiday: formData.is_holiday,
      description: formData.description,
    });
  };

  return (
    <Paper sx={{ p: 2 }}>
      <Box display="flex" alignItems="center" justifyContent="space-between" mb={1}>
        <Box display="flex" alignItems="center" gap={1}>
          <EventIcon color="primary" />
          <Typography variant="h6">{title}</Typography>
        </Box>
        <Box display="flex" alignItems="center" gap={1}>
          <IconButton size="small" onClick={() => changeMonth(-1)}>
            <ChevronLeft />
          </IconButton>
          <Typography variant="subtitle1" sx={{ minWidth: 140, textAlign: 'center' }}>
            {monthLabel}
          </Typography>
          <IconButton size="small" onClick={() => changeMonth(1)}>
            <ChevronRight />
          </IconButton>
        </Box>
      </Box>
      <Divider sx={{ mb: 2 }} />

      {error && (
        <Alert severity="warning" sx={{ mb: 2 }}>
          Unable to load calendar events. Showing the calendar without highlights.
        </Alert>
      )}

      <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(7, 1fr)', gap: 0.5 }}>
        {dayLabels.map((label) => (
          <Typography key={label} variant="caption" sx={{ textAlign: 'center', fontWeight: 600 }}>
            {label}
          </Typography>
        ))}
        {days.map((day) => {
          const key = formatDateKey(day);
          const inMonth = day.getMonth() === monthCursor.getMonth();
          const isSelected = key === selectedKey;
          const isToday = key === formatDateKey(new Date());
          const count = eventsByDate[key]?.length || 0;
          const hasHoliday = (eventsByDate[key] || []).some((eventItem) => eventItem.is_holiday);

          return (
            <Box
              key={key}
              role="button"
              tabIndex={0}
              onClick={() => handleSelectDate(day)}
              onKeyDown={(evt) => {
                if (evt.key === 'Enter' || evt.key === ' ') {
                  evt.preventDefault();
                  handleSelectDate(day);
                }
              }}
              sx={{
                borderRadius: 1,
                p: 0.75,
                minHeight: 56,
                cursor: 'pointer',
                bgcolor: isSelected ? 'primary.light' : 'transparent',
                color: inMonth ? 'text.primary' : 'text.secondary',
                border: '1px solid',
                borderColor: isToday ? 'primary.main' : 'divider',
                '&:hover': {
                  bgcolor: isSelected ? 'primary.light' : 'action.hover',
                },
              }}
            >
              <Typography variant="caption" sx={{ fontWeight: isToday ? 700 : 400 }}>
                {day.getDate()}
              </Typography>
              {count > 0 && (
                <Box
                  sx={{
                    mt: 0.5,
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    bgcolor: hasHoliday ? 'error.main' : 'secondary.main',
                  }}
                />
              )}
            </Box>
          );
        })}
      </Box>

      <Box sx={{ mt: 2 }}>
        <Typography variant="subtitle1" sx={{ mb: 1 }}>
          Events on {selectedDate.toLocaleDateString()}
        </Typography>
        {isLoading ? (
          <Box display="flex" justifyContent="center" p={2}>
            <CircularProgress size={26} />
          </Box>
        ) : selectedEvents.length > 0 ? (
          <List dense>
            {selectedEvents.map((event) => {
              const secondaryParts = [];
              if (event.description) secondaryParts.push(event.description);
              if (event.created_by_name) secondaryParts.push(`By ${event.created_by_name}`);
              return (
                <ListItem key={event.id} divider>
                  <ListItemText
                    primary={event.is_holiday ? `Holiday: ${event.title}` : event.title}
                    secondary={secondaryParts.join(' • ') || formatDisplayDate(event.event_date)}
                  />
                </ListItem>
              );
            })}
          </List>
        ) : (
          <Typography color="text.secondary" sx={{ py: 1 }}>
            No events on this date.
          </Typography>
        )}
      </Box>

      {canCreate && (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            Add Event
          </Typography>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}
          {formSuccess && <Alert severity="success" sx={{ mb: 2 }}>{formSuccess}</Alert>}
          <Grid container spacing={2}>
            <Grid item xs={12} md={5}>
              <TextField
                fullWidth
                label="Event Title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                required
              />
            </Grid>
            <Grid item xs={12} md={3}>
              <TextField
                fullWidth
                label="Event Date"
                name="event_date"
                type="date"
                value={formData.event_date}
                onChange={handleInputChange}
                InputLabelProps={{ shrink: true }}
                required
              />
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                type="submit"
                variant="contained"
                fullWidth
                startIcon={<AddIcon />}
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? 'Adding...' : 'Add Event'}
              </Button>
            </Grid>
            <Grid item xs={12} md={3}>
              <FormControlLabel
                control={
                  <Checkbox
                    name="is_holiday"
                    checked={formData.is_holiday}
                    onChange={handleInputChange}
                  />
                }
                label="Holiday"
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Description (optional)"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                multiline
                rows={2}
              />
            </Grid>
          </Grid>
        </Box>
      )}
    </Paper>
  );
};

export default CalendarWidget;
