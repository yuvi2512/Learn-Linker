"use client";

import React, { useState, useCallback, memo } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
  Drawer,
  List,
  ListItem,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { usePathname, useRouter } from "next/navigation";

const activeStyle = {
  color: "#00BFFF",
  fontWeight: "bold",
  textShadow: "0 0 10px rgba(0, 191, 255, 0.8)",
};

const navBtnStyle = {
  color: "white",
  transition: "all 0.3s ease",
  "&:hover": {
    transform: "translateY(-3px)",
    color: "#00BFFF",
  },
};

const NavButton = memo(({ href, active, children }) => (
  <Link href={href} prefetch>
    <Button sx={{ ...(active ? activeStyle : navBtnStyle) }}>
      {children}
    </Button>
  </Link>
));

const NavBar = () => {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();

  const [drawerOpen, setDrawerOpen] = useState(false);

  const toggleDrawer = useCallback(() => {
    setDrawerOpen((prev) => !prev);
  }, []);

  const handleLogout = useCallback(async () => {
    await signOut({ callbackUrl: "/Login/Login" });
  }, []);

  const isActive = useCallback(
    (path) => pathname === path,
    [pathname]
  );

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          background: "rgba(0,0,0,0.6)",
          backdropFilter: "blur(10px)",
        }}
      >
        <Toolbar>
          <IconButton
            onClick={toggleDrawer}
            sx={{ display: { xs: "block", md: "none" }, color: "white" }}
          >
            <MenuIcon />
          </IconButton>

          <Typography
            variant="h6"
            sx={{
              flexGrow: 1,
              fontWeight: "bold",
              letterSpacing: 2,
              color: "#00BFFF",
              textShadow: "0 0 15px rgba(0,191,255,0.8)",
            }}
          >
            Learn Linker
          </Typography>

          <Box sx={{ display: { xs: "none", md: "flex" } }}>
            {session?.user?.role === "teacher" && (
              <>
                <NavButton href="/Components/Attendance" active={isActive("/Components/Attendance")}>
                  Attendance
                </NavButton>
                <NavButton href="/Components/GenerateMarksheet" active={isActive("/Components/GenerateMarksheet")}>
                  Marksheet
                </NavButton>
                <NavButton href="/Components/Assignments" active={isActive("/Components/Assignments")}>
                  Assignment
                </NavButton>
                <NavButton href="/Components/Test" active={isActive("/Components/Test")}>
                  Test
                </NavButton>

                {session.user.email === "jayesh.surana@gmail.com" && (
                  <NavButton
                    href="/Components/GenerateTimeTable"
                    active={isActive("/Components/GenerateTimeTable")}
                  >
                    Generate Time Table
                  </NavButton>
                )}
              </>
            )}

            {session?.user?.role === "student" && (
              <>
                <NavButton
                  href="/Components/StudentSection/studentHome"
                  active={isActive("/Components/StudentSection/studentHome")}
                >
                  Home
                </NavButton>
                <NavButton
                  href="/Components/StudentSection/Marksheet"
                  active={isActive("/Components/StudentSection/Marksheet")}
                >
                  View Result
                </NavButton>
                <NavButton
                  href="/Components/StudentSection/Assignment"
                  active={isActive("/Components/StudentSection/Assignment")}
                >
                  Assignment
                </NavButton>
                <NavButton
                  href="/Components/StudentSection/generateNotes"
                  active={isActive("/Components/StudentSection/generateNotes")}
                >
                  Generate Notes
                </NavButton>
              </>
            )}

            <NavButton
              href="/Components/StudentSection/ShowTimeTable"
              active={isActive("/Components/StudentSection/ShowTimeTable")}
            >
              Show Time Table
            </NavButton>

            <Button sx={navBtnStyle} onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      {/* ------------------ MOBILE DRAWER ------------------ */}
      <Drawer anchor="left" open={drawerOpen} onClose={toggleDrawer}>
        <Box
          sx={{
            width: 260,
            height: "100%",
            background: "rgba(0,0,0,0.9)",
            color: "white",
            display: "flex",
            flexDirection: "column",
            justifyContent: "space-between",
            p: 2,
          }}
          onClick={toggleDrawer}
        >
          <List>
            {session?.user?.role === "teacher" && (
              <>
                <ListItem>
                  <NavButton href="/Components/Attendance" active={isActive("/Components/Attendance")}>
                    📋 Attendance
                  </NavButton>
                </ListItem>
                <ListItem>
                  <NavButton href="/Components/GenerateMarksheet" active={isActive("/Components/GenerateMarksheet")}>
                    📝 Marksheet
                  </NavButton>
                </ListItem>
                <ListItem>
                  <NavButton href="/Components/Assignments" active={isActive("/Components/Assignments")}>
                    📚 Assignment
                  </NavButton>
                </ListItem>
                <ListItem>
                  <NavButton href="/Components/Test" active={isActive("/Components/Test")}>
                    🧪 Test
                  </NavButton>
                </ListItem>
              </>
            )}

            {session?.user?.role === "student" && (
              <>
                <ListItem>
                  <NavButton
                    href="/Components/StudentSection/studentHome"
                    active={isActive("/Components/StudentSection/studentHome")}
                  >
                    🏠 Home
                  </NavButton>
                </ListItem>
                <ListItem>
                  <NavButton
                    href="/Components/StudentSection/Marksheet"
                    active={isActive("/Components/StudentSection/Marksheet")}
                  >
                    📊 Result
                  </NavButton>
                </ListItem>
                <ListItem>
                  <NavButton
                    href="/Components/StudentSection/Assignment"
                    active={isActive("/Components/StudentSection/Assignment")}
                  >
                    📚 Assignment
                  </NavButton>
                </ListItem>
              </>
            )}
          </List>

          <Button
            variant="outlined"
            fullWidth
            sx={{
              borderColor: "#00BFFF",
              color: "white",
              "&:hover": {
                background: "rgba(0,191,255,0.2)",
              },
            }}
            onClick={handleLogout}
          >
            🚪 Logout
          </Button>
        </Box>
      </Drawer>
    </>
  );
};

export default memo(NavBar);
