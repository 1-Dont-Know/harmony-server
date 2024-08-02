const { eq, and, count, or } = require("drizzle-orm");
const { db, tables } = require("../db.js");

async function setDeleteTeamLink(userID){
    await db.update(tables.teamsLinks)
        .set({deleted: true})
        .where(
        and(
            eq(tables.teamsLinks.addUser, userID),
            eq(tables.teamsLinks.deleted, false)
            )
        );

    return
}

module.exports = {
    setDeleteTeamLink
}