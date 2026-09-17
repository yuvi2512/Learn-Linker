import React, { useMemo, useState, useCallback } from "react";
import {
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  IconButton,
  Avatar,
  Button,
  Divider,
  AppBar,
  Toolbar,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";
import SpaceDashboardOutlinedIcon from "@mui/icons-material/SpaceDashboardOutlined";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import CalendarMonthOutlinedIcon from "@mui/icons-material/CalendarMonthOutlined";
import TableChartOutlinedIcon from "@mui/icons-material/TableChartOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import Logo from "./Logo";
import { canBuildTimetable, isAdmin, isStaff } from "@/utils/permissions";

const DRAWER_WIDTH = 268;

const teacherLinks = [
  { href: "/dashboard", label: "Overview", icon: SpaceDashboardOutlinedIcon },
  { href: "/attendance", label: "Attendance", icon: HowToRegOutlinedIcon },
  { href: "/results", label: "Results", icon: AssessmentOutlinedIcon },
  { href: "/assignments", label: "Assignments", icon: AssignmentOutlinedIcon },
  { href: "/tests", label: "Tests", icon: QuizOutlinedIcon },
  { href: "/timetable", label: "Timetable", icon: CalendarMonthOutlinedIcon },
];

const studentLinks = [
  { href: "/dashboard", label: "Overview", icon: SpaceDashboardOutlinedIcon },
  { href: "/results", label: "Results", icon: AssessmentOutlinedIcon },
  { href: "/assignments", label: "Assignments", icon: AssignmentOutlinedIcon },
  { href: "/tests", label: "Tests", icon: QuizOutlinedIcon },
  { href: "/notes", label: "Study notes", icon: AutoAwesomeOutlinedIcon },
  { href: "/timetable", label: "Timetable", icon: CalendarMonthOutlinedIcon },
];

function SidebarContent({ links, pathname, onNavigate, session, onLogout }) {
  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        px: 2,
        py: 2.5,
        background: "#0B1426",
        color: "#E2E8F0",
      }}
    >
      <Box sx={{ px: 0.5, mb: 3 }}>
        <Logo inverted href="/dashboard" />
      </Box>

      <Typography
        sx={{
          px: 1.5,
          mb: 1,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: "0.12em",
          textTransform: "uppercase",
          color: "rgba(226,232,240,0.4)",
        }}
      >
        {isAdmin(session?.user)
          ? "Admin"
          : isStaff(session?.user)
          ? "Teaching"
          : "Learning"}
      </Typography>

      <List sx={{ flex: 1, py: 0 }}>
        {links.map((item) => {
          const Icon = item.icon;
          const active = pathname === item.href;
          return (
            <ListItemButton
              key={item.href}
              component={Link}
              href={item.href}
              onClick={onNavigate}
              sx={{
                mb: 0.5,
                borderRadius: 2,
                color: active ? "#FFFFFF" : "rgba(226,232,240,0.72)",
                backgroundColor: active ? "rgba(37,99,235,0.28)" : "transparent",
                "&:hover": {
                  backgroundColor: active
                    ? "rgba(37,99,235,0.36)"
                    : "rgba(255,255,255,0.05)",
                },
              }}
            >
              <ListItemIcon sx={{ minWidth: 40, color: "inherit" }}>
                <Icon fontSize="small" />
              </ListItemIcon>
              <ListItemText
                primary={item.label}
                primaryTypographyProps={{
                  fontWeight: active ? 700 : 500,
                  fontSize: 14,
                }}
              />
            </ListItemButton>
          );
        })}
      </List>

      <Divider sx={{ borderColor: "rgba(255,255,255,0.08)", mb: 2 }} />

      <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, px: 1, mb: 1.5 }}>
        <Avatar
          sx={{
            width: 36,
            height: 36,
            bgcolor: "#2563EB",
            fontSize: 14,
            fontWeight: 700,
          }}
        >
          {(session?.user?.name || "U").charAt(0).toUpperCase()}
        </Avatar>
        <Box sx={{ minWidth: 0 }}>
          <Typography noWrap sx={{ fontSize: 13, fontWeight: 700, color: "#F8FAFC" }}>
            {session?.user?.name || "User"}
          </Typography>
          <Typography
            noWrap
            sx={{
              fontSize: 11,
              color: "rgba(226,232,240,0.5)",
              textTransform: "capitalize",
            }}
          >
            {session?.user?.role}
          </Typography>
        </Box>
      </Box>

      <Button
        onClick={onLogout}
        startIcon={<LogoutRoundedIcon />}
        sx={{
          justifyContent: "flex-start",
          color: "rgba(226,232,240,0.8)",
          "&:hover": { backgroundColor: "rgba(255,255,255,0.06)" },
        }}
      >
        Sign out
      </Button>
    </Box>
  );
}

export default function AppShell({ children }) {
  const { data: session } = useSession();
  const router = useRouter();
  const pathname = router.pathname;
  const [mobileOpen, setMobileOpen] = useState(false);

  const links = useMemo(() => {
    if (!isStaff(session?.user)) return studentLinks;

    const items = [...teacherLinks];

    if (isAdmin(session.user)) {
      items.splice(1, 0, {
        href: "/batches",
        label: "Batches",
        icon: GroupsOutlinedIcon,
      });
      items.splice(2, 0, {
        href: "/invites",
        label: "Invites",
        icon: PersonAddAltOutlinedIcon,
      });
    }

    if (!canBuildTimetable(session.user)) return items;

    return [
      ...items,
      {
        href: "/timetable/build",
        label: "Build timetable",
        icon: TableChartOutlinedIcon,
      },
    ];
  }, [session]);

  const handleLogout = useCallback(async () => {
    await signOut({ callbackUrl: "/login" });
  }, []);

  const drawer = (
    <SidebarContent
      links={links}
      pathname={pathname}
      session={session}
      onNavigate={() => setMobileOpen(false)}
      onLogout={handleLogout}
    />
  );

  return (
    <Box sx={{ minHeight: "100vh", display: "flex", bgcolor: "background.default" }}>
      <Drawer
        variant="temporary"
        open={mobileOpen}
        onClose={() => setMobileOpen(false)}
        ModalProps={{ keepMounted: true }}
        sx={{
          display: { xs: "block", md: "none" },
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            border: "none",
            background: "#0B1426",
          },
        }}
      >
        {drawer}
      </Drawer>

      <Drawer
        variant="permanent"
        open
        sx={{
          display: { xs: "none", md: "block" },
          width: DRAWER_WIDTH,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: DRAWER_WIDTH,
            border: "none",
            background: "#0B1426",
            boxSizing: "border-box",
          },
        }}
      >
        {drawer}
      </Drawer>

      <Box sx={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
        <AppBar
          position="sticky"
          elevation={0}
          sx={{
            display: { xs: "flex", md: "none" },
            backgroundColor: "rgba(255,255,255,0.92)",
            backdropFilter: "blur(12px)",
            borderBottom: "1px solid #E8EEF5",
            color: "text.primary",
          }}
        >
          <Toolbar sx={{ minHeight: 64 }}>
            <IconButton
              edge="start"
              onClick={() => setMobileOpen(true)}
              aria-label="Open navigation"
              sx={{ mr: 1 }}
            >
              <MenuIcon />
            </IconButton>
            <Logo href="/dashboard" />
          </Toolbar>
        </AppBar>
        <Box component="main" sx={{ flex: 1, minWidth: 0 }}>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
