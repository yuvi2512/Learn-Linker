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
    color: "#00BFFF",
    fontWeight: "bold",
    textShadow: "0 0 10px rgba(0, 191, 255, 0.8)",
  };

  useEffect(() => {
    if (router.pathname === "/" && session) {
      if (session?.user?.role === "teacher") {
        router.push("/Components/Attendance");
      } else if (session?.user?.role === "student") {
        router.push("/Components/StudentSection/studentHome");
      }
    }
  }, [router.pathname, session]);

  return (
    <>
      <AppBar
        position="sticky"
        sx={{
          background: "rgba(0, 0, 0, 0.6)",
          backdropFilter: "blur(10px)",
          boxShadow: "0px 4px 20px rgba(255, 255, 255, 0.1)",
        }}
      >
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{
              mr: 2,
              display: { xs: "block", md: "none" },
              transition: "transform 0.3s ease-in-out",
              "&:hover": {
                transform: "scale(1.1)",
              },
            }}
            onClick={handleDrawerToggle}
          >
            <MenuIcon />
          </IconButton>
          <Typography
            variant="h6"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: "bold",
              letterSpacing: "2px",
              color: "#00BFFF",
              textShadow: "0px 0px 15px rgba(0, 191, 255, 0.8)",
            }}
          >
            Learn Linker
          </Typography>

          <Box sx={{ display: { xs: "none", md: "block" } }}>
            {session?.user.role === "teacher" && (
              <>
                <Link href="/Components/Attendance" passHref>
                  <Button
                    sx={{
                      ...(isActive("/Components/Attendance")
                        ? activeStyle
                        : { color: "white" }),
                      transition: "all 0.3s ease-in-out",
                      "&:hover": {
                        transform: "translateY(-3px)",
                        color: "#00BFFF",
                      },
                    }}
                  >
                    Attendance
                  </Button>
                </Link>
                <Link href="/Components/GenerateMarksheet" passHref>
                  <Button
                    sx={{
                      ...(isActive("/Components/GenerateMarksheet")
                        ? activeStyle
                        : { color: "white" }),
                      transition: "all 0.3s ease-in-out",
                      "&:hover": {
                        transform: "translateY(-3px)",
                        color: "#00BFFF",
                      },
                    }}
                  >
                    Marksheet
                  </Button>
                </Link>
                <Link href="/Components/Assignments" passHref>
                  <Button
                    sx={{
                      ...(isActive("/Components/Assignments")
                        ? activeStyle
                        : { color: "white" }),
                      transition: "all 0.3s ease-in-out",
                      "&:hover": {
                        transform: "translateY(-3px)",
                        color: "#00BFFF",
                      },
                    }}
                  >
                    Assignment
                  </Button>
                </Link>
                <Link href="/Components/Test" passHref>
                  <Button
                    sx={{
                      ...(isActive("/Components/Test")
                        ? activeStyle
                        : { color: "white" }),
                      transition: "all 0.3s ease-in-out",
                      "&:hover": {
                        transform: "translateY(-3px)",
                        color: "#00BFFF",
                      },
                    }}
                  >
                    Test
                  </Button>
                </Link>
                {session?.user.email === "jayesh.surana@gmail.com" && (
                  <>
                    <Link href="/Components/GenerateTimeTable" passHref>
                      <Button
                        sx={{
                          ...(isActive("/Components/GenerateTimeTable")
                            ? activeStyle
                            : { color: "white" }),
                          transition: "all 0.3s ease-in-out",
                          "&:hover": {
                            transform: "translateY(-3px)",
                            color: "#00BFFF",
                          },
                        }}
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
                <Link href="/Components/StudentSection/studentHome" passHref>
                  <Button
                    sx={{
                      ...(isActive("/Components/StudentSection/studentHome")
                        ? activeStyle
                        : { color: "white" }),
                      transition: "all 0.3s ease-in-out",
                      "&:hover": {
                        transform: "translateY(-3px)",
                        color: "#00BFFF",
                      },
                    }}
                  >
                    Home
                  </Button>
                </Link>
                <Link href="/Components/StudentSection/Marksheet" passHref>
                  <Button
                    sx={{
                      ...(isActive("/Components/StudentSection/Marksheet")
                        ? activeStyle
                        : { color: "white" }),
                      transition: "all 0.3s ease-in-out",
                      "&:hover": {
                        transform: "translateY(-3px)",
                        color: "#00BFFF",
                      },
                    }}
                  >
                    View Result
                  </Button>
                </Link>
                <Link href="/Components/StudentSection/Assignment" passHref>
                  <Button
                    sx={{
                      ...(isActive("/Components/StudentSection/Assignment")
                        ? activeStyle
                        : { color: "white" }),
                      transition: "all 0.3s ease-in-out",
                      "&:hover": {
                        transform: "translateY(-3px)",
                        color: "#00BFFF",
                      },
                    }}
                  >
                    Assignment
                  </Button>
                </Link>
                <Link href="/Components/StudentSection/generateNotes" passHref>
                  <Button
                    sx={{
                      ...(isActive("/Components/StudentSection/generateNotes")
                        ? activeStyle
                        : { color: "white" }),
                      transition: "all 0.3s ease-in-out",
                      "&:hover": {
                        transform: "translateY(-3px)",
                        color: "#00BFFF",
                      },
                    }}
                  >
                    Generate Notes
                  </Button>
                </Link>
              </>
            )}
            <Link href="/Components/StudentSection/ShowTimeTable" passHref>
              <Button
                sx={{
                  ...(isActive("/Components/StudentSection/ShowTimeTable")
                    ? activeStyle
                    : { color: "white" }),
                  transition: "all 0.3s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    color: "#00BFFF",
                  },
                }}
              >
                Show Time Table
              </Button>
            </Link>
            <Button
              sx={{
                transition: "all 0.3s ease-in-out",
                "&:hover": {
                  transform: "translateY(-3px)",
                  color: "#00BFFF",
                },color: "white"
              }}
              onClick={handleLogout}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

<Drawer anchor="left" open={drawerOpen} onClose={handleDrawerToggle}>
  <Box
    sx={{
      width: 260,
      height: "100%",
      background: "rgba(0,0,0,0.85)",
      backdropFilter: "blur(12px)",
      color: "white",
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-between",
      p: 2,
    }}
    role="presentation"
    onClick={handleDrawerToggle}
    onKeyDown={handleDrawerToggle}
  >
    <List>
      {/* Teacher Section */}
      {session?.user.role === "teacher" && (
        <>
          <ListItem disablePadding>
            <Link href="/Components/Attendance" passHref>
              <Button
                fullWidth
                sx={{
                  justifyContent: "flex-start",
                  ...(isActive("/Components/Attendance") ? activeStyle : {}),
                }}
              >
                📋 Attendance
              </Button>
            </Link>
          </ListItem>
          <ListItem disablePadding>
            <Link href="/Components/GenerateMarksheet" passHref>
              <Button
                fullWidth
                sx={{
                  justifyContent: "flex-start",
                  ...(isActive("/Components/GenerateMarksheet") ? activeStyle : {}),
                }}
              >
                📝 Marksheet
              </Button>
            </Link>
          </ListItem>
          <ListItem disablePadding>
            <Link href="/Components/Assignments" passHref>
              <Button
                fullWidth
                sx={{
                  justifyContent: "flex-start",
                  ...(isActive("/Components/Assignments") ? activeStyle : {}),
                }}
              >
                📚 Assignment
              </Button>
            </Link>
          </ListItem>
          <ListItem disablePadding>
            <Link href="/Components/Test" passHref>
              <Button
                fullWidth
                sx={{
                  justifyContent: "flex-start",
                  ...(isActive("/Components/Test") ? activeStyle : {}),
                }}
              >
                🧪 Test
              </Button>
            </Link>
          </ListItem>
          {session?.user.email === "jayesh.surana@gmail.com" && (
            <ListItem disablePadding>
              <Link href="/Components/GenerateTimeTable" passHref>
                <Button
                  fullWidth
                  sx={{
                    justifyContent: "flex-start",
                    ...(isActive("/Components/GenerateTimeTable") ? activeStyle : {}),
                  }}
                >
                  📆 Generate Time Table
                </Button>
              </Link>
            </ListItem>
          )}
        </>
      )}

      {/* Student Section */}
      {session?.user.role === "student" && (
        <>
          <ListItem disablePadding>
            <Link href="/Components/StudentSection/studentHome" passHref>
              <Button
                fullWidth
                sx={{
                  justifyContent: "flex-start",
                  ...(isActive("/Components/StudentSection/studentHome") ? activeStyle : {}),
                }}
              >
                🏠 Home
              </Button>
            </Link>
          </ListItem>
          <ListItem disablePadding>
            <Link href="/Components/StudentSection/Marksheet" passHref>
              <Button
                fullWidth
                sx={{
                  justifyContent: "flex-start",
                  ...(isActive("/Components/StudentSection/Marksheet") ? activeStyle : {}),
                }}
              >
                📊 View Result
              </Button>
            </Link>
          </ListItem>
          <ListItem disablePadding>
            <Link href="/Components/StudentSection/Assignment" passHref>
              <Button
                fullWidth
                sx={{
                  justifyContent: "flex-start",
                  ...(isActive("/Components/StudentSection/Assignment") ? activeStyle : {}),
                }}
              >
                📚 Assignment
              </Button>
            </Link>
          </ListItem>
          <ListItem disablePadding>
            <Link href="/Components/StudentSection/generateNotes" passHref>
              <Button
                fullWidth
                sx={{
                  justifyContent: "flex-start",
                  ...(isActive("/Components/StudentSection/generateNotes") ? activeStyle : {}),
                }}
              >
                ✍️ Generate Notes
              </Button>
            </Link>
          </ListItem>
        </>
      )}

      {/* Common Section */}
      <ListItem disablePadding>
        <Link href="/Components/StudentSection/ShowTimeTable" passHref>
          <Button
            fullWidth
            sx={{
              justifyContent: "flex-start",
              ...(isActive("/Components/StudentSection/ShowTimeTable") ? activeStyle : {}),
            }}
          >
            📅 Show Time Table
          </Button>
        </Link>
      </ListItem>
    </List>

    {/* Logout Button */}
    <Box sx={{ p: 1 }}>
      <Button
        variant="outlined"
        fullWidth
        sx={{
          borderColor: "#00BFFF",
          color: "white",
          "&:hover": {
            background: "rgba(0,191,255,0.2)",
            borderColor: "#00BFFF",
            transform: "translateY(-2px)",
          },
        }}
        onClick={handleLogout}
      >
        🚪 Logout
      </Button>
    </Box>
  </Box>
</Drawer>

    </>
  );
};

export default NavBar;
