import { pool } from "../../../lib/db";
import { requireUser, methodNotAllowed } from "@/utils/apiAuth";
import { isAdmin } from "@/utils/permissions";
import {
  parseBatchId,
  requireBatchAccess,
  teacherBatchIds,
} from "@/utils/batches";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const user = await requireUser(req, res, ["student", "teacher"]);
  if (!user) return;

  const studentId = user.role === "student" ? user.id : req.query.studentId;

  if (!studentId) {
    return res.status(400).json({ message: "studentId is required" });
  }

  const { batchId, error } = parseBatchId(req.query.batchId);
  if (error) return res.status(400).json({ message: error });

  const client = await pool.connect();

  try {
    if (batchId && !(await requireBatchAccess(client, user, batchId, res))) {
      return;
    }

    if (user.role === "teacher" && !isAdmin(user) && studentId !== user.id) {
      const assigned = await teacherBatchIds(client, user.id);
      const { rowCount } = await client.query(
        `SELECT 1
           FROM public.batch_students
          WHERE student_id = $1
            AND batch_id = ANY($2::uuid[])
          LIMIT 1`,
        [studentId, assigned]
      );
      if (!rowCount) {
        return res.status(403).json({ message: "You do not teach that student." });
      }
    }

    const { rows } = await client.query(
      `SELECT a.id,
              a.batch_id,
              a.student_id,
              a.present,
              a.date,
              u.name AS student_name,
              b.name AS batch_name
         FROM public.attendance a
         JOIN public.users u ON u.id = a.student_id
         LEFT JOIN public.batches b ON b.id = a.batch_id
        WHERE a.student_id = $1
          AND ($2::uuid IS NULL OR a.batch_id = $2::uuid)
        ORDER BY a.date ASC`,
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
