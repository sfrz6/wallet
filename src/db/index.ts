import { drizzle, type NodePgDatabase } from "drizzle-orm/node-postgres";
import { Pool } from "pg";
import * as schema from "./schema";
import { getEnv } from "@/lib/env";

// A single pooled connection reused across serverless invocations. For Neon,
// use the pooled connection string. `max` is kept small to stay within
// serverless connection limits.
let pool: Pool | undefined;
let dbInstance: NodePgDatabase<typeof schema> | undefined;

function getPool(): Pool {
  const url = getEnv().DATABASE_URL;
  if (!url) throw new Error("DATABASE_URL is not configured.");
  if (!pool) {
    pool = new Pool({ connectionString: url, max: 5, idleTimeoutMillis: 30_000 });
  }
  return pool;
}

export function getDb(): NodePgDatabase<typeof schema> {
  if (!dbInstance) {
    dbInstance = drizzle(getPool(), { schema });
  }
  return dbInstance;
}

export { schema };
