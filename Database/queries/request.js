const { eq, and, count, or } = require("drizzle-orm");
const { db, tables } = require("../db.js");
const { createUid } = require("./general.js");

/**
 * Checks if the user can send a team request to the team
 *
 * Returns `false` if the user is already in the team
 * or if the user has a pending request
 * otherwise `true`
 *
 * @param {import("../schema.js").User} user
 * @param {import("../schema.js").Team} team
 * @returns {Promise<{message: string, result: boolean}>}
 */
async function canSendTeamRequest(user, team) {
  const memberCount = await db
    .select({ count: count() })
    .from(tables.teamsLinks)
    .where(
      and(
        eq(tables.teamsLinks.teamId, team.id),
        eq(tables.teamsLinks.addUser, user.id),
        eq(tables.teamsLinks.deleted, 0)
      )
    );

  if (memberCount.count > 0) {
    return {
      message: "User is already in the team",
      result: false,
    };
  }

  const ownerCount = await db
    .select({ count: count() })
    .from(tables.teams)
    .where(
      and(
        eq(tables.teams.id, team.id),
        eq(tables.teams.ownerId, user.id),
        eq(tables.teams.deleted, 0)
      )
    );

  if (ownerCount.count > 0) {
    return {
      message: "User is already in the team",
      result: false,
    };
  }

  const invites = await db
    .select({ data: tables.requests.data })
    .from(tables.requests)
    .where(
      and(
        eq(tables.requests.receiverId, user.id),
        eq(tables.requests.operation, "addToTeam"),
        eq(tables.requests.deleted, 0)
      )
    );

  const hasInvite = invites.some(({ data }) => {
    const parsed = JSON.parse(data);
    if (parsed.teamUID === team.uid && parsed.teamName === team.name) {
      return true;
    }
  });

  if (hasInvite) {
    return {
      message: "User already invited to team",
      result: false,
    };
  }

  return {
    message: "User is not in the team",
    result: true,
  };
}

/**
 * Checks if the user can send a friend request to the target
 *
 * Returns `false` the users are already friends
 * or if the user has a pending friend request
 * otherwise `true`
 *
 * @param {import("../schema.js").User} user
 * @param {import("../schema.js").Team} target
 * @returns {Promise<{message: string, result: boolean}>}
 */
async function canSendFriendRequest(user, target) {
  const friendsCount = await db
    .select({ count: count() })
    .from(tables.usersLinks)
    .where(
      and(
        or(
          and(
            eq(tables.usersLinks.userId1, user.id),
            eq(tables.usersLinks.userId2, target.id)
          ),
          and(
            eq(tables.usersLinks.userId1, target.id),
            eq(tables.usersLinks.userId2, user.id)
          )
        ),
        eq(tables.usersLinks.deleted, 0)
      )
    );

  if (friendsCount.count > 0) {
    return {
      message: "Already friends with this user",
      result: false,
    };
  }

  const pendingFriendRequestCount = await db
    .select({ count: count() })
    .from(tables.requests)
    .where(
      and(
        or(
          and(
            eq(tables.requests.senderId, user.id),
            eq(tables.requests.receiverId, target.id)
          ),
          and(
            eq(tables.requests.senderId, target.id),
            eq(tables.requests.receiverId, user.id)
          )
        ),
        eq(tables.requests.operation, "addFriend"),
        eq(tables.requests.deleted, 0)
      )
    );

  if (pendingFriendRequestCount.count > 0) {
    return {
      message: "Friend request is already pending",
      result: false,
    };
  }

  return {
    message: "Users are not friends",
    result: true,
  };
}

/**
 * Finds a team request
 * @param {import("../schema.js").User} user
 * @returns {Promise<import("../schema.js").Request[]>}
 */
async function findIncomingTeamRequests(user) {
  const requests = await db
    .select({
      uid: tables.requests.uid,
      timeCreated: tables.requests.timeCreated,
      username: tables.users.username,
      email: tables.users.email,
      team: tables.requests.data,
    })
    .from(tables.requests)
    .leftJoin(tables.users, eq(tables.requests.senderId, tables.users.id))
    .where(
      and(
        eq(tables.requests.receiverId, user.id),
        eq(tables.requests.operation, "addToTeam"),
        eq(tables.requests.status, "pending"),
        eq(tables.requests.deleted, 0)
      )
    );

  return requests;
}

/**
 *
 * @param {import("../schema.js").User} user
 * @param {import("../schema.js").User} target
 * @param {string} data
 * `
 * {
 *   teamName: string,
 *   teamUID: string,
 * }
 * `
 * @returns {Promise<void>}
 */
async function createTeamRequest(user, target, data) {
  const uid = createUid();
  await db.insert(tables.requests).values({
    uid: uid,
    senderId: user.id,
    receiverId: target.id,
    data: data,
    operation: "addToTeam",
    status: "pending",
  });
}

module.exports = {
  canSendTeamRequest,
  canSendFriendRequest,
  findIncomingTeamRequests,
  createTeamRequest,
};
