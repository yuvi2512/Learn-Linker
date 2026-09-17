import { pool } from "../../../lib/db";
import { requireUser, methodNotAllowed } from "@/utils/apiAuth";
import { canBuildTimetable, isAdmin } from "@/utils/permissions";
import {
  parseBatchId,
  requireBatchAccess,
  teacherBatchIds,
} from "@/utils/batches";
import { WEEKDAYS, TIME_SLOTS } from "@/utils/timetable";

const validDays = new Set(WEEKDAYS.map((day) => day.value));
const validSlots = new Set(TIME_SLOTS);

const STUDENT_GRID = `
  SELECT s.id,
         s.batch_id,
         s.subject,
         s.teacher_id,
         s.day_of_week,
         s.timeslot,
         u.name AS teacher_name,
         b.name AS batch_name
    FROM public.schedule s
    LEFT JOIN public.users u ON u.id = s.teacher_id
    LEFT JOIN public.batches b ON b.id = s.batch_id
   WHERE s.batch_id IS NULL
      OR s.batch_id IN (
           SELECT batch_id FROM public.batch_students WHERE student_id = $1
         )
   ORDER BY s.day_of_week, s.timeslot
`;

async function readTimetable(req, res, user) {
  const { batchId, error } = parseBatchId(req.query.batchId);
  if (error) return res.status(400).json({ message: error });

  const client = await pool.connect();

  try {
    if (user.role === "student") {
      const result = await client.query(STUDENT_GRID, [user.id]);
      return res.status(200).json(result.rows);
    }

    if (batchId && !(await requireBatchAccess(client, user, batchId, res))) {
      return;
    }

    if (!batchId && !isAdmin(user)) {
      const assigned = await teacherBatchIds(client, user.id);
      const result = await client.query(
        `SELECT s.id,
                s.batch_id,
                s.subject,
                s.teacher_id,
                s.day_of_week,
                s.timeslot,
                u.name AS teacher_name,
                b.name AS batch_name
           FROM public.schedule s
           LEFT JOIN public.users u ON u.id = s.teacher_id
           LEFT JOIN public.batches b ON b.id = s.batch_id
          WHERE s.batch_id = ANY($1::uuid[]) OR s.batch_id IS NULL
          ORDER BY s.day_of_week, s.timeslot`,
        [assigned]
      );
      return res.status(200).json(result.rows);
    }

    const result = await client.query(
      `SELECT s.id,
              s.batch_id,
              s.subject,
              s.teacher_id,
              s.day_of_week,
              s.timeslot,
              u.name AS teacher_name,
              b.name AS batch_name
         FROM public.schedule s
         LEFT JOIN public.users u ON u.id = s.teacher_id
         LEFT JOIN public.batches b ON b.id = s.batch_id
        WHERE s.batch_id IS NOT DISTINCT FROM $1
        ORDER BY s.day_of_week, s.timeslot`,
      [batchId]
    );

    res.status(200).json(result.rows);
  } finally {
    client.release();
  }
}

async function publishTimetable(req, res, user) {
  const { periods, batchId: rawBatchId } = req.body || {};

  const { batchId, error } = parseBatchId(rawBatchId, { allowNull: true });
  if (error) return res.status(400).json({ message: error });

  if (!Array.isArray(periods) || periods.length === 0) {
    return res.status(400).json({ message: "Add at least one period." });
  }

  const rows = [];
  const seen = new Set();

  for (const period of periods) {
    const subject = String(period.subject || "").trim();
    const teacherId = period.teacherId;
    const timeSlot = period.timeSlot;
    const days = Array.isArray(period.days)
      ? [...new Set(period.days.map(Number))]
      : [];

    if (!subject || !teacherId || !timeSlot || days.length === 0) {
      return res.status(400).json({
        message: "Every period needs a subject, teacher, slot, and at least one day.",
      });
    }

    if (!validSlots.has(timeSlot)) {
      return res.status(400).json({ message: `Unknown time slot: ${timeSlot}` });
    }

    for (const day of days) {
      if (!validDays.has(day)) {
        return res.status(400).json({ message: "Pick weekdays from Monday to Saturday." });
      }
      const key = `${day}|${timeSlot}`;
      if (seen.has(key)) {
        return res.status(400).json({
          message: "Two subjects cannot share the same day and time slot.",
        });
      }
      seen.add(key);
      rows.push({ subject, teacherId, timeSlot, day });
    }
  }

  const client = await pool.connect();

  try {
    if (batchId && !(await requireBatchAccess(client, user, batchId, res))) {
      return;
    }

    const teacherIds = [...new Set(rows.map((row) => row.teacherId))];
    const { rows: teachers } = await client.query(
      `SELECT id FROM public.users
        WHERE id = ANY($1::uuid[]) AND role IN ('teacher', 'admin')`,
      [teacherIds]
    );
    if (teachers.length !== teacherIds.length) {
      return res.status(400).json({ message: "One of those teachers is not valid." });
    }

    await client.query("BEGIN");

    await client.query(
      "DELETE FROM public.schedule WHERE batch_id IS NOT DISTINCT FROM $1",
      [batchId]
    );

    for (const row of rows) {
      await client.query(
        `INSERT INTO public.schedule (batch_id, subject, teacher_id, day_of_week, timeslot)
         VALUES ($1, $2, $3, $4, $5)`,
        [batchId, row.subject, row.teacherId, row.day, row.timeSlot]
      );
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
      const user = await requireUser(req, res, ["admin"]);
      if (!user) return;

      if (!canBuildTimetable(user)) {
        return res
          .status(403)
          .json({ message: "Only the institute admin can publish the timetable." });
      }

      return await publishTimetable(req, res, user);
    }

    return methodNotAllowed(res, ["GET", "POST"]);
  } catch (error) {
    console.error("Timetable request failed:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "An error occurred" });
    }
  }
}
