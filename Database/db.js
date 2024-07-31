const { drizzle } = require("drizzle-orm/mysql2");
const mysql = require("mysql2/promise");
const schema = require("./schema");

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
});
const db = drizzle(pool, { schema, mode: "default" });

module.exports = {
  db,
  tables: schema,
};
