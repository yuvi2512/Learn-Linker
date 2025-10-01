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

const GenerateMarksheet = () => {
  const [selectedStudent, setSelectedStudent] = useState("");
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([{ subject: "", marks: "" }]);

  const fetchData = async () => {
    try {
      const response = await axios.get("/api/getStudentAPI");
      if (response.data) {
        setStudents(response.data);
        toast.success("Students data fetched successfully!");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch students data.");
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleStudentChange = (event) => {
    setSelectedStudent(event.target.value);
  };

  const handleAddRow = () => {
    setSubjects([...subjects, { subject: "", marks: "" }]);
  };

  const handleSubjectChange = (index, event) => {
    const updatedSubjects = subjects.map((row, i) =>
      i === index ? { ...row, [event.target.name]: event.target.value } : row
    );
    setSubjects(updatedSubjects);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const selectedStudentInfo = students.find(
      (student) => student.id === selectedStudent
    );

    const data = subjects.map((subjectRow) => ({
      ...subjectRow,
      studentId: selectedStudentInfo.id,
      studentName: selectedStudentInfo.name,
    }));

    try {
      const response = await axios.post("/api/MarksheetAPI", {
        subjects: data,
      });

      if (response.status === 200) {
       
        toast.success("Marksheet generated successfully!");
        
        setSelectedStudent("");
        setSubjects([{ subject: "", marks: "" }]);

      } else {
        console.error("Error inserting data:", response.data.error);
        toast.error("Failed to generate marksheet.");
      }
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error(
        "An unexpected error occurred while generating the marksheet."
      );
    }
  };

  const selectedStudentInfo = students.find(
    (student) => student.id === selectedStudent
  );

  const handleRemoveRow = (index) => {
    const updatedSubjects = subjects.filter((_, i) => i !== index);
    setSubjects(updatedSubjects);
    toast.success("Subject row removed successfully!");
  };

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card sx={{m: 5}}>
          <CardHeader sx={{ pb: 2, pt: 2 }} title="Generate Marksheet" />
          <Divider />

          <CardContent>
            <Grid container spacing={5}>
              <Grid item xs={12} sm={5}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Student Id"
                  variant="outlined"
                  value={
                    selectedStudentInfo ? selectedStudentInfo.id : ""
                  }
                  disabled
                />
              </Grid>
              <Grid item xs={12} sm={5}>
                <TextField
                  select
                  fullWidth
                  margin="normal"
                  label="Select Student"
                  variant="outlined"
                  value={selectedStudent}
                  onChange={handleStudentChange}
                >
                  {students.map((student) => (
                    <MenuItem
                      key={student.id}
                      value={student.id}
                    >
                      {student.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Divider />

              {subjects.map((subjectRow, index) => (
                <React.Fragment key={index}>
                  <Grid item xs={12} sm={5}>
                    <TextField
                      fullWidth
                      margin="normal"
                      label="Subject Name"
                      variant="outlined"
                      name="subject"
                      value={subjectRow.subject}
                      onChange={(event) => handleSubjectChange(index, event)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={5}>
                    <TextField
                      fullWidth
                      margin="normal"
                      label="Marks"
                      variant="outlined"
                      name="marks"
                      type="number"
                      value={subjectRow.marks}
                      onChange={(event) => handleSubjectChange(index, event)}
                    />
                  </Grid>
                  <Grid item xs={12} sm={2}>
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
                  type="button"
                  variant="contained"
                  color="primary"
                  sx={{ margin: 2 }}
                  onClick={handleAddRow}
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

export default withAuth(GenerateMarksheet, ["teacher"]);
