import { pool } from "../../../lib/db";
import { requireUser, methodNotAllowed } from "@/utils/apiAuth";
import { isAdmin } from "@/utils/permissions";
import {
  parseBatchId,
  requireBatchAccess,
  teacherBatchIds,
} from "@/utils/batches";

const STUDENT_LIST = `
  SELECT t.*, b.name AS batch_name
    FROM public.upcoming_tests t
    LEFT JOIN public.batches b ON b.id = t.batch_id
   WHERE t.batch_id IS NULL
      OR t.batch_id IN (
           SELECT batch_id FROM public.batch_students WHERE student_id = $1
         )
   ORDER BY t.date ASC
`;

const TEACHER_LIST = `
  SELECT t.*, b.name AS batch_name
    FROM public.upcoming_tests t
    LEFT JOIN public.batches b ON b.id = t.batch_id
   WHERE ($1::uuid[] IS NULL OR t.batch_id IS NULL OR t.batch_id = ANY($1::uuid[]))
     AND ($2::uuid IS NULL OR t.batch_id = $2 OR t.batch_id IS NULL)
   ORDER BY t.date ASC
`;

async function listTests(req, res, user) {
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

async function createTest(req, res, user) {
  const { data } = req.body || {};
  const { subject, date, max_marks, batchId: rawBatchId } = data || {};

  if (!subject || !date) {
    return res.status(400).json({ message: "Subject and date are required." });
  }

  const { batchId, error } = parseBatchId(rawBatchId, {
    allowNull: isAdmin(user),
  });
  if (error) return res.status(400).json({ message: error });

  const outOf = Number(max_marks) > 0 ? Number(max_marks) : 100;
  const client = await pool.connect();

  try {
    if (batchId && !(await requireBatchAccess(client, user, batchId, res))) {
      return;
    }

    await client.query(
      `INSERT INTO public.upcoming_tests (batch_id, subject, date, max_marks)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [batchId, subject, date, outOf]
    );
    res.status(200).json({ message: "Test scheduled." });
  } catch (err) {
    console.error("Error inserting data:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Something went wrong while saving." });
    }
  } finally {
    client.release();
  }
}

async function deleteTest(req, res, user) {
  const { id } = req.body?.data || {};

  if (!id) {
    return res.status(400).json({ message: "A test id is required." });
  }

  const client = await pool.connect();

  try {
    const { rows } = await client.query(
      `SELECT id, batch_id FROM public.upcoming_tests WHERE id = $1`,
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "That test no longer exists." });
    }

    if (rows[0].batch_id && !(await requireBatchAccess(client, user, rows[0].batch_id, res))) {
      return;
    }

    if (!rows[0].batch_id && !isAdmin(user)) {
      return res.status(403).json({
        message: "Only the institute admin can remove institute-wide tests.",
      });
    }

    await client.query(`DELETE FROM public.upcoming_tests WHERE id = $1`, [id]);
    res.status(200).json({ message: "Test removed." });
  } finally {
    client.release();
  }
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const user = await requireUser(req, res, ["teacher", "student"]);
      if (!user) return;
      return await listTests(req, res, user);
    }

    if (req.method === "POST" || req.method === "DELETE") {
      const user = await requireUser(req, res, ["teacher"]);
      if (!user) return;
      return req.method === "POST"
        ? await createTest(req, res, user)
        : await deleteTest(req, res, user);
    }

    return methodNotAllowed(res, ["GET", "POST", "DELETE"]);
  } catch (error) {
    console.error("Test request failed:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "An error occurred" });
    }
  }
}
