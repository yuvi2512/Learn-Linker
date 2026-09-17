import { Box, Typography } from "@mui/material";
import Logo from "./Logo";

export default function AuthShell({
  kicker,
  title,
  subtitle,
  children,
  panelTitle,
  panelBody,
}) {
  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: { xs: "1fr", md: "1.05fr 0.95fr" },
      }}
    >
      <Box
        sx={{
          display: { xs: "none", md: "flex" },
          flexDirection: "column",
          justifyContent: "space-between",
          p: { md: 6, lg: 8 },
          color: "#F8FAFC",
          background:
            "radial-gradient(1200px 500px at -10% -20%, rgba(37,99,235,0.45), transparent 50%), radial-gradient(900px 400px at 110% 120%, rgba(15,118,110,0.4), transparent 45%), #0B1426",
        }}
      >
        <Logo inverted href="/" />
        <Box sx={{ maxWidth: 480 }}>
          <Typography
            sx={{
              fontSize: 13,
              fontWeight: 700,
              letterSpacing: "0.14em",
              textTransform: "uppercase",
              color: "#93C5FD",
              mb: 2,
            }}
          >
            {kicker || "For institutes that take teaching seriously"}
          </Typography>
          <Typography
            variant="h3"
            sx={{ color: "#F8FAFC", mb: 2, fontSize: { md: "2.1rem", lg: "2.4rem" } }}
          >
            {panelTitle}
          </Typography>
          <Typography sx={{ color: "rgba(248,250,252,0.72)", fontSize: "1.05rem" }}>
            {panelBody}
          </Typography>
        </Box>
        <Typography sx={{ color: "rgba(248,250,252,0.4)", fontSize: 13 }}>
          Attendance, results, assignments, and study notes — in one workspace.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          px: { xs: 2.5, sm: 5 },
          py: { xs: 5, md: 8 },
          background: "#F4F7FB",
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 440 }}>
          <Box sx={{ display: { xs: "block", md: "none" }, mb: 4 }}>
            <Logo href="/" />
          </Box>
          <Typography variant="h4" sx={{ mb: 1 }}>
            {title}
          </Typography>
          <Typography color="text.secondary" sx={{ mb: 4 }}>
            {subtitle}
          </Typography>
          {children}
        </Box>
      </Box>
    </Box>
  );
}
