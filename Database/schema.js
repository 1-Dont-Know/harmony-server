const {
  serial,
  varchar,
  boolean,
  integer,
  timestamp,
  pgTableCreator,
} = require("drizzle-orm/pg-core")

const table = pgTableCreator((name) => `harmony_${name}`)

const users = table("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }),
  username: varchar("username", { length: 255 }),
  password: varchar("password", { length: 255 }),
  userCallLink: varchar("userCallLink", { length: 1020 }),
  profileUrl: varchar("profileUrl", { length: 765 }).default(""),
  deleted: boolean("deleted").default(false),
});

const files = table("files", {
  id: serial("id").primaryKey(),
  uid: varchar("uid", { length: 255 }),
  name: varchar("name", { length: 255 }),
  ownerId: integer("ownerId"),
  deleted: boolean("deleted").default(false),
});

const requests = table("requests", {
  id: serial("id").primaryKey(),
  uid: varchar("uid", { length: 255 }),
  timeCreated: timestamp("timeCreated").defaultNow(),
  senderId: integer("senderId"),
  receiverId: integer("receiverId"),
  data: varchar("data", { length: 765 }),
  operation: varchar("operation", { length: 255 }),
  status: varchar("status", { length: 255 }),
  timeResolved: timestamp("timeResolved"),
  deleted: boolean("deleted").default(false),
});

const teams = table("teams", {
  id: serial("id").primaryKey(),
  uid: varchar("uid", { length: 255 }),
  name: varchar("name", { length: 255 }),
  ownerId: integer("ownerId"),
  teamCallLink: varchar("teamCallLink", { length: 1020 }),
  deleted: boolean("deleted").default(false),
});

const teamsChats = table("teamschats", {
  id: serial("id").primaryKey(),
  uid: varchar("uid", { length: 255 }),
  teamId: integer("teamId"),
  ownerId: integer("ownerId"),
  sentAt: timestamp("sentAt").defaultNow(),
  message: varchar("message", { length: 1020 }),
  isFile: boolean("isFile").default(false),
  fileId: integer("fileId"),
  edited: boolean("edited").default(false),
  deleted: boolean("deleted").default(false),
});

const teamsLinks = table("teamslinks", {
  id: serial("id").primaryKey(),
  teamId: integer("teamId"),
  addUser: integer("addUser"),
  deleted: boolean("deleted").default(false),
});

const usersChats = table("userschats", {
  id: serial("id").primaryKey(),
  userSender: integer("userSender"),
  userReceiver: integer("userReceiver"),
  sentAt: timestamp("sentAt").defaultNow(),
  message: varchar("message", { length: 1020 }),
  isFile: boolean("isFile"),
  fileId: integer("fileId"),
  deleted: boolean("deleted").default(false),
});

const usersLinks = table("userslinks", {
  id: serial("id").primaryKey(),
  userId1: integer("userId1"),
  userId2: integer("userId2"),
  blocked: boolean("blocked").default(false),
  deleted: boolean("deleted").default(false),
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