const schema = require("./schema");
require("dotenv").config();

if (!process.env.POSTGRES_URL) {
  throw "POSTGRES_URL is not set in .env";
}

const { drizzle } = require("drizzle-orm/vercel-postgres");
const { sql } = require("@vercel/postgres");
const db = drizzle(sql, { schema })

module.exports = {
  db: db,
  tables: schema,
};