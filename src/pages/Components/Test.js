import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  CardHeader,
  Divider,
  Typography,
  IconButton,
} from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import axios from "axios";
import toast from "react-hot-toast";
import moment from "moment";
import DeleteIcon from "@mui/icons-material/Delete";

const Test = () => {
  const [rows, setRows] = useState([]);

  const columns = [
    {
      field: "subject",
      headerName: "Subject",
      width: 200,
    },
    {
      field: "date",
      headerName: "Date",
      width: 200,
      renderCell: (params) => (
        <>{moment(params.row.date).format("DD/MM/YYYY")}</>
      ),
    },
    {
      field: "actions",
      headerName: "Action",
      width: 200,
      renderCell: (params) => (
        <IconButton
          onClick={() => handleDelete(params.row.subject, params.row.date)}
        >
          <DeleteIcon />
        </IconButton>
      ),
    },
  ];

  const [formData, setFormData] = useState({
    date: "",
    subject: "",
  });

  const handleDateChange = (e) => {
    setFormData({ ...formData, date: e.target.value });
  };

  const handleSubjectChange = (e) => {
    setFormData({ ...formData, subject: e.target.value });
  };

  const handleSubmit = async () => {
    try {
      const response = await axios.post("/api/UpcomingTestAPI", {
        data: formData,
      });
      if (response.status === 200) {
        toast.success("Test Uploaded successfully!");
        GetTests();
        setFormData({
          date: "",
          subject: "",
        });
      }
    } catch (error) {
      console.error("Error submitting attendance:", error);
      toast.error("Failed to Upload Test.");
    }
  };

  const handleDelete = async (subject, date) => {
    const formattedDate = moment(date).format("YYYY/MM/DD");
    try {
      const response = await axios.delete("/api/UpcomingTestAPI", {
        data: { data: { subject, date: formattedDate } },
      });

      if (response.status === 200) {
        toast.success("Test deleted successfully!");

        GetTests();
      }
    } catch (error) {
      console.error("Error deleting test:", error);
      toast.error("Failed to delete test.");
    }
  };

  const GetTests = async () => {
    try {
      const response = await axios.get("/api/UpcomingTestAPI");
      if (response.status === 200 && response.data) {
        setRows(response.data);
      }
    } catch (error) {
      console.error("Error Getting Data:", error);
      toast.error("Failed to Get Tests.");
    }
  };

  useEffect(() => {
    GetTests();
  }, []);

  return (
    <>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card sx={{ m: 5 }}>
            <CardHeader sx={{ pb: 2, pt: 2 }} title="Add Test" />
            <Divider />

            <CardContent sx={{ mb: 2, mt: 4 }}>
              <Grid container spacing={5}>
                <Grid item xs={12} sm={5}>
                  <Typography>Select Date</Typography>
                  <TextField
                    variant="outlined"
                    fullWidth
                    type="date"
                    value={formData.date}
                    onChange={handleDateChange}
                  />
                </Grid>
                <Grid item xs={12} sm={5}>
                  <Typography>Enter Subject</Typography>
                  <TextField
                    fullWidth
                    variant="outlined"
                    value={formData.subject}
                    onChange={handleSubjectChange}
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
              <DataGrid
                rows={rows}
                columns={columns}
                getRowId={(row) => `${row.id}`}
                disableRowSelectionOnClick
              />
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
};

export default Test;
