import { pool } from "../../../lib/db";
import { requireUser, methodNotAllowed } from "@/utils/apiAuth";
import { parseBatchId } from "@/utils/batches";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const user = await requireUser(req, res, ["student", "teacher"]);
  if (!user) return;

  // Students may only ever read their own marks.
  const studentId = user.role === "student" ? user.id : req.query.StudentId;

  if (!studentId) {
    return res.status(400).json({ message: "StudentId is required" });
  }

  const { batchId, error } = parseBatchId(req.query.batchId);
  if (error) return res.status(400).json({ message: error });

  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT m.*, b.name AS batch_name
           FROM public.student_marks m
           LEFT JOIN public.batches b ON b.id = m.batch_id
          WHERE m.student_id = $1
            AND ($2::uuid IS NULL OR m.batch_id = $2::uuid)
          ORDER BY b.name ASC, m.subject_name ASC`,
        [studentId, batchId]
      );
      res.status(200).json(result.rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).json({ message: "An error occurred" });
  }
}
