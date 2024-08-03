// const {
//   serial,
//   varchar,
//   boolean,
//   integer,
//   blob,
//   timestamp,
//   tableCreator,
//   table: core_table,
// } = getCore();

const {
  serial,
  varchar,
  boolean,
  int: integer,
  timestamp,
  mysqlTableCreator: tableCreator,
  mysqlTable: core_table,
} = require("drizzle-orm/mysql-core");

const table =
  process.env.VERCEL_ENV === "production"
    ? tableCreator((name) => `harmony_${name}`)
    : core_table;

const users = table("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", { length: 255 }),
  username: varchar("username", { length: 255 }),
  password: varchar("password", { length: 255 }),
  userCallLink: varchar("userCallLink", { length: 1020 }),
  profileUrl: varchar("profileURL", { length: 765 }).default(""),
  deleted: boolean("deleted").default(false),
});

const files = table("files", {
  id: serial("id").primaryKey(),
  uid: varchar("uid", { length: 255 }),
  name: varchar("name", { length: 255 }),
  ownerId: integer("ownerID"),
  deleted: boolean("deleted").default(false),
});

const requests = table("requests", {
  id: serial("id").primaryKey(),
  uid: varchar("uid", { length: 255 }),
  timeCreated: timestamp("timeCreated").defaultNow(),
  senderId: integer("senderID"),
  receiverId: integer("receiverID"),
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
  ownerId: integer("ownerID"),
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
  fileId: integer("fileID"),
  edited: boolean("edited").default(false),
  deleted: boolean("deleted").default(false),
});

const teamsLinks = table("teamslinks", {
  id: serial("id").primaryKey(),
  teamId: integer("teamID"),
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
  fileId: integer("fileID"),
  deleted: boolean("deleted").default(false),
});

const usersLinks = table("userslinks", {
  id: serial("id").primaryKey(),
  userId1: integer("userID1"),
  userId2: integer("userID2"),
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

function getCore() {
  if (process.env.VERCEL_ENV === "production") {
    return postgresCore();
  } else {
    return mysqlCore();
  }
  function mysqlCore() {
    const mysql = require("drizzle-orm/mysql-core");
    const customBlob = mysql.customType({
      dataType() {
        return "blob";
      },
    });
    return {
      serial: mysql.serial,
      varchar: mysql.varchar,
      boolean: mysql.boolean,
      integer: mysql.int,
      blob: customBlob,
      timestamp: mysql.timestamp,
      tableCreator: mysql.mysqlTableCreator,
      table: mysql.mysqlTable,
    };
  }
  function postgresCore() {
    const postgres = require("drizzle-orm/pg-core");
    const customBytea = postgres.customType({
      dataType() {
        return "bytea";
      },
    });
    return {
      serial: postgres.serial,
      varchar: postgres.varchar,
      boolean: postgres.boolean,
      integer: postgres.integer,
      blob: customBytea,
      timestamp: postgres.timestamp,
      tableCreator: postgres.pgTableCreator,
      table: postgres.pgTable,
    };
  }
}
