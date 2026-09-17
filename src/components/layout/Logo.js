import { Box, Typography } from "@mui/material";
import Link from "next/link";

export default function Logo({ inverted = false, href = "/", compact = false }) {
  const mark = (
    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25, minWidth: 0 }}>
      <Box
        sx={{
          width: compact ? 32 : 36,
          height: compact ? 32 : 36,
          borderRadius: "10px",
          background: "linear-gradient(135deg, #2563EB 0%, #0F766E 100%)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          color: "#fff",
          fontWeight: 800,
          fontSize: compact ? 12 : 13,
          letterSpacing: "-0.04em",
          flexShrink: 0,
          boxShadow: "0 6px 16px rgba(37, 99, 235, 0.28)",
        }}
      >
        LL
      </Box>
      {!compact && (
        <Box sx={{ minWidth: 0 }}>
          <Typography
            sx={{
              fontWeight: 800,
              letterSpacing: "-0.04em",
              fontSize: "1.05rem",
              lineHeight: 1.1,
              color: inverted ? "#F8FAFC" : "#0F172A",
            }}
          >
            Learn Linker
          </Typography>
          <Typography
            sx={{
              fontSize: 11,
              color: inverted ? "rgba(248,250,252,0.55)" : "#64748B",
              letterSpacing: "0.04em",
              fontWeight: 500,
            }}
          >
            Coaching OS
          </Typography>
        </Box>
      )}
    </Box>
  );

  if (!href) return mark;

  return (
    <Link href={href} style={{ textDecoration: "none" }}>
      {mark}
    </Link>
  );
}
