import { pool } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const { studentId } = req.query;

      const client = await pool.connect();
      try {
        const result = await client.query(
          "SELECT * FROM public.attendance WHERE student_id = $1",
          [studentId]
        );

        res.status(200).json(result.rows);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Error executing query", error);
      res.status(500).json({ error: "An error occurred" });
    }
  } else {
    res.status(405).json({ error: "Method not allowed" });
  }
}
