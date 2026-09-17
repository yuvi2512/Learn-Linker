/**
 * Attendance is written as "True"/"False" strings but read back as booleans
 * depending on the column type, so normalise before counting.
 */
export function isPresent(row) {
  return row?.present === true || row?.present === "True" || row?.present === "t";
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
