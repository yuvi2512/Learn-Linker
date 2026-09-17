import { pool } from "../../../lib/db";
import { requireUser, methodNotAllowed } from "@/utils/apiAuth";
import { isAdmin } from "@/utils/permissions";
import {
  parseBatchId,
  requireBatchAccess,
  teacherBatchIds,
  studentBatchIds,
} from "@/utils/batches";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const user = await requireUser(req, res, ["student", "teacher"]);
  if (!user) return;

  const studentId = user.role === "student" ? user.id : req.query.StudentId;

  if (!studentId) {
    return res.status(400).json({ message: "StudentId is required" });
  }

  const { batchId, error } = parseBatchId(req.query.batchId);
  if (error) return res.status(400).json({ message: error });

  const client = await pool.connect();

  try {
    if (user.role === "teacher" && !isAdmin(user)) {
      const assigned = await teacherBatchIds(client, user.id);
      const studentBatches = await studentBatchIds(client, studentId);
      const overlap = studentBatches.some((id) => assigned.includes(id));
      if (!overlap) {
        return res.status(403).json({ message: "You do not teach that student." });
      }
    }

    if (batchId && !(await requireBatchAccess(client, user, batchId, res))) {
      return;
    }

    const { rows } = await client.query(
      `SELECT m.id,
              m.batch_id,
              m.student_id,
              m.subject_name,
              m.marks_obtained,
              m.max_marks,
              m.test_id,
              b.name AS batch_name,
              t.subject AS test_subject,
              t.date AS test_date
         FROM public.student_marks m
         LEFT JOIN public.batches b ON b.id = m.batch_id
         LEFT JOIN public.upcoming_tests t ON t.id = m.test_id
        WHERE m.student_id = $1
          AND ($2::uuid IS NULL OR m.batch_id = $2::uuid)
        ORDER BY t.date DESC NULLS LAST, b.name ASC, m.subject_name ASC`,
      [studentId, batchId]
    );
    res.status(200).json(rows);
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).json({ message: "An error occurred" });
  } finally {
    client.release();
  }
}
