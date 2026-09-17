import React, { useMemo } from "react";
import { Card, CardContent, Typography, Box, Stack } from "@mui/material";
import ApexChart from "@/components/charts/ApexChart";
import { attendanceSummary } from "@/utils/attendance";

const options = {
  labels: ["Present", "Absent"],
  colors: ["#059669", "#F43F5E"],
  chart: { fontFamily: "Plus Jakarta Sans, sans-serif" },
  legend: { position: "bottom", fontFamily: "Plus Jakarta Sans, sans-serif" },
  dataLabels: { style: { fontFamily: "Plus Jakarta Sans, sans-serif" } },
  tooltip: { enabled: true },
  stroke: { width: 0 },
};

export default function AttendanceDonut({ attendanceData = [], studentName }) {
  const summary = useMemo(() => attendanceSummary(attendanceData), [attendanceData]);

  return (
    <Card sx={{ height: "100%" }}>
      <CardContent sx={{ p: 3 }}>
        <Stack spacing={0.5} sx={{ mb: 2 }}>
          <Typography
            variant="overline"
            sx={{ color: "text.secondary", letterSpacing: "0.08em" }}
          >
            Attendance
          </Typography>
          <Typography variant="h5">
            {studentName ? `${studentName.split(" ")[0]}’s presence` : "Your presence"}
          </Typography>
        </Stack>

        {summary.total > 0 ? (
          <>
            <Box sx={{ display: "flex", justifyContent: "center" }}>
              <ApexChart
                type="donut"
                height={300}
                series={[summary.present, summary.absent]}
                options={options}
              />
            </Box>
            {summary.percentage < 75 && (
              <Box
                sx={{
                  mt: 1,
                  px: 1.5,
                  py: 1,
                  borderRadius: 2,
                  bgcolor: "#FFF1F2",
                  color: "#9F1239",
                }}
              >
                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                  Attendance is below 75%. Catch up before it affects eligibility.
                </Typography>
              </Box>
            )}
          </>
        ) : (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography color="text.secondary">
              No classes have been recorded yet.
            </Typography>
          </Box>
        )}
      </CardContent>
    </Card>
  );
}
