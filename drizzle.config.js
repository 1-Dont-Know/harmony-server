import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config();

if (!process.env.POSTGRES_URL) {
  throw "POSTGRES_URL environment variable not set";
}

export default defineConfig({
  schema: "./Database/schema.js",
  out: "./migrations",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.POSTGRES_URL,
  },
});
