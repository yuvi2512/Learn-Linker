import React, { useEffect, useState } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { useSession } from "next-auth/react";
import moment from "moment";
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
import { DataGrid } from "@mui/x-data-grid";

const Assignment = () => {
  const { data: session } = useSession();
  const [Rows, setRows] = useState([])
  const [ermsg, setErmsg] = useState('')

  const fetchData = async () => {
    try {
      const response = await axios.get(
        `/api/AssignmentAPI`
      );
      if (response.data) {
        setRows(response.data);
        toast.success("Data fetched successfully!");
      }
    } catch (error) {
      console.error("Error fetching data:", error);
      toast.error("Failed to fetch Data.");
      setErmsg(error?.response?.data?.message)
    }
  };

  useEffect(() => {
    if (session?.user?.name) fetchData();
  }, [session?.user?.name]);

  const columns = [
    {
      field: "subject",
      headerName: "Subject",
      width: 200,
    },
    {
      field: "description",
      headerName: "Description",
      width: 700,
    },
    {
      field: "end_date",
      headerName: "End Date",
      width: 200,
      renderCell: params => (
        <>
          {moment(params.row.end_date).format('DD/MM/YYYY')}
        </>
      )
    },
  ];

  return (
    <>

      <Card sx={{ m: 5 }}>
        <CardHeader sx={{ pb: 2, pt: 2 }} title="Assignments" />
        <CardContent sx={{ pt: 0 }}>
          {ermsg ? (
            <Typography
              color="primary"
              variant="h5"
              sx={{ mt: 2, textAlign: "center" }}
            >
              {ermsg}
            </Typography>
          ) : (
            <DataGrid
              rows={Rows}
              columns={columns}
              getRowId={(row) => `${row.id}`}
            />
          )}
        </CardContent>
      </Card>

    </>
  );
};

export default Assignment;
