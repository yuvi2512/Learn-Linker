import { pool } from "../../../../lib/db";
import { requireUser, methodNotAllowed } from "@/utils/apiAuth";
import { isUuid } from "@/utils/batches";

export default async function handler(req, res) {
  const user = await requireUser(req, res, ["admin"]);
  if (!user) return;

  if (req.method !== "DELETE") return methodNotAllowed(res, ["DELETE"]);

  const { id } = req.query;
  if (!isUuid(id)) {
    return res.status(400).json({ message: "That invite id is not valid." });
  }

  try {
    const client = await pool.connect();
    try {
      const { rowCount } = await client.query(
        `UPDATE public.invite_codes
            SET revoked_at = now()
          WHERE id = $1 AND revoked_at IS NULL`,
        [id]
      );

      if (rowCount === 0) {
        return res
          .status(404)
          .json({ message: "That invite is already revoked or does not exist." });
      }

      return res.status(200).json({ message: "Invite revoked." });
    } finally {
      client.release();
    }
  } catch (error) {
    console.error("Invite revoke failed:", error);
    return res.status(500).json({ message: "An error occurred" });
  }
}
