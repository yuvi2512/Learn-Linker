import React, { useEffect, useState } from "react";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  MenuItem,
  Stack,
  Typography,
  Box,
  Avatar,
  Chip,
} from "@mui/material";
import axios from "axios";
import toast from "react-hot-toast";
import moment from "moment";
import { useSession } from "next-auth/react";
import PageShell from "@/components/layout/PageShell";
import BatchPicker from "@/components/batches/BatchPicker";
import { useBatchSelection } from "@/hooks/useBatches";
import { isAdmin } from "@/utils/permissions";

const STANDALONE = "standalone";

export default function PublishResults() {
  const { data: session } = useSession();
  const { batches, loading: batchesLoading, batchId, setBatchId } =
    useBatchSelection();

  const [students, setStudents] = useState([]);
  const [tests, setTests] = useState([]);
  const [testId, setTestId] = useState(STANDALONE);
  const [subject, setSubject] = useState("");
  const [maxMarks, setMaxMarks] = useState("100");
  const [scores, setScores] = useState({});
  const [saving, setSaving] = useState(false);
  const [loadingScores, setLoadingScores] = useState(false);

  const selectedTest = tests.find((test) => String(test.id) === String(testId));

  useEffect(() => {
    setTestId(STANDALONE);
    setSubject("");
    setScores({});

    if (!batchId) {
      setStudents([]);
      setTests([]);
      return undefined;
    }

    let cancelled = false;

    (async () => {
      try {
        const [roster, upcoming] = await Promise.all([
          axios.get("/api/getStudentAPI", { params: { batchId } }),
          axios.get("/api/UpcomingTestAPI", { params: { batchId } }),
        ]);
        if (cancelled) return;
        setStudents(Array.isArray(roster.data) ? roster.data : []);
        const forBatch = (Array.isArray(upcoming.data) ? upcoming.data : []).filter(
          (test) => !test.batch_id || test.batch_id === batchId
        );
        setTests(forBatch);
      } catch (error) {
        console.error("Error fetching data:", error);
        if (!cancelled) toast.error("Could not load the class list.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [batchId]);

  useEffect(() => {
    if (selectedTest) {
      setSubject(selectedTest.subject || "");
      setMaxMarks(String(selectedTest.max_marks || 100));
    }
  }, [selectedTest]);

  useEffect(() => {
    if (!batchId || students.length === 0) return undefined;

    let cancelled = false;

    (async () => {
      setLoadingScores(true);
      try {
        const response = await axios.get("/api/MarksheetAPI", {
          params: {
            batchId,
            testId: testId === STANDALONE ? undefined : testId,
            subject: testId === STANDALONE ? subject || undefined : undefined,
          },
        });
        if (cancelled) return;
        const next = {};
        (Array.isArray(response.data) ? response.data : []).forEach((row) => {
          if (row.marks_obtained != null) {
            next[row.student_id] = String(row.marks_obtained);
          }
        });
        setScores(next);
      } catch (error) {
        console.error("Error loading scores:", error);
      } finally {
        if (!cancelled) setLoadingScores(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [batchId, testId, subject, students.length]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!batchId) {
      toast.error("Pick a batch first.");
      return;
    }

    const subjectName = selectedTest?.subject || subject.trim();
    if (!subjectName) {
      toast.error("Add a subject, or pick a test.");
      return;
    }

    const filled = students
      .map((student) => ({
        studentId: student.id,
        marks: scores[student.id],
      }))
      .filter((row) => row.marks !== "" && row.marks != null);

    if (filled.length === 0) {
      toast.error("Enter marks for at least one student.");
      return;
    }

    setSaving(true);
    try {
      await axios.post("/api/MarksheetAPI", {
        batchId,
        testId: testId === STANDALONE ? null : testId,
        subject: subjectName,
        maxMarks: Number(maxMarks) || 100,
        scores: filled,
      });
      toast.success("Results saved. Saving again will update, not duplicate.");
    } catch (error) {
      console.error("Error saving marksheet:", error);
      toast.error(error?.response?.data?.message || "Could not save the marksheet.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <PageShell
      title="Publish results"
      subtitle="Enter the whole class at once. Link scores to a test to keep marksheets and the calendar in step."
    >
      <Card>
        <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Grid container spacing={2.5} sx={{ mb: 1 }}>
            <Grid item xs={12} sm={4}>
              <BatchPicker
                batches={batches}
                loading={batchesLoading}
                value={batchId}
                onChange={setBatchId}
                canCreate={isAdmin(session?.user)}
                helperText=" "
                sx={{ width: "100%" }}
              />
            </Grid>
            <Grid item xs={12} sm={4}>
              <TextField
                select
                fullWidth
                label="Linked test"
                value={testId}
                disabled={!batchId}
                onChange={(event) => setTestId(event.target.value)}
                helperText={
                  selectedTest
                    ? moment(selectedTest.date).format("DD MMM YYYY")
                    : "Or publish a standalone subject score."
                }
              >
                <MenuItem value={STANDALONE}>Not linked to a test</MenuItem>
                {tests.map((test) => (
                  <MenuItem key={test.id} value={test.id}>
                    {test.subject}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                label="Subject"
                value={selectedTest ? selectedTest.subject : subject}
                disabled={Boolean(selectedTest)}
                onChange={(event) => setSubject(event.target.value)}
                helperText=" "
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                label="Out of"
                type="number"
                value={maxMarks}
                onChange={(event) => setMaxMarks(event.target.value)}
                helperText=" "
              />
            </Grid>
          </Grid>

          {!batchId ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography color="text.secondary">Pick a batch to enter marks.</Typography>
            </Box>
          ) : students.length === 0 ? (
            <Box sx={{ py: 6, textAlign: "center" }}>
              <Typography color="text.secondary">
                No students on this batch&apos;s roll yet.
              </Typography>
            </Box>
          ) : (
            <Stack spacing={1.25} sx={{ mb: 3 }}>
              {students.map((student) => (
                <Stack
                  key={student.id}
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1.5}
                  alignItems={{ sm: "center" }}
                  sx={{
                    p: 1.5,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1 }}>
                    <Avatar sx={{ bgcolor: "#2563EB", width: 36, height: 36, fontSize: 14 }}>
                      {(student.name || "?").charAt(0).toUpperCase()}
                    </Avatar>
                    <Typography sx={{ fontWeight: 600 }}>{student.name}</Typography>
                    {scores[student.id] != null && scores[student.id] !== "" && (
                      <Chip size="small" variant="outlined" label="Saved" />
                    )}
                  </Stack>
                  <TextField
                    label="Marks"
                    type="number"
                    value={scores[student.id] ?? ""}
                    disabled={loadingScores}
                    onChange={(event) =>
                      setScores((prev) => ({
                        ...prev,
                        [student.id]: event.target.value,
                      }))
                    }
                    sx={{ width: { xs: "100%", sm: 140 } }}
                  />
                </Stack>
              ))}
            </Stack>
          )}

          <Button
            onClick={handleSubmit}
            variant="contained"
            size="large"
            disabled={saving || !batchId || students.length === 0}
          >
            {saving ? "Saving…" : "Save results"}
          </Button>
        </CardContent>
      </Card>
    </PageShell>
  );
}
