# syntax=docker/dockerfile:1.7

# ─────────────────────────── deps ───────────────────────────
FROM node:22-bookworm-slim AS deps
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund

# ─────────────────────────── builder ───────────────────────────
FROM node:22-bookworm-slim AS builder
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends python3 make g++ ca-certificates \
    && rm -rf /var/lib/apt/lists/*

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Firebase configuration — kept temporarily during VPS migration Phase 2.
# These are NEXT_PUBLIC values (already exposed in client bundle) and exist
# only so that build-time Firebase SDK initialization compiles. Phase 3
# (auth port to Lucia) strips both these args and the Firebase code paths.
ARG NEXT_PUBLIC_FIREBASE_API_KEY="REDACTED_ROTATED_GOOGLE_KEY"
ARG NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN="hustleapp-production.firebaseapp.com"
ARG NEXT_PUBLIC_FIREBASE_PROJECT_ID="hustleapp-production"
ARG NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET="hustleapp-production.firebasestorage.app"
ARG NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID="335713777643"
ARG NEXT_PUBLIC_FIREBASE_APP_ID="1:335713777643:web:209e728afd5aee07c80bae"

ENV NEXT_PUBLIC_FIREBASE_API_KEY=$NEXT_PUBLIC_FIREBASE_API_KEY
ENV NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=$NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN
ENV NEXT_PUBLIC_FIREBASE_PROJECT_ID=$NEXT_PUBLIC_FIREBASE_PROJECT_ID
ENV NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=$NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET
ENV NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=$NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID
ENV NEXT_PUBLIC_FIREBASE_APP_ID=$NEXT_PUBLIC_FIREBASE_APP_ID

ENV NEXT_TELEMETRY_DISABLED=1
# Next imports database modules in parallel while collecting page data.
# Build workers use independent disposable databases; the runner below keeps
# DATABASE_PATH=/data/hustle.db for persistent application data.
RUN DATABASE_PATH=:memory: npm run build

# ─────────────────────────── runner ───────────────────────────
FROM node:22-bookworm-slim AS runner
WORKDIR /app

RUN apt-get update \
    && apt-get install -y --no-install-recommends ca-certificates curl \
    && rm -rf /var/lib/apt/lists/* \
    && groupadd --system --gid 1001 nodejs \
    && useradd --system --uid 1001 --gid nodejs nextjs

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=8084
ENV HOSTNAME=0.0.0.0

COPY --from=builder /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
# Drizzle migrations are read at boot by src/lib/db/index.ts; ship them in
# the runtime image so the migration runner can find them at /app/drizzle.
COPY --from=builder --chown=nextjs:nodejs /app/drizzle ./drizzle

ENV DATABASE_PATH=/data/hustle.db
RUN mkdir -p /data /data/uploads && chown -R nextjs:nodejs /data
VOLUME ["/data"]

USER nextjs
EXPOSE 8084

CMD ["node", "server.js"]
