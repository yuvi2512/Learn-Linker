import React, { useEffect, useMemo, useState } from "react";
import { Card, CardContent, Typography, Box, Chip } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import toast from "react-hot-toast";
import moment from "moment";
import PageShell from "@/components/layout/PageShell";

export default function StudentTests() {
  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        const response = await axios.get("/api/UpcomingTestAPI");
        if (!cancelled) setRows(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error("Error getting data:", error);
        if (!cancelled) toast.error("Could not load tests.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const sorted = useMemo(
    () => [...rows].sort((a, b) => moment(a.date) - moment(b.date)),
    [rows]
  );

  const columns = [
    { field: "subject", headerName: "Subject", flex: 1, minWidth: 160 },
    {
      field: "batch_name",
      headerName: "Batch",
      width: 170,
      renderCell: (params) => (
        <Chip
          size="small"
          variant="outlined"
          label={params.row.batch_name || "Everyone"}
        />
      ),
    },
    {
      field: "date",
      headerName: "Date",
      width: 140,
      renderCell: (params) => <>{moment(params.row.date).format("DD/MM/YYYY")}</>,
    },
    {
      field: "when",
      headerName: "When",
      width: 150,
      sortable: false,
      renderCell: (params) => {
        const date = moment(params.row.date).startOf("day");
        const today = moment().startOf("day");
        if (date.isBefore(today)) {
          return <Chip size="small" label="Done" variant="outlined" />;
        }
        return (
          <Chip
            size="small"
            color="primary"
            variant="outlined"
            label={date.isSame(today) ? "Today" : date.from(today)}
          />
        );
      },
    },
  ];

  return (
    <PageShell
      title="Tests"
      subtitle="Every exam scheduled for your batches, soonest first."
    >
      <Card>
        <CardContent sx={{ p: { xs: 1, md: 2 } }}>
          {!loading && sorted.length === 0 ? (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <Typography color="text.secondary">Nothing scheduled yet.</Typography>
            </Box>
          ) : (
            <DataGrid
              autoHeight
              loading={loading}
              rows={sorted}
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
