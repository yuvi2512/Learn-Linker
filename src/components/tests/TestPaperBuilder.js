import { useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  MenuItem,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import DownloadRoundedIcon from "@mui/icons-material/DownloadRounded";
import axios from "axios";
import toast from "react-hot-toast";
import { jsPDF } from "jspdf";
import Link from "next/link";
import PageShell from "@/components/layout/PageShell";
import {
  NCERT_CLASSES,
  QUESTION_TYPES,
  ncertBookTitle,
  subjectsForClass,
} from "@/utils/ncert";

const TYPE_LABEL = Object.fromEntries(QUESTION_TYPES.map((item) => [item.id, item.label]));

function typeChipColor(type) {
  if (type === "mcq") return "info";
  if (type === "long") return "warning";
  return "default";
}

function writeWrapped(doc, text, x, y, maxWidth, lineHeight = 6) {
  const lines = doc.splitTextToSize(String(text || ""), maxWidth);
  lines.forEach((line) => {
    if (y > 280) {
      doc.addPage();
      y = 18;
    }
    doc.text(line, x, y);
    y += lineHeight;
  });
  return y;
}

function buildPdf({ paper, includeAnswers }) {
  const doc = new jsPDF();
  const title = includeAnswers ? `${paper.title} — Answer key` : paper.title;

  doc.setFontSize(16);
  doc.text("Learn Linker", 105, 16, { align: "center" });
  doc.setFontSize(13);
  doc.text(title, 105, 24, { align: "center" });
  doc.setFontSize(10);
  doc.text(
    `${paper.ncertBook}  ·  Chapter: ${paper.chapter}  ·  ${paper.totalMarks} marks  ·  ${paper.durationMinutes} min`,
    105,
    31,
    { align: "center" }
  );

  let y = 42;
  doc.setFontSize(10);
  (paper.instructions || []).forEach((line, index) => {
    y = writeWrapped(doc, `${index + 1}. ${line}`, 14, y, 182, 5);
  });

  y += 4;
  doc.setDrawColor(200);
  doc.line(14, y, 196, y);
  y += 8;

  paper.questions.forEach((question, index) => {
    if (y > 250) {
      doc.addPage();
      y = 18;
    }

    doc.setFontSize(11);
    y = writeWrapped(
      doc,
      `Q${index + 1}. (${question.marks} mark${question.marks === 1 ? "" : "s"})  ${question.text}`,
      14,
      y,
      182,
      6
    );

    if (question.type === "mcq" && Array.isArray(question.options)) {
      question.options.forEach((option, optionIndex) => {
        if (!option) return;
        const letter = String.fromCharCode(65 + optionIndex);
        y = writeWrapped(doc, `(${letter})  ${option}`, 20, y, 176, 5);
      });
    }

    if (includeAnswers) {
      doc.setFontSize(9);
      y = writeWrapped(doc, `Answer: ${question.answer || "—"}`, 20, y + 1, 176, 5);
      y = writeWrapped(doc, `NCERT: ${question.ncertCitation || "—"}`, 20, y, 176, 5);
    }

    y += 5;
  });

  const suffix = includeAnswers ? "answer-key" : "paper";
  doc.save(
    `NCERT_Class${paper.classNumber}_${paper.subject}_${paper.chapter}_${suffix}.pdf`.replace(
      /\s+/g,
      "_"
    )
  );
}

export default function TestPaperBuilder() {
  const [classNumber, setClassNumber] = useState(10);
  const [subject, setSubject] = useState("Science");
  const [chapter, setChapter] = useState("");
  const [mcq, setMcq] = useState(8);
  const [veryShort, setVeryShort] = useState(4);
  const [short, setShort] = useState(3);
  const [long, setLong] = useState(1);
  const [loading, setLoading] = useState(false);
  const [paper, setPaper] = useState(null);

  const subjects = subjectsForClass(classNumber);

  const totalMarks = useMemo(() => {
    if (!paper?.questions) return 0;
    return paper.questions.reduce((sum, item) => sum + Number(item.marks || 0), 0);
  }, [paper]);

  const handleClassChange = (event) => {
    const next = Number(event.target.value);
    setClassNumber(next);
    const nextSubjects = subjectsForClass(next);
    if (!nextSubjects.includes(subject)) {
      setSubject(nextSubjects[0] || "");
    }
    setPaper(null);
  };

  const updateQuestion = (id, patch) => {
    setPaper((current) => {
      if (!current) return current;
      return {
        ...current,
        questions: current.questions.map((item) =>
          item.id === id ? { ...item, ...patch } : item
        ),
      };
    });
  };

  const updateOption = (id, optionIndex, value) => {
    setPaper((current) => {
      if (!current) return current;
      return {
        ...current,
        questions: current.questions.map((item) => {
          if (item.id !== id) return item;
          const options = [...(item.options || ["", "", "", ""])];
          options[optionIndex] = value;
          return { ...item, options };
        }),
      };
    });
  };

  const removeQuestion = (id) => {
    setPaper((current) => {
      if (!current) return current;
      return {
        ...current,
        questions: current.questions.filter((item) => item.id !== id),
      };
    });
  };

  const generate = async () => {
    if (!chapter.trim()) {
      toast.error("Enter the NCERT chapter name.");
      return;
    }

    setLoading(true);
    const toastId = toast.loading(
      "Drafting an NCERT-only paper. Stay on this page — it can take up to a minute."
    );

    try {
      const response = await axios.post("/api/generate-test-paper", {
        classNumber,
        subject,
        chapter: chapter.trim(),
        mcq,
        veryShort,
        short,
        long,
      });
      const next = response.data?.paper;
      if (!next?.questions?.length) {
        throw new Error("empty");
      }
      setPaper({
        ...next,
        questions: next.questions.map((item, index) => ({
          ...item,
          id: item.id || String(index + 1),
        })),
      });
      toast.dismiss(toastId);
      toast.success("Draft ready. Check the NCERT citations before you print.");
    } catch (error) {
      toast.dismiss(toastId);
      toast.error(
        error?.response?.data?.message || "Could not generate the paper. Try again."
      );
    } finally {
      setLoading(false);
    }
  };

  const downloadPaper = () => {
    if (!paper) return;
    buildPdf({ paper: { ...paper, totalMarks }, includeAnswers: false });
  };

  const downloadKey = () => {
    if (!paper) return;
    buildPdf({ paper: { ...paper, totalMarks }, includeAnswers: true });
  };

  return (
    <PageShell
      title="NCERT test paper"
      subtitle="Teachers get a draft from the official NCERT textbook only. Edit anything that looks off, then download the student paper and the answer key."
      action={
        <Button component={Link} href="/tests" variant="text">
          Back to tests
        </Button>
      }
    >
      <Alert severity="info" sx={{ mb: 3 }}>
        Questions are generated from the NCERT book for the class and subject you pick.
        Competitive-exam or guide-book topics are rejected. Always read the chapter
        citations before you use the paper in class.
      </Alert>

      <Card sx={{ mb: 3 }}>
        <CardContent sx={{ p: { xs: 2.5, md: 3.5 } }}>
          <Grid container spacing={2.5}>
            <Grid item xs={12} sm={4} md={2}>
              <TextField
                select
                fullWidth
                label="NCERT class"
                value={classNumber}
                onChange={handleClassChange}
              >
                {NCERT_CLASSES.map((value) => (
                  <MenuItem key={value} value={value}>
                    Class {value}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} sm={8} md={4}>
              <TextField
                select
                fullWidth
                label="NCERT subject"
                value={subjects.includes(subject) ? subject : ""}
                onChange={(event) => {
                  setSubject(event.target.value);
                  setPaper(null);
                }}
                helperText={ncertBookTitle(classNumber, subject || "…")}
              >
                {subjects.map((name) => (
                  <MenuItem key={name} value={name}>
                    {name}
                  </MenuItem>
                ))}
              </TextField>
            </Grid>
            <Grid item xs={12} md={6}>
              <TextField
                fullWidth
                label="NCERT chapter"
                placeholder="e.g. Life Processes"
                value={chapter}
                onChange={(e) => setChapter(e.target.value)}
                helperText="Use the chapter title as printed in the NCERT textbook."
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                type="number"
                label="MCQs"
                value={mcq}
                inputProps={{ min: 0, max: 15 }}
                onChange={(e) => setMcq(e.target.value)}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                type="number"
                label="Very short"
                value={veryShort}
                inputProps={{ min: 0, max: 10 }}
                onChange={(e) => setVeryShort(e.target.value)}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                type="number"
                label="Short"
                value={short}
                inputProps={{ min: 0, max: 8 }}
                onChange={(e) => setShort(e.target.value)}
              />
            </Grid>
            <Grid item xs={6} sm={3}>
              <TextField
                fullWidth
                type="number"
                label="Long"
                value={long}
                inputProps={{ min: 0, max: 5 }}
                onChange={(e) => setLong(e.target.value)}
              />
            </Grid>
            <Grid item xs={12}>
              <Button
                variant="contained"
                size="large"
                onClick={generate}
                disabled={loading}
                startIcon={loading ? <CircularProgress size={16} color="inherit" /> : null}
              >
                {loading ? "Drafting from NCERT…" : "Generate paper"}
              </Button>
            </Grid>
          </Grid>
        </CardContent>
      </Card>

      {paper && (
        <Stack spacing={2.5}>
          <Card>
            <CardContent sx={{ p: { xs: 2.5, md: 3 } }}>
              <Stack
                direction={{ xs: "column", md: "row" }}
                spacing={2}
                alignItems={{ xs: "flex-start", md: "center" }}
                justifyContent="space-between"
              >
                <Box>
                  <Typography variant="h6">{paper.title}</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {paper.ncertBook} · {paper.chapter} · {totalMarks} marks ·{" "}
                    {paper.durationMinutes} minutes · {paper.questions.length} questions
                  </Typography>
                </Box>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                  <Button
                    variant="outlined"
                    startIcon={<DownloadRoundedIcon />}
                    onClick={downloadPaper}
                  >
                    Student PDF
                  </Button>
                  <Button
                    variant="contained"
                    startIcon={<DownloadRoundedIcon />}
                    onClick={downloadKey}
                  >
                    Answer key
                  </Button>
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {paper.questions.map((question, index) => (
            <Card key={question.id}>
              <CardContent sx={{ p: { xs: 2, md: 2.5 } }}>
                <Stack
                  direction="row"
                  alignItems="center"
                  justifyContent="space-between"
                  sx={{ mb: 1.5 }}
                >
                  <Stack direction="row" spacing={1} alignItems="center">
                    <Typography sx={{ fontWeight: 700 }}>Q{index + 1}</Typography>
                    <Chip
                      size="small"
                      label={TYPE_LABEL[question.type] || question.type}
                      color={typeChipColor(question.type)}
                    />
                  </Stack>
                  <IconButton
                    aria-label="Remove question"
                    onClick={() => removeQuestion(question.id)}
                  >
                    <DeleteOutlineRoundedIcon fontSize="small" />
                  </IconButton>
                </Stack>

                <Grid container spacing={2}>
                  <Grid item xs={12} sm={2}>
                    <TextField
                      fullWidth
                      type="number"
                      label="Marks"
                      value={question.marks}
                      inputProps={{ min: 1, max: 10 }}
                      onChange={(e) =>
                        updateQuestion(question.id, {
                          marks: Math.max(1, Number(e.target.value) || 1),
                        })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} sm={10}>
                    <TextField
                      fullWidth
                      label="Question"
                      value={question.text}
                      multiline
                      minRows={2}
                      onChange={(e) => updateQuestion(question.id, { text: e.target.value })}
                    />
                  </Grid>
                  {question.type === "mcq" &&
                    (question.options || ["", "", "", ""]).map((option, optionIndex) => (
                      <Grid item xs={12} sm={6} key={`${question.id}-opt-${optionIndex}`}>
                        <TextField
                          fullWidth
                          label={`Option ${String.fromCharCode(65 + optionIndex)}`}
                          value={option}
                          onChange={(e) =>
                            updateOption(question.id, optionIndex, e.target.value)
                          }
                        />
                      </Grid>
                    ))}
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="Model answer (answer key only)"
                      value={question.answer || ""}
                      multiline
                      minRows={2}
                      onChange={(e) =>
                        updateQuestion(question.id, { answer: e.target.value })
                      }
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="NCERT citation"
                      value={question.ncertCitation || ""}
                      helperText="Chapter and section heading from the textbook."
                      onChange={(e) =>
                        updateQuestion(question.id, { ncertCitation: e.target.value })
                      }
                    />
                  </Grid>
                </Grid>
              </CardContent>
            </Card>
          ))}

          <Divider />
        </Stack>
      )}
    </PageShell>
  );
}
