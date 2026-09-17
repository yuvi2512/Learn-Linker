import { pool } from "../../../lib/db";
import { requireUser, methodNotAllowed } from "@/utils/apiAuth";
import { isAdmin } from "@/utils/permissions";
import { parseBatchId, requireBatchAccess } from "@/utils/batches";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const user = await requireUser(req, res, ["teacher"]);
  if (!user) return;

  const { batchId, error } = parseBatchId(req.query.batchId);
  if (error) return res.status(400).json({ message: error });

  try {
    const client = await pool.connect();
    try {
      if (batchId) {
        if (!(await requireBatchAccess(client, user, batchId, res))) return;
        const { rows } = await client.query(
          `SELECT u.id, u.name, u.email
             FROM public.users u
             JOIN public.batch_students bs ON bs.student_id = u.id
            WHERE bs.batch_id = $1 AND u.role = 'student'
            ORDER BY u.name ASC`,
          [batchId]
        );
        return res.status(200).json(rows);
      }

      if (!isAdmin(user)) {
        return res.status(403).json({
          message: "Pick a batch to see its roll.",
        });
      }

      const { rows } = await client.query(
        `SELECT id, name, email
           FROM public.users
          WHERE role = 'student'
          ORDER BY name ASC`
      );
      res.status(200).json(rows);
    } finally {
      client.release();
    }
  } catch (err) {
    console.error("Error executing query", err);
    res.status(500).json({ message: "An error occurred" });
  }
}
