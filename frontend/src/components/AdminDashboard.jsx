import React, { useState } from "react";
import { Routes, Route, Navigate, useLocation, Link } from "react-router-dom";
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  useTheme,
  useMediaQuery,
  Tooltip,
} from "@mui/material";
import {
  Dashboard as DashboardIcon,
  People as PeopleIcon,
  School as SchoolIcon,
  Person as PersonIcon,
  Assessment as AssessmentIcon,
  Home as HomeIcon,
  LibraryBooks as LibraryIcon,
  Grade as GradeIcon,
  Announcement as NoticeIcon,
  Note as NoteIcon,
  Menu as MenuIcon,
  AccountCircle as AccountIcon,
  Logout as LogoutIcon,
} from "@mui/icons-material";
import { useAuth } from "../contexts/AuthContext";
import Dashboard from "./admin/Dashboard";
import UserManagement from "./admin/UserManagement";
import StudentManagement from "./admin/StudentManagement";
import TeacherManagement from "./admin/TeacherManagement";
import AttendanceManagement from "./admin/AttendanceManagement";
import HostelManagement from "./admin/HostelManagement";
import LibraryManagement from "./admin/LibraryManagement";
import ResultsManagement from "./admin/ResultsManagement";
import NoticesManagement from "./admin/NoticesManagement";
import NotesManagement from "./admin/NotesManagement";

const drawerWidth = 240;

const AdminDashboard = () => {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const { user, logout } = useAuth();
  const location = useLocation();

  const menuItems = [
    { text: "Dashboard", icon: <DashboardIcon />, path: "/admin" },
    { text: "User Management", icon: <PeopleIcon />, path: "/admin/users" },
    { text: "Students", icon: <SchoolIcon />, path: "/admin/students" },
    { text: "Teachers", icon: <PersonIcon />, path: "/admin/teachers" },
    { text: "Attendance", icon: <AssessmentIcon />, path: "/admin/attendance" },
    { text: "Hostel", icon: <HomeIcon />, path: "/admin/hostel" },
    { text: "Library", icon: <LibraryIcon />, path: "/admin/library" },
    { text: "Results", icon: <GradeIcon />, path: "/admin/results" },
    { text: "Notices", icon: <NoticeIcon />, path: "/admin/notices" },
    { text: "Notes", icon: <NoteIcon />, path: "/admin/notes" },
  ];

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const handleProfileMenuOpen = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleProfileMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    logout();
    handleProfileMenuClose();
  };

  const drawer = (
    <Box
      sx={{
        height: "100%",
        background: "linear-gradient(180deg, #1e3c72, #2a5298)",
        color: "white",
      }}
    >
      <Toolbar>
        <Typography variant="h6" sx={{ fontWeight: "bold", mx: "auto" }}>
          Admin Panel
        </Typography>
      </Toolbar>
      <Divider sx={{ bgcolor: "rgba(255,255,255,0.2)" }} />
      <List>
        {menuItems.map((item) => {
          const active = location.pathname === item.path;
          return (
            <ListItem key={item.text} disablePadding>
              <ListItemButton
                component={Link}
                to={item.path}
                sx={{
                  mx: 1,
                  borderRadius: 2,
                  mb: 0.5,
                  color: active ? "#1e3c72" : "white",
                  backgroundColor: active ? "white" : "transparent",
                  transition: "0.3s",
                  "&:hover": {
                    backgroundColor: active
                      ? "white"
                      : "rgba(255,255,255,0.15)",
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    color: active ? "#1e3c72" : "white",
                    minWidth: 40,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={item.text}
                  primaryTypographyProps={{
                    fontWeight: active ? "bold" : "normal",
                  }}
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>
    </Box>
  );

  return (
    <Box sx={{ display: "flex" }}>
      {/* Top AppBar */}
      <AppBar
        position="fixed"
        elevation={4}
        sx={{
          background: "linear-gradient(90deg, #1e3c72, #2a5298)",
          width: { md: `calc(100% - ${drawerWidth}px)` },
          ml: { md: `${drawerWidth}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2, display: { md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            noWrap
            sx={{ flexGrow: 1, fontWeight: "bold", letterSpacing: 0.5 }}
          >
            🎓 Student Management System (Admin)
          </Typography>

          <Tooltip title="Profile Menu">
            <IconButton onClick={handleProfileMenuOpen} color="inherit">
              <Avatar
                sx={{
                  width: 35,
                  height: 35,
                  bgcolor: "#fff",
                  color: "#1e3c72",
                  fontWeight: "bold",
                }}
              >
                {user?.first_name?.[0] || user?.username?.[0] || "A"}
              </Avatar>
            </IconButton>
          </Tooltip>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleProfileMenuClose}
            anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
            transformOrigin={{ vertical: "top", horizontal: "right" }}
          >
            <MenuItem onClick={handleProfileMenuClose}>
              <ListItemIcon>
                <AccountIcon fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <Divider />
            <MenuItem onClick={handleLogout}>
              <ListItemIcon>
                <LogoutIcon fontSize="small" color="error" />
              </ListItemIcon>
              Logout
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Sidebar Drawer */}
      <Box component="nav" sx={{ width: { md: drawerWidth }, flexShrink: 0 }}>
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={handleDrawerToggle}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: "block", md: "none" },
            "& .MuiDrawer-paper": { width: drawerWidth },
          }}
        >
          {drawer}
        </Drawer>

        <Drawer
          variant="permanent"
          sx={{
            display: { xs: "none", md: "block" },
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              border: "none",
            },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>

      
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          bgcolor: "#f4f6f8",
          minHeight: "100vh",
          width: { md: `calc(100% - ${drawerWidth}px)` },
          transition: "0.3s ease",
        }}
      >
        <Toolbar />
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/users" element={<UserManagement />} />
          <Route path="/students" element={<StudentManagement />} />
          <Route path="/teachers" element={<TeacherManagement />} />
          <Route path="/attendance" element={<AttendanceManagement />} />
          <Route path="/hostel" element={<HostelManagement />} />
          <Route path="/library" element={<LibraryManagement />} />
          <Route path="/results" element={<ResultsManagement />} />
          <Route path="/notices" element={<NoticesManagement />} />
          <Route path="/notes" element={<NotesManagement />} />
          <Route path="*" element={<Navigate to="/admin" replace />} />
        </Routes>
      </Box>
    </Box>
  );
};

export default AdminDashboard;
