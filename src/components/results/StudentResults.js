import React, { useState, useEffect } from "react";
import { Card, CardContent, Typography, Button, Box, Chip } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import { useSession } from "next-auth/react";
import axios from "axios";
import toast from "react-hot-toast";
import PageShell from "@/components/layout/PageShell";
import BatchPicker from "@/components/batches/BatchPicker";
import { useBatchSelection } from "@/hooks/useBatches";
import { ALL_BATCHES } from "@/utils/batches";

const TOTAL_PER_SUBJECT = 100;

export default function StudentResults() {
  const { batches, loading: batchesLoading, batchId, setBatchId, selected } =
    useBatchSelection({ allowAll: true });

  const [rows, setRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const { data: session } = useSession();

  useEffect(() => {
    if (!session?.user?.id) return undefined;
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/getMarksheetData", {
          params: { batchId: batchId === ALL_BATCHES ? undefined : batchId },
        });
        if (!cancelled && Array.isArray(response.data)) {
          setRows(
            response.data.map((row) => ({ ...row, Total: TOTAL_PER_SUBJECT }))
          );
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        if (!cancelled) toast.error("Could not load your results.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [session?.user?.id, batchId]);

  const calculatePercentage = () => {
    const obtained = rows.reduce((sum, row) => sum + Number(row.marks_obtained || 0), 0);
    const total = rows.reduce((sum, row) => sum + Number(row.Total || 0), 0);
    if (!total) return "0.00";
    return ((obtained / total) * 100).toFixed(2);
  };

  const generateMarksheet = () => {
    const doc = new jsPDF();

    doc.setFontSize(18);
    doc.text("Learn Linker", 105, 20, null, null, "center");

    doc.setFontSize(12);
    doc.text(`Student Name: ${session?.user?.name || ""}`, 20, 40);
    doc.text(`Batch: ${selected?.name || "All batches"}`, 20, 47);

    doc.autoTable({
      head: [["Batch", "Subject Name", "Marks Obtained", "Total Marks"]],
      body: rows.map((row) => [
        row.batch_name || "—",
        row.subject_name,
        row.marks_obtained,
        row.Total,
      ]),
      startY: 56,
    });

    doc.text(
      `Percentage: ${calculatePercentage()}%`,
      20,
      doc.lastAutoTable.finalY + 10
    );

    doc.save("marksheet.pdf");
  };

  const columns = [
    {
      field: "batch_name",
      headerName: "Batch",
      width: 170,
      renderCell: (params) => (
        <Chip size="small" variant="outlined" label={params.row.batch_name || "—"} />
      ),
    },
    { field: "subject_name", headerName: "Subject", flex: 1, minWidth: 150 },
    { field: "marks_obtained", headerName: "Marks", width: 120 },
    { field: "Total", headerName: "Out of", width: 120 },
  ];

  const percentage = rows.length ? calculatePercentage() : null;

  return (
    <PageShell
      title="Results"
      subtitle="Subject scores for your batches. Download a PDF marksheet when you need a copy."
      action={
        <Button
          variant="contained"
          onClick={generateMarksheet}
          disabled={rows.length === 0}
        >
          Download marksheet
        </Button>
      }
    >
      {batches.length > 1 && (
        <Box sx={{ mb: 2.5 }}>
          <BatchPicker
            batches={batches}
            loading={batchesLoading}
            value={batchId}
            onChange={setBatchId}
            allowAll
            allLabel="All batches"
            helperText=" "
          />
        </Box>
      )}

      {percentage && (
        <Card sx={{ mb: 2.5, maxWidth: 280 }}>
          <CardContent sx={{ py: 2, px: 3 }}>
            <Typography variant="body2" color="text.secondary">
              {selected ? selected.name : "Overall"}
            </Typography>
            <Typography variant="h4">{percentage}%</Typography>
          </CardContent>
        </Card>
      )}
      <Card>
        <CardContent sx={{ p: { xs: 1, md: 2 } }}>
          {!loading && rows.length === 0 ? (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <Typography color="text.secondary">No results published yet.</Typography>
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
