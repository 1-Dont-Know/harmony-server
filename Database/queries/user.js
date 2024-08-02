const { eq, and } = require("drizzle-orm");
const { db, tables } = require("../db.js");

/**
 * Get user data from database
 * @param {string} email
 * @returns {Promise<import("../schema.js").User | undefined>}
 */
async function findUser(email) {
  const [user] = await db
    .select()
    .from(tables.users)
    .where(and(eq(tables.users.email, email), eq(tables.users.deleted, 0)))
    .limit(1);
  return user;
}

/**
 * Create a new user
 * @param {{email: string, username: string, hashedPassword: string, userCallLink: string}} user
 * @returns {Promise<void>}
 */
async function createUser({ email, username, hashedPassword, userCallLink }) {
  await db.insert(tables.users).values({
    email: email,
    username: username,
    password: hashedPassword,
    userCallLink: userCallLink,
  });
}

module.exports = {
  findUser,
  createUser,
};
