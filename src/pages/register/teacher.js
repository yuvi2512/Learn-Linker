"use client";
import React, { useEffect, useState } from "react";
import { Typography } from "@mui/material";
import Link from "next/link";
import RegisterForm from "@/components/auth/RegisterForm";

export default function RegisterTeacher() {
  // The server owns the decision; this only avoids showing a form that is
  // guaranteed to be rejected.
  const [enabled, setEnabled] = useState(null);

  useEffect(() => {
    let cancelled = false;

    fetch("/api/auth/register-teacher")
      .then((res) => res.json())
      .then((data) => {
        if (!cancelled) setEnabled(Boolean(data?.enabled));
      })
      .catch(() => {
        if (!cancelled) setEnabled(true);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <RegisterForm
      endpoint="/api/auth/register-teacher"
      title="Teacher sign-up"
      subtitle="Teacher accounts can see every student's records, so they need an invite code."
      panelTitle="Run the batch, not the paperwork."
      panelBody="Create batches, mark attendance, publish results, and schedule tests from one place."
      requireInviteCode
      inviteCodeHelp="Your administrator sends this. If you opened an invite link, it is already filled in."
      disabled={enabled === false}
      disabledMessage="Teacher sign-up is closed until an administrator sends you an invite."
      footer={
        <Typography variant="body2" color="text.secondary">
          Studying instead?{" "}
          <Link
            href="/register/student"
            style={{ color: "#2563EB", fontWeight: 600, textDecoration: "none" }}
          >
            Register as a student
          </Link>
        </Typography>
      }
    />
  );
}
