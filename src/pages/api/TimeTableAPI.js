import { pool } from "../../../lib/db";
import { requireUser, methodNotAllowed } from "@/utils/apiAuth";
import { canBuildTimetable } from "@/utils/permissions";
import { batchExists, parseBatchId } from "@/utils/batches";

// batch_id IS NULL is the institute-wide grid every batch falls back to.
const STUDENT_GRID = `
  SELECT s.*, b.name AS batch_name
    FROM public.schedule s
    LEFT JOIN public.batches b ON b.id = s.batch_id
   WHERE s.batch_id IS NULL
      OR s.batch_id IN (
           SELECT batch_id FROM public.batch_students WHERE student_id = $1
         )
`;

async function readTimetable(req, res, user) {
  const { batchId, error } = parseBatchId(req.query.batchId);
  if (error) return res.status(400).json({ message: error });

  const client = await pool.connect();

  try {
    let result;

    if (user.role === "student") {
      result = await client.query(STUDENT_GRID, [user.id]);
    } else {
      result = await client.query(
        `SELECT s.*, b.name AS batch_name
           FROM public.schedule s
           LEFT JOIN public.batches b ON b.id = s.batch_id
          WHERE s.batch_id IS NOT DISTINCT FROM $1`,
        [batchId]
      );
    }

    res.status(200).json(result.rows);
  } finally {
    client.release();
  }
}

async function publishTimetable(req, res) {
  const { timetable, batchId: rawBatchId } = req.body || {};

  const { batchId, error } = parseBatchId(rawBatchId);
  if (error) return res.status(400).json({ message: error });

  if (!Array.isArray(timetable) || timetable.length === 0) {
    return res.status(400).json({ message: "No timetable rows were provided." });
  }

  const invalid = timetable.some(
    (row) => !row.subject || !row.teacherId || !row.classesPerWeek || !row.timeSlot
  );
  if (invalid) {
    return res
      .status(400)
      .json({ message: "Every period needs a subject, teacher, load, and slot." });
  }

  const client = await pool.connect();

  try {
    if (batchId && !(await batchExists(client, batchId))) {
      return res.status(404).json({ message: "That batch no longer exists." });
    }

    await client.query("BEGIN");

    // Publishing replaces this batch's grid only, so other batches keep theirs.
    await client.query(
      "DELETE FROM public.schedule WHERE batch_id IS NOT DISTINCT FROM $1",
      [batchId]
    );

    const queryText = `
      INSERT INTO public.schedule (batch_id, subject, teachername, classesperweek, timeSlot)
      VALUES ($1, $2, $3, $4, $5)
    `;

    for (const entry of timetable) {
      const { subject, teacherId, classesPerWeek, timeSlot } = entry;
      await client.query(queryText, [
        batchId,
        subject,
        teacherId,
        classesPerWeek,
        timeSlot,
      ]);
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "Timetable published." });
  } catch (err) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Error saving timetable:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "Something went wrong" });
    }
  } finally {
    client.release();
  }
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const user = await requireUser(req, res, ["teacher", "student"]);
      if (!user) return;
      return await readTimetable(req, res, user);
    }

    if (req.method === "POST") {
      const user = await requireUser(req, res, ["teacher"]);
      if (!user) return;

      if (!canBuildTimetable(user)) {
        return res
          .status(403)
          .json({ message: "You are not allowed to publish the timetable." });
      }

      return await publishTimetable(req, res);
    }

    return methodNotAllowed(res, ["GET", "POST"]);
  } catch (error) {
    console.error("Timetable request failed:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "An error occurred" });
    }
  }
}
