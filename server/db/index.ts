import { createClient, type Client } from '@libsql/client'
import { drizzle, type LibSQLDatabase } from 'drizzle-orm/libsql'
import * as schema from './schema'
import { migrateLegacyDatabaseFile } from './legacyFile'

let _db: LibSQLDatabase<typeof schema> | undefined
let _client: Client | undefined

function client() {
  if (!_client) {
    const config = useRuntimeConfig()
    _client = createClient({
      url: config.databaseUrl as string,
    })
  }
  return _client
}

export function useDb() {
  if (!_db) {
    _db = drizzle(client(), { schema })
  }
  return _db
}

/**
 * Creates the schema if it does not exist. Keeps local/dev setup zero-config;
 * for production with a managed DB this can be replaced by drizzle-kit migrations.
 */
export async function ensureSchema() {
  const url = useRuntimeConfig().databaseUrl as string
  if (url.startsWith('file:')) {
    const { mkdir } = await import('node:fs/promises')
    const { dirname } = await import('node:path')
    const path = url.slice('file:'.length)
    await mkdir(dirname(path), { recursive: true }).catch(() => {})
    await migrateLegacyDatabaseFile(path)
  }

  await client().execute(`
    CREATE TABLE IF NOT EXISTS groups (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL,
      invite_token TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `)
  await client().execute(
    'CREATE UNIQUE INDEX IF NOT EXISTS groups_invite_token_idx ON groups (invite_token)',
  )

  await client().execute(`
    CREATE TABLE IF NOT EXISTS members (
      id TEXT PRIMARY KEY,
      group_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at INTEGER NOT NULL
    )
  `)
  await client().execute('CREATE INDEX IF NOT EXISTS members_group_idx ON members (group_id)')

  await client().execute(`
    CREATE TABLE IF NOT EXISTS votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id TEXT NOT NULL,
      rule_id TEXT NOT NULL,
      voter_id TEXT NOT NULL,
      vote TEXT NOT NULL,
      severity TEXT,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)
  await client().execute(
    'CREATE UNIQUE INDEX IF NOT EXISTS votes_group_rule_voter_idx ON votes (group_id, rule_id, voter_id)',
  )

  await client().execute(`
    CREATE TABLE IF NOT EXISTS option_votes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      group_id TEXT NOT NULL,
      rule_id TEXT NOT NULL,
      option_name TEXT NOT NULL,
      voter_id TEXT NOT NULL,
      value TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      updated_at INTEGER NOT NULL
    )
  `)
  await client().execute(
    'CREATE UNIQUE INDEX IF NOT EXISTS option_votes_group_rule_option_voter_idx ON option_votes (group_id, rule_id, option_name, voter_id)',
  )
}
