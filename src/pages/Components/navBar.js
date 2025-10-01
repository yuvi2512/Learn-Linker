"use client";
import React, { useEffect, useState } from "react";
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
import { useRouter } from "next/router";

const NavBar = () => {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isActive = (pathname) => router.pathname === pathname;

  const activeStyle = {
    color: "#00BFFF",
    fontWeight: "bold",
    textShadow: "0 0 10px rgba(0, 191, 255, 0.8)",
  };

  useEffect(() => {
    if (router.pathname === "/") {
      router.push("/Components/Home");
    }
  }, [router.pathname]);

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  return (
    <>
      <AppBar
        position="absolute"
        sx={{
          backgroundColor: "rgba(0, 0, 0, 0.3)",
          boxShadow: "none",
          zIndex: 10,
        }}
      >
        <Toolbar>
          {/* Mobile Menu Button */}
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

          {/* Logo / Title */}
          <Typography
            variant="h5"
            component="div"
            sx={{
              flexGrow: 1,
              fontWeight: "bold",
              letterSpacing: "2px",
            }}
          >
            Learn Linker
          </Typography>

          {/* Desktop Navigation */}
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <Link href="/Components/Home" passHref>
              <Button
                sx={{
                  ...(isActive("/Components/Home")
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
            <Link href="/Login/Login" passHref>
              <Button
                sx={{
                  ...(isActive("/Login/Login")
                    ? activeStyle
                    : { color: "white" }),
                  transition: "all 0.3s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    color: "#00BFFF",
                  },
                }}
              >
                Login
              </Button>
            </Link>
            <Link href="/Register/Registration" passHref>
              <Button
                sx={{
                  ...(isActive("/Register/Registration")
                    ? activeStyle
                    : { color: "white" }),
                  transition: "all 0.3s ease-in-out",
                  "&:hover": {
                    transform: "translateY(-3px)",
                    color: "#00BFFF",
                  },
                }}
              >
                Register
              </Button>
            </Link>
          </Box>
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer anchor="left" open={drawerOpen} onClose={handleDrawerToggle}>
        <Box
          sx={{
            width: 250,
            height: "100%",
            background: "rgba(0,0,0,0.85)",
            backdropFilter: "blur(10px)",
            color: "white",
            display: "flex",
            flexDirection: "column",
            p: 2,
          }}
          role="presentation"
          onClick={handleDrawerToggle}
          onKeyDown={handleDrawerToggle}
        >
          <List>
            <ListItem disablePadding>
              <Link href="/Components/Home" passHref>
                <Button
                  fullWidth
                  sx={{
                    justifyContent: "flex-start",
                    ...(isActive("/Components/Home") ? activeStyle : {}),
                  }}
                >
                  🏠 Home
                </Button>
              </Link>
            </ListItem>
            <ListItem disablePadding>
              <Link href="/Login/Login" passHref>
                <Button
                  fullWidth
                  sx={{
                    justifyContent: "flex-start",
                    ...(isActive("/Login/Login") ? activeStyle : {}),
                  }}
                >
                  🔑 Login
                </Button>
              </Link>
            </ListItem>
            <ListItem disablePadding>
              <Link href="/Register/Registration" passHref>
                <Button
                  fullWidth
                  sx={{
                    justifyContent: "flex-start",
                    ...(isActive("/Register/Registration") ? activeStyle : {}),
                  }}
                >
                  📝 Register
                </Button>
              </Link>
            </ListItem>
          </List>
        </Box>
      </Drawer>
    </>
  );
};

export default NavBar;
