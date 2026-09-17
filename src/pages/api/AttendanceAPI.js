import { pool } from "../../../lib/db";
import { requireUser, methodNotAllowed } from "@/utils/apiAuth";
import { isAdmin } from "@/utils/permissions";
import {
  parseBatchId,
  requireBatchAccess,
  teacherBatchIds,
} from "@/utils/batches";

async function saveAttendance(req, res, user) {
  const { batchId: rawBatchId, date, presentIds, replace } = req.body || {};

  const { batchId, error } = parseBatchId(rawBatchId, { allowNull: false });
  if (error) return res.status(400).json({ message: error });

  if (!date) {
    return res.status(400).json({ message: "A class date is required." });
  }

  const presentSet = new Set(
    (Array.isArray(presentIds) ? presentIds : []).map(String)
  );

  const client = await pool.connect();

  try {
    if (!(await requireBatchAccess(client, user, batchId, res))) return;

    const { rows: roster } = await client.query(
      `SELECT u.id
         FROM public.batch_students bs
         JOIN public.users u ON u.id = bs.student_id
        WHERE bs.batch_id = $1`,
      [batchId]
    );

    if (roster.length === 0) {
      return res
        .status(400)
        .json({ message: "There are no students on this batch's roll." });
    }

    const { rows: existing } = await client.query(
      `SELECT 1 FROM public.attendance WHERE batch_id = $1 AND date = $2 LIMIT 1`,
      [batchId, date]
    );

    if (existing.length > 0 && !replace) {
      return res.status(409).json({
        message: "Attendance for that date is already saved. Open it to edit.",
        alreadyTaken: true,
      });
    }

    await client.query("BEGIN");

    const queryText = `
      INSERT INTO public.attendance (batch_id, student_id, present, date)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (batch_id, student_id, date)
      DO UPDATE SET present = EXCLUDED.present
    `;

    for (const student of roster) {
      await client.query(queryText, [
        batchId,
        student.id,
        presentSet.has(String(student.id)),
        date,
      ]);
    }

    await client.query("COMMIT");
    res.status(200).json({
      message: replace ? "Attendance updated." : "Attendance saved.",
    });
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

export default async function handler(req, res) {
  const user = await requireUser(req, res, ["teacher"]);
  if (!user) return;

  if (req.method === "POST") {
    return saveAttendance(req, res, user);
  }

  if (req.method !== "GET") {
    return methodNotAllowed(res, ["GET", "POST"]);
  }

  const { service, selectedDate } = req.query;
  const { batchId, error } = parseBatchId(req.query.batchId);
  if (error) return res.status(400).json({ message: error });

  const client = await pool.connect();

  try {
    if (batchId && !(await requireBatchAccess(client, user, batchId, res))) {
      return;
    }

    let scope = batchId ? [batchId] : null;
    if (!batchId && !isAdmin(user)) {
      scope = await teacherBatchIds(client, user.id);
    }

    if (service === "SESSIONS") {
      if (!batchId) return res.status(400).json({ message: "batchId is required" });
      const { rows } = await client.query(
        `SELECT a.date::text AS date,
                COUNT(*)::int AS total,
                COUNT(*) FILTER (WHERE a.present)::int AS present_count
           FROM public.attendance a
          WHERE a.batch_id = $1
          GROUP BY a.date
          ORDER BY a.date DESC`,
        [batchId]
      );
      return res.status(200).json(rows);
    }

    if (service === "REGISTER" || service === "CHECKATTENDANCE") {
      if (!selectedDate) {
        return res.status(400).json({ message: "selectedDate is required" });
      }
      if (!batchId) return res.status(400).json({ message: "batchId is required" });
      const { rows } = await client.query(
        `SELECT u.id AS student_id,
                u.name AS student_name,
                COALESCE(a.present, false) AS present,
                $2::date AS date
           FROM public.batch_students bs
           JOIN public.users u ON u.id = bs.student_id
           LEFT JOIN public.attendance a
             ON a.student_id = u.id
            AND a.batch_id = bs.batch_id
            AND a.date = $2::date
          WHERE bs.batch_id = $1
          ORDER BY u.name ASC`,
        [batchId, selectedDate]
      );
      return res.status(200).json(rows);
    }

    if (service === "GETATTENDANCE" || !service) {
      const { rows } = await client.query(
        `SELECT a.id,
                a.batch_id,
                a.student_id,
                a.present,
                a.date,
                u.name AS student_name,
                b.name AS batch_name
           FROM public.attendance a
           JOIN public.users u ON u.id = a.student_id
           LEFT JOIN public.batches b ON b.id = a.batch_id
          WHERE ($1::uuid[] IS NULL OR a.batch_id = ANY($1::uuid[]))
          ORDER BY a.date ASC`,
        [scope]
      );
      return res.status(200).json(rows);
    }

    return res.status(400).json({ message: "Unknown service" });
  } catch (error) {
    console.error("Error executing query", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "An error occurred" });
    }
  } finally {
    client.release();
  }
}
