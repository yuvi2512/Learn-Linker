"use client";
import React, { useEffect } from "react";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  IconButton,
  Box,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import Link from "next/link";
import { useRouter } from "next/router";

const NavBar = () => {
  const router = useRouter();
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

  return (
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
            '&:hover': {
              transform: "scale(1.1)",
            },
          }}
        >
          <MenuIcon />
        </IconButton>
        <Typography
          variant="h5"
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
          <Link href="/Components/Home" passHref>
            <Button
              sx={{
                ...(isActive("/Components/Home") ? activeStyle : { color: "white" }),
                transition: "all 0.3s ease-in-out",
                '&:hover': {
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
                ...(isActive("/Login/Login") ? activeStyle : { color: "white" }),
                transition: "all 0.3s ease-in-out",
                '&:hover': {
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
                ...(isActive("/Register/Registration") ? activeStyle : { color: "white" }),
                transition: "all 0.3s ease-in-out",
                '&:hover': {
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
  );
};

export default NavBar;