"use client";
import React from "react";
import { Typography } from "@mui/material";
import Link from "next/link";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterStudent() {
  return (
    <RegisterForm
      endpoint="/api/auth/register-student"
      title="Student sign-up"
      subtitle="Create your account, then a teacher will add you to your batch."
      panelTitle="Your class, without the group-chat scroll."
      panelBody="Attendance, marks, assignments, and the weekly timetable for every batch you are enrolled in."
      footer={
        <Typography variant="body2" color="text.secondary">
          Teaching instead?{" "}
          <Link
            href="/register/teacher"
            style={{ color: "#2563EB", fontWeight: 600, textDecoration: "none" }}
          >
            Register as a teacher
          </Link>
        </Typography>
      }
    />
  );
}
