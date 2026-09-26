# QRPass - Dockerfile for Coolify
FROM node:20-alpine

# Install required packages
RUN apk add --no-cache git libc6-compat sqlite curl
RUN npm install -g bun

WORKDIR /app

# Download source from GitHub as tarball (NOT git clone - avoids Docker cache issues)
# Using main branch tarball - this always fetches fresh content
RUN curl -sL https://github.com/topmuch/qrpass/archive/refs/heads/main.tar.gz | tar xz --strip-components=1 && \
    echo "=== Download successful ===" && \
    ls -la package.json && \
    echo "=== Installing dependencies ===" && \
    bun install

# Generate Prisma Client
RUN npx prisma generate

# Crée le dossier data AVANT le build : DATABASE_URL=file:/app/data/qrpass.db
# doit pointer vers un chemin ouvrable pendant la génération statique
RUN mkdir -p /app/data

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/app/data/qrpass.db
# 2048 Mo par process : si un dépassement arrive, V8 affiche une erreur
# lisible au lieu d'un SIGKILL silencieux par l'OOM killer
ENV NODE_OPTIONS="--max-old-space-size=2048"
RUN bun run build

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL=file:/app/data/qrpass.db

# Start command - create admin and start server
CMD ["sh", "-c", "mkdir -p /app/data && export DATABASE_URL=file:/app/data/qrpass.db && npx prisma db push --skip-generate 2>/dev/null || true && node scripts/create-admin.cjs 2>/dev/null || true && exec node .next/standalone/server.js"]
