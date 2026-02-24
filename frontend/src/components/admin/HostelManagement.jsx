import React, { useMemo, useState } from 'react';
import {
  Avatar,
  Badge,
  Box,
  Button,
  Chip,
  Divider,
  Grid,
  IconButton,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  MenuItem,
  Paper,
  Select,
  Tab,
  Tabs,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Typography,
} from '@mui/material';
import {
  Add as AddIcon,
  Apartment as ApartmentIcon,
  AssignmentTurnedIn as AssignmentTurnedInIcon,
  Build as BuildIcon,
  Dashboard as DashboardIcon,
  Download as DownloadIcon,
  Groups as GroupsIcon,
  Hotel as HotelIcon,
  NotificationsNone as NotificationsNoneIcon,
  Payments as PaymentsIcon,
  Person as PersonIcon,
  Search as SearchIcon,
  TrendingUp as TrendingUpIcon,
  WarningAmber as WarningAmberIcon,
  ChevronRight as ChevronRightIcon,
} from '@mui/icons-material';
import { PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';

const statusTone = {
  paid: { label: 'Paid', color: 'success' },
  pending: { label: 'Pending', color: 'warning' },
  overdue: { label: 'Overdue', color: 'error' },
  in_progress: { label: 'In Progress', color: 'info' },
  completed: { label: 'Completed', color: 'success' },
  urgent: { label: 'Urgent', color: 'error' },
};

const StatTile = ({ label, value, trend, icon, color }) => (
  <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
    <Box display="flex" alignItems="center" justifyContent="space-between">
      <Box>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h5" sx={{ mt: 0.5 }}>
          {value}
        </Typography>
        {trend ? (
          <Typography variant="caption" color="success.main">
            {trend}
          </Typography>
        ) : null}
      </Box>
      <Box
        sx={{
          width: 42,
          height: 42,
          borderRadius: 2,
          bgcolor: color,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {icon}
      </Box>
    </Box>
  </Paper>
);

const SectionHeader = ({ title, action }) => (
  <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 1 }}>
    <Typography variant="h6">{title}</Typography>
    {action}
  </Box>
);

const StatusChip = ({ status }) => {
  const config = statusTone[status] || { label: status, color: 'default' };
  return <Chip size="small" label={config.label} color={config.color} />;
};

const HostelManagement = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  const roomSummary = useMemo(
    () => ({
      total: 28,
      occupied: 10,
      vacant: 7,
      maintenance: 3,
      partial: 8,
    }),
    []
  );

  const occupancyBreakdown = [
    { name: 'Occupied', value: roomSummary.occupied, color: '#00c48c' },
    { name: 'Vacant', value: roomSummary.vacant, color: '#e6e8ee' },
    { name: 'Maintenance', value: roomSummary.maintenance, color: '#ff6b6b' },
    { name: 'Partial', value: roomSummary.partial, color: '#f7b500' },
  ];

  const roomFloors = [
    {
      title: '1st Floor',
      rooms: [
        { number: '101', type: 'Double', occupancy: '2/2', status: 'occupied' },
        { number: '102', type: 'Double', occupancy: '1/2', status: 'partial' },
        { number: '103', type: 'Triple', occupancy: '0/3', status: 'vacant' },
        { number: '104', type: 'Double', occupancy: '0/2', status: 'maintenance' },
        { number: '105', type: 'Double', occupancy: '2/2', status: 'occupied' },
        { number: '106', type: 'Triple', occupancy: '3/3', status: 'occupied' },
        { number: '107', type: 'Double', occupancy: '0/2', status: 'vacant' },
        { number: '108', type: 'Double', occupancy: '1/2', status: 'partial' },
      ],
    },
    {
      title: '2nd Floor',
      rooms: [
        { number: '201', type: 'Double', occupancy: '2/2', status: 'occupied' },
        { number: '202', type: 'Double', occupancy: '0/2', status: 'vacant' },
        { number: '203', type: 'Triple', occupancy: '2/3', status: 'partial' },
        { number: '204', type: 'Double', occupancy: '2/2', status: 'occupied' },
        { number: '205', type: 'Double', occupancy: '1/2', status: 'partial' },
        { number: '206', type: 'Triple', occupancy: '0/3', status: 'vacant' },
        { number: '207', type: 'Double', occupancy: '2/2', status: 'occupied' },
        { number: '208', type: 'Double', occupancy: '0/2', status: 'maintenance' },
        { number: '209', type: 'Double', occupancy: '2/2', status: 'occupied' },
        { number: '210', type: 'Double', occupancy: '1/2', status: 'partial' },
        { number: '215', type: 'Double', occupancy: '1/2', status: 'partial' },
      ],
    },
    {
      title: '3rd Floor',
      rooms: [
        { number: '301', type: 'Double', occupancy: '0/2', status: 'vacant' },
        { number: '302', type: 'Double', occupancy: '2/2', status: 'occupied' },
        { number: '303', type: 'Triple', occupancy: '3/3', status: 'occupied' },
        { number: '304', type: 'Double', occupancy: '1/2', status: 'partial' },
        { number: '305', type: 'Double', occupancy: '0/2', status: 'vacant' },
        { number: '306', type: 'Triple', occupancy: '0/3', status: 'maintenance' },
        { number: '307', type: 'Double', occupancy: '2/2', status: 'occupied' },
        { number: '308', type: 'Double', occupancy: '0/2', status: 'vacant' },
        { number: '312', type: 'Double', occupancy: '1/2', status: 'partial' },
      ],
    },
  ];

  const feeRecords = [
    {
      id: 'FE001',
      name: 'Rajesh Kumar',
      room: '101',
      amount: '15,000',
      dueDate: '2024-02-01',
      status: 'paid',
      method: 'Online Transfer',
    },
    {
      id: 'FE002',
      name: 'Priya Sharma',
      room: '205',
      amount: '15,000',
      dueDate: '2024-02-01',
      status: 'pending',
      method: '-',
    },
    {
      id: 'FE003',
      name: 'Amit Patel',
      room: '312',
      amount: '15,000',
      dueDate: '2024-02-01',
      status: 'paid',
      method: 'Cash',
    },
    {
      id: 'FE004',
      name: 'Sneha Reddy',
      room: '108',
      amount: '15,000',
      dueDate: '2024-02-01',
      status: 'overdue',
      method: '-',
    },
    {
      id: 'FE005',
      name: 'Vikram Singh',
      room: '215',
      amount: '15,000',
      dueDate: '2024-02-01',
      status: 'paid',
      method: 'Online Transfer',
    },
    {
      id: 'FE006',
      name: 'Ananya Iyer',
      room: '304',
      amount: '15,000',
      dueDate: '2024-02-01',
      status: 'pending',
      method: '-',
    },
    {
      id: 'FE007',
      name: 'Rohan Mehta',
      room: '102',
      amount: '15,000',
      dueDate: '2024-02-01',
      status: 'paid',
      method: 'Debit Card',
    },
    {
      id: 'FE008',
      name: 'Kavya Nair',
      room: '210',
      amount: '15,000',
      dueDate: '2024-02-01',
      status: 'paid',
      method: 'Online Transfer',
    },
  ];

  const maintenanceRequests = [
    {
      id: 'MR001',
      room: '104',
      issue: 'Air conditioning not working properly, making loud noise',
      priority: 'urgent',
      status: 'pending',
      by: 'Rajesh Kumar',
      date: '2024-02-15',
    },
    {
      id: 'MR002',
      room: '208',
      issue: 'Leaking faucet in bathroom',
      priority: 'pending',
      status: 'in_progress',
      by: 'Priya Sharma',
      date: '2024-02-14',
    },
    {
      id: 'MR003',
      room: '306',
      issue: 'Broken window glass needs replacement',
      priority: 'urgent',
      status: 'pending',
      by: 'Amit Patel',
      date: '2024-02-16',
    },
    {
      id: 'MR004',
      room: '215',
      issue: 'Door lock not functioning',
      priority: 'urgent',
      status: 'pending',
      by: 'Vikram Singh',
      date: '2024-02-15',
    },
    {
      id: 'MR005',
      room: '102',
      issue: 'Light fixture flickering',
      priority: 'pending',
      status: 'completed',
      by: 'Rohan Mehta',
      date: '2024-02-10',
    },
    {
      id: 'MR006',
      room: '304',
      issue: 'Wardrobe door hinge broken',
      priority: 'pending',
      status: 'in_progress',
      by: 'Ananya Iyer',
      date: '2024-02-13',
    },
  ];

  const studentCards = [
    {
      id: 'STU001',
      name: 'Rajesh Kumar',
      course: 'Computer Science',
      year: '3rd Year',
      room: 'Room 101 - 1st Floor',
      email: 'rajesh.kumar@college.edu',
      fee: 'paid',
    },
    {
      id: 'STU002',
      name: 'Priya Sharma',
      course: 'Electronics Engineering',
      year: '2nd Year',
      room: 'Room 205 - 2nd Floor',
      email: 'priya.sharma@college.edu',
      fee: 'pending',
    },
    {
      id: 'STU003',
      name: 'Amit Patel',
      course: 'Mechanical Engineering',
      year: '4th Year',
      room: 'Room 312 - 3rd Floor',
      email: 'amit.patel@college.edu',
      fee: 'paid',
    },
    {
      id: 'STU004',
      name: 'Sneha Reddy',
      course: 'Civil Engineering',
      year: '2nd Year',
      room: 'Room 108 - 1st Floor',
      email: 'sneha.reddy@college.edu',
      fee: 'overdue',
    },
    {
      id: 'STU005',
      name: 'Vikram Singh',
      course: 'Information Technology',
      year: '3rd Year',
      room: 'Room 215 - 2nd Floor',
      email: 'vikram.singh@college.edu',
      fee: 'paid',
    },
    {
      id: 'STU006',
      name: 'Ananya Iyer',
      course: 'Biotechnology',
      year: '1st Year',
      room: 'Room 304 - 3rd Floor',
      email: 'ananya.iyer@college.edu',
      fee: 'pending',
    },
    {
      id: 'STU007',
      name: 'Rohan Mehta',
      course: 'Computer Science',
      year: '4th Year',
      room: 'Room 102 - 1st Floor',
      email: 'rohan.mehta@college.edu',
      fee: 'paid',
    },
    {
      id: 'STU008',
      name: 'Kavya Nair',
      course: 'Chemical Engineering',
      year: '2nd Year',
      room: 'Room 210 - 2nd Floor',
      email: 'kavya.nair@college.edu',
      fee: 'paid',
    },
  ];

  const quickActions = [
    {
      title: 'Allocate Room',
      subtitle: 'Assign students to rooms',
      icon: <HotelIcon fontSize="small" />,
      color: '#dff7f0',
    },
    {
      title: 'Process Fee Payment',
      subtitle: 'Record fee transactions',
      icon: <PaymentsIcon fontSize="small" />,
      color: '#e7f3ff',
    },
    {
      title: 'Maintenance Queue',
      subtitle: 'Check pending requests',
      icon: <BuildIcon fontSize="small" />,
      color: '#ffecec',
    },
  ];

  const recentRequests = [
    {
      title: 'Room 104 - Air conditioning not working properly',
      priority: 'High',
      status: 'Pending',
    },
    { title: 'Room 208 - Leaking faucet in bathroom', priority: 'Medium', status: 'In Progress' },
    { title: 'Room 306 - Broken window glass needs replacement', priority: 'High', status: 'Pending' },
  ];

  const renderDashboard = () => (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile label="Total Rooms" value="28" trend="+10%" icon={<ApartmentIcon />} color="#00c48c" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile label="Occupied Rooms" value="10" trend="+3%" icon={<HotelIcon />} color="#ff6b6b" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile label="Pending Requests" value="3" trend="Urgent" icon={<WarningAmberIcon />} color="#f7b500" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile label="Revenue This Month" value="Rs 75K" trend="+12%" icon={<PaymentsIcon />} color="#00b894" />
        </Grid>
      </Grid>

      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={8}>
          <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <SectionHeader
              title="Real-Time Occupancy"
              action={
                <Select size="small" value="this-month">
                  <MenuItem value="this-month">This Month</MenuItem>
                  <MenuItem value="last-month">Last Month</MenuItem>
                </Select>
              }
            />
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ height: 260, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={occupancyBreakdown} dataKey="value" innerRadius={70} outerRadius={95} paddingAngle={3}>
                    {occupancyBreakdown.map((entry) => (
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
                <Typography variant="h5">28</Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Rooms
                </Typography>
              </Box>
            </Box>
            <Grid container spacing={1} sx={{ mt: 1 }}>
              {occupancyBreakdown.map((item) => (
                <Grid item xs={12} sm={6} md={3} key={item.name}>
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
          <Grid container spacing={2}>
            <Grid item xs={12}>
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <SectionHeader title="Quick Actions" />
                <Divider sx={{ mb: 1 }} />
                <List>
                  {quickActions.map((action) => (
                    <ListItem key={action.title} secondaryAction={<ChevronRightIcon fontSize="small" color="action" />}>
                      <ListItemAvatar>
                        <Avatar sx={{ bgcolor: action.color, color: '#0b7465' }}>{action.icon}</Avatar>
                      </ListItemAvatar>
                      <ListItemText primary={action.title} secondary={action.subtitle} />
                    </ListItem>
                  ))}
                </List>
              </Paper>
            </Grid>
            <Grid item xs={12}>
              <Paper sx={{ p: 2, borderRadius: 2 }}>
                <SectionHeader title="Recent Requests" />
                <Divider sx={{ mb: 1 }} />
                <List>
                  {recentRequests.map((request) => (
                    <ListItem key={request.title} alignItems="flex-start">
                      <ListItemText
                        primary={request.title}
                        secondary={`${request.priority} Priority - ${request.status}`}
                      />
                    </ListItem>
                  ))}
                </List>
                <Button size="small" sx={{ mt: 1 }}>
                  View All
                </Button>
              </Paper>
            </Grid>
          </Grid>
        </Grid>
      </Grid>

      <Paper sx={{ p: 2, borderRadius: 2, mt: 2 }}>
        <SectionHeader
          title="Student Profiles and Room Allocation"
          action={
            <Box display="flex" gap={1}>
              <Select size="small" value="all">
                <MenuItem value="all">All Floors</MenuItem>
              </Select>
              <Select size="small" value="status">
                <MenuItem value="status">All Status</MenuItem>
              </Select>
              <Button size="small" startIcon={<DownloadIcon />}>
                Export
              </Button>
            </Box>
          }
        />
        <Divider sx={{ mb: 1 }} />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Student ID</TableCell>
                <TableCell>Name</TableCell>
                <TableCell>Room</TableCell>
                <TableCell>Floor</TableCell>
                <TableCell>Fee Status</TableCell>
                <TableCell>Check-In</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {studentCards.slice(0, 4).map((student) => (
                <TableRow key={student.id}>
                  <TableCell>{student.id}</TableCell>
                  <TableCell>{student.name}</TableCell>
                  <TableCell>{student.room.split(' ')[1]}</TableCell>
                  <TableCell>{student.room.split('-')[1].trim()}</TableCell>
                  <TableCell>
                    <StatusChip status={student.fee} />
                  </TableCell>
                  <TableCell>2024-01-15</TableCell>
                  <TableCell align="right">
                    <Button size="small">...</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );

  const renderRooms = () => (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Box display="flex" gap={1}>
          <Select size="small" value="all">
            <MenuItem value="all">All Floors</MenuItem>
          </Select>
          <Select size="small" value="status">
            <MenuItem value="status">All Status</MenuItem>
          </Select>
        </Box>
        <Button variant="contained" startIcon={<AddIcon />}>
          Allocate Room
        </Button>
      </Box>
      {roomFloors.map((floor) => (
        <Paper key={floor.title} sx={{ p: 2, mb: 2, borderRadius: 2 }}>
          <Typography variant="subtitle1" sx={{ mb: 1 }}>
            {floor.title}
          </Typography>
          <Grid container spacing={1}>
            {floor.rooms.map((room) => (
              <Grid item xs={12} sm={6} md={3} key={`${floor.title}-${room.number}`}>
                <Paper
                  sx={{
                    p: 1.5,
                    borderRadius: 2,
                    bgcolor:
                      room.status === 'occupied'
                        ? '#00c48c'
                        : room.status === 'partial'
                        ? '#f7b500'
                        : room.status === 'maintenance'
                        ? '#ff6b6b'
                        : '#e9edf4',
                    color: room.status === 'vacant' ? 'text.primary' : 'white',
                  }}
                >
                  <Box display="flex" alignItems="center" justifyContent="space-between">
                    <Typography variant="subtitle2">{room.number}</Typography>
                    <HotelIcon fontSize="small" />
                  </Box>
                  <Typography variant="caption">{room.type}</Typography>
                  <Typography variant="body2">{room.occupancy} Occupied</Typography>
                </Paper>
              </Grid>
            ))}
          </Grid>
        </Paper>
      ))}
      <Grid container spacing={2}>
        {occupancyBreakdown.map((item) => (
          <Grid item xs={12} sm={6} md={3} key={item.name}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: item.color }} />
                <Typography variant="body2" color="text.secondary">
                  {item.name}
                </Typography>
              </Box>
              <Typography variant="h6">{item.value}</Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>
    </Box>
  );

  const renderFees = () => (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile label="Total Collected" value="Rs 75K" trend="" icon={<PaymentsIcon />} color="#00c48c" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile label="Pending Payments" value="Rs 30K" trend="" icon={<WarningAmberIcon />} color="#f7b500" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile label="Overdue Payments" value="Rs 15K" trend="" icon={<WarningAmberIcon />} color="#ff6b6b" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile label="Collection Rate" value="63%" trend="" icon={<TrendingUpIcon />} color="#00b894" />
        </Grid>
      </Grid>
      <Paper sx={{ p: 2, mt: 2, borderRadius: 2 }}>
        <SectionHeader
          title="Fee Records"
          action={
            <Box display="flex" gap={1}>
              <Select size="small" value="all">
                <MenuItem value="all">All Status</MenuItem>
              </Select>
              <Button size="small" startIcon={<DownloadIcon />}>
                Export
              </Button>
              <Button variant="contained" size="small" startIcon={<AddIcon />}>
                Record Payment
              </Button>
            </Box>
          }
        />
        <Divider sx={{ mb: 1 }} />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Fee ID</TableCell>
                <TableCell>Student Name</TableCell>
                <TableCell>Room</TableCell>
                <TableCell>Amount</TableCell>
                <TableCell>Due Date</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Payment Method</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {feeRecords.map((fee) => (
                <TableRow key={fee.id}>
                  <TableCell>{fee.id}</TableCell>
                  <TableCell>{fee.name}</TableCell>
                  <TableCell>{fee.room}</TableCell>
                  <TableCell>Rs {fee.amount}</TableCell>
                  <TableCell>{fee.dueDate}</TableCell>
                  <TableCell>
                    <StatusChip status={fee.status} />
                  </TableCell>
                  <TableCell>{fee.method}</TableCell>
                  <TableCell align="right">
                    <Button size="small">...</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );

  const renderMaintenance = () => (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={4}>
          <StatTile label="Pending Requests" value="3" trend="" icon={<WarningAmberIcon />} color="#f7b500" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatTile label="In Progress" value="2" trend="" icon={<BuildIcon />} color="#53a9ff" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <StatTile label="Completed" value="1" trend="" icon={<AssignmentTurnedInIcon />} color="#00c48c" />
        </Grid>
      </Grid>
      <Paper sx={{ p: 2, mt: 2, borderRadius: 2 }}>
        <SectionHeader
          title="All Requests"
          action={
            <Box display="flex" gap={1}>
              <Select size="small" value="all">
                <MenuItem value="all">All Priorities</MenuItem>
              </Select>
              <Select size="small" value="status">
                <MenuItem value="status">All Status</MenuItem>
              </Select>
              <Button variant="contained" size="small" startIcon={<AddIcon />}>
                New Request
              </Button>
            </Box>
          }
        />
        <Divider sx={{ mb: 1 }} />
        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Request ID</TableCell>
                <TableCell>Room</TableCell>
                <TableCell>Issue</TableCell>
                <TableCell>Priority</TableCell>
                <TableCell>Status</TableCell>
                <TableCell>Reported By</TableCell>
                <TableCell>Date</TableCell>
                <TableCell align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {maintenanceRequests.map((request) => (
                <TableRow key={request.id}>
                  <TableCell>{request.id}</TableCell>
                  <TableCell>{request.room}</TableCell>
                  <TableCell>{request.issue}</TableCell>
                  <TableCell>
                    <StatusChip status={request.priority} />
                  </TableCell>
                  <TableCell>
                    <StatusChip status={request.status} />
                  </TableCell>
                  <TableCell>{request.by}</TableCell>
                  <TableCell>{request.date}</TableCell>
                  <TableCell align="right">
                    <Button size="small">...</Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );

  const renderOccupancy = () => (
    <Box>
      <Grid container spacing={2}>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile label="Total Rooms" value="28" icon={<ApartmentIcon />} color="#00c48c" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile label="Occupied Rooms" value="10" icon={<HotelIcon />} color="#ff6b6b" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile label="Vacant Rooms" value="7" icon={<ApartmentIcon />} color="#cfd6e5" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile label="Occupancy Rate" value="50%" icon={<TrendingUpIcon />} color="#00b894" />
        </Grid>
      </Grid>
      <Grid container spacing={2} sx={{ mt: 1 }}>
        <Grid item xs={12} md={7}>
          <Paper sx={{ p: 2, borderRadius: 2, height: '100%' }}>
            <SectionHeader title="Occupancy Distribution" />
            <Divider sx={{ mb: 2 }} />
            <Box sx={{ height: 260, position: 'relative' }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={occupancyBreakdown} dataKey="value" innerRadius={70} outerRadius={95} paddingAngle={3}>
                    {occupancyBreakdown.map((entry) => (
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
                <Typography variant="h5">28</Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Rooms
                </Typography>
              </Box>
            </Box>
            <Grid container spacing={1} sx={{ mt: 1 }}>
              {occupancyBreakdown.map((item) => (
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
            <SectionHeader title="Capacity Overview" />
            <Divider sx={{ mb: 2 }} />
            <Paper sx={{ p: 2, borderRadius: 2, bgcolor: '#00b894', color: 'white' }}>
              <Typography variant="body2">Total Capacity</Typography>
              <Typography variant="h4">62</Typography>
              <Typography variant="caption">Students</Typography>
            </Paper>
            <Grid container spacing={1} sx={{ mt: 1 }}>
              <Grid item xs={6}>
                <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: '#e7fff6' }}>
                  <Typography variant="caption" color="text.secondary">
                    Currently Occupied
                  </Typography>
                  <Typography variant="h6">31</Typography>
                </Paper>
              </Grid>
              <Grid item xs={6}>
                <Paper sx={{ p: 1.5, borderRadius: 2, bgcolor: '#f7f8fc' }}>
                  <Typography variant="caption" color="text.secondary">
                    Available Beds
                  </Typography>
                  <Typography variant="h6">31</Typography>
                </Paper>
              </Grid>
            </Grid>
            <Box sx={{ mt: 2 }}>
              <Typography variant="caption" color="text.secondary">
                Occupancy Progress
              </Typography>
              <Box sx={{ mt: 0.5, height: 8, borderRadius: 4, bgcolor: '#e9edf4' }}>
                <Box sx={{ width: '50%', height: '100%', bgcolor: '#00b894', borderRadius: 4 }} />
              </Box>
              <Typography variant="caption" color="text.secondary">
                50%
              </Typography>
            </Box>
            <Box sx={{ mt: 2 }}>
              <Typography variant="subtitle2">Room Type Distribution</Typography>
              <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mt: 1 }}>
                <Typography variant="body2">Double Rooms</Typography>
                <Typography variant="body2">22</Typography>
              </Box>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="body2">Triple Rooms</Typography>
                <Typography variant="body2">6</Typography>
              </Box>
            </Box>
          </Paper>
        </Grid>
      </Grid>
      <Paper sx={{ p: 2, borderRadius: 2, mt: 2 }}>
        <SectionHeader title="Floor-wise Occupancy" />
        <Divider sx={{ mb: 1 }} />
        {[
          { floor: '1st Floor', total: 8, occupied: 3, vacant: 2, capacity: 18, current: 9, percent: 50 },
          { floor: '2nd Floor', total: 11, occupied: 4, vacant: 2, capacity: 24, current: 13, percent: 54 },
          { floor: '3rd Floor', total: 9, occupied: 3, vacant: 3, capacity: 20, current: 9, percent: 45 },
        ].map((row) => (
          <Box key={row.floor} sx={{ mb: 2 }}>
            <Box display="flex" alignItems="center" justifyContent="space-between">
              <Typography variant="subtitle2">{row.floor}</Typography>
              <Typography variant="subtitle2" color="success.main">
                {row.percent}%
              </Typography>
            </Box>
            <Grid container spacing={2} sx={{ mt: 0.5 }}>
              <Grid item xs={6} md={2}>
                <Typography variant="caption" color="text.secondary">
                  Total Rooms
                </Typography>
                <Typography variant="body2">{row.total}</Typography>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography variant="caption" color="text.secondary">
                  Occupied
                </Typography>
                <Typography variant="body2">{row.occupied}</Typography>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography variant="caption" color="text.secondary">
                  Vacant
                </Typography>
                <Typography variant="body2">{row.vacant}</Typography>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography variant="caption" color="text.secondary">
                  Capacity
                </Typography>
                <Typography variant="body2">{row.capacity}</Typography>
              </Grid>
              <Grid item xs={6} md={2}>
                <Typography variant="caption" color="text.secondary">
                  Current
                </Typography>
                <Typography variant="body2">{row.current}</Typography>
              </Grid>
              <Grid item xs={12} md={2}>
                <Box sx={{ mt: 1, height: 6, borderRadius: 4, bgcolor: '#e9edf4' }}>
                  <Box sx={{ width: `${row.percent}%`, height: '100%', bgcolor: '#00b894', borderRadius: 4 }} />
                </Box>
              </Grid>
            </Grid>
            <Divider sx={{ mt: 2 }} />
          </Box>
        ))}
      </Paper>
    </Box>
  );

  const renderStudents = () => (
    <Box>
      <Box display="flex" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
        <Typography variant="h6">All Students</Typography>
        <Box display="flex" gap={1} alignItems="center">
          <TextField
            size="small"
            placeholder="Search by name or ID"
            InputProps={{ startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} /> }}
          />
          <Select size="small" value="all">
            <MenuItem value="all">All Courses</MenuItem>
          </Select>
          <Button size="small" startIcon={<DownloadIcon />}>
            Export
          </Button>
        </Box>
      </Box>
      <Grid container spacing={2}>
        {studentCards.map((student) => (
          <Grid item xs={12} md={4} key={student.id}>
            <Paper sx={{ p: 2, borderRadius: 2 }}>
              <Box display="flex" alignItems="center" gap={1}>
                <Avatar>{student.name.split(' ')[0][0]}</Avatar>
                <Box>
                  <Typography variant="subtitle2">{student.name}</Typography>
                  <Typography variant="caption" color="text.secondary">
                    {student.id}
                  </Typography>
                </Box>
              </Box>
              <Box sx={{ mt: 1 }}>
                <Typography variant="body2">{student.course}</Typography>
                <Typography variant="caption" color="text.secondary">
                  {student.year}
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {student.room}
                </Typography>
                <Typography variant="body2">{student.email}</Typography>
              </Box>
              <Box sx={{ mt: 1 }}>
                <StatusChip status={student.fee} />
              </Box>
            </Paper>
          </Grid>
        ))}
      </Grid>
      <Grid container spacing={2} sx={{ mt: 2 }}>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile label="Total Students" value="8" icon={<GroupsIcon />} color="#00c48c" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile label="Fees Paid" value="5" icon={<AssignmentTurnedInIcon />} color="#00b894" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile label="Fees Pending" value="2" icon={<WarningAmberIcon />} color="#f7b500" />
        </Grid>
        <Grid item xs={12} sm={6} md={3}>
          <StatTile label="Fees Overdue" value="1" icon={<WarningAmberIcon />} color="#ff6b6b" />
        </Grid>
      </Grid>
    </Box>
  );

  const tabs = [
    { value: 'dashboard', label: 'Dashboard', icon: <DashboardIcon fontSize="small" /> },
    { value: 'rooms', label: 'Rooms', icon: <HotelIcon fontSize="small" /> },
    { value: 'fees', label: 'Fees', icon: <PaymentsIcon fontSize="small" /> },
    { value: 'maintenance', label: 'Maintenance', icon: <BuildIcon fontSize="small" /> },
    { value: 'students', label: 'Students', icon: <PersonIcon fontSize="small" /> },
    { value: 'occupancy', label: 'Occupancy', icon: <TrendingUpIcon fontSize="small" /> },
  ];

  return (
    <Box sx={{ minHeight: '100vh', bgcolor: '#f5f7fb', p: 2 }}>
      <Paper sx={{ p: 1.5, borderRadius: 2, mb: 2 }}>
        <Box display="flex" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={2}>
          <Box display="flex" alignItems="center" gap={1}>
            <Avatar sx={{ bgcolor: '#00b894' }}>
              <ApartmentIcon fontSize="small" />
            </Avatar>
            <Box>
              <Typography variant="subtitle1">Hostel Module</Typography>
              <Typography variant="caption" color="text.secondary">
                Management System
              </Typography>
            </Box>
          </Box>

          <Tabs
            value={activeTab}
            onChange={(_, value) => setActiveTab(value)}
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
            {tabs.map((tab) => (
              <Tab key={tab.value} value={tab.value} icon={tab.icon} iconPosition="start" label={tab.label} />
            ))}
          </Tabs>

          <Box display="flex" alignItems="center" gap={1}>
            <TextField
              size="small"
              placeholder="Search..."
              InputProps={{
                startAdornment: <SearchIcon fontSize="small" sx={{ mr: 1, color: 'text.secondary' }} />,
              }}
              sx={{ width: 180 }}
            />
            <IconButton>
              <Badge color="error" variant="dot">
                <NotificationsNoneIcon />
              </Badge>
            </IconButton>
          </Box>
        </Box>
      </Paper>

      {activeTab === 'dashboard' && renderDashboard()}
      {activeTab === 'rooms' && renderRooms()}
      {activeTab === 'fees' && renderFees()}
      {activeTab === 'maintenance' && renderMaintenance()}
      {activeTab === 'students' && renderStudents()}
      {activeTab === 'occupancy' && renderOccupancy()}
    </Box>
  );
};

export default HostelManagement;
