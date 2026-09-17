import { getServerSession } from "next-auth/next";
import { authOptions } from "@/pages/api/auth/[...nextauth]";
import { hasAllowedRole } from "@/utils/permissions";

/**
 * Resolves the signed-in user for an API route, enforcing role access.
 * Responds with 401/403 and returns null when access should be denied, so
 * handlers can `if (!user) return;` and stop.
 */
export async function requireUser(req, res, roles = []) {
  const session = await getServerSession(req, res, authOptions);
  const user = session?.user;

  if (!user) {
    res.status(401).json({ message: "You must be signed in." });
    return null;
  }

  if (roles.length > 0 && !hasAllowedRole(user.role, roles)) {
    res.status(403).json({ message: "You do not have access to this resource." });
    return null;
  }

  return user;
}

export function methodNotAllowed(res, allowed) {
  res.setHeader("Allow", allowed.join(", "));
  return res
    .status(405)
    .json({ message: `Method not allowed. Try: ${allowed.join(", ")}` });
}
