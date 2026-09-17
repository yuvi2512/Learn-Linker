import { pool } from "../../../lib/db";
import { requireUser, methodNotAllowed } from "@/utils/apiAuth";
import { parseBatchId } from "@/utils/batches";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const user = await requireUser(req, res, ["teacher"]);
  if (!user) return;

  // Without a batch this returns every student, which is what the roster
  // editor needs. With one, it returns just that batch's roll.
  const { batchId, error } = parseBatchId(req.query.batchId);
  if (error) return res.status(400).json({ message: error });

  try {
    const client = await pool.connect();
    try {
      const result = batchId
        ? await client.query(
            `SELECT u.id, u.name, u.email
               FROM public.users u
               JOIN public.batch_students bs ON bs.student_id = u.id
              WHERE bs.batch_id = $1 AND u.role = 'student'
              ORDER BY u.name ASC`,
            [batchId]
          )
        : await client.query(
            `SELECT id, name, email
               FROM public.users
              WHERE role = 'student'
              ORDER BY name ASC`
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
