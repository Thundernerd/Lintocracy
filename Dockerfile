# syntax=docker/dockerfile:1

FROM --platform=linux/amd64 node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm install --no-save @libsql/linux-x64-gnu \
  && npm run build \
  && mkdir -p .output/server/node_modules/@libsql \
  && cp -r node_modules/@libsql/linux-x64-gnu .output/server/node_modules/@libsql/

FROM --platform=linux/amd64 node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nuxtjs \
  && mkdir -p /data \
  && chown nuxtjs:nodejs /data

COPY --from=build --chown=nuxtjs:nodejs /app/.output ./.output

USER nuxtjs

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
