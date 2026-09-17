import React, { useEffect, useMemo, useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Stack,
  Divider,
  Box,
  Button,
  Chip,
  Skeleton,
} from "@mui/material";
import Link from "next/link";
import axios from "axios";
import moment from "moment";
import { useSession } from "next-auth/react";
import PageShell from "@/components/layout/PageShell";
import StatCard from "./StatCard";
import AttendanceDonut from "./AttendanceDonut";
import { useBatches } from "@/hooks/useBatches";
import { attendanceSummary } from "@/utils/attendance";

const get = (url) =>
  axios
    .get(url)
    .then((res) => (Array.isArray(res.data) ? res.data : []))
    .catch(() => []);

export default function StudentOverview() {
  const { data: session } = useSession();
  const { batches, loading: batchesLoading } = useBatches({ notifyOnError: false });
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({ attendance: [], tests: [], assignments: [] });

  useEffect(() => {
    if (!session?.user?.id) return;
    let cancelled = false;

    (async () => {
      const [attendance, tests, assignments] = await Promise.all([
        get("/api/getAttendance"),
        get("/api/UpcomingTestAPI"),
        get("/api/AssignmentAPI"),
      ]);

      if (!cancelled) {
        setData({ attendance, tests, assignments });
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id]);

  const summary = useMemo(() => attendanceSummary(data.attendance), [data.attendance]);

  const upcoming = useMemo(() => {
    const today = moment().startOf("day");

    return {
      tests: data.tests
        .filter((t) => moment(t.date).isSameOrAfter(today))
        .sort((a, b) => moment(a.date) - moment(b.date))
        .slice(0, 5),
      assignments: data.assignments
        .filter((a) => moment(a.end_date).isSameOrAfter(today))
        .sort((a, b) => moment(a.end_date) - moment(b.end_date))
        .slice(0, 5),
    };
  }, [data.tests, data.assignments]);

  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <PageShell
      title={`Welcome back, ${firstName}`}
      subtitle="Attendance, tests, and the rest of your class — in one view."
    >
      {!batchesLoading && (
        <Box sx={{ mb: 2.5, display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
          <Typography variant="body2" color="text.secondary">
            {batches.length > 0 ? "Your batches:" : "You are not in a batch yet — ask your teacher to add you."}
          </Typography>
          {batches.map((batch) => (
            <Chip
              key={batch.id}
              size="small"
              variant="outlined"
              label={batch.subject ? `${batch.name} · ${batch.subject}` : batch.name}
            />
          ))}
        </Box>
      )}

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        {[
          {
            label: "Attendance",
            value: summary.total ? `${summary.percentage}%` : "—",
            tone: summary.total && summary.percentage < 75 ? "warning" : "default",
          },
          { label: "Classes recorded", value: summary.total },
          { label: "Days present", value: summary.present },
          {
            label: "Assignments due",
            value: upcoming.assignments.length,
            hint: upcoming.assignments.length
              ? `Next ${moment(upcoming.assignments[0].end_date).format("DD MMM")}`
              : "Nothing pending",
          },
        ].map((stat) => (
          <Grid item xs={12} sm={6} lg={3} key={stat.label}>
            {loading ? <Skeleton variant="rounded" height={112} /> : <StatCard {...stat} />}
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={6}>
          <AttendanceDonut
            attendanceData={data.attendance}
            studentName={session?.user?.name}
          />
        </Grid>

        <Grid item xs={12} md={6}>
          <Stack spacing={2.5} sx={{ height: "100%" }}>
            <Card>
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="overline"
                  sx={{ color: "text.secondary", letterSpacing: "0.08em" }}
                >
                  Calendar
                </Typography>
                <Typography variant="h5" sx={{ mb: 2 }}>
                  Upcoming tests
                </Typography>

                {loading ? (
                  <Skeleton variant="rounded" height={100} />
                ) : upcoming.tests.length === 0 ? (
                  <Typography color="text.secondary" variant="body2">
                    Nothing scheduled yet.
                  </Typography>
                ) : (
                  <Stack divider={<Divider flexItem />} spacing={1.25}>
                    {upcoming.tests.map((test) => (
                      <Stack
                        key={`${test.subject}-${test.date}`}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={1}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                          {test.subject}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {moment(test.date).format("DD MMM")}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>

            <Card sx={{ flex: 1 }}>
              <CardContent sx={{ p: 3 }}>
                <Typography
                  variant="overline"
                  sx={{ color: "text.secondary", letterSpacing: "0.08em" }}
                >
                  Work
                </Typography>
                <Typography variant="h5" sx={{ mb: 2 }}>
                  Due soon
                </Typography>

                {loading ? (
                  <Skeleton variant="rounded" height={100} />
                ) : upcoming.assignments.length === 0 ? (
                  <Box>
                    <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
                      No assignments pending.
                    </Typography>
                    <Button
                      component={Link}
                      href="/assignments"
                      size="small"
                      variant="outlined"
                    >
                      View all
                    </Button>
                  </Box>
                ) : (
                  <Stack divider={<Divider flexItem />} spacing={1.25}>
                    {upcoming.assignments.map((assignment) => (
                      <Stack
                        key={assignment.id}
                        direction="row"
                        justifyContent="space-between"
                        alignItems="center"
                        spacing={1}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 600 }} noWrap>
                          {assignment.subject}
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          {moment(assignment.end_date).format("DD MMM")}
                        </Typography>
                      </Stack>
                    ))}
                  </Stack>
                )}
              </CardContent>
            </Card>
          </Stack>
        </Grid>
      </Grid>
    </PageShell>
  );
}
