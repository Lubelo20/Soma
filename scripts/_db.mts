import postgres from "postgres";

export function connect() {
  const url = process.env.DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not set (see .env.example).");
  const local = /localhost|127\.0\.0\.1|\/tmp/.test(url);
  return postgres(url, { ssl: local ? false : "require", max: 1, onnotice: () => {} });
}
