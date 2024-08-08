const schema = require("./schema");
require("dotenv").config();

if (!process.env.POSTGRES_URL) {
  throw "POSTGRES_URL is not set in .env";
}

const { drizzle } = require("drizzle-orm/vercel-postgres");
const { sql } = require("@vercel/postgres");
// sql`update harmony_users set "profileUrl" = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAUAAAAFCAYAAACNbyblAAAAAXNSR0IArs4c6QAAAFZJREFUGFcVy6ENg1AABcD7ybddoYIBqG1SVmAAFmAFdmGNWhJURQW2kqQs8gj6ciVqGDE4dL4ok2TBdsMLT4o10aFu+FysSJNq1+OB9ur/yH3HD2/MnCAGGDJDkUDQAAAAAElFTkSuQmCC' where id = 2`
const db = drizzle(sql, { schema })

module.exports = {
  db: db,
  tables: schema,
};