const { eq, and } = require("drizzle-orm");
const { db, tables } = require("../db.js");

/**
 * Get user data from database by email
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

async function emailAvailable(email) {
  const [emailCount] = await db
    .select({ count: count() })
    .from(tables.users)
    .where(and(eq(tables.users.email, email), eq(tables.users.deleted, 0)))
    .limit(1);

  if (emailCount.count > 0) {
    return false;
  }
  return true;
}

/**
 * Get user data from database by id
 * @param {number} id
 * @returns {Promise<import("../schema.js").User | undefined>}
 */
async function findUserById(id) {
  const [user] = await db
    .select()
    .from(tables.users)
    .where(and(eq(tables.users.id, id), eq(tables.users.deleted, 0)))
    .limit(1);
  return user;
}

/**
 * Get user data from database by username
 * @param {string} username
 * @returns {Promise<import("../schema.js").User | undefined>}
 */
async function findUserByUsername(username) {
  const [user] = await db
    .select()
    .from(tables.users)
    .where(
      and(eq(tables.users.username, username), eq(tables.users.deleted, 0))
    )
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

async function setDeleteUser(userID) {
  await db
    .update(tables.users)
    .set({ deleted: true })
    .where(
      and(
        eq(tables.users.email, req.user.email),
        eq(tables.users.deleted, false)
      )
    );
  return;
}

async function updateUserEmail(username, email, userId) {
  await db
    .update(tables.users)
    .set({ username: username, email: email })
    .where(eq(tables.users.id, userId));
  return;
}

async function updateProfilePic(userId, newPFP) {
  await db
    .update(tables.users)
    .set(tables.users.profileURL, newPFP)
    .where(eq(tables.users.id, userId));
  return;
}

module.exports = {
  emailAvailable,
  findUser,
  findUserById,
  findUserByUsername,
  createUser,
  setDeleteUser,
  updateUserEmail,
  updateProfilePic,
};
