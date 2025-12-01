"use client";
import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Divider,
} from "@mui/material";
import Link from "next/link";
import { motion } from "framer-motion";

export default function Home() {
  return (
    <>
      <Box
        sx={{
          background: "linear-gradient(135deg, #4f46e5, #9333ea, #ec4899)",
        }}
      >
        <Box
          sx={{
            display: "flex",
            flexDirection: { xs: "column", md: "row" },
            minHeight: "90vh",

            color: "white",
            overflow: "hidden",
            position: "relative",
          }}
        >
          <Box
            sx={{
              position: "absolute",
              width: 300,
              height: 300,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.1)",
              top: 50,
              left: -100,
              filter: "blur(100px)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              width: 250,
              height: 250,
              borderRadius: "50%",
              background: "rgba(255,255,255,0.15)",
              bottom: -50,
              right: -80,
              filter: "blur(120px)",
            }}
          />

          <Box
            sx={{
              flex: 1,
              display: "flex",
              flexDirection: "column",
              justifyContent: "center",
              alignItems: { xs: "center", md: "flex-start" },
              px: { xs: 3, md: 6 },
              textAlign: { xs: "center", md: "left" },
            }}
          >
            <motion.div
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1 }}
            >
              <Typography
                variant="h2"
                fontWeight="bold"
                sx={{
                  fontStyle: "italic",
                  color: "white",
                  textShadow: "0px 4px 10px rgba(0,0,0,0.3)",
                }}
              >
                Welcome to Learn Linker
              </Typography>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 50 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 1, delay: 0.4 }}
            >
              <Typography
                variant="h4"
                sx={{
                  mt: 2,
                  fontWeight: "500",
                  fontStyle: "italic",
                  color: "#f3f4f6",
                }}
              >
                The <b>ultimate</b> coaching management system for{" "}
                <i>students</i> and <i>teachers</i>
              </Typography>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.8, delay: 0.8 }}
            >
              <Button
                variant="contained"
                size="large"
                sx={{
                  mt: 4,
                  px: 4,
                  py: 1.5,
                  borderRadius: "30px",
                  background: "linear-gradient(90deg,#ec4899,#9333ea,#4f46e5)",
                  boxShadow: "0px 5px 20px rgba(0,0,0,0.4)",
                  textTransform: "none",
                  "&:hover": {
                    transform: "scale(1.05)",
                    transition: "0.3s ease-in-out",
                  },
                }}
              >
                <Link
                  href="/Register/Registration"
                  style={{ textDecoration: "none", color: "white" }}
                >
                  Get Started 🚀
                </Link>
              </Button>
            </motion.div>
          </Box>

          {/* Image Section */}
          <Box
            sx={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              px: { xs: 3, md: 6 },
              mt: { xs: 4, md: 0 },
            }}
          >
            <motion.img
              src="/dashboard.png"
              alt="Dashboard Preview"
              style={{
                width: "100%",
                maxWidth: "500px",
                borderRadius: "20px",
                boxShadow: "0px 10px 30px rgba(0,0,0,0.4)",
              }}
              initial={{ opacity: 0, x: 100 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1 }}
            />
          </Box>
        </Box>
        <Divider
          sx={{
            bgcolor: "rgba(255, 255, 255, 0.2)",
            border: "1px solid black",
          }}
        />
        {/* Features Section */}
        <Container sx={{ py: 8 }}>
          <Typography
            variant="h3"
            textAlign="center"
            fontWeight="bold"
            gutterBottom
            sx={{ color: "#4f46e5" }}
          >
            ✨ Key Features
          </Typography>

          <Grid container spacing={4} sx={{ mt: 2 }}>
            {[
              "📚 Manage Courses",
              "📈 Track Student Progress",
              "📝 Create Assignments",
              "🎓 Teacher & Student Dashboards",
              "📊 Test & Marks Management",
              "⚡ Real-Time Performance Insights",
            ].map((feature, index) => (
              <Grid item xs={12} sm={6} md={4} key={index}>
                <motion.div
                  whileHover={{ scale: 1.08 }}
                  transition={{ type: "spring", stiffness: 200 }}
                >
                  <Card
                    sx={{
                      borderRadius: "20px",
                      textAlign: "center",
                      p: 2,
                      height: "100%",
                      boxShadow: "0px 6px 20px rgba(0,0,0,0.1)",
                      background: "linear-gradient(135deg,#f9fafb,#e0e7ff)",
                    }}
                  >
                    <CardContent>
                      <Typography variant="h6" fontWeight="600">
                        {feature}
                      </Typography>
                    </CardContent>
                  </Card>
                </motion.div>
              </Grid>
            ))}
          </Grid>
        </Container>
      </Box>
    </>
  );
}
