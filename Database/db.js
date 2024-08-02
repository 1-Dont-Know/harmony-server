const schema = require("./schema");
require("dotenv").config();


if (process.env.VERCEL_ENV === "production") {
  const { drizzle } = require("drizzle-orm/vercel-postgres");
  const { sql } = require("@vercel/postgres");
  module.exports.db = drizzle(sql, { schema });
  // module.exports.core = require("drizzle-orm/pg-core");
  console.log("Using vercel postgres database");
} else {
  const { drizzle } = require("drizzle-orm/mysql2");
  const mysql = require("mysql2/promise");
  const pool = mysql.createPool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  });
  module.exports.db = drizzle(pool, { schema, mode: "default" });
  // module.exports.core = require("drizzle-orm/mysql-core");
  console.log("Using local mysql database");
}


module.exports.tables = schema;
