import { config } from "dotenv";
import { defineConfig } from "drizzle-kit";

config();

const variableConfig =
  process.env.VERCEL_ENV === "production"
    ? {
        dialect: "postgresql",
        dbCredentials: {
          url: process.env.POSTGRES_URL,
        },
      }
    : {
        dialect: "mysql",
        dbCredentials: {
          host: process.env.DB_HOST,
          user: process.env.DB_USER,
          password: process.env.DB_PASSWORD,
          database: process.env.DB_NAME,
        },
      };

export default defineConfig({
  schema: "./Database/schema.js",
  out: "./migrations",
  ...variableConfig,
});
