import { pool } from "../../../lib/db";

export default async function handler(req, res) {
  if (req.method === "POST") {
    const { timetable } = req.body;

    const client = await pool.connect();

    try {
      await client.query("BEGIN");

      const queryText = `
        INSERT INTO public.schedule (subject, teachername, classesperweek, timeSlot)
        VALUES ($1, $2, $3, $4)
      `;

      const promises = timetable.map((entry) => {
        const { subject, teacherId, classesPerWeek, timeSlot } =
          entry;
        return client.query(queryText, [
          subject,
          teacherId,
          classesPerWeek,
          timeSlot
        ]);
      });

      await Promise.all(promises);
      await client.query("COMMIT");

      res.status(200).json({ message: "Timetable saved successfully" });
    } catch (error) {
      await client.query("ROLLBACK");
      console.error("Error saving timetable:", error);
      res.status(500).json({ error: "Something went wrong" });
    } finally {
      client.release();
    }
  } else if (req.method === "GET") {
    try {
      const client = await pool.connect();
      try {
        const result = await client.query("SELECT * FROM public.schedule");

        res.status(200).json(result.rows);
      } finally {
        client.release();
      }
    } catch (error) {
      console.error("Error executing query", error);
      res.status(500).json({ error: "An error occurred" });
    }
  } else {
    res.status(405).json({ error: "Method Not Allowed" });
  }
}
