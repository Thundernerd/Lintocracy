# syntax=docker/dockerfile:1
# check=skip=FromPlatformFlagConstDisallowed
# The image pins linux/amd64 on purpose: it ships an x64-only native libsql binding.

FROM --platform=linux/amd64 node:22-bookworm-slim AS build

WORKDIR /app

# Keep devDependencies available for the Nuxt production build.
ENV NODE_ENV=development

COPY package.json package-lock.json ./
RUN npm ci --include=optional

COPY . .
RUN npm install --no-save @libsql/linux-x64-gnu@0.5.29
RUN npm run build

RUN set -eux \
  && BINDING="$(find node_modules -path '*/@libsql/linux-x64-gnu' -type d | head -1)" \
  && test -n "$BINDING" \
  && mkdir -p .output/server/node_modules/@libsql \
  && cp -r "$BINDING" .output/server/node_modules/@libsql/linux-x64-gnu

FROM --platform=linux/amd64 node:22-bookworm-slim AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV HOST=0.0.0.0
ENV PORT=3000

RUN groupadd --system --gid 1001 nodejs \
  && useradd --system --uid 1001 --gid nodejs nuxtjs \
  && mkdir -p /app/.data \
  && chown nuxtjs:nodejs /app/.data

COPY --from=build --chown=nuxtjs:nodejs /app/.output ./.output

USER nuxtjs

EXPOSE 3000

CMD ["node", ".output/server/index.mjs"]
