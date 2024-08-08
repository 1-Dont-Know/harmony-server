const { eq, and, count, or } = require("drizzle-orm");
const { db, tables } = require("../db.js");

/**
 * Finds a file by uid
 * @param {string} fileUid
 * @returns {Promise<import("../schema.js").File | undefined>}
 */
async function findFile(fileUid) {
  const [file] = await db
    .select()
    .from(tables.files)
    .where(and(eq(tables.files.uid, fileUid), eq(tables.files.deleted, 0)))
    .limit(1);

  return file;
}

/**
 * Inserts a new file into the database
 * @param {import("../schema.js").User} ownerUser
 * @param {string} fileUid
 * @param {string} fileName
 * @returns {Promise<void>}
 */
async function createNewFile(ownerUser, fileUid, fileName) {
  await db.insert(tables.files).values({
    uid: fileUid,
    name: fileName,
    ownerId: ownerUser.id,
  });
}

module.exports = {
  findFile,
  createNewFile,
};
