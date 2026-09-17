import { useState } from "react";
import {
  Card,
  CardContent,
  TextField,
  Button,
  Grid,
  Typography,
  Box,
  CircularProgress,
} from "@mui/material";
import toast from "react-hot-toast";
import axios from "axios";
import { jsPDF } from "jspdf";
import PageShell from "@/components/layout/PageShell";

export default function NotesGenerator() {
  const [subject, setSubject] = useState("");
  const [topic, setTopic] = useState("");
  const [loading, setLoading] = useState(false);

  const saveAsPDF = (notes) => {
    const doc = new jsPDF();
    const marginLeft = 10;
    const marginTop = 10;
    const pageHeight = doc.internal.pageSize.height;
    const maxWidth = 180;
    let y = marginTop + 20;

    doc.setFontSize(16);
    doc.text(`Subject: ${subject}`, marginLeft, marginTop);
    doc.text(`Topic: ${topic}`, marginLeft, marginTop + 10);
    doc.setFontSize(12);

    doc.splitTextToSize(notes, maxWidth).forEach((line) => {
      if (y + 10 > pageHeight - 10) {
        doc.addPage();
        y = marginTop;
      }
      doc.text(line, marginLeft, y);
      y += 7;
    });

    doc.save(`${subject}_${topic}.pdf`);
  };

  const fetchNotes = async () => {
    if (!subject || !topic) {
      toast.error("Enter both a subject and a topic.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading(
      "Generating detailed notes. Stay on this page — it can take a minute or two."
    );

    try {
      const response = await axios.post("/api/generate-notes", { subject, topic });
      const { notes } = response.data;

      if (!notes) throw new Error("No notes generated");

      toast.dismiss(toastId);
      toast.success("Notes ready. Downloading PDF.");
      saveAsPDF(notes);
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(
        error?.response?.data?.message || "Could not generate notes. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <PageShell
      title="Study notes"
      subtitle="Enter a subject and topic. We’ll generate a structured PDF you can revise from."
    >
      <Grid container spacing={3}>
        <Grid item xs={12} md={7}>
          <Card>
            <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
              <Grid container spacing={2.5}>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Subject"
                    placeholder="e.g. Physics"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    fullWidth
                    label="Topic"
                    placeholder="e.g. Newton’s laws"
                    value={topic}
                    onChange={(e) => setTopic(e.target.value)}
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    onClick={fetchNotes}
                    variant="contained"
                    size="large"
                    disabled={loading}
                    startIcon={
                      loading ? <CircularProgress size={16} color="inherit" /> : null
                    }
                  >
                    {loading ? "Generating…" : "Generate PDF"}
                  </Button>
                </Grid>
              </Grid>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={5}>
          <Box
            sx={{
              height: "100%",
              p: 3,
              borderRadius: 4,
              border: "1px dashed #CBD5E1",
              bgcolor: "#F8FAFC",
            }}
          >
            <Typography variant="h6" sx={{ mb: 1 }}>
              How it works
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              Keep this tab open while notes generate. When they’re ready, a PDF
              downloads automatically.
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Use a precise topic name for better coverage — chapter titles work well.
            </Typography>
          </Box>
        </Grid>
      </Grid>
    </PageShell>
  );
}
