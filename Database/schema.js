const {
  serial,
  varchar,
  tinyint,
  int,
  varbinary,
  timestamp,
  mysqlTableCreator,
  mysqlTable,
} = require("drizzle-orm/mysql-core");

const table =
  process.env.VERCEL_ENV === "production"
    ? mysqlTableCreator((name) => `harmony_${name}`)
    : mysqlTable;

// const mysqlTable = mysqlTableCreator((name) => `harmony_${name}`);

const users = table("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }),
  username: varchar("username", { length: 255 }),
  password: varchar("password", { length: 255 }),
  userCallLink: varchar("userCallLink", { length: 1020 }),
  profileURL: varchar("profileURL", { length: 765 }),
  deleted: tinyint("deleted"),
});

const files = table("files", {
  id: serial("id").primaryKey(),
  uid: varchar("uid", { length: 255 }),
  name: varchar("name", { length: 255 }),
  ownerID: int("ownerID"),
  data: varbinary("data", { length: 1024 }),
  deleted: tinyint("deleted"),
});

const requests = table("requests", {
  id: serial("id").primaryKey(),
  uid: varchar("uid", { length: 255 }),
  timeCreated: timestamp("timeCreated").defaultNow(),
  senderID: int("senderID"),
  receiverID: int("receiverID"),
  data: varchar("data", { length: 765 }),
  operation: varchar("operation", { length: 255 }),
  status: varchar("status", { length: 255 }),
  deleted: tinyint("deleted"),
  timeResolved: timestamp("timeResolved"),
});

const teams = table("teams", {
  id: serial("id").primaryKey(),
  uid: varchar("uid", { length: 255 }),
  name: varchar("name", { length: 255 }),
  ownerID: int("ownerID"),
  name: varchar("name", { length: 255 }),
  teamCallLink: varchar("teamCallLink", { length: 1020 }),
  deleted: tinyint("deleted"),
});

const teamsChats = table("teamschats", {
  id: serial("id").primaryKey(),
  uid: varchar("uid", { length: 255 }),
  ownerID: int("ownerID"),
  name: varchar("name", { length: 255 }),
  teamCallLink: varchar("teamCallLink", { length: 1020 }),
  deleted: tinyint("deleted"),
});

const teamsLinks = table("teamslinks", {
  id: serial("id").primaryKey(),
  teamID: int("teamID"),
  addUser: int("addUser"),
  deleted: tinyint("deleted"),
});

const usersChats = table("userschats", {
  id: serial("id").primaryKey(),
  userSender: int("userSender"),
  userReceiver: int("userReceiver"),
  sentAt: timestamp("sentAt").defaultNow(),
  message: varchar("message", { length: 1020 }),
  isFile: tinyint("isFile"),
  fileID: int("fileID"),
  deleted: tinyint("deleted"),
});

const usersLinks = table("userslinks", {
  id: serial("id").primaryKey(),
  userID1: int("userID1"),
  userID2: int("userID2"),
  blocked: tinyint("blocked"),
  deleted: tinyint("deleted"),
});

/**
 * @typedef {typeof users.$inferSelect} User
 * @typedef {typeof files.$inferSelect} File
 * @typedef {typeof requests.$inferSelect} Request
 * @typedef {typeof teams.$inferSelect} Team
 * @typedef {typeof teamsChats.$inferSelect} TeamChat
 * @typedef {typeof teamsLinks.$inferSelect} TeamLink
 * @typedef {typeof usersChats.$inferSelect} UserChat
 * @typedef {typeof usersLinks.$inferSelect} UserLink
 */

module.exports = {
  users,
  files,
  requests,
  teams,
  teamsChats,
  teamsLinks,
  usersChats,
  usersLinks,
};
