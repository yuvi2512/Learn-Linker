const allowlist = (process.env.NEXT_PUBLIC_TIMETABLE_ADMINS || "")
  .split(",")
  .map((email) => email.trim().toLowerCase())
  .filter(Boolean);

export function isAdmin(user) {
  return user?.role === "admin";
}

/** Teachers and admins share the teaching workspace. */
export function isStaff(user) {
  return user?.role === "teacher" || user?.role === "admin";
}

/**
 * Route/API role check. Admins inherit every teacher-only capability, so a
 * page guarded with `["teacher"]` stays open to the institute admin too.
 */
export function hasAllowedRole(role, allowedRoles = []) {
  if (!allowedRoles.length) return true;
  if (allowedRoles.includes(role)) return true;
  if (role === "admin" && allowedRoles.includes("teacher")) return true;
  return false;
}

/**
 * Timetable publishing overwrites the whole grid, so it can be limited to
 * named teachers via NEXT_PUBLIC_TIMETABLE_ADMINS. With no allowlist set,
 * any teacher may publish. Admins always can.
 */
export function canBuildTimetable(user) {
  if (!isStaff(user)) return false;
  if (isAdmin(user) || allowlist.length === 0) return true;
  return allowlist.includes(String(user.email || "").toLowerCase());
}
