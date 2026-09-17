import { pool } from "../../../../../lib/db";
import { requireUser, methodNotAllowed } from "@/utils/apiAuth";
import { isAdmin } from "@/utils/permissions";
import { requireBatchAccess } from "@/utils/batches";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const user = await requireUser(req, res, ["teacher"]);
  if (!user) return;

  const assignmentId = Number(req.query.id);
  if (!assignmentId) {
    return res.status(400).json({ message: "An assignment id is required." });
  }

  const client = await pool.connect();

  try {
    const { rows: assignments } = await client.query(
      `SELECT id, batch_id, subject, end_date FROM public.assignments WHERE id = $1`,
      [assignmentId]
    );

    if (assignments.length === 0) {
      return res.status(404).json({ message: "That assignment no longer exists." });
    }

    const assignment = assignments[0];
    if (assignment.batch_id) {
      if (!(await requireBatchAccess(client, user, assignment.batch_id, res))) return;
    } else if (!isAdmin(user)) {
      return res.status(403).json({
        message: "Only the institute admin can view institute-wide submissions.",
      });
    }

    const rosterQuery = assignment.batch_id
      ? await client.query(
          `SELECT u.id, u.name, u.email,
                  s.note, s.resource_url, s.submitted_at
             FROM public.batch_students bs
             JOIN public.users u ON u.id = bs.student_id
             LEFT JOIN public.assignment_submissions s
               ON s.assignment_id = $1 AND s.student_id = u.id
            WHERE bs.batch_id = $2
            ORDER BY u.name ASC`,
          [assignmentId, assignment.batch_id]
        )
      : await client.query(
          `SELECT u.id, u.name, u.email,
                  s.note, s.resource_url, s.submitted_at
             FROM public.users u
             LEFT JOIN public.assignment_submissions s
               ON s.assignment_id = $1 AND s.student_id = u.id
            WHERE u.role = 'student'
            ORDER BY u.name ASC`,
          [assignmentId]
        );

    res.status(200).json({
      assignment,
      submissions: rosterQuery.rows,
    });
  } catch (error) {
    console.error("Assignment submissions failed:", error);
    res.status(500).json({ message: "Could not load submissions." });
  } finally {
    client.release();
  }
}
