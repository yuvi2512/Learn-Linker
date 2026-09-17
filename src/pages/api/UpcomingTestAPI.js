import { pool } from "../../../lib/db";
import { requireUser, methodNotAllowed } from "@/utils/apiAuth";
import { batchExists, parseBatchId } from "@/utils/batches";

// batch_id IS NULL means the test was scheduled for everyone.
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

const TEACHER_LIST_ALL = `
  SELECT t.*, b.name AS batch_name
    FROM public.upcoming_tests t
    LEFT JOIN public.batches b ON b.id = t.batch_id
   ORDER BY t.date ASC
`;

const TEACHER_LIST_FOR_BATCH = `
  SELECT t.*, b.name AS batch_name
    FROM public.upcoming_tests t
    LEFT JOIN public.batches b ON b.id = t.batch_id
   WHERE t.batch_id = $1 OR t.batch_id IS NULL
   ORDER BY t.date ASC
`;

async function listTests(req, res, user) {
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

async function createTest(req, res) {
  const { data } = req.body || {};
  const { subject, date, batchId: rawBatchId } = data || {};

  if (!subject || !date) {
    return res.status(400).json({ message: "Subject and date are required." });
  }

  const { batchId, error } = parseBatchId(rawBatchId);
  if (error) return res.status(400).json({ message: error });

  const client = await pool.connect();

  try {
    if (batchId && !(await batchExists(client, batchId))) {
      return res.status(404).json({ message: "That batch no longer exists." });
    }

    await client.query("BEGIN");
    await client.query(
      `INSERT INTO public."upcoming_tests" (batch_id, subject, date)
       VALUES ($1, $2, $3)
       ON CONFLICT DO NOTHING`,
      [batchId, subject, date]
    );
    await client.query("COMMIT");
    res.status(200).json({ message: "Test scheduled." });
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

async function deleteTest(req, res) {
  const { id } = req.body?.data || {};

  if (!id) {
    return res.status(400).json({ message: "A test id is required." });
  }

  const client = await pool.connect();

  try {
    const result = await client.query(
      `DELETE FROM public."upcoming_tests" WHERE id = $1`,
      [id]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "That test no longer exists." });
    }

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
        ? await createTest(req, res)
        : await deleteTest(req, res);
    }

    return methodNotAllowed(res, ["GET", "POST", "DELETE"]);
  } catch (error) {
    console.error("Test request failed:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "An error occurred" });
    }
  }
}
