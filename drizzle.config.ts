import { defineConfig } from 'drizzle-kit'

// Used for generating/applying migrations against a managed DB in production.
// Local/dev creates the schema automatically on startup (see server/db/index.ts).
export default defineConfig({
  dialect: 'turso',
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dbCredentials: {
    url: process.env.DATABASE_URL || 'file:.data/rule-wars.db',
    authToken: process.env.DATABASE_AUTH_TOKEN,
  },
})
