import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  TextField,
  Button,
  MenuItem,
  IconButton,
  Stack,
  Typography,
  Box,
  Alert,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import axios from "axios";
import toast from "react-hot-toast";
import PageShell from "@/components/layout/PageShell";
import BatchPicker from "@/components/batches/BatchPicker";
import { useBatchSelection } from "@/hooks/useBatches";
import { ALL_BATCHES } from "@/utils/batches";

const timeSlots = [
  "8-9 AM",
  "9-10 AM",
  "10-11 AM",
  "11-12 PM",
  "12-1 PM",
  "2-3 PM",
  "3-4 PM",
];

const emptyRow = {
  subject: "",
  teacherId: "",
  classesPerWeek: "",
  timeSlot: "",
};

export default function TimetableBuilder() {
  // A NULL batch is the institute-wide grid every batch falls back to.
  const { batches, loading: batchesLoading, batchId, setBatchId, selected } =
    useBatchSelection({ allowAll: true });

  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([{ ...emptyRow }]);
  const [saving, setSaving] = useState(false);
  const [loadingGrid, setLoadingGrid] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await axios.get("/api/AttendanceAPI", {
          params: { service: "GETTEACHERS" },
        });
        if (!cancelled && Array.isArray(response.data)) setTeachers(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        if (!cancelled) toast.error("Could not load the teacher list.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Load whatever is already published for this batch, so publishing edits the
  // existing grid instead of starting from a blank one.
  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingGrid(true);
      try {
        const response = await axios.get("/api/TimeTableAPI", {
          params: { batchId: batchId === ALL_BATCHES ? undefined : batchId },
        });

        if (cancelled) return;

        const existing = (Array.isArray(response.data) ? response.data : []).map(
          (row) => ({
            subject: row.subject || "",
            teacherId: row.teachername || "",
            classesPerWeek: String(row.classesperweek ?? ""),
            timeSlot: row.timeslot || "",
          })
        );

        setSubjects(existing.length > 0 ? existing : [{ ...emptyRow }]);
      } catch (error) {
        console.error("Error loading timetable:", error);
        if (!cancelled) toast.error("Could not load the current timetable.");
      } finally {
        if (!cancelled) setLoadingGrid(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [batchId]);

  const handleChange = (index, event) => {
    const { name, value } = event.target;
    setSubjects((prev) =>
      prev.map((subject, i) => (i === index ? { ...subject, [name]: value } : subject))
    );
  };

  const handleAddRow = () => setSubjects([...subjects, { ...emptyRow }]);

  const handleRemoveRow = (index) =>
    setSubjects(subjects.filter((_, i) => i !== index));

  const handleSubmit = async (event) => {
    event.preventDefault();

    const incomplete = subjects.some(
      (row) => !row.subject || !row.teacherId || !row.classesPerWeek || !row.timeSlot
    );
    if (incomplete) {
      toast.error("Fill in every field before publishing.");
      return;
    }

    setSaving(true);
    try {
      const response = await axios.post("/api/TimeTableAPI", {
        timetable: subjects,
        batchId: batchId === ALL_BATCHES ? null : batchId,
      });
      if (response.status === 200) {
        toast.success("Timetable published.");
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error(error?.response?.data?.message || "Could not publish the timetable.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      title="Build timetable"
      subtitle="Add subjects, teachers, weekly load, and a preferred slot for one batch."
    >
      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        Publishing replaces this batch&apos;s timetable only, so include every period
        you want it to show. Other batches keep their own grid.
      </Alert>

      <Card>
        <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Box sx={{ mb: 2.5 }}>
            <BatchPicker
              batches={batches}
              loading={batchesLoading}
              value={batchId}
              onChange={setBatchId}
              allowAll
              label="Timetable for"
              allLabel="All students (shared grid)"
              helperText={
                selected
                  ? `Only ${selected.name} will see this grid.`
                  : "Shown to every student who has no batch timetable of their own."
              }
            />
          </Box>

          <Typography variant="subtitle2" sx={{ mb: 1.5, color: "text.secondary" }}>
            Periods
          </Typography>
          <Stack spacing={2}>
            {subjects.map((subjectRow, index) => (
              <Box
                key={index}
                sx={{
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "1.2fr 1.2fr 0.8fr 1fr 48px",
                  },
                  gap: 1.5,
                  alignItems: "center",
                  p: { xs: 1.5, md: 0 },
                  border: { xs: "1px solid", md: "none" },
                  borderColor: { xs: "divider" },
                  borderRadius: 2,
                }}
              >
                <TextField
                  fullWidth
                  label="Subject"
                  name="subject"
                  value={subjectRow.subject}
                  onChange={(event) => handleChange(index, event)}
                />
                <TextField
                  select
                  fullWidth
                  label="Teacher"
                  name="teacherId"
                  value={subjectRow.teacherId}
                  onChange={(event) => handleChange(index, event)}
                >
                  {teachers.map((teacher) => (
                    <MenuItem key={teacher.id || teacher.name} value={teacher.name}>
                      {teacher.name}
                    </MenuItem>
                  ))}
                </TextField>
                <TextField
                  fullWidth
                  label="Classes / week"
                  name="classesPerWeek"
                  type="number"
                  value={subjectRow.classesPerWeek}
                  onChange={(event) => handleChange(index, event)}
                />
                <TextField
                  select
                  fullWidth
                  label="Time slot"
                  name="timeSlot"
                  value={subjectRow.timeSlot}
                  onChange={(event) => handleChange(index, event)}
                >
                  {timeSlots.map((slot) => (
                    <MenuItem key={slot} value={slot}>
                      {slot}
                    </MenuItem>
                  ))}
                </TextField>
                <IconButton
                  onClick={() => handleRemoveRow(index)}
                  aria-label="Remove period"
                  disabled={subjects.length === 1}
                >
                  <DeleteOutlineRoundedIcon />
                </IconButton>
              </Box>
            ))}
          </Stack>

          <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ mt: 3 }}>
            <Button
              onClick={handleSubmit}
              variant="contained"
              size="large"
              disabled={saving || loadingGrid}
            >
              {saving ? "Publishing…" : "Publish timetable"}
            </Button>
            <Button
              onClick={handleAddRow}
              variant="outlined"
              size="large"
              startIcon={<AddRoundedIcon />}
            >
              Add period
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </PageShell>
  );
}
