# syntax=docker/dockerfile:1

FROM node:22-alpine AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build \
  && mkdir -p .output/server/node_modules/@libsql \
  && if [ -d node_modules/@libsql/linux-x64-musl ]; then \
       cp -r node_modules/@libsql/linux-x64-musl .output/server/node_modules/@libsql/; \
     elif [ -d node_modules/@libsql/linux-x64-gnu ]; then \
       cp -r node_modules/@libsql/linux-x64-gnu .output/server/node_modules/@libsql/; \
     else \
       echo "No libsql linux-x64 native binding found in node_modules" >&2; exit 1; \
     fi

FROM node:22-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs \
  && adduser --system --uid 1001 --ingroup nodejs nuxtjs \
  && mkdir -p /data \
  && chown nuxtjs:nodejs /data

COPY --from=build --chown=nuxtjs:nodejs /app/.output ./.output

USER nuxtjs

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
