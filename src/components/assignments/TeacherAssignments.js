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
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import moment from "moment";
import toast from "react-hot-toast";
import PageShell from "@/components/layout/PageShell";
import BatchPicker from "@/components/batches/BatchPicker";
import { useBatchSelection } from "@/hooks/useBatches";
import { ALL_BATCHES } from "@/utils/batches";

export default function TeacherAssignments() {
  // Assignments can go to one batch or to everyone, so an empty pick is valid.
  const { batches, loading: batchesLoading, batchId, setBatchId } =
    useBatchSelection({ allowAll: true });

  const [subject, setSubject] = useState("");
  const [endDate, setEndDate] = useState("");
  const [description, setDescription] = useState("");
  const [rows, setRows] = useState([]);
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const fetchAssignments = useCallback(async () => {
    try {
      const response = await axios.get("/api/AssignmentAPI");
      setRows(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error fetching assignments:", error);
      toast.error("Could not load assignments.");
    }
  }, []);

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
          batchId: batchId === ALL_BATCHES ? null : batchId,
        },
      });
      if (response.status === 200) {
        toast.success("Assignment published.");
        setSubject("");
        setEndDate("");
        setDescription("");
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

  const columns = [
    { field: "subject", headerName: "Subject", width: 150 },
    {
      field: "batch_name",
      headerName: "Batch",
      width: 160,
      renderCell: (params) =>
        params.row.batch_name ? (
          <Chip size="small" variant="outlined" label={params.row.batch_name} />
        ) : (
          <Chip size="small" label="All students" />
        ),
    },
    { field: "description", headerName: "Brief", flex: 1, minWidth: 200 },
    {
      field: "end_date",
      headerName: "Due",
      width: 120,
      renderCell: (params) => <>{moment(params.row.end_date).format("DD/MM/YYYY")}</>,
    },
    {
      field: "actions",
      headerName: "",
      width: 70,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton
          aria-label="Delete assignment"
          onClick={() => setPendingDelete(params.row)}
        >
          <DeleteOutlineRoundedIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <PageShell
      title="Assignments"
      subtitle="Publish work to one batch or to every student, and manage what is already out there."
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
                allowAll
                label="Publish to"
                allLabel="All students"
                helperText="Choose a batch, or publish to everyone."
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

      <Card>
        <CardContent sx={{ p: { xs: 1, md: 2 } }}>
          {rows.length === 0 ? (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <Typography color="text.secondary">
                Nothing published yet. The list will appear here.
              </Typography>
            </Box>
          ) : (
            <DataGrid
              autoHeight
              rows={rows}
              columns={columns}
              getRowId={(row) => `${row.id}`}
              disableRowSelectionOnClick
            />
          )}
        </CardContent>
      </Card>

      <Dialog open={Boolean(pendingDelete)} onClose={() => setPendingDelete(null)}>
        <DialogTitle>Delete this assignment?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            {pendingDelete?.subject} will no longer be visible to{" "}
            {pendingDelete?.batch_name || "students"}.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPendingDelete(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  );
}
