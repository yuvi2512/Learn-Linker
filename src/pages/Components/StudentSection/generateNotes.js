import { useState } from "react";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  CardHeader,
  Divider,
} from "@mui/material";
import toast from "react-hot-toast";
import axios from "axios";
import { jsPDF } from "jspdf";

export default function Home() {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);

  const fetchNotes = async () => {
    if (!subject || !topic) {
      toast.error("Please enter both subject and topic");
      return;
    }

    setLoading(true);

    const toastId = toast.loading(
      "Generating detailed NCERT notes. This may take 1-2 minutes. ⚠️ Please do not switch tabs or go back while generation is in progress."
    );

    try {
      const response = await axios.post("/api/generate-notes", {
        subject,
        topic,
      });
      const { notes } = response.data;

      if (!notes) {
        throw new Error("No notes generated");
      }
      toast.dismiss(toastId);
      toast.success("Notes generated successfully!");
      saveAsPDF(notes);
    } catch (error) {
      toast.dismiss();
      toast.error("Failed to fetch notes. Please try again.");
    }

    setLoading(false);
  };

  const saveAsPDF = (notes) => {
    const doc = new jsPDF();
    const marginLeft = 10;
    const marginTop = 10;
    const pageHeight = doc.internal.pageSize.height;
    const maxWidth = 180;
    let y = marginTop + 20; // Start below the title

    doc.setFontSize(16);
    doc.text(`Subject: ${subject}`, marginLeft, marginTop);
    doc.text(`Topic: ${topic}`, marginLeft, marginTop + 10);
    doc.setFontSize(12);

    const splitNotes = doc.splitTextToSize(notes, maxWidth); // Split text to fit width

    splitNotes.forEach((line) => {
      if (y + 10 > pageHeight - 10) {
        doc.addPage();
        y = marginTop;
      }
      doc.text(line, marginLeft, y);
      y += 7;
    });

    doc.save(`${subject}_${topic}.pdf`);
  };

  return (
    <>
      <Grid container spacing={6}>
        <Grid item xs={12}>
          <Card sx={{ m: 5 }}>
            <CardHeader sx={{ pb: 2, pt: 2 }} title="Generate Notes" />
            <Divider />

            <CardContent>
              <Grid container spacing={5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    margin="normal"
                    label="Subject"
                    variant="outlined"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    variant="outlined"
                    margin="normal"
                    fullWidth
                    label="Topic"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </Grid>
                <Divider />

                <Grid item xs={12} sm={6}>
                  <Button
                    onClick={fetchNotes}
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    sx={{ margin: 2 }}
                  >
                    {loading ? "Generating..." : "Generate"}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </>
  );
}
