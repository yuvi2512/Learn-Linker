"use client";
import React, { useState, useEffect } from "react";
import { TextField, Button, Stack, Typography, Alert, Box } from "@mui/material";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import AuthShell from "@/components/layout/AuthShell";

export default function Login() {
  const { register, handleSubmit, formState } = useForm({
    defaultValues: { email: "", password: "" },
  });
  const { errors } = formState;

  const { data: session } = useSession();
  const router = useRouter();
  const [loginError, setLoginError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Only allow same-origin paths back from ?next= to avoid open redirects.
  const next =
    typeof router.query.next === "string" && router.query.next.startsWith("/")
      ? router.query.next
      : "/dashboard";

  useEffect(() => {
    if (session) router.replace(next);
  }, [session, next, router]);

  const onSubmit = async (formData) => {
    setLoginError("");
    setSubmitting(true);

    const res = await signIn("credentials", {
      redirect: false,
      email: formData.email,
      password: formData.password,
    });

    if (res?.error) setLoginError(res.error);
    setSubmitting(false);
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to your teaching or student workspace."
      panelTitle="The day of class, already organized."
      panelBody="Open attendance, results, and assignments without hunting through chats. Your workspace is waiting."
    >
      <form noValidate onSubmit={handleSubmit(onSubmit)}>
        <Stack spacing={2.25}>
          <TextField
            label="Email"
            type="email"
            fullWidth
            autoComplete="email"
            {...register("email", {
              required: "Email is required",
              pattern: {
                value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                message: "Enter a valid email",
              },
            })}
            error={!!errors.email}
            helperText={errors.email?.message}
          />
          <TextField
            label="Password"
            type="password"
            fullWidth
            autoComplete="current-password"
            {...register("password", { required: "Password is required" })}
            error={!!errors.password}
            helperText={errors.password?.message}
          />
          {loginError && <Alert severity="error">{loginError}</Alert>}
          <Button
            type="submit"
            variant="contained"
            size="large"
            disabled={submitting}
            sx={{ py: 1.3 }}
          >
            {submitting ? "Signing in…" : "Sign in"}
          </Button>
        </Stack>
      </form>
      <Box sx={{ mt: 3, textAlign: "center" }}>
        <Typography variant="body2" color="text.secondary">
          New to Learn Linker?{" "}
          <Link
            href="/register"
            style={{ color: "#2563EB", fontWeight: 600, textDecoration: "none" }}
          >
            Create an account
          </Link>
        </Typography>
      </Box>
    </AuthShell>
  );
}
