import { Box, Typography, Stack } from "@mui/material";

export default function PageShell({
  title,
  subtitle,
  action,
  children,
  maxWidth = 1280,
}) {
  return (
    <Box
      sx={{
        width: "100%",
        maxWidth,
        mx: "auto",
        px: { xs: 2, sm: 3, lg: 4 },
        py: { xs: 3, md: 4 },
      }}
    >
      {(title || action) && (
        <Stack
          direction={{ xs: "column", sm: "row" }}
          spacing={2}
          alignItems={{ xs: "flex-start", sm: "center" }}
          justifyContent="space-between"
          sx={{ mb: 3 }}
        >
          <Box>
            {title && (
              <Typography variant="h4" sx={{ mb: subtitle ? 0.5 : 0 }}>
                {title}
              </Typography>
            )}
            {subtitle && (
              <Typography variant="body2" color="text.secondary">
                {subtitle}
              </Typography>
            )}
          </Box>
          {action ? <Box sx={{ flexShrink: 0 }}>{action}</Box> : null}
        </Stack>
      )}
      {children}
    </Box>
  );
}
