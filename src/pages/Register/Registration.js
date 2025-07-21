"use client";
import React, { useEffect, useState } from "react";
import {
  TextField,
  Button,
  Stack,
  Card,
  CardHeader,
  Box,
  Typography,
  MenuItem,
  Checkbox,
  Divider,
  CardContent,
  Grid,
  useMediaQuery,
  useTheme,
  FormControlLabel,
} from "@mui/material";
import { useForm } from "react-hook-form";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";

const Register = () => {
  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm"));

  const form = useForm({
    defaultValues: {
      name: "",
      email: "",
      role_type: "",
      password: "",
      confirmPassword: "",
    },
  });

  const { register, handleSubmit, formState, reset, watch } = form;
  const { errors, isSubmitSuccessful } = formState;
  const watchPassword = watch("password");

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset();
    }
  }, [isSubmitSuccessful, reset]);

  const onSubmit = async (data) => {
    const { name, email, password, role_type } = data;

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, email, password, role: role_type }),
    });

    const response = await res.json();
    if (res.ok) {
      toast.success("Registration successful!");
    } else {
      console.error(response.message);
    }
  };

  return (
    <Card sx={{ m: 5 }}>
      <CardHeader sx={{ pb: 2, pt: 2 }} title="Register Here!!" />
      <Divider />
      <CardContent sx={{ mt: 4 }}>
        <Grid
          container
          spacing={4}
          direction={isSmallScreen ? "column" : "row"}
          alignItems="center"
        >
          <Grid item xs={12} sm={6}>
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
              }}
            >
              <Image
                src="/registration.png"
                alt="Learn Linker Logo"
                width={isSmallScreen ? 300 : 500}
                height={isSmallScreen ? 300 : 500}
                style={{ maxWidth: "100%", height: "auto" }}
              />
            </Box>
          </Grid>

          <Grid item xs={12} sm={6}>
            <Box sx={{ width: "100%", maxWidth: 400, mx: "auto" }}>
              <Box sx={{ my: 2 }}>
                <Typography variant="h4" sx={{ mb: 1.5 }}>
                  Learn Linker
                </Typography>
                <Typography sx={{ color: "text.secondary" }}>
                  Management System For Educational Institutes.
                </Typography>
              </Box>

              <form noValidate onSubmit={handleSubmit(onSubmit)}>
                <Stack spacing={2}>
                  <TextField
                    label="Name"
                    type="text"
                    {...register("name", {
                      required: "Name is Required",
                    })}
                    error={!!errors.name}
                    helperText={errors.name?.message}
                  />

                  <TextField
                    label="Email"
                    type="email"
                    {...register("email", {
                      required: "Email is Required",
                      pattern: {
                        value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
                        message: "Invalid Email Format",
                      },
                    })}
                    error={!!errors.email}
                    helperText={errors.email?.message}
                  />

                  <TextField
                    label="Role Type"
                    select
                    {...register("role_type", {
                      required: "Role Type is Required",
                    })}
                    error={!!errors.role_type}
                    helperText={errors.role_type?.message}
                  >
                    <MenuItem value="student">Student</MenuItem>
                    <MenuItem value="teacher">Teacher</MenuItem>
                  </TextField>

                  <TextField
                    label="Password"
                    type="password"
                    {...register("password", {
                      required: "Password is Required",
                      pattern: {
                        value:
                          /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/,
                        message:
                          "Password must be at least 6 characters long and contain at least one special character.",
                      },
                    })}
                    error={!!errors.password}
                    helperText={errors.password?.message}
                  />

                  <TextField
                    label="Confirm Password"
                    type="password"
                    {...register("confirmPassword", {
                      required: "Confirm Password is Required",
                      validate: (value) =>
                        value === watchPassword ||
                        "The passwords do not match",
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
                      <Typography sx={{ color: "text.secondary" }}>
                        I agree to privacy policy & terms
                      </Typography>
                    }
                  />

                  <Button type="submit" variant="contained" color="primary">
                    Sign Up
                  </Button>

                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      flexWrap: "wrap",
                      justifyContent: "center",
                    }}
                  >
                    <Typography sx={{ color: "text.secondary", mr: 1 }}>
                      Already have an account?
                    </Typography>
                    <Link href="/Login/Login" style={{ textDecoration: "none" }}>
                      <Typography color="primary">Sign in instead</Typography>
                    </Link>
                  </Box>
                </Stack>
              </form>
            </Box>
          </Grid>
        </Grid>
      </CardContent>
    </Card>
  );
};

export default Register;
