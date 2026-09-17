import React, { useState } from "react";
import {
  AppBar,
  Toolbar,
  Button,
  IconButton,
  Box,
  Drawer,
  List,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import Link from "next/link";
import { useRouter } from "next/router";
import Logo from "./Logo";

const links = [
  { href: "/", label: "Product" },
  { href: "/privacy", label: "Privacy" },
  { href: "/login", label: "Sign in" },
];

export default function MarketingNav() {
  const router = useRouter();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const isActive = (href) => router.pathname === href;

  return (
    <>
      <AppBar
        position="sticky"
        elevation={0}
        sx={{
          backgroundColor: "rgba(255,255,255,0.86)",
          backdropFilter: "blur(16px)",
          borderBottom: "1px solid #E8EEF5",
          color: "text.primary",
        }}
      >
        <Toolbar sx={{ minHeight: 72, px: { xs: 2, md: 4 }, gap: 2 }}>
          <IconButton
            edge="start"
            aria-label="Open menu"
            onClick={() => setDrawerOpen(true)}
            sx={{ display: { xs: "inline-flex", md: "none" } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flexGrow: 1 }}>
            <Logo href="/" />
          </Box>

          <Box
            sx={{
              display: { xs: "none", md: "flex" },
              alignItems: "center",
              gap: 0.5,
            }}
          >
            {links.map((link) => (
              <Button
                key={link.href}
                component={Link}
                href={link.href}
                sx={{
                  color: isActive(link.href) ? "primary.main" : "text.secondary",
                  fontWeight: 600,
                }}
              >
                {link.label}
              </Button>
            ))}
            <Button component={Link} href="/register" variant="contained" sx={{ ml: 1 }}>
              Get started
            </Button>
          </Box>
        </Toolbar>
      </AppBar>

      <Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)}>
        <Box sx={{ width: 280, p: 2 }} role="presentation">
          <Box sx={{ display: "flex", justifyContent: "space-between", mb: 2 }}>
            <Logo href="/" />
            <IconButton onClick={() => setDrawerOpen(false)} aria-label="Close menu">
              <CloseIcon />
            </IconButton>
          </Box>
          <List>
            {links.map((link) => (
              <ListItemButton
                key={link.href}
                component={Link}
                href={link.href}
                selected={isActive(link.href)}
                onClick={() => setDrawerOpen(false)}
              >
                <ListItemText primary={link.label} />
              </ListItemButton>
            ))}
            <ListItemButton
              component={Link}
              href="/register"
              onClick={() => setDrawerOpen(false)}
            >
              <ListItemText primary="Get started" />
            </ListItemButton>
          </List>
        </Box>
      </Drawer>
    </>
  );
}
