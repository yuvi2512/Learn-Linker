import { pool } from "../../../lib/db";
import { requireUser, methodNotAllowed } from "@/utils/apiAuth";

export default async function handler(req, res) {
  if (req.method !== "GET") return methodNotAllowed(res, ["GET"]);

  const user = await requireUser(req, res, ["admin"]);
  if (!user) return;

  try {
    const client = await pool.connect();
    try {
      const { rows } = await client.query(
        `SELECT id, name, email, role
           FROM public.users
          WHERE role IN ('teacher', 'admin')
          ORDER BY name ASC`
      );
      res.status(200).json(rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error listing teachers:", error);
    res.status(500).json({ message: "An error occurred" });
  }
}
