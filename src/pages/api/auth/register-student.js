import { methodNotAllowed } from "@/utils/apiAuth";
import { createAccount, parseCredentials } from "@/utils/registration";

/**
 * Student sign-up. The role is hard-coded, so this route can never mint a
 * teacher no matter what the request body contains.
 */
export default async function handler(req, res) {
  if (req.method !== "POST") return methodNotAllowed(res, ["POST"]);

  const credentials = parseCredentials(req.body);
  if (credentials.error) {
    return res.status(400).json({ message: credentials.error });
  }

  try {
    const result = await createAccount({ ...credentials, role: "student" });

    if (result.error) {
      return res.status(result.status || 400).json({ message: result.error });
    }

    return res
      .status(201)
      .json({ message: "Student account created.", user: result.user });
  } catch (error) {
    console.error("Error registering student:", error);
    return res.status(500).json({ message: "Something went wrong." });
  }
}
