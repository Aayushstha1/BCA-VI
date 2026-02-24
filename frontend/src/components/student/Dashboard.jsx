import React, { useMemo, useState } from 'react';
import { Link as RouterLink } from 'react-router-dom';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  List,
  ListItem,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
  Link,
  CircularProgress,
  Alert,
} from '@mui/material';
import {
  Apartment,
  Assessment,
  Build,
  Campaign,
  Dashboard as DashboardIcon,
  Grade,
  Hotel,
  LibraryBooks,
  Note,
  NotificationsNone,
  Payments,
  Person,
  School,
  Search,
  TrendingUp,
  Wallet,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import CalendarWidget from '../CalendarWidget';
import { useAuth } from '../../contexts/AuthContext';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip as RechartsTooltip,
  ResponsiveContainer,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';

const StatCard = ({ icon, label, value, color, to }) => {
  return (
    <Paper
      elevation={2}
      component={to ? RouterLink : 'div'}
      to={to}
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        textDecoration: 'none',
        color: 'inherit',
        transition: 'transform 120ms ease',
        '&:hover': { transform: to ? 'translateY(-2px)' : 'none' }
      }}
    >
      <Box
        sx={{
          width: 48,
          height: 48,
          borderRadius: 2,
          bgcolor: `${color}.light`,
          color: `${color}.dark`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          mr: 2,
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="subtitle2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h6">{value}</Typography>
      </Box>
    </Paper>
  );
};

const HostelStatCard = ({ label, value, icon, color, helper }) => (
  <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
    <Box display="flex" alignItems="center" justifyContent="space-between">
      <Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" sx={{ mt: 0.5 }}>
          {value}
        </Typography>
        {helper ? (
          <Typography variant="caption" color="text.secondary">
            {helper}
          </Typography>
        ) : null}
      </Box>
      <Avatar sx={{ bgcolor: color, width: 42, height: 42 }}>
        {icon}
      </Avatar>
    </Box>
  </Paper>
);

const HostelSectionHeader = ({ title, action }) => (
  <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
    <Typography variant="h6">{title}</Typography>
    {action}
  </Box>
);


const StudentHome = () => {
  const { user } = useAuth();
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const queryClient = useQueryClient();
  const [hostelTab, setHostelTab] = useState('dashboard');

  const { data: studentProfile } = useQuery({
    queryKey: ['student-profile-self'],
    queryFn: async () => (await axios.get('/students/profile/')).data,
  });

  const { data: notices, isLoading } = useQuery({
    queryKey: ['notices'],
    queryFn: async () => {
      const response = await axios.get('notices/');
      return Array.isArray(response.data) ? response.data.slice(0, 5) : (response.data?.results || []).slice(0, 5);
    },
  });

  const { data: resultsData } = useQuery({
    queryKey: ['student-results'],
    queryFn: async () => (await axios.get('/results/')).data,
  });

  const { data: issuesData } = useQuery({
    queryKey: ['library-issues'],
    queryFn: async () => (await axios.get('/library/issues/')).data,
  });

  const { data: finesData } = useQuery({
    queryKey: ['library-fines'],
    queryFn: async () => (await axios.get('/library/fines/')).data,
  });

  const { data: notesData } = useQuery({
    queryKey: ['notes'],
    queryFn: async () => (await axios.get('/notes/')).data,
  });

  const {
    data: hostelRoomsResponse,
    isLoading: isRoomsLoading,
    error: roomsError,
  } = useQuery({
    queryKey: ['hostel-rooms'],
    queryFn: async () => (await axios.get('/hostel/rooms/')).data,
    refetchInterval: 10000,
    staleTime: 5000,
  });

  const {
    data: hostelAllocationsResponse,
    isLoading: isAllocationsLoading,
    error: allocationsError,
  } = useQuery({
    queryKey: ['hostel-allocations'],
    queryFn: async () => (await axios.get('/hostel/allocations/')).data,
    refetchInterval: 10000,
    staleTime: 5000,
  });

  const bookingMutation = useMutation({
    mutationFn: async (roomId) => (await axios.post('/hostel/allocations/', { room: roomId })).data,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hostel-rooms'] });
      queryClient.invalidateQueries({ queryKey: ['hostel-allocations'] });
    },
  });

  const {
    data: progressResponse,
    isLoading: isProgressLoading,
    error: progressError,
  } = useQuery({
    queryKey: ['attendance-progress', currentYear],
    queryFn: async () => {
      const response = await axios.get(`attendance/progress/yearly/?year=${currentYear}`);
      return response.data;
    },
  });

  const {
    data: monthlyResponse,
    isLoading: isMonthlyLoading,
    error: monthlyError,
  } = useQuery({
    queryKey: ['attendance-progress-monthly', currentYear, currentMonth],
    queryFn: async () => {
      const response = await axios.get(`attendance/progress/monthly/?year=${currentYear}&month=${currentMonth}`);
      return response.data;
    },
  });

  const yearlyProgressData = useMemo(() => {
    const base = monthLabels.map((label, index) => ({
      month: label,
      progress: 0,
      total_days: 0,
      present_days: 0,
      month_index: index + 1,
    }));

    if (!progressResponse?.data) return base;
    const byMonth = new Map(progressResponse.data.map((item) => [item.month, item]));
    return base.map((entry) => {
      const monthData = byMonth.get(entry.month_index);
      if (!monthData) return entry;
      return {
        ...entry,
        progress: Math.round(monthData.progress || 0),
        total_days: monthData.total_days || 0,
        present_days: monthData.present_days || 0,
      };
    });
  }, [progressResponse, monthLabels]);

  const averageProgress = useMemo(() => {
    if (!yearlyProgressData.length) return 0;
    const total = yearlyProgressData.reduce((sum, item) => sum + item.progress, 0);
    return Math.round(total / yearlyProgressData.length);
  }, [yearlyProgressData]);

  const monthlyPieData = useMemo(() => {
    if (!monthlyResponse) return [];
    const present = monthlyResponse.present_days || 0;
    const late = monthlyResponse.late_days || 0;
    const absent = monthlyResponse.absent_days || 0;
    const excused = monthlyResponse.excused_days || 0;
    const data = [
      { name: 'Present', value: present },
      { name: 'Late', value: late },
      { name: 'Absent', value: absent },
      { name: 'Excused', value: excused },
    ];
    return data.filter((d) => d.value > 0);
  }, [monthlyResponse]);

  const monthlyProgressPercent = Math.round(monthlyResponse?.progress || 0);
  const monthlyTotalDays = monthlyResponse?.total_days || 0;
  const monthLabel = monthLabels[currentMonth - 1];

  const placeholder = '\u2014';
  const studentId = studentProfile?.id;
  const studentClass = studentProfile?.current_class;
  const enrollmentStatus = studentProfile?.is_active ?? user?.is_active;
  const enrollmentValue = enrollmentStatus === undefined ? placeholder : (enrollmentStatus ? 'Active' : 'Inactive');
  const formatRoomType = (type) => (type ? `${type.charAt(0).toUpperCase()}${type.slice(1)}` : placeholder);

  const resultsList = useMemo(() => {
    if (Array.isArray(resultsData)) return resultsData;
    return resultsData?.results || [];
  }, [resultsData]);

  const cgpaValue = useMemo(() => {
    if (!resultsList.length) return null;
    const totals = resultsList.reduce((acc, result) => {
      const totalMarks = Number(result.total_marks);
      const obtained = Number(result.marks_obtained);
      if (!totalMarks || Number.isNaN(totalMarks) || Number.isNaN(obtained)) {
        return acc;
      }
      const percentage = (obtained / totalMarks) * 100;
      const cgpa = Math.max(0, Math.min(10, percentage / 10));
      return { sum: acc.sum + cgpa, count: acc.count + 1 };
    }, { sum: 0, count: 0 });
    if (totals.count === 0) return null;
    return (totals.sum / totals.count).toFixed(2);
  }, [resultsList]);

  const issuesList = useMemo(() => {
    if (Array.isArray(issuesData)) return issuesData;
    return issuesData?.results || [];
  }, [issuesData]);

  const studentIssues = useMemo(() => {
    if (!studentId) return [];
    return issuesList.filter((issue) => issue.student === studentId);
  }, [issuesList, studentId]);

  const activeIssues = useMemo(
    () => studentIssues.filter((issue) => issue.status !== 'returned'),
    [studentIssues],
  );

  const finesList = useMemo(() => {
    if (Array.isArray(finesData)) return finesData;
    return finesData?.results || [];
  }, [finesData]);

  const financeDue = useMemo(() => {
    if (!studentIssues.length) return 0;
    const issueIds = new Set(studentIssues.map((issue) => issue.id));
    const pendingFinesTotal = finesList
      .filter((fine) => issueIds.has(fine.book_issue) && (fine.payment_status === 'pending' || !fine.payment_status))
      .reduce((sum, fine) => sum + Number(fine.amount || 0), 0);

    if (pendingFinesTotal > 0) {
      return pendingFinesTotal;
    }

    return studentIssues.reduce((sum, issue) => sum + Number(issue.fine_amount || 0), 0);
  }, [finesList, studentIssues]);

  const notesList = useMemo(() => {
    if (Array.isArray(notesData)) return notesData;
    return notesData?.results || [];
  }, [notesData]);

  const roomsList = useMemo(() => {
    if (Array.isArray(hostelRoomsResponse)) return hostelRoomsResponse;
    return hostelRoomsResponse?.results || [];
  }, [hostelRoomsResponse]);

  const allocationsList = useMemo(() => {
    if (Array.isArray(hostelAllocationsResponse)) return hostelAllocationsResponse;
    return hostelAllocationsResponse?.results || [];
  }, [hostelAllocationsResponse]);

  const myAllocation = allocationsList[0];
  const bookedRoomId = myAllocation?.room;
  const activeRooms = useMemo(() => roomsList.filter((room) => room.is_active), [roomsList]);
  const roomStats = useMemo(() => {
    const totalRooms = activeRooms.length;
    const totalBeds = activeRooms.reduce((sum, room) => sum + Number(room.capacity || 0), 0);
    const occupiedBeds = activeRooms.reduce((sum, room) => sum + Number(room.current_occupancy || 0), 0);
    const availableBeds = Math.max(0, totalBeds - occupiedBeds);
    const fullRooms = activeRooms.filter((room) => {
      const cap = Number(room.capacity || 0);
      const occ = Number(room.current_occupancy || 0);
      return cap > 0 && occ >= cap;
    }).length;
    const vacantRooms = activeRooms.filter((room) => Number(room.current_occupancy || 0) === 0).length;
    const partialRooms = activeRooms.filter((room) => {
      const cap = Number(room.capacity || 0);
      const occ = Number(room.current_occupancy || 0);
      return cap > 0 && occ > 0 && occ < cap;
    }).length;
    const occupancyRate = totalBeds > 0 ? Math.round((occupiedBeds / totalBeds) * 100) : 0;

    return {
      totalRooms,
      totalBeds,
      occupiedBeds,
      availableBeds,
      fullRooms,
      vacantRooms,
      partialRooms,
      occupancyRate,
    };
  }, [activeRooms]);

  const occupancyRoomData = useMemo(
    () => [
      { name: 'Occupied', value: roomStats.fullRooms, color: '#00c48c' },
      { name: 'Partial', value: roomStats.partialRooms, color: '#f7b500' },
      { name: 'Vacant', value: roomStats.vacantRooms, color: '#e6e8ee' },
    ],
    [roomStats]
  );

  const hostelTabs = [
    { value: 'dashboard', label: 'Dashboard', icon: <DashboardIcon fontSize="small" /> },
    { value: 'rooms', label: 'Rooms', icon: <Hotel fontSize="small" /> },
    { value: 'fees', label: 'Fees', icon: <Payments fontSize="small" /> },
    { value: 'maintenance', label: 'Maintenance', icon: <Build fontSize="small" /> },
    { value: 'students', label: 'Students', icon: <Person fontSize="small" /> },
    { value: 'occupancy', label: 'Occupancy', icon: <TrendingUp fontSize="small" /> },
  ];

  const accessibleNotes = useMemo(() => {
    return notesList.filter((note) => {
      if (note.is_active === false) return false;
      if (note.visibility === 'public') return true;
      if (note.visibility === 'class_only' && studentClass) {
        return note.target_class === studentClass;
      }
      if (note.visibility === 'private' && user?.id) {
        return note.uploaded_by === user.id;
      }
      return false;
    });
  }, [notesList, studentClass, user?.id]);

  const cards = [
    {
      icon: <Assessment />,
      label: 'Attendance (This Month)',
      value: monthlyResponse ? `${monthlyProgressPercent}%` : placeholder,
      color: 'primary',
      to: '/student/attendance',
    },
    { icon: <Grade />, label: 'CGPA', value: cgpaValue || placeholder, color: 'success', to: '/student/results' },
    { icon: <LibraryBooks />, label: 'Books Issued', value: studentId ? activeIssues.length : placeholder, color: 'secondary', to: '/student/library' },
    { icon: <Wallet />, label: 'Finance Dues', value: studentId ? financeDue.toFixed(2) : placeholder, color: 'warning', to: '/student/finance' },
    { icon: <School />, label: 'Enrollment Status', value: enrollmentValue, color: 'info', to: '/student/admission' },
    { icon: <Note />, label: 'New Notes', value: accessibleNotes.length, color: 'error', to: '/student/notes' },
  ];

  const occupiedRoomsCount = roomStats.fullRooms + roomStats.partialRooms;
  const myRoomSummary = myAllocation?.room_info || 'No room allocated';
  const myRoomStatus = myAllocation ? 'Allocated' : 'Not Booked';

  const renderRoomsGrid = ({ colored = false } = {}) => {
    if (roomsError) {
      return <Typography color="error">Failed to load rooms.</Typography>;
    }
    if (isRoomsLoading) {
      return (
        <Box display="flex" justifyContent="center" p={2}>
          <CircularProgress size={30} />
        </Box>
      );
    }
    if (activeRooms.length === 0) {
      return <Typography color="text.secondary">No rooms available right now.</Typography>;
    }

    return (
      <Grid container spacing={2}>
        {activeRooms.map((room) => {
          const capacity = Number(room.capacity || 0);
          const occupancy = Number(room.current_occupancy || 0);
          const availableBeds = room.available_beds ?? Math.max(0, capacity - occupancy);
          const isFull = availableBeds <= 0;
          const status = isFull ? 'occupied' : occupancy === 0 ? 'vacant' : 'partial';
          const statusColor = status === 'occupied' ? '#00c48c' : status === 'partial' ? '#f7b500' : '#e9edf4';
          const statusTextColor = status === 'vacant' ? 'text.primary' : 'white';
          const isBooked = bookedRoomId === room.id;

          return (
            <Grid item xs={12} sm={6} md={4} key={room.id}>
              <Paper
                sx={{
                  p: 2,
                  height: '100%',
                  bgcolor: colored ? statusColor : 'background.paper',
                  color: colored ? statusTextColor : 'text.primary',
                }}
              >
                <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 0.5 }}>
                  <Typography variant="subtitle1">Room {room.room_number}</Typography>
                  <Chip
                    size="small"
                    label={isFull ? 'Full' : `${availableBeds} beds`}
                    color={isFull ? 'error' : 'success'}
                  />
                </Box>
                <Typography variant="body2" color={colored ? 'inherit' : 'text.secondary'}>
                  {room.hostel_name}
                </Typography>
                <Typography variant="body2">Type: {formatRoomType(room.room_type)}</Typography>
                <Typography variant="body2">
                  Occupancy: {occupancy}/{capacity}
                </Typography>
                <Typography variant="body2">Rent: Rs {room.monthly_rent}</Typography>
                <Button
                  variant={colored ? 'contained' : 'outlined'}
                  size="small"
                  sx={{ mt: 1 }}
                  disabled={!!myAllocation || isFull || bookingMutation.isLoading}
                  onClick={() => bookingMutation.mutate(room.id)}
                >
                  {isBooked ? 'Booked' : 'Book Room'}
                </Button>
              </Paper>
            </Grid>
          );
        })}
      </Grid>
    );
  };

  const renderHostelDashboard = () => (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <HostelStatCard label="Total Rooms" value={roomStats.totalRooms || 0} icon={<Apartment fontSize="small" />} color="#00c48c" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <HostelStatCard label="Occupied Rooms" value={occupiedRoomsCount || 0} icon={<Hotel fontSize="small" />} color="#ff6b6b" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <HostelStatCard label="Available Beds" value={roomStats.availableBeds || 0} icon={<TrendingUp fontSize="small" />} color="#f7b500" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <HostelStatCard label="My Room" value={myRoomStatus} helper={myRoomSummary} icon={<School fontSize="small" />} color="#00b894" />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <HostelSectionHeader
              title="Real-Time Occupancy"
              action={
                <Select size="small" value="this-month">
                  <MenuItem value="this-month">This Month</MenuItem>
                </Select>
              }
            />
            <Divider sx={{ mb: 2 }} />
            {activeRooms.length === 0 ? (
              <Typography color="text.secondary">No occupancy data yet.</Typography>
            ) : (
              <Box sx={{ height: 260, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={occupancyRoomData} dataKey="value" innerRadius={70} outerRadius={95} paddingAngle={3}>
                      {occupancyRoomData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="h5">{roomStats.totalRooms || 0}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Rooms
                  </Typography>
                </Box>
              </Box>
            )}
            <Grid container spacing={1} sx={{ mt: 1 }}>
              {occupancyRoomData.map((item) => (
                <Grid item xs={12} sm={4} key={item.name}>
                  <Paper sx={{ p: 1, borderRadius: 2, bgcolor: '#f7f8fc' }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color }} />
                      <Typography variant="body2" color="text.secondary">
                        {item.name}
                      </Typography>
                    </Box>
                    <Typography variant="subtitle1" sx={{ mt: 0.5 }}>
                      {item.value}
                    </Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, borderRadius: 2, mb: 2 }}>
            <HostelSectionHeader title="My Allocation" />
            <Divider sx={{ mb: 1 }} />
            {allocationsError ? (
              <Typography color="error">Failed to load allocation.</Typography>
            ) : isAllocationsLoading ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={24} />
              </Box>
            ) : myAllocation ? (
              <Box>
                <Typography variant="subtitle1">{myAllocation.room_info}</Typography>
                <Typography variant="body2" color="text.secondary">
                  Allocated on: {myAllocation.allocated_date}
                </Typography>
                <Typography variant="body2">Monthly rent: Rs {myAllocation.monthly_rent}</Typography>
              </Box>
            ) : (
              <Typography color="text.secondary">No room allocated yet.</Typography>
            )}
          </Paper>
          <Paper sx={{ p: 2, borderRadius: 2 }}>
            <HostelSectionHeader title="Quick Actions" />
            <Divider sx={{ mb: 1 }} />
            <Button fullWidth variant="contained" size="small" sx={{ mb: 1 }} onClick={() => setHostelTab('rooms')}>
              Browse Rooms
            </Button>
            <Button fullWidth variant="outlined" size="small" onClick={() => setHostelTab('occupancy')}>
              View Occupancy
            </Button>
          </Paper>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, borderRadius: 2, mt: 2 }}>
        <HostelSectionHeader title="Available Rooms" />
        <Divider sx={{ mb: 2 }} />
        {bookingMutation.isError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {bookingMutation.error?.response?.data?.detail ||
              bookingMutation.error?.response?.data?.room ||
              bookingMutation.error?.response?.data?.student ||
              'Failed to book room.'}
          </Alert>
        ) : null}
        {renderRoomsGrid()}
      </Paper>
    </Box>
  );

  const renderHostelRooms = () => (
    <Box>
      {bookingMutation.isError ? (
        <Alert severity="error" sx={{ mb: 2 }}>
          {bookingMutation.error?.response?.data?.detail ||
            bookingMutation.error?.response?.data?.room ||
            bookingMutation.error?.response?.data?.student ||
            'Failed to book room.'}
        </Alert>
      ) : null}
      {renderRoomsGrid({ colored: true })}
    </Box>
  );

  const renderHostelOccupancy = () => (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <HostelStatCard label="Total Rooms" value={roomStats.totalRooms || 0} icon={<Apartment fontSize="small" />} color="#00c48c" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <HostelStatCard label="Occupied Rooms" value={occupiedRoomsCount || 0} icon={<Hotel fontSize="small" />} color="#ff6b6b" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <HostelStatCard label="Vacant Rooms" value={roomStats.vacantRooms || 0} icon={<Apartment fontSize="small" />} color="#e6e8ee" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <HostelStatCard label="Occupancy Rate" value={`${roomStats.occupancyRate || 0}%`} icon={<TrendingUp fontSize="small" />} color="#00b894" />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <HostelSectionHeader title="Occupancy Distribution" />
            <Divider sx={{ mb: 2 }} />
            {activeRooms.length === 0 ? (
              <Typography color="text.secondary">No occupancy data yet.</Typography>
            ) : (
              <Box sx={{ height: 260, position: 'relative' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie data={occupancyRoomData} dataKey="value" innerRadius={70} outerRadius={95} paddingAngle={3}>
                      {occupancyRoomData.map((entry) => (
                        <Cell key={entry.name} fill={entry.color} />
                      ))}
                    </Pie>
                  </PieChart>
                </ResponsiveContainer>
                <Box
                  sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                  }}
                >
                  <Typography variant="h5">{roomStats.totalRooms || 0}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Total Rooms
                  </Typography>
                </Box>
              </Box>
            )}
            <Grid container spacing={1} sx={{ mt: 1 }}>
              {occupancyRoomData.map((item) => (
                <Grid item xs={12} sm={6} key={item.name}>
                  <Paper sx={{ p: 1, borderRadius: 2, bgcolor: '#f7f8fc' }}>
                    <Box display="flex" alignItems="center" gap={1}>
                      <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: item.color }} />
                      <Typography variant="body2" color="text.secondary">
                        {item.name}
                      </Typography>
                    </Box>
                    <Typography variant="subtitle1">{item.value} rooms</Typography>
                  </Paper>
                </Grid>
              ))}
            </Grid>
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <HostelSectionHeader title="Capacity Overview" />
            <Divider sx={{ mb: 2 }} />
            <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#00b894', color: 'white' }}>
              <Typography variant="body2">Total Capacity</Typography>
              <Typography variant="h4">{roomStats.totalBeds || 0}</Typography>
              <Typography variant="caption">Beds</Typography>
            </Paper>
            <Grid container spacing={1} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: '#e7fff6' }}>
                  <Typography variant="caption" color="text.secondary">
                    Currently Occupied
                  </Typography>
                  <Typography variant="h6">{roomStats.occupiedBeds || 0}</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f7f8fc' }}>
                  <Typography variant="caption" color="text.secondary">
                    Available Beds
                  </Typography>
                  <Typography variant="h6">{roomStats.availableBeds || 0}</Typography>
                </Paper>
              </Grid>
            </Grid>
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Occupancy Progress
              </Typography>
              <Box sx={{ mt: 0.5, height: 8, borderRadius: 4, bgcolor: '#e9edf4' }}>
                <Box sx={{ width: `${roomStats.occupancyRate || 0}%`, height: '100%', bgcolor: '#00b894', borderRadius: 4 }} />
              </Box>
              <Typography variant="caption" color="text.secondary">
                {roomStats.occupancyRate || 0}%
              </Typography>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );

  const renderHostelUnavailable = (label) => (
    <Alert severity="info">
      {label} data is managed by administration and is not available for student accounts yet.
    </Alert>
  );

  return (
    <Box>
      <Typography variant="h4" sx={{ mb: 3 }}>
        My Overview
      </Typography>
      <Grid container spacing={2}>
        {cards.map((card) => (
          <Grid item xs={12} sm={6} md={4} key={card.label}>
            <StatCard {...card} />
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Box>
                <Typography variant="h6">Yearly Progress ({currentYear})</Typography>
                <Typography variant="body2" color="text.secondary">
                  Monthly progress trend for the academic year
                </Typography>
              </Box>
              <Typography variant="h6" color="primary">
                Avg: {averageProgress}%
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {progressError ? (
              <Typography color="error" sx={{ py: 2 }}>
                Failed to load yearly progress.
              </Typography>
            ) : isProgressLoading ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={30} />
              </Box>
            ) : (
              <Box sx={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={yearlyProgressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis domain={[0, 100]} />
                    <RechartsTooltip
                      formatter={(value) => [`${value}%`, 'Progress']}
                      labelFormatter={(label) => `Month: ${label}`}
                    />
                    <Line type="monotone" dataKey="progress" stroke="#1976d2" strokeWidth={3} dot={{ r: 3 }} />
                  </LineChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={4}>
          <Paper sx={{ p: 2, height: '100%' }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Box>
                <Typography variant="h6">Monthly Progress</Typography>
                <Typography variant="body2" color="text.secondary">
                  {monthLabel} {currentYear} â€¢ {monthlyTotalDays} days
                </Typography>
              </Box>
              <Typography variant="h6" color="primary">
                {monthlyProgressPercent}%
              </Typography>
            </Box>
            <Divider sx={{ mb: 2 }} />
            {monthlyError ? (
              <Typography color="error" sx={{ py: 2 }}>
                Failed to load monthly progress.
              </Typography>
            ) : isMonthlyLoading ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={30} />
              </Box>
            ) : monthlyPieData.length === 0 ? (
              <Typography color="text.secondary" sx={{ py: 2 }}>
                No attendance data for this month.
              </Typography>
            ) : (
              <Box sx={{ width: '100%', height: 240 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={monthlyPieData}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={45}
                      outerRadius={80}
                      paddingAngle={2}
                    >
                      {monthlyPieData.map((entry, index) => {
                        const colors = ['#2e7d32', '#ffb300', '#d32f2f', '#6d4c41'];
                        return <Cell key={`cell-${entry.name}`} fill={colors[index % colors.length]} />;
                      })}
                    </Pie>
                    <Legend verticalAlign="bottom" height={36} />
                    <RechartsTooltip formatter={(value, name) => [`${value}`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </Box>
            )}
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
              <Typography variant="h6">Recent Notices</Typography>
              <Button size="small" component={RouterLink} to="/student/notes">View all</Button>
            </Box>
            <Divider sx={{ mb: 1 }} />
            {isLoading ? (
              <Box display="flex" justifyContent="center" p={2}>
                <CircularProgress size={30} />
              </Box>
            ) : (notices && notices.length > 0) ? (
              <List>
                {notices.map((notice) => (
                  <ListItem key={notice.id}>
                    <ListItemText 
                      primary={notice.title}
                      secondary={`${notice.priority} • ${new Date(notice.published_at).toLocaleDateString()}`}
                    />
                  </ListItem>
                ))}
              </List>
            ) : (
              <List>
                <ListItem>
                  <ListItemText primary="No notices yet." secondary="Check back soon." />
                </ListItem>
              </List>
            )}
          </Paper>
        </Grid>
        <Grid item xs={12} md={5}>
          <Paper sx={{ p: 2 }}>
            <Box display="flex" alignItems="center" gap={1} sx={{ mb: 1 }}>
              <Campaign color="primary" />
              <Typography variant="h6">Quick Links</Typography>
            </Box>
            <Divider sx={{ mb: 1 }} />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 1 }}>
              <Link component={RouterLink} to="/student/report-card" underline="hover">Report Card</Link>
              <Link component={RouterLink} to="/student/attendance" underline="hover">Attendance</Link>
              <Link component={RouterLink} to="/student/library" underline="hover">Library</Link>
              <Link component={RouterLink} to="/student/admission" underline="hover">Admission</Link>
              <Link component={RouterLink} to="/student/results" underline="hover">Results</Link>
              <Link component={RouterLink} to="/student/notes" underline="hover">Notes</Link>
            </Box>
          </Paper>
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12}>
          <Paper sx={{ p: 1.5, borderRadius: 2, mb: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar sx={{ bgcolor: '#00b894' }}>
                  <Apartment fontSize="small" />
                </Avatar>
                <Box>
                  <Typography variant="subtitle1">Hostel Module</Typography>
                  <Typography variant="caption" color="text.secondary">
                    Student Dashboard
                  </Typography>
                </Box>
              </Box>

              <Tabs
                value={hostelTab}
                onChange={(_, value) => setHostelTab(value)}
                variant="scrollable"
                scrollButtons="auto"
                sx={{
                  minHeight: 40,
                  '& .MuiTab-root': {
                    minHeight: 40,
                    textTransform: 'none',
                    fontSize: 13,
                  },
                }}
              >
                {hostelTabs.map((tab) => (
                  <Tab key={tab.value} value={tab.value} icon={tab.icon} iconPosition="start" label={tab.label} />
                ))}
              </Tabs>

              <Box display="flex" alignItems="center" gap={1}>
                <TextField
                  size="small"
                  placeholder="Search..."
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search fontSize="small" sx={{ color: 'text.secondary' }} />
                      </InputAdornment>
                    ),
                  }}
                  sx={{ width: 180 }}
                />
                <IconButton>
                  <Badge color="error" variant="dot">
                    <NotificationsNone />
                  </Badge>
                </IconButton>
              </Box>
            </Box>
          </Paper>

          {hostelTab === 'dashboard' && renderHostelDashboard()}
          {hostelTab === 'rooms' && renderHostelRooms()}
          {hostelTab === 'fees' && renderHostelUnavailable('Fees')}
          {hostelTab === 'maintenance' && renderHostelUnavailable('Maintenance')}
          {hostelTab === 'students' && renderHostelUnavailable('Students')}
          {hostelTab === 'occupancy' && renderHostelOccupancy()}
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12}>
          <CalendarWidget title="Events Calendar" />
        </Grid>
      </Grid>
    </Box>
  );
};

export default StudentHome;


