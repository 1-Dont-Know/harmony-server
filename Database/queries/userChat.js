const { eq, and, count, or, asc, desc } = require("drizzle-orm");
const { db, tables } = require("../db.js");

/**
 * Find all chats between two users
 * @param {import("../schema.js").User} user1
 * @param {import("../schema.js").User} user2
 * @param {{sortOrder?: "asc" | "desc", limit?: number}} options
 * @returns {Promise<import("../schema.js").UserChat[]>}
 */
async function findUserChats(user1, user2, options = {}) {
  let query = db
    .select()
    .from(tables.usersChats)
    .where(
      and(
        or(
          and(
            eq(tables.usersChats.userSender, user1.id),
            eq(tables.usersChats.userReceiver, user2.id)
          ),
          and(
            eq(tables.usersChats.userSender, user2.id),
            eq(tables.usersChats.userReceiver, user1.id)
          )
        ),
        eq(tables.usersChats.deleted, 0)
      )
    );

  if (options.sortOrder.toLowerCase() === "desc") {
    query = query.orderBy(desc(tables.usersChats.sentAt));
  } else if (options.sortOrder.toLowerCase() === "asc") {
    query = query.orderBy(asc(tables.usersChats.sentAt));
  }

  if (options.limit && !isNaN(options.limit)) {
    query = query.limit(options.limit);
  }

  const userChats = await query;

  return userChats;
}

/**
 * Create a new user chat between two users
 * @param {import("../schema.js").User} user
 * @param {import("../schema.js").User} target
 * @param {string} message
 * @returns {Promise<void>}
 */
async function createUserChat(user, target, message) {
  await db.insert(tables.usersChats).values({
    userSender: user.id,
    userReceiver: target.id,
    message: message,
    isFile: false,
  });
}

/**
 * Edit a user chat between two users
 * @param {import("../schema.js").User} user
 * @param {number} messageId
 * @param {string} message
 * @returns {Promise<void>}
 */
async function editUserChat(user, messageId, message) {
  await db.update(tables.usersChats).set({message: message}).where(
    and(
      eq(tables.usersChats.id, messageId),
      eq(tables.usersChats.userSender, user.id),
      eq(tables.usersChats.deleted, false)
    )
  );
}

/**
 * Soft delete a user chat between two users
 * @param {import("../schema.js").User} user
 * @param {number} messageId
 * @returns {Promise<void>}
 */
async function deleteUserChat(user, messageId) {
  await db.update(tables.usersChats).set({deleted: true}).where(
    and(
      eq(tables.usersChats.id, messageId),
      eq(tables.usersChats.userSender, user.id),
      eq(tables.usersChats.deleted, false)
    )
  );
}

module.exports = {
  findUserChats,
  createUserChat,
  editUserChat,
  deleteUserChat,
};
