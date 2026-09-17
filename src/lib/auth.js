import CredentialsProvider from "next-auth/providers/credentials";
import User from "@/models/user";
import bcrypt from "bcryptjs";
import runtimeConfig from "../../lib/runtimeConfig";

const appUrl = runtimeConfig.ensureAppUrl();

/**
 * JWT signing key. Must be the same string in every webpack chunk.
 * Importing authOptions from [...nextauth].js used to create two copies of
 * this module; with NEXTAUTH_SECRET unset each copy invented its own secret,
 * so login succeeded but every other API returned 401.
 */
function authSecret() {
  if (process.env.NEXTAUTH_SECRET) return process.env.NEXTAUTH_SECRET;

  if (process.env.NODE_ENV === "production") {
    console.error(
      "NEXTAUTH_SECRET is not set. Sessions will be signed with a built-in fallback — set NEXTAUTH_SECRET before deploying."
    );
  }

  // Stable across webpack chunks. A missing/random secret is what made login
  // succeed while every other API returned 401.
  return "learn-linker-dev-secret-do-not-use-in-production";
}

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error("Email and password are required");
        }

        const email = credentials.email.trim().toLowerCase();
        const user = await User.findOne({ where: { email } });

        if (!user) {
          throw new Error("No account found with that email");
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.password
        );
        if (!isPasswordValid) {
          throw new Error("Incorrect password");
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        };
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user = {
        id: token.id,
        email: token.email,
        name: token.name,
        role: token.role,
      };
      return session;
    },
  },
  secret: authSecret(),
  // HTTP localhost must not get Secure cookies or the browser will drop them.
  useSecureCookies: appUrl.startsWith("https://"),
};
