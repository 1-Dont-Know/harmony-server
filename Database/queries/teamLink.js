const { eq, and, count, or } = require("drizzle-orm");
const { db, tables } = require("../db.js");

async function setDeleteTeamLink(userId){
    await db.update(tables.teamsLinks)
        .set({deleted: true})
        .where(
        and(
            eq(tables.teamsLinks.addUser, userId),
            eq(tables.teamsLinks.deleted, false)
            )
        );

    return
}

module.exports = {
    setDeleteTeamLink
}