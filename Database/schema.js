const {
  serial,
  varchar,
  tinyint,
  mysqlTable,
  int,
  varbinary,
  datetime,
  timestamp,
} = require("drizzle-orm/mysql-core");

const users = mysqlTable("users", {
  id: serial("id").primaryKey(),
  email: varchar("email", {length: 255}),
  username: varchar("username", {length: 255}),
  password: varchar("password", {length: 255}),
  userCallLink: varchar("userCallLink", {length: 1020}),
  profileURL: varchar("profileURL", {length: 765}),
  deleted: tinyint("deleted"),
});

const files = mysqlTable("files", {
  id: serial("id").primaryKey(),
  uid: varchar("uid", {length: 255}),
  name: varchar("name", {length: 255}),
  ownerID: int("ownerID"),
  data: varbinary("data"),
  deleted: tinyint("deleted"),
});

const requests = mysqlTable("requests", {
  id: serial("id").primaryKey(),
  uid: varchar("uid", {length: 255}),
  timeCreated: timestamp("timeCreated").defaultNow(),
  senderID: int("senderID"),
  receiverID: int("receiverID"),
  data: varchar("data", {length: 765}),
  operation: varchar("operation", {length: 255}),
  status: varchar("status", {length: 255}),
  deleted: tinyint("deleted"),
  timeResolved: timestamp("timeResolved"),
});

const teams = mysqlTable("teams", {
  id: serial("id").primaryKey(),
  uid: varchar("uid", {length: 255}),
  name: varchar("name", {length: 255}),
  ownerID: int("ownerID"),
  name: varchar("name", {length: 255}),
  teamCallLink: varchar("teamCallLink", {length: 1020}),
  deleted: tinyint("deleted"),
});

const teamsChats = mysqlTable("teamschats", {
  id: serial("id").primaryKey(),
  uid: varchar("uid", {length: 255}),
  ownerID: int("ownerID"),
  name: varchar("name", {length: 255}),
  teamCallLink: varchar("teamCallLink", {length: 1020}),
  deleted: tinyint("deleted"),
});

const teamsLinks = mysqlTable("teamslinks", {
  id: serial("id").primaryKey(),
  teamID: int("teamID"),
  addUser: int("addUser"),
  deleted: tinyint("deleted"),
});

const usersChats = mysqlTable("userschats", {
  id: serial("id").primaryKey(),
  userSender: int("userSender"),
  userReceiver: int("userReceiver"),
  sentAt: datetime("sentAt").defaultNow(),
  message: varchar("message", {length: 1020}),
  isFile: tinyint("isFile"),
  fileID: int("fileID"),
  deleted: tinyint("deleted"),
});

const usersLinks = mysqlTable("userslinks", {
  id: serial("id").primaryKey(),
  userID1: int("userID1"),
  userID2: int("userID2"),
  blocked: tinyint("blocked"),
  deleted: tinyint("deleted"),
});

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
