const { eq, and, count, or } = require("drizzle-orm");
const { db, tables } = require("../db.js");

function createUid() {
  return Array.from(Array(254), () =>
    Math.floor(Math.random() * 36).toString(36)
  ).join("");
}

module.exports = {
  createUid,
};