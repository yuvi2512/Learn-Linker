import { pool } from "../../../lib/db";
import { requireUser, methodNotAllowed } from "@/utils/apiAuth";
import { isStudentInBatch, batchExists, parseBatchId } from "@/utils/batches";

export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  const user = await requireUser(req, res, ["teacher"]);
  if (!user) return;

  const { subjects, batchId: rawBatchId } = req.body || {};

  const { batchId, error } = parseBatchId(rawBatchId, { allowNull: false });
  if (error) return res.status(400).json({ message: error });

  if (!Array.isArray(subjects) || subjects.length === 0) {
    return res.status(400).json({ message: "No subjects were provided." });
  }

  const invalid = subjects.some(
    (row) => !row.studentId || !row.subject || row.marks === "" || row.marks == null
  );
  if (invalid) {
    return res
      .status(400)
      .json({ message: "Every row needs a student, a subject, and marks." });
  }

  const studentIds = new Set(subjects.map((row) => row.studentId));
  if (studentIds.size > 1) {
    return res
      .status(400)
      .json({ message: "A marksheet covers one student at a time." });
  }

  const client = await pool.connect();

  try {
    if (!(await batchExists(client, batchId))) {
      return res.status(404).json({ message: "That batch no longer exists." });
    }

    const [studentId] = [...studentIds];
    if (!(await isStudentInBatch(client, studentId, batchId))) {
      return res
        .status(400)
        .json({ message: "That student is not on this batch's roll." });
    }

    await client.query("BEGIN");

    const queryText = `
      INSERT INTO public."student_marks" (batch_id, student_id, student_name, subject_name, marks_obtained)
      VALUES ($1, $2, $3, $4, $5)
    `;

    for (const row of subjects) {
      const { studentName, subject: subjectName, marks } = row;
      await client.query(queryText, [
        batchId,
        studentId,
        studentName,
        subjectName,
        marks,
      ]);
    }

    await client.query("COMMIT");
    res.status(200).json({ message: "Marksheet saved." });
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
