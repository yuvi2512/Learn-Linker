import {
  Container,
  Box,
  Typography,
  Button,
  Grid,
  Card,
  CardContent,
  Stack,
} from "@mui/material";
import Link from "next/link";
import { motion } from "framer-motion";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import InsightsOutlinedIcon from "@mui/icons-material/InsightsOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import DashboardOutlinedIcon from "@mui/icons-material/DashboardOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";

const features = [
  {
    title: "Attendance that actually gets taken",
    body: "Mark the class in seconds, then review presence across the term without exporting a spreadsheet.",
    icon: HowToRegOutlinedIcon,
  },
  {
    title: "Results without the paperwork",
    body: "Publish subject scores, let students download a clean marksheet, and keep a single source of truth.",
    icon: InsightsOutlinedIcon,
  },
  {
    title: "Assignments with due dates",
    body: "Share work once. Students see subject, brief, and deadline in one list — no group-chat archaeology.",
    icon: AssignmentOutlinedIcon,
  },
  {
    title: "Separate workspaces",
    body: "Teachers get operations. Students get a dashboard. Everyone sees only what they should.",
    icon: DashboardOutlinedIcon,
  },
  {
    title: "Upcoming tests in view",
    body: "Schedule exams, keep the calendar honest, and give students a week they can actually plan around.",
    icon: QuizOutlinedIcon,
  },
  {
    title: "Notes on demand",
    body: "Students generate structured study notes from a subject and topic, then save them as a PDF.",
    icon: AutoAwesomeOutlinedIcon,
  },
];

const steps = [
  {
    n: "01",
    title: "Create an account",
    body: "Register as a teacher or student. Your workspace opens with the right tools.",
  },
  {
    n: "02",
    title: "Run the class",
    body: "Take attendance, post assignments, schedule tests, and publish marks.",
  },
  {
    n: "03",
    title: "Stay aligned",
    body: "Students check results, timetable, and notes from one calm dashboard.",
  },
];

function MockDashboard() {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth: 520,
        borderRadius: 4,
        border: "1px solid rgba(255,255,255,0.12)",
        background:
          "linear-gradient(180deg, rgba(255,255,255,0.08), rgba(255,255,255,0.03))",
        boxShadow: "0 30px 80px rgba(2, 6, 23, 0.45)",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          display: "flex",
          gap: 1,
          p: 1.5,
          borderBottom: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {["#F87171", "#FBBF24", "#34D399"].map((c) => (
          <Box key={c} sx={{ width: 8, height: 8, borderRadius: "50%", bgcolor: c }} />
        ))}
      </Box>
      <Box sx={{ display: "grid", gridTemplateColumns: "72px 1fr", minHeight: 280 }}>
        <Box sx={{ p: 1.5, borderRight: "1px solid rgba(255,255,255,0.08)" }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <Box
              key={i}
              sx={{
                height: 8,
                borderRadius: 1,
                mb: 1.25,
                bgcolor: i === 1 ? "rgba(96,165,250,0.7)" : "rgba(255,255,255,0.12)",
              }}
            />
          ))}
        </Box>
        <Box sx={{ p: 2 }}>
          <Box
            sx={{
              height: 14,
              width: "42%",
              bgcolor: "rgba(255,255,255,0.7)",
              borderRadius: 1,
              mb: 1,
            }}
          />
          <Box
            sx={{
              height: 8,
              width: "70%",
              bgcolor: "rgba(255,255,255,0.2)",
              borderRadius: 1,
              mb: 2,
            }}
          />
          <Box sx={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 1.25 }}>
            {["92%", "6 tests", "Present", "Notes"].map((label) => (
              <Box
                key={label}
                sx={{
                  p: 1.5,
                  borderRadius: 2,
                  bgcolor: "rgba(255,255,255,0.06)",
                  border: "1px solid rgba(255,255,255,0.08)",
                }}
              >
                <Typography sx={{ color: "#F8FAFC", fontWeight: 700, fontSize: 16 }}>
                  {label}
                </Typography>
                <Box
                  sx={{
                    mt: 1,
                    height: 6,
                    width: "60%",
                    bgcolor: "rgba(255,255,255,0.16)",
                    borderRadius: 1,
                  }}
                />
              </Box>
            ))}
          </Box>
        </Box>
      </Box>
    </Box>
  );
}

export default function LandingPage() {
  return (
    <Box sx={{ bgcolor: "#F8FAFC" }}>
      <Box
        sx={{
          position: "relative",
          overflow: "hidden",
          color: "#F8FAFC",
          background:
            "radial-gradient(900px 420px at 10% -10%, rgba(37,99,235,0.55), transparent 50%), radial-gradient(700px 360px at 90% 10%, rgba(15,118,110,0.4), transparent 45%), #0B1426",
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 8, md: 12 } }}>
          <Grid container spacing={6} alignItems="center">
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Typography
                  sx={{
                    display: "inline-flex",
                    px: 1.5,
                    py: 0.5,
                    mb: 2.5,
                    borderRadius: 999,
                    fontSize: 12,
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    bgcolor: "rgba(37,99,235,0.2)",
                    color: "#93C5FD",
                    border: "1px solid rgba(147,197,253,0.25)",
                  }}
                >
                  Coaching management, without the clutter
                </Typography>
                <Typography
                  variant="h2"
                  sx={{
                    color: "#F8FAFC",
                    fontSize: { xs: "2.3rem", md: "3.2rem" },
                    mb: 2,
                  }}
                >
                  Run the class. Keep every student in the loop.
                </Typography>
                <Typography
                  sx={{
                    color: "rgba(248,250,252,0.72)",
                    fontSize: "1.15rem",
                    maxWidth: 520,
                    mb: 4,
                  }}
                >
                  Learn Linker is a focused workspace for coaching institutes —
                  attendance, marks, assignments, tests, and study notes in one place.
                </Typography>
                <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                  <Button
                    component={Link}
                    href="/register"
                    variant="contained"
                    size="large"
                    endIcon={<ArrowForwardRoundedIcon />}
                    sx={{ px: 3, py: 1.4 }}
                  >
                    Create your workspace
                  </Button>
                  <Button
                    component={Link}
                    href="/login"
                    variant="outlined"
                    size="large"
                    sx={{
                      px: 3,
                      py: 1.4,
                      color: "#F8FAFC",
                      borderColor: "rgba(255,255,255,0.24)",
                      background: "transparent",
                      "&:hover": {
                        borderColor: "rgba(255,255,255,0.5)",
                        background: "rgba(255,255,255,0.06)",
                      },
                    }}
                  >
                    Sign in
                  </Button>
                </Stack>
              </motion.div>
            </Grid>
            <Grid item xs={12} md={6}>
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
              >
                <Box
                  sx={{
                    display: "flex",
                    justifyContent: { xs: "flex-start", md: "flex-end" },
                  }}
                >
                  <MockDashboard />
                </Box>
              </motion.div>
            </Grid>
          </Grid>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <Box sx={{ maxWidth: 640, mb: 5 }}>
          <Typography
            sx={{
              color: "primary.main",
              fontWeight: 700,
              fontSize: 13,
              letterSpacing: "0.1em",
              textTransform: "uppercase",
              mb: 1,
            }}
          >
            What you get
          </Typography>
          <Typography variant="h3">
            Built for the day-to-day of an institute, not a demo reel.
          </Typography>
        </Box>
        <Grid container spacing={3}>
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Grid item xs={12} sm={6} md={4} key={feature.title}>
                <Card sx={{ height: "100%", p: 0.5 }}>
                  <CardContent sx={{ p: 2.5 }}>
                    <Box
                      sx={{
                        width: 40,
                        height: 40,
                        borderRadius: 2,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        bgcolor: "#EFF6FF",
                        color: "primary.main",
                        mb: 2,
                      }}
                    >
                      <Icon fontSize="small" />
                    </Box>
                    <Typography variant="h6" sx={{ mb: 1 }}>
                      {feature.title}
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      {feature.body}
                    </Typography>
                  </CardContent>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      </Container>

      <Box
        sx={{
          bgcolor: "#FFFFFF",
          borderTop: "1px solid #E8EEF5",
          borderBottom: "1px solid #E8EEF5",
        }}
      >
        <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
          <Typography variant="h3" sx={{ mb: 5 }}>
            Three steps. Then the work lives here.
          </Typography>
          <Grid container spacing={3}>
            {steps.map((step) => (
              <Grid item xs={12} md={4} key={step.n}>
                <Typography sx={{ color: "primary.main", fontWeight: 800, mb: 1 }}>
                  {step.n}
                </Typography>
                <Typography variant="h5" sx={{ mb: 1 }}>
                  {step.title}
                </Typography>
                <Typography color="text.secondary">{step.body}</Typography>
              </Grid>
            ))}
          </Grid>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 5 }}>
            <CheckCircleOutlineRoundedIcon color="primary" fontSize="small" />
            <Typography variant="body2" color="text.secondary">
              Role-based access for teachers and students from the first login.
            </Typography>
          </Stack>
        </Container>
      </Box>

      <Container maxWidth="lg" sx={{ py: { xs: 8, md: 10 } }}>
        <Card
          sx={{
            p: { xs: 3, md: 5 },
            background: "linear-gradient(135deg, #0B1426 0%, #1E3A8A 100%)",
            color: "#F8FAFC",
            border: "none",
          }}
        >
          <Grid container spacing={3} alignItems="center">
            <Grid item xs={12} md={8}>
              <Typography variant="h4" sx={{ color: "#F8FAFC", mb: 1 }}>
                Ready when the next batch starts.
              </Typography>
              <Typography sx={{ color: "rgba(248,250,252,0.7)" }}>
                Set up your account, invite the class, and stop running the institute
                from a pile of chats and sheets.
              </Typography>
            </Grid>
            <Grid item xs={12} md={4}>
              <Button
                component={Link}
                href="/register"
                variant="contained"
                size="large"
                fullWidth
                sx={{
                  py: 1.4,
                  bgcolor: "#FFFFFF",
                  color: "#0F172A",
                  "&:hover": { bgcolor: "#E2E8F0" },
                }}
              >
                Get started free
              </Button>
            </Grid>
          </Grid>
        </Card>
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={1}
          justifyContent="center"
          alignItems="center"
          sx={{ mt: 5, mb: 2 }}
        >
          <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
            © {new Date().getFullYear()} Learn Linker. Built for coaching institutes.
          </Typography>
          <Typography sx={{ color: "text.secondary", fontSize: 13 }}>
            <Link href="/privacy" style={{ color: "#2563EB", textDecoration: "none" }}>
              Privacy & terms
            </Link>
          </Typography>
        </Stack>
      </Container>
    </Box>
  );
}
