import { pool } from "../../../lib/db";
import { requireUser, methodNotAllowed } from "@/utils/apiAuth";
import { generateInviteCode } from "@/utils/invites";

const LIST_QUERY = `
  SELECT id,
         code,
         note,
         max_uses,
         use_count,
         expires_at,
         revoked_at,
         created_at,
         last_used_at,
         (revoked_at IS NULL
          AND (expires_at IS NULL OR expires_at > now())
          AND (max_uses IS NULL OR use_count < max_uses)) AS active
    FROM public.invite_codes
   ORDER BY created_at DESC
`;

async function listInvites(res) {
  const client = await pool.connect();
  try {
    const { rows } = await client.query(LIST_QUERY);
    res.status(200).json(rows);
  } finally {
    client.release();
  }
}

async function createInvite(req, res, user) {
  const { note, maxUses, expiresInDays } = req.body || {};

  let max_uses = null;
  if (maxUses !== "" && maxUses != null && maxUses !== "unlimited") {
    const parsed = Number(maxUses);
    if (!Number.isInteger(parsed) || parsed < 1) {
      return res
        .status(400)
        .json({ message: "maxUses must be a positive whole number, or unlimited." });
    }
    max_uses = parsed;
  }

  let expires_at = null;
  if (expiresInDays !== "" && expiresInDays != null && expiresInDays !== "never") {
    const days = Number(expiresInDays);
    if (!Number.isFinite(days) || days < 1 || days > 365) {
      return res
        .status(400)
        .json({ message: "expiresInDays must be between 1 and 365, or never." });
    }
    expires_at = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();
  }

  const client = await pool.connect();

  try {
    let code = generateInviteCode();
    // Extremely unlikely collision; retry once rather than failing the request.
    for (let attempt = 0; attempt < 3; attempt += 1) {
      try {
        const { rows } = await client.query(
          `INSERT INTO public.invite_codes (code, note, max_uses, expires_at, created_by)
           VALUES ($1, $2, $3, $4, $5)
           RETURNING id, code, note, max_uses, use_count, expires_at, revoked_at, created_at, last_used_at`,
          [
            code,
            note ? String(note).trim().slice(0, 120) : null,
            max_uses,
            expires_at,
            user.id,
          ]
        );

        return res.status(201).json({ ...rows[0], active: true });
      } catch (error) {
        if (error.code === "23505") {
          code = generateInviteCode();
          continue;
        }
        throw error;
      }
    }

    return res.status(500).json({ message: "Could not generate a unique code." });
  } finally {
    client.release();
  }
}

export default async function handler(req, res) {
  const user = await requireUser(req, res, ["admin"]);
  if (!user) return;

  try {
    if (req.method === "GET") return await listInvites(res);
    if (req.method === "POST") return await createInvite(req, res, user);
    return methodNotAllowed(res, ["GET", "POST"]);
  } catch (error) {
    console.error("Invite request failed:", error);
    if (!res.headersSent) {
      res.status(500).json({ message: "An error occurred" });
    }
  }
}
