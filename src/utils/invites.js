import crypto from "crypto";

const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function normalizeInviteCode(value) {
  return String(value ?? "")
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9-]/g, "");
}

/** Readable token, e.g. LL-7K3P-9M2Q. Unambiguous alphabet, 40 bits of entropy. */
export function generateInviteCode() {
  const bytes = crypto.randomBytes(8);
  let raw = "";
  for (const byte of bytes) raw += ALPHABET[byte % ALPHABET.length];
  return `LL-${raw.slice(0, 4)}-${raw.slice(4, 8)}`;
}

export function inviteSignupUrl(origin, code) {
  const base = String(origin || "").replace(/\/$/, "");
  return `${base}/register/teacher?code=${encodeURIComponent(code)}`;
}

const ACTIVE_PREDICATE = `
  revoked_at IS NULL
  AND (expires_at IS NULL OR expires_at > now())
  AND (max_uses IS NULL OR use_count < max_uses)
`;

export async function hasActiveInvite(client) {
  const { rows } = await client.query(
    `SELECT EXISTS (SELECT 1 FROM public.invite_codes WHERE ${ACTIVE_PREDICATE}) AS ok`
  );
  return Boolean(rows[0]?.ok);
}

/**
 * Spends one use of a matching active code. Returns the row on success, or
 * null if the code is missing, expired, revoked, or already used up.
 */
export async function consumeInviteCode(client, rawCode) {
  const code = normalizeInviteCode(rawCode);
  if (!code) return null;

  const { rows } = await client.query(
    `UPDATE public.invite_codes
        SET use_count = use_count + 1,
            last_used_at = now()
      WHERE id = (
        SELECT id
          FROM public.invite_codes
         WHERE code = $1
           AND ${ACTIVE_PREDICATE}
         FOR UPDATE
         LIMIT 1
      )
      RETURNING id, code, note, max_uses, use_count`,
    [code]
  );

  return rows[0] || null;
}

export async function adminExists(client) {
  const { rowCount } = await client.query(
    `SELECT 1 FROM public.users WHERE role = 'admin' LIMIT 1`
  );
  return rowCount > 0;
}
