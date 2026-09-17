import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  MenuItem,
  IconButton,
  Stack,
  Typography,
  Box,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import axios from "axios";
import toast from "react-hot-toast";
import PageShell from "@/components/layout/PageShell";
import BatchPicker from "@/components/batches/BatchPicker";
import { useBatchSelection } from "@/hooks/useBatches";

export default function PublishResults() {
  const { batches, loading: batchesLoading, batchId, setBatchId } =
    useBatchSelection();

  const [selectedStudent, setSelectedStudent] = useState("");
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([{ subject: "", marks: "" }]);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    // Switching batch invalidates the student choice.
    setSelectedStudent("");

    if (!batchId) {
      setStudents([]);
      return undefined;
    }

    let cancelled = false;

    (async () => {
      try {
        const response = await axios.get("/api/getStudentAPI", {
          params: { batchId },
        });
        if (!cancelled && Array.isArray(response.data)) setStudents(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        if (!cancelled) toast.error("Could not load the student list.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [batchId]);

  const handleAddRow = () => {
    setSubjects([...subjects, { subject: "", marks: "" }]);
  };

  const handleRemoveRow = (index) => {
    setSubjects(subjects.filter((_, i) => i !== index));
  };

  const handleSubjectChange = (index, event) => {
    const { name, value } = event.target;
    setSubjects(
      subjects.map((row, i) => (i === index ? { ...row, [name]: value } : row))
    );
  };

  const selectedStudentInfo = students.find(
    (student) => student.id === selectedStudent
  );

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!batchId) {
      toast.error("Pick a batch first.");
      return;
    }

    if (!selectedStudentInfo) {
      toast.error("Pick a student first.");
      return;
    }

    const filled = subjects.filter((row) => row.subject && row.marks !== "");
    if (filled.length === 0) {
      toast.error("Add at least one subject and its marks.");
      return;
    }

    setSaving(true);
    try {
      const response = await axios.post("/api/MarksheetAPI", {
        batchId,
        subjects: filled.map((row) => ({
          ...row,
          studentId: selectedStudentInfo.id,
          studentName: selectedStudentInfo.name,
        })),
      });

      if (response.status === 200) {
        toast.success("Marksheet saved.");
        setSelectedStudent("");
        setSubjects([{ subject: "", marks: "" }]);
      }
    } catch (error) {
      console.error("Error saving marksheet:", error);
      toast.error(error?.response?.data?.message || "Could not save the marksheet.");
    } finally {
      setSaving(false);
    }
  };

  const studentHelpText = !batchId
    ? "Pick a batch first."
    : students.length === 0
    ? "No students on this batch's roll yet."
    : " ";

  return (
    <PageShell
      title="Publish results"
      subtitle="Pick a batch and a student, add subject scores, and save their marksheet."
    >
      <Card>
        <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Box sx={{ mb: 1 }}>
            <BatchPicker
              batches={batches}
              loading={batchesLoading}
              value={batchId}
              onChange={setBatchId}
              helperText=" "
            />
          </Box>

          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <TextField
                select
                fullWidth
                label="Student"
                value={selectedStudent}
                disabled={!batchId || students.length === 0}
                onChange={(event) => setSelectedStudent(event.target.value)}
                helperText={studentHelpText}
              >
                {students.map((student) => (
                  <MenuItem key={student.id} value={student.id}>
                    {student.name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Student ID"
                value={selectedStudentInfo ? selectedStudentInfo.id : ""}
                disabled
                helperText=" "
              />
            </Grid>
          </Grid>

          <Typography variant="subtitle2" sx={{ mt: 2, mb: 1.5, color: "text.secondary" }}>
            Subjects
          </Typography>

          <Stack spacing={1.5}>
            {subjects.map((subjectRow, index) => (
              <Box
                key={index}
                sx={{
                  display: "grid",
                  gridTemplateColumns: { xs: "1fr", sm: "1fr 160px 48px" },
                  gap: 1.5,
                  alignItems: "center",
                }}
              >
                <TextField
                  fullWidth
                  label="Subject"
                  name="subject"
                  value={subjectRow.subject}
                  onChange={(event) => handleSubjectChange(index, event)}
                />
                <TextField
                  fullWidth
                  label="Marks"
                  name="marks"
                  type="number"
                  value={subjectRow.marks}
                  onChange={(event) => handleSubjectChange(index, event)}
                />
                <IconButton
                  onClick={() => handleRemoveRow(index)}
                  aria-label="Remove subject"
                  disabled={subjects.length === 1}
                  sx={{ color: "text.secondary" }}
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
              disabled={saving}
            >
              {saving ? "Saving…" : "Save marksheet"}
            </Button>
            <Button
              type="button"
              variant="outlined"
              size="large"
              startIcon={<AddRoundedIcon />}
              onClick={handleAddRow}
            >
              Add subject
            </Button>
          </Stack>
        </CardContent>
      </Card>
    </PageShell>
  );
}
