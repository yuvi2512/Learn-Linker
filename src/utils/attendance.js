/**
 * Attendance is stored as a boolean. Older rows and some drivers still surface
 * it as a string, so normalise before counting.
 */
export function isPresent(row) {
  return row?.present === true || row?.present === "t" || row?.present === "true";
}

export function attendanceSummary(rows = []) {
  const total = rows.length;
  const present = rows.filter(isPresent).length;

  return {
    total,
    present,
    absent: total - present,
    percentage: total ? Math.round((present / total) * 100) : 0,
  };
}

export function toDateKey(value) {
  if (!value) return "";
  if (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value)) {
    return value.slice(0, 10);
  }
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
