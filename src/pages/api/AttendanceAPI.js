import { pool } from "../../../lib/db";
import { requireUser, methodNotAllowed } from "@/utils/apiAuth";
import { batchExists, parseBatchId } from "@/utils/batches";

async function takeAttendance(req, res) {
  const { subjects, batchId: rawBatchId } = req.body || {};

  // A register belongs to a specific class, so the batch is not optional here.
  const { batchId, error } = parseBatchId(rawBatchId, { allowNull: false });
  if (error) return res.status(400).json({ message: error });

  if (!Array.isArray(subjects) || subjects.length === 0) {
    return res.status(400).json({ message: "No attendance rows were provided." });
  }

  const client = await pool.connect();

  try {
    if (!(await batchExists(client, batchId))) {
      return res.status(404).json({ message: "That batch no longer exists." });
    }

    // Guards against marking a student who has since left the batch.
    const { rows: roster } = await client.query(
      "SELECT student_id FROM public.batch_students WHERE batch_id = $1",
      [batchId]
    );
    const enrolled = new Set(roster.map((row) => row.student_id));

    const stranger = subjects.find((row) => !enrolled.has(row.student_id));
    if (stranger) {
      return res.status(400).json({
        message: `${
          stranger.student_name || "That student"
        } is not on this batch's roll.`,
      });
    }

    await client.query("BEGIN");

    const queryText = `
      INSERT INTO public."attendance" (batch_id, student_id, student_name, present, absent, date)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (batch_id, student_id, date)
      DO UPDATE SET
        present = EXCLUDED.present,
        absent = EXCLUDED.absent,
        student_name = EXCLUDED.student_name
    `;

    for (const { student_id, student_name, present, absent, date } of subjects) {
      await client.query(queryText, [
        batchId,
        student_id,
        student_name,
        present,
        absent,
        date,
      ]);
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "Attendance saved." });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Error inserting data:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Something went wrong" });
    }
  } finally {
    client.release();
  }
}

async function runQuery(res, text, params = []) {
  try {
    const client = await pool.connect();
    try {
      const result = await client.query(text, params);
      res.status(200).json(result.rows);
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Error executing query", error);
    res.status(500).json({ message: "An error occurred" });
  }
}

export default async function handler(req, res) {
  const user = await requireUser(req, res, ["teacher"]);
  if (!user) return;

  if (req.method === "POST") {
    return takeAttendance(req, res);
  }

  if (req.method === "GET") {
    const { service, selectedDate } = req.query;

    if (service === "GETTEACHERS") {
      return runQuery(
        res,
        `SELECT id, name, email
           FROM public.users
          WHERE role = 'teacher'
          ORDER BY name ASC`
      );
    }

    const { batchId, error } = parseBatchId(req.query.batchId);
    if (error) return res.status(400).json({ message: error });

    if (service === "CHECKATTENDANCE") {
      if (!selectedDate) {
        return res.status(400).json({ message: "selectedDate is required" });
      }
      if (!batchId) {
        return res.status(400).json({ message: "batchId is required" });
      }
      return runQuery(
        res,
        `SELECT * FROM public.attendance
          WHERE date = $1 AND batch_id = $2`,
        [selectedDate, batchId]
      );
    }

    if (service === "GETATTENDANCE") {
      // No batch means the whole institute, which the overview still wants.
      return batchId
        ? runQuery(
            res,
            `SELECT * FROM public.attendance
              WHERE batch_id = $1
              ORDER BY date ASC`,
            [batchId]
          )
        : runQuery(
            res,
            "SELECT * FROM public.attendance ORDER BY date ASC"
          );
    }

    return res.status(400).json({ message: "Unknown service" });
  }

  return methodNotAllowed(res, ["GET", "POST"]);
}
