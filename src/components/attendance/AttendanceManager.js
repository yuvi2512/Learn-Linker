import React, { useState, useEffect, useMemo, useCallback } from "react";
import { DataGrid, GridToolbar } from "@mui/x-data-grid";
import {
  Card,
  CardContent,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tabs,
  Tab,
  Typography,
  Box,
  Button,
  Stack,
  Chip,
} from "@mui/material";
import moment from "moment";
import axios from "axios";
import toast from "react-hot-toast";
import PageShell from "@/components/layout/PageShell";
import BatchPicker from "@/components/batches/BatchPicker";
import { useBatchSelection } from "@/hooks/useBatches";
import { isPresent } from "@/utils/attendance";

function processAttendanceData(data) {
  const studentsMap = {};

  const uniqueDates = [
    ...new Set(data.map((item) => new Date(item.date).toLocaleDateString())),
  ];

  data.forEach((record) => {
    const formattedDate = new Date(record.date).toLocaleDateString();
    if (!studentsMap[record.student_id]) {
      studentsMap[record.student_id] = {
        id: record.student_id,
        student_name: record.student_name,
        present_count: 0,
      };
      uniqueDates.forEach((date) => {
        studentsMap[record.student_id][date] = "Absent";
      });
    }

    studentsMap[record.student_id][formattedDate] = isPresent(record)
      ? "Present"
      : "Absent";
    if (isPresent(record)) studentsMap[record.student_id].present_count++;
  });

  return {
    rows: Object.values(studentsMap).map((student) => ({
      ...student,
      total_classes: uniqueDates.length,
    })),
    columns: [
      { field: "student_name", headerName: "Student", flex: 1, minWidth: 160 },
      {
        field: "present_count",
        headerName: "Present",
        width: 110,
        align: "center",
        headerAlign: "center",
      },
      {
        field: "total_classes",
        headerName: "Classes",
        width: 110,
        align: "center",
        headerAlign: "center",
      },
      ...uniqueDates.map((date) => ({
        field: date,
        headerName: moment(date, "MM/DD/YYYY").format("DD/MM/YYYY"),
        width: 120,
        align: "center",
        headerAlign: "center",
      })),
    ],
  };
}

export default function AttendanceManager() {
  const {
    batches,
    loading: batchesLoading,
    batchId,
    setBatchId,
    selected,
  } = useBatchSelection();

  const [selectedIds, setSelectedIds] = useState([]);
  const [rows, setRows] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [attendanceColumns, setAttendanceColumns] = useState([]);
  const [pendingAttendance, setPendingAttendance] = useState([]);
  const [tab, setTab] = useState(0);
  const [selectedDate, setSelectedDate] = useState("");
  const [saving, setSaving] = useState(false);

  const fetchStudents = useCallback(async () => {
    if (!batchId) {
      setRows([]);
      return;
    }

    try {
      const response = await axios.get("/api/getStudentAPI", {
        params: { batchId },
      });
      if (Array.isArray(response.data)) {
        setRows(
          response.data.map((student, index) => ({
            ...student,
            srNo: index + 1,
          }))
        );
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Could not load the student list.");
    }
  }, [batchId]);

  const getAttendance = useCallback(async () => {
    if (!batchId) {
      setAttendanceRows([]);
      setAttendanceColumns([]);
      return;
    }

    try {
      const response = await axios.get("/api/AttendanceAPI", {
        params: { service: "GETATTENDANCE", batchId },
      });
      if (Array.isArray(response.data) && response.data.length > 0) {
        const processed = processAttendanceData(response.data);
        setAttendanceRows(processed.rows);
        setAttendanceColumns(processed.columns);
      } else {
        setAttendanceRows([]);
        setAttendanceColumns([]);
      }
    } catch (error) {
      console.error("Error getting attendance:", error);
      toast.error("Could not load the attendance register.");
    }
  }, [batchId]);

  useEffect(() => {
    getAttendance();
    fetchStudents();
    setSelectedIds([]);
  }, [getAttendance, fetchStudents]);

  const columns = useMemo(
    () => [
      { field: "srNo", headerName: "No.", width: 90 },
      { field: "name", headerName: "Student", flex: 1, minWidth: 200 },
    ],
    []
  );

  const checkExistingAttendance = async () => {
    try {
      const response = await axios.get("/api/AttendanceAPI", {
        params: { service: "CHECKATTENDANCE", selectedDate, batchId },
      });
      return Array.isArray(response.data) && response.data.length > 0;
    } catch (error) {
      console.error("Error checking attendance:", error);
      toast.error("Could not check the existing register.");
      return false;
    }
  };

  const submitAttendance = async (attendanceData) => {
    setSaving(true);
    try {
      const response = await axios.post("/api/AttendanceAPI", {
        batchId,
        subjects: attendanceData,
      });
      if (response.status === 200) {
        toast.success("Attendance saved.");
        await getAttendance();
        setSelectedIds([]);
        setTab(0);
      }
    } catch (error) {
      console.error("Error submitting attendance:", error);
      toast.error(error?.response?.data?.message || "Could not save attendance.");
    } finally {
      setSaving(false);
    }
  };

  const handleSubmit = async () => {
    if (!batchId) {
      toast.error("Pick a batch first.");
      return;
    }
    if (!selectedDate) {
      toast.error("Pick a class date first.");
      return;
    }
    if (rows.length === 0) {
      toast.error("There are no students on this batch's roll.");
      return;
    }

    // Grid selection ids are strings; student ids may be numbers or uuids.
    const presentIds = new Set(selectedIds.map(String));

    const prepared = rows.map((student) => {
      const present = presentIds.has(String(student.id));
      return {
        student_id: student.id,
        student_name: student.name,
        present: present ? "True" : "False",
        absent: present ? "False" : "True",
        date: selectedDate,
      };
    });

    const alreadyTaken = await checkExistingAttendance();

    setPendingAttendance(prepared);

    if (alreadyTaken) {
      setOpenDialog(true);
    } else {
      submitAttendance(prepared);
    }
  };

  const handleDialogClose = (confirmed) => {
    setOpenDialog(false);
    if (confirmed) {
      submitAttendance(pendingAttendance);
    }
  };

  const presentPreview = selectedIds.length;
  const absentPreview = Math.max(rows.length - presentPreview, 0);

  return (
    <PageShell
      title="Attendance"
      subtitle="Pick a batch, then review its register or mark today’s class."
    >
      <Card>
        <Box sx={{ px: 2, pt: 2 }}>
          <BatchPicker
            batches={batches}
            loading={batchesLoading}
            value={batchId}
            onChange={setBatchId}
            helperText={
              selected
                ? `${selected.student_count} ${
                    selected.student_count === 1 ? "student" : "students"
                  } on the roll`
                : " "
            }
          />
        </Box>
        <Box sx={{ px: 2, borderBottom: "1px solid", borderColor: "divider" }}>
          <Tabs value={tab} onChange={(event, value) => setTab(value)}>
            <Tab label="Register" />
            <Tab label="Take attendance" />
          </Tabs>
        </Box>
        <CardContent sx={{ p: { xs: 2, md: 3 } }}>
          {!batchId && !batchesLoading ? (
            <Box sx={{ py: 8, textAlign: "center" }}>
              <Typography variant="h6" sx={{ mb: 0.5 }}>
                No batch selected
              </Typography>
              <Typography color="text.secondary">
                Create a batch and add students to start taking attendance.
              </Typography>
            </Box>
          ) : (
            <>
              {tab === 0 &&
                (attendanceRows.length === 0 ? (
                  <Box sx={{ py: 8, textAlign: "center" }}>
                    <Typography variant="h6" sx={{ mb: 0.5 }}>
                      No attendance yet
                    </Typography>
                    <Typography color="text.secondary">
                      Switch to Take attendance to record the first class for this
                      batch.
                    </Typography>
                  </Box>
                ) : (
                  <Box sx={{ width: "100%" }}>
                    <DataGrid
                      rows={attendanceRows}
                      columns={attendanceColumns}
                      slots={{ toolbar: GridToolbar }}
                      slotProps={{ toolbar: { showQuickFilter: true } }}
                      autoHeight
                      disableRowSelectionOnClick
                    />
                  </Box>
                ))}

              {tab === 1 && (
                <Stack spacing={3}>
                  <TextField
                    variant="outlined"
                    label="Class date"
                    type="date"
                    value={selectedDate}
                    InputLabelProps={{ shrink: true }}
                    sx={{ maxWidth: 280 }}
                    onChange={(e) => setSelectedDate(e.target.value)}
                  />
                  <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                    {[
                      { label: "On roll", value: rows.length },
                      { label: "Present", value: presentPreview, color: "success" },
                      { label: "Absent", value: absentPreview, color: "warning" },
                    ].map((stat) => (
                      <Chip
                        key={stat.label}
                        label={`${stat.label}: ${stat.value}`}
                        color={stat.color || "default"}
                        variant={stat.color ? "outlined" : "filled"}
                        sx={{ height: 36, px: 0.5, fontSize: 13 }}
                      />
                    ))}
                  </Stack>
                  <DataGrid
                    autoHeight
                    rows={rows}
                    columns={columns}
                    getRowId={(row) => `${row.id}`}
                    checkboxSelection
                    rowSelectionModel={selectedIds}
                    onRowSelectionModelChange={setSelectedIds}
                    disableRowSelectionOnClick
                    localeText={{
                      noRowsLabel: "No students on this batch's roll yet",
                    }}
                  />
                  <Box>
                    <Button
                      variant="contained"
                      size="large"
                      onClick={handleSubmit}
                      disabled={saving}
                    >
                      {saving ? "Saving…" : "Submit attendance"}
                    </Button>
                  </Box>
                </Stack>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={() => handleDialogClose(false)}>
        <DialogTitle>Attendance already exists</DialogTitle>
        <DialogContent>
          <Typography color="text.secondary">
            A register for {selectedDate ? moment(selectedDate).format("DD MMM YYYY") : "this date"}{" "}
            is already saved for {selected?.name || "this batch"}. Replace it with the
            current selection?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 2 }}>
          <Button onClick={() => handleDialogClose(false)}>Cancel</Button>
          <Button variant="contained" onClick={() => handleDialogClose(true)} autoFocus>
            Replace
          </Button>
        </DialogActions>
      </Dialog>
    </PageShell>
  );
}
