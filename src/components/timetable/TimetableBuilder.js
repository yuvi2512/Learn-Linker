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
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import axios from "axios";
import toast from "react-hot-toast";
import PageShell from "@/components/layout/PageShell";
import BatchPicker from "@/components/batches/BatchPicker";
import { useBatchSelection } from "@/hooks/useBatches";
import { ALL_BATCHES } from "@/utils/batches";
import { WEEKDAYS, TIME_SLOTS } from "@/utils/timetable";

const emptyRow = {
  subject: "",
  teacherId: "",
  timeSlot: "",
  days: [],
};

function groupPeriods(rows) {
  const map = new Map();

  rows.forEach((row) => {
    const key = `${row.subject}|${row.teacher_id}|${row.timeslot}`;
    if (!map.has(key)) {
      map.set(key, {
        subject: row.subject || "",
        teacherId: row.teacher_id || "",
        timeSlot: row.timeslot || "",
        days: [],
      });
    }
    map.get(key).days.push(Number(row.day_of_week));
  });

  return [...map.values()].map((row) => ({
    ...row,
    days: [...new Set(row.days)].sort((a, b) => a - b),
  }));
}

export default function TimetableBuilder() {
  const { batches, loading: batchesLoading, batchId, setBatchId, selected } =
    useBatchSelection({ allowAll: true });

  const [teachers, setTeachers] = useState([]);
  const [periods, setPeriods] = useState([{ ...emptyRow }]);
  const [saving, setSaving] = useState(false);
  const [loadingGrid, setLoadingGrid] = useState(false);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await axios.get("/api/teachers");
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

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoadingGrid(true);
      try {
        const response = await axios.get("/api/TimeTableAPI", {
          params: { batchId: batchId === ALL_BATCHES ? undefined : batchId },
        });

        if (cancelled) return;

        const grouped = groupPeriods(Array.isArray(response.data) ? response.data : []);
        setPeriods(grouped.length > 0 ? grouped : [{ ...emptyRow }]);
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

  const handleChange = (index, field, value) => {
    setPeriods((prev) =>
      prev.map((row, i) => (i === index ? { ...row, [field]: value } : row))
    );
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const incomplete = periods.some(
      (row) => !row.subject || !row.teacherId || !row.timeSlot || row.days.length === 0
    );
    if (incomplete) {
      toast.error("Fill in every field and pick the weekdays for each period.");
      return;
    }

    setSaving(true);
    try {
      const response = await axios.post("/api/TimeTableAPI", {
        periods,
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
      subtitle="Choose the exact weekdays for each class. Publishing replaces this batch’s grid."
    >
      <Alert severity="info" sx={{ mb: 3, borderRadius: 2 }}>
        Pick Monday / Wednesday / Friday yourself — the grid no longer spreads
        classes across random days.
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
              canCreate
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
          <Stack spacing={2.5}>
            {periods.map((row, index) => (
              <Box
                key={index}
                sx={{
                  p: 2,
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 2,
                }}
              >
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      md: "1.2fr 1.2fr 1fr 48px",
                    },
                    gap: 1.5,
                    alignItems: "center",
                    mb: 1.5,
                  }}
                >
                  <TextField
                    fullWidth
                    label="Subject"
                    value={row.subject}
                    onChange={(event) =>
                      handleChange(index, "subject", event.target.value)
                    }
                  />
                  <TextField
                    select
                    fullWidth
                    label="Teacher"
                    value={row.teacherId}
                    onChange={(event) =>
                      handleChange(index, "teacherId", event.target.value)
                    }
                  >
                    {teachers.map((teacher) => (
                      <MenuItem key={teacher.id} value={teacher.id}>
                        {teacher.name}
                      </MenuItem>
                    ))}
                  </TextField>
                  <TextField
                    select
                    fullWidth
                    label="Time slot"
                    value={row.timeSlot}
                    onChange={(event) =>
                      handleChange(index, "timeSlot", event.target.value)
                    }
                  >
                    {TIME_SLOTS.map((slot) => (
                      <MenuItem key={slot} value={slot}>
                        {slot}
                      </MenuItem>
                    ))}
                  </TextField>
                  <IconButton
                    onClick={() =>
                      setPeriods(periods.filter((_, i) => i !== index))
                    }
                    aria-label="Remove period"
                    disabled={periods.length === 1}
                  >
                    <DeleteOutlineRoundedIcon />
                  </IconButton>
                </Box>
                <Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1 }}>
                  Days this class meets
                </Typography>
                <ToggleButtonGroup
                  value={row.days}
                  onChange={(_event, days) => handleChange(index, "days", days || [])}
                  size="small"
                >
                  {WEEKDAYS.map((day) => (
                    <ToggleButton key={day.value} value={day.value} sx={{ px: 1.5 }}>
                      {day.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
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
              onClick={() => setPeriods([...periods, { ...emptyRow }])}
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
