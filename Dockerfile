# Production image for self-hosting via Docker (e.g. a VPS behind Caddy/Nginx).
# Vercel deployments ignore this file entirely and use their own build pipeline.
#
# Uses a glibc-based image (not Alpine/musl): @node-rs/argon2 ships prebuilt
# native binaries for glibc Linux, avoiding the musl/WASM fallback path.
#
# Single-stage on purpose: keeps devDependencies (tsx, drizzle-kit) available
# inside the running container so `npm run db:migrate` can be executed with
# `docker compose exec app npm run db:migrate` without a separate build stage.
FROM node:20-slim

WORKDIR /app

# Install dependencies first for better layer caching.
COPY package.json package-lock.json ./
RUN npm ci

# Copy the rest of the source and build.
COPY . .
RUN npm run build

ENV NODE_ENV=production
ENV PORT=3000
EXPOSE 3000

CMD ["npm", "run", "start"]
