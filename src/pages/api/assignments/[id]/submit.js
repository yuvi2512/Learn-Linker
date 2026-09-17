import { pool } from "../../../../../lib/db";
import { requireUser, methodNotAllowed } from "@/utils/apiAuth";
import { isStudentInBatch } from "@/utils/batches";

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  const user = await requireUser(req, res, ["student"]);
  if (!user) return;

  const assignmentId = Number(req.query.id);
  const { note, resource_url } = req.body || {};

  if (!assignmentId) {
    return res.status(400).json({ message: "An assignment id is required." });
  }

  const client = await pool.connect();

  try {
    const { rows } = await client.query(
      `SELECT id, batch_id, end_date FROM public.assignments WHERE id = $1`,
      [assignmentId]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "That assignment no longer exists." });
    }

    if (rows[0].batch_id && !(await isStudentInBatch(client, user.id, rows[0].batch_id))) {
      return res.status(403).json({ message: "That assignment is not for your batch." });
    }

    const { rows: saved } = await client.query(
      `INSERT INTO public.assignment_submissions
         (assignment_id, student_id, note, resource_url, submitted_at)
       VALUES ($1, $2, $3, $4, now())
       ON CONFLICT (assignment_id, student_id)
       DO UPDATE SET
         note = EXCLUDED.note,
         resource_url = EXCLUDED.resource_url,
         submitted_at = now()
       RETURNING id, submitted_at, note, resource_url`,
      [
        assignmentId,
        user.id,
        note ? String(note).trim() : null,
        resource_url ? String(resource_url).trim() : null,
      ]
    );

    res.status(200).json({ message: "Assignment submitted.", submission: saved[0] });
  } catch (error) {
    console.error("Assignment submit failed:", error);
    res.status(500).json({ message: "Could not save the submission." });
  } finally {
    client.release();
  }
}
