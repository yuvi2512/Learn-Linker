import { pool } from "../../../../lib/db";
import { methodNotAllowed } from "@/utils/apiAuth";
import {
  createAccount,
  matchesInviteCode,
  parseCredentials,
} from "@/utils/registration";
import {
  adminExists,
  consumeInviteCode,
  hasActiveInvite,
} from "@/utils/invites";

function bootstrapCode() {
  return process.env.TEACHER_INVITE_CODE || "";
}

async function teacherSignupOpen() {
  if (bootstrapCode()) return true;

  const client = await pool.connect();
  try {
    return await hasActiveInvite(client);
  } finally {
    client.release();
  }
}

/**
 * Teacher sign-up. The role is hard-coded here. A valid code is required:
 * either an invite the admin created in the workspace, or the one-time
 * TEACHER_INVITE_CODE bootstrap in the environment. The first bootstrap
 * signup becomes admin so they can send further invites from the app.
 */
export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      const enabled = await teacherSignupOpen();
      return res.status(200).json({ enabled });
    } catch (error) {
      console.error("Could not check teacher sign-up:", error);
      return res.status(200).json({ enabled: Boolean(bootstrapCode()) });
    }
  }

  if (req.method !== "POST") return methodNotAllowed(res, ["GET", "POST"]);

  const credentials = parseCredentials(req.body);
  if (credentials.error) {
    return res.status(400).json({ message: credentials.error });
  }

  const provided = String(req.body?.inviteCode ?? "").trim();
  const expectedBootstrap = bootstrapCode();

  const client = await pool.connect();

  try {
    await client.query("BEGIN");

    const usedInvite = await consumeInviteCode(client, provided);

    let role = "teacher";
    let accepted = Boolean(usedInvite);

    if (!accepted && expectedBootstrap && matchesInviteCode(provided, expectedBootstrap)) {
      accepted = true;
      // First person through the bootstrap code runs the institute.
      if (!(await adminExists(client))) role = "admin";
    }

    if (!accepted) {
      await client.query("ROLLBACK");
      const open = expectedBootstrap || (await hasActiveInvite(client));
      return res.status(403).json({
        message: open
          ? "That teacher invite code is not valid."
          : "Teacher sign-up is disabled. Ask your administrator for an invite.",
      });
    }

    const result = await createAccount({ ...credentials, role });

    if (result.error) {
      await client.query("ROLLBACK");
      return res.status(result.status || 400).json({ message: result.error });
    }

    await client.query("COMMIT");

    const message =
      role === "admin"
        ? "Admin account created. You can send teacher invites from the workspace."
        : "Teacher account created.";

    return res.status(201).json({ message, user: result.user });
  } catch (error) {
    await client.query("ROLLBACK").catch(() => {});
    console.error("Error registering teacher:", error);
    return res.status(500).json({ message: "Something went wrong." });
  } finally {
    client.release();
  }
}
