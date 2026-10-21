import "server-only";
import postgres from "postgres";

// Reuse one pool across hot reloads in development.
const globalForDb = globalThis as unknown as { sql?: postgres.Sql };

function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set. Copy .env.example to .env.local and fill it in.");
  const local = /localhost|127\.0\.0\.1|\/tmp/.test(url);
  return postgres(url, {
    ssl: local ? false : "require",
    max: local ? 5 : 3,
    // Neon's pooler (PgBouncer) does not support prepared statements.
    prepare: false,
    transform: postgres.camel,
  });
}

export const sql = globalForDb.sql ?? connect();
if (process.env.NODE_ENV !== "production") globalForDb.sql = sql;
