import { Container, Typography, Box, Stack, Divider } from "@mui/material";
import Link from "next/link";

const sections = [
  {
    title: "What we store",
    body: "Your name, email address, role, and a hashed password. For students we also store attendance records, subject marks, and the assignments and tests published to your batch.",
  },
  {
    title: "Why we store it",
    body: "To run the institute: marking a register, publishing results, sharing assignments, and showing you the timetable. We do not sell or share this data with advertisers.",
  },
  {
    title: "Who can see what",
    body: "Students can only read their own attendance and marks. Teachers can see the students in the institute so they can mark registers and publish results. Passwords are hashed and never visible to anyone, including staff.",
  },
  {
    title: "Study notes",
    body: "When a student generates study notes, the subject and topic are sent to a third-party language model to produce the text. No personal details are included in that request.",
  },
  {
    title: "Keeping your account",
    body: "You can ask your institute administrator to correct or delete your account and its records at any time.",
  },
];

export default function Privacy() {
  return (
    <Box sx={{ bgcolor: "background.default", minHeight: "100vh" }}>
      <Container maxWidth="md" sx={{ py: { xs: 6, md: 9 } }}>
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
          Privacy & terms
        </Typography>
        <Typography variant="h3" sx={{ mb: 1.5 }}>
          What Learn Linker does with your data
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 5 }}>
          Plain language, no legal padding. This covers the data the app actually
          collects.
        </Typography>

        <Stack spacing={4} divider={<Divider flexItem />}>
          {sections.map((section) => (
            <Box key={section.title}>
              <Typography variant="h5" sx={{ mb: 1 }}>
                {section.title}
              </Typography>
              <Typography color="text.secondary">{section.body}</Typography>
            </Box>
          ))}
        </Stack>

        <Typography variant="body2" color="text.secondary" sx={{ mt: 6 }}>
          Questions about your data? Contact your institute administrator, or{" "}
          <Link href="/register" style={{ color: "#2563EB", textDecoration: "none" }}>
            create an account
          </Link>{" "}
          to get started.
        </Typography>
      </Container>
    </Box>
  );
}
