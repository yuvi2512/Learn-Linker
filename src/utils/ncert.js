export const NCERT_CLASSES = [6, 7, 8, 9, 10, 11, 12];

const MIDDLE = [
  "English",
  "Hindi",
  "Mathematics",
  "Science",
  "Social Science",
  "Sanskrit",
];

const SENIOR = [
  "English",
  "Hindi",
  "Mathematics",
  "Physics",
  "Chemistry",
  "Biology",
  "Accountancy",
  "Business Studies",
  "Economics",
  "History",
  "Political Science",
  "Geography",
  "Sociology",
  "Psychology",
  "Computer Science",
];

const BY_CLASS = {
  6: MIDDLE,
  7: MIDDLE,
  8: MIDDLE,
  9: MIDDLE,
  10: MIDDLE,
  11: SENIOR,
  12: SENIOR,
};

export const QUESTION_TYPES = [
  { id: "mcq", label: "MCQ", defaultMarks: 1 },
  { id: "veryShort", label: "Very short answer", defaultMarks: 2 },
  { id: "short", label: "Short answer", defaultMarks: 3 },
  { id: "long", label: "Long answer", defaultMarks: 5 },
];

const BLOCKED_CHAPTER = /\b(jee|neet|olympiad|kvpy|ntse|coaching|sample paper|reference book|guide book|arihant|rd sharma extra|outside ncert)\b/i;

export function subjectsForClass(classNumber) {
  return BY_CLASS[Number(classNumber)] || [];
}

export function isNcertSubject(classNumber, subject) {
  return subjectsForClass(classNumber).includes(String(subject || "").trim());
}

export function parseClassNumber(value) {
  const n = Number(value);
  return NCERT_CLASSES.includes(n) ? n : null;
}

export function parseChapter(value) {
  const chapter = String(value || "").replace(/\s+/g, " ").trim();
  if (chapter.length < 3 || chapter.length > 120) {
    return { error: "Enter the NCERT chapter name (3–120 characters)." };
  }
  if (BLOCKED_CHAPTER.test(chapter)) {
    return { error: "Use only an NCERT textbook chapter name — not competitive-exam or guide material." };
  }
  return { chapter };
}

export function parseCounts(body) {
  const mcq = clampInt(body?.mcq, 0, 15);
  const veryShort = clampInt(body?.veryShort, 0, 10);
  const short = clampInt(body?.short, 0, 8);
  const long = clampInt(body?.long, 0, 5);
  const total = mcq + veryShort + short + long;

  if (total < 4) {
    return { error: "Ask for at least 4 questions so the paper has a real mix." };
  }
  if (total > 25) {
    return { error: "Keep the paper to 25 questions or fewer so it stays reviewable." };
  }

  return { mcq, veryShort, short, long, total };
}

function clampInt(value, min, max) {
  const n = Number.parseInt(value, 10);
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

export function ncertBookTitle(classNumber, subject) {
  return `NCERT ${subject}, Class ${classNumber}`;
}
