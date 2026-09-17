import { pool } from "../../../lib/db";
import { requireUser, methodNotAllowed } from "@/utils/apiAuth";
import {
  isStudentInBatch,
  parseBatchId,
  requireBatchAccess,
} from "@/utils/batches";

async function listScores(req, res, user) {
  const { batchId, error } = parseBatchId(req.query.batchId, { allowNull: false });
  if (error) return res.status(400).json({ message: error });

  const testId = req.query.testId ? String(req.query.testId).trim() : null;
  const subject = req.query.subject ? String(req.query.subject).trim() : null;

  const client = await pool.connect();
  try {
    if (!(await requireBatchAccess(client, user, batchId, res))) return;

    const { rows } = testId
      ? await client.query(
          `SELECT u.id AS student_id,
                  u.name AS student_name,
                  m.marks_obtained,
                  m.max_marks,
                  m.subject_name,
                  m.test_id
             FROM public.batch_students bs
             JOIN public.users u ON u.id = bs.student_id
             LEFT JOIN public.student_marks m
               ON m.student_id = u.id
              AND m.batch_id = bs.batch_id
              AND m.test_id = $2
            WHERE bs.batch_id = $1
            ORDER BY u.name ASC`,
          [batchId, testId]
        )
      : subject
      ? await client.query(
          `SELECT u.id AS student_id,
                  u.name AS student_name,
                  m.marks_obtained,
                  m.max_marks,
                  m.subject_name,
                  m.test_id
             FROM public.batch_students bs
             JOIN public.users u ON u.id = bs.student_id
             LEFT JOIN public.student_marks m
               ON m.student_id = u.id
              AND m.batch_id = bs.batch_id
              AND m.test_id IS NULL
              AND m.subject_name = $2
            WHERE bs.batch_id = $1
            ORDER BY u.name ASC`,
          [batchId, subject]
        )
      : await client.query(
          `SELECT u.id AS student_id,
                  u.name AS student_name,
                  NULL::numeric AS marks_obtained,
                  NULL::numeric AS max_marks,
                  NULL::text AS subject_name,
                  NULL::integer AS test_id
             FROM public.batch_students bs
             JOIN public.users u ON u.id = bs.student_id
            WHERE bs.batch_id = $1
            ORDER BY u.name ASC`,
          [batchId]
        );

    res.status(200).json(rows);
  } finally {
    client.release();
  }
}

async function saveScores(req, res, user) {
  const { scores, subject, batchId: rawBatchId, testId, maxMarks } = req.body || {};

  const { batchId, error } = parseBatchId(rawBatchId, { allowNull: false });
  if (error) return res.status(400).json({ message: error });

  if (!Array.isArray(scores) || scores.length === 0) {
    return res.status(400).json({ message: "No scores were provided." });
  }

  const subjectName = String(subject || "").trim();
  if (!subjectName) {
    return res.status(400).json({ message: "A subject is required." });
  }

  const linkedTestId = testId && String(testId).trim() ? String(testId).trim() : null;
  const outOf = Number(maxMarks) > 0 ? Number(maxMarks) : 100;

  const invalid = scores.some(
    (row) =>
      !row.studentId || row.marks === "" || row.marks == null || Number.isNaN(Number(row.marks))
  );
  if (invalid) {
    return res.status(400).json({ message: "Every row needs a student and marks." });
  }

  const client = await pool.connect();

  try {
    if (!(await requireBatchAccess(client, user, batchId, res))) return;

    if (linkedTestId) {
      const { rows: tests } = await client.query(
        `SELECT id, batch_id FROM public.upcoming_tests WHERE id = $1`,
        [linkedTestId]
      );
      if (tests.length === 0) {
        return res.status(404).json({ message: "That test no longer exists." });
      }
      if (tests[0].batch_id && tests[0].batch_id !== batchId) {
        return res.status(400).json({ message: "That test belongs to a different batch." });
      }
    }

    for (const row of scores) {
      if (!(await isStudentInBatch(client, row.studentId, batchId))) {
        return res.status(400).json({
          message: "One of those students is not on this batch's roll.",
        });
      }
    }

    await client.query("BEGIN");

    for (const row of scores) {
      const marks = Number(row.marks);
      if (linkedTestId) {
        await client.query(
          `INSERT INTO public.student_marks
             (batch_id, student_id, subject_name, marks_obtained, test_id, max_marks)
           VALUES ($1, $2, $3, $4, $5, $6)
           ON CONFLICT (batch_id, student_id, test_id) WHERE test_id IS NOT NULL
           DO UPDATE SET
             subject_name = EXCLUDED.subject_name,
             marks_obtained = EXCLUDED.marks_obtained,
             max_marks = EXCLUDED.max_marks`,
          [batchId, row.studentId, subjectName, marks, linkedTestId, outOf]
        );
      } else {
        await client.query(
          `INSERT INTO public.student_marks
             (batch_id, student_id, subject_name, marks_obtained, max_marks)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (batch_id, student_id, subject_name) WHERE test_id IS NULL
           DO UPDATE SET
             marks_obtained = EXCLUDED.marks_obtained,
             max_marks = EXCLUDED.max_marks`,
          [batchId, row.studentId, subjectName, marks, outOf]
        );
      }
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "Results saved." });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Error inserting data:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Something went wrong" });
    }
  } finally {
    client.release();
  }
}

export default async function handler(req, res) {
  const user = await requireUser(req, res, ["teacher"]);
  if (!user) return;

  try {
    if (req.method === "GET") return await listScores(req, res, user);
    if (req.method === "POST") return await saveScores(req, res, user);
    return methodNotAllowed(res, ["GET", "POST"]);
  } catch (err) {
    console.error("Marksheet request failed:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Something went wrong" });
    }
  }
}
