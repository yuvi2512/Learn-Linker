import React, { useEffect, useMemo, useState } from "react";
import {
  Grid,
  Card,
  CardContent,
  Typography,
  Box,
  Button,
  Stack,
  Chip,
  Divider,
  Skeleton,
} from "@mui/material";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import AssignmentOutlinedIcon from "@mui/icons-material/AssignmentOutlined";
import QuizOutlinedIcon from "@mui/icons-material/QuizOutlined";
import AssessmentOutlinedIcon from "@mui/icons-material/AssessmentOutlined";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import PersonAddAltOutlinedIcon from "@mui/icons-material/PersonAddAltOutlined";
import Link from "next/link";
import axios from "axios";
import moment from "moment";
import { useSession } from "next-auth/react";
import PageShell from "@/components/layout/PageShell";
import BatchPicker from "@/components/batches/BatchPicker";
import StatCard from "./StatCard";
import { useBatchSelection } from "@/hooks/useBatches";
import { ALL_BATCHES } from "@/utils/batches";
import { isPresent } from "@/utils/attendance";
import { isAdmin } from "@/utils/permissions";

const quickActions = [
  { href: "/batches", label: "Manage batches", icon: GroupsOutlinedIcon },
  { href: "/attendance", label: "Take attendance", icon: HowToRegOutlinedIcon },
  { href: "/assignments", label: "New assignment", icon: AssignmentOutlinedIcon },
  { href: "/tests", label: "Schedule test", icon: QuizOutlinedIcon },
  { href: "/results", label: "Publish results", icon: AssessmentOutlinedIcon },
];

const get = (url, config) =>
  axios
    .get(url, config)
    .then((res) => (Array.isArray(res.data) ? res.data : []))
    .catch(() => []);

export default function TeacherOverview() {
  const { data: session } = useSession();
  const { batches, loading: batchesLoading, batchId, setBatchId, selected } =
    useBatchSelection({ allowAll: true });

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState({
    students: [],
    attendance: [],
    tests: [],
    assignments: [],
  });

  useEffect(() => {
    let cancelled = false;
    const scope = batchId === ALL_BATCHES ? undefined : batchId;

    (async () => {
      setLoading(true);

      const [students, attendance, tests, assignments] = await Promise.all([
        get("/api/getStudentAPI", { params: { batchId: scope } }),
        get("/api/AttendanceAPI", {
          params: { service: "GETATTENDANCE", batchId: scope },
        }),
        get("/api/UpcomingTestAPI", { params: { batchId: scope } }),
        get("/api/AssignmentAPI", { params: { batchId: scope } }),
      ]);

      if (!cancelled) {
        setData({ students, attendance, tests, assignments });
        setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [batchId]);

  const stats = useMemo(() => {
    const { students, attendance, tests, assignments } = data;
    const today = moment().startOf("day");

    const dates = [
      ...new Set(attendance.map((row) => moment(row.date).format("YYYY-MM-DD"))),
    ].sort();

    const presentTotal = attendance.filter(isPresent).length;
    const averagePresence = attendance.length
      ? Math.round((presentTotal / attendance.length) * 100)
      : null;

    const lastDate = dates[dates.length - 1];
    const lastClassRows = lastDate
      ? attendance.filter(
          (row) => moment(row.date).format("YYYY-MM-DD") === lastDate
        )
      : [];

    const byStudent = new Map();
    attendance.forEach((row) => {
      const entry = byStudent.get(row.student_id) || {
        name: row.student_name,
        present: 0,
        total: 0,
      };
      entry.total += 1;
      if (isPresent(row)) entry.present += 1;
      byStudent.set(row.student_id, entry);
    });

    const atRisk = [...byStudent.values()]
      .filter((s) => s.total >= 3 && s.present / s.total < 0.75)
      .map((s) => ({ ...s, percentage: Math.round((s.present / s.total) * 100) }))
      .sort((a, b) => a.percentage - b.percentage)
      .slice(0, 5);

    const upcomingTests = tests
      .filter((t) => moment(t.date).isSameOrAfter(today))
      .sort((a, b) => moment(a.date) - moment(b.date))
      .slice(0, 4);

    const openAssignments = assignments
      .filter((a) => moment(a.end_date).isSameOrAfter(today))
      .sort((a, b) => moment(a.end_date) - moment(b.end_date));

    return {
      studentCount: students.length,
      classesHeld: dates.length,
      averagePresence,
      lastDate,
      lastClassPresent: lastClassRows.filter(isPresent).length,
      lastClassTotal: lastClassRows.length,
      atRisk,
      upcomingTests,
      openAssignments,
    };
  }, [data]);

  const firstName = session?.user?.name?.split(" ")[0] || "there";

  return (
    <PageShell
      title={`Good to see you, ${firstName}`}
      subtitle={
        selected
          ? `Where ${selected.name} stands today, and what still needs doing.`
          : "Where your students stand today, and what still needs doing."
      }
      action={
        <BatchPicker
          batches={batches}
          loading={batchesLoading}
          value={batchId}
          onChange={setBatchId}
          allowAll
          allLabel="All batches"
          helperText=" "
          sx={{ minWidth: 220 }}
        />
      }
    >
      {!batchesLoading && batches.length === 0 && (
        <Card sx={{ mb: 2.5, borderLeft: "4px solid", borderColor: "primary.main" }}>
          <CardContent
            sx={{
              p: 3,
              display: "flex",
              flexWrap: "wrap",
              gap: 2,
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <Box>
              <Typography variant="h6" sx={{ mb: 0.5 }}>
                Start by creating a batch
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Attendance, results, and timetables are all scoped to a batch, so
                you need at least one before you can mark a class.
              </Typography>
            </Box>
            <Button component={Link} href="/batches" variant="contained">
              Create a batch
            </Button>
          </CardContent>
        </Card>
      )}

      <Grid container spacing={2.5} sx={{ mb: 2.5 }}>
        {[
          {
            label: "Students on roll",
            value: stats.studentCount,
            hint: selected
              ? selected.name
              : `Across ${batches.length} ${batches.length === 1 ? "batch" : "batches"}`,
          },
          {
            label: "Classes held",
            value: stats.classesHeld,
            hint: stats.lastDate
              ? `Last on ${moment(stats.lastDate).format("DD MMM")}`
              : "No register yet",
          },
          {
            label: "Average attendance",
            value: stats.averagePresence === null ? "—" : `${stats.averagePresence}%`,
            tone:
              stats.averagePresence !== null && stats.averagePresence < 75
                ? "warning"
                : "default",
          },
          {
            label: "Open assignments",
            value: stats.openAssignments.length,
            hint: stats.openAssignments.length
              ? `Next due ${moment(stats.openAssignments[0].end_date).format("DD MMM")}`
              : "Nothing pending",
          },
        ].map((stat) => (
          <Grid item xs={12} sm={6} lg={3} key={stat.label}>
            {loading ? (
              <Skeleton variant="rounded" height={112} />
            ) : (
              <StatCard {...stat} />
            )}
          </Grid>
        ))}
      </Grid>

      <Grid container spacing={2.5}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 2 }}>
                Quick actions
              </Typography>
              <Stack spacing={1}>
                {[
                  ...(isAdmin(session?.user)
                    ? [
                        {
                          href: "/invites",
                          label: "Invite a teacher",
                          icon: PersonAddAltOutlinedIcon,
                        },
                      ]
                    : []),
                  ...quickActions,
                ].map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.href}
                      component={Link}
                      href={action.href}
                      variant="outlined"
                      startIcon={<Icon fontSize="small" />}
                      sx={{ justifyContent: "flex-start", py: 1.1 }}
                    >
                      {action.label}
                    </Button>
                  );
                })}
              </Stack>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 0.5 }}>
                Needs attention
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Students below 75% presence
              </Typography>

              {loading ? (
                <Skeleton variant="rounded" height={120} />
              ) : stats.atRisk.length === 0 ? (
                <Typography color="text.secondary" variant="body2">
                  Everyone is above the line. Nothing to chase.
                </Typography>
              ) : (
                <Stack divider={<Divider flexItem />} spacing={1.25}>
                  {stats.atRisk.map((student) => (
                    <Stack
                      key={student.name}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={1}
                    >
                      <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
                        {student.name}
                      </Typography>
                      <Chip
                        size="small"
                        color="warning"
                        variant="outlined"
                        label={`${student.percentage}%`}
                      />
                    </Stack>
                  ))}
                </Stack>
              )}
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: "100%" }}>
            <CardContent sx={{ p: 3 }}>
              <Typography variant="h6" sx={{ mb: 0.5 }}>
                Coming up
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Scheduled tests
              </Typography>

              {loading ? (
                <Skeleton variant="rounded" height={120} />
              ) : stats.upcomingTests.length === 0 ? (
                <Box>
                  <Typography color="text.secondary" variant="body2" sx={{ mb: 2 }}>
                    No tests on the calendar.
                  </Typography>
                  <Button component={Link} href="/tests" size="small" variant="outlined">
                    Schedule one
                  </Button>
                </Box>
              ) : (
                <Stack divider={<Divider flexItem />} spacing={1.25}>
                  {stats.upcomingTests.map((test) => (
                    <Stack
                      key={`${test.subject}-${test.date}`}
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={1}
                    >
                      <Typography variant="body2" noWrap sx={{ fontWeight: 600 }}>
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
        </Grid>
      </Grid>

      {!loading && stats.lastDate && (
        <Card sx={{ mt: 2.5 }}>
          <CardContent sx={{ p: 3 }}>
            <Typography variant="body2" color="text.secondary">
              Last register — {moment(stats.lastDate).format("dddd, DD MMM YYYY")}
            </Typography>
            <Typography variant="h6" sx={{ mt: 0.5 }}>
              {stats.lastClassPresent} of {stats.lastClassTotal} students present
            </Typography>
          </CardContent>
        </Card>
      )}
    </PageShell>
  );
}
