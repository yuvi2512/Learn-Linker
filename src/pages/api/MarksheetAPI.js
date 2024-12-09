
import { pool } from "../../../lib/db"; 

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { subjects } = req.body; 

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const queryText = `
        INSERT INTO public."student_marks" (student_id, student_name, subject_name, marks_obtained)
        VALUES ($1, $2, $3, $4)
      `;

      const promises = subjects.map((subject) => {
        const { studentId, studentName, subject: subjectName, marks } = subject;
        return client.query(queryText, [
          studentId,
          studentName,
          subjectName,
          marks,
        ]);
      });

      
      await Promise.all(promises);
      await client.query("COMMIT");

      res.status(200).json({ message: "Data inserted successfully" });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error inserting data:", error);
      res.status(500).json({ error: "Something went wrong" });
    } finally {
      client.release();
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}
