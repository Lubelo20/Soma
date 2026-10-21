import { readFileSync } from "node:fs";
import { connect } from "./_db.mts";

const sql = connect();
await sql.unsafe(readFileSync(new URL("../db/schema.sql", import.meta.url), "utf8"));
console.log("Schema is up to date.");
await sql.end();
