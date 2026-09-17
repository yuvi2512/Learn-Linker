/**
 * Shared env resolution for the app, NextAuth, and `npm run db:migrate`.
 *
 * Hosted values (Neon / Vercel) win when present. If they are missing the
 * process falls back to local Postgres and http://localhost:3000 so `next dev`
 * still works without copying production secrets.
 */

const LOCAL_DATABASE_URL =
  "postgres://user:password@localhost:5432/learnlinker";
const LOCAL_APP_URL = "http://localhost:3000";

function stripProtocol(host) {
  return String(host || "")
    .replace(/^https?:\/\//i, "")
    .replace(/\/$/, "");
}

function hostnameFromDatabaseUrl(databaseUrl) {
  try {
    return new URL(
      String(databaseUrl).replace(/^postgres(ql)?:/i, "http:")
    ).hostname;
  } catch {
    return "";
  }
}

function isLoopbackHost(host) {
  return host === "localhost" || host === "127.0.0.1" || host === "::1";
}

function resolveAppUrl() {
  if (process.env.NEXTAUTH_URL) {
    return process.env.NEXTAUTH_URL.replace(/\/$/, "");
  }

  // Vercel injects the deployment host without a protocol.
  const vercelHost =
    process.env.VERCEL_PROJECT_PRODUCTION_URL || process.env.VERCEL_URL;
  if (vercelHost) {
    return `https://${stripProtocol(vercelHost)}`;
  }

  return LOCAL_APP_URL;
}

function ensureAppUrl() {
  const url = resolveAppUrl();
  if (!process.env.NEXTAUTH_URL) {
    process.env.NEXTAUTH_URL = url;
  }
  return url;
}

function resolveDatabaseUrl() {
  return (
    process.env.DATABASE_URL ||
    process.env.DATABASE_URL_LOCAL ||
    LOCAL_DATABASE_URL
  );
}

function resolveMigrationDatabaseUrl() {
  // Neon: use the direct (unpooled) URL for DDL when available.
  return (
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.DATABASE_URL ||
    process.env.DATABASE_URL_LOCAL ||
    LOCAL_DATABASE_URL
  );
}

function isUsingLocalDatabaseFallback() {
  return !process.env.DATABASE_URL && !process.env.DATABASE_URL_UNPOOLED;
}

function sslConfig(databaseUrl) {
  const sslmode = (String(databaseUrl).match(/[?&]sslmode=([^&]+)/i) || [])[1];

  if (sslmode === "disable") return false;
  if (
    sslmode === "require" ||
    sslmode === "verify-ca" ||
    sslmode === "verify-full"
  ) {
    return {
      rejectUnauthorized: sslmode !== "require",
      ca: process.env.VERCEL_POSTGRES_CA_CERT || undefined,
    };
  }

  const host = hostnameFromDatabaseUrl(databaseUrl);
  if (isLoopbackHost(host)) return false;

  // Neon (and most hosted Postgres) require TLS even during `next dev`.
  if (/\.neon\.tech$/i.test(host) || process.env.NODE_ENV === "production") {
    return {
      rejectUnauthorized: false,
      ca: process.env.VERCEL_POSTGRES_CA_CERT || undefined,
    };
  }

  return false;
}

function databaseHostLabel(databaseUrl) {
  const host = hostnameFromDatabaseUrl(databaseUrl);
  if (!host) return "(unknown host)";
  try {
    const parsed = new URL(
      String(databaseUrl).replace(/^postgres(ql)?:/i, "http:")
    );
    const dbName = parsed.pathname.replace(/^\//, "") || "postgres";
    return `${host}/${dbName}`;
  } catch {
    return host;
  }
}

module.exports = {
  LOCAL_APP_URL,
  LOCAL_DATABASE_URL,
  resolveAppUrl,
  ensureAppUrl,
  resolveDatabaseUrl,
  resolveMigrationDatabaseUrl,
  isUsingLocalDatabaseFallback,
  sslConfig,
  databaseHostLabel,
};
