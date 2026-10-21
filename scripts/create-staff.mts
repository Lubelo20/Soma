// Usage: npm run staff:create -- <email> "<Full name>"
// Prompts for the password so it never lands in shell history. Re-running for an existing email resets the password.
import bcrypt from "bcryptjs";
import { createInterface } from "node:readline/promises";
import { connect } from "./_db.mts";

const [email, name] = process.argv.slice(2);
if (!email || !name) {
  console.error('Usage: npm run staff:create -- <email> "<Full name>"');
  process.exit(1);
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
const password = process.env.STAFF_PASSWORD ?? (await rl.question("Password (min 10 characters): "));
rl.close();
if (password.length < 10) {
  console.error("Password must be at least 10 characters.");
  process.exit(1);
}

const sql = connect();
const hash = await bcrypt.hash(password, 12);
await sql`
  insert into staff (email, name, password_hash) values (${email.toLowerCase()}, ${name}, ${hash})
  on conflict (email) do update set name = excluded.name, password_hash = excluded.password_hash`;
console.log(`Staff account ready for ${email.toLowerCase()}.`);
await sql.end();
