// Usage: npm run password:set
// Sets (or resets) the one password all staff use for the dashboard, and signs everyone out.
// Prompts for the password so it never lands in shell history.
import bcrypt from "bcryptjs";
import { createInterface } from "node:readline/promises";
import { connect } from "./_db.mts";

const rl = createInterface({ input: process.stdin, output: process.stdout });
const password = process.env.STAFF_PASSWORD ?? (await rl.question("New staff password (min 10 characters): "));
rl.close();
if (password.length < 10) {
  console.error("Password must be at least 10 characters.");
  process.exit(1);
}

const sql = connect();
const hash = await bcrypt.hash(password, 12);
await sql`
  insert into settings (key, value) values ('dashboard_password_hash', ${hash})
  on conflict (key) do update set value = excluded.value`;
await sql`delete from sessions`;
console.log("Staff password updated. Everyone has been signed out.");
await sql.end();
