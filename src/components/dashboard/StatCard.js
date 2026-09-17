import { Card, CardContent, Typography, Box } from "@mui/material";

export default function StatCard({ label, value, hint, tone = "default" }) {
  const toneColor =
    tone === "warning" ? "warning.main" : tone === "success" ? "success.main" : "text.primary";

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ py: 2.5, px: 3 }}>
        <Typography variant="body2" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h4" sx={{ mt: 0.5, color: toneColor }}>
          {value}
        </Typography>
        {hint && (
          <Box sx={{ mt: 0.5 }}>
            <Typography variant="caption" color="text.secondary">
              {hint}
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
