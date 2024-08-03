const { eq, and, count, or } = require("drizzle-orm");
const { db, tables } = require("../db.js");
const { createUid } = require("./general.js");

/**
 * Finds a team chat by uid
 * @param {string} chatUid
 * @returns {Promise<import("../schema.js").TeamChat | undefined>}
 */
async function findTeamChat(chatUid) {
  const [chat] = await db
    .select()
    .from(tables.teamsChats)
    .where(eq(tables.teamsChats.uid, chatUid))
    .limit(1);
  return chat;
}

/**
 * Finds all chats for a team
 * @param {import("../schema.js").Team} team
 * @returns {Promise<import("../schema.js").TeamChat[]>}
 */
async function findTeamChats(team) {
  const chats = await db
    .select({
      uid: tables.teamsChats.uid,
      sentAt: tables.teamsChats.sentAt,
      sender: tables.users.username,
      message: tables.teamsChats.message,
      isFile: tables.teamsChats.isFile,
      fileName: tables.files.name,
      fileUID: tables.files.uid,
      edited: tables.teamsChats.edited,
    })
    .from(tables.teamsChats)
    .innerJoin(tables.users, eq(tables.teamsChats.ownerId, tables.users.id))
    .leftJoin(tables.files, eq(tables.teamsChats.fileId, tables.files.id))
    .where(
      and(
        eq(tables.teamsChats.teamId, team.id),
        eq(tables.teamsChats.deleted, false)
      )
    );

  return chats;
}

/**
 * Creates a new chat
 * @param {import("../schema.js").User} user
 * @param {import("../schema.js").Team} team
 * @param {string} message
 * @param {number | null} fileId
 * @returns {Promise<void>}
 */
async function createTeamChat(user, team, message, fileId = null) {
  const uid = createUid();
  await db.insert(tables.teamsChats).values({
    uid: uid,
    teamId: team.id,
    ownerId: user.id,
    message: message,
    isFile: fileId ? true : false,
    fileId: typeof fileId === "number" ? fileId : null,
  });
}

/**
 * Edits a team chat
 * @param {import("../schema.js").TeamChat} chat
 * @param {string} message
 * @returns {Promise<void>}
 */
async function editTeamChat(chat, message) {
  await db
    .update(tables.teamsChats)
    .set({
      message: message,
      edited: true,
    })
    .where(eq(tables.teamsChats.id, chat.id));
}

/**
 * Soft deletes a team chat
 * @param {import("../schema.js").TeamChat} chat
 * @returns {Promise<void>}
 */
async function deleteTeamChat(chat) {
  await db
    .update(tables.teamsChats)
    .set({
      deleted: true,
    })
    .where(eq(tables.teamsChats.id, chat.id));
}

module.exports = {
  findTeamChat,
  findTeamChats,
  createTeamChat,
  editTeamChat,
  deleteTeamChat,
};
