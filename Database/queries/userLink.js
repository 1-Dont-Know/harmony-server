const { eq, and, count, or } = require("drizzle-orm");
const { db, tables } = require("../db.js");

async function setDeleteUserLinks(userID){
    await db.update(tables.usersLinks)
        .set({deleted: true})
        .where(
        and(
            or(
            eq(tables.usersLinks.userId1, userID), 
            eq(tables.usersLinks.userId2, userID)
            ), 
            eq(tables.usersLinks.deleted, false)
            )
        );
    return
}

module.exports = {
    setDeleteUserLinks
}