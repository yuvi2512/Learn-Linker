import React, { useState, useEffect, useCallback, useMemo } from "react";
import {
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tabs,
  Tab,
  Typography,
  Box,
  Button,
  Stack,
  Chip,
  Avatar,
  List,
  ListItemButton,
  ListItemAvatar,
  ListItemText,
  Skeleton,
} from "@mui/material";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import CheckCircleOutlineRoundedIcon from "@mui/icons-material/CheckCircleOutlineRounded";
import HighlightOffRoundedIcon from "@mui/icons-material/HighlightOffRounded";
import HowToRegOutlinedIcon from "@mui/icons-material/HowToRegOutlined";
import moment from "moment";
import axios from "axios";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import PageShell from "@/components/layout/PageShell";
import BatchPicker from "@/components/batches/BatchPicker";
import { useBatchSelection } from "@/hooks/useBatches";
import { isPresent, toDateKey } from "@/utils/attendance";
import { isAdmin } from "@/utils/permissions";

function StudentRoll({ students, presentIds, onToggle, readOnly }) {
  if (students.length === 0) {
    return (
      <Box sx={{ py: 6, textAlign: "center" }}>
        <Typography color="text.secondary">
          No students on this batch&apos;s roll yet.
        </Typography>
      </Box>
    );
  }

  return (
    <List disablePadding>
      {students.map((student) => {
        const id = String(student.id);
        const present = presentIds.has(id);
        return (
          <ListItemButton
            key={id}
            onClick={readOnly ? undefined : () => onToggle(id)}
            selected={!readOnly && present}
            sx={{
              mb: 1,
              borderRadius: 2,
              border: "1px solid",
              borderColor: present ? "success.light" : "divider",
              bgcolor: present ? "rgba(5,150,105,0.06)" : "background.paper",
            }}
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: present ? "#059669" : "#94A3B8", fontWeight: 700 }}>
                {(student.name || "?").charAt(0).toUpperCase()}
              </Avatar>
            </ListItemAvatar>
            <ListItemText
              primary={student.name}
              primaryTypographyProps={{ fontWeight: 600 }}
            />
            <Chip
              size="small"
              color={present ? "success" : "default"}
              variant={present ? "filled" : "outlined"}
              icon={
                present ? (
                  <CheckCircleOutlineRoundedIcon />
                ) : (
                  <HighlightOffRoundedIcon />
                )
              }
              label={present ? "Present" : "Absent"}
            />
          </ListItemButton>
        );
      })}
    </List>
  );
}

export default function AttendanceManager() {
  const { data: session } = useSession();
  const {
    batches,
    loading: batchesLoading,
    batchId,
    setBatchId,
    selected,
  } = useBatchSelection();

  const [tab, setTab] = useState(0);
  const [students, setStudents] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [presentIds, setPresentIds] = useState(() => new Set());
  const [selectedDate, setSelectedDate] = useState("");
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [viewing, setViewing] = useState(null);

  const takenDates = useMemo(
    () => new Set(sessions.map((session) => toDateKey(session.date))),
    [sessions]
  );

  const fetchRoll = useCallback(async () => {
    if (!batchId) {
      setStudents([]);
      return;
    }

    try {
      const response = await axios.get("/api/getStudentAPI", {
        params: { batchId },
      });
      setStudents(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Could not load the student list.");
    }
  }, [batchId]);

  const fetchSessions = useCallback(async () => {
    if (!batchId) {
      setSessions([]);
      return;
    }

    setLoadingList(true);
    try {
      const response = await axios.get("/api/AttendanceAPI", {
        params: { service: "SESSIONS", batchId },
      });
      setSessions(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error getting attendance:", error);
      toast.error("Could not load the attendance register.");
    } finally {
      setLoadingList(false);
    }
  }, [batchId]);

  useEffect(() => {
    fetchRoll();
    fetchSessions();
    setPresentIds(new Set());
    setSelectedDate("");
    setEditing(false);
    setTab(0);
  }, [fetchRoll, fetchSessions]);

  const toggleStudent = (id) => {
    setPresentIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const loadDay = async (date, { forEdit } = {}) => {
    try {
      const response = await axios.get("/api/AttendanceAPI", {
        params: { service: "REGISTER", batchId, selectedDate: date },
      });
      const rows = Array.isArray(response.data) ? response.data : [];
      const present = new Set(
        rows.filter(isPresent).map((row) => String(row.student_id))
      );

      if (forEdit) {
        setSelectedDate(date);
        setPresentIds(present);
        setEditing(true);
        setTab(1);
        return;
      }

      setViewing({
        date,
        students: rows.map((row) => ({
          id: row.student_id,
          name: row.student_name,
          present: isPresent(row),
        })),
      });
    } catch (error) {
      console.error("Error loading register:", error);
      toast.error("Could not load that class.");
    }
  };

  const handleDateChange = (value) => {
    if (!editing && takenDates.has(value)) {
      toast.error("Attendance for that day is already saved. Edit it from the register.");
      return;
    }
    setSelectedDate(value);
    if (!editing) setPresentIds(new Set());
  };

  const handleSubmit = async () => {
    if (!batchId) {
      toast.error("Pick a batch first.");
      return;
    }
    if (!selectedDate) {
      toast.error("Pick a class date first.");
      return;
    }
    if (!editing && takenDates.has(selectedDate)) {
      toast.error("Attendance for that day is already saved. Edit it from the register.");
      return;
    }
    if (students.length === 0) {
      toast.error("There are no students on this batch's roll.");
      return;
    }

    setSaving(true);
    try {
      await axios.post("/api/AttendanceAPI", {
        batchId,
        date: selectedDate,
        presentIds: [...presentIds],
        replace: editing,
      });
      toast.success(editing ? "Attendance updated." : "Attendance saved.");
      await fetchSessions();
      setPresentIds(new Set());
      setSelectedDate("");
      setEditing(false);
      setTab(0);
    } catch (error) {
      console.error("Error submitting attendance:", error);
      toast.error(error?.response?.data?.message || "Could not save attendance.");
    } finally {
      setSaving(false);
    }
  };

  const cancelEdit = () => {
    setEditing(false);
    setSelectedDate("");
    setPresentIds(new Set());
  };

  const presentPreview = presentIds.size;
  const absentPreview = Math.max(students.length - presentPreview, 0);
  const dateTaken = Boolean(selectedDate && takenDates.has(selectedDate) && !editing);

  return (
    <PageShell
      title="Attendance"
      subtitle="Record a class as a session, then edit it later if someone was marked wrong."
    >
      <Card>
        <Box sx={{ px: 2, pt: 2 }}>
          <BatchPicker
            batches={batches}
            loading={batchesLoading}
            value={batchId}
            onChange={setBatchId}
            canCreate={isAdmin(session?.user)}
            helperText={
              selected
                ? `${selected.student_count} ${
                    selected.student_count === 1 ? "student" : "students"
                  } on the roll`
                : " "
            }
          />
        </Box>
        <Box sx={{ px: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Tabs value={tab} onChange={(event, value) => setTab(value)}>
            <Tab label="Sessions" />
            <Tab label={editing ? "Edit attendance" : "Take attendance"} />
          </Tabs>
        </Box>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {!batchId && !batchesLoading ? (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <HowToRegOutlinedIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
              <Typography variant="h6" sx={{ mb: 0.5 }}>
                No batch selected
              </Typography>
              <Typography color="text.secondary">
                {isAdmin(session?.user)
                  ? "Create a batch and add students to start taking attendance."
                  : "Ask your admin to assign you to a batch."}
              </Typography>
            </Box>
          ) : tab === 0 ? (
            loadingList ? (
              <Stack spacing={1.5}>
                {[0, 1, 2].map((key) => (
                  <Skeleton key={key} variant="rounded" height={72} />
                ))}
              </Stack>
            ) : sessions.length === 0 ? (
              <Box sx={{ py: 8, textAlign: "center" }}>
                <Typography variant="h6" sx={{ mb: 0.5 }}>
                  No classes recorded
                </Typography>
                <Typography color="text.secondary">
                  Switch to Take attendance to record the first class for this batch.
                </Typography>
              </Box>
            ) : (
              <Stack spacing={1.5}>
                {sessions.map((session) => {
                  const date = toDateKey(session.date);
                  const percent = session.total
                    ? Math.round((session.present_count / session.total) * 100)
                    : 0;
                  return (
                    <Box
                      key={date}
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        gap: 1.5,
                        alignItems: "center",
                        justifyContent: "space-between",
                        p: 2,
                        border: "1px solid",
                        borderColor: "divider",
                        borderRadius: 2,
                      }}
                    >
                      <Box>
                        <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                          {moment(date).format("dddd, DD MMM YYYY")}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {session.present_count} of {session.total} present · {percent}%
                        </Typography>
                      </Box>
                      <Stack direction="row" spacing={1}>
                        <Button
                          variant="outlined"
                          onClick={() => loadDay(date)}
                        >
                          View
                        </Button>
                        <Button
                          variant="contained"
                          startIcon={<EditOutlinedIcon />}
                          onClick={() => loadDay(date, { forEdit: true })}
                        >
                          Edit
                        </Button>
                      </Stack>
                    </Box>
                  );
                })}
              </Stack>
            )
          ) : (
            <Stack spacing={3}>
              {editing && (
                <Chip
                  color="info"
                  variant="outlined"
                  label={`Editing ${moment(selectedDate).format("DD MMM YYYY")} — this replaces the saved register.`}
                  onDelete={cancelEdit}
                />
              )}
              <TextField
                variant="outlined"
                label="Class date"
                type="date"
                value={selectedDate}
                disabled={editing}
                InputLabelProps={{ shrink: true }}
                sx={{ maxWidth: 280 }}
                helperText={
                  dateTaken
                    ? "Already recorded. Use Edit on the sessions list."
                    : " "
                }
                error={dateTaken}
                onChange={(e) => handleDateChange(e.target.value)}
              />
              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                {[
                  { label: "On roll", value: students.length },
                  { label: "Present", value: presentPreview, color: "success" },
                  { label: "Absent", value: absentPreview, color: "warning" },
                ].map((stat) => (
                  <Chip
                    key={stat.label}
                    label={`${stat.label}: ${stat.value}`}
                    color={stat.color || "default"}
                    variant={stat.color ? "outlined" : "filled"}
                    sx={{ height: 36, px: 0.5, fontSize: 13 }}
                  />
                ))}
              </Stack>
              <StudentRoll
                students={students}
                presentIds={presentIds}
                onToggle={toggleStudent}
              />
              <Box>
                <Button
                  variant="contained"
                  size="large"
                  onClick={handleSubmit}
                  disabled={saving || dateTaken || !selectedDate}
                >
                  {saving
                    ? "Saving…"
                    : editing
                    ? "Save changes"
                    : "Submit attendance"}
                </Button>
                {editing && (
                  <Button sx={{ ml: 1.5 }} onClick={cancelEdit}>
                    Cancel
                  </Button>
                )}
              </Box>
            </Stack>
          )}
        </CardContent>
      </Card>

      <Dialog
        open={Boolean(viewing)}
        onClose={() => setViewing(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {viewing ? moment(viewing.date).format("dddd, DD MMM YYYY") : ""}
        </DialogTitle>
        <DialogContent>
          {viewing && (
            <StudentRoll
              students={viewing.students}
              presentIds={
                new Set(
                  viewing.students
                    .filter((student) => student.present)
                    .map((student) => String(student.id))
                )
              }
              readOnly
            />
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setViewing(null)}>Close</Button>
          {viewing && (
            <Button
              variant="contained"
              startIcon={<EditOutlinedIcon />}
              onClick={() => {
                const date = viewing.date;
                setViewing(null);
                loadDay(date, { forEdit: true });
              }}
            >
              Edit this class
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </PageShell>
  );
}
