import { getServerSession } from "next-auth/next";
import { getToken } from "next-auth/jwt";
import { authOptions } from "@/lib/auth";
import { hasAllowedRole } from "@/utils/permissions";

async function sessionUser(req, res) {
  const session = await getServerSession(req, res, authOptions);
  if (session?.user) return session.user;

  // Fallback if webpack still splits the NextAuth module: read the JWT cookie
  // with the same secret the login route used to sign it.
  const token = await getToken({
    req,
    secret: authOptions.secret,
    secureCookie: Boolean(authOptions.useSecureCookies),
  });
  if (!token?.id && !token?.email) return null;

  return {
    id: token.id,
    email: token.email,
    name: token.name,
    role: token.role,
  };
}

/**
 * Resolves the signed-in user for an API route, enforcing role access.
 * Responds with 401/403 and returns null when access should be denied, so
 * handlers can `if (!user) return;` and stop.
 */
export async function requireUser(req, res, roles = []) {
  const user = await sessionUser(req, res);

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
