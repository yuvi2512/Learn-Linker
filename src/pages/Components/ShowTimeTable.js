import React, { useEffect, useState, useRef } from "react";
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
  CardHeader,
  CardContent,
  Divider,
  Paper,
  Button,
} from "@mui/material";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";

const ShowTimeTable = () => {
  const [timeTable, setTimeTable] = useState([]);
  const tableRef = useRef();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get("/api/TimeTableAPI");
        if (response.data) {
          setTimeTable(response.data);
          toast.success("Data fetched successfully!");
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to fetch timetable data.");
      }
    };

    fetchData();
  }, []);

  const handleSavePDF = async () => {
    const table = tableRef.current;
    if (!table) return;

    const canvas = await html2canvas(table);
    const imgData = canvas.toDataURL("image/png");
    const pdf = new jsPDF("l", "mm", "a4");
    const imgWidth = 280;
    const imgHeight = (canvas.height * imgWidth) / canvas.width;

    pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
    pdf.save("TimeTable.pdf");
  };

  const days = [
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];
  const timeSlots = [
    "08:00 - 09:00",
    "09:00 - 10:00",
    "10:00 - 11:00",
    "11:00 - 12:00",
    "12:00 - 01:00",
    "02:00 - 03:00",
    "03:00 - 04:00",
  ];

  const timeSlotMapping = {
    "8-9 AM": "08:00 - 09:00",
    "9-10 AM": "09:00 - 10:00",
    "10-11 AM": "10:00 - 11:00",
    "11-12 PM": "11:00 - 12:00",
    "12-1 PM": "12:00 - 01:00",
    "2-3 PM": "02:00 - 03:00",
    "3-4 PM": "03:00 - 04:00",
  };

  const subjectSchedule = [];
  timeTable.forEach((item) => {
    const slot = timeSlotMapping[item.timeslot];
    if (slot) {
      for (let i = 0; i < parseInt(item.classesperweek, 10); i++) {
        subjectSchedule.push({
          subject: item.subject,
          teacher: item.teachername,
          slot,
        });
      }
    }
  });

  const structuredTimeTable = days.map((day, dayIndex) => {
    const row = { day };
    timeSlots.forEach((slot) => {
      const subjectEntry = subjectSchedule.find(
        (entry, index) =>
          index % days.length === dayIndex && entry.slot === slot
      );
      row[slot] = subjectEntry
        ? `${subjectEntry.subject} \n(${subjectEntry.teacher})`
        : "-";
    });
    return row;
  });

  return (
    <>
      <Card sx={{ m: 5 }}>
        <CardHeader sx={{ pb: 2, pt: 2 }} title="Class Time Table" />
        <Divider />
        <CardContent sx={{ mt: 5 }}>
        <TableContainer
          component={Paper}
          ref={tableRef}
          style={{ marginBottom: "20px" }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <strong>Day</strong>
                </TableCell>
                {timeSlots.map((slot) => (
                  <TableCell key={slot}>
                    <strong>{slot}</strong>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {structuredTimeTable.map((row, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <strong>{row.day}</strong>
                  </TableCell>
                  {timeSlots.map((slot) => (
                    <TableCell key={slot}>{row[slot]}</TableCell>
                  ))}
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <Button variant="contained" color="primary" onClick={handleSavePDF}>
          Save as PDF
        </Button>
        </CardContent>
      </Card>
    </>
  );
};

export default ShowTimeTable;
