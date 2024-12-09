"use client";
import React from "react";
import {
  Button,
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
} from "@mui/material";
import Image from "next/image";

const Home = () => {
  return (
    <>
      <Box
        sx={{
          minHeight: "100vh",
          py: 6,
        }}
      >
        <Container maxWidth="lg">
          <Card sx={{ backgroundColor: "#fff", boxShadow: 3, borderRadius: 4 }}>
            <Box sx={{ textAlign: "center" }}>
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "left",
                  gap: 2,
                }}
              >
                <Image
                  src="/ProjectLogo.png"
                  alt="Learn Linker Logo"
                  width={200}
                  height={180}

                />
                <Box sx={{ ml: 8, textAlign: "center" }}>
                  <Typography variant="h2" component="h1" color="primary">
                    Welcome to Learn Linker
                  </Typography>
                  <Box
                    sx={{
                      borderBottom: "2px solid",
                      borderColor: "primary.main",
                      width: "75%",
                      margin: "8px auto",
                    }}
                  />
                  <Typography
                    variant="caption"
                    sx={{ fontSize: "0.90rem", color: "text.secondary" }}
                  >
                    Helping you manage coaching sessions and track progress
                    seamlessly.
                  </Typography>
                </Box>

              </Box>


            </Box>

            <Box sx={{ py: 6 }}>
              <Typography
                variant="h4"
                align="center"
                gutterBottom
                color="primary"
              >
                Our Services
              </Typography>
              <Grid container spacing={4} justifyContent="center">
                <Grid item xs={12} sm={6} md={4}>
                  <Card sx={{ boxShadow: 3, borderRadius: 4 }}>
                    <CardContent>
                      <Typography
                        variant="h5"
                        component="div"
                        color="secondary"
                      >
                        Session Scheduling
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Easily schedule and manage coaching sessions for your
                        clients.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card sx={{ boxShadow: 3, borderRadius: 4 }}>
                    <CardContent>
                      <Typography
                        variant="h5"
                        component="div"
                        color="secondary"
                      >
                        Progress Tracking
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Track the progress of your clients and provide feedback.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
                <Grid item xs={12} sm={6} md={4}>
                  <Card sx={{ boxShadow: 3, borderRadius: 4 }}>
                    <CardContent>
                      <Typography
                        variant="h5"
                        component="div"
                        color="secondary"
                      >
                        Communication Tools
                      </Typography>
                      <Typography variant="body2" color="textSecondary">
                        Communicate with clients via integrated messaging and
                        updates.
                      </Typography>
                    </CardContent>
                  </Card>
                </Grid>
              </Grid>
            </Box>
          </Card>
        </Container>
      </Box>
    </>
  );
};

export default Home;
