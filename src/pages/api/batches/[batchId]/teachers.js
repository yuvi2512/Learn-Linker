import { pool } from "../../../../../lib/db";
import { requireUser, methodNotAllowed } from "@/utils/apiAuth";
import { isUuid, parseBatchId, batchExists } from "@/utils/batches";

async function listTeachers(res, batchId) {
  const client = await pool.connect();

  try {
    if (!(await batchExists(client, batchId))) {
      return res.status(404).json({ message: "That batch no longer exists." });
    }

    const { rows } = await client.query(
      `SELECT u.id, u.name, u.email, bt.added_at
         FROM public.batch_teachers bt
         JOIN public.users u ON u.id = bt.teacher_id
        WHERE bt.batch_id = $1
        ORDER BY u.name ASC`,
      [batchId]
    );

    res.status(200).json(rows);
  } finally {
    client.release();
  }
}

async function replaceTeachers(req, res, batchId) {
  const { teacherIds } = req.body || {};

  if (!Array.isArray(teacherIds)) {
    return res.status(400).json({ message: "teacherIds must be an array." });
  }

  const invalid = teacherIds.some((id) => !isUuid(id));
  if (invalid) {
    return res.status(400).json({ message: "One of the teacher ids is not valid." });
  }

  const unique = [...new Set(teacherIds.map((id) => id.toLowerCase()))];
  const client = await pool.connect();

  try {
    if (!(await batchExists(client, batchId))) {
      return res.status(404).json({ message: "That batch no longer exists." });
    }

    if (unique.length > 0) {
      const { rows } = await client.query(
        `SELECT id FROM public.users
          WHERE id = ANY($1::uuid[]) AND role IN ('teacher', 'admin')`,
        [unique]
      );

      if (rows.length !== unique.length) {
        return res.status(400).json({
          message: "Only teacher accounts can be assigned to a batch.",
        });
      }
    }

    await client.query("BEGIN");

    await client.query(
      `DELETE FROM public.batch_teachers
        WHERE batch_id = $1
          AND ($2::uuid[] IS NULL OR NOT (teacher_id = ANY($2::uuid[])))`,
      [batchId, unique.length > 0 ? unique : null]
    );

    if (unique.length > 0) {
      await client.query(
        `INSERT INTO public.batch_teachers (batch_id, teacher_id)
         SELECT $1, id FROM unnest($2::uuid[]) AS id
         ON CONFLICT DO NOTHING`,
        [batchId, unique]
      );
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "Faculty updated.", count: unique.length });
  } catch (error) {
    await client.query("ROLLBACK");
    throw error;
  } finally {
    client.release();
  }
}

export default async function handler(req, res) {
  const user = await requireUser(req, res, ["admin"]);
  if (!user) return;

  const { batchId, error } = parseBatchId(req.query.batchId, { allowNull: false });
  if (error) return res.status(400).json({ message: error });

  try {
    if (req.method === "GET") return await listTeachers(res, batchId);
    if (req.method === "PUT") return await replaceTeachers(req, res, batchId);
    return methodNotAllowed(res, ["GET", "PUT"]);
  } catch (err) {
    console.error("Batch teachers request failed:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "An error occurred" });
    }
  }
}
