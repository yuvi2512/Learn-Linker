import React, { useCallback, useState, useEffect } from "react";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  IconButton,
  Box,
  Chip,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import toast from "react-hot-toast";
import moment from "moment";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import AutoAwesomeOutlinedIcon from "@mui/icons-material/AutoAwesomeOutlined";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import BatchPicker from "@/components/batches/BatchPicker";
import { useBatchSelection } from "@/hooks/useBatches";
import { ALL_BATCHES } from "@/utils/batches";
import { useSession } from "next-auth/react";
import { isAdmin } from "@/utils/permissions";

export default function TeacherTests() {
  const { data: session } = useSession();
  const { batches, loading: batchesLoading, batchId, setBatchId } =
    useBatchSelection({ allowAll: isAdmin(session?.user) });

  const [rows, setRows] = useState([]);
  const [formData, setFormData] = useState({ date: "", subject: "", max_marks: "100" });
  const [saving, setSaving] = useState(false);
  const [pendingDelete, setPendingDelete] = useState(null);

  const getTests = useCallback(async () => {
    try {
      const response = await axios.get("/api/UpcomingTestAPI");
      setRows(Array.isArray(response.data) ? response.data : []);
    } catch (error) {
      console.error("Error getting data:", error);
      toast.error("Could not load tests.");
    }
  }, []);

  useEffect(() => {
    getTests();
  }, [getTests]);

  const handleSubmit = async () => {
    if (!formData.subject || !formData.date) {
      toast.error("Add a subject and a date.");
      return;
    }

    setSaving(true);
    try {
      const response = await axios.post("/api/UpcomingTestAPI", {
        data: {
          ...formData,
          batchId: batchId === ALL_BATCHES ? null : batchId,
        },
      });
      if (response.status === 200) {
        toast.success("Test scheduled.");
        setFormData({ date: "", subject: "", max_marks: "100" });
        getTests();
      }
    } catch (error) {
      console.error("Error scheduling test:", error);
      toast.error(error?.response?.data?.message || "Could not schedule test.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    const target = pendingDelete;
    setPendingDelete(null);
    if (!target) return;

    try {
      await axios.delete("/api/UpcomingTestAPI", { data: { data: { id: target.id } } });
      toast.success("Test removed.");
      getTests();
    } catch (error) {
      console.error("Error deleting test:", error);
      toast.error(error?.response?.data?.message || "Could not delete test.");
    }
  };

  const columns = [
    { field: "subject", headerName: "Subject", flex: 1, minWidth: 160 },
    {
      field: "batch_name",
      headerName: "Batch",
      width: 170,
      renderCell: (params) =>
        params.row.batch_name ? (
          <Chip size="small" variant="outlined" label={params.row.batch_name} />
        ) : (
          <Chip size="small" label="All students" />
        ),
    },
    {
      field: "date",
      headerName: "Date",
      width: 140,
      renderCell: (params) => <>{moment(params.row.date).format("DD/MM/YYYY")}</>,
    },
    {
      field: "actions",
      headerName: "",
      width: 70,
      sortable: false,
      filterable: false,
      renderCell: (params) => (
        <IconButton aria-label="Delete test" onClick={() => setPendingDelete(params.row)}>
          <DeleteOutlineRoundedIcon fontSize="small" />
        </IconButton>
      ),
    },
  ];

  return (
    <PageShell
      title="Tests"
      subtitle="Schedule an exam for one batch or for everyone. Students see it on their overview."
      action={
        <Button
          component={Link}
          href="/tests/paper"
          variant="outlined"
          startIcon={<AutoAwesomeOutlinedIcon />}
        >
          Prepare NCERT paper
        </Button>
      }
    >
      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Grid container spacing={2.5} alignItems="flex-start">
            <Grid item xs={12} sm={4}>
              <BatchPicker
                batches={batches}
                loading={batchesLoading}
                value={batchId}
                onChange={setBatchId}
                allowAll={isAdmin(session?.user)}
                canCreate={isAdmin(session?.user)}
                label="Schedule for"
                allLabel="All students"
                helperText=" "
                sx={{ width: "100%" }}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                type="date"
                label="Date"
                InputLabelProps={{ shrink: true }}
                value={formData.date}
                helperText=" "
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={3}>
              <TextField
                fullWidth
                label="Subject"
                value={formData.subject}
                helperText=" "
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <TextField
                fullWidth
                type="number"
                label="Out of"
                value={formData.max_marks}
                helperText=" "
                onChange={(e) => setFormData({ ...formData, max_marks: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={2}>
              <Button
                onClick={handleSubmit}
                variant="contained"
                size="large"
                fullWidth
                disabled={saving}
                sx={{ height: 56 }}
              >
                {saving ? "…" : "Add"}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      <Card>
        <CardContent sx={{ p: { xs: 1, md: 2 } }}>
          {rows.length === 0 ? (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <Typography color="text.secondary">No tests scheduled.</Typography>
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
        <DialogTitle>Remove this test?</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            {pendingDelete?.subject} on{" "}
            {pendingDelete ? moment(pendingDelete.date).format("DD MMM YYYY") : ""} will be
            removed from the calendar.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => setPendingDelete(null)}>Cancel</Button>
          <Button color="error" variant="contained" onClick={handleDelete}>
            Remove
          </Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  );
}
