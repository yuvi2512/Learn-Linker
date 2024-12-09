import React, { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  CardHeader,
  Divider,
  Box,
  Typography,
  paper
} from "@mui/material";
import axios from "axios";
import toast from "react-hot-toast";
import moment from "moment";
import { DataGrid } from "@mui/x-data-grid";

const UpcomingTest = () => {
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
      renderCell: params => (
       <>
      { moment(rows.date).format('DD/MM/YYYY')}
       </>
      )
    },
  ];

  const GetTests = async () => {
    try {
      const response = await axios.get("/api/UpcomingTestAPI");
      if (response.status === 200 && response.data.length > 0) {
        console.log(response.data);
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
        <Card sx={{ height: "100%" }}>
        <CardHeader sx={{ pb: 2, pt: 2 }} title="Upcoming Test" />
        <CardContent sx={{ pt: 0 }}>
          <DataGrid
            rows={rows}
            columns={columns}
            getRowId={(row) => `${row.id}`}
          />
        </CardContent>
      </Card>
    </>
  );
};

export default UpcomingTest;
