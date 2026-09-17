import { pool } from "../../../lib/db";
import { requireUser, methodNotAllowed } from "@/utils/apiAuth";
import { isAdmin } from "@/utils/permissions";
import {
  parseBatchId,
  requireBatchAccess,
  teacherBatchIds,
} from "@/utils/batches";

const STUDENT_LIST = `
  SELECT a.*,
         b.name AS batch_name,
         s.note AS submission_note,
         s.resource_url AS submission_url,
         s.submitted_at
    FROM public.assignments a
    LEFT JOIN public.batches b ON b.id = a.batch_id
    LEFT JOIN public.assignment_submissions s
      ON s.assignment_id = a.id AND s.student_id = $1
   WHERE a.batch_id IS NULL
      OR a.batch_id IN (
           SELECT batch_id FROM public.batch_students WHERE student_id = $1
         )
   ORDER BY a.end_date ASC
`;

const TEACHER_LIST = `
  SELECT a.*,
         b.name AS batch_name,
         (
           SELECT COUNT(*)::int
             FROM public.assignment_submissions sub
            WHERE sub.assignment_id = a.id
         ) AS submitted_count,
         (
           SELECT COUNT(*)::int
             FROM public.batch_students bs
            WHERE a.batch_id IS NOT NULL AND bs.batch_id = a.batch_id
         ) AS roster_count
    FROM public.assignments a
    LEFT JOIN public.batches b ON b.id = a.batch_id
   WHERE ($1::uuid[] IS NULL OR a.batch_id IS NULL OR a.batch_id = ANY($1::uuid[]))
     AND ($2::uuid IS NULL OR a.batch_id = $2 OR a.batch_id IS NULL)
   ORDER BY a.end_date ASC
`;

async function listAssignments(req, res, user) {
  const { batchId, error } = parseBatchId(req.query.batchId);
  if (error) return res.status(400).json({ message: error });

  const client = await pool.connect();

  try {
    if (user.role === "student") {
      const result = await client.query(STUDENT_LIST, [user.id]);
      return res.status(200).json(result.rows);
    }

    if (batchId && !(await requireBatchAccess(client, user, batchId, res))) {
      return;
    }

    const scope = isAdmin(user) ? null : await teacherBatchIds(client, user.id);
    const result = await client.query(TEACHER_LIST, [scope, batchId]);
    res.status(200).json(result.rows);
  } finally {
    client.release();
  }
}

async function createAssignment(req, res, user) {
  const { data } = req.body || {};
  const { subject, end_date, description, resource_url, batchId: rawBatchId } =
    data || {};

  if (!subject || !end_date || !description) {
    return res
      .status(400)
      .json({ message: "Subject, due date, and brief are all required." });
  }

  const { batchId, error } = parseBatchId(rawBatchId, {
    allowNull: isAdmin(user),
  });
  if (error) return res.status(400).json({ message: error });

  const client = await pool.connect();

  try {
    if (batchId && !(await requireBatchAccess(client, user, batchId, res))) {
      return;
    }

    await client.query(
      `INSERT INTO public.assignments (batch_id, subject, end_date, description, resource_url)
       VALUES ($1, $2, $3, $4, $5)
       ON CONFLICT DO NOTHING`,
      [
        batchId,
        subject,
        end_date,
        description,
        resource_url ? String(resource_url).trim() : null,
      ]
    );
    res.status(200).json({ message: "Assignment published." });
  } catch (err) {
    console.error("Error inserting data:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Something went wrong while saving." });
    }
  } finally {
    client.release();
  }
}

async function deleteAssignment(req, res, user) {
  const { id } = req.body?.data || {};

  if (!id) {
    return res.status(400).json({ message: "An assignment id is required." });
  }

  const client = await pool.connect();

  try {
    const { rows } = await client.query(
      `SELECT id, batch_id FROM public.assignments WHERE id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "That assignment no longer exists." });
    }

    if (rows[0].batch_id && !(await requireBatchAccess(client, user, rows[0].batch_id, res))) {
      return;
    }

    if (!rows[0].batch_id && !isAdmin(user)) {
      return res.status(403).json({
        message: "Only the institute admin can remove institute-wide assignments.",
      });
    }

    await client.query(`DELETE FROM public.assignments WHERE id = $1`, [id]);
    res.status(200).json({ message: "Assignment deleted." });
  } finally {
    client.release();
  }
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const user = await requireUser(req, res, ["teacher", "student"]);
      if (!user) return;
      return await listAssignments(req, res, user);
    }

    if (req.method === "POST" || req.method === "DELETE") {
      const user = await requireUser(req, res, ["teacher"]);
      if (!user) return;
      return req.method === "POST"
        ? await createAssignment(req, res, user)
        : await deleteAssignment(req, res, user);
    }

    return methodNotAllowed(res, ["GET", "POST", "DELETE"]);
  } catch (error) {
    console.error("Assignment request failed:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "An error occurred" });
    }
  }
}
