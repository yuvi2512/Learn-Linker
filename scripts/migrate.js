/**
 * Applies every .sql file in db/migrations once, in filename order.
 *
 *   npm run db:migrate
 *
 * Each file runs inside a transaction and is recorded in schema_migrations, so
 * re-running the command is a no-op.
 */
const fs = require("fs");
const path = require("path");
const { Client } = require("pg");
const { loadEnvConfig } = require("@next/env");

loadEnvConfig(process.cwd());

const MIGRATIONS_DIR = path.join(__dirname, "..", "db", "migrations");

/**
 * Local Postgres (and most Docker images) do not speak SSL. Managed hosts
 * usually require it. Honour sslmode in the URL when present; otherwise skip
 * SSL for loopback and enable it everywhere else in production.
 */
function sslConfig(databaseUrl) {
  const sslmode = (String(databaseUrl).match(/[?&]sslmode=([^&]+)/i) || [])[1];

  if (sslmode === "disable") return false;
  if (sslmode === "require" || sslmode === "verify-ca" || sslmode === "verify-full") {
    return {
      rejectUnauthorized: sslmode !== "require",
      ca: process.env.VERCEL_POSTGRES_CA_CERT,
    };
  }

  let host = "";
  try {
    host = new URL(databaseUrl.replace(/^postgres(ql)?:/i, "http:")).hostname;
  } catch {
    host = "";
  }

  const local = host === "localhost" || host === "127.0.0.1" || host === "::1";
  if (local || process.env.NODE_ENV !== "production") return false;

  return {
    rejectUnauthorized: false,
    ca: process.env.VERCEL_POSTGRES_CA_CERT,
  };
}

async function main() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.error(
      "DATABASE_URL is not set. Add it to .env.local (see .env.example) and try again."
    );
    process.exit(1);
  }

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((file) => file.endsWith(".sql"))
    .sort();

  if (files.length === 0) {
    console.log("No migrations found.");
    return;
  }

  const client = new Client({
    connectionString: databaseUrl,
    ssl: sslConfig(databaseUrl),
  });

  await client.connect();

  try {
    await client.query(`
      CREATE TABLE IF NOT EXISTS public.schema_migrations (
        name       text PRIMARY KEY,
        applied_at timestamptz NOT NULL DEFAULT now()
      )
    `);

    const { rows } = await client.query(
      "SELECT name FROM public.schema_migrations"
    );
    const applied = new Set(rows.map((row) => row.name));

    let ran = 0;

    for (const file of files) {
      if (applied.has(file)) {
        console.log(`· ${file} (already applied)`);
        continue;
      }

      const sql = fs.readFileSync(path.join(MIGRATIONS_DIR, file), "utf8");

      await client.query("BEGIN");
      try {
        await client.query(sql);
        await client.query(
          "INSERT INTO public.schema_migrations (name) VALUES ($1)",
          [file]
        );
        await client.query("COMMIT");
        console.log(`✓ ${file}`);
        ran += 1;
      } catch (error) {
        await client.query("ROLLBACK");
        throw new Error(`${file} failed: ${error.message}`);
      }
    }

    console.log(
      ran === 0 ? "Database already up to date." : `Applied ${ran} migration(s).`
    );
  } finally {
    await client.end();
  }
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
