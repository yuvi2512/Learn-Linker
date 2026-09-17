import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import moment from "moment";
import { Card, CardContent, Typography, Box, Chip } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import PageShell from "@/components/layout/PageShell";

export default function StudentAssignments() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await axios.get("/api/AssignmentAPI");
        if (!cancelled) setRows(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error fetching data:", error);
        if (!cancelled) toast.error("Could not load assignments.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const columns = [
    { field: "subject", headerName: "Subject", width: 150 },
    {
      field: "batch_name",
      headerName: "Batch",
      width: 160,
      renderCell: (params) => (
        <Chip
          size="small"
          variant="outlined"
          label={params.row.batch_name || "Everyone"}
        />
      ),
    },
    { field: "description", headerName: "Brief", flex: 1, minWidth: 220 },
    {
      field: "end_date",
      headerName: "Due",
      width: 150,
      renderCell: (params) => {
        const due = moment(params.row.end_date);
        const overdue = due.isBefore(moment().startOf("day"));
        return (
          <Chip
            size="small"
            variant="outlined"
            color={overdue ? "default" : "primary"}
            label={due.format("DD/MM/YYYY")}
          />
        );
      },
    },
  ];

  return (
    <PageShell
      title="Assignments"
      subtitle="Work posted to your batches, with due dates in one list."
    >
      <Card>
        <CardContent sx={{ p: { xs: 1, md: 2 } }}>
          {!loading && rows.length === 0 ? (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <Typography color="text.secondary">No assignments posted yet.</Typography>
            </Box>
          ) : (
            <DataGrid
              autoHeight
              loading={loading}
              rows={rows}
              columns={columns}
              getRowId={(row) => `${row.id}`}
              disableRowSelectionOnClick
            />
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
