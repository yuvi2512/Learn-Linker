import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import moment from "moment";
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  Stack,
  TextField,
  Link as MuiLink,
} from "@mui/material";
import PageShell from "@/components/layout/PageShell";

function statusOf(row) {
  const due = moment(row.end_date).endOf("day");
  if (row.submitted_at) {
    const late = moment(row.submitted_at).isAfter(due);
    return {
      label: late ? "Submitted late" : "Turned in",
      color: late ? "warning" : "success",
    };
  }
  if (due.isBefore(moment())) return { label: "Missing", color: "error" };
  return { label: "Not submitted", color: "default" };
}

export default function StudentAssignments() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [drafts, setDrafts] = useState({});
  const [savingId, setSavingId] = useState(null);

  const load = async () => {
    try {
      const response = await axios.get("/api/AssignmentAPI");
      setRows(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Could not load assignments.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const handleSubmit = async (row) => {
    const draft = drafts[row.id] || {};
    if (!draft.note && !draft.resource_url && !row.submission_note) {
      toast.error("Add a short note or a link to your work.");
      return;
    }

    setSavingId(row.id);
    try {
      await axios.post(`/api/assignments/${row.id}/submit`, {
        note: draft.note ?? row.submission_note,
        resource_url: draft.resource_url ?? row.submission_url,
      });
      toast.success("Turned in.");
      await load();
    } catch (error) {
      console.error("Error submitting:", error);
      toast.error(error?.response?.data?.message || "Could not submit.");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <PageShell
      title="Assignments"
      subtitle="Work posted to your batches. Turn it in with a note or a file link."
    >
      {loading ? (
        <Card>
          <CardContent sx={{ py: 8, textAlign: "center" }}>
            <Typography color="text.secondary">Loading…</Typography>
          </CardContent>
        </Card>
      ) : rows.length === 0 ? (
        <Card>
          <CardContent sx={{ py: 8, textAlign: "center" }}>
            <Typography color="text.secondary">No assignments posted yet.</Typography>
          </CardContent>
        </Card>
      ) : (
        <Stack spacing={2}>
          {rows.map((row) => {
            const status = statusOf(row);
            const draft = drafts[row.id] || {};
            return (
              <Card key={row.id}>
                <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
                  <Stack
                    direction="row"
                    spacing={1}
                    alignItems="center"
                    sx={{ mb: 1, flexWrap: "wrap", gap: 1 }}
                  >
                    <Typography variant="h6">{row.subject}</Typography>
                    <Chip
                      size="small"
                      variant="outlined"
                      label={row.batch_name || "Everyone"}
                    />
                    <Chip size="small" color={status.color} label={status.label} />
                  </Stack>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                    Due {moment(row.end_date).format("DD MMM YYYY")}
                  </Typography>
                  <Typography variant="body2" sx={{ mb: 1.5, whiteSpace: "pre-wrap" }}>
                    {row.description}
                  </Typography>
                  {row.resource_url && (
                    <MuiLink
                      href={row.resource_url}
                      target="_blank"
                      rel="noreferrer"
                      sx={{ display: "inline-block", mb: 2 }}
                    >
                      Open worksheet
                    </MuiLink>
                  )}
                  <Stack spacing={1.5}>
                    <TextField
                      fullWidth
                      multiline
                      minRows={2}
                      label="Your work / notes"
                      value={draft.note ?? row.submission_note ?? ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [row.id]: { ...draft, note: e.target.value },
                        }))
                      }
                    />
                    <TextField
                      fullWidth
                      label="Link to file (optional)"
                      placeholder="https://…"
                      value={draft.resource_url ?? row.submission_url ?? ""}
                      onChange={(e) =>
                        setDrafts((prev) => ({
                          ...prev,
                          [row.id]: { ...draft, resource_url: e.target.value },
                        }))
                      }
                    />
                    <Box>
                      <Button
                        variant="contained"
                        onClick={() => handleSubmit(row)}
                        disabled={savingId === row.id}
                      >
                        {savingId === row.id
                          ? "Submitting…"
                          : row.submitted_at
                          ? "Update submission"
                          : "Turn in"}
                      </Button>
                    </Box>
                  </Stack>
                </CardContent>
              </Card>
            );
          })}
        </Stack>
      )}
    </PageShell>
  );
}
