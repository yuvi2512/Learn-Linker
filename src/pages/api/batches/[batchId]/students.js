import { pool } from "../../../../../lib/db";
import { requireUser, methodNotAllowed } from "@/utils/apiAuth";
import { batchExists, isUuid, parseBatchId } from "@/utils/batches";

async function listRoster(res, batchId) {
  const client = await pool.connect();

  try {
    if (!(await batchExists(client, batchId))) {
      return res.status(404).json({ message: "That batch no longer exists." });
    }

    const { rows } = await client.query(
      `SELECT u.id, u.name, u.email, bs.added_at
         FROM public.batch_students bs
         JOIN public.users u ON u.id = bs.student_id
        WHERE bs.batch_id = $1
        ORDER BY u.name ASC`,
      [batchId]
    );

    res.status(200).json(rows);
  } finally {
    client.release();
  }
}

/**
 * Replaces the roster with exactly the ids provided, so the teacher's checkbox
 * list is the source of truth. Removing a student keeps their existing
 * attendance rows for the batch — those describe classes that did happen.
 */
async function replaceRoster(req, res, batchId) {
  const { studentIds } = req.body || {};

  if (!Array.isArray(studentIds)) {
    return res.status(400).json({ message: "studentIds must be an array." });
  }

  const invalid = studentIds.some((id) => !isUuid(id));
  if (invalid) {
    return res.status(400).json({ message: "One of the student ids is not valid." });
  }

  const unique = [...new Set(studentIds.map((id) => id.toLowerCase()))];

  const client = await pool.connect();

  try {
    if (!(await batchExists(client, batchId))) {
      return res.status(404).json({ message: "That batch no longer exists." });
    }

    // Teachers must not end up on a student roster.
    if (unique.length > 0) {
      const { rows } = await client.query(
        `SELECT id FROM public.users WHERE id = ANY($1::uuid[]) AND role = 'student'`,
        [unique]
      );

      if (rows.length !== unique.length) {
        return res
          .status(400)
          .json({ message: "Only registered students can be added to a batch." });
      }
    }

    await client.query("BEGIN");

    await client.query(
      `DELETE FROM public.batch_students
        WHERE batch_id = $1
          AND ($2::uuid[] IS NULL OR NOT (student_id = ANY($2::uuid[])))`,
      [batchId, unique.length > 0 ? unique : null]
    );

    if (unique.length > 0) {
      await client.query(
        `INSERT INTO public.batch_students (batch_id, student_id)
         SELECT $1, id FROM unnest($2::uuid[]) AS id
         ON CONFLICT DO NOTHING`,
        [batchId, unique]
      );
    }

    await client.query("COMMIT");

    res.status(200).json({ message: "Roster updated.", count: unique.length });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export default async function handler(req, res) {
  const user = await requireUser(req, res, ["teacher"]);
  if (!user) return;

  const { batchId, error } = parseBatchId(req.query.batchId, {
    allowNull: false,
  });
  if (error) return res.status(400).json({ message: error });

  try {
    if (req.method === "GET") {
      return await listRoster(res, batchId);
    }

    if (req.method === "PUT") {
      return await replaceRoster(req, res, batchId);
    }

    return methodNotAllowed(res, ["GET", "PUT"]);
  } catch (err) {
    console.error("Batch roster request failed:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "An error occurred" });
    }
  }
}
