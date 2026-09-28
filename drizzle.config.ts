import { defineConfig } from "drizzle-kit";

// drizzle-kit reads DATABASE_URL for generate/migrate/studio against a real
// Postgres. For local test runs we use PGlite (see src/db/test-db.ts) and do
// not depend on this config.
export default defineConfig({
  schema: "./src/db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  dbCredentials: {
    url: process.env.DATABASE_URL ?? "postgres://localhost:5432/mahfazati",
  },
  strict: true,
  verbose: true,
});
