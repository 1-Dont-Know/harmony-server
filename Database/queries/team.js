const { eq, and } = require("drizzle-orm");
const { db, tables } = require("../db.js");
const { createUid } = require("./general.js");

/**
 * Finds a team by uid and name
 * @param {string} teamUid
 * @param {string} teamName
 * @returns {Promise<import("../schema.js").Team | undefined>}
 */
async function findTeam(teamUid, teamName) {
  const [team] = await db
    .select()
    .from(tables.teams)
    .where(and(eq(tables.teams.uid, teamUid), eq(tables.teams.name, teamName)))
    .limit(1);

  return team;
}
/**
 * Create a new team adding it to the database
 * @param {import("../schema.js").User} user
 * @param {string} teamName
 * @returns {Promise<void>}
 */
async function createTeam(user, teamName) {
  console.log({ user });
  const uid = createUid();
  const formattedName = teamName.toLowerCase().replaceAll(" ", "-");

  await db.insert(tables.teams).values({
    uid: uid,
    ownerId: user.id,
    teamCallLink: `${formattedName}/${uid}`,
    name: teamName,
  });
}

async function forceUserIntoTeam(user, team) {
  await db.insert(tables.teamsLinks).values({
    teamID: team.id,
    addUser: user.id,
  });
}

/**
 * Finds all teams the user is a member of
 * @param {import("../schema.js").User} user
 * @returns {Promise<(import("../schema.js").Team & {owned: boolean})[]>}
 */
async function findJoinedTeams(user) {
  const ownedTeams = await db
    .select({
      name: tables.teams.name,
      uid: tables.teams.uid,
      teamCallLink: tables.teams.teamCallLink,
    })
    .from(tables.teams)
    .where(and(eq(tables.teams.ownerId, user.id), eq(tables.teams.deleted, 0)));

  const joinedTeams = await db
    .select({
      name: tables.teams.name,
      uid: tables.teams.uid,
      teamCallLink: tables.teams.teamCallLink,
    })
    .from(tables.teamsLinks)
    .leftJoin(tables.teams, eq(tables.teamsLinks.teamId, tables.teams.id))
    .where(
      and(
        eq(tables.teamsLinks.addUser, user.id),
        eq(tables.teamsLinks.deleted, 0)
      )
    );

  ownedTeams.forEach((element) => {
    element.owned = true;
  });

  joinedTeams.forEach((element) => {
    element.owned = false;
  });

  return {
    owned: ownedTeams,
    joined: joinedTeams,
  };
}

/**
 * Soft delete a user from a team
 * @param {import("../schema.js").User} targetUser
 * @param {import("../schema.js").Team} team
 * @returns {Promise<void>}
 */
async function removeUserFromTeam(targetUser, team) {
  await db
    .update(tables.teamsLinks)
    .set({
      deleted: true,
    })
    .where(
      and(
        eq(tables.teamsLinks.addUser, targetUser.id),
        eq(tables.teamsLinks.teamId, team.id),
        eq(tables.teamsLinks.deleted, 0)
      )
    );
}

/**
 * Change team name
 * @param {import("../schema.js").Team} team
 * @param {string} newName
 * @returns {Promise<void>}
 */
async function changeTeamName(team, newName) {
  await db
    .update(tables.teams)
    .set({ name: newName })
    .where(and(eq(tables.teams.id, team.id), eq(tables.teams.deleted, 0)));
}

/**
 * Soft delete a team
 * @param {import("../schema.js").Team} team
 * @returns {Promise<void>}
 */
async function deleteTeam(team) {
  await db
    .update(tables.teams)
    .set({
      deleted: true,
    })
    .where(and(eq(tables.teams.id, team.id), eq(tables.teams.deleted, 0)));
}

/**
 * Soft delete all team links
 * @param {import("../schema.js").Team} team
 * @returns {Promise<void>}
 */
async function removeAllTeamLinks(team) {
  await db
    .update(tables.teamsLinks)
    .set({
      deleted: true,
    })
    .where(
      and(
        eq(tables.teamsLinks.teamId, team.id),
        eq(tables.teamsLinks.deleted, 0)
      )
    );
}

/**
 * Finds all users in a team
 * @param {import("../schema.js").Team} team
 * @returns {Promise<import("../schema.js").User[]>}
 */
async function findUsersInTeam(team) {
  const members = await db
    .select({ username: tables.users.username, email: tables.users.email })
    .from(tables.teamsLinks)
    .leftJoin(tables.users, eq(tables.teamsLinks.addUser, tables.users.id))
    .where(
      and(
        eq(tables.teamsLinks.teamId, team.id),
        eq(tables.teamsLinks.deleted, 0)
      )
    );

  const owners = await db
    .select({
      username: tables.users.username,
      email: tables.users.email,
    })
    .from(tables.teams)
    .leftJoin(tables.users, eq(tables.teams.ownerId, tables.users.id))
    .where(
      and(
        eq(tables.teams.id, team.id),
        eq(tables.teams.deleted, 0),
        eq(tables.users.deleted, 0)
      )
    );

  const membersMapped = members.map((entry) => {
    return { ...entry, owner: false };
  });

  const ownersMapped = owners.map((entry) => {
    return { ...entry, owner: true };
  });

  const allMembers = [...membersMapped, ...ownersMapped];

  return allMembers;
}

module.exports = {
  findTeam,
  createTeam,
  forceUserIntoTeam,
  findJoinedTeams,
  removeUserFromTeam,
  changeTeamName,
  deleteTeam,
  removeAllTeamLinks,
  findUsersInTeam,
};
