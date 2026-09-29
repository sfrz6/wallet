import { z } from "zod";

/**
 * Runtime environment validation. Called lazily the first time a value is
 * needed so that `next build` (which imports modules without a live database)
 * does not fail, while a running server fails fast on missing configuration.
 */
const serverEnvSchema = z.object({
  DATABASE_URL: z.string().min(1, "DATABASE_URL is required"),
  AUTH_SECRET: z.string().min(16, "AUTH_SECRET must be at least 16 characters"),
  APP_URL: z.string().url().default("http://localhost:3000"),
  RESEND_API_KEY: z.string().optional(),
  EMAIL_FROM: z.string().optional(),
  DEV_EMAIL_FALLBACK: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  // Email verification is OFF by default for now (V1). Set to "true" in V2 to
  // require users to verify their email before accessing the app.
  REQUIRE_EMAIL_VERIFICATION: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true"),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

let cached: ServerEnv | null = null;

export function getEnv(): ServerEnv {
  if (cached) return cached;
  const parsed = serverEnvSchema.safeParse(process.env);
  if (!parsed.success) {
    const issues = parsed.error.issues.map((i) => `${i.path.join(".")}: ${i.message}`).join("; ");
    throw new Error(`Invalid environment configuration: ${issues}`);
  }
  // Guard: the developer email fallback must never be enabled in production.
  if (parsed.data.NODE_ENV === "production" && parsed.data.DEV_EMAIL_FALLBACK) {
    throw new Error("DEV_EMAIL_FALLBACK must not be enabled in production.");
  }
  cached = parsed.data;
  return cached;
}

export function isProduction(): boolean {
  return (process.env.NODE_ENV ?? "development") === "production";
}

/** Whether users must verify their email before using the app. Off in V1. */
export function emailVerificationEnabled(): boolean {
  return getEnv().REQUIRE_EMAIL_VERIFICATION === true;
}
