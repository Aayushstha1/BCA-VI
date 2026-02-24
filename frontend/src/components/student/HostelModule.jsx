import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Divider,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  TextField,
  Typography,
  Alert,
  CircularProgress,
} from '@mui/material';
import {
  Apartment,
  Build,
  Dashboard as DashboardIcon,
  Hotel,
  NotificationsNone,
  Payments,
  Person,
  Search,
  TrendingUp,
  School,
} from '@mui/icons-material';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import axios from 'axios';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

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
      <Avatar sx={{ bgcolor: color, width: 42, height: 42 }}>{icon}</Avatar>
    </Box>
  </Paper>
);

const HostelSectionHeader = ({ title, action }) => (
  <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
    <Typography variant="h6">{title}</Typography>
    {action}
  </Box>
);

const formatRoomType = (type) => (type ? `${type.charAt(0).toUpperCase()}${type.slice(1)}` : '—');
const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return '—';
  const numeric = Number(value);
  if (Number.isNaN(numeric)) return String(value);
  return numeric.toLocaleString();
};

const statusPalette = {
  occupied: { label: 'Occupied', bg: '#00c48c', text: '#ffffff' },
  partial: { label: 'Partial', bg: '#f7b500', text: '#ffffff' },
  vacant: { label: 'Vacant', bg: '#e9edf4', text: '#1f2a37' },
  maintenance: { label: 'Maintenance', bg: '#ff6b6b', text: '#ffffff' },
};

const getRoomStatus = (room) => {
  if (room?.is_active === false) return 'maintenance';
  const capacity = Number(room?.capacity || 0);
  const occupancy = Number(room?.current_occupancy || 0);
  if (capacity <= 0) return 'vacant';
  if (occupancy >= capacity) return 'occupied';
  if (occupancy === 0) return 'vacant';
  return 'partial';
};

const getFloorKey = (room) => {
  const number = String(room?.room_number || '');
  const match = number.match(/\d+/);
  if (!match) return 'other';
  const digits = match[0];
  if (digits.length >= 3) {
    return digits.slice(0, digits.length - 2);
  }
  return digits.slice(0, 1);
};

const formatOrdinal = (value) => {
  const num = Number(value);
  if (!Number.isFinite(num)) return 'Other';
  const mod100 = num % 100;
  if (mod100 >= 11 && mod100 <= 13) return `${num}th`;
  switch (num % 10) {
    case 1:
      return `${num}st`;
    case 2:
      return `${num}nd`;
    case 3:
      return `${num}rd`;
    default:
      return `${num}th`;
  }
};

const formatFloorLabel = (floorKey) => {
  if (floorKey === 'other') return 'Other';
  return `${formatOrdinal(floorKey)} Floor`;
};

const HostelModule = ({ initialTab = 'dashboard', focusOnMount = false, subtitle = 'Student Dashboard' }) => {
  const queryClient = useQueryClient();
  const [hostelTab, setHostelTab] = useState(initialTab);
  const [floorFilter, setFloorFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const hostelSectionRef = useRef(null);

  useEffect(() => {
    setHostelTab(initialTab);
  }, [initialTab]);

  useEffect(() => {
    if (focusOnMount && hostelSectionRef.current) {
      hostelSectionRef.current.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  }, [focusOnMount]);

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

  const statusCounts = useMemo(() => {
    return roomsList.reduce(
      (acc, room) => {
        const status = getRoomStatus(room);
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      },
      { occupied: 0, vacant: 0, partial: 0, maintenance: 0 }
    );
  }, [roomsList]);

  const availableRoomsCount = useMemo(() => {
    return roomsList.filter((room) => {
      const status = getRoomStatus(room);
      return status === 'vacant' || status === 'partial';
    }).length;
  }, [roomsList]);

  const floorOptions = useMemo(() => {
    const map = new Map();
    roomsList.forEach((room) => {
      const key = getFloorKey(room);
      map.set(key, formatFloorLabel(key));
    });
    const entries = Array.from(map.entries()).sort((a, b) => {
      if (a[0] === 'other') return 1;
      if (b[0] === 'other') return -1;
      return Number(a[0]) - Number(b[0]);
    });
    return entries.map(([key, label]) => ({ key, label }));
  }, [roomsList]);

  const filteredRooms = useMemo(() => {
    return roomsList.filter((room) => {
      const matchesFloor = floorFilter === 'all' || getFloorKey(room) === floorFilter;
      const roomStatus = getRoomStatus(room);
      const matchesStatus =
        statusFilter === 'all' ||
        roomStatus === statusFilter ||
        (statusFilter === 'available' && (roomStatus === 'vacant' || roomStatus === 'partial'));
      return matchesFloor && matchesStatus;
    });
  }, [roomsList, floorFilter, statusFilter]);

  const roomsByFloor = useMemo(() => {
    const groups = new Map();
    filteredRooms.forEach((room) => {
      const key = getFloorKey(room);
      if (!groups.has(key)) {
        groups.set(key, []);
      }
      groups.get(key).push(room);
    });

    return Array.from(groups.entries())
      .sort((a, b) => {
        if (a[0] === 'other') return 1;
        if (b[0] === 'other') return -1;
        return Number(a[0]) - Number(b[0]);
      })
      .map(([key, rooms]) => ({
        key,
        label: formatFloorLabel(key),
        rooms: rooms.sort((ra, rb) => {
          const aNum = parseInt(String(ra.room_number).match(/\d+/)?.[0] || '0', 10);
          const bNum = parseInt(String(rb.room_number).match(/\d+/)?.[0] || '0', 10);
          if (aNum === bNum) return String(ra.room_number).localeCompare(String(rb.room_number));
          return aNum - bNum;
        }),
      }));
  }, [filteredRooms]);
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

  const occupiedRoomsCount = roomStats.fullRooms + roomStats.partialRooms;
  const myRoomSummary = myAllocation?.room_info || 'No room allocated';
  const myRoomStatus = myAllocation ? 'Allocated' : 'Not Booked';

  const renderRoomCard = (room, { colored = true } = {}) => {
    const capacity = Number(room.capacity || 0);
    const occupancy = Number(room.current_occupancy || 0);
    const availableBeds = room.available_beds ?? Math.max(0, capacity - occupancy);
    const status = getRoomStatus(room);
    const palette = statusPalette[status] || statusPalette.vacant;
    const isFull = status === 'occupied';
    const isBooked = bookedRoomId === room.id;
    const isBlocked = status === 'maintenance';
    const canBook = !myAllocation && !isFull && !isBlocked;
    const activeAllocations = Array.isArray(room.active_allocations) ? room.active_allocations : [];
    const occupantNames = activeAllocations
      .map((alloc) => alloc.student_name || alloc.student_id)
      .filter(Boolean);

    return (
      <Paper
        sx={{
          p: 1.5,
          borderRadius: 2,
          bgcolor: colored ? palette.bg : 'background.paper',
          color: colored ? palette.text : 'text.primary',
          height: '100%',
        }}
      >
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Typography variant="subtitle2">{room.room_number}</Typography>
          <Hotel fontSize="small" />
        </Box>
        <Typography variant="caption">{formatRoomType(room.room_type)}</Typography>
        <Typography variant="caption" display="block">
          {occupancy}/{capacity} Occupied
        </Typography>
        <Typography variant="caption" display="block">
          Available Beds: {availableBeds}
        </Typography>
        <Typography variant="caption" display="block">
          Fee: Rs {formatCurrency(room.monthly_rent)}
        </Typography>
        <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
          Students: {activeAllocations.length}
        </Typography>
        <Typography variant="caption" display="block">
          {occupantNames.length ? occupantNames.join(', ') : 'No students yet'}
        </Typography>
        <Button
          size="small"
          variant="contained"
          sx={{
            mt: 1,
            bgcolor: colored ? '#ffffff' : 'primary.main',
            color: colored ? '#1f2a37' : 'white',
            '&:hover': {
              bgcolor: colored ? '#f5f5f5' : 'primary.dark',
            },
          }}
          disabled={!canBook}
          onClick={() => {
            if (canBook) bookingMutation.mutate(room.id);
          }}
        >
          {isBooked ? 'Booked' : isFull ? 'Full' : 'Book Room'}
        </Button>
      </Paper>
    );
  };

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
        {activeRooms.map((room) => (
          <Grid item xs={12} sm={6} md={4} key={room.id}>
            {renderRoomCard(room, { colored })}
          </Grid>
        ))}
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

  const renderHostelRooms = () => {
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

    return (
      <Box>
        {bookingMutation.isError ? (
          <Alert severity="error" sx={{ mb: 2 }}>
            {bookingMutation.error?.response?.data?.detail ||
              bookingMutation.error?.response?.data?.room ||
              bookingMutation.error?.response?.data?.student ||
              'Failed to book room.'}
          </Alert>
        ) : null}

        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2} sx={{ mb: 2 }}>
          <Box display="flex" gap={1} alignItems="center">
            <Select size="small" value={floorFilter} onChange={(event) => setFloorFilter(event.target.value)}>
              <MenuItem value="all">All Floors</MenuItem>
              {floorOptions.map((floor) => (
                <MenuItem key={floor.key} value={floor.key}>
                  {floor.label}
                </MenuItem>
              ))}
            </Select>
            <Select size="small" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
              <MenuItem value="all">All Status</MenuItem>
              <MenuItem value="available">Available</MenuItem>
              <MenuItem value="occupied">Occupied</MenuItem>
              <MenuItem value="vacant">Vacant</MenuItem>
              <MenuItem value="partial">Partial</MenuItem>
              <MenuItem value="maintenance">Maintenance</MenuItem>
            </Select>
            <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
              Available Rooms: {availableRoomsCount}
            </Typography>
          </Box>
          <Button variant="contained" size="small" disabled={!!myAllocation}>
            {myAllocation ? 'Room Allocated' : 'Book Room'}
          </Button>
        </Box>

        {roomsByFloor.length === 0 ? (
          <Typography color="text.secondary">No rooms match the selected filters.</Typography>
        ) : (
          roomsByFloor.map((floor) => (
            <Paper key={floor.key} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
              <Typography variant="subtitle1" sx={{ mb: 1 }}>
                {floor.label}
              </Typography>
              <Grid container spacing={1}>
                {floor.rooms.map((room) => (
                  <Grid item xs={12} sm={6} md={3} key={room.id}>
                    {renderRoomCard(room, { colored: true })}
                  </Grid>
                ))}
              </Grid>
            </Paper>
          ))
        )}

        <Grid container spacing={2}>
          {['occupied', 'vacant', 'partial', 'maintenance'].map((status) => (
            <Grid item xs={12} sm={6} md={3} key={status}>
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <Box display="flex" alignItems="center" gap={1}>
                  <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: statusPalette[status].bg }} />
                  <Typography variant="body2" color="text.secondary">
                    {statusPalette[status].label}
                  </Typography>
                </Box>
                <Typography variant="h6">{statusCounts[status] || 0}</Typography>
              </Paper>
            </Grid>
          ))}
        </Grid>
      </Box>
    );
  };

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
    <Box ref={hostelSectionRef}>
      <Paper sx={{ p: 1.5, borderRadius: 2, mb: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ bgcolor: '#00b894' }}>
              <Apartment fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle1">Hostel Module</Typography>
              <Typography variant="caption" color="text.secondary">
                {subtitle}
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
    </Box>
  );
};

export default HostelModule;
