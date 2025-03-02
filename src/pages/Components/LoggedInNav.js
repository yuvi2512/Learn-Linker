"use client";
import React, { useState, useEffect } from "react";
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
  ListItemText,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Link from "next/link";
import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/router";

const NavBar = () => {
  const { data: session } = useSession();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const router = useRouter();

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/Login/Login" });
  };

  const isActive = (pathname) => router.pathname === pathname;

  const activeStyle = {
    color: "black",
    fontWeight: "bold",
  };

  useEffect(() => {
    if (router.pathname === "/" && session) {
      if (session?.user?.role === "teacher") {
        router.push("/Components/Attendance");
      } else if (session?.user?.role === "student") {
        router.push("/Components/studentHome");
      }
    }
  }, [router.pathname, session]);

  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2, display: { xs: "block", md: "none" } }}
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Learn Linker
          </Typography>

          <Box sx={{ display: { xs: "none", md: "block" } }}>
            {session?.user.role === "teacher" && (
              <>
                <Link href="/Components/Attendance" passHref>
                  <Button
                    sx={
                      isActive("/Components/Attendance")
                        ? activeStyle
                        : { color: "white" }
                    }
                  >
                    Attendance
                  </Button>
                </Link>
                <Link href="/Components/GenerateMarksheet" passHref>
                  <Button
                    sx={
                      isActive("/Components/GenerateMarksheet")
                        ? activeStyle
                        : { color: "white" }
                    }
                  >
                    Marksheet
                  </Button>
                </Link>
                <Link href="/Components/Assignments" passHref>
                  <Button
                    sx={
                      isActive("/Components/Assignments")
                        ? activeStyle
                        : { color: "white" }
                    }
                  >
                    Assignment
                  </Button>
                </Link>
                <Link href="/Components/Test" passHref>
                  <Button
                    sx={
                      isActive("/Components/Test")
                        ? activeStyle
                        : { color: "white" }
                    }
                  >
                    Test
                  </Button>
                </Link>
                {session?.user.email === "jayesh.surana@gmail.com" && (
                  <>
                    <Link href="/Components/GenerateTimeTable" passHref>
                      <Button
                        sx={
                          isActive("/Components/GenerateTimeTable")
                            ? activeStyle
                            : { color: "white" }
                        }
                      >
                        Generate Time Table
                      </Button>
                    </Link>
                  </>
                )}
              </>
            )}
            {session?.user.role === "student" && (
              <>
                <Link href="/Components/studentHome" passHref>
                  <Button
                    sx={
                      isActive("/Components/studentHome")
                        ? activeStyle
                        : { color: "white" }
                    }
                  >
                    Home
                  </Button>
                </Link>
                <Link href="/Components/StudentSection/Marksheet" passHref>
                  <Button
                    sx={
                      isActive("/Components/StudentSection/Marksheet")
                        ? activeStyle
                        : { color: "white" }
                    }
                  >
                    View Result
                  </Button>
                </Link>
                <Link href="/Components/StudentSection/Assignment" passHref>
                  <Button
                    sx={
                      isActive("/Components/StudentSection/Assignment")
                        ? activeStyle
                        : { color: "white" }
                    }
                  >
                    Assignment
                  </Button>
                </Link>
                <Link href="/Components/StudentSection/generateNotes" passHref>
                  <Button
                    sx={
                      isActive("/Components/StudentSection/generateNotes")
                        ? activeStyle
                        : { color: "white" }
                    }
                  >
                    Generate Notes
                  </Button>
                </Link>
              </>
            )}
            <Link href="/Components/ShowTimeTable" passHref>
              <Button
                sx={
                  isActive("/Components/ShowTimeTable")
                    ? activeStyle
                    : { color: "white" }
                }
              >
                Show Time Table
              </Button>
            </Link>
            <Button sx={{ color: "white" }} onClick={handleLogout}>
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer anchor="left" open={drawerOpen} onClose={handleDrawerToggle}>
        <Box
          sx={{ width: 250 }}
          role="presentation"
          onClick={handleDrawerToggle}
          onKeyDown={handleDrawerToggle}
        >
          <List>
            {session?.user.role === "teacher" && (
              <>
                <ListItem button>
                  <Link href="/Components/Attendance" passHref>
                    <ListItemText primary="Attendance" />
                  </Link>
                </ListItem>
                <ListItem button>
                  <Link href="/Components/GenerateMarksheet" passHref>
                    <ListItemText primary="Marksheet" />
                  </Link>
                </ListItem>
              </>
            )}
            {session?.user.role === "student" && (
              <>
                <ListItem button>
                  <Link href="/Components/studentHome" passHref>
                    <ListItemText primary="Home" />
                  </Link>
                </ListItem>
                <ListItem button>
                  <Link href="/Components/StudentSection/Marksheet" passHref>
                    <ListItemText primary="View Result" />
                  </Link>
                </ListItem>
              </>
            )}
            <ListItem button onClick={handleLogout}>
              <ListItemText primary="Logout" />
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default NavBar;
