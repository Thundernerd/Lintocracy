import { defineConfig } from 'drizzle-kit'
import { DATABASE_URL } from './shared/constants/database'

// Used for generating/applying migrations. Local/dev creates the schema on startup.
export default defineConfig({
  dialect: 'turso',
  schema: './server/db/schema.ts',
  out: './server/db/migrations',
  dbCredentials: {
    url: DATABASE_URL,
  },
})
