import { pool } from "../../../../lib/db";
import { requireUser, methodNotAllowed } from "@/utils/apiAuth";
import { isAdmin } from "@/utils/permissions";

const TEACHERS_JSON = `
  COALESCE(
    (
      SELECT json_agg(
               json_build_object('id', u.id, 'name', u.name)
               ORDER BY u.name
             )
        FROM public.batch_teachers bt
        JOIN public.users u ON u.id = bt.teacher_id
       WHERE bt.batch_id = b.id
    ),
    '[]'::json
  ) AS teachers
`;

const ADMIN_LIST = `
  SELECT b.id,
         b.name,
         b.subject,
         b.description,
         b.created_at,
         COUNT(bs.student_id)::int AS student_count,
         ${TEACHERS_JSON}
    FROM public.batches b
    LEFT JOIN public.batch_students bs ON bs.batch_id = b.id
   GROUP BY b.id
   ORDER BY b.name ASC
`;

const TEACHER_LIST = `
  SELECT b.id,
         b.name,
         b.subject,
         b.description,
         b.created_at,
         COUNT(bs.student_id)::int AS student_count,
         ${TEACHERS_JSON}
    FROM public.batches b
    JOIN public.batch_teachers mine
      ON mine.batch_id = b.id AND mine.teacher_id = $1
    LEFT JOIN public.batch_students bs ON bs.batch_id = b.id
   GROUP BY b.id
   ORDER BY b.name ASC
`;

const STUDENT_LIST = `
  SELECT b.id,
         b.name,
         b.subject,
         b.description,
         b.created_at,
         COUNT(peers.student_id)::int AS student_count,
         ${TEACHERS_JSON}
    FROM public.batches b
    JOIN public.batch_students mine
      ON mine.batch_id = b.id AND mine.student_id = $1
    LEFT JOIN public.batch_students peers ON peers.batch_id = b.id
   GROUP BY b.id
   ORDER BY b.name ASC
`;

async function listBatches(user, res) {
  const client = await pool.connect();

  try {
    const result =
      user.role === "student"
        ? await client.query(STUDENT_LIST, [user.id])
        : isAdmin(user)
        ? await client.query(ADMIN_LIST)
        : await client.query(TEACHER_LIST, [user.id]);

    res.status(200).json(result.rows);
  } finally {
    client.release();
  }
}

async function createBatch(req, res, user) {
  const { name, subject, description, teacherIds } = req.body || {};

  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: "A batch needs a name." });
  }

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const { rows } = await client.query(
      `INSERT INTO public.batches (name, subject, description, created_by)
       VALUES ($1, $2, $3, $4)
       RETURNING id, name, subject, description, created_at`,
      [
        String(name).trim(),
        subject ? String(subject).trim() : null,
        description ? String(description).trim() : null,
        user.id,
      ]
    );

    const batch = rows[0];
    const assigned = Array.isArray(teacherIds)
      ? [...new Set(teacherIds.filter(Boolean).map(String))]
      : [];

    if (assigned.length > 0) {
      await client.query(
        `INSERT INTO public.batch_teachers (batch_id, teacher_id)
         SELECT $1, id FROM public.users
          WHERE id = ANY($2::uuid[]) AND role IN ('teacher', 'admin')
         ON CONFLICT DO NOTHING`,
        [batch.id, assigned]
      );
    }

    await client.query("COMMIT");
    res.status(201).json({ ...batch, student_count: 0, teachers: [] });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    if (error.code === "23505") {
      return res
        .status(409)
        .json({ message: "A batch with that name already exists." });
    }
    throw error;
  } finally {
    client.release();
  }
}

export default async function handler(req, res) {
  try {
    if (req.method === "GET") {
      const user = await requireUser(req, res, ["teacher", "student"]);
      if (!user) return;
      return await listBatches(user, res);
    }

    if (req.method === "POST") {
      const user = await requireUser(req, res, ["admin"]);
      if (!user) return;
      return await createBatch(req, res, user);
    }

    return methodNotAllowed(res, ["GET", "POST"]);
  } catch (error) {
    console.error("Batches request failed:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "An error occurred" });
    }
  }
}
