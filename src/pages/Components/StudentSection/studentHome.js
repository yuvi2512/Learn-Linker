"use client";
import React, { useEffect, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import {
  Button,
  Container,
  Grid,
  Typography,
  Box,
  Card,
  CardContent,
  Avatar,
} from "@mui/material";
import { AppBar, Toolbar } from "@mui/material";
import Image from "next/image";
import axios from "axios";
import toast from "react-hot-toast";
import AttendanceChart from "@/pages/Components/AttendanceChart";
import UpcomingTest from "./UpcomingTest";
import withAuth from "@/utils/withAuth";

const HomePage = () => {
  const [AttendanceData, setAttendanceData] = useState([]);
  const { data: session, status } = useSession();
  console.log("Session:", session?.user?.id);

  const getAttendance = async () => {
    try {
      const response = await axios.get("/api/getAttendance", {
        params: { studentId: session?.user?.id },
      });
      if (response.status === 200 && response.data.length > 0) {
        setAttendanceData(response.data);
      }
    } catch (error) {
      console.error("Error checking attendance:", error);
      toast.error("Failed to get attendance.");
    }
  };

  useEffect(() => {
    if (session?.user?.id) getAttendance();
  }, [session?.user?.id]);

  return (
    <>
      <Grid container spacing={6}>
        <Grid item xs={12} sm={6} lg={6}>
          {AttendanceData && (
            <AttendanceChart attendanceData={AttendanceData} studentName={session?.user?.name}/>
          )}
        </Grid>
        <Grid item xs={12} sm={6} lg={6}>
          <UpcomingTest />
        </Grid>
      </Grid>
    </>
  );
};

export default withAuth(HomePage, ["student"]);
