"use client";
import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Stack,
  Typography,
  Checkbox,
  Box,
  FormControlLabel,
  Alert,
} from "@mui/material";
import { useForm } from "react-hook-form";
import Link from "next/link";
import { signIn, useSession } from "next-auth/react";
import { useRouter } from "next/router";
import toast from "react-hot-toast";
import AuthShell from "@/components/layout/AuthShell";

/**
 * Shared sign-up form. The caller picks the endpoint, and the endpoint decides
 * the role — nothing here can change what kind of account gets created.
 */
export default function RegisterForm({
  endpoint,
  title,
  subtitle,
  panelTitle,
  panelBody,
  requireInviteCode = false,
  inviteCodeHelp,
  disabled = false,
  disabledMessage,
  footer,
}) {
  const { register, handleSubmit, formState, watch, setValue } = useForm({
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
      inviteCode: "",
    },
  });
  const { errors, isSubmitting } = formState;

  const { data: session } = useSession();
  const router = useRouter();
  const [formError, setFormError] = useState("");

  const watchPassword = watch("password");
  const prefilledCode =
    typeof router.query.code === "string" ? router.query.code : "";

  useEffect(() => {
    if (session) router.replace("/dashboard");
  }, [session, router]);

  useEffect(() => {
    if (prefilledCode) setValue("inviteCode", prefilledCode);
  }, [prefilledCode, setValue]);

  const onSubmit = async (data) => {
    setFormError("");
    const { name, email, password, inviteCode } = data;

    const res = await fetch(endpoint, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, inviteCode }),
    });

    const response = await res.json().catch(() => ({}));

    if (!res.ok) {
      setFormError(response.message || "Registration failed.");
      return;
    }

    toast.success("Account created. Signing you in…");

    const signInRes = await signIn("credentials", {
      redirect: false,
      email,
      password,
    });

    if (signInRes?.error) {
      router.push("/login");
    }
  };

  return (
    <AuthShell
      title={title}
      subtitle={subtitle}
      panelTitle={panelTitle}
      panelBody={panelBody}
    >
      {disabled ? (
        <Alert severity="warning">{disabledMessage}</Alert>
      ) : (
        <form noValidate onSubmit={handleSubmit(onSubmit)}>
          <Stack spacing={2}>
            <TextField
              label="Full name"
              fullWidth
              autoComplete="name"
              {...register("name", { required: "Name is required" })}
              error={!!errors.name}
              helperText={errors.name?.message}
            />

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

            {requireInviteCode && (
              <TextField
                label="Teacher invite code"
                fullWidth
                {...register("inviteCode", {
                  required: "An invite code is required",
                })}
                error={!!errors.inviteCode}
                helperText={errors.inviteCode?.message || inviteCodeHelp}
              />
            )}

            <TextField
              label="Password"
              type="password"
              fullWidth
              autoComplete="new-password"
              {...register("password", {
                required: "Password is required",
                pattern: {
                  value:
                    /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/,
                  message:
                    "At least 6 characters, with a letter, number, and special character.",
                },
              })}
              error={!!errors.password}
              helperText={errors.password?.message}
            />

            <TextField
              label="Confirm password"
              type="password"
              fullWidth
              autoComplete="new-password"
              {...register("confirmPassword", {
                required: "Please confirm your password",
                validate: (value) =>
                  value === watchPassword || "Passwords do not match",
              })}
              error={!!errors.confirmPassword}
              helperText={errors.confirmPassword?.message}
            />

            <FormControlLabel
              control={
                <Checkbox
                  {...register("privacyPolicy", {
                    required: "You must agree to the privacy policy",
                  })}
                />
              }
              label={
                <Typography variant="body2" color="text.secondary">
                  I agree to the{" "}
                  <Link
                    href="/privacy"
                    style={{ color: "#2563EB", textDecoration: "none" }}
                  >
                    privacy policy and terms
                  </Link>
                </Typography>
              }
            />
            {errors.privacyPolicy && (
              <Typography variant="caption" color="error">
                {errors.privacyPolicy.message}
              </Typography>
            )}

            {formError && <Alert severity="error">{formError}</Alert>}

            <Button
              type="submit"
              variant="contained"
              size="large"
              disabled={isSubmitting}
              sx={{ py: 1.3 }}
            >
              {isSubmitting ? "Creating account…" : "Create account"}
            </Button>
          </Stack>
        </form>
      )}

      <Box sx={{ mt: 3, textAlign: "center" }}>
        {footer}
        <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
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
