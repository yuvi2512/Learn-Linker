import { pool } from "../../../lib/db";
import { requireUser, methodNotAllowed } from "@/utils/apiAuth";
import { parseBatchId } from "@/utils/batches";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const user = await requireUser(req, res, ["student", "teacher"]);
  if (!user) return;

  // Students may only ever read their own register.
  const studentId =
    user.role === "student" ? user.id : req.query.studentId;

  if (!studentId) {
    return res.status(400).json({ message: "studentId is required" });
  }

  const { batchId, error } = parseBatchId(req.query.batchId);
  if (error) return res.status(400).json({ message: error });

  try {
    const client = await pool.connect();
    try {
      const result = await client.query(
        `SELECT a.*, b.name AS batch_name
           FROM public.attendance a
           LEFT JOIN public.batches b ON b.id = a.batch_id
          WHERE a.student_id = $1
            AND ($2::uuid IS NULL OR a.batch_id = $2::uuid)
          ORDER BY a.date ASC`,
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
