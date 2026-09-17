import { pool } from "../../../../lib/db";
import { requireUser, methodNotAllowed } from "@/utils/apiAuth";
import { parseBatchId } from "@/utils/batches";

async function updateBatch(req, res, batchId) {
  const { name, subject, description } = req.body || {};

  if (!name || !String(name).trim()) {
    return res.status(400).json({ message: "A batch needs a name." });
  }

  const client = await pool.connect();

  try {
    const { rows } = await client.query(
      `UPDATE public.batches
          SET name = $2,
              subject = $3,
              description = $4,
              updated_at = now()
        WHERE id = $1
        RETURNING id, name, subject, description, created_at`,
      [
        batchId,
        String(name).trim(),
        subject ? String(subject).trim() : null,
        description ? String(description).trim() : null,
      ]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: "That batch no longer exists." });
    }

    res.status(200).json(rows[0]);
  } catch (error) {
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

async function deleteBatch(res, batchId) {
  const client = await pool.connect();

  try {
    const result = await client.query(
      "DELETE FROM public.batches WHERE id = $1",
      [batchId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "That batch no longer exists." });
    }

    res.status(200).json({ message: "Batch deleted." });
  } finally {
    client.release();
  }
}

export default async function handler(req, res) {
  const user = await requireUser(req, res, ["admin"]);
  if (!user) return;

  const { batchId, error } = parseBatchId(req.query.batchId, {
    allowNull: false,
  });
  if (error) return res.status(400).json({ message: error });

  try {
    if (req.method === "PATCH" || req.method === "PUT") {
      return await updateBatch(req, res, batchId);
    }

    if (req.method === "DELETE") {
      return await deleteBatch(res, batchId);
    }

    return methodNotAllowed(res, ["PATCH", "DELETE"]);
  } catch (err) {
    console.error("Batch request failed:", err);
    if (!res.headersSent) {
      res.status(500).json({ message: "An error occurred" });
    }
  }
}
