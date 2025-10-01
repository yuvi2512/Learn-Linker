import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  CardHeader,
  Divider,
  MenuItem,
  IconButton,
} from "@mui/material";
import DeleteIcon from "@mui/icons-material/Delete";
import axios from "axios";
import toast from "react-hot-toast";
import withAuth from "@/utils/withAuth";

const timeSlots = [
  "8-9 AM",
  "9-10 AM",
  "10-11 AM",
  "11-12 PM",
  "12-1 PM",
  "2-3 PM",
  "3-4 PM",
];

const GenerateTimeTable = () => {
  const [teachers, setTeachers] = useState([]);
  const [subjects, setSubjects] = useState([
    {
      subject: "",
      teacherId: "",
      classesPerWeek: "",
      timeSlot: "",
    },
  ]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/AttendanceAPI", {
          params: { service: "GETTEACHERS" },
        });
        if (response.data) {
          setTeachers(response.data);
          toast.success("Teachers data fetched successfully!");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch teachers data.");
      }
    };

    fetchData();
  }, []);

  const handleChange = (index, event) => {
    const { name, value } = event.target;
    setSubjects((prevSubjects) =>
      prevSubjects.map((subject, i) =>
        i === index ? { ...subject, [name]: value } : subject
      )
    );
  };

  const handleAddRow = () => {
    setSubjects([
      ...subjects,
      {
        subject: "",
        teacherId: "",
        classesPerWeek: "",
        timeSlot: "",
      },
    ]);
  };

  const handleRemoveRow = (index) => {
    setSubjects(subjects.filter((_, i) => i !== index));
    toast.success("Subject row removed successfully!");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
  
    try {
      const response = await axios.post("/api/TimeTableAPI", { timetable: subjects });
      if (response.status === 200) {
        toast.success("Timetable generated successfully!");
        setSubjects([{ subject: "", teacherId: "", classesPerWeek: "", timeSlot: "" }]);
      } else {
        toast.error("Failed to generate timetable.");
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("An unexpected error occurred while generating the timetable.");
    }
  };

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card sx={{ m: 5 }}>
          <CardHeader sx={{ pb: 2, pt: 2 }} title="Generate TimeTable" />
          <Divider />
          <CardContent>
            <Grid container spacing={5}>
              {subjects.map((subjectRow, index) => (
                <React.Fragment key={index}>
                  <Grid item xs={12} sm={2.5}>
                    <TextField
                      fullWidth
                      margin="normal"
                      label="Subject Name"
                      variant="outlined"
                      name="subject"
                      value={subjectRow.subject}
                      onChange={(event) => handleChange(index, event)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2.5}>
                    <TextField
                      select
                      fullWidth
                      margin="normal"
                      label="Select Teacher"
                      variant="outlined"
                      name="teacherId"
                      value={subjectRow.teacherId}
                      onChange={(event) => handleChange(index, event)}
                    >
                      {teachers.map((teacher) => (
                        <MenuItem key={teacher.name} value={teacher.name}>
                          {teacher.name}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      fullWidth
                      margin="normal"
                      label="Classes per Week"
                      variant="outlined"
                      name="classesPerWeek"
                      type="number"
                      value={subjectRow.classesPerWeek}
                      onChange={(event) => handleChange(index, event)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={3}>
                    <TextField
                      select
                      fullWidth
                      margin="normal"
                      label="Select Time Slot"
                      variant="outlined"
                      name="timeSlot"
                      value={subjectRow.timeSlot}
                      onChange={(event) => handleChange(index, event)}
                    >
                      {timeSlots.map((slot, i) => (
                        <MenuItem key={i} value={slot}>
                          {slot}
                        </MenuItem>
                      ))}
                    </TextField>
                  </Grid>
                  <Grid item xs={12} sm={1}>
                    <IconButton
                      onClick={() => handleRemoveRow(index)}
                      sx={{ marginTop: 2 }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Grid>
                </React.Fragment>
              ))}
              <Grid item xs={12} sm={6}>
                <Button
                  onClick={handleSubmit}
                  variant="contained"
                  color="primary"
                  sx={{ margin: 2 }}
                >
                  Submit
                </Button>
                <Button
                  onClick={handleAddRow}
                  variant="contained"
                  color="primary"
                  sx={{ margin: 2 }}
                >
                  Add Row
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default withAuth(GenerateTimeTable, ["teacher"]);
