// Provides the minimum environment for modules that read AUTH_SECRET etc.
process.env.AUTH_SECRET ??= "test-secret-test-secret-1234567890";
process.env.DATABASE_URL ??= "postgres://localhost:5432/test";
process.env.APP_URL ??= "http://localhost:3000";
