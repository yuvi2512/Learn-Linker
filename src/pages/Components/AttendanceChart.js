import React, { useState, useEffect } from "react";
import ReactApexcharts from "../react-apexcharts";
import { Card, Typography } from "@mui/material";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";

const AnalyticsPieStatusBreakdown = ({ attendanceData }) => {
  const [series, setSeries] = useState([0, 0]);
  const [attendancePercentage, setAttendancePercentage] = useState(100);

  useEffect(() => {
    if (attendanceData?.length > 0) {
      const totalDays = attendanceData.length;
      const totalPresent = attendanceData.filter((day) => day.present).length;
      const totalAbsent = attendanceData.filter((day) => day.absent).length;

      setSeries([totalPresent, totalAbsent]);

      const percentage = (totalPresent / totalDays) * 100;
      setAttendancePercentage(percentage);
    } else {
      setSeries([]); 
    }
  }, [attendanceData]);

  const options = {
    labels: ["Present", "Absent"],
    chart: {
      events: {
        dataPointSelection: (event, chartContext, config) => {
          const selectedLabel = options.labels[config.dataPointIndex];
          console.log(`You clicked on: ${selectedLabel}`);
        },
      },
    },
    tooltip: {
      enabled: true,
    },
  };

  return (
    <Card sx={{ height: "100%" }}>
      <CardHeader sx={{ pb: 0 }} title="Attendance" />
      <CardContent>
        {series.length > 0 ? (
          <ReactApexcharts
            type="pie"
            height={350}
            series={series}
            options={options}
          />
        ) : (
          <Typography color="primary" variant="h5" sx={{ mt: 2, textAlign: "center" }}>
            No classes have been held yet
          </Typography>
        )}

        {series.length > 0 && attendancePercentage < 75 && (
          <Typography color="error" sx={{ mt: 2 }}>
            Your attendance is low!
          </Typography>
        )}
      </CardContent>
    </Card>
  );
};

export default AnalyticsPieStatusBreakdown;
