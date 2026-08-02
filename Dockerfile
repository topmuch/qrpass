# QRPass - Dockerfile for Coolify
FROM node:20-alpine

# Install required packages
RUN apk add --no-cache git libc6-compat sqlite
RUN npm install -g bun

WORKDIR /app

# Clone the repository, verify package.json exists, and install dependencies in one step
# This ensures Docker cannot cache a broken git clone layer
RUN git clone --depth 1 https://github.com/topmuch/qrpass.git . && \
    echo "=== Clone successful ===" && \
    ls -la package.json && \
    echo "=== Installing dependencies ===" && \
    bun install

# Generate Prisma Client
RUN npx prisma generate

# Build the application
ENV NEXT_TELEMETRY_DISABLED=1
ENV DATABASE_URL=file:/app/data/qrpass.db
ENV NODE_OPTIONS="--max-old-space-size=4096"
RUN bun run build

# Create data directory
RUN mkdir -p /app/data

EXPOSE 3000

ENV PORT=3000
ENV HOSTNAME="0.0.0.0"
ENV DATABASE_URL=file:/app/data/qrpass.db

# Start command - create admin and start server
CMD ["sh", "-c", "mkdir -p /app/data && export DATABASE_URL=file:/app/data/qrpass.db && npx prisma db push --skip-generate 2>/dev/null || true && node scripts/create-admin.cjs 2>/dev/null || true && exec node .next/standalone/server.js"]
