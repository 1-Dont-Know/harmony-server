const { eq, and, count, or } = require("drizzle-orm");
const { db, tables } = require("../db.js");
const { createUid } = require("./general.js");
const { findTeam } = require("./team.js");

/**
 * Checks if the user can send a team request to the team
 *
 * Returns `false` if the user is already in the team
 * or if the user has a pending request
 * otherwise `true`
 *
 * @param {import("../schema.js").User} target
 * @param {import("../schema.js").Team} team
 * @returns {Promise<{message: string, result: boolean}>}
 */
async function canSendTeamRequest(target, team) {
  const [memberCount] = await db
    .select({ count: count() })
    .from(tables.teamsLinks)
    .where(
      and(
        eq(tables.teamsLinks.teamId, team.id),
        eq(tables.teamsLinks.addUser, target.id),
        eq(tables.teamsLinks.deleted, 0)
      )
    );

  if (memberCount.count > 0) {
    return {
      message: "User is already in the team",
      result: false,
    };
  }

  const [ownerCount] = await db
    .select({ count: count() })
    .from(tables.teams)
    .where(
      and(
        eq(tables.teams.id, team.id),
        eq(tables.teams.ownerId, target.id),
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
        eq(tables.requests.receiverId, target.id),
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
  const [friendsCount] = await db
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

  const [pendingFriendRequestCount] = await db
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
 * Finds a request
 * @param {string} requestUid
 * @returns {Promise<import("../schema.js").Request | undefined>}
 */
async function findRequest(requestUid) {
  const [request] = await db
    .select()
    .from(tables.requests)
    .where(
      and(eq(tables.requests.uid, requestUid), eq(tables.requests.deleted, 0))
    )
    .limit(1);

  return request;
}

/**
 * Finds a user's incoming team requests
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
 * Finds a user's incoming friend requests
 * @param {import("../schema.js").User} user
 * @returns {Promise<import("../schema.js").Request[]>}
 */
async function findIncomingFriendRequests(user) {
  const requests = await db.select({
    uid: tables.requests.uid,
    timeCreated: tables.requests.timeCreated,
    username: tables.users.username,
    email: tables.users.email,
    profileUrl: tables.users.profileUrl,
  }).from(tables.requests)
  .leftJoin(tables.users, eq(tables.requests.senderId, tables.users.id))
  .where(
    and(
      eq(tables.requests.receiverId, user.id),
      eq(tables.requests.operation, "addFriend"),
      eq(tables.requests.status, "pending"),
      eq(tables.requests.deleted, 0)
    )
  )

  return requests;
}

/**
 * Creates a team request
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

/**
 * Creates a friend request
 * @param {import("../schema.js").User} user
 * @param {import("../schema.js").User} target
 * @returns {Promise<void>}
 */
async function createFriendRequest(user, target) {
  const uid = createUid();

  await db.insert(tables.requests).values({
    uid: uid,
    senderId: user.id,
    receiverId: target.id,
    operation: "addFriend",
    status: "pending",
  });
}

/**
 * Accepts a team request
 * @param {import("../schema.js").Request} request
 * @param {import("../schema.js").Team} team
 * @returns {Promise<void>}
 */
async function acceptTeamRequest(request, team) {
  await db.insert(tables.teamsLinks).values({
    teamId: team.id,
    addUser: request.receiverId,
  });

  await db.update(tables.requests).set({
    status: "accepted",
    timeResolved: new Date(),
    deleted: true,
  }).where(
    and(
      eq(tables.requests.id, request.id),
      eq(tables.requests.deleted, 0)
    )
  )
}

/**
 * Accepts a friend request
 * @param {import("../schema.js").Request} request
 * @param {import("../schema.js").User} sender
 * @param {import("../schema.js").User} receiver
 * @returns {Promise<void>}
 */
async function acceptFriendRequest(request, sender, receiver) {
  await db.insert(tables.usersLinks).values({
    userId1: sender.id,
    userId2: receiver.id,
  });

  await db.update(tables.requests).set({
    status: "accepted",
    timeResolved: new Date(),
    deleted: true,
  }).where(
    and(
      eq(tables.requests.id, request.id),
      eq(tables.requests.deleted, 0)
    )
  )
}

/**
 * Declines a pending request
 * @param {string} requestUid
 * @returns {Promise<void>}
 */
async function declineRequest(requestUid) {
  await db
    .update(tables.requests)
    .set({
      status: "declined",
      timeResolved: new Date(),
      deleted: true,
    })
    .where(eq(tables.requests.uid, requestUid), eq(tables.requests.deleted, 0));
}


module.exports = {
  canSendTeamRequest,
  canSendFriendRequest,
  findRequest,
  findIncomingTeamRequests,
  findIncomingFriendRequests,
  createTeamRequest,
  createFriendRequest,
  acceptTeamRequest,
  acceptFriendRequest,
  declineRequest,
};
