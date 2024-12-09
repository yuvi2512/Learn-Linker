import React, { useState } from "react";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  CardHeader,
  Divider,
} from "@mui/material";
import axios from "axios";
import toast from "react-hot-toast";

const Assignments = () => {
  const [selectedSubject, setSelectedSubject] = useState("");
  const [EndDate, setEndDate] = useState("");
  const [assignmentDescription, setAssignmentDescription] = useState("");

  const handleSubjectChange = (event) => {
    setSelectedSubject(event.target.value);
  };

  const handleDescriptionChange = (event) => {
    setAssignmentDescription(event.target.value);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const payload = {
      subject: selectedSubject,
      end_date: EndDate,
      description: assignmentDescription,
    };

    try {
      const response = await axios.post("/api/AssignmentAPI", {
        data: payload,
      });
      if (response.status === 200) {
        toast.success("Assignment Uploaded successfully!");

        setSelectedSubject("");
        setEndDate("");
        setAssignmentDescription("");
      }
    } catch (error) {
      console.error("Error submitting attendance:", error);
      toast.error("Failed to Upload Assignment.");
    }
  };

  return (
    <Grid container spacing={6}>
      <Grid item xs={12}>
        <Card sx={{ m: 5 }}>
          <CardHeader sx={{ pb: 2, pt: 2 }} title="Assignments" />
          <Divider />

          <CardContent>
            <Grid container spacing={5}>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  margin="normal"
                  label="Subject"
                  variant="outlined"
                  value={selectedSubject}
                  onChange={handleSubjectChange}
                />
              </Grid>
              <Grid item xs={12} sm={6}>

                <TextField
                  variant="outlined"
                  fullWidth
                  margin="normal"
                  type="date"
                  value={EndDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
              </Grid>
              <Grid item xs={12} sm={12}>
                <TextField
                  multiline
                  fullWidth
                  rows={4}
                  label="Assignment Description"
                  variant="outlined"
                  value={assignmentDescription}
                  onChange={handleDescriptionChange}
                />
              </Grid>
              <Divider />

              <Grid item xs={12} sm={6}>
                <Button
                  onClick={handleSubmit}
                  variant="contained"
                  color="primary" 
                  sx={{ margin: 2 }}
                >
                  Submit
                </Button>
              </Grid>
            </Grid>
          </CardContent>
        </Card>
      </Grid>
    </Grid>
  );
};

export default Assignments;
