import React, { useEffect, useMemo, useState, useRef } from "react";
import toast from "react-hot-toast";
import axios from "axios";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Card,
  CardContent,
  Box,
  Button,
  Typography,
} from "@mui/material";
import jsPDF from "jspdf";
import { useSession } from "next-auth/react";
import PageShell from "@/components/layout/PageShell";
import BatchPicker from "@/components/batches/BatchPicker";
import { useBatchSelection } from "@/hooks/useBatches";
import { ALL_BATCHES } from "@/utils/batches";
import { isStaff } from "@/utils/permissions";
import { WEEKDAYS, TIME_SLOTS, TIME_SLOT_LABELS } from "@/utils/timetable";

export default function TimetableView() {
  const { data: session } = useSession();
  const studentView = !isStaff(session?.user);

  const { batches, loading: batchesLoading, batchId, setBatchId } =
    useBatchSelection({ allowAll: true });

  const [timeTable, setTimeTable] = useState([]);
  const [loading, setLoading] = useState(true);
  const tableRef = useRef();

  useEffect(() => {
    let cancelled = false;

    (async () => {
      setLoading(true);
      try {
        const response = await axios.get("/api/TimeTableAPI", {
          params: { batchId: batchId === ALL_BATCHES ? undefined : batchId },
        });
        if (!cancelled && Array.isArray(response.data)) setTimeTable(response.data);
      } catch (error) {
        console.error("Error fetching data:", error);
        if (!cancelled) toast.error("Could not load the timetable.");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [batchId]);

  const rows = useMemo(() => {
    if (!studentView || batchId === ALL_BATCHES || !batchId) return timeTable;
    return timeTable.filter(
      (row) => row.batch_id === batchId || row.batch_id === null
    );
  }, [timeTable, studentView, batchId]);

  const handleSavePDF = async () => {
    const table = tableRef.current;
    if (!table) return;

    try {
      const { default: html2canvas } = await import("html2canvas");
      const canvas = await html2canvas(table);
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("l", "mm", "a4");
      const imgWidth = 280;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save("TimeTable.pdf");
    } catch (error) {
      console.error("Error exporting timetable:", error);
      toast.error("Could not export the timetable.");
    }
  };

  const grid = WEEKDAYS.map((day) => {
    const row = { day: day.full };
    TIME_SLOTS.forEach((slot) => {
      const match = rows.find(
        (entry) => Number(entry.day_of_week) === day.value && entry.timeslot === slot
      );
      row[slot] = match
        ? `${match.subject}${match.teacher_name ? `\n(${match.teacher_name})` : ""}`
        : "—";
    });
    return row;
  });

  return (
    <PageShell
      title="Timetable"
      subtitle="The weekly grid for a batch. Classes sit on the days the admin picked."
      action={
        <Button variant="outlined" onClick={handleSavePDF} disabled={rows.length === 0}>
          Download PDF
        </Button>
      }
    >
      {(batches.length > 0 || batchesLoading) && (
        <Box sx={{ mb: 2.5 }}>
          <BatchPicker
            batches={batches}
            loading={batchesLoading}
            value={batchId}
            onChange={setBatchId}
            allowAll
            allLabel={studentView ? "All my batches" : "Shared grid"}
            helperText=" "
          />
        </Box>
      )}

      <Card>
        <CardContent sx={{ p: { xs: 1, md: 2 } }}>
          <TableContainer ref={tableRef} sx={{ overflowX: "auto" }}>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell
                    sx={{ fontWeight: 700, bgcolor: "#F8FAFC", whiteSpace: "nowrap" }}
                  >
                    Day
                  </TableCell>
                  {TIME_SLOTS.map((slot) => (
                    <TableCell
                      key={slot}
                      sx={{ fontWeight: 700, bgcolor: "#F8FAFC", whiteSpace: "nowrap" }}
                    >
                      {TIME_SLOT_LABELS[slot] || slot}
                    </TableCell>
                  ))}
                </TableRow>
              </TableHead>
              <TableBody>
                {grid.map((row) => (
                  <TableRow key={row.day} hover>
                    <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>
                      {row.day}
                    </TableCell>
                    {TIME_SLOTS.map((slot) => (
                      <TableCell
                        key={slot}
                        sx={{ whiteSpace: "pre-line", color: "text.secondary" }}
                      >
                        {row[slot]}
                      </TableCell>
                    ))}
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          {!loading && rows.length === 0 && (
            <Typography color="text.secondary" sx={{ p: 3, textAlign: "center" }}>
              No timetable has been published for this selection yet.
            </Typography>
          )}
        </CardContent>
      </Card>
    </PageShell>
  );
}
