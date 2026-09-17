"use client";
import React, { useEffect } from "react";
import { Box, Typography, Card, CardActionArea, Stack } from "@mui/material";
import SchoolOutlinedIcon from "@mui/icons-material/SchoolOutlined";
import CoPresentOutlinedIcon from "@mui/icons-material/CoPresentOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/router";
import AuthShell from "@/components/layout/AuthShell";

const options = [
  {
    href: "/register/student",
    icon: SchoolOutlinedIcon,
    title: "I'm a student",
    body: "See your attendance, results, assignments, and timetable for the batches you are enrolled in.",
  },
  {
    href: "/register/teacher",
    icon: CoPresentOutlinedIcon,
    title: "I'm a teacher",
    body: "Create batches, mark attendance, and publish results. Your admin sends you an invite code.",
  },
];

export default function Register() {
  const { data: session } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (session) router.replace("/dashboard");
  }, [session, router]);

  return (
    <AuthShell
      title="Create your account"
      subtitle="Student and teacher accounts sign up separately, because teachers can see every student's records."
      panelTitle="One workspace for teachers and students."
      panelBody="Teachers run the batch. Students keep up with results, assignments, and notes."
    >
      <Stack spacing={2}>
        {options.map((option) => {
          const Icon = option.icon;
          return (
            <Card key={option.href} variant="outlined">
              <CardActionArea
                component={Link}
                href={option.href}
                sx={{ p: 2.5, display: "flex", alignItems: "flex-start", gap: 2 }}
              >
                <Box
                  sx={{
                    display: "grid",
                    placeItems: "center",
                    width: 44,
                    height: 44,
                    flexShrink: 0,
                    borderRadius: 2,
                    bgcolor: "rgba(37,99,235,0.1)",
                    color: "primary.main",
                  }}
                >
                  <Icon />
                </Box>
                <Box sx={{ flex: 1 }}>
                  <Typography sx={{ fontWeight: 700, mb: 0.25 }}>
                    {option.title}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {option.body}
                  </Typography>
                </Box>
                <ArrowForwardRoundedIcon
                  fontSize="small"
                  sx={{ color: "text.disabled", mt: 1.5 }}
                />
              </CardActionArea>
            </Card>
          );
        })}
      </Stack>

      <Box sx={{ mt: 3, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          Already registered?{" "}
          <Link
            href="/login"
            style={{ color: "#2563EB", fontWeight: 600, textDecoration: "none" }}
          >
            Sign in
          </Link>
        </Typography>
      </Box>
    </AuthShell>
  );
}
