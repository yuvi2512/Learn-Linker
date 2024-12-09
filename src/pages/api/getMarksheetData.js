import { pool } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method === "GET") {
    const { StudentId } = req.query; 
    try {
      const client = await pool.connect();
      try {
        const result = await client.query("SELECT * from public.student_marks WHERE student_id = $1", [StudentId]);
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
