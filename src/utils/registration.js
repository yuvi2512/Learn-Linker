import crypto from "crypto";
import bcrypt from "bcryptjs";
import User from "@/models/user";

// Mirrors the rule the sign-up form shows, so a hand-rolled request cannot
// create a weaker password than the UI allows.
const PASSWORD_PATTERN =
  /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*#?&])[A-Za-z\d@$!%*#?&]{6,}$/;

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/**
 * Validates the shared name/email/password fields.
 * Returns `{ error }` on failure, or the cleaned values on success.
 */
export function parseCredentials(body) {
  const { name, email, password } = body || {};

  if (!name || !email || !password) {
    return { error: "Name, email, and password are all required." };
  }

  const cleanName = String(name).trim();
  const cleanEmail = String(email).trim().toLowerCase();

  if (cleanName.length < 2) {
    return { error: "Enter your full name." };
  }

  if (!EMAIL_PATTERN.test(cleanEmail)) {
    return { error: "Enter a valid email address." };
  }

  if (!PASSWORD_PATTERN.test(String(password))) {
    return {
      error:
        "Password needs at least 6 characters, including a letter, a number, and a special character.",
    };
  }

  return { name: cleanName, email: cleanEmail, password: String(password) };
}

/** Constant-time comparison so the invite code cannot be guessed byte by byte. */
export function matchesInviteCode(provided, expected) {
  const a = Buffer.from(String(provided ?? ""), "utf8");
  const b = Buffer.from(String(expected ?? ""), "utf8");

  if (a.length !== b.length) return false;

  return crypto.timingSafeEqual(a, b);
}

/**
 * Creates an account with the role the caller decided on. `role` is never read
 * from the request body: each registration route hard-codes its own.
 */
export async function createAccount({ name, email, password, role }) {
  const existing = await User.findOne({ where: { email } });

  if (existing) {
    return { error: "An account with that email already exists.", status: 409 };
  }

  const user = await User.create({
    name,
    email,
    password: await bcrypt.hash(password, 10),
    role,
  });

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      role: user.role,
    },
  };
}
