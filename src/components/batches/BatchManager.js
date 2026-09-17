import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Stack,
  Typography,
  Box,
  Chip,
  IconButton,
  Grid,
  Skeleton,
  Tooltip,
} from "@mui/material";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import GroupsOutlinedIcon from "@mui/icons-material/GroupsOutlined";
import AddRoundedIcon from "@mui/icons-material/AddRounded";
import EditOutlinedIcon from "@mui/icons-material/EditOutlined";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import axios from "axios";
import toast from "react-hot-toast";
import PageShell from "@/components/layout/PageShell";
import { useBatches } from "@/hooks/useBatches";

const emptyDraft = { name: "", subject: "", description: "" };

function BatchFormDialog({ open, initial, saving, onClose, onSubmit }) {
  const [draft, setDraft] = useState(emptyDraft);

  useEffect(() => {
    if (open) setDraft(initial || emptyDraft);
  }, [open, initial]);

  const editing = Boolean(initial?.id);

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="sm">
      <DialogTitle>{editing ? "Edit batch" : "New batch"}</DialogTitle>
      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <TextField
            autoFocus
            fullWidth
            label="Batch name"
            placeholder="Class 12 — Morning"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
          />
          <TextField
            fullWidth
            label="Subject"
            placeholder="Physics"
            value={draft.subject || ""}
            onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
            helperText="Optional. Useful when the same students sit in more than one batch."
          />
          <TextField
            fullWidth
            multiline
            rows={3}
            label="Notes"
            value={draft.description || ""}
            onChange={(e) => setDraft({ ...draft, description: e.target.value })}
          />
        </Stack>
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose}>Cancel</Button>
        <Button
          variant="contained"
          disabled={saving || !draft.name.trim()}
          onClick={() => onSubmit(draft)}
        >
          {saving ? "Saving…" : editing ? "Save changes" : "Create batch"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

function RosterDialog({ batch, onClose, onSaved }) {
  const [students, setStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const open = Boolean(batch);

  useEffect(() => {
    if (!batch) return;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const [all, roster] = await Promise.all([
          axios.get("/api/getStudentAPI"),
          axios.get(`/api/batches/${batch.id}/students`),
        ]);

        if (cancelled) return;

        setStudents(Array.isArray(all.data) ? all.data : []);
        setSelectedIds(
          (Array.isArray(roster.data) ? roster.data : []).map((row) => row.id)
        );
      } catch (error) {
        console.error("Error loading roster:", error);
        if (!cancelled) toast.error("Could not load the roster.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [batch]);

  const columns = useMemo(
    () => [
      { field: "name", headerName: "Student", flex: 1, minWidth: 180 },
      { field: "email", headerName: "Email", flex: 1, minWidth: 220 },
    ],
    []
  );

  const handleSave = async () => {
    setSaving(true);
    try {
      await axios.put(`/api/batches/${batch.id}/students`, {
        studentIds: selectedIds.map(String),
      });
      toast.success("Roster updated.");
      onSaved();
      onClose();
    } catch (error) {
      console.error("Error saving roster:", error);
      toast.error(error?.response?.data?.message || "Could not save the roster.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle>
        {batch?.name}
        <Typography variant="body2" color="text.secondary">
          Tick the students who belong to this batch.
        </Typography>
      </DialogTitle>
      <DialogContent>
        {loading ? (
          <Skeleton variant="rounded" height={320} />
        ) : students.length === 0 ? (
          <Box sx={{ py: 6, textAlign: "center" }}>
            <Typography color="text.secondary">
              No students have registered yet.
            </Typography>
          </Box>
        ) : (
          <DataGrid
            autoHeight
            rows={students}
            columns={columns}
            getRowId={(row) => `${row.id}`}
            checkboxSelection
            rowSelectionModel={selectedIds}
            onRowSelectionModelChange={setSelectedIds}
            disableRowSelectionOnClick
            slots={{ toolbar: GridToolbar }}
            slotProps={{ toolbar: { showQuickFilter: true } }}
          />
        )}
      </DialogContent>
      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Typography variant="body2" color="text.secondary" sx={{ mr: "auto" }}>
          {selectedIds.length} selected
        </Typography>
        <Button onClick={onClose}>Cancel</Button>
        <Button variant="contained" onClick={handleSave} disabled={saving || loading}>
          {saving ? "Saving…" : "Save roster"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function BatchManager() {
  const { batches, loading, refresh } = useBatches();
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);
  const [rosterFor, setRosterFor] = useState(null);
  const [pendingDelete, setPendingDelete] = useState(null);

  const openCreate = () => {
    setEditing(null);
    setFormOpen(true);
  };

  const openEdit = (batch) => {
    setEditing(batch);
    setFormOpen(true);
  };

  const handleSubmit = useCallback(
    async (draft) => {
      setSaving(true);
      try {
        if (editing?.id) {
          await axios.patch(`/api/batches/${editing.id}`, draft);
          toast.success("Batch updated.");
        } else {
          await axios.post("/api/batches", draft);
          toast.success("Batch created.");
        }
        setFormOpen(false);
        setEditing(null);
        await refresh();
      } catch (error) {
        console.error("Error saving batch:", error);
        toast.error(error?.response?.data?.message || "Could not save the batch.");
      } finally {
        setSaving(false);
      }
    },
    [editing, refresh]
  );

  const handleDelete = async () => {
    const target = pendingDelete;
    setPendingDelete(null);
    if (!target) return;

    try {
      await axios.delete(`/api/batches/${target.id}`);
      toast.success("Batch deleted.");
      await refresh();
    } catch (error) {
      console.error("Error deleting batch:", error);
      toast.error(error?.response?.data?.message || "Could not delete the batch.");
    }
  };

  return (
    <PageShell
      title="Batches"
      subtitle="Group your students into the classes you actually teach. Attendance, results, assignments, and timetables are all scoped to a batch."
      action={
        <Button variant="contained" startIcon={<AddRoundedIcon />} onClick={openCreate}>
          New batch
        </Button>
      }
    >
      {loading ? (
        <Grid container spacing={2.5}>
          {[0, 1, 2].map((key) => (
            <Grid item xs={12} sm={6} lg={4} key={key}>
              <Skeleton variant="rounded" height={180} />
            </Grid>
          ))}
        </Grid>
      ) : batches.length === 0 ? (
        <Card>
          <CardContent sx={{ py: 8, textAlign: "center" }}>
            <GroupsOutlinedIcon sx={{ fontSize: 48, color: "text.disabled", mb: 1 }} />
            <Typography variant="h6" sx={{ mb: 0.5 }}>
              No batches yet
            </Typography>
            <Typography color="text.secondary" sx={{ mb: 3 }}>
              Create your first batch, then add the students who belong to it.
            </Typography>
            <Button variant="contained" onClick={openCreate}>
              Create a batch
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Grid container spacing={2.5}>
          {batches.map((batch) => (
            <Grid item xs={12} sm={6} lg={4} key={batch.id}>
              <Card sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
                <CardContent sx={{ p: 3, flex: 1 }}>
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={1}
                    sx={{ mb: 1 }}
                  >
                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" noWrap title={batch.name}>
                        {batch.name}
                      </Typography>
                      {batch.subject && (
                        <Typography variant="body2" color="text.secondary" noWrap>
                          {batch.subject}
                        </Typography>
                      )}
                    </Box>
                    <Stack direction="row" sx={{ flexShrink: 0 }}>
                      <Tooltip title="Edit batch">
                        <IconButton size="small" onClick={() => openEdit(batch)}>
                          <EditOutlinedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Delete batch">
                        <IconButton size="small" onClick={() => setPendingDelete(batch)}>
                          <DeleteOutlineRoundedIcon fontSize="small" />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Stack>

                  <Chip
                    size="small"
                    icon={<GroupsOutlinedIcon fontSize="small" />}
                    label={`${batch.student_count} ${
                      batch.student_count === 1 ? "student" : "students"
                    }`}
                    sx={{ mb: 1.5 }}
                  />

                  {batch.description && (
                    <Typography variant="body2" color="text.secondary">
                      {batch.description}
                    </Typography>
                  )}
                </CardContent>
                <Box sx={{ px: 3, pb: 2.5 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    onClick={() => setRosterFor(batch)}
                  >
                    Manage students
                  </Button>
                </Box>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      <BatchFormDialog
        open={formOpen}
        initial={editing}
        saving={saving}
        onClose={() => {
          setFormOpen(false);
          setEditing(null);
        }}
        onSubmit={handleSubmit}
      />

      <RosterDialog
        batch={rosterFor}
        onClose={() => setRosterFor(null)}
        onSaved={refresh}
      />

      <Dialog open={Boolean(pendingDelete)} onClose={() => setPendingDelete(null)}>
        <DialogTitle>Delete {pendingDelete?.name}?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            This also removes the batch&apos;s attendance register, marksheets,
            assignments, tests, and timetable. Student accounts are not affected.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPendingDelete(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Delete batch
          </Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  );
}
