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

/** Creating, editing, deleting batches and assigning faculty. */
export function canManageBatches(user) {
  return isAdmin(user);
}

/** Publishing the weekly grid overwrites a batch timetable. Admin only. */
export function canBuildTimetable(user) {
  return isAdmin(user);
}
