# Build context is the repository root: docker compose build -f apps/api/Dockerfile .
FROM node:24-alpine AS deps
WORKDIR /app
# Every workspace manifest must be present for `npm ci` to match the lockfile.
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY e2e/package.json e2e/
RUN npm ci -w @adlin/api --omit=dev --ignore-scripts

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production \
    ROOMS_FILE=/app/salles.json
COPY --from=deps /app/node_modules ./node_modules
COPY package.json ./
# @adlin/shared ships TypeScript source, so the API runs through tsx.
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
COPY salles.json ./
USER node
EXPOSE 4000
CMD ["node_modules/.bin/tsx", "apps/api/src/server.ts"]
