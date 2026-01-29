import React, { useState } from 'react';
import { Box, Typography, List, ListItem, ListItemText, IconButton, Chip, CircularProgress, Divider, Dialog, DialogTitle, DialogContent, DialogActions, Button } from '@mui/material';
import { Notifications as NotificationsIcon, Done as DoneIcon } from '@mui/icons-material';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';

const NotificationsList = () => {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState(null);
  const [open, setOpen] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['user-notifications'],
    queryFn: async () => {
      const resp = await axios.get('notices/notifications/');
      return resp.data;
    },
  });

  const markReadMut = useMutation({
    mutationFn: async (payload) => axios.post('notices/notifications/mark-read/', payload),
    onSuccess: () => {
      queryClient.invalidateQueries(['user-notifications']);
      queryClient.invalidateQueries(['user-notifications-unread-count']);
    },
  });

  const handleOpen = (notif) => {
    setSelected(notif);
    setOpen(true);
    if (!notif.is_read) {
      markReadMut.mutate({ id: notif.id });
    }
  };

  const handleClose = () => {
    setOpen(false);
    setSelected(null);
  };

  if (isLoading) return <Box display="flex" justifyContent="center"><CircularProgress /></Box>;
  if (isError) return <Typography color="error">Failed to load notifications.</Typography>;

  const notifications = data?.results || [];

  return (
    <Box>
      <Box display="flex" alignItems="center" mb={2}>
        <NotificationsIcon sx={{ fontSize: 32, mr: 1, color: 'primary.main' }} />
        <Typography variant="h5">Notifications</Typography>
      </Box>

      {notifications.length === 0 ? (
        <Typography color="text.secondary">No notifications</Typography>
      ) : (
        <List>
          {notifications.map((n) => (
            <React.Fragment key={n.id}>
              <ListItem button onClick={() => handleOpen(n)} secondaryAction={
                !n.is_read && (
                  <IconButton onClick={(e) => { e.stopPropagation(); markReadMut.mutate({ id: n.id }); }} edge="end" aria-label="mark-read">
                    <DoneIcon />
                  </IconButton>
                )
              }>
                <ListItemText
                  primary={
                    <Box display="flex" gap={1} alignItems="center">
                      <Typography variant="subtitle1">{n.title}</Typography>
                      <Chip label={n.is_read ? 'Read' : 'Unread'} size="small" color={n.is_read ? 'default' : 'primary'} />
                    </Box>
                  }
                  secondary={<Typography variant="body2" color="text.secondary">{new Date(n.created_at).toLocaleString()} — {n.content}</Typography>}
                />
              </ListItem>
              <Divider component="li" />
            </React.Fragment>
          ))}
        </List>
      )}

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        {selected && (
          <>
            <DialogTitle>{selected.title}</DialogTitle>
            <DialogContent>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>{new Date(selected.created_at).toLocaleString()}</Typography>
              <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>{selected.content}</Typography>
            </DialogContent>
            <DialogActions>
              <Button onClick={handleClose}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
};

export default NotificationsList;
