import { DataGrid,GridToolbar } from "@mui/x-data-grid";
import {
  Card,
  TextField,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Tabs,
  Tab,
  Typography,
} from "@mui/material";
import moment from "moment";
import Box from "@mui/material/Box";
import CardHeader from "@mui/material/CardHeader";
import CardContent from "@mui/material/CardContent";
import { Button, Divider } from "@mui/material";
import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import axios from "axios";
import toast from "react-hot-toast";

const Attendance = () => {
  const [selectedIds, setSelectedIds] = useState([]);
  const [rows, setRows] = useState([]);
  const [openDialog, setOpenDialog] = useState(false);
  const [attendanceRows, setAttendanceRows] = useState([]);
  const [attendanceColumns, setAttendanceColumns] = useState([]);

  const [attendanceData, setAttendanceData] = useState([]);
  const [attendanceCounts, setAttendanceCounts] = useState({
    total: rows.length,
    Absent: rows.length,
    Present: 0,
  });
  const [value, setValue] = useState(0);
  const [selectedDate, setSelectedDate] = useState();

  const { data: session } = useSession();

  console.log(session)
  const fetchData = async () => {
    try {
      const response = await axios.get("/api/getStudentAPI");
      if (response.data) {
        const sortedData = response.data
          .sort((a, b) => a.name.localeCompare(b.name))
          .map((student, index) => ({
            ...student,
            srNo: index + 1,
          }));
        setRows(sortedData);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch students data.");
    }
  };

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  useEffect(() => {
    GetAttendance();
    fetchData();
  }, []);

  const columns = [
    {
      field: "srNo",
      headerName: "Sr No.",
      width: 100,
    },
    {
      field: "name",
      headerName: "Name",
      width: 200,
    },
  ];

  const handleSelectionChange = (newSelection) => {
    setSelectedIds(newSelection);
  };

  const handleDialogClose = (confirmed) => {
    setOpenDialog(false);
    if (confirmed) {
      submitAttendance(attendanceData);
    } else {
      toast.success("Attendance update canceled.");
    }
  };

  const handleSubmit = async () => {
    if (!selectedDate) {
      toast.error("Please select a date before submitting!");
      return;
    }

    const alreadyTaken = await CheckAttendance();
    const presentCount = selectedIds.length;
    const absentCount = rows.length - presentCount;

    const preparedAttendanceData = rows.map((student) => {
      const isPresent = selectedIds.includes(student.id.toString());
      return {
        student_id: student.id,
        student_name: student.name,
        present: isPresent ? "True" : "False",
        absent: isPresent ? "False" : "True",
        date: selectedDate,
      };
    });

    setAttendanceCounts({
      total: rows.length,
      Present: presentCount,
      Absent: absentCount,
    });

    if (alreadyTaken) {
      setAttendanceData(preparedAttendanceData);
      setOpenDialog(true);
    } else {
      setAttendanceData(preparedAttendanceData);
      submitAttendance(preparedAttendanceData);
    }
  };

  const submitAttendance = async (attendanceData) => {
    try {
      const response = await axios.post("/api/AttendanceAPI", {
        subjects: attendanceData,
      });
      if (response.status === 200) {
        toast.success("Attendance submitted successfully!");
        GetAttendance();
        setValue(0)
      }
    } catch (error) {
      console.error("Error submitting attendance:", error);
      toast.error("Failed to submit attendance.");
    }
  };

  const CheckAttendance = async () => {
    try {
      const response = await axios.get("/api/AttendanceAPI", {
        params: { service: "CHECKATTENDANCE", selectedDate: selectedDate },
      });
      if (response.status === 200 && response.data.length > 0) {
        return true;
      }
    } catch (error) {
      console.error("Error checking attendance:", error);
      toast.error("Failed to check attendance.");
    }
    return false;
  };

  const GetAttendance = async () => {
    try {
      const response = await axios.get("/api/AttendanceAPI", {
        params: { service: "GETATTENDANCE" },
      });
      if (response.status === 200 && response.data.length > 0) {
        const { rows, columns } = processAttendanceData(response.data);
        setAttendanceRows(rows);
        setAttendanceColumns(columns);
      }
    } catch (error) {
      console.error("Error Getting attendance:", error);
      toast.error("Failed to get attendance.");
    }
  };

  const processAttendanceData = (data) => {
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
 
      studentsMap[record.student_id][formattedDate] = record.present
        ? "Present"
        : "Absent";
      if (record.present) studentsMap[record.student_id].present_count++;
    });

    return {
      rows: Object.values(studentsMap).map((student) => ({
        ...student,
        total_classes: uniqueDates.length,  // Total classes held
      })),
      columns: [
        { field: "student_name", headerName: "Student Name", flex: 1 },
        {
          field: "present_count",
          headerName: "Total Present",
          flex: 1,
          align: "center",
        },
        {
          field: "total_classes",
          headerName: "Total Classes Held",  // New column
          flex: 1,
          align: "center",
        },
        ...uniqueDates.map((date) => ({
          field: date,
          headerName: moment(date, "MM/DD/YYYY").format("DD/MM/YYYY"),
          flex: 1,
          align: "center",
          headerAlign: "center",
        })),
      ],
    };
  };

  return (
    <>
      <Card sx={{ m: 5 }}>
        <CardHeader sx={{ pb: 2, pt: 2 }} title="Attendance Summary" />
        <Divider />
        <CardContent sx={{ mt: 5 }}>
          <Tabs value={value} onChange={handleChange} centered>
            <Tab label="View Attendance" />
            <Tab label="Take Attendance" />
          </Tabs>
          {value === 0 && (
            <>
            {attendanceRows.length ===0 ? (
              <Typography variant="h6" sx={{ mt: 2 }}>
                No attendance data available.
              </Typography>
            ) : (
              <Box sx={{ width: "100%", height: 400 }}>
                <DataGrid
                  rows={attendanceRows}
                  columns={attendanceColumns}
                  pageSize={5}
                  slots={{ toolbar: GridToolbar }}
                  slotProps={{
                    toolbar: {
                      showQuickFilter: true,
                    },
                  }}
                  autoHeight
                />
              </Box>
            )}
            </>
          )}
          {value === 1 && (
            <>
              <Box sx={{ marginBottom: 2 }}>
                <TextField
                  variant="outlined"
                  size="small"
                  fullWidth
                  type="date"
                  onChange={(e) => setSelectedDate(e.target.value)}
                />
              </Box>
              <Box sx={{ height: "fit", width: "100%" }}>
                <DataGrid
                  rows={[
                    {
                      id: 1,
                      total: attendanceCounts.total,
                      Absent: attendanceCounts.Absent,
                      Present: attendanceCounts.Present,
                    },
                  ]}
                  columns={[
                    {
                      field: "total",
                      headerName: "Total No. of Students",
                      width: 150,
                    },
                    {
                      field: "Absent",
                      headerName: "Absent",
                      width: 150,
                    },
                    {
                      field: "Present",
                      headerName: "Present",
                      width: 150,
                    },
                    {
                      field: "submit",
                      headerName: "Submit",
                      width: 300,
                      renderCell: () => (
                        <Button variant="contained" onClick={handleSubmit}>
                          Submit
                        </Button>
                      ),
                    },
                  ]}
                  hideFooter
                />
              </Box>
              <DataGrid
                sx={{ mb: 2, mt: 4 }}
                rows={rows}
                columns={columns}
                getRowId={(row) => `${row.id}`}
                checkboxSelection
                onRowSelectionModelChange={(newSelection) => {
                  handleSelectionChange(newSelection);
                }}
              />
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={openDialog} onClose={() => handleDialogClose(false)}>
        <DialogTitle>Attendance Confirmation</DialogTitle>
        <DialogContent>
          Attendance has already been taken for this date. Do you want to update
          it?
        </DialogContent>
        <DialogActions>
          <Button
            variant="contained"
            onClick={() => handleDialogClose(false)}
            color="primary"
          >
            Cancel
          </Button>
          <Button
            variant="contained"
            onClick={() => handleDialogClose(true)}
            color="primary"
            autoFocus
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default Attendance;
