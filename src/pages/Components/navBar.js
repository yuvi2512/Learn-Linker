"use client";
import React,{useEffect} from "react";
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
    color: "black",
    fontWeight: "bold",
  };

  useEffect(() => {
    if (router.pathname === "/") {
      router.push("/Components/Home");
    }
  }, [router.pathname]);

  return (
    <>
      <AppBar position="static" color="primary">
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2, display: { xs: "block", md: "none" } }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Learn Linker
          </Typography>
          <Box sx={{ display: { xs: "none", md: "block" } }}>
            <Link href="/Components/Home" passHref>
              <Button
                sx={
                  isActive("/Components/Home")
                    ? activeStyle
                    : { color: "white" }
                }
              >
                Home
              </Button>
            </Link>
            <Link href="/Login/Login" passHref>
              <Button
                sx={isActive("/Login/Login") ? activeStyle : { color: "white" }}
              >
                Login
              </Button>
            </Link>
          </Box>
        </Toolbar>
      </AppBar>
    </>
  );
};

export default NavBar;
