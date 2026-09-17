import axios from "axios";
import { requireUser, methodNotAllowed } from "@/utils/apiAuth";
import {
  isNcertSubject,
  ncertBookTitle,
  parseChapter,
  parseClassNumber,
  parseCounts,
} from "@/utils/ncert";

const PREAMBLE = `You are a senior examiner who writes Indian school tests strictly from official NCERT textbooks (National Council of Educational Research and Training, New Delhi).

Hard rules:
- Use ONLY the named NCERT textbook and chapter. No other board, no coaching notes, no JEE/NEET/Olympiad items, no reference guides, no internet trivia, no topics from a different class or subject.
- If the chapter is not a real chapter in that NCERT book, reply with JSON {"error":"..."} and nothing else.
- Every question must be answerable from that chapter’s NCERT text, in-text questions, examples, or end-of-chapter exercises.
- Restyle NCERT-style items; do not copy a whole exercise verbatim if you can rephrase, but keep the same concept and difficulty.
- Cite the NCERT chapter and section/heading on every question.
- Output a single JSON object. No markdown, no commentary.`;

function extractJson(text) {
  const trimmed = String(text || "").trim();
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1].trim() : trimmed;
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  if (start === -1 || end === -1) {
    throw new Error("The model did not return JSON.");
  }
  return JSON.parse(candidate.slice(start, end + 1));
}

function cleanText(value, max = 800) {
  return String(value || "")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

function normalizeQuestion(raw, index, fallbackType) {
  const type = ["mcq", "veryShort", "short", "long"].includes(raw?.type)
    ? raw.type
    : fallbackType;
  const marks =
    Number(raw?.marks) > 0
      ? Math.min(10, Math.round(Number(raw.marks)))
      : type === "long"
      ? 5
      : type === "short"
      ? 3
      : type === "veryShort"
      ? 2
      : 1;

  const question = {
    id: String(raw?.id || index + 1),
    type,
    marks,
    text: cleanText(raw?.text, 600),
    answer: cleanText(raw?.answer, 800),
    ncertCitation: cleanText(raw?.ncertCitation || raw?.citation, 180),
  };

  if (type === "mcq") {
    const options = Array.isArray(raw?.options)
      ? raw.options.map((opt) => cleanText(opt, 200)).filter(Boolean).slice(0, 4)
      : [];
    while (options.length < 4) options.push("");
    question.options = options;
  }

  return question;
}

function normalizePaper(raw, request) {
  if (raw?.error) {
    return { error: cleanText(raw.error, 240) || "That chapter is not in the NCERT book for this class and subject." };
  }

  const sectionsIn = Array.isArray(raw?.sections) ? raw.sections : [];
  const flat = [];

  sectionsIn.forEach((section) => {
    const items = Array.isArray(section?.questions) ? section.questions : [];
    items.forEach((item) => flat.push(item));
  });

  if (!flat.length && Array.isArray(raw?.questions)) {
    raw.questions.forEach((item) => flat.push(item));
  }

  const questions = flat
    .map((item, index) => normalizeQuestion(item, index, "short"))
    .filter((item) => item.text.length >= 8);

  if (questions.length < 3) {
    return { error: "The model did not return a usable NCERT paper. Try a clearer chapter name." };
  }

  const missingCitation = questions.filter((item) => item.ncertCitation.length < 8);
  if (missingCitation.length > questions.length / 2) {
    return { error: "The paper was missing NCERT chapter citations. Generate again." };
  }

  const totalMarks = questions.reduce((sum, item) => sum + item.marks, 0);
  const durationMinutes =
    Number(raw?.durationMinutes) > 0
      ? Math.min(180, Math.round(Number(raw.durationMinutes)))
      : Math.min(180, Math.max(30, totalMarks * 2));

  return {
    title: cleanText(raw?.title, 120) || `${request.subject} — ${request.chapter}`,
    classNumber: request.classNumber,
    subject: request.subject,
    chapter: request.chapter,
    ncertBook: ncertBookTitle(request.classNumber, request.subject),
    totalMarks,
    durationMinutes,
    instructions: Array.isArray(raw?.instructions)
      ? raw.instructions.map((line) => cleanText(line, 200)).filter(Boolean).slice(0, 6)
      : [
          "All questions are from the NCERT textbook chapter named above.",
          "Write answers in your own words unless a definition is asked.",
          "Figures, if any, are schematic — not to scale.",
        ],
    questions,
  };
}

function buildPrompt({ classNumber, subject, chapter, counts }) {
  const book = ncertBookTitle(classNumber, subject);
  return `Create one school test paper from ONLY this book:

Book: ${book}
Chapter (exact NCERT chapter): ${chapter}

Question mix (exact counts):
- ${counts.mcq} MCQ (4 options each, 1 mark)
- ${counts.veryShort} very short answer (2 marks)
- ${counts.short} short answer (3 marks)
- ${counts.long} long answer (5 marks)

JSON shape:
{
  "title": "string",
  "durationMinutes": number,
  "instructions": ["string"],
  "sections": [
    {
      "name": "string",
      "questions": [
        {
          "type": "mcq" | "veryShort" | "short" | "long",
          "marks": number,
          "text": "question stem",
          "options": ["A","B","C","D"],
          "answer": "correct option letter or model answer",
          "ncertCitation": "NCERT Class ${classNumber} ${subject}, Ch … — section heading"
        }
      ]
    }
  ]
}

MCQ objects must include options. Other types may omit options.
If "${chapter}" is not an NCERT chapter in ${book}, return {"error":"…"}.`;
}

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  const user = await requireUser(req, res, ["teacher"]);
  if (!user) return;

  const classNumber = parseClassNumber(req.body?.classNumber);
  if (!classNumber) {
    return res.status(400).json({ message: "Choose NCERT class 6 to 12." });
  }

  const subject = String(req.body?.subject || "").trim();
  if (!isNcertSubject(classNumber, subject)) {
    return res.status(400).json({
      message: `${subject || "That subject"} is not an NCERT textbook for Class ${classNumber}.`,
    });
  }

  const chapterResult = parseChapter(req.body?.chapter);
  if (chapterResult.error) {
    return res.status(400).json({ message: chapterResult.error });
  }

  const counts = parseCounts(req.body);
  if (counts.error) {
    return res.status(400).json({ message: counts.error });
  }

  if (!process.env.COHERE_API_KEY) {
    return res.status(503).json({
      message: "Test-paper generation is not configured. Add COHERE_API_KEY to the server environment.",
    });
  }

  const request = {
    classNumber,
    subject,
    chapter: chapterResult.chapter,
    counts,
  };

  try {
    const response = await axios.post(
      "https://api.cohere.ai/v1/chat",
      {
        model: "command-a-03-2025",
        preamble: PREAMBLE,
        message: buildPrompt(request),
        max_tokens: 3072,
        temperature: 0.2,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.COHERE_API_KEY}`,
          "Content-Type": "application/json",
        },
        timeout: 90000,
      }
    );

    const rawText = response?.data?.text || "";
    if (!rawText.trim()) {
      return res.status(502).json({ message: "No paper came back. Try again in a moment." });
    }

    let parsed;
    try {
      parsed = extractJson(rawText);
    } catch {
      return res.status(502).json({
        message: "The paper came back in an unexpected format. Generate again.",
      });
    }

    const paper = normalizePaper(parsed, request);
    if (paper.error) {
      return res.status(422).json({ message: paper.error });
    }

    return res.status(200).json({ paper });
  } catch (error) {
    console.error(
      "Error generating test paper:",
      error?.response?.data || error.message || error
    );
    return res.status(500).json({ message: "Could not generate the test paper." });
  }
}
