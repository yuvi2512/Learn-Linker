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
} from "@mui/material";
import { FormControlLabel } from "@mui/material";
import { useForm } from "react-hook-form";
import Image from "next/image";
import Link from "next/link";
import toast from "react-hot-toast";

const Register = () => {
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

  const [message, setMessage] = useState([]);

  useEffect(() => {
    if (isSubmitSuccessful) {
      reset();
    }
  }, [isSubmitSuccessful, reset]);

  const onSubmit = async (data) => {
    const name = data?.name;
    const email = data?.email;
    const password = data?.password;
    const role = data?.role_type;

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ name, email, password, role }),
    });

    const response = await res.json();
    console.log(response);

    if (res.ok) {
      toast.success("Registration successful!");
    } else {
      console.error(response.message);
    }
  };

  const watchPassword = watch("password");

  return (
    <>
      <Card sx={{ m: 5 }}>
        <CardHeader sx={{ pb: 2, pt: 2 }} title="Register Here!!" />
        <Divider />
        <CardContent sx={{ mt: 5 }}>
          <Grid container spacing={5}>
            <Grid item xs={12} sm={6}>
              <Image
                src="/registration.png"
                alt="Learn Linker Logo"
                width={500}
                height={500}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <Box sx={{ width: "100%", maxWidth: 400 }}>
                <Box sx={{ my: 2 }}>
                  <Typography variant="h3" sx={{ mb: 1.5 }}>
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
                        required: "email is Required",
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
                      type="text"
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
                        <Box
                          sx={{
                            display: "flex",
                            alignItems: "center",
                            flexWrap: "wrap",
                            justifyContent: "center",
                          }}
                        >
                          <Typography sx={{ color: "text.secondary" }}>
                            I agree to privacy policy & terms
                          </Typography>
                        </Box>
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
                      <Typography sx={{ color: "text.secondary", mr: 2 }}>
                        Already have an account?
                      </Typography>

                      <Typography>
                        <Link
                          href="/Login/Login"
                          style={{ textDecoration: "none" }}
                        >
                          Sign in instead
                        </Link>
                      </Typography>
                    </Box>
                  </Stack>
                </form>
              </Box>
            </Grid>
          </Grid>
        </CardContent>
      </Card>
    </>
  );
};

export default Register;
