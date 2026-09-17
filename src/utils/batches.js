const UUID_PATTERN =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Sentinel the client sends for "not scoped to a batch". */
export const ALL_BATCHES = "all";

export function isUuid(value) {
  return typeof value === "string" && UUID_PATTERN.test(value.trim());
}

/**
 * Turns a batch id from a query string or body into either a uuid or null.
 * A malformed id is rejected rather than silently widened to "everyone",
 * which would leak one batch's work to another.
 */
export function parseBatchId(value, { allowNull = true } = {}) {
  if (value == null || value === "" || value === ALL_BATCHES) {
    return allowNull
      ? { batchId: null }
      : { error: "A batch must be selected." };
  }

  const trimmed = String(value).trim();

  if (!isUuid(trimmed)) {
    return { error: "That batch id is not valid." };
  }

  return { batchId: trimmed.toLowerCase() };
}

/** Batch ids the student is enrolled in. */
export async function studentBatchIds(client, studentId) {
  const { rows } = await client.query(
    "SELECT batch_id FROM public.batch_students WHERE student_id = $1",
    [studentId]
  );

  return rows.map((row) => row.batch_id);
}

/** True when the student is on the roll for that batch. */
export async function isStudentInBatch(client, studentId, batchId) {
  const { rowCount } = await client.query(
    `SELECT 1
       FROM public.batch_students
      WHERE student_id = $1 AND batch_id = $2`,
    [studentId, batchId]
  );

  return rowCount > 0;
}

export async function batchExists(client, batchId) {
  const { rowCount } = await client.query(
    "SELECT 1 FROM public.batches WHERE id = $1",
    [batchId]
  );

  return rowCount > 0;
}
