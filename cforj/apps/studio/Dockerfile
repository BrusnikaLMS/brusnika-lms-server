FROM node:20-alpine AS builder

RUN corepack enable && corepack prepare pnpm@8.15.0 --activate

WORKDIR /repo

# Copy workspace manifests + lockfile first for layer caching
COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY packages/player/package.json ./packages/player/
COPY packages/scorm-export/package.json ./packages/scorm-export/
COPY packages/editor/package.json ./packages/editor/
COPY apps/studio/package.json ./apps/studio/

RUN pnpm install --frozen-lockfile

# Copy source
COPY packages/ ./packages/
COPY apps/studio/ ./apps/studio/
COPY tsconfig.base.json ./

ARG VITE_API_URL=/api
ENV VITE_API_URL=$VITE_API_URL

# Build
WORKDIR /repo
RUN pnpm --filter @course-studio/studio build

# ── Serve with nginx ──────────────────────────────────────────────
FROM nginx:alpine

COPY --from=builder /repo/apps/studio/dist /usr/share/nginx/html
COPY --from=builder /repo/apps/studio/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80
