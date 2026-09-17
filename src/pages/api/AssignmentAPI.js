import { pool } from "../../../lib/db";
import { requireUser, methodNotAllowed } from "@/utils/apiAuth";
import { batchExists, parseBatchId } from "@/utils/batches";

// batch_id IS NULL means the assignment was published to everyone.
const STUDENT_LIST = `
  SELECT a.*, b.name AS batch_name
    FROM public.assignments a
    LEFT JOIN public.batches b ON b.id = a.batch_id
   WHERE a.batch_id IS NULL
      OR a.batch_id IN (
           SELECT batch_id FROM public.batch_students WHERE student_id = $1
         )
   ORDER BY a.end_date ASC
`;

const TEACHER_LIST_ALL = `
  SELECT a.*, b.name AS batch_name
    FROM public.assignments a
    LEFT JOIN public.batches b ON b.id = a.batch_id
   ORDER BY a.end_date ASC
`;

const TEACHER_LIST_FOR_BATCH = `
  SELECT a.*, b.name AS batch_name
    FROM public.assignments a
    LEFT JOIN public.batches b ON b.id = a.batch_id
   WHERE a.batch_id = $1 OR a.batch_id IS NULL
   ORDER BY a.end_date ASC
`;

async function listAssignments(req, res, user) {
  const { batchId, error } = parseBatchId(req.query.batchId);
  if (error) return res.status(400).json({ message: error });

  const client = await pool.connect();

  try {
    let result;

    if (user.role === "student") {
      result = await client.query(STUDENT_LIST, [user.id]);
    } else if (batchId) {
      result = await client.query(TEACHER_LIST_FOR_BATCH, [batchId]);
    } else {
      result = await client.query(TEACHER_LIST_ALL);
    }

    res.status(200).json(result.rows);
  } finally {
    client.release();
  }
}

async function createAssignment(req, res) {
  const { data } = req.body || {};
  const { subject, end_date, description, batchId: rawBatchId } = data || {};

  if (!subject || !end_date || !description) {
    return res
      .status(400)
      .json({ message: "Subject, due date, and brief are all required." });
  }

  // Leaving the batch unset publishes to every student, which is still useful
  // for notices that are not batch-specific.
  const { batchId, error } = parseBatchId(rawBatchId);
  if (error) return res.status(400).json({ message: error });

  const client = await pool.connect();

  try {
    if (batchId && !(await batchExists(client, batchId))) {
      return res.status(404).json({ message: "That batch no longer exists." });
    }

    await client.query("BEGIN");
    await client.query(
      `INSERT INTO public."assignments" (batch_id, subject, end_date, description)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT DO NOTHING`,
      [batchId, subject, end_date, description]
    );
    await client.query("COMMIT");
    res.status(200).json({ message: "Assignment published." });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Error inserting data:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Something went wrong while saving." });
    }
  } finally {
    client.release();
  }
}

async function deleteAssignment(req, res) {
  const { id } = req.body?.data || {};

  if (!id) {
    return res.status(400).json({ message: "An assignment id is required." });
  }

  const client = await pool.connect();

  try {
    const result = await client.query(
      `DELETE FROM public."assignments" WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "That assignment no longer exists." });
    }

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
        ? await createAssignment(req, res)
        : await deleteAssignment(req, res);
    }

    return methodNotAllowed(res, ["GET", "POST", "DELETE"]);
  } catch (error) {
    console.error("Assignment request failed:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "An error occurred" });
    }
  }
}
