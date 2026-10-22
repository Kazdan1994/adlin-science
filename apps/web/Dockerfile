# Build context is the repository root: docker compose build -f apps/web/Dockerfile .
FROM node:24-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY packages/shared/package.json packages/shared/
COPY apps/api/package.json apps/api/
COPY apps/web/package.json apps/web/
COPY e2e/package.json e2e/
# The web postinstall (`nuxt prepare`) needs the sources, so scripts run during the build instead.
RUN npm ci -w @adlin/web --ignore-scripts
COPY tsconfig.base.json ./
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
ARG NUXT_PUBLIC_API_BASE=http://localhost:4000/api
ENV NUXT_PUBLIC_API_BASE=$NUXT_PUBLIC_API_BASE
RUN npm run build -w @adlin/web

FROM node:24-alpine
WORKDIR /app
ENV NODE_ENV=production \
    PORT=3000 \
    NUXT_PUBLIC_API_BASE=http://localhost:4000/api
COPY --from=build /app/apps/web/.output ./.output
USER node
EXPOSE 3000
CMD ["node", ".output/server/index.mjs"]
