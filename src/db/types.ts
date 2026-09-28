import type { PgDatabase } from "drizzle-orm/pg-core";

/**
 * A database executor that works for both the top-level connection and a
 * transaction handle, across the node-postgres (production) and PGlite (test)
 * drivers. The underlying query-result HKT differs between drivers, so the
 * generics are intentionally left broad here. This is the one deliberate use of
 * `any` in the codebase: bridging two Drizzle driver types is not otherwise
 * expressible without duplicating every domain function per driver.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type DbExecutor = PgDatabase<any, any, any>;
