import React, { useCallback, useEffect, useState } from "react";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Box,
  Typography,
  IconButton,
  Chip,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Stack,
  Link as MuiLink,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import axios from "axios";
import moment from "moment";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import PageShell from "@/components/layout/PageShell";
import BatchPicker from "@/components/batches/BatchPicker";
import { useBatchSelection } from "@/hooks/useBatches";
import { ALL_BATCHES } from "@/utils/batches";
import { isAdmin } from "@/utils/permissions";

function statusFor(row) {
  const due = moment(row.end_date).endOf("day");
  const submitted = row.submitted_count || 0;
  const roster = row.roster_count || 0;
  if (roster > 0 && submitted >= roster) return { label: "All in", color: "success" };
  if (due.isBefore(moment()) && submitted < roster) {
    return { label: `${submitted}/${roster} in`, color: "warning" };
  }
  return { label: roster ? `${submitted}/${roster} in` : `${submitted} in`, color: "default" };
}

export default function TeacherAssignments() {
  const { data: session } = useSession();
  const { batches, loading: batchesLoading, batchId, setBatchId } =
    useBatchSelection({ allowAll: isAdmin(session?.user) });

  const [subject, setSubject] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [resourceUrl, setResourceUrl] = useState("");
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);
  const [submissionsFor, setSubmissionsFor] = useState(null);
  const [submissionRows, setSubmissionRows] = useState([]);
  const [loadingSubs, setLoadingSubs] = useState(false);

  const fetchAssignments = useCallback(async () => {
    try {
      const response = await axios.get("/api/AssignmentAPI", {
        params: { batchId: batchId === ALL_BATCHES ? undefined : batchId },
      });
      setRows(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast.error("Could not load assignments.");
    }
  }, [batchId]);

  useEffect(() => {
    fetchAssignments();
  }, [fetchAssignments]);

  const handleSubmit = async (event) => {
    event.preventDefault();

    if (!subject || !endDate || !description) {
      toast.error("Add a subject, due date, and brief.");
      return;
    }

    setSaving(true);
    try {
      const response = await axios.post("/api/AssignmentAPI", {
        data: {
          subject,
          end_date: endDate,
          description,
          resource_url: resourceUrl,
          batchId: batchId === ALL_BATCHES ? null : batchId,
        },
      });
      if (response.status === 200) {
        toast.success("Assignment published.");
        setSubject("");
        setEndDate("");
        setDescription("");
        setResourceUrl("");
        fetchAssignments();
      }
    } catch (error) {
      console.error("Error submitting assignment:", error);
      toast.error(error?.response?.data?.message || "Could not publish assignment.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const target = pendingDelete;
    setPendingDelete(null);
    if (!target) return;

    try {
      await axios.delete("/api/AssignmentAPI", { data: { data: { id: target.id } } });
      toast.success("Assignment deleted.");
      fetchAssignments();
    } catch (error) {
      console.error("Error deleting assignment:", error);
      toast.error(error?.response?.data?.message || "Could not delete assignment.");
    }
  };

  const openSubmissions = async (row) => {
    setSubmissionsFor(row);
    setLoadingSubs(true);
    try {
      const response = await axios.get(`/api/assignments/${row.id}/submissions`);
      setSubmissionRows(response.data?.submissions || []);
    } catch (error) {
      console.error("Error loading submissions:", error);
      toast.error("Could not load submissions.");
      setSubmissionRows([]);
    } finally {
      setLoadingSubs(false);
    }
  };

  return (
    <PageShell
      title="Assignments"
      subtitle="Publish work to a batch. Students turn it in, and you can see who still owes it."
    >
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Typography variant="h6" sx={{ mb: 2.5 }}>
            New assignment
          </Typography>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={6}>
              <BatchPicker
                batches={batches}
                loading={batchesLoading}
                value={batchId}
                onChange={setBatchId}
                allowAll={isAdmin(session?.user)}
                canCreate={isAdmin(session?.user)}
                label="Publish to"
                allLabel="All students"
                helperText="Choose a batch."
                sx={{ width: "100%" }}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Subject"
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                type="date"
                label="Due date"
                InputLabelProps={{ shrink: true }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                fullWidth
                label="Resource link (optional)"
                placeholder="https://…"
                value={resourceUrl}
                onChange={(e) => setResourceUrl(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                multiline
                fullWidth
                rows={5}
                label="Brief"
                placeholder="What should students complete?"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                onClick={handleSubmit}
                variant="contained"
                size="large"
                disabled={saving}
              >
                {saving ? "Publishing…" : "Publish assignment"}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Stack spacing={1.5}>
        {rows.length === 0 ? (
          <Card>
            <CardContent sx={{ py: 8, textAlign: "center" }}>
              <Typography color="text.secondary">
                Nothing published yet. The list will appear here.
              </Typography>
            </CardContent>
          </Card>
        ) : (
          rows.map((row) => {
            const status = statusFor(row);
            return (
              <Card key={row.id}>
                <CardContent sx={{ p: 2.5 }}>
                  <Stack
                    direction={{ xs: "column", sm: "row" }}
                    spacing={1.5}
                    justifyContent="space-between"
                    alignItems={{ sm: "center" }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
                        <Typography variant="h6" noWrap>
                          {row.subject}
                        </Typography>
                        <Chip
                          size="small"
                          variant="outlined"
                          label={row.batch_name || "All students"}
                        />
                        <Chip size="small" color={status.color} label={status.label} />
                      </Stack>
                      <Typography variant="body2" color="text.secondary">
                        Due {moment(row.end_date).format("DD MMM YYYY")}
                        {row.resource_url ? " · worksheet attached" : ""}
                      </Typography>
                      <Typography variant="body2" sx={{ mt: 1 }}>
                        {row.description}
                      </Typography>
                    </Box>
                    <Stack direction="row" spacing={1} sx={{ flexShrink: 0 }}>
                      <Button variant="outlined" onClick={() => openSubmissions(row)}>
                        Submissions
                      </Button>
                      <IconButton
                        aria-label="Delete assignment"
                        onClick={() => setPendingDelete(row)}
                      >
                        <DeleteOutlineRoundedIcon />
                      </IconButton>
                    </Stack>
                  </Stack>
                </CardContent>
              </Card>
            );
          })
        )}
      </Stack>

      <Dialog open={Boolean(pendingDelete)} onClose={() => setPendingDelete(null)}>
        <DialogTitle>Delete this assignment?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            {pendingDelete?.subject} will no longer be visible to{" "}
            {pendingDelete?.batch_name || "students"}. Submissions are removed with it.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPendingDelete(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={Boolean(submissionsFor)}
        onClose={() => setSubmissionsFor(null)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {submissionsFor?.subject}
          <Typography variant="body2" color="text.secondary">
            Who has turned this in
          </Typography>
        </DialogTitle>
        <DialogContent>
          {loadingSubs ? (
            <Typography color="text.secondary">Loading…</Typography>
          ) : (
            <Stack spacing={1.25} sx={{ mt: 1 }}>
              {submissionRows.map((row) => (
                <Box
                  key={row.id}
                  sx={{
                    p: 1.5,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 2,
                  }}
                >
                  <Stack direction="row" justifyContent="space-between" spacing={1}>
                    <Typography sx={{ fontWeight: 600 }}>{row.name}</Typography>
                    <Chip
                      size="small"
                      color={row.submitted_at ? "success" : "default"}
                      label={
                        row.submitted_at
                          ? `In · ${moment(row.submitted_at).format("DD MMM")}`
                          : "Not submitted"
                      }
                    />
                  </Stack>
                  {row.note && (
                    <Typography variant="body2" color="text.secondary" sx={{ mt: 0.75 }}>
                      {row.note}
                    </Typography>
                  )}
                  {row.resource_url && (
                    <MuiLink href={row.resource_url} target="_blank" rel="noreferrer" variant="body2">
                      Open work
                    </MuiLink>
                  )}
                </Box>
              ))}
            </Stack>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setSubmissionsFor(null)}>Close</Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  );
}
